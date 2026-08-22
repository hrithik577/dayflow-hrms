from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.analytics import WorkforceAnalyticsOut
from app.repositories.analytics_repository import AnalyticsRepository

router = APIRouter()


@router.get("/summary", response_model=WorkforceAnalyticsOut)
def get_workforce_analytics_summary(target_date: Optional[date] = None, db: Session = Depends(get_db)):
    """Fetch complete real-time SQL-based workforce analytics metrics."""
    return AnalyticsRepository.get_full_dashboard_summary(db, target_date=target_date)
