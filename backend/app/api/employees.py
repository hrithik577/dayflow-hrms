from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.employee import Employee
from app.models.user import User, UserRole
from app.schemas.employee import EmployeeOut, EmployeeUpdate
from app.services.auth_service import get_current_user
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/employees", tags=["Employees"])

@router.get("", response_model=List[EmployeeOut])
def list_employees(
    search: Optional[str] = Query(None),
    department_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Employee)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Employee.first_name.ilike(s)) |
            (Employee.last_name.ilike(s)) |
            (Employee.employee_code.ilike(s)) |
            (Employee.designation.ilike(s))
        )

    if department_id:
        query = query.filter(Employee.department_id == department_id)

    if status_filter:
        query = query.filter(Employee.employment_status == status_filter.upper())

    employees = query.order_by(Employee.first_name.asc()).all()

    result = []
    for emp in employees:
        result.append(EmployeeOut(
            id=emp.id,
            user_id=emp.user_id,
            employee_code=emp.employee_code,
            first_name=emp.first_name,
            last_name=emp.last_name,
            email=emp.user.email if emp.user else "",
            phone=emp.phone,
            address=emp.address,
            city=emp.city,
            department_id=emp.department_id,
            department_name=emp.department.name if emp.department else "General",
            designation=emp.designation,
            joining_date=emp.joining_date,
            employment_status=emp.employment_status.value if hasattr(emp.employment_status, 'value') else str(emp.employment_status),
            profile_picture_url=emp.profile_picture_url
        ))

    return result

@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    return EmployeeOut(
        id=emp.id,
        user_id=emp.user_id,
        employee_code=emp.employee_code,
        first_name=emp.first_name,
        last_name=emp.last_name,
        email=emp.user.email if emp.user else "",
        phone=emp.phone,
        address=emp.address,
        city=emp.city,
        department_id=emp.department_id,
        department_name=emp.department.name if emp.department else "General",
        designation=emp.designation,
        joining_date=emp.joining_date,
        employment_status=emp.employment_status.value if hasattr(emp.employment_status, 'value') else str(emp.employment_status),
        profile_picture_url=emp.profile_picture_url
    )

@router.patch("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: int,
    req: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    
    # RBAC Enforcement: Regular employees can only update their own contact info
    if user_role == "EMPLOYEE":
        if not current_user.employee or current_user.employee.id != employee_id:
            raise HTTPException(status_code=403, detail="Forbidden: You can only edit your own personal profile")
        
        # Only allow contact fields
        if req.phone is not None:
            emp.phone = req.phone
        if req.address is not None:
            emp.address = req.address
        if req.city is not None:
            emp.city = req.city
    else:
        # HR / Admin full update
        if req.phone is not None: emp.phone = req.phone
        if req.address is not None: emp.address = req.address
        if req.city is not None: emp.city = req.city
        if req.designation is not None: emp.designation = req.designation
        if req.department_id is not None: emp.department_id = req.department_id
        if req.employment_status is not None: emp.employment_status = req.employment_status

    db.commit()
    db.refresh(emp)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        role=user_role,
        action="UPDATE_EMPLOYEE_PROFILE",
        entity_type="EMPLOYEE",
        entity_id=str(emp.id),
        new_value=f"Updated profile fields for {emp.first_name} {emp.last_name}"
    )

    return EmployeeOut(
        id=emp.id,
        user_id=emp.user_id,
        employee_code=emp.employee_code,
        first_name=emp.first_name,
        last_name=emp.last_name,
        email=emp.user.email if emp.user else "",
        phone=emp.phone,
        address=emp.address,
        city=emp.city,
        department_id=emp.department_id,
        department_name=emp.department.name if emp.department else "General",
        designation=emp.designation,
        joining_date=emp.joining_date,
        employment_status=emp.employment_status.value if hasattr(emp.employment_status, 'value') else str(emp.employment_status),
        profile_picture_url=emp.profile_picture_url
    )
