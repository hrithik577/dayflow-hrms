from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean

from app.db.session import Base


def utc_now():
    return datetime.now(timezone.utc)


class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)  # LEAVE, ATTENDANCE, CONDUCT, SECURITY, BENEFITS
    content = Column(Text, nullable=False)
    version = Column(String(20), default="1.0", nullable=False)
    effective_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
