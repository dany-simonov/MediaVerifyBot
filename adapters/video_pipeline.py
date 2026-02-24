"""Video analysis pipeline — FFmpeg frame extraction + SightEngine per-frame analysis."""

import asyncio
import logging
import subprocess

import ffmpeg

from adapters.base import BaseAdapter
from api.schemas import AnalysisResult
from core.config import settings
from core.enums import MediaType, ModelUsed, Verdict
from core.exceptions import ExternalAPIError, FileTooLarge, VideoTooLong

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
    """Extract 1 frame per second as JPEG bytes using ffmpeg (in-memory, no disk I/O)."""
    try:
        out, _ = (
            ffmpeg
            .input("pipe:0")
            .filter("fps", fps=settings.video_frame_sample_rate)
            .output("pipe:1", format="image2", vcodec="mjpeg")
            .run(input=video_bytes, capture_stdout=True, capture_stderr=True)
        )
    except ffmpeg.Error as exc:
        logger.error("ffmpeg frame extraction error: %s", exc.stderr.decode(errors="replace") if exc.stderr else exc)
        return []

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
            raise FileTooLarge(
                f"Видеофайл слишком большой ({len(data) // (1024 * 1024)} МБ). "
                f"Максимум — {MAX_VIDEO_FILE_SIZE // (1024 * 1024)} МБ."
            )

        # 1. Check duration
        duration = _get_duration(data)
        if duration > settings.max_video_duration_seconds:
            raise VideoTooLong(
                f"Видео слишком длинное ({int(duration)}с). "
                f"Максимум — {settings.max_video_duration_seconds}с."
            )

        # 2. Extract frames
        frames = _extract_frames(data)
        if not frames:
            return self._build_uncertain(
                "Не удалось извлечь кадры из видео.",
                ModelUsed.SIGHTENGINE_VIDEO,
                MediaType.VIDEO,
            )

        # 3. Analyze frames — try SightEngine first, fall back to HFImage if all fail
        from adapters.hf_image import HFImageAdapter
        from adapters.sightengine import SightengineAdapter

        semaphore = asyncio.Semaphore(CONCURRENT_LIMIT)
        sightengine_adapter = SightengineAdapter()
        hf_adapter = HFImageAdapter()
        use_hf_fallback = False

        # Try one frame with SightEngine to detect quota exhaustion
        test_frame = frames[0]
        try:
            await sightengine_adapter.analyze(test_frame)
        except ExternalAPIError as exc:
            if exc.detail in ("rate_limit", "server_error"):
                logger.warning("SightEngine unavailable (%s), switching to HFImage for video frames", exc.detail)
                use_hf_fallback = True
            else:
                raise

        active_adapter = hf_adapter if use_hf_fallback else sightengine_adapter
        model_used = ModelUsed.HF_IMAGE if use_hf_fallback else ModelUsed.SIGHTENGINE_VIDEO

        async def _analyze_frame(frame_bytes: bytes) -> float | None:
            async with semaphore:
                try:
                    result = await active_adapter.analyze(frame_bytes)
                    # Normalize: for HF adapter confidence is already 0-1 for best label;
                    # for FAKE we keep it as-is, for REAL we convert to "fakeness" score = 1 - confidence
                    if result.verdict == Verdict.REAL:
                        return 1.0 - result.confidence  # low fakeness
                    if result.verdict == Verdict.FAKE:
                        return result.confidence  # high fakeness
                    return 0.5  # UNCERTAIN → neutral
                except ExternalAPIError:
                    return None

        tasks = [_analyze_frame(f) for f in frames]
        raw_scores: list[float | None] = list(await asyncio.gather(*tasks))
        valid_scores: list[float] = [s for s in raw_scores if s is not None]

        if not valid_scores:
            return self._build_uncertain(
                "Не удалось проанализировать кадры видео.",
                model_used,
                MediaType.VIDEO,
            )

        # 4. Aggregate (scores are "fakeness" 0..1)
        total_frames = len(valid_scores)
        fake_count = sum(1 for s in valid_scores if s >= 0.75)
        real_count = sum(1 for s in valid_scores if s <= 0.35)
        fake_ratio = fake_count / total_frames

        fake_scores_list = [s for s in valid_scores if s >= 0.75]
        real_scores_list = [s for s in valid_scores if s <= 0.35]

        if fake_ratio >= 0.40:
            verdict = Verdict.FAKE
            # confidence = avg of fakeness scores for fake frames
            confidence = sum(fake_scores_list) / len(fake_scores_list)
        elif fake_ratio <= 0.10:
            verdict = Verdict.REAL
            # confidence = 1 - avg_fakeness of real frames  → high real confidence
            avg_fakeness = sum(real_scores_list) / len(real_scores_list) if real_scores_list else 0.15
            confidence = 1.0 - avg_fakeness
        else:
            verdict = Verdict.UNCERTAIN
            confidence = 0.5

        fallback_note = " (использован HuggingFace как резервный)" if use_hf_fallback else ""
        explanation = (
            f"Видео-анализ{fallback_note}: {total_frames} кадров проверено. "
            f"Подозрительных: {fake_count}, подлинных: {real_count}. "
            f"Доля подозрительных: {round(fake_ratio * 100)}%."
        )

        return AnalysisResult(
            verdict=verdict,
            confidence=round(confidence, 4),
            model_used=model_used,
            explanation=explanation,
            media_type=MediaType.VIDEO,
        )
