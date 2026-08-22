from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from app.models.payroll import Payroll


class PayrollRepository:
    @staticmethod
    def get_by_employee(db: Session, employee_id: int) -> Optional[Payroll]:
        return db.query(Payroll).options(
            joinedload(Payroll.employee)
        ).filter(Payroll.employee_id == employee_id).order_by(Payroll.effective_from.desc()).first()

    @staticmethod
    def create_or_update(db: Session, **kwargs) -> Payroll:
        payroll = Payroll(**kwargs)
        db.add(payroll)
        db.commit()
        db.refresh(payroll)
        return payroll

    @staticmethod
    def list(db: Session, skip: int = 0, limit: int = 100) -> List[Payroll]:
        return db.query(Payroll).options(
            joinedload(Payroll.employee)
        ).offset(skip).limit(limit).all()
