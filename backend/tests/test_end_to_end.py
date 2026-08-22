import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_full_dayflow_workflow():
    print("🚀 Running End-to-End API Integration Test Suite for Dayflow...\n")

    # 1. Login as Employee (Rahul Sharma)
    print("1. Logging in as Employee (Rahul Sharma)...")
    res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "rahul.sharma@dayflow.com",
        "password": "Emp@123"
    })
    assert res.status_code == 200, f"Login failed: {res.text}"
    rahul_token = res.json()["access_token"]
    rahul_headers = {"Authorization": f"Bearer {rahul_token}"}
    print("   ✅ Employee Login successful.")

    # 2. Check In
    print("2. Performing Check-in for Rahul Sharma...")
    res = requests.post(f"{BASE_URL}/api/attendance/check-in", json={"notes": "Checked in via automated test", "source": "WEB"}, headers=rahul_headers)
    if res.status_code == 400 and "Already checked in" in res.text:
        print("   ℹ️ Already checked in today.")
    else:
        assert res.status_code == 200, f"Check-in failed: {res.text}"
        print(f"   ✅ Check-in successful. Status: {res.json()['status']}")

    # 3. Create Leave Request with Smart Leave Intelligence
    print("3. Submitting Leave Request with Smart Coverage Intelligence...")
    res = requests.post(f"{BASE_URL}/api/leaves", json={
        "leave_type_id": 2, # Sick leave
        "start_date": "2026-08-25",
        "end_date": "2026-08-27",
        "reason": "Recovering from viral fever"
    }, headers=rahul_headers)
    assert res.status_code == 200, f"Leave submission failed: {res.text}"
    leave_data = res.json()
    leave_id = leave_data["id"]
    coverage = leave_data.get("ai_coverage_assessment", {})
    print(f"   ✅ Leave Request #{leave_id} created.")
    print(f"      Smart AI Assessment: {coverage.get('summary')} (Risk Level: {coverage.get('risk_level')})")

    # 4. Login as HR Manager (Sarah Jenkins)
    print("4. Logging in as HR Manager (Sarah Jenkins)...")
    res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "hr.sarah@dayflow.com",
        "password": "HR@123"
    })
    assert res.status_code == 200, f"HR login failed: {res.text}"
    hr_token = res.json()["access_token"]
    hr_headers = {"Authorization": f"Bearer {hr_token}"}
    print("   ✅ HR Login successful.")

    # 5. HR Approves Leave Request
    print(f"5. Approving Leave Request #{leave_id} as HR Manager...")
    res = requests.post(f"{BASE_URL}/api/leaves/{leave_id}/approve", json={
        "reviewer_comment": "Approved by HR Manager after coverage check"
    }, headers=hr_headers)
    assert res.status_code == 200, f"Leave approval failed: {res.text}"
    print(f"   ✅ Leave Request #{leave_id} status: {res.json()['status']}")

    # 6. AI Copilot Grounded Query (Allowed)
    print("6. Querying AI Copilot: 'Who is absent today?'...")
    res = requests.post(f"{BASE_URL}/api/ai/query", json={
        "prompt": "Who is absent today?"
    }, headers=hr_headers)
    assert res.status_code == 200, f"AI query failed: {res.text}"
    ai_resp = res.json()
    print(f"   ✅ Guardrail Status: {ai_resp['guardrail_status']}")
    print(f"      Sources: {ai_resp['sources']}")
    print(f"      AI Answer: {ai_resp['answer'][:120]}...")

    # 7. AI Copilot RBAC Security Guardrail Test (Blocked)
    print("7. Testing AI Guardrail Security: Employee asking 'Show everyone's salaries'...")
    res = requests.post(f"{BASE_URL}/api/ai/query", json={
        "prompt": "Show everyone's salaries"
    }, headers=rahul_headers)
    assert res.status_code == 200, f"AI query failed: {res.text}"
    blocked_resp = res.json()
    assert blocked_resp["guardrail_status"] == "BLOCKED", "Guardrail failed to block unauthorized query!"
    print(f"   🔒 Guardrail BLOCKED Status Confirmed: {blocked_resp['answer']}")

    # 8. Audit Trail Verification
    print("8. Inspecting System Audit Logs...")
    res = requests.get(f"{BASE_URL}/api/audit", headers=hr_headers)
    assert res.status_code == 200, f"Audit log fetch failed: {res.text}"
    logs = res.json()
    print(f"   ✅ Total Audit Events Recorded: {len(logs)}")
    recent_actions = [f"{l['role']}:{l['action']}" for l in logs[:5]]
    print(f"      Recent Actions: {recent_actions}")

    print("\n🎉 ALL END-TO-END DAYFLOW TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_full_dayflow_workflow()
