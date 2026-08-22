from typing import Optional, List
from datetime import date, datetime, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.attendance import Attendance
from app.models.ai import AttendanceAnomaly


class AttendanceRepository:
    @staticmethod
    def get_by_id(db: Session, attendance_id: int) -> Optional[Attendance]:
        return db.query(Attendance).filter(Attendance.id == attendance_id).first()

    @staticmethod
    def get_by_employee_and_date(db: Session, employee_id: int, target_date: date) -> Optional[Attendance]:
        return db.query(Attendance).filter(
            Attendance.employee_id == employee_id,
            Attendance.date == target_date
        ).first()

    @staticmethod
    def check_in(
        db: Session,
        employee_id: int,
        target_date: date,
        check_in_time: datetime,
        status: str = "PRESENT",
        source: str = "WEB",
        notes: Optional[str] = None
    ) -> Attendance:
        record = AttendanceRepository.get_by_employee_and_date(db, employee_id, target_date)
        if record:
            record.check_in = check_in_time
            record.status = status
            record.source = source
            if notes:
                record.notes = notes
        else:
            record = Attendance(
                employee_id=employee_id,
                date=target_date,
                check_in=check_in_time,
                status=status,
                source=source,
                notes=notes,
                working_hours=0.0
            )
            db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def check_out(
        db: Session,
        employee_id: int,
        target_date: date,
        check_out_time: datetime,
        notes: Optional[str] = None
    ) -> Optional[Attendance]:
        record = AttendanceRepository.get_by_employee_and_date(db, employee_id, target_date)
        if not record:
            return None
        record.check_out = check_out_time
        if record.check_in:
            check_in_dt = record.check_in
            # Handle timezone awareness compatibility between SQLite and Postgres
            if check_in_dt.tzinfo is None and check_out_time.tzinfo is not None:
                check_in_dt = check_in_dt.replace(tzinfo=timezone.utc)
            elif check_in_dt.tzinfo is not None and check_out_time.tzinfo is None:
                check_out_time = check_out_time.replace(tzinfo=timezone.utc)
            delta = check_out_time - check_in_dt
            record.working_hours = round(max(0.0, delta.total_seconds() / 3600.0), 2)
        if notes:
            record.notes = (record.notes or "") + f" | Checkout notes: {notes}"
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def get_monthly_working_hours_sum(db: Session, employee_id: int, year: int, month: int) -> float:
        records = db.query(Attendance).filter(
            Attendance.employee_id == employee_id
        ).all()
        filtered = [r for r in records if r.date and r.date.year == year and r.date.month == month]
        return round(sum(r.working_hours or 0.0 for r in filtered), 2)

    @staticmethod
    def list_by_employee(
        db: Session,
        employee_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Attendance]:
        query = db.query(Attendance).filter(Attendance.employee_id == employee_id)
        if start_date:
            query = query.filter(Attendance.date >= start_date)
        if end_date:
            query = query.filter(Attendance.date <= end_date)
        return query.order_by(Attendance.date.desc()).all()

    @staticmethod
    def list_by_date(db: Session, target_date: date) -> List[Attendance]:
        return db.query(Attendance).filter(Attendance.date == target_date).all()

    @staticmethod
    def log_anomaly(
        db: Session,
        employee_id: int,
        target_date: date,
        anomaly_type: str,
        severity: str,
        description: str,
        detected_by: str = "AI_GUARDRAIL"
    ) -> AttendanceAnomaly:
        anomaly = AttendanceAnomaly(
            employee_id=employee_id,
            date=target_date,
            anomaly_type=anomaly_type,
            severity=severity,
            description=description,
            detected_by=detected_by,
            status="OPEN"
        )
        db.add(anomaly)
        db.commit()
        db.refresh(anomaly)
        return anomaly
