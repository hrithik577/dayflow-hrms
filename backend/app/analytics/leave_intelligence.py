from datetime import date
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.leave import LeaveRequest, LeaveRequestStatus, LeaveBalance

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

    # Estimated team availability after approving this leave
    absent_count = overlapping_leaves_count + 1
    available_members = max(0, total_dept_members - absent_count)
    availability_percentage = round((available_members / total_dept_members) * 100, 1)

    recommendation = "APPROVE"
    risk_level = "LOW"

    if availability_percentage < 50.0:
        recommendation = "REVIEW_REQUIRED"
        risk_level = "HIGH"
    elif availability_percentage < 75.0:
        recommendation = "REVIEW_REQUIRED"
        risk_level = "MEDIUM"

    return {
        "department_id": dept_id,
        "department_name": employee.department.name if employee.department else "General",
        "total_team_members": total_dept_members,
        "overlapping_team_leaves": overlapping_leaves_count,
        "overlapping_employees": overlapping_employees,
        "estimated_team_availability_pct": availability_percentage,
        "recommendation": recommendation,
        "risk_level": risk_level,
        "summary": f"Team availability would be {availability_percentage}% ({available_members}/{total_dept_members} available)."
    }
