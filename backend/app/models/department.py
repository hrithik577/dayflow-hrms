from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    code = Column(String, nullable=False, unique=True, index=True)
    manager_id = Column(Integer, ForeignKey("employees.id", use_alter=True, name="fk_dept_manager_id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employees = relationship("Employee", back_populates="department", foreign_keys="[Employee.department_id]")
    manager = relationship("Employee", foreign_keys=[manager_id], post_update=True)
    workforce_metrics = relationship("WorkforceMetric", back_populates="department")
    ai_insights = relationship("AIInsight", back_populates="department")
