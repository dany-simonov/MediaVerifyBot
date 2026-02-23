"""HuggingFace image deepfake detection — fallback adapter."""

import asyncio
import logging

import httpx

from adapters.base import BaseAdapter
from api.schemas import AnalysisResult
from core.config import settings
from core.enums import MediaType, ModelUsed, Verdict

logger = logging.getLogger(__name__)

MODEL_URL = "https://api-inference.huggingface.co/models/dima806/deepfake-vs-real-image-detection"
MAX_RETRIES = 2
COLD_START_DELAY = 10


class HFImageAdapter(BaseAdapter):
    async def analyze(self, data: bytes) -> AnalysisResult:
        headers = {"Authorization": f"Bearer {settings.hf_api_token}"}

        for attempt in range(MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                    response = await client.post(MODEL_URL, headers=headers, content=data)
            except httpx.TimeoutException:
                return self._build_uncertain(
                    "HuggingFace Image: таймаут запроса.",
                    ModelUsed.HF_IMAGE,
                    MediaType.IMAGE,
                )

            body = response.json()

            # Handle cold start
            if isinstance(body, dict) and body.get("error", "").startswith("Model"):
                if attempt < MAX_RETRIES:
                    logger.info("HF Image model loading, retry in %ds...", COLD_START_DELAY)
                    await asyncio.sleep(COLD_START_DELAY)
                    continue
                return self._build_uncertain(
                    "HuggingFace Image: модель загружается, попробуйте позже.",
                    ModelUsed.HF_IMAGE,
                    MediaType.IMAGE,
                )
            break

        if not isinstance(body, list):
            return self._build_uncertain(
                f"HuggingFace Image: неожиданный формат ответа.",
                ModelUsed.HF_IMAGE,
                MediaType.IMAGE,
            )

        # Find best prediction
        best = max(body, key=lambda x: x.get("score", 0))
        label = best.get("label", "").upper()
        score = best.get("score", 0.5)

        if score > 0.7:
            verdict = Verdict.FAKE if label == "FAKE" else Verdict.REAL
        else:
            verdict = Verdict.UNCERTAIN

        explanation = f"HuggingFace Image: {label} с уверенностью {round(score * 100)}%"

        return AnalysisResult(
            verdict=verdict,
            confidence=round(score, 4),
            model_used=ModelUsed.HF_IMAGE,
            explanation=explanation,
            media_type=MediaType.IMAGE,
        )
