"""Format analysis results for Telegram messages."""

from api.schemas import AnalysisResult

VERDICT_EMOJI = {
    "REAL": "✅",
    "FAKE": "�",
    "UNCERTAIN": "⚠️",
}

VERDICT_TEXT = {
    "REAL": "Подлинное",
    "FAKE": "Сгенерировано ИИ",
    "UNCERTAIN": "Не определено",
}

MODEL_ACCURACY = {
    "sightengine": "94.4%",
    "hf_image": "94.4%",
    "resemble": "99.5%",
    "hf_audio": "99.5%",
    "sightengine_video_pipeline": "81%",
    "sapling": "98%",
}


def format_result(result: AnalysisResult) -> str:
    """Format AnalysisResult into a user-friendly HTML message for Telegram."""
    emoji = VERDICT_EMOJI.get(result.verdict.value, "❓")
    verdict_text = VERDICT_TEXT.get(result.verdict.value, "Неизвестно")
    confidence_pct = round(result.confidence * 100)
    model_name = result.model_used.value
    accuracy = MODEL_ACCURACY.get(model_name, "81-99%")

    return (
        f"{emoji} <b>{verdict_text}</b>\n\n"
        f"Уверенность: <b>{confidence_pct}%</b>\n"
        f"Модель: {model_name}\n"
        f"Время: {result.processing_ms} мс\n\n"
        f"{result.explanation}\n\n"
        f"<i>Точность модели {accuracy}. Результат носит рекомендательный характер.</i>"
    )
