import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.ai import AIInsight, AIEvent
from app.schemas.ai import AIQueryRequest, AIQueryResponse, AIActionRequest, AIInsightOut, AIEventOut
from app.services.auth_service import get_current_user, require_roles
from app.services.audit_service import log_audit_event
from app.ai.copilot import process_ai_query
from app.ai.tools import APPROVED_AI_TOOLS

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

@router.post("/action")
def execute_ai_action(
    req: AIActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tool_func = APPROVED_AI_TOOLS.get(req.tool_name)
    if not tool_func:
        raise HTTPException(status_code=400, detail=f"Unrecognized or unapproved AI tool '{req.tool_name}'")

    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    sensitive_tools = ["approve_leave_request", "reject_leave_request", "get_payroll_summary", "get_audit_events"]
    if req.tool_name in sensitive_tools and user_role == "EMPLOYEE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: Employees are restricted from executing administrative tool '{req.tool_name}'"
        )

    request_id = f"action-{uuid.uuid4().hex[:8]}"
    args = req.arguments or {}

    try:
        res = tool_func(db=db, current_user=current_user, **args)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to execute AI tool '{req.tool_name}': {str(e)}")

    if isinstance(res, dict) and res.get("blocked"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=res.get("error", "Action blocked by security policy"))

    ai_evt = AIEvent(
        request_id=request_id,
        user_id=current_user.id,
        agent_name="Dayflow AI Action Dispatcher",
        action_type="AI_ACTION",
        input_summary=f"Executed tool '{req.tool_name}' with args {args}",
        data_sources="approved_ai_tool_registry",
        decision=str(res)[:200],
        confidence=1.0,
        guardrail_status="ALLOWED",
        human_approval_required="TRUE" if req.tool_name in sensitive_tools else "FALSE",
        human_approved="TRUE" if user_role in ["HR", "ADMIN"] else "FALSE",
        tool_name=req.tool_name,
        tool_result_reference=str(res)[:300]
    )
    db.add(ai_evt)
    db.commit()

    log_audit_event(
        db=db,
        user_id=current_user.id,
        role=user_role,
        action="AI_TOOL_EXECUTION",
        entity_type="AI_ACTION",
        entity_id=request_id,
        new_value=f"Executed {req.tool_name}"
    )

    return {
        "status": "SUCCESS",
        "request_id": request_id,
        "tool_name": req.tool_name,
        "human_approved": user_role in ["HR", "ADMIN"],
        "result": res
    }

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
