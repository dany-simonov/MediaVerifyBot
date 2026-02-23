"""Unit tests for result formatters."""

from api.schemas import AnalysisResult
from bot.utils.formatters import format_result
from core.enums import MediaType, ModelUsed, Verdict


def test_format_fake_result():
    result = AnalysisResult(
        verdict=Verdict.FAKE,
        confidence=0.95,
        model_used=ModelUsed.SIGHTENGINE,
        explanation="Sightengine: вероятность ИИ-генерации 95%",
        media_type=MediaType.IMAGE,
        processing_ms=1200,
    )
    text = format_result(result)
    assert "🚨" in text
    assert "95%" in text
    assert "sightengine" in text


def test_format_real_result():
    result = AnalysisResult(
        verdict=Verdict.REAL,
        confidence=0.12,
        model_used=ModelUsed.SIGHTENGINE,
        explanation="Sightengine: вероятность ИИ-генерации 12%",
        media_type=MediaType.IMAGE,
        processing_ms=800,
    )
    text = format_result(result)
    assert "✅" in text
    assert "Подлинное" in text


def test_format_uncertain_result():
    result = AnalysisResult(
        verdict=Verdict.UNCERTAIN,
        confidence=0.5,
        model_used=ModelUsed.FALLBACK_UNCERTAIN,
        explanation="Недостаточно данных",
        media_type=MediaType.AUDIO,
        processing_ms=500,
    )
    text = format_result(result)
    assert "⚠️" in text
    assert "Неопределённо" in text
