from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.audit import AuditLogOut
from app.repositories.audit_repository import AuditRepository

router = APIRouter()


@router.get("/logs", response_model=List[AuditLogOut])
def list_audit_logs(
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Retrieve audit log history."""
    return AuditRepository.list_logs(db, user_id=user_id, action=action, skip=skip, limit=limit)
