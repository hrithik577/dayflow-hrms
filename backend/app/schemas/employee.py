from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

class DepartmentOut(BaseModel):
    id: int
    name: str
    code: str

    class Config:
        from_attributes = True

class DocumentOut(BaseModel):
    id: int
    employee_id: int
    document_type: str
    file_name: str
    file_url: str
    verification_status: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

class DocumentCreate(BaseModel):
    document_type: str
    file_name: str
    file_url: str
    verification_status: Optional[str] = "VERIFIED"

class SalaryStructureOut(BaseModel):
    basic_salary: float
    allowances: float
    deductions: float
    net_salary: float
    effective_from: date
    effective_to: Optional[date] = None
    currency: str = "USD"

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
    manager_id: Optional[int] = None
    manager_name: Optional[str] = None
    salary_structure: Optional[SalaryStructureOut] = None
    documents: List[DocumentOut] = []

    class Config:
        from_attributes = True

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[int] = None
    employment_status: Optional[str] = None
    profile_picture_url: Optional[str] = None

