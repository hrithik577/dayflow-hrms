from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class EmployeeBase(BaseModel):
    user_id: int
    employee_code: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    department_id: Optional[int] = None
    designation: str
    joining_date: date
    manager_id: Optional[int] = None
    profile_picture_url: Optional[str] = None
    employment_status: str = "FULL_TIME"


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    joining_date: Optional[date] = None
    manager_id: Optional[int] = None
    profile_picture_url: Optional[str] = None
    employment_status: Optional[str] = None


class EmployeeOut(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
