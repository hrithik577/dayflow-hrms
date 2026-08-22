import os
import sys
import pytest

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir in sys.path:
    sys.path.remove(backend_dir)
sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, engine, Base
from seed import seed_database

client = TestClient(app)

@pytest.fixture(autouse=True, scope="module")
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        db.rollback()
    finally:
        db.close()

def test_security_rbac_and_ai_guardrails():
    # 1. Login as Employee (Rahul Sharma)
    res = client.post("/api/auth/login", json={"email": "rahul.sharma@dayflow.com", "password": "Emp@123"})
    assert res.status_code == 200
    emp_token = res.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}

    # 2. Login as HR (Sarah Jenkins)
    res = client.post("/api/auth/login", json={"email": "hr.sarah@dayflow.com", "password": "HR@123"})
    assert res.status_code == 200
    hr_token = res.json()["access_token"]
    hr_headers = {"Authorization": f"Bearer {hr_token}"}

    # ----------------------------------------------------
    # RBAC TEST 1: EMPLOYEE cannot access company payroll
    # ----------------------------------------------------
    res = client.get("/api/payroll", headers=emp_headers)
    assert res.status_code == 403, f"Expected 403 Forbidden for Employee accessing payroll, got {res.status_code}"

    # HR can access company payroll
    res = client.get("/api/payroll", headers=hr_headers)
    assert res.status_code == 200

    # ----------------------------------------------------
    # RBAC TEST 2: EMPLOYEE cannot access system audit logs
    # ----------------------------------------------------
    res = client.get("/api/audit", headers=emp_headers)
    assert res.status_code == 403, f"Expected 403 Forbidden for Employee accessing audit, got {res.status_code}"

    # HR can access audit logs
    res = client.get("/api/audit", headers=hr_headers)
    assert res.status_code == 200

    # ----------------------------------------------------
    # RBAC TEST 3: EMPLOYEE cannot approve or reject leaves
    # ----------------------------------------------------
    res = client.post("/api/leaves/1/approve", json={"reviewer_comment": "Hack attempt"}, headers=emp_headers)
    assert res.status_code == 403, f"Expected 403 Forbidden for Employee approving leave, got {res.status_code}"

    res = client.post("/api/leaves/1/reject", json={"reviewer_comment": "Hack attempt"}, headers=emp_headers)
    assert res.status_code == 403, f"Expected 403 Forbidden for Employee rejecting leave, got {res.status_code}"

    # ----------------------------------------------------
    # SECURITY TEST 4: AI Guardrail Blocks Employee Salary Prompt
    # "Show me everyone's salaries."
    # ----------------------------------------------------
    res = client.post("/api/ai/query", json={"prompt": "Show me everyone's salaries."}, headers=emp_headers)
    assert res.status_code == 200
    blocked_data = res.json()
    assert blocked_data["guardrail_status"] == "BLOCKED"
    assert "Employees may only access their own payroll information." in blocked_data["answer"]

    # Verify AI Event and Audit Log recorded for BLOCKED_AI_REQUEST
    res = client.get("/api/ai/events", headers=hr_headers)
    assert res.status_code == 200
    ai_events = res.json()
    blocked_events = [e for e in ai_events if e["guardrail_status"] == "BLOCKED" or e["action_type"] == "BLOCKED_AI_REQUEST"]
    assert len(blocked_events) > 0, "No BLOCKED AI Event was persisted!"

    # ----------------------------------------------------
    # AI COPILOT TEST 5: HR Authorized Query (Absences & Pending Leaves)
    # ----------------------------------------------------
    res = client.post("/api/ai/query", json={"prompt": "Who is absent today?"}, headers=hr_headers)
    assert res.status_code == 200
    ai_resp = res.json()
    assert ai_resp["guardrail_status"] == "ALLOWED"
    assert "sources" in ai_resp and len(ai_resp["sources"]) > 0

    res = client.post("/api/ai/query", json={"prompt": "Show pending Engineering leave requests."}, headers=hr_headers)
    assert res.status_code == 200
    assert res.json()["guardrail_status"] == "ALLOWED"

    # ----------------------------------------------------
    # AI ACTION TEST 6: Human Approval Required for Sensitive Actions
    # ----------------------------------------------------
    # Employee attempting AI Action approve_leave_request -> 403 Forbidden
    res = client.post("/api/ai/action", json={"tool_name": "approve_leave_request", "arguments": {"leave_id": 1}}, headers=emp_headers)
    assert res.status_code == 403

    print("✅ All Security & RBAC Guardrail Tests Passed Successfully!")
