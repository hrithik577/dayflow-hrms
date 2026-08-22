from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.ai import AIQueryRequest, AIQueryResponse, AIActionRequest, AIInsightOut, AIEventOut
from app.services.auth_service import get_current_user, require_roles

# =========================================================
# FILE STRUCTURE: AI COPILOT ROUTER
# =========================================================

router = APIRouter(prefix="/api/ai", tags=["AI Copilot"])

@router.post("/query", response_model=AIQueryResponse)
def query_ai_copilot(
    req: AIQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pass

@router.post("/action")
def execute_ai_action(
    req: AIActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pass

@router.get("/insights", response_model=List[AIInsightOut])
def get_ai_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pass

@router.get("/events", response_model=List[AIEventOut])
def get_ai_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.HR, UserRole.ADMIN]))
):
    pass
