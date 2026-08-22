from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.policy import Policy
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/policies", tags=["Policies"])

@router.get("")
def get_policies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    policies = db.query(Policy).filter(Policy.active == True).all()
    return [
        {
            "id": p.id,
            "policy_name": p.policy_name,
            "category": p.category,
            "content": p.content,
            "version": p.version
        } for p in policies
    ]
