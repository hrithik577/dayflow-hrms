from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Float, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.db.session import Base


def utc_now():
    return datetime.now(timezone.utc)


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    check_in = Column(DateTime(timezone=True), nullable=True)
    check_out = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), nullable=False, index=True)  # PRESENT, ABSENT, HALF_DAY, LEAVE, LATE
    working_hours = Column(Float, default=0.0, nullable=False)
    source = Column(String(50), default="WEB", nullable=False)  # WEB, MOBILE, BIOMETRIC, AI_AUTO
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    employee = relationship("Employee", back_populates="attendance_records")

    __table_args__ = (
        Index("idx_attendance_emp_date", "employee_id", "date"),
        Index("idx_attendance_date_status", "date", "status"),
    )
