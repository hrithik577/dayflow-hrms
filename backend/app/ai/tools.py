from typing import Dict, Any, List, Optional
from datetime import date, datetime
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveRequestStatus, LeaveBalance, LeaveType
from app.models.payroll import Payroll
from app.models.audit import AuditLog
from app.models.ai import AttendanceAnomaly
from app.models.user import User

# ---------------------------------------------------------
# CONTROLLED AI TOOLS (ONLY THESE 12 APPROVED TOOLS MAY BE CALLED BY AI)
# ---------------------------------------------------------

def tool_get_employee(db: Session, current_user: User, employee_id: Optional[int] = None) -> Dict[str, Any]:
    """1. get_employee"""
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if user_role == "EMPLOYEE":
        if not current_user.employee:
            return {"error": "No linked employee profile"}
        target_emp_id = current_user.employee.id
    else:
        target_emp_id = employee_id or (current_user.employee.id if current_user.employee else 1)

    emp = db.query(Employee).filter(Employee.id == target_emp_id).first()
    if not emp:
        return {"error": "Employee not found"}

    return {
        "id": emp.id,
        "employee_code": emp.employee_code,
        "name": f"{emp.first_name} {emp.last_name}",
        "designation": emp.designation,
        "department": emp.department.name if emp.department else "General",
        "phone": emp.phone,
        "city": emp.city,
        "joining_date": str(emp.joining_date),
        "status": emp.employment_status.value if hasattr(emp.employment_status, 'value') else str(emp.employment_status)
    }

def tool_get_employee_attendance(db: Session, current_user: User, employee_id: Optional[int] = None, days: int = 14) -> Dict[str, Any]:
    """2. get_employee_attendance"""
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if user_role == "EMPLOYEE":
        if not current_user.employee:
            return {"error": "No linked employee profile"}
        target_emp_id = current_user.employee.id
    else:
        target_emp_id = employee_id or (current_user.employee.id if current_user.employee else 1)

    emp = db.query(Employee).filter(Employee.id == target_emp_id).first()
    if not emp:
        return {"error": "Employee not found"}

    records = db.query(Attendance).filter(
        Attendance.employee_id == target_emp_id
    ).order_by(Attendance.date.desc()).limit(days).all()

    att_list = []
    present_count = 0
    late_count = 0
    absent_count = 0
    on_leave_count = 0
    total_hours = 0.0

    for r in records:
        st = r.status.value if hasattr(r.status, 'value') else str(r.status)
        if st == "PRESENT":
            present_count += 1
        elif st == "LATE":
            late_count += 1
            present_count += 1
        elif st == "ABSENT":
            absent_count += 1
        elif st == "LEAVE":
            on_leave_count += 1

        hrs = r.working_hours or 0.0
        total_hours += hrs

        att_list.append({
            "date": str(r.date),
            "check_in": r.check_in.strftime("%H:%M:%S") if r.check_in else None,
            "check_out": r.check_out.strftime("%H:%M:%S") if r.check_out else None,
            "status": st,
            "working_hours": hrs
        })

    return {
        "employee_name": f"{emp.first_name} {emp.last_name}",
        "record_count": len(att_list),
        "present_count": present_count,
        "late_count": late_count,
        "absent_count": absent_count,
        "on_leave_count": on_leave_count,
        "total_working_hours": round(total_hours, 1),
        "attendance_records": att_list,
        "source": "attendance table"
    }

def tool_get_department_attendance(db: Session, current_user: User, target_date: Optional[date] = None) -> Dict[str, Any]:
    """3. get_department_attendance"""
    query_date = target_date or date.today()
    employees = db.query(Employee).filter(Employee.employment_status == "ACTIVE").all()
    dept_map = {}

    for emp in employees:
        dname = emp.department.name if emp.department else "General"
        if dname not in dept_map:
            dept_map[dname] = {"total": 0, "present": 0, "late": 0, "absent": 0, "on_leave": 0}
        dept_map[dname]["total"] += 1

        rec = db.query(Attendance).filter(
            Attendance.employee_id == emp.id,
            Attendance.date == query_date
        ).first()

        if rec:
            st = rec.status.value if hasattr(rec.status, 'value') else str(rec.status)
            if st == "PRESENT":
                dept_map[dname]["present"] += 1
            elif st == "LATE":
                dept_map[dname]["late"] += 1
            elif st == "LEAVE":
                dept_map[dname]["on_leave"] += 1
            elif st == "ABSENT":
                dept_map[dname]["absent"] += 1
        else:
            dept_map[dname]["absent"] += 1

    summary = []
    for dname, stats in dept_map.items():
        present_or_late = stats["present"] + stats["late"]
        rate = round((present_or_late / max(1, stats["total"])) * 100, 1)
        summary.append({
            "department": dname,
            "total_headcount": stats["total"],
            "present": stats["present"],
            "late": stats["late"],
            "absent": stats["absent"],
            "on_leave": stats["on_leave"],
            "attendance_rate_pct": rate
        })

    return {
        "date": str(query_date),
        "departments": summary,
        "source": "employees, attendance tables"
    }

