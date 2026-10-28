from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Invoice, InvoiceItem, PurchaseOrder, Supplier, User, Budget
from app.schemas.schemas import InvoiceCreate, MatchResolution
from app.services.matching import perform_three_way_match
from app.services.audit import log_audit, create_notification

router = APIRouter(prefix="/invoices", tags=["Invoices & 3-Way Matching"])

@router.get("", response_model=List[dict])
def list_invoices(
    match_status: Optional[str] = None,
    payment_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Invoice).filter(Invoice.organization_id == current_user.organization_id)
    if match_status and match_status != "ALL":
        query = query.filter(Invoice.match_status == match_status)
    if payment_status and payment_status != "ALL":
        query = query.filter(Invoice.payment_status == payment_status)

    invoices = query.order_by(Invoice.created_at.desc()).all()
    results = []
    for inv in invoices:
        results.append({
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "po_id": inv.purchase_order_id,
            "po_number": inv.purchase_order.po_number if inv.purchase_order else "N/A",
            "supplier_name": inv.supplier_name,
            "invoice_date": inv.invoice_date,
            "due_date": inv.due_date,
            "total_amount": inv.total_amount,
            "currency": inv.currency,
            "match_status": inv.match_status,
            "payment_status": inv.payment_status,
            "exception_reason": inv.exception_reason
        })
    return results

@router.post("", response_model=dict)
def create_invoice(
    req: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    po = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == req.purchase_order_id,
        PurchaseOrder.organization_id == current_user.organization_id
    ).first()
    if not po:
        raise HTTPException(status_code=404, detail="Referenced Purchase Order not found")

    supplier = db.query(Supplier).filter(Supplier.id == req.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    subtotal = 0.0
    items_to_add = []
    for it in req.items:
        t = round(it.quantity * it.unit_price, 2)
        subtotal += t
        items_to_add.append(
            InvoiceItem(
                po_item_id=it.po_item_id,
                description=it.description,
                quantity=it.quantity,
                unit_price=it.unit_price,
                total_price=t
            )
        )

    total = round(subtotal + req.tax_amount, 2)

    invoice = Invoice(
        organization_id=current_user.organization_id,
        purchase_order_id=po.id,
        supplier_id=supplier.id,
        supplier_name=supplier.name,
        invoice_number=req.invoice_number,
        due_date=req.due_date,
        subtotal=subtotal,
        tax_amount=req.tax_amount,
        total_amount=total,
        currency=po.currency,
        match_status="PENDING",
        payment_status="UNPAID",
        notes=req.notes,
        items=items_to_add
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    # Immediately perform 3-way matching engine check
    m_status, reason = perform_three_way_match(db, invoice)
    invoice.match_status = m_status
    invoice.exception_reason = reason
    db.commit()

    log_audit(
        db, current_user.organization_id, "CREATE_INVOICE", "Invoice",
        invoice.id, current_user.id, current_user.full_name,
        f"Recorded invoice {invoice.invoice_number} from {supplier.name} (${invoice.total_amount:.2f}). 3-Way Match: {m_status}"
    )
    if m_status == "EXCEPTION":
        create_notification(
            db, current_user.organization_id,
            "Invoice 3-Way Match Exception",
            f"Invoice {invoice.invoice_number} has mismatch exceptions: {reason[:120]}...",
            link="/invoices"
        )
    db.commit()

    return {
        "id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "total_amount": invoice.total_amount,
        "match_status": invoice.match_status,
        "exception_reason": invoice.exception_reason
    }

@router.post("/{id}/match", response_model=dict)
def recheck_match(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == id,
        Invoice.organization_id == current_user.organization_id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    m_status, reason = perform_three_way_match(db, invoice)
    invoice.match_status = m_status
    invoice.exception_reason = reason
    db.commit()

    return {
        "id": invoice.id,
        "match_status": invoice.match_status,
        "exception_reason": invoice.exception_reason
    }

@router.post("/{id}/resolve", response_model=dict)
def resolve_invoice_exception(
    id: str,
    res: MatchResolution,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == id,
        Invoice.organization_id == current_user.organization_id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if res.action == "RESOLVE":
        invoice.match_status = "RESOLVED"
        invoice.exception_reason = f"Manually resolved by {current_user.full_name}: {res.reason}"
    else:
        invoice.match_status = "EXCEPTION"
        invoice.payment_status = "REJECTED"
        invoice.exception_reason = f"Rejected by {current_user.full_name}: {res.reason}"

    log_audit(
        db, current_user.organization_id, "RESOLVE_EXCEPTION", "Invoice",
        invoice.id, current_user.id, current_user.full_name,
        f"Resolution for {invoice.invoice_number}: {res.action} - {res.reason}"
    )
    db.commit()

    return {
        "id": invoice.id,
        "match_status": invoice.match_status,
        "payment_status": invoice.payment_status,
        "exception_reason": invoice.exception_reason
    }

@router.post("/{id}/pay", response_model=dict)
def approve_and_pay_invoice(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == id,
        Invoice.organization_id == current_user.organization_id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.match_status not in ["MATCHED", "RESOLVED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot pay invoice with match status '{invoice.match_status}'. Must be MATCHED or RESOLVED."
        )

    invoice.payment_status = "PAID"

    # Update Budget Actual Spend
    if invoice.purchase_order and invoice.purchase_order.requisition_id:
        req = db.query(PurchaseOrder).filter(PurchaseOrder.id == invoice.purchase_order_id).first()
        budget = db.query(Budget).filter(Budget.organization_id == current_user.organization_id).first()
        if budget:
            budget.actual_spent = round(budget.actual_spent + invoice.total_amount, 2)
            # release committed
            budget.committed_amount = max(0.0, round(budget.committed_amount - invoice.total_amount, 2))

    log_audit(
        db, current_user.organization_id, "PAYMENT", "Invoice",
        invoice.id, current_user.id, current_user.full_name,
        f"Approved and marked paid invoice {invoice.invoice_number} (${invoice.total_amount:.2f})"
    )
    db.commit()

    return {
        "id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "payment_status": invoice.payment_status
    }
