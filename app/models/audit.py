from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


def utc_now():
    return datetime.now(timezone.utc)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True)  # login, logout, check_in, check_out, leave_creation, leave_approval, leave_rejection, payroll_modification, role_change, AI_RECOMMENDATION, AI_ACTION, BLOCKED_AI_REQUEST
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(String(100), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    source = Column(String(50), default="SYSTEM", nullable=False)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")
