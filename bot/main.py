"""Bot entry point — polling mode for MVP."""

import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from core.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)


async def main() -> None:
    from bot.handlers import media, text_check  # noqa: late import to avoid circular deps

    bot = Bot(
        token=settings.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher()

    # middlewares
    from bot.middlewares.rate_limit import RateLimitMiddleware
    dp.message.middleware(RateLimitMiddleware())

    # routers
    dp.include_router(media.router)
    dp.include_router(text_check.router)

    logger.info("Bot started in polling mode")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
