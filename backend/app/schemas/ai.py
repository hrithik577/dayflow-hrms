from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class AIQueryRequest(BaseModel):
    prompt: str

class AIActionRequest(BaseModel):
    tool_name: str
    arguments: Optional[dict] = {}

class AIQueryResponse(BaseModel):
    answer: str
    evidence: Optional[Any] = None
    sources: List[str]
    confidence: float
    recommendation: Optional[str] = None
    action_available: Optional[Any] = None
    guardrail_status: str # ALLOWED or BLOCKED
    tool_used: Optional[str] = None
    data_evidence: Optional[Any] = None
    security_reason: Optional[str] = None

class AIInsightOut(BaseModel):
    id: int
    employee_id: Optional[int] = None
    employee_name: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    insight_type: str
    severity: str
    title: str
    explanation: str
    evidence: Optional[str] = None
    recommendation: str
    confidence: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class AIEventOut(BaseModel):
    id: int
    request_id: str
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    agent_name: str
    action_type: str
    input_summary: str
    data_sources: Optional[str] = None
    decision: Optional[str] = None
    confidence: float
    guardrail_status: str
    tool_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
