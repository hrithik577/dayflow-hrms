from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.leave import LeaveRequestCreate, LeaveRequestUpdate, LeaveApprovalRequest, LeaveRejectionRequest, LeaveRequestOut, LeaveBalanceOut, LeaveTypeOut
from app.services.auth_service import get_current_user, require_roles

# =========================================================
# FILE STRUCTURE: LEAVES ROUTER
# =========================================================

router = APIRouter(prefix="/api/leaves", tags=["Leaves"])

@router.get("/types", response_model=List[LeaveTypeOut])
def get_leave_types(db: Session = Depends(get_db)):
    pass

@router.post("", response_model=LeaveRequestOut)
async def create_leave_request(
    req: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pass

@router.get("/me")
def get_my_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pass

@router.get("", response_model=List[LeaveRequestOut])
def list_all_leaves(
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.HR, UserRole.ADMIN]))
):
    pass

@router.patch("/{leave_id}", response_model=LeaveRequestOut)
def update_leave_request(
    leave_id: int,
    body: LeaveRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pass

@router.post("/{leave_id}/approve", response_model=LeaveRequestOut)
async def approve_leave(
    leave_id: int,
    body: LeaveApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.HR, UserRole.ADMIN]))
):
    pass

@router.post("/{leave_id}/reject", response_model=LeaveRequestOut)
async def reject_leave(
    leave_id: int,
    body: LeaveRejectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.HR, UserRole.ADMIN]))
):
    pass
