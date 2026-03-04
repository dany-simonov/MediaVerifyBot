"""User endpoints for Mini App — stats, history, and PDF reports."""

import io
import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_db_session
from core.config import settings
from db.models import Check, User

# Optimized for async execution
router = APIRouter(prefix="/user", tags=["user"])
logger = logging.getLogger(__name__)


class UserStatsResponse(BaseModel):
    user_id: int
    is_premium: bool
    checks_today: int
    daily_limit: int
    total_checks: int
    created_at: str


class CheckResponse(BaseModel):
    id: str
    media_type: str
    verdict: str
    confidence: float
    model_used: str
    explanation: str
    processing_ms: int
    created_at: str


def _verify_api_secret(x_api_secret: str = Header(..., alias="x-api-secret")) -> str:
    if x_api_secret != settings.api_secret_key:
        raise HTTPException(status_code=403, detail="Invalid API secret")
    return x_api_secret


@router.get("/{user_id}/stats", response_model=UserStatsResponse)
async def get_user_stats(
    user_id: int,
    session: AsyncSession = Depends(get_db_session),
    _: str = Depends(_verify_api_secret),
) -> UserStatsResponse:
    """Get user statistics for Mini App dashboard."""
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Calculate checks today
    today = date.today()
    checks_today = user.daily_checks_count
    if user.daily_checks_reset and user.daily_checks_reset.date() != today:
        checks_today = 0

    daily_limit = settings.free_daily_limit
    if user.is_premium:
        daily_limit = settings.premium_monthly_limit

    return UserStatsResponse(
        user_id=user.id,
        is_premium=user.is_premium,
        checks_today=checks_today,
        daily_limit=daily_limit,
        total_checks=user.total_checks,
        created_at=user.created_at.isoformat(),
    )


@router.get("/{user_id}/checks", response_model=list[CheckResponse])
async def get_user_checks(
    user_id: int,
    limit: int = 10,
    offset: int = 0,
    media_type: Optional[str] = None,
    verdict: Optional[str] = None,
    session: AsyncSession = Depends(get_db_session),
    _: str = Depends(_verify_api_secret),
) -> list[CheckResponse]:
    """Get user's check history with optional filters."""
    # Verify user exists
    user_result = await session.execute(select(User).where(User.id == user_id))
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")

    # Build query with filters
    query = select(Check).where(Check.user_id == user_id)

    if media_type:
        query = query.where(Check.media_type == media_type)
    if verdict:
        query = query.where(Check.verdict == verdict)

    query = query.order_by(Check.created_at.desc()).offset(offset).limit(min(limit, 100))

    result = await session.execute(query)
    checks = result.scalars().all()

    return [
        CheckResponse(
            id=str(check.id),
            media_type=check.media_type,
            verdict=check.verdict,
            confidence=check.confidence,
            model_used=check.model_used,
            explanation=check.explanation,
            processing_ms=check.processing_ms,
            created_at=check.created_at.isoformat(),
        )
        for check in checks
    ]


# Model names in Russian for PDF report
MODEL_NAMES_RU = {
    "sightengine": "Sightengine (анализ изображений)",
    "sightengine_video_pipeline": "Sightengine (видео-анализ)",
    "resemble_detect": "Resemble Detect (аудио-анализ)",
    "sapling": "Sapling AI (текстовый анализ)",
    "hf_image_inference": "HuggingFace (изображения)",
    "hf_audio_inference": "HuggingFace (аудио)",
    "fallback_uncertain": "Резервная система",
}

VERDICT_TEXT_RU = {
    "REAL": "Человеческий контент",
    "FAKE": "Сгенерировано ИИ",
    "UNCERTAIN": "Не определено",
}

MEDIA_TYPE_RU = {
    "image": "Изображение",
    "audio": "Аудио",
    "video": "Видео",
    "text": "Текст",
}


def _generate_pdf_report(check: Check) -> bytes:
    """Generate a PDF report for a single check using reportlab."""
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.platypus import (
            Paragraph,
            SimpleDocTemplate,
            Spacer,
            Table,
            TableStyle,
        )
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="PDF generation not available. Install reportlab: pip install reportlab",
        )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=18,
        spaceAfter=10,
    )
    normal_style = ParagraphStyle(
        "CustomNormal",
        parent=styles["Normal"],
        fontSize=11,
        spaceAfter=6,
    )
    label_style = ParagraphStyle(
        "Label",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.grey,
    )

    elements = []

    # Title
    elements.append(Paragraph("Istochnik — Report / Отчёт о проверке", title_style))
    elements.append(Spacer(1, 10 * mm))

    # Calculate authenticity index
    confidence = check.confidence
    if check.verdict == "FAKE":
        authenticity_index = round((1 - confidence) * 100)
    else:
        authenticity_index = round(confidence * 100)

    # Data table
    data = [
        ["ID проверки:", str(check.id)],
        ["Тип контента:", MEDIA_TYPE_RU.get(check.media_type, check.media_type)],
        ["Вердикт:", VERDICT_TEXT_RU.get(check.verdict, check.verdict)],
        ["Индекс подлинности:", f"{authenticity_index}%"],
        ["Модель анализа:", MODEL_NAMES_RU.get(check.model_used, check.model_used)],
        ["Время обработки:", f"{check.processing_ms} мс"],
        ["Дата проверки:", check.created_at.strftime("%d.%m.%Y %H:%M:%S")],
    ]

    table = Table(data, colWidths=[50 * mm, 100 * mm])
    table.setStyle(
        TableStyle(
            [
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.grey),
                ("ALIGN", (0, 0), (0, -1), "RIGHT"),
                ("ALIGN", (1, 0), (1, -1), "LEFT"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(table)
    elements.append(Spacer(1, 10 * mm))

    # Explanation
    elements.append(Paragraph("Пояснение:", label_style))
    elements.append(Paragraph(check.explanation or "—", normal_style))
    elements.append(Spacer(1, 15 * mm))

    # Footer
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.grey,
    )
    elements.append(
        Paragraph(
            "Этот отчёт сгенерирован автоматически системой Источник (istochnik.app). "
            "Результаты носят информационный характер и не являются юридическим заключением.",
            footer_style,
        )
    )

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


@router.get("/{user_id}/checks/{check_id}/report")
async def get_check_report(
    user_id: int,
    check_id: str,
    session: AsyncSession = Depends(get_db_session),
    _: str = Depends(_verify_api_secret),
) -> StreamingResponse:
    """Generate and download a PDF report for a specific check."""
    # Verify user exists
    user_result = await session.execute(select(User).where(User.id == user_id))
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")

    # Get check
    check_result = await session.execute(
        select(Check).where(Check.id == check_id, Check.user_id == user_id)
    )
    check = check_result.scalar_one_or_none()
    if not check:
        raise HTTPException(status_code=404, detail="Check not found")

    # Generate PDF
    pdf_bytes = _generate_pdf_report(check)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="istochnik_report_{check_id[:8]}.pdf"'
        },
    )
