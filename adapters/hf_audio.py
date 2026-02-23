"""HuggingFace audio deepfake detection — fallback adapter."""

import asyncio
import logging
import subprocess

import httpx

from adapters.base import BaseAdapter
from api.schemas import AnalysisResult
from core.config import settings
from core.enums import MediaType, ModelUsed, Verdict

logger = logging.getLogger(__name__)

MODEL_URL = "https://api-inference.huggingface.co/models/mo-gg/wav2vec2-large-xlsr-deepfake-detection"
MAX_RETRIES = 2
COLD_START_DELAY = 10


class HFAudioAdapter(BaseAdapter):
    async def analyze(self, data: bytes) -> AnalysisResult:
        # Ensure WAV format (convert OGG if needed)
        wav_data = data
        if data[:4] == b"OggS":
            proc = subprocess.run(
                ["ffmpeg", "-i", "pipe:0", "-f", "wav", "-acodec", "pcm_s16le", "pipe:1"],
                input=data,
                capture_output=True,
            )
            if proc.returncode == 0:
                wav_data = proc.stdout
            else:
                logger.warning("ffmpeg conversion failed, sending raw data")

        headers = {"Authorization": f"Bearer {settings.hf_api_token}"}

        for attempt in range(MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                    response = await client.post(MODEL_URL, headers=headers, content=wav_data)
            except httpx.TimeoutException:
                return self._build_uncertain(
                    "HuggingFace Audio: таймаут запроса.",
                    ModelUsed.HF_AUDIO,
                    MediaType.AUDIO,
                )

            body = response.json()

            if isinstance(body, dict) and body.get("error", "").startswith("Model"):
                if attempt < MAX_RETRIES:
                    logger.info("HF Audio model loading, retry in %ds...", COLD_START_DELAY)
                    await asyncio.sleep(COLD_START_DELAY)
                    continue
                return self._build_uncertain(
                    "HuggingFace Audio: модель загружается, попробуйте позже.",
                    ModelUsed.HF_AUDIO,
                    MediaType.AUDIO,
                )
            break

        if not isinstance(body, list):
            return self._build_uncertain(
                "HuggingFace Audio: неожиданный формат ответа.",
                ModelUsed.HF_AUDIO,
                MediaType.AUDIO,
            )

        # Expected labels: "spoof" (FAKE) / "bonafide" (REAL)
        best = max(body, key=lambda x: x.get("score", 0))
        label = best.get("label", "").lower()
        score = best.get("score", 0.5)

        if score > 0.7:
            if label == "spoof":
                verdict = Verdict.FAKE
            elif label == "bonafide":
                verdict = Verdict.REAL
            else:
                verdict = Verdict.UNCERTAIN
        else:
            verdict = Verdict.UNCERTAIN

        explanation = f"HuggingFace Audio: {label} с уверенностью {round(score * 100)}%"

        return AnalysisResult(
            verdict=verdict,
            confidence=round(score, 4),
            model_used=ModelUsed.HF_AUDIO,
            explanation=explanation,
            media_type=MediaType.AUDIO,
        )
