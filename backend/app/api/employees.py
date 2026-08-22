from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.employee import Employee
from app.models.user import User, UserRole
from app.models.payroll import Document, Payroll
from app.schemas.employee import EmployeeOut, EmployeeUpdate, DocumentOut, DocumentCreate, SalaryStructureOut
from app.services.auth_service import get_current_user
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/employees", tags=["Employees"])


def build_employee_out(emp: Employee, current_user: User) -> EmployeeOut:
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    is_self = current_user.employee and current_user.employee.id == emp.id
    is_mgmt = user_role in ["ADMIN", "HR"]

    # Salary structure populated only if Admin/HR or self view
    salary_struct = None
    if (is_self or is_mgmt) and emp.payroll:
        salary_struct = SalaryStructureOut(
            basic_salary=emp.payroll.basic_salary,
            allowances=emp.payroll.allowances,
            deductions=emp.payroll.deductions,
            net_salary=emp.payroll.net_salary,
            effective_from=emp.payroll.effective_from,
            effective_to=emp.payroll.effective_to,
            currency=emp.payroll.currency or "USD"
        )

    # Documents list
    docs = []
    if emp.documents:
        for d in emp.documents:
            docs.append(DocumentOut(
                id=d.id,
                employee_id=d.employee_id,
                document_type=d.document_type,
                file_name=d.file_name,
                file_url=d.file_url,
                verification_status=d.verification_status or "VERIFIED",
                uploaded_at=d.uploaded_at
            ))

    manager_name = None
    if emp.manager:
        manager_name = f"{emp.manager.first_name} {emp.manager.last_name}"

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
        profile_picture_url=emp.profile_picture_url,
        manager_id=emp.manager_id,
        manager_name=manager_name,
        salary_structure=salary_struct,
        documents=docs
    )


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

    return [build_employee_out(emp, current_user) for emp in employees]


@router.get("/me", response_model=EmployeeOut)
def get_my_employee_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.employee:
        raise HTTPException(status_code=404, detail="Employee profile not found for current user")
    return build_employee_out(current_user.employee, current_user)


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    return build_employee_out(emp, current_user)


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

    # RBAC Enforcement: Regular employees can edit limited fields (address, phone, city, profile_picture_url)
    if user_role == "EMPLOYEE":
        if not current_user.employee or current_user.employee.id != employee_id:
            raise HTTPException(status_code=403, detail="Forbidden: You can only edit your own personal profile")

        # Disallow attempt by employee to change admin-restricted fields
        restricted_attempts = [
            req.first_name, req.last_name, req.designation, req.department_id, req.employment_status
        ]
        if any(field is not None for field in restricted_attempts):
            raise HTTPException(
                status_code=403,
                detail="Forbidden: Employees are only permitted to edit address, phone, city, and profile picture."
            )

        # Apply limited updates
        if req.phone is not None:
            emp.phone = req.phone
        if req.address is not None:
            emp.address = req.address
        if req.city is not None:
            emp.city = req.city
        if req.profile_picture_url is not None:
            emp.profile_picture_url = req.profile_picture_url
    else:
        # Admin / HR full update permission for all employee details
        if req.first_name is not None: emp.first_name = req.first_name
        if req.last_name is not None: emp.last_name = req.last_name
        if req.phone is not None: emp.phone = req.phone
        if req.address is not None: emp.address = req.address
        if req.city is not None: emp.city = req.city
        if req.designation is not None: emp.designation = req.designation
        if req.department_id is not None: emp.department_id = req.department_id
        if req.employment_status is not None: emp.employment_status = req.employment_status
        if req.profile_picture_url is not None: emp.profile_picture_url = req.profile_picture_url

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

    return build_employee_out(emp, current_user)


@router.post("/{employee_id}/documents", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def add_employee_document(
    employee_id: int,
    req: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    is_self = current_user.employee and current_user.employee.id == employee_id
    if not (is_self or user_role in ["ADMIN", "HR"]):
        raise HTTPException(status_code=403, detail="Forbidden: You cannot upload documents for this employee")

    doc = Document(
        employee_id=emp.id,
        document_type=req.document_type,
        file_name=req.file_name,
        file_url=req.file_url,
        verification_status=req.verification_status or "VERIFIED"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        role=user_role,
        action="UPLOAD_DOCUMENT",
        entity_type="DOCUMENT",
        entity_id=str(doc.id),
        new_value=f"Uploaded {req.file_name} for employee ID {emp.id}"
    )

    return DocumentOut(
        id=doc.id,
        employee_id=doc.employee_id,
        document_type=doc.document_type,
        file_name=doc.file_name,
        file_url=doc.file_url,
        verification_status=doc.verification_status,
        uploaded_at=doc.uploaded_at
    )

