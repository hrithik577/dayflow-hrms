from datetime import date
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.leave import LeaveRequest, LeaveRequestStatus, LeaveBalance
from app.models.attendance import Attendance, AttendanceStatus

def calculate_smart_leave_coverage(
    db: Session,
    employee_id: int,
    start_date: date,
    end_date: date,
    requested_days: float
) -> Dict[str, Any]:
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        return {"status": "UNKNOWN", "message": "Employee not found"}

    dept_id = employee.department_id
    total_dept_members = 1
    overlapping_leaves_count = 0
    overlapping_employees = []

    # 1. Leave Balance Check
    has_sufficient_balance = True
    balance_status = "OK"
    # Find any matching active balance
    balances = db.query(LeaveBalance).filter(LeaveBalance.employee_id == employee_id).all()
    for b in balances:
        if b.remaining_days < requested_days:
            balance_status = "LOW_BALANCE"

    # 2. Date Conflict Check (Check if employee already requested leave on these dates)
    existing_conflicts = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == employee_id,
        LeaveRequest.status.in_([LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED]),
        LeaveRequest.start_date <= end_date,
        LeaveRequest.end_date >= start_date
    ).count()

    date_conflict_status = "None" if existing_conflicts == 0 else f"{existing_conflicts} date conflict(s)"

    # 3. Department Staffing & Team Overlap
    if dept_id:
        total_dept_members = db.query(Employee).filter(
            Employee.department_id == dept_id,
            Employee.employment_status == "ACTIVE"
        ).count() or 1

        # Check overlapping active/pending leave requests in same department
        overlapping_requests = db.query(LeaveRequest).join(Employee, LeaveRequest.employee_id == Employee.id).filter(
            Employee.department_id == dept_id,
            LeaveRequest.employee_id != employee_id,
            LeaveRequest.status.in_([LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED]),
            LeaveRequest.start_date <= end_date,
            LeaveRequest.end_date >= start_date
        ).all()

        overlapping_leaves_count = len(overlapping_requests)
        for req in overlapping_requests:
            emp = req.employee
            if emp:
                overlapping_employees.append(f"{emp.first_name} {emp.last_name} ({req.start_date} to {req.end_date})")

    # 4. Employees Currently Absent
    today = date.today()
    employees_absent_today = db.query(Attendance).join(Employee, Attendance.employee_id == Employee.id).filter(
        Employee.department_id == dept_id if dept_id else True,
        Attendance.date == today,
        Attendance.status.in_([AttendanceStatus.ABSENT, AttendanceStatus.LEAVE])
    ).count()

    # 5. Estimated Availability Calculation
    absent_count = overlapping_leaves_count + 1
    available_members = max(0, total_dept_members - absent_count)
    availability_percentage = round((available_members / total_dept_members) * 100, 1)

    recommendation = "APPROVE"
    attention_signal = "OK"
    risk_level = "LOW"

    if availability_percentage < 50.0 or existing_conflicts > 0:
        recommendation = "REVIEW_REQUIRED"
        attention_signal = "REVIEW"
        risk_level = "HIGH"
    elif availability_percentage < 75.0 or overlapping_leaves_count >= 2:
        recommendation = "REVIEW_REQUIRED"
        attention_signal = "REVIEW"
        risk_level = "MEDIUM"

    summary_str = (
        f"Leave balance: {balance_status} | "
        f"Date conflict: {date_conflict_status} | "
        f"Team overlap: {overlapping_leaves_count} employee(s) | "
        f"Estimated team availability: {availability_percentage}% | "
        f"Attention: {attention_signal}"
    )

    return {
        "department_id": dept_id,
        "department_name": employee.department.name if employee.department else "General",
        "total_team_members": total_dept_members,
        "leave_balance_status": balance_status,
        "date_conflict_status": date_conflict_status,
        "overlapping_team_leaves": overlapping_leaves_count,
        "overlapping_employees": overlapping_employees,
        "employees_absent_today": employees_absent_today,
        "estimated_team_availability_pct": availability_percentage,
        "attention_signal": attention_signal,
        "recommendation": recommendation,
        "risk_level": risk_level,
        "summary": summary_str
    }

