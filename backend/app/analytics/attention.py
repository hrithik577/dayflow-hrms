from datetime import datetime, date, timedelta
from typing import List
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveRequestStatus
from app.models.department import Department
from app.models.ai import AIInsight

def generate_workforce_attention_signals(db: Session) -> List[AIInsight]:
    """
    Scans workforce metrics to generate evidence-backed Workforce Attention Signals.
    Categorized into: Healthy, Review, Attention.
    Factors evaluated: attendance changes, overtime changes, leave frequency, staffing pressure, working pattern changes.
    Does NOT use any protected characteristics.
    Every signal contains: evidence, confidence, recommendation, timestamp.
    """
    employees = db.query(Employee).filter(Employee.employment_status == "ACTIVE").all()
    departments = db.query(Department).all()
    insights = []

    # 1. Department Staffing Pressure Check
    for dept in departments:
        dept_emps = [e for e in employees if e.department_id == dept.id]
        total_dept = len(dept_emps)
        if total_dept == 0:
            continue

        pending_leaves_count = db.query(LeaveRequest).join(Employee, LeaveRequest.employee_id == Employee.id).filter(
            Employee.department_id == dept.id,
            LeaveRequest.status == LeaveRequestStatus.PENDING
        ).count()

        if pending_leaves_count >= 2 or (pending_leaves_count / total_dept) >= 0.3:
            existing = db.query(AIInsight).filter(
                AIInsight.department_id == dept.id,
                AIInsight.insight_type == "STAFFING_PRESSURE",
                AIInsight.status == "NEW"
            ).first()

            if not existing:
                evidence_text = f"Department '{dept.name}' has {pending_leaves_count} pending leave requests across {total_dept} total headcount ({round((pending_leaves_count/total_dept)*100, 1)}% potential absence)."
                insight = AIInsight(
                    department_id=dept.id,
                    insight_type="STAFFING_PRESSURE",
                    severity="HIGH" if pending_leaves_count >= 3 else "MEDIUM",
                    title=f"Workforce Attention Signal: Staffing Pressure in {dept.name}",
                    explanation=f"Staffing pressure detected in {dept.name} department due to concurrent pending leave requests.",
                    evidence=evidence_text,
                    recommendation="Recommended action: Review overlapping leave schedules and stagger vacation approvals.",
                    confidence=0.88,
                    status="NEW"
                )
                db.add(insight)
                insights.append(insight)

    # 2. Individual Employee Working Pattern Signals
    for emp in employees:
        records = db.query(Attendance).filter(
            Attendance.employee_id == emp.id
        ).order_by(Attendance.date.desc()).limit(20).all()

        if len(records) < 5:
            continue

        late_count = sum(1 for r in records if r.status == AttendanceStatus.LATE)
        absent_count = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
        overtime_days = sum(1 for r in records if r.working_hours >= 10.0)
        total_working_hours = sum(r.working_hours for r in records)
        avg_hours = total_working_hours / max(1, len(records))

        signal_status = "Healthy"
        if late_count >= 4 or absent_count >= 2 or overtime_days >= 3:
            signal_status = "Attention"
        elif late_count >= 2 or overtime_days >= 1:
            signal_status = "Review"

        if signal_status in ["Review", "Attention"]:
            existing = db.query(AIInsight).filter(
                AIInsight.employee_id == emp.id,
                AIInsight.insight_type == "WORKFORCE_ATTENTION",
                AIInsight.status == "NEW"
            ).first()

            if not existing:
                evidence_text = f"Logged {late_count} late arrivals, {absent_count} absences, and {overtime_days} overtime days (>=10 hrs) in last 20 days. Avg hours: {avg_hours:.1f}h/day."
                insight = AIInsight(
                    employee_id=emp.id,
                    department_id=emp.department_id,
                    insight_type="WORKFORCE_ATTENTION",
                    severity="HIGH" if signal_status == "Attention" else "MEDIUM",
                    title=f"Workforce Signal [{signal_status}]: {emp.first_name} {emp.last_name}",
                    explanation=f"Workforce attention signal trigger ({signal_status}) for {emp.first_name} {emp.last_name} in {emp.department.name if emp.department else 'General'}.",
                    evidence=evidence_text,
                    recommendation="Recommended action: Conduct 1-on-1 operational check-in to evaluate workload distribution.",
                    confidence=0.86,
                    status="NEW"
                )
                db.add(insight)
                insights.append(insight)

    db.commit()
    return insights
