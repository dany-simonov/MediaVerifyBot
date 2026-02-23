"""Format analysis results for Telegram messages."""

from api.schemas import AnalysisResult

VERDICT_EMOJI = {
    "REAL": "✅",
    "FAKE": "🚨",
    "UNCERTAIN": "⚠️",
}

VERDICT_TEXT = {
    "REAL": "Подлинное",
    "FAKE": "Подозрительно — возможен дипфейк",
    "UNCERTAIN": "Неопределённо",
}


def format_result(result: AnalysisResult) -> str:
    """Format AnalysisResult into a user-friendly HTML message for Telegram."""
    emoji = VERDICT_EMOJI.get(result.verdict.value, "❓")
    verdict_text = VERDICT_TEXT.get(result.verdict.value, "Неизвестно")
    confidence_pct = round(result.confidence * 100)

    return (
        f"{emoji} <b>{verdict_text}</b>\n\n"
        f"📊 Уверенность: <b>{confidence_pct}%</b>\n"
        f"🤖 Модель: {result.model_used.value}\n"
        f"⏱ Время анализа: {result.processing_ms} мс\n\n"
        f"💬 {result.explanation}\n\n"
        f"<i>ℹ️ Точность от 81% до 99.5% — финальное решение за вами</i>"
    )