def tool_get_pending_leaves(db: Session, current_user: User, department_name: Optional[str] = None) -> Dict[str, Any]:
    """4. get_pending_leaves"""
    query = db.query(LeaveRequest).filter(LeaveRequest.status == LeaveRequestStatus.PENDING)
    requests = query.all()

    items = []
    for r in requests:
        emp = r.employee
        dname = emp.department.name if emp and emp.department else "N/A"
        if department_name and department_name.lower() not in dname.lower():
            continue

        items.append({
            "request_id": r.id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "department": dname,
            "leave_type": r.leave_type.name if r.leave_type else "Leave",
            "start_date": str(r.start_date),
            "end_date": str(r.end_date),
            "total_days": r.total_days,
            "reason": r.reason
        })

    return {
        "pending_count": len(items),
        "leave_requests": items,
        "source": "leave_requests table"
    }

def tool_get_leave_balance(db: Session, current_user: User, employee_id: Optional[int] = None) -> Dict[str, Any]:
    """5. get_leave_balance"""
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if user_role == "EMPLOYEE":
        if not current_user.employee:
            return {"error": "No linked employee profile"}
        target_emp_id = current_user.employee.id
    else:
        target_emp_id = employee_id or (current_user.employee.id if current_user.employee else 1)

    emp = db.query(Employee).filter(Employee.id == target_emp_id).first()
    if not emp:
        return {"error": "Employee not found"}

    balances = db.query(LeaveBalance).filter(LeaveBalance.employee_id == target_emp_id).all()
    bal_list = []
    for b in balances:
        bal_list.append({
            "leave_type": b.leave_type.name if b.leave_type else "Leave",
            "allocated_days": b.allocated_days,
            "used_days": b.used_days,
            "remaining_days": b.remaining_days
        })

    return {
        "employee_name": f"{emp.first_name} {emp.last_name}",
        "balances": bal_list,
        "source": "leave_balances table"
    }

def tool_get_workforce_metrics(db: Session, current_user: User) -> Dict[str, Any]:
    """6. get_workforce_metrics"""
    today = date.today()
    total_active = db.query(Employee).filter(Employee.employment_status == "ACTIVE").count() or 1
    today_records = db.query(Attendance).filter(Attendance.date == today).all()
    
    present = sum(1 for r in today_records if r.status == AttendanceStatus.PRESENT)
    late = sum(1 for r in today_records if r.status == AttendanceStatus.LATE)
    leave = sum(1 for r in today_records if r.status == AttendanceStatus.LEAVE)
    absent = max(0, total_active - (present + late + leave))
    attendance_rate = round(((present + late) / max(1, total_active)) * 100, 1)

    pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == LeaveRequestStatus.PENDING).count()

    return {
        "date": str(today),
        "total_active_headcount": total_active,
        "present_today": present,
        "late_today": late,
        "on_leave_today": leave,
        "absent_today": absent,
        "attendance_rate_pct": attendance_rate,
        "pending_leave_requests": pending_leaves,
        "source": "employees, attendance, leave_requests tables"
    }

def tool_get_payroll_summary(db: Session, current_user: User) -> Dict[str, Any]:
    """7. get_payroll_summary"""
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if user_role == "EMPLOYEE":
        return {
            "error": "EMPLOYEES are strictly forbidden from viewing company-wide payroll summary",
            "blocked": True
        }

    payrolls = db.query(Payroll).all()
    total_basic = sum(p.basic_salary for p in payrolls)
    total_net = sum(p.net_salary for p in payrolls)
    count = len(payrolls)

    return {
        "total_employees_covered": count,
        "total_basic_payroll_usd": round(total_basic, 2),
        "total_net_payroll_usd": round(total_net, 2),
        "avg_net_salary_usd": round(total_net / max(1, count), 2),
        "source": "payroll table"
    }

def tool_get_attendance_anomalies(db: Session, current_user: User) -> Dict[str, Any]:
    """8. get_attendance_anomalies"""
    anomalies = db.query(AttendanceAnomaly).order_by(AttendanceAnomaly.created_at.desc()).limit(20).all()
    anom_list = []
    for a in anomalies:
        emp = a.employee
        anom_list.append({
            "id": a.id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "department": emp.department.name if emp and emp.department else "General",
            "anomaly_type": a.anomaly_type,
            "severity": a.severity,
            "score": a.score,
            "explanation": a.explanation,
            "resolved": a.resolved
        })

    return {
        "count": len(anom_list),
        "anomalies": anom_list,
        "source": "attendance_anomalies table"
    }

