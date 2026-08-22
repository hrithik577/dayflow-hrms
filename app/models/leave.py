from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Float, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.session import Base


def utc_now():
    return datetime.now(timezone.utc)


class LeaveType(Base):
    __tablename__ = "leave_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)  # PAID, SICK, CASUAL, MATERNITY, PATERNITY, UNPAID
    max_days_per_year = Column(Integer, default=12, nullable=False)
    is_paid = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    requests = relationship("LeaveRequest", back_populates="leave_type")
    balances = relationship("LeaveBalance", back_populates="leave_type")


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id", ondelete="RESTRICT"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False, index=True)  # PENDING, APPROVED, REJECTED, CANCELLED
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewer_comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    employee = relationship("Employee", back_populates="leave_requests", foreign_keys=[employee_id])
    leave_type = relationship("LeaveType", back_populates="requests")
    reviewer = relationship("User", foreign_keys=[reviewed_by])


class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id", ondelete="RESTRICT"), nullable=False, index=True)
    allocated_days = Column(Float, default=0.0, nullable=False)
    used_days = Column(Float, default=0.0, nullable=False)
    pending_days = Column(Float, default=0.0, nullable=False)
    remaining_days = Column(Float, default=0.0, nullable=False)
    year = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    employee = relationship("Employee", back_populates="leave_balances")
    leave_type = relationship("LeaveType", back_populates="balances")

    __table_args__ = (
        UniqueConstraint("employee_id", "leave_type_id", "year", name="uq_emp_leave_year"),
    )
