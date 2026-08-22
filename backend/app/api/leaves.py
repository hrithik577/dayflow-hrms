from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.websocket import manager as ws_manager
from app.models.leave import LeaveRequest, LeaveBalance, LeaveType, LeaveRequestStatus
from app.models.employee import Employee
from app.models.user import User, UserRole
from app.models.audit import Notification
from app.schemas.leave import LeaveRequestCreate, LeaveRequestUpdate, LeaveApprovalRequest, LeaveRejectionRequest, LeaveRequestOut, LeaveBalanceOut, LeaveTypeOut
from app.services.auth_service import get_current_user, require_roles
from app.services.audit_service import log_audit_event
from app.analytics.leave_intelligence import calculate_smart_leave_coverage

router = APIRouter(prefix="/api/leaves", tags=["Leaves"])

@router.get("/types", response_model=List[LeaveTypeOut])
def get_leave_types(db: Session = Depends(get_db)):
    types = db.query(LeaveType).all()
    return types

@router.post("", response_model=LeaveRequestOut)
async def create_leave_request(
    req: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="User has no linked employee profile")

    emp = current_user.employee
    if req.start_date > req.end_date:
        raise HTTPException(status_code=400, detail="Start date cannot be after end date")

    days = (req.end_date - req.start_date).days + 1
    if days <= 0:
        raise HTTPException(status_code=400, detail="Invalid date range")

    # Check leave balance
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == emp.id,
        LeaveBalance.leave_type_id == req.leave_type_id
    ).first()

    if balance and balance.remaining_days < days:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient leave balance. Requested: {days} day(s), Available: {balance.remaining_days} day(s)"
        )

    # Run Smart Leave Intelligence
    coverage_assessment = calculate_smart_leave_coverage(
        db=db,
        employee_id=emp.id,
        start_date=req.start_date,
        end_date=req.end_date,
        requested_days=days
    )

    leave_req = LeaveRequest(
        employee_id=emp.id,
        leave_type_id=req.leave_type_id,
        start_date=req.start_date,
        end_date=req.end_date,
        total_days=days,
        reason=req.reason,
        status=LeaveRequestStatus.PENDING
    )
    db.add(leave_req)
    db.commit()
    db.refresh(leave_req)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        action="CREATE_LEAVE_REQUEST",
        entity_type="LEAVE_REQUEST",
        entity_id=str(leave_req.id),
        new_value=f"Applied for {days} days from {req.start_date} to {req.end_date}"
    )

    # Real-time WebSocket event broadcast
    await ws_manager.broadcast("LEAVE_REQUEST_SUBMITTED", {
        "request_id": leave_req.id,
        "employee_id": emp.id,
        "employee_name": f"{emp.first_name} {emp.last_name}",
        "department": emp.department.name if emp.department else "General",
        "days": days,
        "coverage_summary": coverage_assessment["summary"]
    })

    lt = db.query(LeaveType).filter(LeaveType.id == req.leave_type_id).first()

    return LeaveRequestOut(
        id=leave_req.id,
        employee_id=emp.id,
        employee_name=f"{emp.first_name} {emp.last_name}",
        department_name=emp.department.name if emp.department else "General",
        leave_type_id=req.leave_type_id,
        leave_type_name=lt.name if lt else "Leave",
        start_date=leave_req.start_date,
        end_date=leave_req.end_date,
        total_days=leave_req.total_days,
        reason=leave_req.reason,
        status=leave_req.status.value if hasattr(leave_req.status, 'value') else str(leave_req.status),
        created_at=leave_req.created_at,
        ai_coverage_assessment=coverage_assessment
    )

