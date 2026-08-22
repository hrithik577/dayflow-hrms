from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.payroll import Payroll
from app.models.employee import Employee
from app.models.user import User, UserRole
from app.schemas.payroll import PayrollOut, PayrollUpdate
from app.services.auth_service import get_current_user, require_roles
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/payroll", tags=["Payroll"])

@router.get("/me", response_model=PayrollOut)
def get_my_payroll(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="User has no linked employee profile")

    emp = current_user.employee
    pay = db.query(Payroll).filter(Payroll.employee_id == emp.id).first()
    if not pay:
        raise HTTPException(status_code=404, detail="Payroll structure not found for employee")

    return PayrollOut(
        id=pay.id,
        employee_id=pay.employee_id,
        employee_name=f"{emp.first_name} {emp.last_name}",
        department_name=emp.department.name if emp.department else "General",
        designation=emp.designation,
        basic_salary=pay.basic_salary,
        allowances=pay.allowances,
        deductions=pay.deductions,
        net_salary=pay.net_salary,
        effective_from=pay.effective_from,
        currency=pay.currency
    )

@router.get("", response_model=List[PayrollOut])
def get_all_payroll(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.HR, UserRole.ADMIN]))
):
    payrolls = db.query(Payroll).join(Employee).all()

    result = []
    for pay in payrolls:
        emp = pay.employee
        result.append(PayrollOut(
            id=pay.id,
            employee_id=pay.employee_id,
            employee_name=f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            department_name=emp.department.name if emp and emp.department else "General",
            designation=emp.designation if emp else "Employee",
            basic_salary=pay.basic_salary,
            allowances=pay.allowances,
            deductions=pay.deductions,
            net_salary=pay.net_salary,
            effective_from=pay.effective_from,
            currency=pay.currency
        ))

    return result

@router.patch("/{payroll_id}", response_model=PayrollOut)
def update_payroll_structure(
    payroll_id: int,
    req: PayrollUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.HR, UserRole.ADMIN]))
):
    pay = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not pay:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    old_net = pay.net_salary

    if req.basic_salary is not None:
        pay.basic_salary = req.basic_salary
    if req.allowances is not None:
        pay.allowances = req.allowances
    if req.deductions is not None:
        pay.deductions = req.deductions

    # Recalculate net salary
    pay.net_salary = round(max(0.0, pay.basic_salary + pay.allowances - pay.deductions), 2)
    pay.updated_by = current_user.id

    db.commit()
    db.refresh(pay)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        action="UPDATE_PAYROLL_STRUCTURE",
        entity_type="PAYROLL",
        entity_id=str(pay.id),
        old_value=f"Net: ${old_net}",
        new_value=f"Basic: ${pay.basic_salary}, Allowances: ${pay.allowances}, Deductions: ${pay.deductions}, Net: ${pay.net_salary}"
    )

    emp = pay.employee
    return PayrollOut(
        id=pay.id,
        employee_id=pay.employee_id,
        employee_name=f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
        department_name=emp.department.name if emp and emp.department else "General",
        designation=emp.designation if emp else "Employee",
        basic_salary=pay.basic_salary,
        allowances=pay.allowances,
        deductions=pay.deductions,
        net_salary=pay.net_salary,
        effective_from=pay.effective_from,
        currency=pay.currency
    )
