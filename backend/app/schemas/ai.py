from pydantic import BaseModel
from typing import Optional, List, Dict, Any
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
    agent_persona: Optional[str] = None

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

# ---------------------------------------------------------
# NEW AI WORKFLOW & INTELLIGENCE SCHEMAS
# ---------------------------------------------------------

class ResumeScreeningRequest(BaseModel):
    job_title: str
    job_description: str
    required_skills: List[str]
    candidate_name: str
    candidate_resume_text: str
    candidate_skills: List[str]
    min_years_experience: float = 0.0
    candidate_experience_years: float = 0.0

class ResumeScreeningResponse(BaseModel):
    candidate_name: str
    job_title: str
    match_score: float
    recommendation: str # STRONG_MATCH, POTENTIAL_MATCH, WEAK_MATCH
    matched_skills: List[str]
    missing_required_skills: List[str]
    skill_match_pct: float
    experience_match: str
    explainable_breakdown: Dict[str, float]
    summary_rationale: str

class ExplainableDecisionRequest(BaseModel):
    decision_type: str # LEAVE_APPROVAL, PERFORMANCE_RATING, COMPENSATION_REVIEW, WORKFORCE_RISK
    entity_id: int
    context_data: Optional[Dict[str, Any]] = {}

class ExplainableDecisionResponse(BaseModel):
    decision_id: str
    decision_type: str
    entity_id: int
    recommendation: str
    confidence: float
    feature_importance: Dict[str, float]
    narrative_explanation: str
    data_lineage_sources: List[str]
    guardrail_status: str

class PerformancePredictionResponse(BaseModel):
    employee_id: int
    employee_name: str
    department_name: str
    predicted_performance_score: float
    expected_grade: str # EXCEEDS, MEETS, NEEDS_IMPROVEMENT
    burnout_risk_score: float
    burnout_risk_level: str # LOW, MEDIUM, HIGH
    retention_risk_level: str # LOW, MEDIUM, HIGH
    contributing_factors: Dict[str, float]
    recommended_interventions: List[str]

class ChatbotQueryRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []

class ChatbotQueryResponse(BaseModel):
    response: str
    intent: str
    sources: List[str]
    confidence: float
    suggested_actions: Optional[List[str]] = None
    guardrail_status: str
