from datetime import datetime, date, timedelta
from typing import List
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest
from app.models.ai import AIInsight

def generate_workforce_attention_signals(db: Session) -> List[AIInsight]:
    """
    Scans workforce metrics to generate evidence-backed Attention Signals.
    Uses neutral, objective language to highlight operational review needs.
    """
    employees = db.query(Employee).filter(Employee.employment_status == "ACTIVE").all()
    insights = []

    for emp in employees:
        # Fetch 30-day attendance
        records = db.query(Attendance).filter(
            Attendance.employee_id == emp.id
        ).order_by(Attendance.date.desc()).limit(20).all()

        if len(records) < 5:
            continue

        late_count = sum(1 for r in records if r.status == AttendanceStatus.LATE)
        absent_count = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
        total_working_hours = sum(r.working_hours for r in records)
        avg_hours = total_working_hours / max(1, len(records))

        # Check pending/recent leaves
        leaves_count = db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == emp.id
        ).count()

        if late_count >= 4 or absent_count >= 2:
            existing = db.query(AIInsight).filter(
                AIInsight.employee_id == emp.id,
                AIInsight.insight_type == "ATTENDANCE_ATTENTION",
                AIInsight.status == "NEW"
            ).first()

            if not existing:
                evidence_text = f"Logged {late_count} late check-ins and {absent_count} absences in last 20 days. Avg hours: {avg_hours:.1f}h/day."
                insight = AIInsight(
                    employee_id=emp.id,
                    department_id=emp.department_id,
                    insight_type="ATTENDANCE_ATTENTION",
                    severity="HIGH" if absent_count >= 2 else "MEDIUM",
                    title=f"Workforce Attention Signal: {emp.first_name} {emp.last_name}",
                    explanation=f"Attendance variation detected for {emp.first_name} {emp.last_name} in {emp.department.name if emp.department else 'Department'}.",
                    evidence=evidence_text,
                    recommendation="Recommended action: 1-on-1 manager check-in to review workload and scheduling support.",
                    confidence=0.84,
                    status="NEW"
                )
                db.add(insight)
                insights.append(insight)

    db.commit()
    return insights
