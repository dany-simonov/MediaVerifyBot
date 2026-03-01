"""POST /bigcheck — multi-file cross-analysis endpoint."""

import logging
import time
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_db_session
from api.schemas import AnalysisResult
from core.config import settings
from core.enums import MediaType, Verdict
from core.exceptions import ExternalAPIError, UnsupportedMediaType
from db.repository import (
    check_rate_limit,
    get_or_create_user,
    increment_daily_check,
    reset_daily_check_if_needed,
    save_check,
)
from router.media_router import MediaRouter

router = APIRouter()
logger = logging.getLogger(__name__)
media_router = MediaRouter()


class BigCheckFileResult(BaseModel):
    """Result for a single file in the Big Check batch."""

    filename: str
    media_type: str
    verdict: str
    confidence: float
    model_used: str
    explanation: str
    processing_ms: int


class BigCheckResponse(BaseModel):
    """Aggregated Big Check response."""

    overall_verdict: str
    overall_confidence: float
    authenticity_index: int
    summary: str
    results: list[BigCheckFileResult]
    total_files: int
    total_processing_ms: int


def _cross_analysis(results: list[AnalysisResult]) -> tuple[Verdict, float, str]:
    """
    Cross-analysis logic:
    - fake_count / total >= 0.5 → FAKE
    - real_count / total >= 0.7 → REAL
    - else → UNCERTAIN

    Returns (verdict, confidence, summary).
    """
    total = len(results)
    if total == 0:
        return Verdict.UNCERTAIN, 0.5, "Нет файлов для анализа"

    fake_count = sum(1 for r in results if r.verdict == Verdict.FAKE)
    real_count = sum(1 for r in results if r.verdict == Verdict.REAL)
    uncertain_count = sum(1 for r in results if r.verdict == Verdict.UNCERTAIN)

    avg_confidence = sum(r.confidence for r in results) / total

    if fake_count / total >= 0.5:
        verdict = Verdict.FAKE
        confidence = avg_confidence
        summary = (
            f"Кросс-анализ {total} файлов: {fake_count} из {total} определены как сгенерированные ИИ. "
            f"Вероятность подделки высокая."
        )
    elif real_count / total >= 0.7:
        verdict = Verdict.REAL
        confidence = avg_confidence
        summary = (
            f"Кросс-анализ {total} файлов: {real_count} из {total} определены как подлинные. "
            f"Контент с высокой вероятностью создан человеком."
        )
    else:
        verdict = Verdict.UNCERTAIN
        confidence = avg_confidence
        parts = []
        if real_count > 0:
            parts.append(f"{real_count} подлинных")
        if fake_count > 0:
            parts.append(f"{fake_count} сгенерированных")
        if uncertain_count > 0:
            parts.append(f"{uncertain_count} неопределённых")
        summary = (
            f"Кросс-анализ {total} файлов: {', '.join(parts)}. "
            f"Однозначный вердикт вынести невозможно."
        )

    return verdict, round(confidence, 4), summary


