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
    except Exception:
        db.rollback()
    finally:
        db.close()

def test_employee_profile_and_document_management():
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

    # 3. GET /api/employees/me - Self profile access
    res = client.get("/api/employees/me", headers=emp_headers)
    assert res.status_code == 200
    emp_profile = res.json()
    assert emp_profile["email"] == "rahul.sharma@dayflow.com"
    assert emp_profile["salary_structure"] is not None, "Self profile should include salary structure"
    emp_id = emp_profile["id"]

    # 4. GET another employee profile as Employee -> salary_structure should be None (restricted)
    res = client.get("/api/employees", headers=emp_headers)
    assert res.status_code == 200
    all_emps = res.json()
    other_emp = next((e for e in all_emps if e["id"] != emp_id), None)
    if other_emp:
        res = client.get(f"/api/employees/{other_emp['id']}", headers=emp_headers)
        assert res.status_code == 200
        other_profile = res.json()
        assert other_profile["salary_structure"] is None, "Employee viewing another employee profile should NOT see salary structure"

        # HR viewing other employee profile -> salary_structure SHOULD be populated
        res = client.get(f"/api/employees/{other_emp['id']}", headers=hr_headers)
        assert res.status_code == 200
        hr_view_other = res.json()
        assert hr_view_other["salary_structure"] is not None, "HR viewing another employee profile should see salary structure"

    # 5. Employee updates self profile (phone, address - allowed)
    patch_data = {"phone": "+1 (555) 999-8888", "address": "456 Mission Street"}
    res = client.patch(f"/api/employees/{emp_id}", json=patch_data, headers=emp_headers)
    assert res.status_code == 200
    updated_profile = res.json()
    assert updated_profile["phone"] == "+1 (555) 999-8888"
    assert updated_profile["address"] == "456 Mission Street"

    # 6. Employee attempts to update restricted field (first_name / designation -> 403 Forbidden)
    res = client.patch(f"/api/employees/{emp_id}", json={"designation": "CEO & Founder"}, headers=emp_headers)
    assert res.status_code == 403, "Employee updating designation should be blocked with 403"

    # 7. Employee uploads document to own profile
    doc_payload = {
        "document_type": "CONTRACT",
        "file_name": "Test_Contract_2026.pdf",
        "file_url": "https://dayflow.internal/docs/test_contract.pdf"
    }
    res = client.post(f"/api/employees/{emp_id}/documents", json=doc_payload, headers=emp_headers)
    assert res.status_code == 201
    created_doc = res.json()
    assert created_doc["file_name"] == "Test_Contract_2026.pdf"

    print("✅ All Employee Profile & Document Management API Tests Passed!")
