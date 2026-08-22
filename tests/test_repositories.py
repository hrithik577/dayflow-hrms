from datetime import date, datetime, timezone
from app.repositories import (
    UserRepository, EmployeeRepository, AttendanceRepository, LeaveRepository, PayrollRepository, AuditRepository
)


def test_user_repository(db_session):
    u = UserRepository.create(db_session, "repo.user@dayflow.com", "hash123", role="HR")
    assert u.id is not None

    found = UserRepository.get_by_email(db_session, "repo.user@dayflow.com")
    assert found is not None
    assert found.id == u.id


def test_employee_repository(db_session):
    u = UserRepository.create(db_session, "emp.repo@dayflow.com", "hash123", role="EMPLOYEE")
    emp = EmployeeRepository.create(
        db_session,
        user_id=u.id,
        employee_code="EMP-101",
        first_name="John",
        last_name="Doe",
        designation="Developer",
        joining_date=date(2026, 1, 1)
    )
    assert emp.id is not None
    assert EmployeeRepository.get_by_code(db_session, "EMP-101").id == emp.id


def test_attendance_repository(db_session):
    u = UserRepository.create(db_session, "att.repo@dayflow.com", "hash123")
    emp = EmployeeRepository.create(
        db_session, user_id=u.id, employee_code="EMP-102", first_name="Jane", last_name="Doe",
        designation="Developer", joining_date=date(2026, 1, 1)
    )

    t_date = date.today()
    now = datetime.now(timezone.utc)
    att = AttendanceRepository.check_in(db_session, emp.id, t_date, now, status="PRESENT", source="WEB")
    assert att.status == "PRESENT"

    updated = AttendanceRepository.check_out(db_session, emp.id, t_date, now, notes="Worked standard shift")
    assert updated is not None


def test_audit_repository(db_session):
    u = UserRepository.create(db_session, "audit.user@dayflow.com", "hash123")
    log = AuditRepository.log_event(db_session, action="login", user_id=u.id, source="WEB")
    assert log.id is not None

    logs = AuditRepository.list_logs(db_session, user_id=u.id)
    assert len(logs) == 1
    assert logs[0].action == "login"
