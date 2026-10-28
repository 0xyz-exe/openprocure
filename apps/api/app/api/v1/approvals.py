from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.models import Requisition, ApprovalDecision, User
from app.schemas.schemas import ApprovalAction, RequisitionOut
from app.services.audit import log_audit, create_notification

router = APIRouter(prefix="/approvals", tags=["Approvals Workflow"])

@router.get("", response_model=List[RequisitionOut])
def list_pending_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Retrieve requisitions pending approval for this organization
    requisitions = db.query(Requisition).filter(
        Requisition.organization_id == current_user.organization_id,
        Requisition.status == "PENDING_APPROVAL"
    ).order_by(Requisition.created_at.desc()).all()
    return requisitions

@router.post("/{requisition_id}/action", response_model=RequisitionOut)
def take_approval_action(
    requisition_id: str,
    action: ApprovalAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(Requisition).filter(
        Requisition.id == requisition_id,
        Requisition.organization_id == current_user.organization_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found.")

    if req.status != "PENDING_APPROVAL":
        raise HTTPException(
            status_code=400,
            detail=f"Requisition is not awaiting approval (Current status: {req.status})"
        )

    # Rule: Requester cannot approve own requisition unless ADMIN override
    if req.requester_id == current_user.id and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conflict of Interest: You cannot approve your own purchase requisition."
        )

    valid_actions = ["APPROVED", "REJECTED", "CHANGES_REQUESTED"]
    if action.status not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action '{action.status}'. Allowed: {', '.join(valid_actions)}"
        )

    # Record decision
    current_lvl = req.current_approval_level or 1
    decision = ApprovalDecision(
        requisition_id=req.id,
        approver_id=current_user.id,
        approver_name=current_user.full_name,
        level=current_lvl,
        status=action.status,
        comments=action.comments or f"Decision: {action.status}",
        decided_at=datetime.now(timezone.utc)
    )
    db.add(decision)

    if action.status == "APPROVED":
        # Check if more levels needed
        if current_lvl < req.approval_level_required:
            req.current_approval_level = current_lvl + 1
            log_audit(
                db, current_user.organization_id, "APPROVE_STAGE", "Requisition",
                req.id, current_user.id, current_user.full_name,
                f"Approved stage {current_lvl}/{req.approval_level_required}. Advanced to level {req.current_approval_level}"
            )
        else:
            req.status = "APPROVED"
            log_audit(
                db, current_user.organization_id, "APPROVE_FINAL", "Requisition",
                req.id, current_user.id, current_user.full_name,
                f"Fully approved requisition {req.requisition_number} (${req.total_amount:.2f})"
            )
            create_notification(
                db, current_user.organization_id,
                "Requisition Approved",
                f"Your requisition {req.requisition_number} has been fully approved.",
                user_id=req.requester_id,
                link=f"/requisitions/{req.id}"
            )
    elif action.status == "REJECTED":
        req.status = "REJECTED"
        log_audit(
            db, current_user.organization_id, "REJECT", "Requisition",
            req.id, current_user.id, current_user.full_name,
            f"Rejected requisition {req.requisition_number}: {action.comments}"
        )
        create_notification(
            db, current_user.organization_id,
            "Requisition Rejected",
            f"Requisition {req.requisition_number} was rejected by {current_user.full_name}.",
            user_id=req.requester_id,
            link=f"/requisitions/{req.id}"
        )
    elif action.status == "CHANGES_REQUESTED":
        req.status = "CHANGES_REQUESTED"
        log_audit(
            db, current_user.organization_id, "REQUEST_CHANGES", "Requisition",
            req.id, current_user.id, current_user.full_name,
            f"Requested changes for requisition {req.requisition_number}: {action.comments}"
        )
        create_notification(
            db, current_user.organization_id,
            "Changes Requested on Requisition",
            f"Please revise requisition {req.requisition_number}: {action.comments}",
            user_id=req.requester_id,
            link=f"/requisitions/{req.id}"
        )

    db.commit()
    db.refresh(req)
    return req
