from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.employee import EmployeeOut, EmployeeCreate, EmployeeUpdate
from app.repositories.employee_repository import EmployeeRepository

router = APIRouter()


@router.get("/", response_model=List[EmployeeOut])
def list_employees(
    department_id: Optional[int] = None,
    employment_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Retrieve list of employees filtered by department or employment status."""
    return EmployeeRepository.list(
        db, department_id=department_id, employment_status=employment_status, skip=skip, limit=limit
    )


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    """Get single employee profile details by ID."""
    emp = EmployeeRepository.get_by_id(db, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.post("/", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    """Create a new employee profile."""
    existing = EmployeeRepository.get_by_code(db, payload.employee_code)
    if existing:
        raise HTTPException(status_code=400, detail="Employee code already exists")
    return EmployeeRepository.create(db, **payload.model_dump())
