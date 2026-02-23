"""Sapling AI text detection adapter."""

import logging

import httpx

from adapters.base import BaseAdapter
from api.schemas import AnalysisResult
from core.config import settings
from core.enums import MediaType, ModelUsed, Verdict
from core.exceptions import ExternalAPIError

logger = logging.getLogger(__name__)

MIN_TEXT_LENGTH = 50
MAX_TEXT_LENGTH = 10_000


class SaplingAdapter(BaseAdapter):
    URL = "https://api.sapling.ai/api/v1/aidetect"

    async def analyze(self, data: bytes) -> AnalysisResult:
        text = data.decode("utf-8", errors="replace").strip()

        if len(text) < MIN_TEXT_LENGTH:
            return AnalysisResult(
                verdict=Verdict.UNCERTAIN,
                confidence=0.0,
                model_used=ModelUsed.SAPLING,
                explanation=f"Текст слишком короткий для анализа (минимум {MIN_TEXT_LENGTH} символов).",
                media_type=MediaType.TEXT,
            )

        truncated = False
        if len(text) > MAX_TEXT_LENGTH:
            text = text[:MAX_TEXT_LENGTH]
            truncated = True

        payload = {"key": settings.sapling_api_key, "text": text}

        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.post(self.URL, json=payload)
        except httpx.TimeoutException:
            return self._build_uncertain(
                "Sapling AI: таймаут запроса.",
                ModelUsed.SAPLING,
                MediaType.TEXT,
            )

        if response.status_code == 429:
            raise ExternalAPIError("sapling", "rate_limit")
        if response.status_code >= 500:
            raise ExternalAPIError("sapling", "server_error")

        body = response.json()
        score = body.get("score", 0.5)
        sentence_scores = body.get("sentence_scores", [])

        if score >= 0.80:
            verdict = Verdict.FAKE
        elif score <= 0.25:
            verdict = Verdict.REAL
        else:
            verdict = Verdict.UNCERTAIN

        # Find most suspicious sentence
        top_sentence = ""
        top_score = 0.0
        for item in sentence_scores:
            if isinstance(item, list) and len(item) >= 2 and item[1] > top_score:
                top_sentence = item[0]
                top_score = item[1]

        explanation = f"Sapling AI: вероятность написан ИИ {round(score * 100)}%."
        if top_sentence:
            explanation += f" Наиболее подозрительное предложение: «{top_sentence[:100]}» ({round(top_score * 100)}%)"
        if truncated:
            explanation += " (текст был обрезан до 10 000 символов)"

        return AnalysisResult(
            verdict=verdict,
            confidence=round(score, 4),
            model_used=ModelUsed.SAPLING,
            explanation=explanation,
            media_type=MediaType.TEXT,
        )
