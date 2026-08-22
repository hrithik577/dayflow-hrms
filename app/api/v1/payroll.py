from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.payroll import PayrollOut, PayrollCreate
from app.repositories.payroll_repository import PayrollRepository
from app.repositories.audit_repository import AuditRepository

router = APIRouter()


@router.get("/employee/{employee_id}", response_model=PayrollOut)
def get_employee_payroll(employee_id: int, db: Session = Depends(get_db)):
    """Fetch active payroll data for employee."""
    p = PayrollRepository.get_by_employee(db, employee_id)
    if not p:
        raise HTTPException(status_code=404, detail="Payroll record not found for employee")
    return p


@router.post("/", response_model=PayrollOut, status_code=status.HTTP_201_CREATED)
def create_payroll_record(payload: PayrollCreate, db: Session = Depends(get_db)):
    """Create or update payroll compensation structure for employee."""
    p = PayrollRepository.create_or_update(db, **payload.model_dump())
    AuditRepository.log_event(
        db,
        action="payroll_modification",
        user_id=payload.updated_by,
        entity_type="payroll",
        entity_id=str(p.id)
    )
    return p
