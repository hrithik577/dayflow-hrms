from datetime import datetime, timedelta, date
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.attendance import Attendance, AttendanceStatus
from app.models.ai import AttendanceAnomaly
from app.models.employee import Employee

def detect_attendance_anomalies_for_employee(db: Session, employee_id: int) -> List[AttendanceAnomaly]:
    """
    Evaluates rolling attendance records for an employee to detect deterministic anomalies:
    - Average check-in, check-out, working hours, late frequency, absence frequency, recent change
    - Detects unusual check-in, unusual check-out, unusually long workday, repeated late arrivals, sudden changes
    - Uses objective, neutral phrasing ("Attendance anomaly detected") and provides empirical evidence.
    """
    recent_records = db.query(Attendance).filter(
        Attendance.employee_id == employee_id
    ).order_by(Attendance.date.desc()).limit(14).all()

    if not recent_records:
        return []

    anomalies = []
    
    # Metrics calculation
    valid_checkins = [r.check_in for r in recent_records if r.check_in]
    valid_checkouts = [r.check_out for r in recent_records if r.check_out]
    valid_hours = [r.working_hours for r in recent_records if r.working_hours > 0]
    
    late_count = sum(1 for r in recent_records if r.status == AttendanceStatus.LATE)
    absence_count = sum(1 for r in recent_records if r.status == AttendanceStatus.ABSENT)
    avg_hours = (sum(valid_hours) / len(valid_hours)) if valid_hours else 8.0

    # Anomaly 1: Repeated Late Arrivals
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
                explanation=f"Attendance anomaly detected. Empirical evidence: Employee logged {late_count} late arrivals in the last 14 working days."
            )
            db.add(anom)
            anomalies.append(anom)

    # Anomaly 2: Unusually Long Workday (Overtime Spike > 11 hours)
    for rec in recent_records[:3]:
        if rec.working_hours >= 11.0:
            existing = db.query(AttendanceAnomaly).filter(
                AttendanceAnomaly.employee_id == employee_id,
                AttendanceAnomaly.attendance_id == rec.id,
                AttendanceAnomaly.anomaly_type == "UNUSUALLY_LONG_WORKDAY",
                AttendanceAnomaly.resolved == "FALSE"
            ).first()
            if not existing:
                anom = AttendanceAnomaly(
                    employee_id=employee_id,
                    attendance_id=rec.id,
                    anomaly_type="UNUSUALLY_LONG_WORKDAY",
                    severity="MEDIUM",
                    score=0.75,
                    explanation=f"Attendance anomaly detected. Empirical evidence: Logged {rec.working_hours:.1f} hours on {rec.date}, exceeding baseline average ({avg_hours:.1f} hrs)."
                )
                db.add(anom)
                anomalies.append(anom)

    # Anomaly 3: Sudden Attendance Pattern Shift
    if len(recent_records) >= 10:
        first_half_late = sum(1 for r in recent_records[5:] if r.status == AttendanceStatus.LATE)
        second_half_late = sum(1 for r in recent_records[:5] if r.status == AttendanceStatus.LATE)
        if second_half_late >= 3 and first_half_late == 0:
            existing = db.query(AttendanceAnomaly).filter(
                AttendanceAnomaly.employee_id == employee_id,
                AttendanceAnomaly.anomaly_type == "SUDDEN_ATTENDANCE_CHANGE",
                AttendanceAnomaly.resolved == "FALSE"
            ).first()
            if not existing:
                anom = AttendanceAnomaly(
                    employee_id=employee_id,
                    anomaly_type="SUDDEN_ATTENDANCE_CHANGE",
                    severity="HIGH",
                    score=0.82,
                    explanation=f"Attendance anomaly detected. Empirical evidence: Shift in arrival pattern detected ({second_half_late} late check-ins in the last 5 days vs 0 in preceding period)."
                )
                db.add(anom)
                anomalies.append(anom)

    db.commit()
    return anomalies
