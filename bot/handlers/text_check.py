"""Handler for text AI-generation check via /check command."""

import logging

import httpx
from aiogram import Bot, Router
from aiogram.enums import ChatAction
from aiogram.filters import Command
from aiogram.types import Message

from api.schemas import AnalysisResult
from bot.utils.formatters import format_result
from core.config import settings

router = Router()
logger = logging.getLogger(__name__)


@router.message(Command("check"))
async def handle_text_check(message: Message, bot: Bot) -> None:
    text = (message.text or "").replace("/check", "", 1).strip()
    if not text:
        await message.reply(
            "Использование: /check &lt;текст для проверки&gt;\n\nМинимум 50 символов.",
            parse_mode="HTML",
        )
        return

    await bot.send_chat_action(chat_id=message.chat.id, action=ChatAction.TYPING)
    progress_msg = await message.reply("🔍 Анализирую текст...")

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.api_base_url}/analyze",
                headers={"x-api-secret": settings.api_secret_key},
                data={
                    "user_id": str(message.from_user.id),
                    "username": message.from_user.username or "",
                    "first_name": message.from_user.first_name or "",
                    "text_content": text,
                },
                files={
                    "file": ("text.txt", text.encode("utf-8"), "text/plain"),
                },
            )

        if response.status_code == 429:
            await progress_msg.edit_text(
                "⛔ Вы исчерпали дневной лимит бесплатных проверок (3/день).\n\n"
                "Лимит обновится завтра в 00:00 МСК.\n\n"
                "💎 Premium-доступ: 100 проверок/месяц — 199₽\n"
                "Написать: @your_support_username"
            )
            return

        if response.status_code == 400:
            error_detail = response.json().get("detail", "Ошибка обработки текста")
            await progress_msg.edit_text(f"⚠️ {error_detail}")
            return

        if response.status_code != 200:
            await progress_msg.edit_text("❌ Ошибка сервера. Попробуйте позже.")
            return

        result = AnalysisResult(**response.json())
        await progress_msg.edit_text(format_result(result))

    except httpx.TimeoutException:
        await progress_msg.edit_text("⏱ Превышено время ожидания. Попробуйте ещё раз.")
    except Exception as exc:
        logger.exception("Error in text check: %s", exc)
        await progress_msg.edit_text("❌ Произошла ошибка при обработке. Попробуйте позже.")


@router.message(Command("start"))
async def handle_start(message: Message) -> None:
    await message.reply(
        "👋 Привет! Я <b>MediaVerifyBot</b> — проверяю медиафайлы на подлинность.\n\n"
        "Что умею:\n"
        "🖼 Фото — детекция AI-генерации\n"
        "🎵 Аудио и голосовые — детекция синтетической речи\n"
        "🎬 Видео — покадровый анализ\n"
        "📝 Текст — детекция написан ли ChatGPT/ИИ\n\n"
        "Просто отправь файл или /check &lt;текст&gt;\n\n"
        "Бесплатно: 3 проверки в день",
        parse_mode="HTML",
    )


@router.message(Command("help"))
async def handle_help(message: Message) -> None:
    await message.reply(
        "📖 <b>Как пользоваться:</b>\n\n"
        "1. Отправьте фото, аудио, голосовое или видео — бот проверит подлинность.\n"
        "2. /check &lt;текст&gt; — проверить текст на AI-генерацию (мин. 50 символов).\n"
        "3. /status — узнать количество оставшихся проверок.\n\n"
        "📊 Бот использует несколько моделей для повышения точности.\n"
        "⏱ Среднее время анализа: 5-15 секунд.",
        parse_mode="HTML",
    )


@router.message(Command("status"))
async def handle_status(message: Message) -> None:
    await message.reply(
        "📊 <b>Лимит проверок</b>\n\n"
        f"🆓 Бесплатно: {settings.free_daily_limit} проверок/день\n"
        f"💎 Premium: {settings.premium_monthly_limit} проверок/месяц\n\n"
        "Отправьте файл или /check &lt;текст&gt; для проверки!",
        parse_mode="HTML",
    )


@router.message(Command("about"))
async def handle_about(message: Message) -> None:
    await message.reply(
        "ℹ️ <b>О MediaVerifyBot</b>\n\n"
        "Версия: 0.1.0 (MVP)\n\n"
        "Используемые модели:\n"
        "• SightEngine — детекция AI-генерированных изображений\n"
        "• Resemble Detect — детекция синтетической речи\n"
        "• Sapling AI — детекция AI-сгенерированного текста\n"
        "• HuggingFace — fallback-модели для фото и аудио\n\n"
        "📊 Точность: от 81% до 99.5% в зависимости от типа контента.\n"
        "⚠️ Финальное решение всегда за вами.",
        parse_mode="HTML",
    )
