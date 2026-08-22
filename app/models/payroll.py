from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


def utc_now():
    return datetime.now(timezone.utc)


class Payroll(Base):
    __tablename__ = "payroll"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    basic_salary = Column(Numeric(12, 2), nullable=False)
    allowances = Column(Numeric(12, 2), default=0.00, nullable=False)
    deductions = Column(Numeric(12, 2), default=0.00, nullable=False)
    net_salary = Column(Numeric(12, 2), nullable=False)
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date, nullable=True)
    currency = Column(String(10), default="USD", nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    employee = relationship("Employee", back_populates="payrolls")
    updater = relationship("User", foreign_keys=[updated_by])
