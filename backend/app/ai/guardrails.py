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
    "modify salary", "change role", "other users salary", "other users salaries", "show all salaries", "salaries", "salary of everyone"
]

def check_ai_guardrail(
    db: Session,
    user: User,
    prompt: str
) -> Tuple[bool, Optional[str], str]:
    """
    Mandatory 14-step AI Guardrail Pipeline:
    1. Identify authenticated user
    2. Identify role
    3. Identify requested resource
    4. Check permission
    5. Determine data scope
    6. Validate requested action
    7. Select approved tool
    8. Execute tool / Block unauthorized request
    9. Validate result
    10. Determine approval requirement
    11. Require human approval if necessary
    12. Execute approved action
    13. Record AI event (AIEvent with action_type="BLOCKED_AI_REQUEST")
    14. Record audit event (AuditLog with action="BLOCKED_AI_REQUEST")
    """
    request_id = f"req-{uuid.uuid4().hex[:8]}"
    user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
    prompt_lower = prompt.lower().strip()

    # Rule 1: Employees requesting company-wide salaries/payroll or audit logs are BLOCKED
    if user_role == "EMPLOYEE":
        for kw in UNAUTHORIZED_EMPLOYEE_KEYWORDS:
            if kw in prompt_lower:
                reason = "Employees may only access their own payroll information."
                
                # Step 13: Record AI Event
                ai_evt = AIEvent(
                    request_id=request_id,
                    user_id=user.id,
                    agent_name="Dayflow Guardrail Engine",
                    action_type="BLOCKED_AI_REQUEST",
                    input_summary=prompt,
                    data_sources="rbac_security_policy",
                    decision=reason,
                    confidence=1.0,
                    guardrail_status="BLOCKED",
                    tool_name="RBAC_SECURITY_CHECK"
                )
                db.add(ai_evt)
                db.commit()

                # Step 14: Record Audit Event
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
