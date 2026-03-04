"""Handler for /bigcheck — multi-file batch analysis mode in Telegram."""

import asyncio
import logging
from io import BytesIO
from typing import Any

import httpx
from aiogram import Bot, F, Router
from aiogram.enums import ChatAction
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message

from bot.utils.formatters import (
    VERDICT_EMOJI,
    VERDICT_TEXT,
    MODEL_NAMES,
    calculate_authenticity_index,
)
from core.config import settings

# Logging improved
# PEP 8 compliant
router = Router()
logger = logging.getLogger(__name__)

MAX_BIGCHECK_FILES = 10
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


class BigCheckStates(StatesGroup):
    """FSM states for Big Check mode."""
    collecting = State()  # Collecting files from user


def _bigcheck_keyboard(file_count: int) -> InlineKeyboardMarkup:
    """Inline keyboard for Big Check mode."""
    buttons = []
    if file_count > 0:
        buttons.append([
            InlineKeyboardButton(
                text=f"🚀 Запустить анализ ({file_count} файл.)",
                callback_data="bigcheck:analyze",
            ),
        ])
    buttons.append([
        InlineKeyboardButton(
            text="❌ Отмена",
            callback_data="bigcheck:cancel",
        ),
    ])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


@router.message(Command("bigcheck"))
async def handle_bigcheck_start(message: Message, state: FSMContext) -> None:
    """Start Big Check mode — collect files."""
    await state.set_state(BigCheckStates.collecting)
    await state.update_data(files=[], filenames=[], content_types=[], text_content="")

    await message.reply(
        "🔬 <b>Режим Большой Проверки (Big Check)</b>\n\n"
        "Отправляй файлы по одному — фото, аудио, видео.\n"
        "Я соберу их все и проведу кросс-анализ.\n\n"
        "📎 Максимум: 10 файлов, 20 МБ каждый\n"
        "📝 Можешь также отправить текст для проверки\n\n"
        "Когда закончишь — нажми кнопку <b>«Запустить анализ»</b>.\n"
        "Для отмены — /cancel",
        parse_mode="HTML",
        reply_markup=_bigcheck_keyboard(0),
    )


@router.message(Command("cancel"), BigCheckStates.collecting)
async def handle_bigcheck_cancel(message: Message, state: FSMContext) -> None:
    """Cancel Big Check mode."""
    await state.clear()
    await message.reply("❌ Большая проверка отменена.")


@router.callback_query(F.data == "bigcheck:cancel", BigCheckStates.collecting)
async def handle_bigcheck_cancel_btn(callback: CallbackQuery, state: FSMContext) -> None:
    """Cancel Big Check via button."""
    await state.clear()
    await callback.message.edit_text("❌ Большая проверка отменена.")
    await callback.answer()


@router.message(F.photo, BigCheckStates.collecting)
async def handle_bigcheck_photo(message: Message, bot: Bot, state: FSMContext) -> None:
    """Collect photo in Big Check mode."""
    photo = message.photo[-1]
    await _collect_file(message, bot, state, photo.file_id, "image/jpeg", "photo.jpg")


@router.message(F.audio, BigCheckStates.collecting)
async def handle_bigcheck_audio(message: Message, bot: Bot, state: FSMContext) -> None:
    """Collect audio in Big Check mode."""
    audio = message.audio
    await _collect_file(
        message, bot, state, audio.file_id,
        audio.mime_type or "audio/mpeg",
        audio.file_name or "audio.mp3",
    )


@router.message(F.voice, BigCheckStates.collecting)
async def handle_bigcheck_voice(message: Message, bot: Bot, state: FSMContext) -> None:
    """Collect voice in Big Check mode."""
    await _collect_file(
        message, bot, state, message.voice.file_id,
        "audio/ogg", "voice.ogg",
    )


@router.message(F.video, BigCheckStates.collecting)
async def handle_bigcheck_video(message: Message, bot: Bot, state: FSMContext) -> None:
    """Collect video in Big Check mode."""
    video = message.video
    await _collect_file(
        message, bot, state, video.file_id,
        video.mime_type or "video/mp4",
        video.file_name or "video.mp4",
    )


@router.message(F.document, BigCheckStates.collecting)
async def handle_bigcheck_document(message: Message, bot: Bot, state: FSMContext) -> None:
    """Collect document in Big Check mode."""
    doc = message.document
    mime = doc.mime_type or ""
    if not (mime.startswith("image/") or mime.startswith("audio/") or mime.startswith("video/")):
        await message.reply("⚠️ Неподдерживаемый формат. Отправь фото, аудио или видео.")
        return
    await _collect_file(
        message, bot, state, doc.file_id,
        mime, doc.file_name or "file",
    )


