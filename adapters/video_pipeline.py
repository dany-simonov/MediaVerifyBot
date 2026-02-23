"""Video analysis pipeline — FFmpeg frame extraction + SightEngine per-frame analysis."""

import asyncio
import logging
import subprocess

import ffmpeg

from adapters.base import BaseAdapter
from adapters.sightengine import SightengineAdapter
from api.schemas import AnalysisResult
from core.config import settings
from core.enums import MediaType, ModelUsed, Verdict
from core.exceptions import ExternalAPIError, VideoTooLong

logger = logging.getLogger(__name__)

MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
CONCURRENT_LIMIT = 5  # max concurrent SightEngine requests


def _get_duration(video_bytes: bytes) -> float:
    """Get video duration in seconds using ffprobe via stdin."""
    proc = subprocess.run(
        [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            "-i", "pipe:0",
        ],
        input=video_bytes,
        capture_output=True,
    )
    try:
        return float(proc.stdout.decode().strip())
    except (ValueError, AttributeError):
        logger.warning("Could not determine video duration, assuming 0")
        return 0.0


def _extract_frames(video_bytes: bytes) -> list[bytes]:
    """Extract 1 frame per second as JPEG bytes using ffmpeg."""
    out, _ = (
        ffmpeg
        .input("pipe:0")
        .filter("fps", fps=settings.video_frame_sample_rate)
        .output("pipe:1", format="image2", vcodec="mjpeg")
        .run(input=video_bytes, capture_stdout=True, capture_stderr=True)
    )

    # Split output into individual JPEG frames by SOI (FF D8) and EOI (FF D9) markers
    frames: list[bytes] = []
    soi = b"\xff\xd8"
    eoi = b"\xff\xd9"

    start = 0
    while True:
        s = out.find(soi, start)
        if s == -1:
            break
        e = out.find(eoi, s)
        if e == -1:
            break
        frames.append(out[s : e + 2])
        start = e + 2

    return frames


class VideoPipeline(BaseAdapter):
    async def analyze(self, data: bytes) -> AnalysisResult:
        if len(data) > MAX_VIDEO_FILE_SIZE:
            raise ExternalAPIError("video_pipeline", f"Видеофайл слишком большой (макс. {MAX_VIDEO_FILE_SIZE // (1024*1024)} МБ)")

        # 1. Check duration
        duration = _get_duration(data)
        if duration > settings.max_video_duration_seconds:
            raise VideoTooLong(
                f"Видео слишком длинное ({int(duration)}с). Максимум — {settings.max_video_duration_seconds}с."
            )

        # 2. Extract frames
        frames = _extract_frames(data)
        if not frames:
            return self._build_uncertain(
                "Не удалось извлечь кадры из видео.",
                ModelUsed.SIGHTENGINE_VIDEO,
                MediaType.VIDEO,
            )

        # 3. Analyze frames with SightEngine (limited concurrency)
        semaphore = asyncio.Semaphore(CONCURRENT_LIMIT)
        adapter = SightengineAdapter()

        async def _analyze_frame(frame_bytes: bytes) -> float | None:
            async with semaphore:
                try:
                    result = await adapter.analyze(frame_bytes)
                    return result.confidence
                except ExternalAPIError:
                    return None

        tasks = [_analyze_frame(f) for f in frames]
        scores = await asyncio.gather(*tasks)
        valid_scores = [s for s in scores if s is not None]

        if not valid_scores:
            return self._build_uncertain(
                "Не удалось проанализировать кадры видео.",
                ModelUsed.SIGHTENGINE_VIDEO,
                MediaType.VIDEO,
            )

        # 4. Aggregate
        total_frames = len(valid_scores)
        fake_scores = [s for s in valid_scores if s >= 0.75]
        real_scores = [s for s in valid_scores if s <= 0.35]
        fake_ratio = len(fake_scores) / total_frames

        if fake_ratio >= 0.40:
            verdict = Verdict.FAKE
            confidence = sum(fake_scores) / len(fake_scores) if fake_scores else 0.5
        elif fake_ratio <= 0.10:
            verdict = Verdict.REAL
            confidence = sum(real_scores) / len(real_scores) if real_scores else 0.5
            confidence = 1.0 - confidence  # invert for REAL confidence
        else:
            verdict = Verdict.UNCERTAIN
            confidence = 0.5

        explanation = (
            f"Видео-анализ: {total_frames} кадров проверено. "
            f"Подозрительных: {len(fake_scores)}, подлинных: {len(real_scores)}. "
            f"Доля подозрительных: {round(fake_ratio * 100)}%."
        )

        return AnalysisResult(
            verdict=verdict,
            confidence=round(confidence, 4),
            model_used=ModelUsed.SIGHTENGINE_VIDEO,
            explanation=explanation,
            media_type=MediaType.VIDEO,
        )
