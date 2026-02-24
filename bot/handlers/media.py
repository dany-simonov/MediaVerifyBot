"""Handlers for photo / video / audio / voice / document messages."""

import logging
from io import BytesIO

import httpx
from aiogram import Bot, F, Router
from aiogram.enums import ChatAction
from aiogram.types import Message

from api.schemas import AnalysisResult
from bot.utils.formatters import format_result
from core.config import settings

router = Router()
logger = logging.getLogger(__name__)

MAX_FILE_SIZE_GENERAL = 20 * 1024 * 1024  # 20 MB
MAX_FILE_SIZE_VIDEO = 50 * 1024 * 1024    # 50 MB

RATE_LIMIT_MSG = (
    "⛔ Вы исчерпали дневной лимит бесплатных проверок (3/день).\n\n"
    "Лимит обновится завтра в 00:00 МСК.\n\n"
    "💎 Premium-доступ: 100 проверок/месяц — 199₽\n"
    "Написать: @your_support_username"
)


async def _download_file(bot: Bot, file_id: str) -> bytes:
    """Download file from Telegram by file_id and return raw bytes (aiogram 3 API)."""
    tg_file = await bot.get_file(file_id)
    buf: BytesIO = await bot.download(tg_file)
    return buf.read()


async def _send_to_api(
    bot: Bot,
    message: Message,
    file_id: str,
    content_type: str,
    filename: str,
    max_size: int = MAX_FILE_SIZE_GENERAL,
) -> None:
    """Download file from Telegram and forward to /analyze API."""
    await bot.send_chat_action(chat_id=message.chat.id, action=ChatAction.TYPING)

    try:
        file_bytes = await _download_file(bot, file_id)
    except Exception as exc:
        logger.exception("Failed to download file: %s", exc)
        await message.reply("❌ Не удалось скачать файл. Попробуйте ещё раз.")
        return

    if len(file_bytes) > max_size:
        await message.reply(
            f"⚠️ Файл слишком большой ({len(file_bytes) // (1024*1024)} МБ). "
            f"Максимум — {max_size // (1024*1024)} МБ."
        )
        return

    progress_msg = await message.reply("🔍 Анализирую файл...")

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                f"{settings.api_base_url}/analyze",
                headers={"x-api-secret": settings.api_secret_key},
                data={
                    "user_id": str(message.from_user.id),
                    "username": message.from_user.username or "",
                    "first_name": message.from_user.first_name or "",
                },
                files={
                    "file": (filename or "file", file_bytes, content_type or "application/octet-stream"),
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
            error_detail = response.json().get("detail", "Неподдерживаемый формат файла")
            await progress_msg.edit_text(f"⚠️ {error_detail}")
            return

        if response.status_code == 503:
            await progress_msg.edit_text("❌ Внешние сервисы временно недоступны. Попробуйте позже.")
            return

        if response.status_code != 200:
            await progress_msg.edit_text("❌ Ошибка сервера. Попробуйте позже.")
            return

        result = AnalysisResult(**response.json())
        await progress_msg.edit_text(format_result(result))

    except httpx.TimeoutException:
        await progress_msg.edit_text("⏱ Превышено время ожидания. Попробуйте ещё раз или отправьте файл поменьше.")
    except Exception as exc:
        logger.exception("Error forwarding to API: %s", exc)
        await progress_msg.edit_text("❌ Произошла ошибка при обработке. Попробуйте позже.")


@router.message(F.photo)
async def handle_photo(message: Message, bot: Bot) -> None:
    photo = message.photo[-1]  # highest resolution
    await _send_to_api(bot, message, photo.file_id, content_type="image/jpeg", filename="photo.jpg")


@router.message(F.video)
async def handle_video(message: Message, bot: Bot) -> None:
    video = message.video
    await _send_to_api(
        bot, message, video.file_id,
        content_type=video.mime_type or "video/mp4",
        filename=video.file_name or "video.mp4",
        max_size=MAX_FILE_SIZE_VIDEO,
    )


@router.message(F.voice)
async def handle_voice(message: Message, bot: Bot) -> None:
    await _send_to_api(
        bot, message, message.voice.file_id,
        content_type="audio/ogg",
        filename="voice.ogg",
    )


@router.message(F.audio)
async def handle_audio(message: Message, bot: Bot) -> None:
    audio = message.audio
    await _send_to_api(
        bot, message, audio.file_id,
        content_type=audio.mime_type or "audio/mpeg",
        filename=audio.file_name or "audio.mp3",
    )


@router.message(F.document)
async def handle_document(message: Message, bot: Bot) -> None:
    doc = message.document
    mime = doc.mime_type or ""
    fname = doc.file_name or ""

    if mime.startswith("image/"):
        ct = mime
    elif mime.startswith("audio/"):
        ct = mime
    elif mime.startswith("video/"):
        ct = mime
        await _send_to_api(bot, message, doc.file_id, content_type=ct, filename=fname, max_size=MAX_FILE_SIZE_VIDEO)
        return
    else:
        await message.reply("⚠️ Неподдерживаемый тип файла. Отправьте фото, аудио, видео или текст (/check).")
        return

    await _send_to_api(bot, message, doc.file_id, content_type=ct, filename=fname)
