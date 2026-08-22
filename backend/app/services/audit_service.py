import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.models.user import User

logger = logging.getLogger("dayflow.audit")

def log_audit_event(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    role: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    source: str = "SYSTEM",
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> AuditLog:
    if user_id and not role:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            role = user.role.value if hasattr(user.role, 'value') else str(user.role)

    audit = AuditLog(
        user_id=user_id,
        role=role,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=old_value,
        new_value=new_value,
        source=source,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    logger.info(f"AUDIT LOG: [{action}] by User {user_id} ({role}) on {entity_type}:{entity_id}")
    return audit
