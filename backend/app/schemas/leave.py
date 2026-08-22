from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class LeaveRequestCreate(BaseModel):
    leave_type_id: int
    start_date: date
    end_date: date
    reason: str

class LeaveRequestUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reason: Optional[str] = None

class LeaveApprovalRequest(BaseModel):
    reviewer_comment: Optional[str] = "Approved by HR"

class LeaveRejectionRequest(BaseModel):
    reviewer_comment: str

class LeaveTypeOut(BaseModel):
    id: int
    name: str
    code: str
    annual_limit: int
    description: Optional[str] = None

    class Config:
        from_attributes = True

class LeaveBalanceOut(BaseModel):
    id: int
    leave_type_id: int
    leave_type_name: str
    allocated_days: float
    used_days: float
    remaining_days: float

    class Config:
        from_attributes = True

class LeaveRequestOut(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    department_name: Optional[str] = None
    leave_type_id: int
    leave_type_name: Optional[str] = None
    start_date: date
    end_date: date
    total_days: float
    reason: str
    status: str
    reviewed_by: Optional[int] = None
    reviewer_name: Optional[str] = None
    reviewer_comment: Optional[str] = None
    created_at: datetime
    ai_coverage_assessment: Optional[dict] = None

    class Config:
        from_attributes = True
