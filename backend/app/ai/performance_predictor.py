from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest
from app.models.ai import AttendanceAnomaly
from app.schemas.ai import PerformancePredictionResponse

def predict_employee_performance(db: Session, employee_id: int) -> PerformancePredictionResponse:
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        return PerformancePredictionResponse(
            employee_id=employee_id,
            employee_name="Unknown",
            department_name="General",
            predicted_performance_score=75.0,
            expected_grade="MEETS",
            burnout_risk_score=20.0,
            burnout_risk_level="LOW",
            retention_risk_level="LOW",
            contributing_factors={"Baseline Metric": 1.0},
            recommended_interventions=["Maintain standard 1-on-1 schedule."]
        )

    emp_name = f"{emp.first_name} {emp.last_name}"
    dept_name = emp.department.name if emp.department else "General"

    records = db.query(Attendance).filter(Attendance.employee_id == employee_id).all()
    total_days = len(records)
    
    if total_days == 0:
        return PerformancePredictionResponse(
            employee_id=employee_id,
            employee_name=emp_name,
            department_name=dept_name,
            predicted_performance_score=80.0,
            expected_grade="MEETS",
            burnout_risk_score=15.0,
            burnout_risk_level="LOW",
            retention_risk_level="LOW",
            contributing_factors={"Onboarding Baseline": 1.0},
            recommended_interventions=["Complete initial performance goal alignment."]
        )

    present_count = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
    late_count = sum(1 for r in records if r.status == AttendanceStatus.LATE)
    absent_count = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
    overtime_days = sum(1 for r in records if r.working_hours >= 10.0)
    avg_hours = sum(r.working_hours for r in records) / total_days

    anomalies_count = db.query(AttendanceAnomaly).filter(
        AttendanceAnomaly.employee_id == employee_id,
        AttendanceAnomaly.resolved == "FALSE"
    ).count()

    # 1. Performance Score Calculation (Base 85)
    score = 85.0
    score += (present_count / total_days) * 10.0
    score -= (late_count * 1.5)
    score -= (absent_count * 3.0)
    score -= (anomalies_count * 2.0)
    predicted_score = round(max(40.0, min(98.0, score)), 1)

    if predicted_score >= 88.0:
        expected_grade = "EXCEEDS"
    elif predicted_score >= 70.0:
        expected_grade = "MEETS"
    else:
        expected_grade = "NEEDS_IMPROVEMENT"

    # 2. Burnout Risk Calculation
    burnout_score = 15.0
    if overtime_days >= 3:
        burnout_score += 35.0
    if avg_hours >= 9.5:
        burnout_score += 25.0
    if late_count >= 3:
        burnout_score += 15.0
    burnout_score = round(min(95.0, burnout_score), 1)

    if burnout_score >= 60.0:
        burnout_level = "HIGH"
    elif burnout_score >= 35.0:
        burnout_level = "MEDIUM"
    else:
        burnout_level = "LOW"

    # 3. Retention / Turnover Risk Level
    if absent_count >= 3 or predicted_score < 65.0:
        retention_level = "HIGH"
    elif burnout_level == "HIGH" or late_count >= 4:
        retention_level = "MEDIUM"
    else:
        retention_level = "LOW"

    contributing_factors = {
        "Attendance Consistency": round((present_count / total_days) * 100, 1),
        "Working Hours Baseline": round(avg_hours, 1),
        "Overtime Stress Factor": round(overtime_days * 10.0, 1),
        "Punctuality Impact": round(max(0, 100 - (late_count * 10)), 1)
    }

    interventions = []
    if burnout_level == "HIGH":
        interventions.append("High burnout risk detected: Schedule workload re-balancing and mandatory time-off check.")
    if expected_grade == "NEEDS_IMPROVEMENT":
        interventions.append("Performance below benchmark: Initiate 30-day coaching plan and skill training.")
    if retention_level == "HIGH":
        interventions.append("Turnover risk elevated: HR Lead to conduct stay-interview and review compensation parity.")
    if not interventions:
        interventions.append("Employee profile healthy: Maintain regular bi-weekly 1-on-1 check-ins.")

    return PerformancePredictionResponse(
        employee_id=employee_id,
        employee_name=emp_name,
        department_name=dept_name,
        predicted_performance_score=predicted_score,
        expected_grade=expected_grade,
        burnout_risk_score=burnout_score,
        burnout_risk_level=burnout_level,
        retention_risk_level=retention_level,
        contributing_factors=contributing_factors,
        recommended_interventions=interventions
    )
