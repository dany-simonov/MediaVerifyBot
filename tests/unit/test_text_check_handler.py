from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from bot.handlers import text_check


def _build_message(text: str) -> AsyncMock:
    message = AsyncMock()
    message.text = text
    message.reply = AsyncMock()
    message.chat = SimpleNamespace(id=1)
    return message


@pytest.mark.asyncio
async def test_handle_text_message_returns_last_commit_summary() -> None:
    message = _build_message("что было сделано в последнем комите")
    bot = AsyncMock()
    completed = SimpleNamespace(stdout="abc1234\nInitial plan\n file.py | 2 ++")

    with patch("bot.handlers.text_check.subprocess.run", return_value=completed) as run_mock:
        await text_check.handle_text_message(message, bot)

    run_mock.assert_called_once()
    message.reply.assert_called_once()
    assert "Что было сделано в последнем комите:" in message.reply.call_args.args[0]


@pytest.mark.asyncio
async def test_handle_text_message_last_commit_error() -> None:
    message = _build_message("что было сделано в последнем комите")
    bot = AsyncMock()

    with patch(
        "bot.handlers.text_check.subprocess.run",
        side_effect=text_check.subprocess.SubprocessError,
    ):
        await text_check.handle_text_message(message, bot)

    message.reply.assert_called_once_with("Не удалось получить информацию о последнем коммите.")