@router.message(F.text & ~F.text.startswith("/"), BigCheckStates.collecting)
async def handle_bigcheck_text(message: Message, state: FSMContext) -> None:
    """Collect text in Big Check mode."""
    text = (message.text or "").strip()
    if len(text) < 50:
        await message.reply(
            f"⚠️ Текст слишком короткий ({len(text)} симв.). Минимум 50 символов."
        )
        return

    data = await state.get_data()
    data["text_content"] = text
    await state.update_data(text_content=text)

    file_count = len(data.get("files", []))
    has_text = True
    total = file_count + (1 if has_text else 0)

    await message.reply(
        f"📝 Текст добавлен ({len(text)} симв.)\n"
        f"📊 Всего элементов для анализа: {total}",
        reply_markup=_bigcheck_keyboard(total),
    )


async def _collect_file(
    message: Message,
    bot: Bot,
    state: FSMContext,
    file_id: str,
    content_type: str,
    filename: str,
) -> None:
    """Download and store file bytes in FSM state."""
    data = await state.get_data()
    files: list = data.get("files", [])
    filenames: list = data.get("filenames", [])
    content_types: list = data.get("content_types", [])

    if len(files) >= MAX_BIGCHECK_FILES:
        await message.reply(f"⚠️ Максимум {MAX_BIGCHECK_FILES} файлов. Нажми «Запустить анализ».")
        return

    try:
        tg_file = await bot.get_file(file_id)
        if tg_file.file_size and tg_file.file_size > MAX_FILE_SIZE:
            await message.reply(f"⚠️ Файл слишком большой ({tg_file.file_size // 1024 // 1024} МБ). Макс: 20 МБ.")
            return
        buf: BytesIO = await bot.download(tg_file)
        file_bytes = buf.read()
    except Exception as exc:
        logger.exception("Failed to download file in bigcheck: %s", exc)
        await message.reply("❌ Не удалось скачать файл. Попробуй ещё раз.")
        return

    files.append(file_bytes)
    filenames.append(filename)
    content_types.append(content_type)
    await state.update_data(files=files, filenames=filenames, content_types=content_types)

    has_text = bool(data.get("text_content", "").strip())
    total = len(files) + (1 if has_text else 0)

    media_type_icon = "📷" if content_type.startswith("image") else \
                      "🎵" if content_type.startswith("audio") else \
                      "🎬" if content_type.startswith("video") else "📄"

    await message.reply(
        f"{media_type_icon} <b>{filename}</b> добавлен\n"
        f"📊 Файлов в очереди: {len(files)}/{MAX_BIGCHECK_FILES}"
        + (f" + текст" if has_text else "")
        + "\n\nОтправь ещё файлы или нажми «Запустить анализ».",
        parse_mode="HTML",
        reply_markup=_bigcheck_keyboard(total),
    )


@router.callback_query(F.data == "bigcheck:analyze", BigCheckStates.collecting)
async def handle_bigcheck_analyze(callback: CallbackQuery, bot: Bot, state: FSMContext) -> None:
    """Run Big Check cross-analysis via API."""
    data = await state.get_data()
    files: list = data.get("files", [])
    filenames: list = data.get("filenames", [])
    content_types: list = data.get("content_types", [])
    text_content: str = data.get("text_content", "")

    total = len(files) + (1 if text_content.strip() else 0)
    if total == 0:
        await callback.answer("⚠️ Нет файлов для анализа. Отправь хотя бы один файл.", show_alert=True)
        return

    await callback.answer()
    await state.clear()

    # Progress message
    progress_msg = await callback.message.edit_text(
        "🔬 <b>Большая проверка запущена!</b>\n\n"
        f"📁 Файлов: {len(files)}"
        + (f"\n📝 Текст: {len(text_content)} симв." if text_content.strip() else "")
        + "\n\n⏳ Загрузка файлов...",
        parse_mode="HTML",
    )

    try:
        # Build multipart form data
        multipart_files = []
        for i, file_bytes in enumerate(files):
            fname = filenames[i] if i < len(filenames) else f"file_{i}"
            ct = content_types[i] if i < len(content_types) else "application/octet-stream"
            multipart_files.append(("files", (fname, file_bytes, ct)))

        form_data = {
            "user_id": str(callback.from_user.id),
            "username": callback.from_user.username or "",
            "first_name": callback.from_user.first_name or "",
            "text_content": text_content,
        }

        # Update progress
        try:
            await progress_msg.edit_text(
                "🔬 <b>Большая проверка</b>\n\n"
                "🔍 Анализ медиа моделями ИИ...",
                parse_mode="HTML",
            )
        except Exception:
            pass

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{settings.api_base_url}/bigcheck",
                headers={"x-api-secret": settings.api_secret_key},
                data=form_data,
                files=multipart_files,
            )

        if response.status_code == 429:
            await progress_msg.edit_text(
                "⛔ Дневной лимит исчерпан (3/день)\n\n"
                "Обновится завтра в 00:00 МСК.\n"
                "Premium: 100 проверок в месяц — 199₽"
            )
            return

        if response.status_code == 400:
            detail = response.json().get("detail", "Ошибка валидации")
            await progress_msg.edit_text(f"❌ {detail}")
            return

        if response.status_code != 200:
            await progress_msg.edit_text("❌ Ошибка сервера. Попробуйте позже.")
            return

        # Update progress
        try:
            await progress_msg.edit_text(
                "🔬 <b>Большая проверка</b>\n\n"
                "📊 Формирование кросс-анализа...",
                parse_mode="HTML",
            )
        except Exception:
            pass

        await asyncio.sleep(0.5)

        result = response.json()
        formatted = _format_bigcheck_result(result)

        # Share keyboard
        overall_verdict = result.get("overall_verdict", "UNCERTAIN")
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📤 Поделиться",
                    switch_inline_query=f"Big Check: {overall_verdict}",
                ),
                InlineKeyboardButton(
                    text="🔄 Новая проверка",
                    callback_data="bigcheck:new",
                ),
            ],
        ])

        await progress_msg.edit_text(formatted, parse_mode="HTML", reply_markup=keyboard)

    except httpx.TimeoutException:
        await progress_msg.edit_text("⏱️ Превышено время ожидания. Попробуйте файлы поменьше.")
    except Exception as exc:
        logger.exception("BigCheck error: %s", exc)
        await progress_msg.edit_text("❌ Ошибка при обработке. Попробуйте позже.")


