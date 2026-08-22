from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


def utc_now():
    return datetime.now(timezone.utc)


class AIEvent(Base):
    __tablename__ = "ai_events"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(100), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    agent_name = Column(String(100), nullable=False)
    action_type = Column(String(100), nullable=False)
    input_summary = Column(Text, nullable=True)
    data_sources = Column(Text, nullable=True)
    decision = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    guardrail_status = Column(String(50), default="PASSED", nullable=False)
    human_approval_required = Column(Boolean, default=False, nullable=False)
    human_approved = Column(Boolean, nullable=True)
    tool_name = Column(String(100), nullable=True)
    tool_result_reference = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    user = relationship("User", foreign_keys=[user_id])


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)  # ATTENDANCE, TURNOVER, PERFORMANCE, PRODUCTIVITY
    description = Column(Text, nullable=False)
    metrics_json = Column(Text, nullable=True)
    severity = Column(String(50), default="INFO", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    is_dismissed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class AttendanceAnomaly(Base):
    __tablename__ = "attendance_anomalies"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    anomaly_type = Column(String(100), nullable=False)  # UNUSUAL_HOURS, MISSING_CHECKOUT, FREQ_LATE, LOCATION_MISMATCH
    severity = Column(String(50), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH
    description = Column(Text, nullable=False)
    status = Column(String(50), default="OPEN", nullable=False)  # OPEN, RESOLVED, IGNORED
    detected_by = Column(String(100), default="AI_GUARDRAIL", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    employee = relationship("Employee", back_populates="anomalies")
