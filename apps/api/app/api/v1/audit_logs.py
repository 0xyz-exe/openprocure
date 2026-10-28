from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import AuditLog, User

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[dict])
def list_audit_logs(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AuditLog).filter(AuditLog.organization_id == current_user.organization_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "actor_name": l.actor_name,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details,
            "ip_address": l.ip_address,
            "created_at": l.created_at
        })
    return results
