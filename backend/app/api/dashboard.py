from datetime import date, datetime, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveBalance, LeaveRequestStatus
from app.models.user import User, UserRole
from app.models.audit import AuditLog, Notification
from app.models.ai import AIInsight, AttendanceAnomaly
from app.services.auth_service import get_current_user
from app.analytics.attention import generate_workforce_attention_signals

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/employee")
def get_employee_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="User has no linked employee profile")

    emp = current_user.employee
    today = date.today()

    # Today's Attendance State
    today_rec = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date == today
    ).first()

    status_str = "NOT_CHECKED_IN"
    check_in_str = None
    check_out_str = None
    working_hours = 0.0

    if today_rec:
        status_str = today_rec.status.value if hasattr(today_rec.status, 'value') else str(today_rec.status)
        if today_rec.check_in:
            check_in_str = today_rec.check_in.strftime("%I:%M %p")
        if today_rec.check_out:
            check_out_str = today_rec.check_out.strftime("%I:%M %p")
        working_hours = today_rec.working_hours

        if today_rec.check_in and not today_rec.check_out:
            delta = (datetime.now() - today_rec.check_in).total_seconds()
            working_hours = round(max(0.0, delta / 3600.0), 2)

    # Leave Balances
    balances = db.query(LeaveBalance).filter(LeaveBalance.employee_id == emp.id).all()
    bal_list = [
        {
            "type": b.leave_type.name if b.leave_type else "Leave",
            "allocated": b.allocated_days,
            "used": b.used_days,
            "remaining": b.remaining_days
        } for b in balances
    ]

    # Pending Leave Requests
    pending_leaves = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == emp.id,
        LeaveRequest.status == LeaveRequestStatus.PENDING
    ).count()

    # Mini Weekly Attendance Trend (Last 7 Days)
    seven_days_ago = today - timedelta(days=7)
    weekly_recs = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date >= seven_days_ago
    ).order_by(Attendance.date.asc()).all()

    weekly_trend = [
        {
            "day": r.date.strftime("%a"),
            "date": str(r.date),
            "hours": r.working_hours,
            "status": r.status.value if hasattr(r.status, 'value') else str(r.status)
        } for r in weekly_recs
    ]

    # Timeline Activities
    audits = db.query(AuditLog).filter(
        AuditLog.user_id == current_user.id
    ).order_by(AuditLog.created_at.desc()).limit(10).all()

    timeline = [
        {
            "id": a.id,
            "action": a.action,
            "description": a.new_value or a.action,
            "timestamp": a.created_at.strftime("%b %d, %H:%M")
        } for a in audits
    ]

    return {
        "employee_info": {
            "id": emp.id,
            "name": f"{emp.first_name} {emp.last_name}",
            "designation": emp.designation,
            "department": emp.department.name if emp.department else "General",
            "employee_code": emp.employee_code
        },
        "today_status": {
            "status": status_str,
            "check_in": check_in_str,
            "check_out": check_out_str,
            "working_hours": working_hours,
            "is_checked_in": bool(today_rec and today_rec.check_in and not today_rec.check_out)
        },
        "leave_balances": bal_list,
        "pending_leave_count": pending_leaves,
        "weekly_trend": weekly_trend,
        "timeline": timeline
    }

@router.get("/admin")
def get_admin_command_center(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    total_employees = db.query(Employee).filter(Employee.employment_status == "ACTIVE").count() or 1

    # Today's Attendance breakdown
    today_records = db.query(Attendance).filter(Attendance.date == today).all()
    present_cnt = sum(1 for r in today_records if r.status == AttendanceStatus.PRESENT)
    late_cnt = sum(1 for r in today_records if r.status == AttendanceStatus.LATE)
    leave_cnt = sum(1 for r in today_records if r.status == AttendanceStatus.LEAVE)
    absent_cnt = max(0, total_employees - (present_cnt + late_cnt + leave_cnt))

    attendance_rate = round(((present_cnt + late_cnt) / total_employees) * 100, 1)

    # Department Health Breakdown
    employees = db.query(Employee).filter(Employee.employment_status == "ACTIVE").all()
    dept_health_map = {}

    for emp in employees:
        dname = emp.department.name if emp.department else "General"
        if dname not in dept_health_map:
            dept_health_map[dname] = {"total": 0, "present": 0, "late": 0, "absent": 0}
        dept_health_map[dname]["total"] += 1

        rec = db.query(Attendance).filter(Attendance.employee_id == emp.id, Attendance.date == today).first()
        if rec:
            st = rec.status.value if hasattr(rec.status, 'value') else str(rec.status)
            if st in ["PRESENT", "LATE"]:
                if st == "LATE": dept_health_map[dname]["late"] += 1
                dept_health_map[dname]["present"] += 1
            elif st == "ABSENT":
                dept_health_map[dname]["absent"] += 1

    dept_health = []
    for dname, stats in dept_health_map.items():
        rate = round((stats["present"] / max(1, stats["total"])) * 100, 1)
        dept_health.append({
            "name": dname,
            "headcount": stats["total"],
            "present": stats["present"],
            "late": stats["late"],
            "absent": stats["absent"],
            "health_rate_pct": rate,
            "status": "HEALTHY" if rate >= 85 else ("REVIEW" if rate >= 70 else "ATTENTION")
        })

    # Generate workforce attention signals
    generate_workforce_attention_signals(db)

    # Active AI Insights / Attention Signals
    insights = db.query(AIInsight).order_by(AIInsight.created_at.desc()).limit(5).all()
    insight_list = [
        {
            "id": i.id,
            "title": i.title,
            "severity": i.severity,
            "explanation": i.explanation,
            "evidence": i.evidence,
            "recommendation": i.recommendation,
            "confidence": i.confidence,
            "status": i.status
        } for i in insights
    ]

    # Pending Leave Requests
    pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == LeaveRequestStatus.PENDING).count()

    # Recent Audit Logs (Live Activity Feed)
    recent_audits = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(15).all()
    live_feed = [
        {
            "id": a.id,
            "user": a.user.email if a.user else "System",
            "role": a.role or "SYSTEM",
            "action": a.action,
            "details": a.new_value or a.action,
            "time": a.created_at.strftime("%H:%M:%S")
        } for a in recent_audits
    ]

    # Attendance Trend (Last 7 Days Across Company)
    past_days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    trend_data = []
    for d in past_days:
        recs = db.query(Attendance).filter(Attendance.date == d).all()
        p_cnt = sum(1 for r in recs if r.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE])
        t_rate = round((p_cnt / total_employees) * 100, 1)
        trend_data.append({
            "date": d.strftime("%b %d"),
            "present_count": p_cnt,
            "attendance_rate": t_rate
        })

    return {
        "metrics": {
            "total_employees": total_employees,
            "present_today": present_cnt,
            "absent_today": absent_cnt,
            "on_leave_today": leave_cnt,
            "late_today": late_cnt,
            "attendance_rate": attendance_rate,
            "pending_leaves_count": pending_leaves
        },
        "department_health": dept_health,
        "ai_attention_signals": insight_list,
        "attendance_trend": trend_data,
        "live_activity_feed": live_feed
    }
