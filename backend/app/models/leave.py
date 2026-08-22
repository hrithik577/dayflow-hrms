import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, Float, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class LeaveRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class LeaveType(Base):
    __tablename__ = "leave_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    code = Column(String, nullable=False, unique=True)
    annual_limit = Column(Integer, nullable=False, default=12)
    description = Column(String, nullable=True)

    leave_requests = relationship("LeaveRequest", back_populates="leave_type")
    leave_balances = relationship("LeaveBalance", back_populates="leave_type")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(Enum(LeaveRequestStatus), default=LeaveRequestStatus.PENDING, nullable=False, index=True)
    reviewed_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    reviewer_comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="leave_requests", foreign_keys=[employee_id])
    reviewer = relationship("Employee", foreign_keys=[reviewed_by])
    leave_type = relationship("LeaveType", back_populates="leave_requests")

class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)
    allocated_days = Column(Float, nullable=False, default=12.0)
    used_days = Column(Float, nullable=False, default=0.0)
    remaining_days = Column(Float, nullable=False, default=12.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="leave_balances")
    leave_type = relationship("LeaveType", back_populates="leave_balances")
