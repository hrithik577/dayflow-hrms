from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class AIEventCreate(BaseModel):
    request_id: str
    user_id: Optional[int] = None
    agent_name: str
    action_type: str
    input_summary: Optional[str] = None
    data_sources: Optional[str] = None
    decision: Optional[str] = None
    confidence: Optional[float] = None
    guardrail_status: str = "PASSED"
    human_approval_required: bool = False
    human_approved: Optional[bool] = None
    tool_name: Optional[str] = None
    tool_result_reference: Optional[str] = None


class AIEventOut(AIEventCreate):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AIInsightOut(BaseModel):
    id: int
    title: str
    category: str
    description: str
    metrics_json: Optional[str] = None
    severity: str
    is_dismissed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AttendanceAnomalyOut(BaseModel):
    id: int
    employee_id: int
    date: date
    anomaly_type: str
    severity: str
    description: str
    status: str
    detected_by: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
