from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class LeaveTypeOut(BaseModel):
    id: int
    name: str
    code: str
    max_days_per_year: int
    is_paid: bool
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class LeaveRequestBase(BaseModel):
    employee_id: int
    leave_type_id: int
    start_date: date
    end_date: date
    total_days: float
    reason: str


class LeaveRequestCreate(LeaveRequestBase):
    pass


class LeaveRequestUpdate(BaseModel):
    status: str  # PENDING, APPROVED, REJECTED, CANCELLED
    reviewed_by: Optional[int] = None
    reviewer_comment: Optional[str] = None


class LeaveRequestOut(LeaveRequestBase):
    id: int
    status: str
    reviewed_by: Optional[int] = None
    reviewer_comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeaveBalanceOut(BaseModel):
    id: int
    employee_id: int
    leave_type_id: int
    allocated_days: float
    used_days: float
    pending_days: float
    remaining_days: float
    year: int

    model_config = ConfigDict(from_attributes=True)
