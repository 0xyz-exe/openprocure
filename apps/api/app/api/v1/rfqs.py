from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import RFQ, Quotation, QuotationItem, Supplier, User, Requisition
from app.schemas.schemas import RFQCreate, QuotationCreate
from app.services.numbering import next_rfq_number
from app.services.audit import log_audit, create_notification

router = APIRouter(prefix="/rfqs", tags=["Request For Quotation (RFQ)"])

@router.get("", response_model=List[dict])
def list_rfqs(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(RFQ).filter(RFQ.organization_id == current_user.organization_id)
    if status and status != "ALL":
        query = query.filter(RFQ.status == status)
    
    rfqs = query.order_by(RFQ.created_at.desc()).all()
    results = []
    for rfq in rfqs:
        results.append({
            "id": rfq.id,
            "rfq_number": rfq.rfq_number,
            "title": rfq.title,
            "description": rfq.description,
            "submission_deadline": rfq.submission_deadline,
            "status": rfq.status,
            "created_at": rfq.created_at,
            "quotations_count": len(rfq.quotations)
        })
    return results

@router.post("", response_model=dict)
def create_rfq(
    req: RFQCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rfq_num = next_rfq_number(db)
    rfq = RFQ(
        organization_id=current_user.organization_id,
        rfq_number=rfq_num,
        requisition_id=req.requisition_id,
        title=req.title,
        description=req.description,
        submission_deadline=req.submission_deadline,
        status="PUBLISHED"
    )
    db.add(rfq)
    db.commit()
    db.refresh(rfq)

    log_audit(
        db, current_user.organization_id, "CREATE", "RFQ",
        rfq.id, current_user.id, current_user.full_name,
        f"Issued RFQ {rfq.rfq_number}: {rfq.title}"
    )
    db.commit()

    return {
        "id": rfq.id,
        "rfq_number": rfq.rfq_number,
        "title": rfq.title,
        "description": rfq.description,
        "status": rfq.status,
        "created_at": rfq.created_at
    }

@router.get("/{id}", response_model=dict)
def get_rfq(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rfq = db.query(RFQ).filter(
        RFQ.id == id,
        RFQ.organization_id == current_user.organization_id
    ).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")

    quotes_data = []
    for q in rfq.quotations:
        quotes_data.append({
            "id": q.id,
            "quotation_number": q.quotation_number,
            "supplier_id": q.supplier_id,
            "supplier_name": q.supplier.name if q.supplier else "Unknown",
            "total_amount": q.total_amount,
            "currency": q.currency,
            "lead_time_days": q.lead_time_days,
            "status": q.status,
            "submitted_at": q.submitted_at,
            "items": [
                {
                    "description": it.description,
                    "quantity": it.quantity,
                    "unit_price": it.unit_price,
                    "total_price": it.total_price
                } for it in q.items
            ]
        })

    return {
        "id": rfq.id,
        "rfq_number": rfq.rfq_number,
        "title": rfq.title,
        "description": rfq.description,
        "status": rfq.status,
        "submission_deadline": rfq.submission_deadline,
        "created_at": rfq.created_at,
        "quotations": quotes_data
    }

@router.post("/{id}/quotations", response_model=dict)
def submit_quotation(
    id: str,
    req: QuotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rfq = db.query(RFQ).filter(
        RFQ.id == id,
        RFQ.organization_id == current_user.organization_id
    ).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")

    if rfq.status in ["AWARDED", "CLOSED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail=f"RFQ is closed for submissions ({rfq.status})")

    supplier = db.query(Supplier).filter(Supplier.id == req.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    calc_total = 0.0
    items_to_add = []
    for it in req.items:
        t = round(it.quantity * it.unit_price, 2)
        calc_total += t
        items_to_add.append(
            QuotationItem(
                description=it.description,
                quantity=it.quantity,
                unit_price=it.unit_price,
                total_price=t
            )
        )

    quote = Quotation(
        rfq_id=rfq.id,
        supplier_id=supplier.id,
        quotation_number=req.quotation_number,
        total_amount=round(calc_total, 2),
        currency=supplier.currency or "USD",
        lead_time_days=req.lead_time_days,
        validity_days=req.validity_days,
        payment_terms=req.payment_terms,
        notes=req.notes,
        status="SUBMITTED",
        items=items_to_add
    )
    db.add(quote)
    db.commit()
    db.refresh(quote)

    log_audit(
        db, current_user.organization_id, "SUBMIT_QUOTATION", "Quotation",
        quote.id, current_user.id, current_user.full_name,
        f"Submitted quotation {quote.quotation_number} from {supplier.name} for RFQ {rfq.rfq_number} (${quote.total_amount:.2f})"
    )
    db.commit()

    return {
        "id": quote.id,
        "quotation_number": quote.quotation_number,
        "supplier_name": supplier.name,
        "total_amount": quote.total_amount,
        "status": quote.status
    }

@router.post("/quotations/{quote_id}/award", response_model=dict)
def award_quotation(
    quote_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quote = db.query(Quotation).filter(Quotation.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")

    rfq = db.query(RFQ).filter(
        RFQ.id == quote.rfq_id,
        RFQ.organization_id == current_user.organization_id
    ).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")

    # Mark quote awarded
    quote.status = "AWARDED"
    rfq.status = "AWARDED"

    # Reject other quotes
    for other in rfq.quotations:
        if other.id != quote.id:
            other.status = "REJECTED"

    log_audit(
        db, current_user.organization_id, "AWARD_QUOTATION", "Quotation",
        quote.id, current_user.id, current_user.full_name,
        f"Awarded quotation {quote.quotation_number} to {quote.supplier.name} for RFQ {rfq.rfq_number}"
    )
    create_notification(
        db, current_user.organization_id,
        "RFQ Awarded",
        f"Quotation {quote.quotation_number} from {quote.supplier.name} awarded for RFQ {rfq.rfq_number}."
    )
    db.commit()
    return {"message": "Quotation awarded successfully", "rfq_status": rfq.status}
