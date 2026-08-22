from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class AIEvent(Base):
    __tablename__ = "ai_events"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    agent_name = Column(String, default="Dayflow AI Copilot")
    action_type = Column(String, nullable=False)
    input_summary = Column(Text, nullable=False)
    data_sources = Column(Text, nullable=True)
    decision = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0)
    guardrail_status = Column(String, default="ALLOWED")
    human_approval_required = Column(String, default="FALSE")
    human_approved = Column(String, default="NONE")
    tool_name = Column(String, nullable=True)
    tool_result_reference = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="ai_events")

class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    insight_type = Column(String, nullable=False) # e.g., ATTENDANCE_DROP, OVERTIME_SPIKE, LEAVE_PATTERN
    severity = Column(String, default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    title = Column(String, nullable=False)
    explanation = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=False)
    confidence = Column(Float, default=0.85)
    status = Column(String, default="NEW") # NEW, UNDER_REVIEW, RESOLVED, DISMISSED
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    employee = relationship("Employee", back_populates="ai_insights")
    department = relationship("Department", back_populates="ai_insights")
    reviewer = relationship("User")

class AttendanceAnomaly(Base):
    __tablename__ = "attendance_anomalies"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    attendance_id = Column(Integer, ForeignKey("attendance.id", ondelete="CASCADE"), nullable=True)
    anomaly_type = Column(String, nullable=False)
    severity = Column(String, default="MEDIUM")
    score = Column(Float, default=0.5)
    explanation = Column(Text, nullable=False)
    resolved = Column(String, default="FALSE")
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="attendance_anomalies")
    attendance = relationship("Attendance", back_populates="anomalies")

class WorkforceMetric(Base):
    __tablename__ = "workforce_metrics"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    metric_date = Column(Date, default=date.today, nullable=False, index=True)
    headcount = Column(Integer, default=0)
    present_count = Column(Integer, default=0)
    absent_count = Column(Integer, default=0)
    leave_count = Column(Integer, default=0)
    late_count = Column(Integer, default=0)
    attendance_rate = Column(Float, default=100.0)
    calculated_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="workforce_metrics")
