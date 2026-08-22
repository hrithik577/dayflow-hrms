from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from app.models.employee import Employee
from app.models.department import Department


class EmployeeRepository:
    @staticmethod
    def get_by_id(db: Session, employee_id: int) -> Optional[Employee]:
        return db.query(Employee).options(
            joinedload(Employee.user),
            joinedload(Employee.department),
            joinedload(Employee.manager)
        ).filter(Employee.id == employee_id).first()

    @staticmethod
    def get_by_code(db: Session, employee_code: str) -> Optional[Employee]:
        return db.query(Employee).filter(Employee.employee_code == employee_code).first()

    @staticmethod
    def get_by_user_id(db: Session, user_id: int) -> Optional[Employee]:
        return db.query(Employee).filter(Employee.user_id == user_id).first()

    @staticmethod
    def create(db: Session, **kwargs) -> Employee:
        employee = Employee(**kwargs)
        db.add(employee)
        db.commit()
        db.refresh(employee)
        return employee

    @staticmethod
    def list(
        db: Session,
        department_id: Optional[int] = None,
        employment_status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Employee]:
        query = db.query(Employee).options(
            joinedload(Employee.department),
            joinedload(Employee.user)
        )
        if department_id:
            query = query.filter(Employee.department_id == department_id)
        if employment_status:
            query = query.filter(Employee.employment_status == employment_status)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def update(db: Session, employee: Employee, **kwargs) -> Employee:
        for key, value in kwargs.items():
            if value is not None and hasattr(employee, key):
                setattr(employee, key, value)
        db.commit()
        db.refresh(employee)
        return employee

    @staticmethod
    def count(db: Session, department_id: Optional[int] = None) -> int:
        query = db.query(Employee).filter(Employee.employment_status != "TERMINATED")
        if department_id:
            query = query.filter(Employee.department_id == department_id)
        return query.count()
