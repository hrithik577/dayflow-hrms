import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.core.websocket import manager as ws_manager

# Import routers
from app.api.auth import router as auth_router
from app.api.employees import router as employees_router
from app.api.attendance import router as attendance_router
from app.api.leaves import router as leaves_router
from app.api.payroll import router as payroll_router
from app.api.dashboard import router as dashboard_router
from app.api.ai import router as ai_router
from app.api.audit import router as audit_router
from app.api.notifications import router as notifications_router
from app.api.policies import router as policies_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dayflow.main")

# Auto-create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="DAYFLOW — AI-Native Human Resource Management & Workforce Intelligence Platform (Odoo x NMIT Hackathon 2026)"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(employees_router)
app.include_router(attendance_router)
app.include_router(leaves_router)
app.include_router(payroll_router)
app.include_router(dashboard_router)
app.include_router(ai_router)
app.include_router(audit_router)
app.include_router(notifications_router)
app.include_router(policies_router)

# Real-Time WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or heartbeat
            await websocket.send_text(f"ACK: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Dayflow Backend",
        "version": "1.0.0",
        "database": engine.name
    }
