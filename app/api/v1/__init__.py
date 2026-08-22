from fastapi import APIRouter

from app.api.v1.employees import router as employees_router
from app.api.v1.attendance import router as attendance_router
from app.api.v1.leaves import router as leaves_router
from app.api.v1.payroll import router as payroll_router
from app.api.v1.audit import router as audit_router
from app.api.v1.ai import router as ai_router
from app.api.v1.analytics import router as analytics_router

api_v1_router = APIRouter()

api_v1_router.include_router(employees_router, prefix="/employees", tags=["Employees"])
api_v1_router.include_router(attendance_router, prefix="/attendance", tags=["Attendance"])
api_v1_router.include_router(leaves_router, prefix="/leaves", tags=["Leaves"])
api_v1_router.include_router(payroll_router, prefix="/payroll", tags=["Payroll"])
api_v1_router.include_router(audit_router, prefix="/audit", tags=["Audit Logs"])
api_v1_router.include_router(ai_router, prefix="/ai", tags=["AI Integration"])
api_v1_router.include_router(analytics_router, prefix="/analytics", tags=["Workforce Analytics"])
