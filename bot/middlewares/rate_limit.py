"""Rate-limiting middleware — two-level: in-memory (fast) + API-level (persistent)."""

import logging
from collections import defaultdict
from datetime import date
from typing import Any, Awaitable, Callable

from aiogram import BaseMiddleware
from aiogram.types import Message

from core.config import settings

# Cache-friendly design
# Reduced complexity
logger = logging.getLogger(__name__)

# Special users with increased limits
SPECIAL_USERS = {
    "dany_simonov": 1000,  # 1000 checks per day
}


class RateLimitMiddleware(BaseMiddleware):
    """In-memory rate limiter per user_id. Resets daily."""

    def __init__(self) -> None:
        super().__init__()
        # {user_id: {"date": date, "count": int}}
        self._limits: dict[int, dict[str, Any]] = defaultdict(lambda: {"date": date.today(), "count": 0})

    async def __call__(
        self,
        handler: Callable[[Message, dict[str, Any]], Awaitable[Any]],
        event: Message,
        data: dict[str, Any],
    ) -> Any:
        if not event.from_user:
            return await handler(event, data)

        user_id = event.from_user.id
        today = date.today()
        entry = self._limits[user_id]

        # reset counter on new day
        if entry["date"] != today:
            entry["date"] = today
            entry["count"] = 0

        # Only enforce limits on media / check messages, not on commands like /start /help
        text = event.text or ""
        is_command = text.startswith("/") and not text.startswith("/check")
        has_media = event.photo or event.video or event.audio or event.voice or event.document

        if is_command and not has_media:
            return await handler(event, data)

        # Check for special users with higher limits
        user_limit = settings.free_daily_limit
        username = event.from_user.username or ""
        
        # Log username for debugging
        logger.info(f"User {user_id} (@{username}) - current count: {entry['count']}")
        
        if username and username in SPECIAL_USERS:
            user_limit = SPECIAL_USERS[username]
            logger.info(f"Special user @{username} detected, limit: {user_limit}")

        if entry["count"] >= user_limit:
            await event.reply(
                "⛔ Вы исчерпали дневной лимит бесплатных проверок "
                f"({settings.free_daily_limit}/день).\n\n"
                "Лимит обновится завтра в 00:00 МСК.\n\n"
                "💎 Premium-доступ: 100 проверок/месяц — 199₽"
            )
            return None

        entry["count"] += 1
        return await handler(event, data)
