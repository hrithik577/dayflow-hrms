from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date

class DepartmentOut(BaseModel):
    id: int
    name: str
    code: str

    class Config:
        from_attributes = True

class EmployeeOut(BaseModel):
    id: int
    user_id: int
    employee_code: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    designation: str
    joining_date: date
    employment_status: str
    profile_picture_url: Optional[str] = None

    class Config:
        from_attributes = True

class EmployeeUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[int] = None
    employment_status: Optional[str] = None
