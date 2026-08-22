from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.ai import AIEvent, AIInsight, AttendanceAnomaly


class AIRepository:
    @staticmethod
    def log_event(db: Session, **kwargs) -> AIEvent:
        event = AIEvent(**kwargs)
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def create_insight(db: Session, **kwargs) -> AIInsight:
        insight = AIInsight(**kwargs)
        db.add(insight)
        db.commit()
        db.refresh(insight)
        return insight

    @staticmethod
    def get_insights(db: Session, is_dismissed: bool = False, limit: int = 50) -> List[AIInsight]:
        return db.query(AIInsight).filter(
            AIInsight.is_dismissed == is_dismissed
        ).order_by(AIInsight.created_at.desc()).limit(limit).all()

    @staticmethod
    def get_anomalies(db: Session, status: Optional[str] = None, limit: int = 50) -> List[AttendanceAnomaly]:
        query = db.query(AttendanceAnomaly)
        if status:
            query = query.filter(AttendanceAnomaly.status == status)
        return query.order_by(AttendanceAnomaly.created_at.desc()).limit(limit).all()
