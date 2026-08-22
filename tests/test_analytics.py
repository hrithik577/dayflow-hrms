from datetime import date
from app.repositories import AnalyticsRepository
from app.seeds.seed_data import seed_database


def test_analytics_repository_queries(db_session):
    # Seed data into test session
    seed_database(db_session)

    today = date.today()
    total_emp = AnalyticsRepository.get_total_employees(db_session)
    assert total_emp >= 25

    present_cnt = AnalyticsRepository.get_present_employees(db_session, today)
    assert isinstance(present_cnt, int)

    att_rate = AnalyticsRepository.get_attendance_rate(db_session, today)
    assert 0.0 <= att_rate <= 100.0

    health = AnalyticsRepository.get_workforce_health(db_session, today)
    assert health in ["EXCELLENT", "GOOD", "ATTENTION_REQUIRED", "CRITICAL"]

    summary = AnalyticsRepository.get_full_dashboard_summary(db_session, today)
    assert summary["total_employees"] == total_emp
    assert "department_attendance" in summary
    assert len(summary["department_attendance"]) >= 1
