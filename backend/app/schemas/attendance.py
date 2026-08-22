from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class CheckInRequest(BaseModel):
    notes: Optional[str] = None
    source: Optional[str] = "WEB"

class CheckOutRequest(BaseModel):
    notes: Optional[str] = None

class AttendanceOut(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    department_name: Optional[str] = None
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: str
    working_hours: float
    source: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class AttendanceStatsOut(BaseModel):
    total_employees: int
    present_today: int
    absent_today: int
    on_leave_today: int
    late_today: int
    attendance_rate: float
