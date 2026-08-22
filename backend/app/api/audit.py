from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.user import User, UserRole
from app.schemas.audit import AuditLogOut
from app.services.auth_service import get_current_user, require_roles

router = APIRouter(prefix="/api/audit", tags=["Audit System"])

@router.get("", response_model=List[AuditLogOut])
def get_audit_logs(
    user_id: Optional[int] = Query(None),
    role: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.HR, UserRole.ADMIN]))
):
    query = db.query(AuditLog)

    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if role:
        query = query.filter(AuditLog.role == role.upper())
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action.strip()}%"))

    audits = query.order_by(AuditLog.created_at.desc()).limit(150).all()

    result = []
    for a in audits:
        usr = a.user
        result.append(AuditLogOut(
            id=a.id,
            user_id=a.user_id,
            user_email=usr.email if usr else "System",
            role=a.role,
            action=a.action,
            entity_type=a.entity_type,
            entity_id=a.entity_id,
            old_value=a.old_value,
            new_value=a.new_value,
            source=a.source,
            ip_address=a.ip_address,
            created_at=a.created_at
        ))

    return result
