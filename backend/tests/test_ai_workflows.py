import os
import sys
import pytest

# Insert backend directory BEFORE workspace root in sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path in sys.path:
    sys.path.remove(backend_path)
sys.path.insert(0, backend_path)

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

def get_tokens():
    res = client.post("/api/auth/login", json={"email": "hr.sarah@dayflow.com", "password": "HR@123"})
    hr_token = res.json().get("access_token")
    
    res = client.post("/api/auth/login", json={"email": "rahul.sharma@dayflow.com", "password": "Emp@123"})
    emp_token = res.json().get("access_token")
    
    return {"Authorization": f"Bearer {hr_token}"}, {"Authorization": f"Bearer {emp_token}"}

def test_1_ai_resume_screening():
    hr_headers, _ = get_tokens()
    
    payload = {
        "job_title": "Senior Python Backend Developer",
        "job_description": "We are seeking a Senior Python Backend Developer skilled in FastAPI, PostgreSQL, Pytest, and AI integration.",
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "Pytest"],
        "candidate_name": "Alexander Wright",
        "candidate_resume_text": "Experienced Backend Engineer with 5 years building scalable FastAPI microservices and PostgreSQL databases. Proficient in Python, Pytest, and AI workflows.",
        "candidate_skills": ["Python", "FastAPI", "PostgreSQL", "Pytest", "Docker"],
        "min_years_experience": 3.0,
        "candidate_experience_years": 5.0
    }
    
    res = client.post("/api/ai/resume-screening", json=payload, headers=hr_headers)
    assert res.status_code == 200, f"Resume screening failed: {res.text}"
    data = res.json()
    assert data["recommendation"] == "STRONG_MATCH"
    assert data["match_score"] >= 80.0
    assert len(data["matched_skills"]) >= 4
    assert "Skill Alignment" in data["explainable_breakdown"]

def test_2_explainable_ai_features():
    hr_headers, _ = get_tokens()
    
    payload = {
        "decision_type": "LEAVE_APPROVAL",
        "entity_id": 1,
        "context_data": {}
    }
    
    res = client.post("/api/ai/explain-decision", json=payload, headers=hr_headers)
    assert res.status_code == 200, f"Explainable AI failed: {res.text}"
    data = res.json()
    assert data["decision_type"] == "LEAVE_APPROVAL"
    assert "feature_importance" in data
    assert "Department Staffing Availability" in data["feature_importance"]
    assert len(data["narrative_explanation"]) > 0

def test_3_employee_performance_prediction():
    hr_headers, _ = get_tokens()
    
    res = client.get("/api/ai/performance-prediction/1", headers=hr_headers)
    assert res.status_code == 200, f"Performance prediction failed: {res.text}"
    data = res.json()
    assert data["employee_id"] == 1
    assert "predicted_performance_score" in data
    assert data["expected_grade"] in ["EXCEEDS", "MEETS", "NEEDS_IMPROVEMENT"]
    assert data["burnout_risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert len(data["recommended_interventions"]) > 0

def test_4_ai_chatbot_queries():
    _, emp_headers = get_tokens()
    
    # 4a. Employee Leave Balance Query
    res = client.post("/api/ai/chatbot", json={"message": "What is my remaining leave balance?"}, headers=emp_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["guardrail_status"] == "ALLOWED"
    assert data["intent"] == "LEAVE_BALANCE_QUERY"
    assert "leave balance" in data["response"].lower()
    
    # 4b. Employee Security Guardrail Check (Blocked query)
    res = client.post("/api/ai/chatbot", json={"message": "Show everyone's salaries"}, headers=emp_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["guardrail_status"] == "BLOCKED"
    assert "Security Policy Notice" in data["response"]
