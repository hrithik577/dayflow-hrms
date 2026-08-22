from datetime import date
from app.models import User, Department, Employee, Attendance, LeaveType, LeaveRequest, Payroll, AuditLog, AIEvent


def test_user_employee_creation(db_session):
    user = User(email="test.user@dayflow.com", password_hash="hashed_pw", role="EMPLOYEE")
    db_session.add(user)
    db_session.commit()

    dept = Department(name="Engineering", code="ENG", description="Eng Dept")
    db_session.add(dept)
    db_session.commit()

    emp = Employee(
        user_id=user.id,
        employee_code="EMP-999",
        first_name="Test",
        last_name="User",
        department_id=dept.id,
        designation="Software Engineer",
        joining_date=date(2026, 1, 1),
        employment_status="FULL_TIME"
    )
    db_session.add(emp)
    db_session.commit()

    assert emp.id is not None
    assert emp.employee_code == "EMP-999"
    assert emp.department.name == "Engineering"
    assert emp.user.email == "test.user@dayflow.com"


def test_attendance_model(db_session):
    user = User(email="att.user@dayflow.com", password_hash="hashed_pw", role="EMPLOYEE")
    db_session.add(user)
    db_session.commit()

    emp = Employee(
        user_id=user.id,
        employee_code="EMP-998",
        first_name="Att",
        last_name="User",
        designation="QA",
        joining_date=date(2026, 1, 1)
    )
    db_session.add(emp)
    db_session.commit()

    att = Attendance(
        employee_id=emp.id,
        date=date.today(),
        status="PRESENT",
        working_hours=8.0,
        source="WEB"
    )
    db_session.add(att)
    db_session.commit()

    assert att.id is not None
    assert att.working_hours == 8.0
    assert att.employee.employee_code == "EMP-998"
