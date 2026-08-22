from datetime import date
from app.seeds.seed_data import seed_database


def test_root_and_health_endpoints(client):
    r1 = client.get("/")
    assert r1.status_code == 200
    assert r1.json()["status"] == "online"

    r2 = client.get("/health")
    assert r2.status_code == 200
    assert r2.json()["status"] == "healthy"


def test_employees_and_analytics_endpoints(client, db_session):
    seed_database(db_session)

    # Test Employees API
    res = client.get("/api/v1/employees/")
    assert res.status_code == 200
    employees = res.json()
    assert len(employees) >= 25

    # Test Analytics API
    res_analytics = client.get("/api/v1/analytics/summary")
    assert res_analytics.status_code == 200
    data = res_analytics.json()
    assert data["total_employees"] >= 25
    assert "attendance_rate" in data
