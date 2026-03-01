"""Inline keyboards for sharing and interacting with results."""

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup


def share_result_keyboard(verdict: str, check_id: str = "") -> InlineKeyboardMarkup:
    """Inline keyboard with share and copy buttons for the analysis result."""
    buttons = [
        [
            InlineKeyboardButton(
                text="📤 Поделиться",
                switch_inline_query=f"Результат проверки: {verdict}",
            ),
            InlineKeyboardButton(
                text="📋 Скопировать",
                callback_data=f"copy:{check_id}" if check_id else "copy:result",
            ),
        ],
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def webapp_keyboard(url: str) -> InlineKeyboardMarkup:
    """Inline keyboard with a web app button."""
    from aiogram.types import WebAppInfo

    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📊 Открыть дашборд",
                    web_app=WebAppInfo(url=url),
                )
            ]
        ]
    )
