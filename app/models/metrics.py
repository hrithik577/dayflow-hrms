from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Date, DateTime, Float, Text

from app.db.session import Base


def utc_now():
    return datetime.now(timezone.utc)


class WorkforceMetric(Base):
    __tablename__ = "workforce_metrics"

    id = Column(Integer, primary_key=True, index=True)
    metric_date = Column(Date, nullable=False, index=True)
    total_employees = Column(Integer, nullable=False)
    attendance_rate = Column(Float, nullable=False)
    late_rate = Column(Float, nullable=False)
    leave_rate = Column(Float, nullable=False)
    turnover_rate = Column(Float, default=0.0, nullable=False)
    department_breakdown_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
