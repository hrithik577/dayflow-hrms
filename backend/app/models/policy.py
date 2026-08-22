from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from app.core.database import Base

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    policy_name = Column(String, nullable=False, unique=True)
    category = Column(String, nullable=False) # e.g. LEAVE, ATTENDANCE, PAYROLL, CONDUCT
    content = Column(Text, nullable=False)
    role_visibility = Column(String, default="ALL") # ALL, HR, ADMIN
    version = Column(String, default="1.0")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
