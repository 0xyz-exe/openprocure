from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import PurchaseOrder, PurchaseOrderItem, Supplier, User, Requisition, Quotation
from app.schemas.schemas import PurchaseOrderCreate
from app.services.numbering import next_po_number
from app.services.audit import log_audit, create_notification

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])

@router.get("", response_model=List[dict])
def list_purchase_orders(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PurchaseOrder).filter(PurchaseOrder.organization_id == current_user.organization_id)
    if status and status != "ALL":
        query = query.filter(PurchaseOrder.status == status)

    orders = query.order_by(PurchaseOrder.created_at.desc()).all()
    results = []
    for po in orders:
        total_items = len(po.items)
        fulfilled_items = sum(1 for it in po.items if it.received_quantity >= it.quantity)
        results.append({
            "id": po.id,
            "po_number": po.po_number,
            "supplier_id": po.supplier_id,
            "supplier_name": po.supplier.name if po.supplier else "Unknown",
            "order_date": po.order_date,
            "expected_delivery_date": po.expected_delivery_date,
            "total_amount": po.total_amount,
            "currency": po.currency,
            "status": po.status,
            "items_count": total_items,
            "fulfillment": f"{fulfilled_items}/{total_items}" if total_items > 0 else "0/0",
            "payment_terms": po.payment_terms
        })
    return results

@router.post("", response_model=dict)
def create_purchase_order(
    req: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supplier = db.query(Supplier).filter(
        Supplier.id == req.supplier_id,
        Supplier.organization_id == current_user.organization_id
    ).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    if not req.items:
        raise HTTPException(status_code=400, detail="Purchase order must contain at least one line item.")

    po_num = next_po_number(db)
    calc_subtotal = 0.0
    items_to_add = []
    for it in req.items:
        line_total = round(it.quantity * it.unit_price, 2)
        calc_subtotal += line_total
        items_to_add.append(
            PurchaseOrderItem(
                description=it.description,
                quantity=it.quantity,
                unit_price=it.unit_price,
                total_price=line_total,
                received_quantity=0.0
            )
        )

    tax = round(calc_subtotal * 0.08, 2) # 8% standard tax
    total = round(calc_subtotal + tax, 2)

    po = PurchaseOrder(
        organization_id=current_user.organization_id,
        po_number=po_num,
        supplier_id=supplier.id,
        requisition_id=req.requisition_id,
        quotation_id=req.quotation_id,
        expected_delivery_date=req.expected_delivery_date,
        subtotal=calc_subtotal,
        tax_amount=tax,
        total_amount=total,
        currency=supplier.currency or "USD",
        payment_terms=req.payment_terms,
        delivery_address=req.delivery_address,
        status="ISSUED", # Automatically issued to vendor upon PO generation
        items=items_to_add
    )
    db.add(po)

    # If linked to requisition, update requisition status
    if req.requisition_id:
        req_obj = db.query(Requisition).filter(Requisition.id == req.requisition_id).first()
        if req_obj:
            req_obj.status = "CONVERTED_TO_PO"

    db.commit()
    db.refresh(po)

    log_audit(
        db, current_user.organization_id, "CREATE", "PurchaseOrder",
        po.id, current_user.id, current_user.full_name,
        f"Generated PO {po.po_number} to {supplier.name} for ${po.total_amount:.2f}"
    )
    create_notification(
        db, current_user.organization_id,
        "Purchase Order Issued",
        f"PO {po.po_number} issued to {supplier.name} for ${po.total_amount:.2f}",
        link=f"/purchase-orders"
    )
    db.commit()

    return {
        "id": po.id,
        "po_number": po.po_number,
        "supplier_name": supplier.name,
        "total_amount": po.total_amount,
        "status": po.status
    }

@router.get("/{id}", response_model=dict)
def get_purchase_order(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    po = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == id,
        PurchaseOrder.organization_id == current_user.organization_id
    ).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")

    items_data = []
    for it in po.items:
        items_data.append({
            "id": it.id,
            "description": it.description,
            "quantity": it.quantity,
            "unit_price": it.unit_price,
            "total_price": it.total_price,
            "received_quantity": it.received_quantity
        })

    receipts_data = []
    for gr in po.goods_receipts:
        receipts_data.append({
            "id": gr.id,
            "receipt_number": gr.receipt_number,
            "receipt_date": gr.receipt_date,
            "status": gr.status,
            "received_by": gr.received_by
        })

    return {
        "id": po.id,
        "po_number": po.po_number,
        "supplier_id": po.supplier_id,
        "supplier_name": po.supplier.name if po.supplier else "Unknown",
        "supplier_email": po.supplier.email if po.supplier else "",
        "order_date": po.order_date,
        "expected_delivery_date": po.expected_delivery_date,
        "subtotal": po.subtotal,
        "tax_amount": po.tax_amount,
        "total_amount": po.total_amount,
        "currency": po.currency,
        "payment_terms": po.payment_terms,
        "delivery_address": po.delivery_address,
        "status": po.status,
        "items": items_data,
        "goods_receipts": receipts_data
    }