def tool_create_leave_request(db: Session, current_user: User, leave_type_id: int, start_date: date, end_date: date, reason: str) -> Dict[str, Any]:
    """9. create_leave_request"""
    if not current_user.employee:
        return {"error": "User has no linked employee profile"}

    emp = current_user.employee
    days = (end_date - start_date).days + 1
    if days <= 0:
        return {"error": "Invalid date range"}

    leave_req = LeaveRequest(
        employee_id=emp.id,
        leave_type_id=leave_type_id,
        start_date=start_date,
        end_date=end_date,
        total_days=days,
        reason=reason,
        status=LeaveRequestStatus.PENDING
    )
    db.add(leave_req)
    db.commit()
    db.refresh(leave_req)

    return {
        "status": "CREATED",
        "leave_request_id": leave_req.id,
        "employee_name": f"{emp.first_name} {emp.last_name}",
        "total_days": days,
        "message": "Leave request created and submitted for HR review."
    }

def tool_approve_leave_request(db: Session, current_user: User, leave_id: int, reviewer_comment: Optional[str] = "Approved by HR") -> Dict[str, Any]:
    """10. approve_leave_request (Requires Human Approval)"""
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if user_role == "EMPLOYEE":
        return {"error": "Employees are forbidden from approving leave requests", "blocked": True}

    req = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not req:
        return {"error": "Leave request not found"}

    if req.status != LeaveRequestStatus.PENDING:
        return {"error": f"Leave request is not PENDING (current status: {req.status.value})"}

    reviewer_emp_id = current_user.employee.id if current_user.employee else None
    req.status = LeaveRequestStatus.APPROVED
    req.reviewed_by = reviewer_emp_id
    req.reviewer_comment = reviewer_comment

    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == req.employee_id,
        LeaveBalance.leave_type_id == req.leave_type_id
    ).first()
    if balance:
        balance.used_days += req.total_days
        balance.remaining_days = max(0.0, balance.allocated_days - balance.used_days)

    db.commit()
    db.refresh(req)

    return {
        "status": "APPROVED",
        "leave_id": req.id,
        "employee_id": req.employee_id,
        "human_approved": True,
        "message": f"Leave request #{req.id} approved by {current_user.email}."
    }

def tool_reject_leave_request(db: Session, current_user: User, leave_id: int, reviewer_comment: str) -> Dict[str, Any]:
    """11. reject_leave_request (Requires Human Approval)"""
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if user_role == "EMPLOYEE":
        return {"error": "Employees are forbidden from rejecting leave requests", "blocked": True}

    req = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not req:
        return {"error": "Leave request not found"}

    if req.status != LeaveRequestStatus.PENDING:
        return {"error": f"Leave request is not PENDING (current status: {req.status.value})"}

    reviewer_emp_id = current_user.employee.id if current_user.employee else None
    req.status = LeaveRequestStatus.REJECTED
    req.reviewed_by = reviewer_emp_id
    req.reviewer_comment = reviewer_comment

    db.commit()
    db.refresh(req)

    return {
        "status": "REJECTED",
        "leave_id": req.id,
        "employee_id": req.employee_id,
        "human_approved": True,
        "message": f"Leave request #{req.id} rejected by {current_user.email}."
    }

def tool_get_audit_events(db: Session, current_user: User, limit: int = 20) -> Dict[str, Any]:
    """12. get_audit_events"""
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if user_role == "EMPLOYEE":
        return {"error": "Employees are forbidden from accessing audit events", "blocked": True}

    events = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    evt_list = []
    for e in events:
        usr = e.user
        evt_list.append({
            "id": e.id,
            "user_email": usr.email if usr else "System",
            "role": e.role,
            "action": e.action,
            "entity_type": e.entity_type,
            "entity_id": e.entity_id,
            "created_at": str(e.created_at)
        })

    return {
        "count": len(evt_list),
        "audit_events": evt_list,
        "source": "audit_logs table"
    }

APPROVED_AI_TOOLS = {
    "get_employee": tool_get_employee,
    "get_employee_attendance": tool_get_employee_attendance,
    "get_department_attendance": tool_get_department_attendance,
    "get_pending_leaves": tool_get_pending_leaves,
    "get_leave_balance": tool_get_leave_balance,
    "get_workforce_metrics": tool_get_workforce_metrics,
    "get_payroll_summary": tool_get_payroll_summary,
    "get_attendance_anomalies": tool_get_attendance_anomalies,
    "create_leave_request": tool_create_leave_request,
    "approve_leave_request": tool_approve_leave_request,
    "reject_leave_request": tool_reject_leave_request,
    "get_audit_events": tool_get_audit_events,
}
