"""Resemble Detect adapter — audio deepfake detection."""

import logging
import subprocess

import httpx

from adapters.base import BaseAdapter
from api.schemas import AnalysisResult
from core.config import settings
from core.enums import MediaType, ModelUsed, Verdict
from core.exceptions import ExternalAPIError

logger = logging.getLogger(__name__)


def _convert_ogg_to_wav(ogg_bytes: bytes) -> bytes:
    """Convert OGG bytes to WAV bytes using ffmpeg (in-memory, no disk I/O)."""
    proc = subprocess.run(
        ["ffmpeg", "-i", "pipe:0", "-f", "wav", "-acodec", "pcm_s16le", "pipe:1"],
        input=ogg_bytes,
        capture_output=True,
    )
    if proc.returncode != 0:
        logger.error("ffmpeg OGG->WAV conversion failed: %s", proc.stderr.decode(errors="replace"))
        raise ExternalAPIError("resemble", "audio_conversion_failed")
    return proc.stdout


class ResembleAdapter(BaseAdapter):
    URL = "https://detect.resemble.ai/api/v1/detect"

    async def analyze(self, data: bytes) -> AnalysisResult:
        # Convert OGG to WAV if needed (Telegram voice messages come as OGG)
        wav_data = data
        if data[:4] == b"OggS":
            wav_data = _convert_ogg_to_wav(data)

        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.post(
                    self.URL,
                    headers={"Authorization": f"Token {settings.resemble_api_key}"},
                    files={"audio_file": ("audio.wav", wav_data, "audio/wav")},
                )
        except httpx.TimeoutException:
            return self._build_uncertain(
                "Resemble Detect: таймаут запроса.",
                ModelUsed.RESEMBLE,
                MediaType.AUDIO,
            )

        if response.status_code == 429:
            raise ExternalAPIError("resemble", "rate_limit")
        if response.status_code >= 500:
            raise ExternalAPIError("resemble", "server_error")

        body = response.json()
        if not body.get("success", False):
            raise ExternalAPIError("resemble", f"API returned success=false")

        score = body.get("score", 0.5)

        if score >= 0.75:
            verdict = Verdict.FAKE
        elif score <= 0.30:
            verdict = Verdict.REAL
        else:
            verdict = Verdict.UNCERTAIN

        explanation = f"Resemble Detect: вероятность синтетической речи {round(score * 100)}%"

        return AnalysisResult(
            verdict=verdict,
            confidence=round(score, 4),
            model_used=ModelUsed.RESEMBLE,
            explanation=explanation,
            media_type=MediaType.AUDIO,
        )
