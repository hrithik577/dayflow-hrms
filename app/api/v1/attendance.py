from typing import List, Optional
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.attendance import AttendanceOut, CheckInRequest, CheckOutRequest
from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.audit_repository import AuditRepository

router = APIRouter()


@router.post("/check-in", response_model=AttendanceOut)
def check_in(payload: CheckInRequest, db: Session = Depends(get_db)):
    """Record check-in event for employee."""
    today = date.today()
    now_utc = datetime.now(timezone.utc)

    # Calculate status based on check-in time (e.g. late if past 09:30 AM)
    status_str = "LATE" if now_utc.hour >= 9 and now_utc.minute > 30 else "PRESENT"

    record = AttendanceRepository.check_in(
        db,
        employee_id=payload.employee_id,
        target_date=today,
        check_in_time=now_utc,
        status=status_str,
        source=payload.source,
        notes=payload.notes
    )

    AuditRepository.log_event(
        db,
        action="check_in",
        entity_type="attendance",
        entity_id=str(record.id),
        source=payload.source
    )
    return record


@router.post("/check-out", response_model=AttendanceOut)
def check_out(payload: CheckOutRequest, db: Session = Depends(get_db)):
    """Record check-out event for employee."""
    today = date.today()
    now_utc = datetime.now(timezone.utc)

    record = AttendanceRepository.check_out(
        db,
        employee_id=payload.employee_id,
        target_date=today,
        check_out_time=now_utc,
        notes=payload.notes
    )
    if not record:
        raise HTTPException(status_code=400, detail="Check-in record for today not found")

    AuditRepository.log_event(
        db,
        action="check_out",
        entity_type="attendance",
        entity_id=str(record.id)
    )
    return record


@router.get("/employee/{employee_id}", response_model=List[AttendanceOut])
def get_employee_attendance(
    employee_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Retrieve attendance history for an employee."""
    return AttendanceRepository.list_by_employee(db, employee_id, start_date=start_date, end_date=end_date)
