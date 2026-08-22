from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveRequestStatus
from app.models.payroll import Payroll
from app.models.audit import AuditLog
from app.models.ai import AttendanceAnomaly
from datetime import date

def tool_get_absent_employees_today(db: Session) -> Dict[str, Any]:
    today = date.today()
    absent_records = db.query(Attendance).filter(
        Attendance.date == today,
        Attendance.status.in_([AttendanceStatus.ABSENT, AttendanceStatus.LEAVE])
    ).all()

    emp_list = []
    for r in absent_records:
        emp = r.employee
        if emp:
            emp_list.append({
                "employee_code": emp.employee_code,
                "name": f"{emp.first_name} {emp.last_name}",
                "department": emp.department.name if emp.department else "N/A",
                "designation": emp.designation,
                "status": r.status.value if hasattr(r.status, 'value') else str(r.status)
            })

    return {
        "count": len(emp_list),
        "date": str(today),
        "absent_employees": emp_list,
        "source": "attendance table"
    }

def tool_get_department_attendance_stats(db: Session) -> Dict[str, Any]:
    today = date.today()
    employees = db.query(Employee).filter(Employee.employment_status == "ACTIVE").all()
    dept_map = {}

    for emp in employees:
        dname = emp.department.name if emp.department else "General"
        if dname not in dept_map:
            dept_map[dname] = {"total": 0, "present": 0, "late": 0, "absent": 0, "on_leave": 0}
        dept_map[dname]["total"] += 1

        rec = db.query(Attendance).filter(
            Attendance.employee_id == emp.id,
            Attendance.date == today
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
        "date": str(today),
        "departments": summary,
        "source": "employees, attendance tables"
    }

def tool_get_pending_leaves(db: Session) -> Dict[str, Any]:
    requests = db.query(LeaveRequest).filter(
        LeaveRequest.status == LeaveRequestStatus.PENDING
    ).all()

    items = []
    for r in requests:
        emp = r.employee
        items.append({
            "request_id": r.id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "department": emp.department.name if emp and emp.department else "N/A",
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

def tool_get_payroll_summary(db: Session) -> Dict[str, Any]:
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
