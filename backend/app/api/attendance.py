from datetime import datetime, date, time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.websocket import manager as ws_manager
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee
from app.models.user import User
from app.schemas.attendance import CheckInRequest, CheckOutRequest, AttendanceOut, AttendanceStatsOut
from app.services.auth_service import get_current_user
from app.services.audit_service import log_audit_event
from app.analytics.anomaly import detect_attendance_anomalies_for_employee

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

@router.post("/check-in", response_model=AttendanceOut)
async def check_in(
    req: CheckInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="User has no linked employee profile")

    emp = current_user.employee
    today = date.today()
    now = datetime.now()

    existing = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date == today
    ).first()

    if existing and existing.check_in:
        raise HTTPException(status_code=400, detail=f"Already checked in today at {existing.check_in.strftime('%H:%M:%S')}")

    # Standard late arrival threshold: 09:30 AM
    late_threshold = time(9, 30, 0)
    attendance_status = AttendanceStatus.PRESENT
    if now.time() > late_threshold:
        attendance_status = AttendanceStatus.LATE

    if existing:
        existing.check_in = now
        existing.status = attendance_status
        existing.notes = req.notes or existing.notes
        rec = existing
    else:
        rec = Attendance(
            employee_id=emp.id,
            date=today,
            check_in=now,
            status=attendance_status,
            source=req.source or "WEB",
            notes=req.notes
        )
        db.add(rec)

    db.commit()
    db.refresh(rec)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        action="ATTENDANCE_CHECK_IN",
        entity_type="ATTENDANCE",
        entity_id=str(rec.id),
        new_value=f"Checked in at {now.strftime('%H:%M:%S')} ({rec.status.value})"
    )

    # Real-time WebSocket event broadcast
    await ws_manager.broadcast("ATTENDANCE_CHECK_IN", {
        "employee_id": emp.id,
        "employee_name": f"{emp.first_name} {emp.last_name}",
        "department": emp.department.name if emp.department else "General",
        "status": rec.status.value,
        "check_in": now.strftime("%H:%M:%S")
    })

    return AttendanceOut(
        id=rec.id,
        employee_id=rec.employee_id,
        employee_name=f"{emp.first_name} {emp.last_name}",
        department_name=emp.department.name if emp.department else "General",
        date=rec.date,
        check_in=rec.check_in,
        check_out=rec.check_out,
        status=rec.status.value if hasattr(rec.status, 'value') else str(rec.status),
        working_hours=rec.working_hours,
        source=rec.source,
        notes=rec.notes
    )

@router.post("/check-out", response_model=AttendanceOut)
async def check_out(
    req: CheckOutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="User has no linked employee profile")

    emp = current_user.employee
    today = date.today()
    now = datetime.now()

    rec = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date == today
    ).first()

    if not rec or not rec.check_in:
        raise HTTPException(status_code=400, detail="Cannot check out without checking in first")

    if rec.check_out:
        raise HTTPException(status_code=400, detail=f"Already checked out today at {rec.check_out.strftime('%H:%M:%S')}")

    rec.check_out = now
    delta_seconds = (now - rec.check_in).total_seconds()
    rec.working_hours = round(max(0.0, delta_seconds / 3600.0), 2)
    if req.notes:
        rec.notes = req.notes

    db.commit()
    db.refresh(rec)

    # Run Anomaly Detector for employee
    detect_attendance_anomalies_for_employee(db, emp.id)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        action="ATTENDANCE_CHECK_OUT",
        entity_type="ATTENDANCE",
        entity_id=str(rec.id),
        new_value=f"Checked out at {now.strftime('%H:%M:%S')}, working hours: {rec.working_hours} hrs"
    )

    # Broadcast WebSocket event
    await ws_manager.broadcast("ATTENDANCE_CHECK_OUT", {
        "employee_id": emp.id,
        "employee_name": f"{emp.first_name} {emp.last_name}",
        "check_out": now.strftime("%H:%M:%S"),
        "working_hours": rec.working_hours
    })

    return AttendanceOut(
        id=rec.id,
        employee_id=rec.employee_id,
        employee_name=f"{emp.first_name} {emp.last_name}",
        department_name=emp.department.name if emp.department else "General",
        date=rec.date,
        check_in=rec.check_in,
        check_out=rec.check_out,
        status=rec.status.value if hasattr(rec.status, 'value') else str(rec.status),
        working_hours=rec.working_hours,
        source=rec.source,
        notes=rec.notes
    )

@router.get("/me", response_model=List[AttendanceOut])
def get_my_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.employee:
        return []

    emp = current_user.employee
    records = db.query(Attendance).filter(
        Attendance.employee_id == emp.id
    ).order_by(Attendance.date.desc()).all()

    return [
        AttendanceOut(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=f"{emp.first_name} {emp.last_name}",
            department_name=emp.department.name if emp.department else "General",
            date=r.date,
            check_in=r.check_in,
            check_out=r.check_out,
            status=r.status.value if hasattr(r.status, 'value') else str(r.status),
            working_hours=r.working_hours,
            source=r.source,
            notes=r.notes
        ) for r in records
    ]

@router.get("", response_model=List[AttendanceOut])
def get_all_attendance(
    target_date: Optional[date] = Query(None),
    department_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Attendance).join(Employee)

    if target_date:
        query = query.filter(Attendance.date == target_date)
    if department_id:
        query = query.filter(Employee.department_id == department_id)
    if status_filter:
        query = query.filter(Attendance.status == status_filter.upper())

    records = query.order_by(Attendance.date.desc(), Attendance.id.desc()).limit(100).all()

    result = []
    for r in records:
        emp = r.employee
        result.append(AttendanceOut(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            department_name=emp.department.name if emp and emp.department else "General",
            date=r.date,
            check_in=r.check_in,
            check_out=r.check_out,
            status=r.status.value if hasattr(r.status, 'value') else str(r.status),
            working_hours=r.working_hours,
            source=r.source,
            notes=r.notes
        ))

    return result

@router.get("/stats", response_model=AttendanceStatsOut)
def get_attendance_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    total = db.query(Employee).filter(Employee.employment_status == "ACTIVE").count() or 1
    
    today_records = db.query(Attendance).filter(Attendance.date == today).all()
    present_cnt = sum(1 for r in today_records if r.status == AttendanceStatus.PRESENT)
    late_cnt = sum(1 for r in today_records if r.status == AttendanceStatus.LATE)
    leave_cnt = sum(1 for r in today_records if r.status == AttendanceStatus.LEAVE)
    
    accounted = len(today_records)
    absent_cnt = max(0, total - (present_cnt + late_cnt + leave_cnt))

    rate = round(((present_cnt + late_cnt) / max(1, total)) * 100, 1)

    return AttendanceStatsOut(
        total_employees=total,
        present_today=present_cnt,
        absent_today=absent_cnt,
        on_leave_today=leave_cnt,
        late_today=late_cnt,
        attendance_rate=rate
    )
