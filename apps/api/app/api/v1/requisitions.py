from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Requisition, RequisitionItem, ApprovalDecision, User, Budget
from app.schemas.schemas import RequisitionCreate, RequisitionOut
from app.services.numbering import next_requisition_number
from app.services.audit import log_audit, create_notification

router = APIRouter(prefix="/requisitions", tags=["Requisitions"])

@router.get("", response_model=List[RequisitionOut])
def list_requisitions(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Requisition).filter(Requisition.organization_id == current_user.organization_id)
    if status and status != "ALL":
        query = query.filter(Requisition.status == status)
    return query.order_by(Requisition.created_at.desc()).all()

@router.post("", response_model=RequisitionOut)
def create_requisition(
    req: RequisitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.items:
        raise HTTPException(status_code=400, detail="Requisition must contain at least one line item.")

    req_num = next_requisition_number(db)
    
    # Calculate totals server-side
    calculated_total = 0.0
    items_to_add = []
    for item in req.items:
        item_total = round(item.quantity * item.estimated_unit_price, 2)
        calculated_total += item_total
        items_to_add.append(
            RequisitionItem(
                description=item.description,
                item_code=item.item_code,
                quantity=item.quantity,
                unit_of_measure=item.unit_of_measure,
                estimated_unit_price=item.estimated_unit_price,
                estimated_total=item_total,
                suggested_supplier=item.suggested_supplier
            )
        )

    # Determine approval tiers: > $10,000 requires Level 2 approval
    req_level = 2 if calculated_total > 10000 else 1

    requisition = Requisition(
        organization_id=current_user.organization_id,
        requisition_number=req_num,
        requester_id=current_user.id,
        requester_name=current_user.full_name,
        department=req.department,
        title=req.title,
        justification=req.justification,
        total_amount=round(calculated_total, 2),
        currency=req.currency,
        priority=req.priority,
        status="DRAFT",
        approval_level_required=req_level,
        current_approval_level=0,
        items=items_to_add
    )
    db.add(requisition)
    db.commit()
    db.refresh(requisition)

    log_audit(
        db, current_user.organization_id, "CREATE", "Requisition",
        requisition.id, current_user.id, current_user.full_name,
        f"Created requisition {requisition.requisition_number} for total ${requisition.total_amount:.2f}"
    )
    db.commit()
    return requisition

@router.get("/{id}", response_model=RequisitionOut)
def get_requisition(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(Requisition).filter(
        Requisition.id == id,
        Requisition.organization_id == current_user.organization_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")
    return req

@router.post("/{id}/submit", response_model=RequisitionOut)
def submit_requisition(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(Requisition).filter(
        Requisition.id == id,
        Requisition.organization_id == current_user.organization_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    if req.status not in ["DRAFT", "CHANGES_REQUESTED"]:
        raise HTTPException(status_code=400, detail=f"Cannot submit requisition in status '{req.status}'")

    req.status = "PENDING_APPROVAL"
    req.current_approval_level = 1

    # Update Department Budget Commitment
    budget = db.query(Budget).filter(
        Budget.organization_id == current_user.organization_id,
        Budget.department == req.department
    ).first()
    if budget:
        budget.committed_amount = round(budget.committed_amount + req.total_amount, 2)

    # Create pending approval decision
    decision = ApprovalDecision(
        requisition_id=req.id,
        approver_id=current_user.id, # Will be claimed/approved by approver
        approver_name="Pending Reviewer",
        level=1,
        status="PENDING",
        comments="Submitted for managerial review"
    )
    db.add(decision)

    log_audit(
        db, current_user.organization_id, "SUBMIT", "Requisition",
        req.id, current_user.id, current_user.full_name,
        f"Submitted requisition {req.requisition_number} for approval (Level 1)"
    )
    create_notification(
        db, current_user.organization_id,
        "Requisition Awaiting Approval",
        f"Requisition {req.requisition_number} (${req.total_amount:.2f}) submitted by {req.requester_name}",
        link=f"/approvals"
    )
    db.commit()
    db.refresh(req)
    return req

@router.post("/{id}/cancel", response_model=RequisitionOut)
def cancel_requisition(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(Requisition).filter(
        Requisition.id == id,
        Requisition.organization_id == current_user.organization_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    if req.status in ["APPROVED", "CONVERTED_TO_PO"]:
        raise HTTPException(status_code=400, detail="Cannot cancel an already approved or converted requisition.")

    req.status = "CANCELLED"
    log_audit(
        db, current_user.organization_id, "CANCEL", "Requisition",
        req.id, current_user.id, current_user.full_name,
        f"Cancelled requisition {req.requisition_number}"
    )
    db.commit()
    db.refresh(req)
    return req
