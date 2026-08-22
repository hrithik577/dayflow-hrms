from typing import List, Dict, Any, Optional
from datetime import date
from pydantic import BaseModel


class DepartmentAttendanceMetric(BaseModel):
    department_id: int
    department_name: str
    total_employees: int
    present_employees: int
    absent_employees: int
    late_employees: int
    attendance_rate: float
    late_rate: float


class AttendanceTrendPoint(BaseModel):
    date: str
    total: int
    present: int
    absent: int
    late: int
    leave: int
    attendance_rate: float


class LeaveTrendPoint(BaseModel):
    month: str
    total_requested: int
    approved: int
    pending: int
    rejected: int


class WorkforceAnalyticsOut(BaseModel):
    total_employees: int
    present_employees: int
    absent_employees: int
    employees_on_leave: int
    late_employees: int
    attendance_rate: float
    pending_leaves: int
    workforce_health: str  # EXCELLENT, GOOD, ATTENTION_REQUIRED, CRITICAL
    department_attendance: List[DepartmentAttendanceMetric]
    attendance_trends: List[AttendanceTrendPoint]
    leave_trends: List[LeaveTrendPoint]
