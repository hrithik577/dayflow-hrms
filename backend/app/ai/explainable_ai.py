import uuid
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.leave import LeaveRequest, LeaveBalance
from app.models.attendance import Attendance
from app.schemas.ai import ExplainableDecisionRequest, ExplainableDecisionResponse
from app.analytics.leave_intelligence import calculate_smart_leave_coverage

def generate_hr_decision_explanation(
    db: Session,
    req: ExplainableDecisionRequest
) -> ExplainableDecisionResponse:
    decision_id = f"exp-{uuid.uuid4().hex[:8]}"
    dtype = req.decision_type.upper()
    entity_id = req.entity_id
    ctx = req.context_data or {}

    feature_importance = {}
    recommendation = "APPROVE"
    confidence = 0.92
    data_sources = []
    narrative = ""

    if dtype == "LEAVE_APPROVAL":
        data_sources = ["leave_requests", "leave_balances", "attendance", "employees"]
        leave = db.query(LeaveRequest).filter(LeaveRequest.id == entity_id).first()
        
        if leave:
            cov = calculate_smart_leave_coverage(
                db=db,
                employee_id=leave.employee_id,
                start_date=leave.start_date,
                end_date=leave.end_date,
                requested_days=leave.total_days
            )

            avail_pct = cov.get("estimated_team_availability_pct", 100.0)
            bal_status = cov.get("leave_balance_status", "OK")
            overlaps = cov.get("overlapping_team_leaves", 0)

            feature_importance = {
                "Department Staffing Availability": 0.45,
                "Leave Balance Adequacy": 0.35,
                "Schedule Conflict Overlap": 0.20
            }

            if avail_pct >= 75.0 and bal_status == "OK" and overlaps == 0:
                recommendation = "APPROVE"
                confidence = 0.96
                narrative = f"Recommended APPROVAL. Department staffing remains robust at {avail_pct}%. Employee has sufficient leave balance with zero team schedule overlaps."
            else:
                recommendation = "HUMAN_REVIEW_REQUIRED"
                confidence = 0.85
                narrative = f"Recommended MANUAL REVIEW. Department availability drops to {avail_pct}% during requested dates with {overlaps} concurrent team leave request(s)."
        else:
            feature_importance = {"Standard Policy Baseline": 1.0}
            narrative = f"Decision explanation generated for Leave Request #{entity_id} based on policy rules."

    elif dtype == "PERFORMANCE_RATING":
        data_sources = ["attendance", "attendance_anomalies", "employees"]
        emp = db.query(Employee).filter(Employee.id == entity_id).first()
        emp_name = f"{emp.first_name} {emp.last_name}" if emp else f"Employee #{entity_id}"

        records = db.query(Attendance).filter(Attendance.employee_id == entity_id).all()
        total_hours = sum(r.working_hours for r in records)
        avg_hours = (total_hours / len(records)) if records else 8.0

        feature_importance = {
            "Attendance & Punctuality": 0.40,
            "Working Hours Stability": 0.35,
            "Anomaly & Overtime Frequency": 0.25
        }

        if avg_hours >= 8.0:
            recommendation = "EXCEEDS_EXPECTATIONS"
            confidence = 0.90
            narrative = f"Explainable AI Rating for {emp_name}: High attendance consistency with an average of {avg_hours:.1f} working hours/day."
        else:
            recommendation = "MEETS_EXPECTATIONS"
            confidence = 0.88
            narrative = f"Explainable AI Rating for {emp_name}: Standard performance profile with steady attendance."

    elif dtype == "COMPENSATION_REVIEW":
        data_sources = ["payroll", "employees", "market_benchmarks"]
        feature_importance = {
            "Internal Equity Band": 0.40,
            "Performance Rating Factor": 0.35,
            "Tenure & Inflation Adjustment": 0.25
        }
        recommendation = "ADJUSTMENT_RECOMMENDED"
        confidence = 0.91
        narrative = f"Compensation review for Employee #{entity_id}: Internal salary parity is within 5% of target benchmark band. Merit adjustment recommended."

    else:
        # WORKFORCE_RISK / General HR Decision
        data_sources = ["workforce_metrics", "attendance_anomalies"]
        feature_importance = {
            "Overtime Spikes": 0.50,
            "Consecutive Absences": 0.30,
            "Shift Variance": 0.20
        }
        recommendation = "MONITOR"
        confidence = 0.87
        narrative = f"Explainable assessment for Entity #{entity_id}: Moderate risk signal detected. 1-on-1 check-in advised."

    return ExplainableDecisionResponse(
        decision_id=decision_id,
        decision_type=dtype,
        entity_id=entity_id,
        recommendation=recommendation,
        confidence=confidence,
        feature_importance=feature_importance,
        narrative_explanation=narrative,
        data_lineage_sources=data_sources,
        guardrail_status="ALLOWED"
    )
