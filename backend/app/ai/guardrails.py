import uuid
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.ai import AIEvent
from app.services.audit_service import log_audit_event

UNAUTHORIZED_EMPLOYEE_KEYWORDS = [
    "everyone salary", "everyone's salary", "everyone salaries", "everyone's salaries", "everyones salary", "everyones salaries",
    "all salaries", "all payroll", "all salary", "other employees salary", "other employees salaries", "other employee salary",
    "company payroll", "company salary", "all audit logs", "system audit", "admin stats", "delete employee",
    "modify salary", "change role", "other users salary", "other users salaries", "show all salaries"
]

def check_ai_guardrail(
    db: Session,
    user: User,
    prompt: str
) -> Tuple[bool, Optional[str], str]:
    """
    Evaluates AI query permissions based on user role and query intent.
    Returns: (is_allowed, block_reason, request_id)
    """
    request_id = f"req-{uuid.uuid4().hex[:8]}"
    user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
    prompt_lower = prompt.lower().strip()

    # Rule 1: Regular Employees are strictly blocked from requesting company-wide payroll or audit data
    if user_role == "EMPLOYEE":
        for kw in UNAUTHORIZED_EMPLOYEE_KEYWORDS:
            if kw in prompt_lower:
                reason = "Employees are strictly restricted from viewing company-wide payroll, salary structures, or administrative audit logs."
                
                # Log AI Guardrail Block Event
                ai_evt = AIEvent(
                    request_id=request_id,
                    user_id=user.id,
                    agent_name="Dayflow Guardrail Engine",
                    action_type="GUARDRAIL_BLOCK",
                    input_summary=prompt,
                    decision="BLOCKED",
                    confidence=1.0,
                    guardrail_status="BLOCKED",
                    tool_name="RBAC_SECURITY_CHECK"
                )
                db.add(ai_evt)
                db.commit()

                # Log Audit Event
                log_audit_event(
                    db=db,
                    user_id=user.id,
                    role=user_role,
                    action="BLOCKED_AI_REQUEST",
                    entity_type="AI_PROMPT",
                    entity_id=request_id,
                    new_value=f"Blocked prompt: '{prompt}'. Reason: {reason}"
                )

                return False, reason, request_id

    # Allowed
    return True, None, request_id
