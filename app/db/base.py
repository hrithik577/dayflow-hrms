# Import Base and all models so that Alembic has a unified target metadata
from app.db.session import Base
from app.models import (
    User,
    Department,
    Employee,
    Attendance,
    LeaveType,
    LeaveRequest,
    LeaveBalance,
    Payroll,
    Document,
    Notification,
    AuditLog,
    AIEvent,
    AIInsight,
    AttendanceAnomaly,
    WorkforceMetric,
    Policy,
)
