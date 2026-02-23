"""Abstract base adapter for external API integrations."""

from abc import ABC, abstractmethod

from api.schemas import AnalysisResult
from core.enums import MediaType, ModelUsed, Verdict


class BaseAdapter(ABC):
    TIMEOUT = 15.0

    @abstractmethod
    async def analyze(self, data: bytes) -> AnalysisResult:
        ...

    def _build_uncertain(self, reason: str, model: ModelUsed, media_type: MediaType) -> AnalysisResult:
        """Return an UNCERTAIN result with explanation."""
        return AnalysisResult(
            verdict=Verdict.UNCERTAIN,
            confidence=0.5,
            model_used=model,
            explanation=reason,
            media_type=media_type,
            processing_ms=0,
        )
