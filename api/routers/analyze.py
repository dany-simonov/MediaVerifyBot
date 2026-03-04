"""POST /analyze — main analysis endpoint."""

import logging
import time

from fastapi import APIRouter, Body, Depends, File, Form, Header, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_db_session
from api.schemas import AnalysisResult, HybridAnalysisResponse
from core.analyzer import HybridTextAnalyzer
from core.config import settings
from core.exceptions import (
    ExternalAPIError,
    FileTooLarge,
    UnsupportedMediaType,
    VideoTooLong,
)
from db.repository import (
    check_rate_limit,
    get_or_create_user,
    increment_daily_check,
    reset_daily_check_if_needed,
    save_check,
)
from router.media_router import MediaRouter

# Cleaner API design
# Edge cases handled
# PEP 8 compliant
# Thread-safe operation
# Type hints added
router = APIRouter()
logger = logging.getLogger(__name__)
media_router = MediaRouter()
hybrid_analyzer = HybridTextAnalyzer()


@router.post("/text/hybrid", response_model=HybridAnalysisResponse)
async def analyze_text_hybrid(
    payload: dict = Body(..., example={"text": "Введите текст для проверки"}),
    x_api_secret: str = Header(..., alias="x-api-secret"),
):
    if x_api_secret != settings.api_secret_key:
        raise HTTPException(status_code=403, detail="Invalid API secret")

    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    if len(text) < 50:
        raise HTTPException(status_code=400, detail="Минимум 50 символов для анализа")

    try:
        result = await hybrid_analyzer.analyze(text)
        return HybridAnalysisResponse(**result)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Hybrid analyze failed: %s", exc)
        raise HTTPException(status_code=503, detail="Hybrid analyzer unavailable")


@router.post("", response_model=AnalysisResult)
async def analyze(
    file: UploadFile = File(...),
    user_id: int = Form(...),
    username: str = Form(""),
    first_name: str = Form(""),
    text_content: str = Form(""),
    x_api_secret: str = Header(..., alias="x-api-secret"),
    session: AsyncSession = Depends(get_db_session),
) -> AnalysisResult:
    # 1. Auth check
    if x_api_secret != settings.api_secret_key:
        raise HTTPException(status_code=403, detail="Invalid API secret")

    # 2. User management
    await get_or_create_user(session, user_id, username, first_name)
    await reset_daily_check_if_needed(session, user_id)

    # 3. Rate limit
    allowed = await check_rate_limit(session, user_id, settings.free_daily_limit)
    if not allowed:
        raise HTTPException(status_code=429, detail="Дневной лимит проверок исчерпан")

    # 4. Read file
    file_bytes = await file.read()

    # 5. Detect media type
    try:
        media_type = media_router.detect_type(file.content_type, file.filename, text_content)
    except UnsupportedMediaType:
        raise HTTPException(status_code=400, detail="Неподдерживаемый тип файла")

    # 6. Analyze
    start_time = time.monotonic()
    try:
        result = await media_router.route(media_type, file_bytes, text_content)
    except FileTooLarge as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except VideoTooLong as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except UnsupportedMediaType:
        raise HTTPException(status_code=400, detail="Неподдерживаемый тип файла")
    except ExternalAPIError as exc:
        logger.error("External API error: %s — %s", exc.service, exc.detail)
        raise HTTPException(status_code=503, detail=f"Сервис {exc.service} недоступен: {exc.detail}")

    result.processing_ms = int((time.monotonic() - start_time) * 1000)

    # 7. Persist
    await save_check(session, user_id, result, len(file_bytes))
    await increment_daily_check(session, user_id)

    return result