@router.callback_query(F.data == "bigcheck:new")
async def handle_bigcheck_new(callback: CallbackQuery, state: FSMContext) -> None:
    """Start a new Big Check session."""
    await callback.answer()
    await state.set_state(BigCheckStates.collecting)
    await state.update_data(files=[], filenames=[], content_types=[], text_content="")

    await callback.message.reply(
        "🔬 <b>Новая Большая Проверка</b>\n\n"
        "Отправляй файлы — я соберу их и проведу кросс-анализ.\n"
        "📎 Максимум: 10 файлов, 20 МБ каждый\n\n"
        "Когда закончишь — нажми <b>«Запустить анализ»</b>.",
        parse_mode="HTML",
        reply_markup=_bigcheck_keyboard(0),
    )


def _format_bigcheck_result(result: dict) -> str:
    """Format Big Check API response into a Telegram message."""
    overall_verdict = result.get("overall_verdict", "UNCERTAIN")
    authenticity_index = result.get("authenticity_index", 50)
    summary = result.get("summary", "")
    total_ms = result.get("total_processing_ms", 0)
    file_results = result.get("results", [])

    emoji = VERDICT_EMOJI.get(overall_verdict, "❓")
    verdict_text = VERDICT_TEXT.get(overall_verdict, "Неизвестно")

    # Authenticity bar
    bar_filled = authenticity_index // 10
    bar_empty = 10 - bar_filled
    if overall_verdict == "REAL":
        bar = "🟩" * bar_filled + "⬜" * bar_empty
    elif overall_verdict == "FAKE":
        bar = "🟥" * bar_filled + "⬜" * bar_empty
    else:
        bar = "🟨" * bar_filled + "⬜" * bar_empty

    text = (
        f"🔬 <b>БОЛЬШАЯ ПРОВЕРКА — РЕЗУЛЬТАТ</b>\n"
        f"{'━' * 28}\n\n"
        f"{emoji} <b>{verdict_text}</b>\n\n"
        f"Индекс подлинности: <b>{authenticity_index}%</b>\n"
        f"{bar}\n\n"
        f"<i>{summary}</i>\n\n"
    )

    # Individual file results
    if file_results:
        text += "<b>Детали по файлам:</b>\n"
        for i, fr in enumerate(file_results, 1):
            media_type = fr.get("media_type", "unknown")
            icon = {"image": "📷", "audio": "🎵", "video": "🎬", "text": "📝"}.get(media_type, "📄")
            fname = fr.get("filename", "файл")
            v = fr.get("verdict", "UNCERTAIN")
            v_emoji = VERDICT_EMOJI.get(v, "❓")
            v_text = "Подлинное" if v == "REAL" else "Сгенерировано" if v == "FAKE" else "Неопред."
            conf = fr.get("confidence", 0)
            ai = calculate_authenticity_index(v, conf)
            model = MODEL_NAMES.get(fr.get("model_used", ""), fr.get("model_used", ""))
            ms = fr.get("processing_ms", 0)

            text += (
                f"\n{i}. {icon} <b>{fname}</b>\n"
                f"   {v_emoji} {v_text} · {ai}%\n"
                f"   Модель: {model} · {ms}мс\n"
            )

    if total_ms:
        text += f"\n⏱ Общее время: {total_ms / 1000:.1f} сек"

    text += (
        "\n\n<i>ℹ️ Точность от 81% до 99.5% — финальное решение за вами.</i>"
    )

    return text
