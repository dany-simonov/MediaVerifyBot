"""Pydantic schemas for API requests/responses."""

from pydantic import BaseModel, ConfigDict

from core.enums import MediaType, ModelUsed, Verdict


class AnalysisResult(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    verdict: Verdict
    confidence: float  # 0.0 – 1.0
    model_used: ModelUsed
    explanation: str
    media_type: MediaType
    processing_ms: int = 0


class AnalysisRequest(BaseModel):
    user_id: int
    username: str | None = None
    first_name: str | None = None


class HealthResponse(BaseModel):
    status: str
    version: str
    db: str
