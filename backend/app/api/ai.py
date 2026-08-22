from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.ai import AIInsight, AIEvent
from app.schemas.ai import AIQueryRequest, AIQueryResponse, AIInsightOut, AIEventOut
from app.services.auth_service import get_current_user, require_roles
from app.ai.copilot import process_ai_query

router = APIRouter(prefix="/api/ai", tags=["AI Copilot"])

@router.post("/query", response_model=AIQueryResponse)
def query_ai_copilot(
    req: AIQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    response = process_ai_query(db=db, user=current_user, prompt=req.prompt.strip())
    return response

@router.get("/insights", response_model=List[AIInsightOut])
def get_ai_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    insights = db.query(AIInsight).order_by(AIInsight.created_at.desc()).all()
    
    result = []
    for i in insights:
        emp = i.employee
        dept = i.department
        result.append(AIInsightOut(
            id=i.id,
            employee_id=i.employee_id,
            employee_name=f"{emp.first_name} {emp.last_name}" if emp else None,
            department_id=i.department_id,
            department_name=dept.name if dept else None,
            insight_type=i.insight_type,
            severity=i.severity,
            title=i.title,
            explanation=i.explanation,
            evidence=i.evidence,
            recommendation=i.recommendation,
            confidence=i.confidence,
            status=i.status,
            created_at=i.created_at
        ))
    return result

@router.get("/events", response_model=List[AIEventOut])
def get_ai_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.HR, UserRole.ADMIN]))
):
    events = db.query(AIEvent).order_by(AIEvent.created_at.desc()).limit(100).all()
    
    result = []
    for e in events:
        usr = e.user
        result.append(AIEventOut(
            id=e.id,
            request_id=e.request_id,
            user_id=e.user_id,
            user_email=usr.email if usr else "System",
            agent_name=e.agent_name,
            action_type=e.action_type,
            input_summary=e.input_summary,
            data_sources=e.data_sources,
            decision=e.decision,
            confidence=e.confidence,
            guardrail_status=e.guardrail_status,
            tool_name=e.tool_name,
            created_at=e.created_at
        ))
    return result
