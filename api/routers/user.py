"""User endpoints for Mini App — stats and history."""

import logging
from datetime import date

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_db_session
from core.config import settings
from db.models import Check, User

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
    session: AsyncSession = Depends(get_db_session),
    _: str = Depends(_verify_api_secret),
) -> list[CheckResponse]:
    """Get user's check history for Mini App."""
    # Verify user exists
    user_result = await session.execute(select(User).where(User.id == user_id))
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")

    # Get checks
    result = await session.execute(
        select(Check)
        .where(Check.user_id == user_id)
        .order_by(Check.created_at.desc())
        .limit(min(limit, 100))
    )
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
