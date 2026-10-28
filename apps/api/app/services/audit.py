from sqlalchemy.orm import Session
from app.models.models import AuditLog, Notification

def log_audit(
    db: Session,
    organization_id: str,
    action: str,
    entity_type: str,
    entity_id: str,
    actor_id: str = None,
    actor_name: str = "System",
    details: str = None,
    ip_address: str = "127.0.0.1"
):
    entry = AuditLog(
        organization_id=organization_id,
        actor_id=actor_id,
        actor_name=actor_name,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        ip_address=ip_address
    )
    db.add(entry)

def create_notification(
    db: Session,
    organization_id: str,
    title: str,
    message: str,
    user_id: str = None,
    link: str = None
):
    notif = Notification(
        organization_id=organization_id,
        user_id=user_id,
        title=title,
        message=message,
        link=link
    )
    db.add(notif)