@router.get("/me")
def get_my_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.employee:
        return {"balances": [], "requests": []}

    emp = current_user.employee
    balances = db.query(LeaveBalance).filter(LeaveBalance.employee_id == emp.id).all()
    requests = db.query(LeaveRequest).filter(LeaveRequest.employee_id == emp.id).order_by(LeaveRequest.created_at.desc()).all()

    bal_out = [
        LeaveBalanceOut(
            id=b.id,
            leave_type_id=b.leave_type_id,
            leave_type_name=b.leave_type.name if b.leave_type else "Leave",
            allocated_days=b.allocated_days,
            used_days=b.used_days,
            remaining_days=b.remaining_days
        ) for b in balances
    ]

    req_out = []
    for r in requests:
        req_out.append(LeaveRequestOut(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=f"{emp.first_name} {emp.last_name}",
            department_name=emp.department.name if emp.department else "General",
            leave_type_id=r.leave_type_id,
            leave_type_name=r.leave_type.name if r.leave_type else "Leave",
            start_date=r.start_date,
            end_date=r.end_date,
            total_days=r.total_days,
            reason=r.reason,
            status=r.status.value if hasattr(r.status, 'value') else str(r.status),
            reviewed_by=r.reviewed_by,
            reviewer_name=f"{r.reviewer.first_name} {r.reviewer.last_name}" if r.reviewer else None,
            reviewer_comment=r.reviewer_comment,
            created_at=r.created_at
        ))

    return {"balances": bal_out, "requests": req_out}

@router.get("", response_model=List[LeaveRequestOut])
def list_all_leaves(
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.HR, UserRole.ADMIN]))
):
    query = db.query(LeaveRequest)

    if status_filter:
        query = query.filter(LeaveRequest.status == status_filter.upper())

    requests = query.order_by(LeaveRequest.created_at.desc()).all()

    result = []
    for r in requests:
        emp = r.employee
        coverage = None
        if emp:
            coverage = calculate_smart_leave_coverage(
                db=db,
                employee_id=emp.id,
                start_date=r.start_date,
                end_date=r.end_date,
                requested_days=r.total_days
            )

        result.append(LeaveRequestOut(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            department_name=emp.department.name if emp and emp.department else "General",
            leave_type_id=r.leave_type_id,
            leave_type_name=r.leave_type.name if r.leave_type else "Leave",
            start_date=r.start_date,
            end_date=r.end_date,
            total_days=r.total_days,
            reason=r.reason,
            status=r.status.value if hasattr(r.status, 'value') else str(r.status),
            reviewed_by=r.reviewed_by,
            reviewer_name=f"{r.reviewer.first_name} {r.reviewer.last_name}" if r.reviewer else None,
            reviewer_comment=r.reviewer_comment,
            created_at=r.created_at,
            ai_coverage_assessment=coverage
        ))

    return result

@router.patch("/{leave_id}", response_model=LeaveRequestOut)
def update_leave_request(
    leave_id: int,
    body: LeaveRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")

    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if user_role == "EMPLOYEE":
        if not current_user.employee or current_user.employee.id != req.employee_id:
            raise HTTPException(status_code=403, detail="Forbidden: You can only modify your own leave requests")
        if req.status != LeaveRequestStatus.PENDING if hasattr(req, 'status') else False:
            raise HTTPException(status_code=400, detail="Cannot modify a request that has already been reviewed")

    if body.start_date:
        req.start_date = body.start_date
    if body.end_date:
        req.end_date = body.end_date
    if body.reason:
        req.reason = body.reason

    if req.start_date > req.end_date:
        raise HTTPException(status_code=400, detail="Start date cannot be after end date")
    req.total_days = (req.end_date - req.start_date).days + 1

    db.commit()
    db.refresh(req)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        role=user_role,
        action="UPDATE_LEAVE_REQUEST",
        entity_type="LEAVE_REQUEST",
        entity_id=str(req.id),
        new_value=f"Updated leave dates: {req.start_date} to {req.end_date}, days: {req.total_days}"
    )

    emp = req.employee
    coverage = calculate_smart_leave_coverage(
        db=db,
        employee_id=req.employee_id,
        start_date=req.start_date,
        end_date=req.end_date,
        requested_days=req.total_days
    )

    return LeaveRequestOut(
        id=req.id,
        employee_id=req.employee_id,
        employee_name=f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
        department_name=emp.department.name if emp and emp.department else "General",
        leave_type_id=req.leave_type_id,
        leave_type_name=req.leave_type.name if req.leave_type else "Leave",
        start_date=req.start_date,
        end_date=req.end_date,
        total_days=req.total_days,
        reason=req.reason,
        status=req.status.value if hasattr(req.status, 'value') else str(req.status),
        reviewed_by=req.reviewed_by,
        reviewer_name=f"{req.reviewer.first_name} {req.reviewer.last_name}" if req.reviewer else None,
        reviewer_comment=req.reviewer_comment,
        created_at=req.created_at,
        ai_coverage_assessment=coverage
    )

