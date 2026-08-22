from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from app.models.audit import AuditLog


class AuditRepository:
    @staticmethod
    def log_event(
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
        audit_entry = AuditLog(
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
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        return audit_entry

    @staticmethod
    def list_logs(
        db: Session,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[AuditLog]:
        query = db.query(AuditLog).options(joinedload(AuditLog.user))
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if action:
            query = query.filter(AuditLog.action == action)
        return query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
