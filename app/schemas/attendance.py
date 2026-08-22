from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class AttendanceBase(BaseModel):
    employee_id: int
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: str  # PRESENT, ABSENT, HALF_DAY, LEAVE, LATE
    working_hours: float = 0.0
    source: str = "WEB"
    notes: Optional[str] = None


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: Optional[str] = None
    working_hours: Optional[float] = None
    notes: Optional[str] = None


class CheckInRequest(BaseModel):
    employee_id: int
    source: str = "WEB"
    notes: Optional[str] = None


class CheckOutRequest(BaseModel):
    employee_id: int
    notes: Optional[str] = None


class AttendanceOut(AttendanceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