@router.post("/{leave_id}/approve", response_model=LeaveRequestOut)
async def approve_leave(
    leave_id: int,
    body: LeaveApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.HR, UserRole.ADMIN]))
):
    req = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if req.status != LeaveRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Cannot approve request with status {req.status.value}")

    reviewer_emp_id = current_user.employee.id if current_user.employee else None

    req.status = LeaveRequestStatus.APPROVED
    req.reviewed_by = reviewer_emp_id
    req.reviewer_comment = body.reviewer_comment or "Approved"

    # Deduct from leave balance
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == req.employee_id,
        LeaveBalance.leave_type_id == req.leave_type_id
    ).first()

    if balance:
        balance.used_days += req.total_days
        balance.remaining_days = max(0.0, balance.allocated_days - balance.used_days)

    # Issue notification to employee
    emp_user = req.employee.user if req.employee else None
    if emp_user:
        notif = Notification(
            user_id=emp_user.id,
            title="Leave Request Approved",
            message=f"Your leave request for {req.total_days} day(s) starting {req.start_date} has been approved.",
            type="SUCCESS"
        )
        db.add(notif)

    db.commit()
    db.refresh(req)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        action="APPROVE_LEAVE_REQUEST",
        entity_type="LEAVE_REQUEST",
        entity_id=str(req.id),
        new_value=f"Approved leave for employee_id={req.employee_id}"
    )

    # Broadcast WebSocket update
    await ws_manager.broadcast("LEAVE_APPROVED", {
        "request_id": req.id,
        "employee_id": req.employee_id,
        "employee_name": f"{req.employee.first_name} {req.employee.last_name}" if req.employee else "Employee"
    })

    emp = req.employee
    return LeaveRequestOut(
        id=req.id,
        employee_id=req.employee_id,
        employee_name=f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
        department_name=emp.department.name if emp and emp.department else "General",
        leave_type_id=req.leave_type_id,
        leave_type_name=req.leave_type.name if req.leave_type else "Leave",
        start_date=req.start_date,
        end_date=req.end_date,
        total_days=req.total_days,
        reason=req.reason,
        status=req.status.value if hasattr(req.status, 'value') else str(req.status),
        reviewed_by=req.reviewed_by,
        reviewer_name=f"{req.reviewer.first_name} {req.reviewer.last_name}" if req.reviewer else None,
        reviewer_comment=req.reviewer_comment,
        created_at=req.created_at
    )

@router.post("/{leave_id}/reject", response_model=LeaveRequestOut)
async def reject_leave(
    leave_id: int,
    body: LeaveRejectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.HR, UserRole.ADMIN]))
):
    req = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if req.status != LeaveRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Cannot reject request with status {req.status.value}")

    reviewer_emp_id = current_user.employee.id if current_user.employee else None

    req.status = LeaveRequestStatus.REJECTED
    req.reviewed_by = reviewer_emp_id
    req.reviewer_comment = body.reviewer_comment

    # Notification
    emp_user = req.employee.user if req.employee else None
    if emp_user:
        notif = Notification(
            user_id=emp_user.id,
            title="Leave Request Rejected",
            message=f"Your leave request for {req.start_date} was rejected: {body.reviewer_comment}",
            type="ALERT"
        )
        db.add(notif)

    db.commit()
    db.refresh(req)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        action="REJECT_LEAVE_REQUEST",
        entity_type="LEAVE_REQUEST",
        entity_id=str(req.id),
        new_value=f"Rejected leave for employee_id={req.employee_id}: {body.reviewer_comment}"
    )

    await ws_manager.broadcast("LEAVE_REJECTED", {
        "request_id": req.id,
        "employee_id": req.employee_id
    })

    emp = req.employee
    return LeaveRequestOut(
        id=req.id,
        employee_id=req.employee_id,
        employee_name=f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
        department_name=emp.department.name if emp and emp.department else "General",
        leave_type_id=req.leave_type_id,
        leave_type_name=req.leave_type.name if req.leave_type else "Leave",
        start_date=req.start_date,
        end_date=req.end_date,
        total_days=req.total_days,
        reason=req.reason,
        status=req.status.value if hasattr(req.status, 'value') else str(req.status),
        reviewed_by=req.reviewed_by,
        reviewer_name=f"{req.reviewer.first_name} {req.reviewer.last_name}" if req.reviewer else None,
        reviewer_comment=req.reviewer_comment,
        created_at=req.created_at
    )
