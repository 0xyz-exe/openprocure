from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Notification, User

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[dict])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifs = db.query(Notification).filter(
        Notification.organization_id == current_user.organization_id
    ).order_by(Notification.created_at.desc()).limit(20).all()

    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "link": n.link,
            "is_read": n.is_read,
            "created_at": n.created_at
        } for n in notifs
    ]

@router.post("/{id}/read", response_model=dict)
def mark_read(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == id,
        Notification.organization_id == current_user.organization_id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "success"}

@router.post("/read-all", response_model=dict)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.organization_id == current_user.organization_id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "success"}
