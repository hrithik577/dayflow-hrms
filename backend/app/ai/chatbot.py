from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.ai import ChatbotQueryRequest, ChatbotQueryResponse
from app.ai.guardrails import check_ai_guardrail
from app.ai.tools import tool_get_leave_balance, tool_get_employee_attendance

HR_POLICY_FAQS = {
    "sick_leave": "Employees receive 12 paid Sick Leave days per year. Submit requests via the Leave Portal with medical documentation if exceeding 2 consecutive days.",
    "casual_leave": "Employees receive 12 paid Casual Leave days per year. Advance approval of at least 24 hours is recommended.",
    "working_hours": "Standard working hours are 9:00 AM to 5:00 PM Monday through Friday. A 15-minute grace period applies before check-in is logged as LATE.",
    "payroll": "Salaries are processed on the 28th of every month. Payslips are downloadable directly from your Employee Self-Service portal."
}

def handle_employee_chatbot_query(
    db: Session,
    user: User,
    req: ChatbotQueryRequest
) -> ChatbotQueryResponse:
    message = req.message.strip()
    msg_lower = message.lower()

    # 1. AI Guardrail Security Check
    is_allowed, block_reason, req_id = check_ai_guardrail(db, user, message)
    if not is_allowed:
        return ChatbotQueryResponse(
            response=f"Security Policy Notice: {block_reason}",
            intent="BLOCKED_SECURITY_VIOLATION",
            sources=["rbac_security_policy"],
            confidence=1.0,
            suggested_actions=["View My Personal Profile", "Contact HR Lead"],
            guardrail_status="BLOCKED"
        )

    intent = "GENERAL_HR_QUERY"
    sources = ["dayflow_knowledgebase"]
    response_text = ""
    suggested_actions = []

    # 2. Intent Routing & Data Integration
    if "leave balance" in msg_lower or "how many leaves" in msg_lower or "remaining leave" in msg_lower:
        intent = "LEAVE_BALANCE_QUERY"
        sources = ["leave_balances", "employees"]
        bal = tool_get_leave_balance(db, user)
        if "balances" in bal:
            lines = [f"• {b['leave_type']}: {b['remaining_days']} days remaining (Used {b['used_days']}/{b['allocated_days']} days)" for b in bal["balances"]]
            response_text = f"Here is your current leave balance summary:\n\n" + "\n".join(lines)
        else:
            response_text = "Your leave balances are up to date in the system."
        suggested_actions = ["Apply for Leave", "View Leave Policy"]

    elif "check in" in msg_lower or "check out" in msg_lower or "my attendance" in msg_lower or "working hours" in msg_lower:
        intent = "ATTENDANCE_QUERY"
        sources = ["attendance"]
        att = tool_get_employee_attendance(db, user, days=5)
        if "attendance_records" in att:
            lines = [f"• {r['date']}: Status={r['status']}, Hours={r['working_hours']}h" for r in att["attendance_records"][:3]]
            response_text = f"Your recent attendance record:\n\n" + "\n".join(lines) + f"\n\n{HR_POLICY_FAQS['working_hours']}"
        else:
            response_text = HR_POLICY_FAQS['working_hours']
        suggested_actions = ["Check In Now", "View Full Attendance Log"]

    elif "payslip" in msg_lower or "salary" in msg_lower or "pay" in msg_lower:
        intent = "PAYROLL_QUERY"
        sources = ["payroll", "employees"]
        response_text = f"You can view and download your personal monthly payslip directly under the 'My Payslips' tab. {HR_POLICY_FAQS['payroll']}"
        suggested_actions = ["View My Payslip", "Contact Payroll Support"]

    elif "sick" in msg_lower or "medical" in msg_lower:
        intent = "POLICY_QUERY"
        sources = ["hr_policies"]
        response_text = HR_POLICY_FAQS['sick_leave']
        suggested_actions = ["Apply for Sick Leave", "View All Policies"]

    else:
        intent = "ASSISTANT_FAQ"
        sources = ["dayflow_ai_assistant"]
        response_text = (
            f"Hello! I am your Dayflow AI Assistant. I can help you check your leave balances, "
            f"review attendance logs, understand company policies, and navigate HR self-service tasks."
        )
        suggested_actions = ["Check My Leave Balance", "View Attendance", "Read HR Policies"]

    return ChatbotQueryResponse(
        response=response_text,
        intent=intent,
        sources=sources,
        confidence=0.95,
        suggested_actions=suggested_actions,
        guardrail_status="ALLOWED"
    )
