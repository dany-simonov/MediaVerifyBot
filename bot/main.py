"""Bot entry point — polling mode for MVP."""

import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import BotCommand

from bot.handlers import media, text_check
from bot.middlewares.rate_limit import RateLimitMiddleware
from core.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

BOT_COMMANDS = [
    BotCommand(command="start", description="Приветствие и инструкция"),
    BotCommand(command="help", description="Как пользоваться ботом"),
    BotCommand(command="check", description="Проверить текст на AI-генерацию"),
    BotCommand(command="status", description="Сколько проверок осталось сегодня"),
    BotCommand(command="about", description="О боте и точности моделей"),
]


async def on_startup(bot: Bot) -> None:
    """Register bot commands and log startup."""
    await bot.set_my_commands(BOT_COMMANDS)
    me = await bot.get_me()
    logger.info("Bot @%s started in polling mode", me.username)


async def main() -> None:
    bot = Bot(
        token=settings.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher()

    # Middlewares
    dp.message.middleware(RateLimitMiddleware())

    # Routers
    dp.include_router(media.router)
    dp.include_router(text_check.router)

    # Startup hook
    dp.startup.register(on_startup)

    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
