"""Repository layer — async CRUD operations for users, checks, rate_limits."""

from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas import AnalysisResult
from db.models import Check, RateLimit, User


async def get_or_create_user(
    session: AsyncSession,
    telegram_id: int,
    username: str = "",
    first_name: str = "",
) -> User:
    """Get existing user or create a new one by Telegram user_id."""
    result = await session.execute(select(User).where(User.id == telegram_id))
    user = result.scalar_one_or_none()

    if user is not None:
        # Update mutable fields
        if username:
            user.username = username
        if first_name:
            user.first_name = first_name
        user.updated_at = datetime.now(timezone.utc)
        return user

    user = User(
        id=telegram_id,
        username=username or None,
        first_name=first_name or None,
        daily_checks_count=0,
        daily_checks_reset=datetime.now(timezone.utc),
        total_checks=0,
    )
    session.add(user)
    await session.flush()
    return user


async def increment_daily_check(session: AsyncSession, user_id: int) -> int:
    """Increment daily check counter, return updated value."""
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        return 0

    user.daily_checks_count += 1
    user.total_checks += 1
    user.updated_at = datetime.now(timezone.utc)

    # Also update rate_limits table
    today = date.today()
    rl_result = await session.execute(
        select(RateLimit).where(RateLimit.user_id == user_id, RateLimit.date == today)
    )
    rl = rl_result.scalar_one_or_none()
    if rl is None:
        rl = RateLimit(user_id=user_id, date=today, count=1)
        session.add(rl)
    else:
        rl.count += 1

    await session.flush()
    return user.daily_checks_count


async def reset_daily_check_if_needed(session: AsyncSession, user_id: int) -> None:
    """Reset the daily counter if the last reset was before today."""
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        return

    today = date.today()
    reset_date = user.daily_checks_reset.date() if user.daily_checks_reset else None

    if reset_date is None or reset_date < today:
        user.daily_checks_count = 0
        user.daily_checks_reset = datetime.now(timezone.utc)
        await session.flush()


async def check_rate_limit(session: AsyncSession, user_id: int, limit: int) -> bool:
    """Return True if the user is allowed to perform another check (under the daily limit)."""
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        return True  # new user, will be created

    if user.is_premium:
        return True  # premium users have a much higher limit (handled elsewhere)

    return user.daily_checks_count < limit


async def save_check(
    session: AsyncSession,
    user_id: int,
    result: AnalysisResult,
    file_size_bytes: int = 0,
) -> Check:
    """Persist an analysis result to the checks table."""
    check = Check(
        user_id=user_id,
        media_type=result.media_type.value,
        verdict=result.verdict.value,
        confidence=result.confidence,
        model_used=result.model_used.value,
        explanation=result.explanation,
        file_size_bytes=file_size_bytes if file_size_bytes > 0 else None,
        processing_ms=result.processing_ms,
    )
    session.add(check)
    await session.flush()
    return check


async def get_user_checks_today(session: AsyncSession, user_id: int) -> int:
    """Return the number of checks a user has performed today."""
    today = date.today()
    result = await session.execute(
        select(RateLimit.count).where(RateLimit.user_id == user_id, RateLimit.date == today)
    )
    count = result.scalar_one_or_none()
    return count or 0
