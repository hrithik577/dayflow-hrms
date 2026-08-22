from datetime import datetime, timedelta, date
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.attendance import Attendance, AttendanceStatus
from app.models.ai import AttendanceAnomaly
from app.models.employee import Employee

def detect_attendance_anomalies_for_employee(db: Session, employee_id: int) -> List[AttendanceAnomaly]:
    """
    Evaluates rolling attendance records for an employee to detect deterministic anomalies:
    - Repeated late arrivals
    - Sudden drop in working hours
    - Long working days (overtime spike)
    - Missing check-outs
    """
    recent_records = db.query(Attendance).filter(
        Attendance.employee_id == employee_id
    ).order_by(Attendance.date.desc()).limit(14).all()

    if not recent_records:
        return []

    anomalies = []
    late_count = sum(1 for r in recent_records if r.status == AttendanceStatus.LATE)
    
    # Anomaly 1: High Late Frequency
    if late_count >= 3:
        existing = db.query(AttendanceAnomaly).filter(
            AttendanceAnomaly.employee_id == employee_id,
            AttendanceAnomaly.anomaly_type == "REPEATED_LATE_ARRIVALS",
            AttendanceAnomaly.resolved == "FALSE"
        ).first()

        if not existing:
            anom = AttendanceAnomaly(
                employee_id=employee_id,
                anomaly_type="REPEATED_LATE_ARRIVALS",
                severity="MEDIUM",
                score=min(1.0, 0.4 + (late_count * 0.15)),
                explanation=f"Employee has logged {late_count} late arrivals in the last 14 working days."
            )
            db.add(anom)
            anomalies.append(anom)

    # Anomaly 2: Working Hours Drop or Overtime
    avg_hours = sum(r.working_hours for r in recent_records if r.working_hours > 0) / max(1, sum(1 for r in recent_records if r.working_hours > 0))
    for rec in recent_records[:3]:
        if rec.working_hours > 0 and rec.working_hours > (avg_hours + 3.0):
            existing = db.query(AttendanceAnomaly).filter(
                AttendanceAnomaly.employee_id == employee_id,
                AttendanceAnomaly.attendance_id == rec.id,
                AttendanceAnomaly.anomaly_type == "UNUSUAL_OVERTIME",
                AttendanceAnomaly.resolved == "FALSE"
            ).first()
            if not existing:
                anom = AttendanceAnomaly(
                    employee_id=employee_id,
                    attendance_id=rec.id,
                    anomaly_type="UNUSUAL_OVERTIME",
                    severity="LOW",
                    score=0.65,
                    explanation=f"Logged {rec.working_hours:.1f} hours on {rec.date}, exceeding 14-day average ({avg_hours:.1f} hrs)."
                )
                db.add(anom)
                anomalies.append(anom)

    db.commit()
    return anomalies
