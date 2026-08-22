from pydantic import BaseModel
from typing import Optional
from datetime import date

class PayrollOut(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    department_name: Optional[str] = None
    designation: Optional[str] = None
    basic_salary: float
    allowances: float
    deductions: float
    net_salary: float
    effective_from: date
    currency: str

    class Config:
        from_attributes = True

class PayrollUpdate(BaseModel):
    basic_salary: Optional[float] = None
    allowances: Optional[float] = None
    deductions: Optional[float] = None
