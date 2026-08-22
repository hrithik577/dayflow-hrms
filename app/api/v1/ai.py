from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.ai import AIEventOut, AIEventCreate, AIInsightOut, AttendanceAnomalyOut
from app.repositories.ai_repository import AIRepository
from app.repositories.audit_repository import AuditRepository

router = APIRouter()


@router.post("/events", response_model=AIEventOut, status_code=status.HTTP_201_CREATED)
def record_ai_event(payload: AIEventCreate, db: Session = Depends(get_db)):
    """Record an AI event, decision, guardrail evaluation, or execution tool trace."""
    event = AIRepository.log_event(db, **payload.model_dump())
    action_type = "BLOCKED_AI_REQUEST" if payload.guardrail_status == "BLOCKED" else "AI_ACTION"
    AuditRepository.log_event(
        db,
        action=action_type,
        user_id=payload.user_id,
        entity_type="ai_event",
        entity_id=str(event.id)
    )
    return event


@router.get("/insights", response_model=List[AIInsightOut])
def list_ai_insights(is_dismissed: bool = False, limit: int = 50, db: Session = Depends(get_db)):
    """List AI generated workforce insights."""
    return AIRepository.get_insights(db, is_dismissed=is_dismissed, limit=limit)


@router.get("/anomalies", response_model=List[AttendanceAnomalyOut])
def list_attendance_anomalies(status: Optional[str] = None, limit: int = 50, db: Session = Depends(get_db)):
    """List AI detected attendance anomalies."""
    return AIRepository.get_anomalies(db, status=status, limit=limit)
