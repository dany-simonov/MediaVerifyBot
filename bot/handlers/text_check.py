"""Handler for text AI-generation check via /check command."""

import logging

import httpx
from aiogram import Bot, F, Router
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

    if len(text) < 50:
        await message.reply(
            "Текст слишком короткий. Минимум 50 символов для анализа.",
            parse_mode="HTML",
        )
        return

    await _check_text(message, bot, text)


@router.message(F.text & ~F.text.startswith("/"))
async def handle_text_message(message: Message, bot: Bot) -> None:
    """Автоматическая проверка всех текстовых сообщений."""
    text = (message.text or "").strip()
    
    # Если текст короткий, просто сообщаем об этом
    if len(text) < 50:
        await message.reply(
            f"Текст слишком короткий. Минимум 50 символов для анализа.\n"
            f"Сейчас: {len(text)} симв.",
            parse_mode="HTML",
        )
        return
    
    await _check_text(message, bot, text)


async def _check_text(message: Message, bot: Bot, text: str) -> None:
    """Common text checking logic."""
    await bot.send_chat_action(chat_id=message.chat.id, action=ChatAction.TYPING)
    progress_msg = await message.reply("Анализирую текст...")

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
                "⛔ Дневной лимит исчерпан (3/день)\n\n"
                "Обновится завтра в 00:00 МСК.\n\n"
                "Premium: 100 проверок в месяц — 199₽"
            )
            return

        if response.status_code == 400:
            error_detail = response.json().get("detail", "Ошибка обработки текста")
            await progress_msg.edit_text(f"{error_detail}")
            return

        if response.status_code != 200:
            await progress_msg.edit_text("Ошибка сервера. Попробуйте позже.")
            return

        result = AnalysisResult(**response.json())
        await progress_msg.edit_text(format_result(result))

    except httpx.TimeoutException:
        await progress_msg.edit_text("Превышено время ожидания. Попробуйте ещё раз.")
    except Exception as exc:
        logger.exception("Error in text check: %s", exc)
        await progress_msg.edit_text("Ошибка при обработке. Попробуйте позже.")


@router.message(Command("start"))
async def handle_start(message: Message) -> None:
    await message.reply(
        "<b>MediaVerify</b> — система верификации медиаконтента.\n\n"
        "Отправь файл для анализа:\n"
        "· Фото — детекция AI-генерации (точность 94.4%)\n"
        "· Аудио / голосовое — синтетическая речь (99.5%)\n"
        "· Видео — покадровый анализ (81%)\n"
        "· Текст — просто напиши (мин. 50 символов)\n\n"
        "Бесплатно: 3 проверки в день",
        parse_mode="HTML",
    )


@router.message(Command("help"))
async def handle_help(message: Message) -> None:
    await message.reply(
        "<b>Как пользоваться MediaVerify:</b>\n\n"
        "Для фото, видео, аудио — просто отправь файл в чат.\n"
        "Для текста — напиши сообщение (минимум 50 символов).\n\n"
        "<b>Поддерживаемые форматы:</b>\n"
        "Фото: JPG, PNG, WEBP\n"
        "Аудио: MP3, OGG, WAV, голосовые сообщения\n"
        "Видео: MP4, MOV, AVI (до 60 сек)\n\n"
        "Результат содержит вердикт, уровень уверенности и объяснение.\n"
        "Точность варьируется от 81% до 99.5% в зависимости от типа файла.",
        parse_mode="HTML",
    )


@router.message(Command("status"))
async def handle_status(message: Message) -> None:
    await message.reply(
        "<b>Ваш статус:</b> Free\n\n"
        f"Лимит: {settings.free_daily_limit} проверок в день\n\n"
        "Лимит обновляется ежедневно в 00:00 МСК.",
        parse_mode="HTML",
    )


@router.message(Command("about"))
async def handle_about(message: Message) -> None:
    await message.reply(
        "<b>MediaVerify</b> использует специализированные модели:\n\n"
        "Фото → Sightengine genai + HuggingFace (fallback)\n"
        "Аудио → Resemble Detect + wav2vec2-xlsr (fallback)\n"
        "Видео → FFmpeg extraction + Sightengine pipeline\n"
        "Текст → Sapling AI Detector\n\n"
        "<b>Точность на тестовых датасетах:</b>\n"
        "· Изображения: 94.4%\n"
        "· Аудио: 99.5%\n"
        "· Видео: 81%\n"
        "· Текст: 98%\n\n"
        "Все файлы обрабатываются в оперативной памяти и не сохраняются.\n\n"
        "<i>v0.1.0 · MediaVerify</i>",
        parse_mode="HTML",
    )
