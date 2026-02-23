"""Inline keyboards for sharing results."""

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup


def share_result_keyboard(verdict: str) -> InlineKeyboardMarkup:
    """Inline keyboard with a share button for the analysis result."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📤 Поделиться результатом",
                    switch_inline_query=f"Результат проверки: {verdict}",
                )
            ]
        ]
    )
