from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.leave import LeaveTypeOut, LeaveRequestOut, LeaveRequestCreate, LeaveRequestUpdate, LeaveBalanceOut
from app.repositories.leave_repository import LeaveRepository
from app.repositories.audit_repository import AuditRepository

router = APIRouter()


@router.get("/types", response_model=List[LeaveTypeOut])
def get_leave_types(db: Session = Depends(get_db)):
    """List available leave types."""
    return LeaveRepository.get_leave_types(db)


@router.post("/requests", response_model=LeaveRequestOut, status_code=status.HTTP_201_CREATED)
def submit_leave_request(payload: LeaveRequestCreate, db: Session = Depends(get_db)):
    """Submit a new leave request."""
    req = LeaveRepository.create_leave_request(db, **payload.model_dump())
    AuditRepository.log_event(
        db,
        action="leave_creation",
        entity_type="leave_request",
        entity_id=str(req.id)
    )
    return req


@router.put("/requests/{request_id}/status", response_model=LeaveRequestOut)
def update_leave_status(request_id: int, payload: LeaveRequestUpdate, db: Session = Depends(get_db)):
    """Approve, reject, or cancel a leave request."""
    req = LeaveRepository.update_request_status(
        db,
        request_id=request_id,
        status=payload.status,
        reviewed_by=payload.reviewed_by,
        reviewer_comment=payload.reviewer_comment
    )
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")

    action_name = "leave_approval" if payload.status == "APPROVED" else ("leave_rejection" if payload.status == "REJECTED" else "leave_cancellation")
    AuditRepository.log_event(
        db,
        action=action_name,
        user_id=payload.reviewed_by,
        entity_type="leave_request",
        entity_id=str(req.id)
    )
    return req


@router.get("/balances/{employee_id}", response_model=List[LeaveBalanceOut])
def get_employee_leave_balances(employee_id: int, year: int = 2026, db: Session = Depends(get_db)):
    """Get leave balances for an employee for a specific year."""
    return LeaveRepository.get_balances(db, employee_id, year)
