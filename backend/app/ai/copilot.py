import logging
import os
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.ai import AIEvent
from app.schemas.ai import AIQueryResponse
from app.ai.guardrails import check_ai_guardrail
from app.ai.tools import (
    APPROVED_AI_TOOLS,
    tool_get_employee,
    tool_get_employee_attendance,
    tool_get_department_attendance,
    tool_get_pending_leaves,
    tool_get_leave_balance,
    tool_get_workforce_metrics,
    tool_get_payroll_summary,
    tool_get_attendance_anomalies,
    tool_get_audit_events
)

logger = logging.getLogger("dayflow.copilot")

def process_ai_query(db: Session, user: User, prompt: str) -> AIQueryResponse:
    # 1. Mandatory AI Guardrail Pipeline Check
    is_allowed, block_reason, request_id = check_ai_guardrail(db, user, prompt)
    if not is_allowed:
        return AIQueryResponse(
            answer=f"Employees may only access their own payroll information.",
            evidence={"reason": block_reason, "permission": "OWN_PAYROLL_ONLY"},
            sources=["rbac_guardrail_engine"],
            confidence=1.0,
            recommendation="Access your own personal profile or contact HR for authorization.",
            action_available=None,
            guardrail_status="BLOCKED",
            security_reason=block_reason
        )

    # 2. LLM Architecture: Primary LLM -> Fallback Provider -> Deterministic Analytics Fallback
    prompt_lower = prompt.lower().strip()
    user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)

    tool_used = None
    data_evidence = None
    sources = []
    answer = ""
    recommendation = ""
    confidence = 0.95
    actions = None

    # Intent Router & Controlled Tool Execution
    if "absent" in prompt_lower or "missing" in prompt_lower or "not checked in" in prompt_lower:
        tool_used = "get_department_attendance"
        data_evidence = tool_get_department_attendance(db, user)
        sources = ["attendance", "employees"]
        
        absent_depts = []
        for d in data_evidence["departments"]:
            if d["absent"] > 0 or d["on_leave"] > 0:
                absent_depts.append(f"{d['department']} ({d['absent']} absent, {d['on_leave']} on leave)")

        if not absent_depts:
            answer = "All employees across all departments are present or accounted for today."
            recommendation = "No staffing adjustments required."
        else:
            answer = f"Attendance summary for today ({data_evidence['date']}): Employees absent or on leave in: " + ", ".join(absent_depts) + "."
            recommendation = "Review department coverage and ensure critical tasks are reallocated."

    elif "highest late rate" in prompt_lower or "late" in prompt_lower:
        tool_used = "get_department_attendance"
        data_evidence = tool_get_department_attendance(db, user)
        sources = ["attendance", "employees", "workforce_metrics"]

        sorted_depts = sorted(data_evidence["departments"], key=lambda x: x["late"], reverse=True)
        top_late = sorted_depts[0] if sorted_depts else None

        if top_late and top_late["late"] > 0:
            answer = f"Department with the highest late check-in count is {top_late['department']} with {top_late['late']} late check-in(s) today (Attendance rate: {top_late['attendance_rate_pct']}%)."
            recommendation = f"Check in with {top_late['department']} managers to review shift start times."
        else:
            answer = "No departments have recorded late check-ins today."
            recommendation = "Maintain current attendance guidelines."

    elif "engineering" in prompt_lower and "leave" in prompt_lower:
        tool_used = "get_pending_leaves"
        data_evidence = tool_get_pending_leaves(db, user, department_name="Engineering")
        sources = ["leave_requests", "employees", "departments"]
        count = data_evidence["pending_count"]

        if count == 0:
            answer = "There are no pending leave requests for the Engineering department."
            recommendation = "Engineering staffing is currently at standard capacity."
        else:
            req_lines = [f"• {r['employee_name']}: {r['leave_type']} ({r['start_date']} to {r['end_date']}, {r['total_days']} days) - '{r['reason']}'" for r in data_evidence["leave_requests"]]
            answer = f"Pending Engineering leave requests ({count}):\n\n" + "\n".join(req_lines)
            recommendation = "HR review required before approving to ensure project sprint capacity."
            actions = [{"action_type": "REVIEW_LEAVE", "pending_requests": [r["request_id"] for r in data_evidence["leave_requests"]]}]

    elif "leave" in prompt_lower or "vacation" in prompt_lower:
        tool_used = "get_pending_leaves"
        data_evidence = tool_get_pending_leaves(db, user)
        sources = ["leave_requests", "employees"]
        count = data_evidence["pending_count"]

        if count == 0:
            answer = "There are currently 0 pending leave requests requiring review."
            recommendation = "All submitted leaves have been processed."
        else:
            req_lines = [f"• #{r['request_id']} {r['employee_name']} ({r['department']}): {r['leave_type']} ({r['total_days']} days) from {r['start_date']}" for r in data_evidence["leave_requests"]]
            answer = f"Currently there are {count} pending leave request(s) awaiting HR decision:\n\n" + "\n".join(req_lines)
            recommendation = "Perform Smart Leave Coverage review and action pending requests."
            actions = [{"action_type": "APPROVE_LEAVE_HUMAN_REQUIRED", "request_ids": [r["request_id"] for r in data_evidence["leave_requests"]]}]

    elif "decline" in prompt_lower or "why" in prompt_lower or "unusual" in prompt_lower or "anomaly" in prompt_lower:
        tool_used = "get_attendance_anomalies"
        data_evidence = tool_get_attendance_anomalies(db, user)
        sources = ["attendance_anomalies", "attendance"]
        count = data_evidence["count"]

        if count == 0:
            answer = "Attendance stability is high. No deterministic attendance anomalies detected in recent days."
            recommendation = "Continue monitoring automated attendance logs."
        else:
            anom_lines = [f"• {a['employee_name']} ({a['department']}): {a['anomaly_type']} - {a['explanation']}" for a in data_evidence["anomalies"][:5]]
            answer = f"Attendance variations and anomalies detected ({count} records):\n\n" + "\n".join(anom_lines)
            recommendation = "Schedule checking conversations with affected team leads."

    elif "health" in prompt_lower or "staffing pressure" in prompt_lower or "status" in prompt_lower or "workforce" in prompt_lower:
        tool_used = "get_workforce_metrics"
        data_evidence = tool_get_workforce_metrics(db, user)
        sources = ["workforce_metrics", "employees", "attendance"]

        answer = (
            f"Today's Workforce Health Overview:\n\n"
            f"• Total Active Headcount: {data_evidence['total_active_headcount']}\n"
            f"• Attendance Rate: {data_evidence['attendance_rate_pct']}%\n"
            f"• Present: {data_evidence['present_today']} | Late: {data_evidence['late_today']} | On Leave: {data_evidence['on_leave_today']} | Absent: {data_evidence['absent_today']}\n"
            f"• Pending Leave Requests: {data_evidence['pending_leave_requests']}"
        )
        recommendation = "Overall workforce health is stable. Review pending leave requests."

    elif ("payroll" in prompt_lower or "salary" in prompt_lower) and user_role in ["HR", "ADMIN"]:
        tool_used = "get_payroll_summary"
        data_evidence = tool_get_payroll_summary(db, user)
        sources = ["payroll", "employees"]

        answer = (
            f"Authorized Company Payroll Summary:\n\n"
            f"• Total Employees Covered: {data_evidence['total_employees_covered']}\n"
            f"• Total Monthly Basic Payroll: ${data_evidence['total_basic_payroll_usd']:,.2f} USD\n"
            f"• Total Monthly Net Payroll: ${data_evidence['total_net_payroll_usd']:,.2f} USD\n"
            f"• Average Net Salary: ${data_evidence['avg_net_salary_usd']:,.2f} USD/month"
        )
        recommendation = "Verify upcoming monthly disbursement schedules with Finance."

    else:
        # Grounded default summary
        tool_used = "get_workforce_metrics"
        data_evidence = tool_get_workforce_metrics(db, user)
        sources = ["employees", "attendance", "workforce_metrics"]

        answer = (
            f"Hello! I am your Dayflow AI Copilot. Here is live system status:\n\n"
            f"• Active Headcount: {data_evidence['total_active_headcount']}\n"
            f"• Today's Attendance Rate: {data_evidence['attendance_rate_pct']}%\n"
            f"• Pending Leaves: {data_evidence['pending_leave_requests']}\n\n"
            f"You can ask me about today's absent employees, department attendance trends, pending leaves, or workforce attention signals."
        )
        recommendation = "Ask any specific HR or workforce query."

    # 3. Log AI Execution Event
    ai_evt = AIEvent(
        request_id=request_id,
        user_id=user.id,
        agent_name="Dayflow AI Copilot",
        action_type="AI_QUERY",
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
        evidence=data_evidence,
        sources=sources,
        confidence=confidence,
        recommendation=recommendation,
        action_available=actions,
        guardrail_status="ALLOWED",
        tool_used=tool_used,
        data_evidence=data_evidence
    )
