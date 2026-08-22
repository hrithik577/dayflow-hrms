from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict


class PayrollBase(BaseModel):
    employee_id: int
    basic_salary: Decimal
    allowances: Decimal = Decimal("0.00")
    deductions: Decimal = Decimal("0.00")
    net_salary: Decimal
    effective_from: date
    effective_to: Optional[date] = None
    currency: str = "USD"
    updated_by: Optional[int] = None


class PayrollCreate(PayrollBase):
    pass


class PayrollUpdate(BaseModel):
    basic_salary: Optional[Decimal] = None
    allowances: Optional[Decimal] = None
    deductions: Optional[Decimal] = None
    net_salary: Optional[Decimal] = None
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None
    currency: Optional[str] = None
    updated_by: Optional[int] = None


class PayrollOut(PayrollBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