@router.post("", response_model=BigCheckResponse)
async def bigcheck(
    files: list[UploadFile] = File(...),
    user_id: int = Form(...),
    username: str = Form(""),
    first_name: str = Form(""),
    text_content: str = Form(""),
    x_api_secret: str = Header(..., alias="x-api-secret"),
    session: AsyncSession = Depends(get_db_session),
) -> BigCheckResponse:
    """
    Big Check: analyze multiple files + optional text in a single request.
    Performs cross-analysis to determine overall verdict.
    """
    # 1. Auth
    if x_api_secret != settings.api_secret_key:
        raise HTTPException(status_code=403, detail="Invalid API secret")

    # 2. User management
    await get_or_create_user(session, user_id, username, first_name)
    await reset_daily_check_if_needed(session, user_id)

    # 3. Rate limit — each file counts as one check
    total_items = len(files) + (1 if text_content and text_content.strip() else 0)
    if total_items == 0:
        raise HTTPException(status_code=400, detail="Загрузите хотя бы один файл или введите текст")
    if total_items > 10:
        raise HTTPException(status_code=400, detail="Максимум 10 элементов за раз")

    allowed = await check_rate_limit(session, user_id, settings.free_daily_limit)
    if not allowed:
        raise HTTPException(status_code=429, detail="Дневной лимит проверок исчерпан")

    # 4. Process each file
    individual_results: list[AnalysisResult] = []
    file_results: list[BigCheckFileResult] = []
    total_start = time.monotonic()

    for upload_file in files:
        file_bytes = await upload_file.read()
        if len(file_bytes) == 0:
            continue

        try:
            media_type = media_router.detect_type(
                upload_file.content_type, upload_file.filename, ""
            )
        except UnsupportedMediaType:
            file_results.append(
                BigCheckFileResult(
                    filename=upload_file.filename or "unknown",
                    media_type="unknown",
                    verdict="UNCERTAIN",
                    confidence=0.0,
                    model_used="fallback_uncertain",
                    explanation="Неподдерживаемый тип файла",
                    processing_ms=0,
                )
            )
            continue

        start_time = time.monotonic()
        try:
            result = await media_router.route(media_type, file_bytes, "")
        except (ExternalAPIError, Exception) as exc:
            logger.error("BigCheck file error (%s): %s", upload_file.filename, exc)
            file_results.append(
                BigCheckFileResult(
                    filename=upload_file.filename or "unknown",
                    media_type=media_type.value,
                    verdict="UNCERTAIN",
                    confidence=0.0,
                    model_used="fallback_uncertain",
                    explanation=f"Ошибка анализа: {exc}",
                    processing_ms=0,
                )
            )
            continue

        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        result.processing_ms = elapsed_ms

        # Save individual check
        await save_check(session, user_id, result, len(file_bytes))
        await increment_daily_check(session, user_id)

        individual_results.append(result)
        file_results.append(
            BigCheckFileResult(
                filename=upload_file.filename or "file",
                media_type=result.media_type.value,
                verdict=result.verdict.value,
                confidence=result.confidence,
                model_used=result.model_used.value,
                explanation=result.explanation,
                processing_ms=elapsed_ms,
            )
        )

    # 5. Process text if provided
    if text_content and text_content.strip():
        start_time = time.monotonic()
        try:
            text_result = await media_router.route(
                MediaType.TEXT, b"", text_content
            )
            elapsed_ms = int((time.monotonic() - start_time) * 1000)
            text_result.processing_ms = elapsed_ms

            await save_check(session, user_id, text_result, len(text_content.encode("utf-8")))
            await increment_daily_check(session, user_id)

            individual_results.append(text_result)
            file_results.append(
                BigCheckFileResult(
                    filename="text_input",
                    media_type=text_result.media_type.value,
                    verdict=text_result.verdict.value,
                    confidence=text_result.confidence,
                    model_used=text_result.model_used.value,
                    explanation=text_result.explanation,
                    processing_ms=elapsed_ms,
                )
            )
        except Exception as exc:
            logger.error("BigCheck text error: %s", exc)
            file_results.append(
                BigCheckFileResult(
                    filename="text_input",
                    media_type="text",
                    verdict="UNCERTAIN",
                    confidence=0.0,
                    model_used="fallback_uncertain",
                    explanation=f"Ошибка анализа текста: {exc}",
                    processing_ms=0,
                )
            )

    # 6. Cross-analysis
    overall_verdict, overall_confidence, summary = _cross_analysis(individual_results)

    # Calculate authenticity index
    if overall_verdict == Verdict.FAKE:
        authenticity_index = round((1 - overall_confidence) * 100)
    else:
        authenticity_index = round(overall_confidence * 100)

    total_ms = int((time.monotonic() - total_start) * 1000)

    return BigCheckResponse(
        overall_verdict=overall_verdict.value,
        overall_confidence=overall_confidence,
        authenticity_index=authenticity_index,
        summary=summary,
        results=file_results,
        total_files=len(file_results),
        total_processing_ms=total_ms,
    )
