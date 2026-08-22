import logging
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

    # 2. LLM Architecture & Persona Scoping
    prompt_lower = prompt.lower().strip()
    user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)

    if user_role == "EMPLOYEE":
        agent_persona = "Personal AI Assistant"
    elif user_role == "HR":
        agent_persona = "HR Intelligence Agent"
    else:
        agent_persona = "Admin Control Agent"

    tool_used = None
    data_evidence = None
    sources = []
    answer = ""
    recommendation = ""
    confidence = 0.95
    actions = None

    # 3. Role-Based Intent Router & Privacy Scoping

    # --- EMPLOYEE PERSONA (SCOPED TO SELF ONLY) ---
    if user_role == "EMPLOYEE":
        # 1. Privacy Protection Check (attempting company-wide access)
        if any(kw in prompt_lower for kw in ["who is absent", "who is out", "everyone's", "all employees", "company payroll"]):
            sources = ["rbac_security_policy"]
            answer = (
                f"As your Personal AI Assistant, I operate strictly within your individual employee scope. "
                f"Confidential workforce metrics, department-wide attendance logs, and colleagues' leave requests are restricted to HR & Admin AI Agents."
            )
            recommendation = "You can ask me about your own leave balance, attendance history, payslips, or company HR policies."

        # 2. Attendance / Days Attended / Check-in / Attendance Logs (matches typos like attened, attendece, etc.)
        elif any(kw in prompt_lower for kw in ["atten", "atend", "present", "presence", "checkin", "check-in", "check in", "log", "worked", "punch", "timesheet"]):
            tool_used = "get_employee_attendance"
            data_evidence = tool_get_employee_attendance(db, user, days=30)
            sources = ["attendance", "employees"]
            if "attendance_records" in data_evidence and data_evidence["attendance_records"]:
                p_cnt = data_evidence.get("present_count", 0)
                tot_cnt = data_evidence.get("record_count", 0)
                tot_hrs = data_evidence.get("total_working_hours", 0)
                lines = [f"• {r['date']}: Status = {r['status']} | Check-in = {r['check_in'] or 'N/A'} | Hours = {r['working_hours']}h" for r in data_evidence["attendance_records"][:7]]
                answer = (
                    f"Attendance Record Summary for {data_evidence.get('employee_name', 'you')}:\n\n"
                    f"• Days Attended (Present/Late): {p_cnt} out of {tot_cnt} recorded days\n"
                    f"• Total Working Hours: {tot_hrs} hrs\n"
                    f"• Late Check-ins: {data_evidence.get('late_count', 0)}\n\n"
                    f"Recent Attendance Logs:\n" + "\n".join(lines)
                )
            else:
                answer = "No recent attendance records found for your profile."
            recommendation = "Ensure you check in daily via the Attendance Portal."

        # 3. Leave Balance / PTO / Vacation
        elif any(kw in prompt_lower for kw in ["leave", "leav", "vacation", "pto", "holiday", "time off", "timeoff", "balance", "remaining"]):
            tool_used = "get_leave_balance"
            data_evidence = tool_get_leave_balance(db, user)
            sources = ["leave_balances", "employees"]
            if "balances" in data_evidence and data_evidence["balances"]:
                lines = [f"• {b['leave_type']}: {b['remaining_days']} days remaining (Used {b['used_days']}/{b['allocated_days']} days)" for b in data_evidence["balances"]]
                answer = f"Here is your current personal leave balance summary:\n\n" + "\n".join(lines)
            else:
                answer = "Your personal leave balances are active and up to date."
            recommendation = "Submit leave requests in advance through the Leave Portal."

        # 4. Profile / Personal Details
        elif any(kw in prompt_lower for kw in ["profile", "info", "detail", "designation", "employee code", "code", "id", "who am i", "about me", "my role"]):
            tool_used = "get_employee"
            data_evidence = tool_get_employee(db, user)
            sources = ["employees"]
            answer = (
                f"Your Profile Information:\n\n"
                f"• Name: {data_evidence.get('name')}\n"
                f"• Employee Code: {data_evidence.get('employee_code')}\n"
                f"• Designation: {data_evidence.get('designation')}\n"
                f"• Department: {data_evidence.get('department')}\n"
                f"• Joining Date: {data_evidence.get('joining_date')}\n"
                f"• Status: {data_evidence.get('status')}"
            )
            recommendation = "Keep your personal phone number and address updated in My Profile."

        # 5. Policies / Sick / Hours / Payslip
        elif any(kw in prompt_lower for kw in ["sick", "policy", "policies", "hour", "hours", "handbook", "payslip", "pay", "salary"]):
            sources = ["hr_policies", "company_handbook"]
            if "sick" in prompt_lower:
                answer = "Sick Leave Policy: Employees receive 12 paid Sick Leave days per year. Submit medical certificates for requests exceeding 2 consecutive days."
            elif "hour" in prompt_lower:
                answer = "Standard Working Hours: 9:00 AM to 5:00 PM, Monday through Friday. A 15-minute grace period applies before check-in is logged as LATE."
            elif "payslip" in prompt_lower or "pay" in prompt_lower or "salary" in prompt_lower:
                answer = "Payroll & Payslips: Monthly salaries are processed on the 28th. Download your official payslip from the 'My Payslips' tab under My Profile."
            else:
                answer = "Dayflow HR Policy Overview: Standard work week is 40 hours. All leave requests must be submitted through Employee Self-Service."
            recommendation = "Refer to the Employee Handbook for complete HR policy details."

        else:
            sources = ["dayflow_personal_assistant"]
            user_fname = user.employee.first_name if user.employee and user.employee.first_name else "there"
            answer = (
                f"Hello {user_fname}! I am your Personal AI Assistant. "
                f"I can help you check your leave balance, review attendance logs, update profile details, and answer HR policy questions."
            )
            recommendation = "Try asking: 'What is my leave balance?' or 'How many days have I attended?'."

    # --- HR & ADMIN PERSONAS (FULL WORKFORCE INTELLIGENCE) ---
    else:
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
            tool_used = "get_workforce_metrics"
            data_evidence = tool_get_workforce_metrics(db, user)
            sources = ["employees", "attendance", "workforce_metrics"]

            answer = (
                f"Hello! I am your Dayflow {agent_persona}. Here is live system status:\n\n"
                f"• Active Headcount: {data_evidence['total_active_headcount']}\n"
                f"• Today's Attendance Rate: {data_evidence['attendance_rate_pct']}%\n"
                f"• Pending Leaves: {data_evidence['pending_leave_requests']}\n\n"
                f"You can ask me about today's absent employees, department attendance trends, pending leaves, or workforce attention signals."
            )
            recommendation = "Ask any specific HR or workforce query."

    ai_evt = AIEvent(
        request_id=request_id,
        user_id=user.id,
        agent_name=f"Dayflow {agent_persona}",
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
        data_evidence=data_evidence,
        agent_persona=agent_persona
    )
