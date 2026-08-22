from typing import Optional, List
from decimal import Decimal
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
    def calculate_total_payroll_expenditure(db: Session) -> Decimal:
        payrolls = db.query(Payroll).all()
        return sum((p.net_salary for p in payrolls), Decimal("0.00"))

    @staticmethod
    def list(db: Session, skip: int = 0, limit: int = 100) -> List[Payroll]:
        return db.query(Payroll).options(
            joinedload(Payroll.employee)
        ).offset(skip).limit(limit).all()
