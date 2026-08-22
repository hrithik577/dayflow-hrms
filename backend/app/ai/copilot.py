import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.ai import AIEvent
from app.schemas.ai import AIQueryResponse
from app.ai.guardrails import check_ai_guardrail
from app.ai.tools import (
    tool_get_absent_employees_today,
    tool_get_department_attendance_stats,
    tool_get_pending_leaves,
    tool_get_payroll_summary
)

logger = logging.getLogger("dayflow.copilot")

def process_ai_query(db: Session, user: User, prompt: str) -> AIQueryResponse:
    # 1. Guardrail Verification
    is_allowed, block_reason, request_id = check_ai_guardrail(db, user, prompt)
    if not is_allowed:
        return AIQueryResponse(
            answer=f"🔒 SECURITY GUARDRAIL BLOCKED: {block_reason}",
            sources=["rbac_guardrail_engine"],
            confidence=1.0,
            guardrail_status="BLOCKED",
            security_reason=block_reason
        )

    # 2. Query Intent Router & Tool Selection (Deterministic & Evidence-Backed)
    prompt_lower = prompt.lower()
    tool_used = None
    data_evidence = None
    sources = []
    answer = ""
    confidence = 0.95

    user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)

    if "absent" in prompt_lower or "who is missing" in prompt_lower or "not checked in" in prompt_lower:
        tool_used = "get_absent_employees_today"
        data_evidence = tool_get_absent_employees_today(db)
        sources = ["attendance", "employees"]
        count = data_evidence["count"]
        if count == 0:
            answer = "Great news! All active employees are present or accounted for today."
        else:
            emp_names = ", ".join([f"{e['name']} ({e['department']})" for e in data_evidence["absent_employees"]])
            answer = f"Today, {count} employee(s) are recorded absent or on leave: {emp_names}."

    elif "engineering" in prompt_lower or "late rate" in prompt_lower or "department" in prompt_lower or "decline" in prompt_lower or "trend" in prompt_lower:
        tool_used = "get_department_attendance_stats"
        data_evidence = tool_get_department_attendance_stats(db)
        sources = ["employees", "attendance", "workforce_metrics"]
        
        dept_lines = []
        for d in data_evidence["departments"]:
            dept_lines.append(f"• {d['department']}: {d['attendance_rate_pct']}% attendance rate ({d['present']} present, {d['late']} late, {d['absent']} absent, {d['on_leave']} on leave)")
        
        answer = f"Workforce Attendance Analysis for Today ({data_evidence['date']}):\n\n" + "\n".join(dept_lines) + "\n\nRecommended Action: Review departments with late arrival spikes to optimize shift coverage."

    elif "leave" in prompt_lower or "pending" in prompt_lower or "vacation" in prompt_lower:
        tool_used = "get_pending_leaves"
        data_evidence = tool_get_pending_leaves(db)
        sources = ["leave_requests", "employees", "leave_types"]
        count = data_evidence["pending_count"]
        if count == 0:
            answer = "There are currently no pending leave requests requiring review."
        else:
            req_lines = [f"• {r['employee_name']} ({r['department']}): {r['leave_type']} from {r['start_date']} to {r['end_date']} ({r['total_days']} day/s) - '{r['reason']}'" for r in data_evidence["leave_requests"]]
            answer = f"There are {count} pending leave request(s) requiring HR review:\n\n" + "\n".join(req_lines)

    elif ("payroll" in prompt_lower or "salary" in prompt_lower or "budget" in prompt_lower) and user_role in ["HR", "ADMIN"]:
        tool_used = "get_payroll_summary"
        data_evidence = tool_get_payroll_summary(db)
        sources = ["payroll", "employees"]
        answer = f"Company Payroll Summary:\n\n• Total Employees Covered: {data_evidence['total_employees_covered']}\n• Total Monthly Net Payroll: ${data_evidence['total_net_payroll_usd']:,.2f} USD\n• Average Net Salary: ${data_evidence['avg_net_salary_usd']:,.2f} USD/month"

    else:
        # General response grounded in DB stats
        data_evidence = tool_get_department_attendance_stats(db)
        tool_used = "get_workforce_summary"
        sources = ["employees", "attendance", "departments"]
        answer = f"I am your Dayflow AI Copilot. Based on live workforce records for today:\n\n• Tracked Departments: {len(data_evidence['departments'])}\n• System Status: All HR operations, attendance tracking, and guardrails are fully active.\n\nYou can ask me about today's absent staff, department attendance trends, pending leave requests, or policy information."

    # 3. Log AI Execution Event
    ai_evt = AIEvent(
        request_id=request_id,
        user_id=user.id,
        agent_name="Dayflow AI Copilot",
        action_type="QUERY_EXECUTION",
        input_summary=prompt,
        data_sources=", ".join(sources),
        decision=answer[:200] + "...",
        confidence=confidence,
        guardrail_status="ALLOWED",
        tool_name=tool_used,
        tool_result_reference=str(data_evidence)[:300] if data_evidence else None
    )
    db.add(ai_evt)
    db.commit()

    return AIQueryResponse(
        answer=answer,
        sources=sources,
        confidence=confidence,
        guardrail_status="ALLOWED",
        tool_used=tool_used,
        data_evidence=data_evidence
    )
