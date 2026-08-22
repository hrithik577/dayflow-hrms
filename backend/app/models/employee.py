import enum
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base

class EmploymentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PROBATION = "PROBATION"
    TERMINATED = "TERMINATED"
    ON_LEAVE = "ON_LEAVE"

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    employee_code = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    designation = Column(String, nullable=False)
    joining_date = Column(Date, default=date.today, nullable=False)
    manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    profile_picture_url = Column(String, nullable=True)
    employment_status = Column(Enum(EmploymentStatus), default=EmploymentStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="employee")
    department = relationship("Department", back_populates="employees", foreign_keys=[department_id])
    manager = relationship("Employee", remote_side=[id], backref="direct_reports")
    
    attendance_records = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="employee", foreign_keys="[LeaveRequest.employee_id]", cascade="all, delete-orphan")
    leave_balances = relationship("LeaveBalance", back_populates="employee", cascade="all, delete-orphan")
    payroll = relationship("Payroll", back_populates="employee", uselist=False, cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="employee", cascade="all, delete-orphan")
    ai_insights = relationship("AIInsight", back_populates="employee")
    attendance_anomalies = relationship("AttendanceAnomaly", back_populates="employee")
