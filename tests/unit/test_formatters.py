"""Unit tests for result formatters."""

import pytest

from api.schemas import AnalysisResult
from bot.utils.formatters import format_result
from core.enums import MediaType, ModelUsed, Verdict


def _make_result(
    verdict: Verdict = Verdict.FAKE,
    confidence: float = 0.95,
    model_used: ModelUsed = ModelUsed.SIGHTENGINE,
    explanation: str = "Test explanation",
    media_type: MediaType = MediaType.IMAGE,
    processing_ms: int = 1000,
) -> AnalysisResult:
    return AnalysisResult(
        verdict=verdict,
        confidence=confidence,
        model_used=model_used,
        explanation=explanation,
        media_type=media_type,
        processing_ms=processing_ms,
    )


class TestFormatResult:
    def test_fake_result_has_alarm_emoji(self):
        text = format_result(_make_result(verdict=Verdict.FAKE, confidence=0.95))
        assert "🚨" in text

    def test_fake_result_shows_confidence_percent(self):
        text = format_result(_make_result(verdict=Verdict.FAKE, confidence=0.95))
        assert "95%" in text

    def test_fake_result_shows_model_name(self):
        text = format_result(_make_result(verdict=Verdict.FAKE, model_used=ModelUsed.SIGHTENGINE))
        assert "sightengine" in text

    def test_real_result_has_check_emoji(self):
        text = format_result(_make_result(verdict=Verdict.REAL, confidence=0.12))
        assert "✅" in text

    def test_real_result_says_authentic(self):
        text = format_result(_make_result(verdict=Verdict.REAL))
        assert "Подлинное" in text

    def test_uncertain_result_has_warning_emoji(self):
        text = format_result(_make_result(verdict=Verdict.UNCERTAIN, confidence=0.5))
        assert "⚠️" in text

    def test_uncertain_result_says_undefined(self):
        text = format_result(_make_result(verdict=Verdict.UNCERTAIN))
        assert "Неопределённо" in text

    def test_explanation_is_present(self):
        text = format_result(_make_result(explanation="Custom test explanation"))
        assert "Custom test explanation" in text

    def test_processing_ms_is_present(self):
        text = format_result(_make_result(processing_ms=1234))
        assert "1234" in text

    def test_confidence_rounded_correctly(self):
        """Confidence 0.1234 should be shown as 12%, not 12.34%."""
        text = format_result(_make_result(verdict=Verdict.REAL, confidence=0.1234))
        assert "12%" in text

    def test_output_contains_html_bold_tags(self):
        """format_result uses HTML markup for Telegram."""
        text = format_result(_make_result(verdict=Verdict.FAKE))
        assert "<b>" in text
        assert "</b>" in text

    def test_sapling_model_name_in_output(self):
        text = format_result(_make_result(model_used=ModelUsed.SAPLING, media_type=MediaType.TEXT))
        assert "sapling" in text

    def test_resemble_model_name_in_output(self):
        text = format_result(_make_result(model_used=ModelUsed.RESEMBLE, media_type=MediaType.AUDIO))
        assert "resemble" in text

    def test_returns_non_empty_string(self):
        result = _make_result()
        assert isinstance(format_result(result), str)
        assert len(format_result(result)) > 0

    @pytest.mark.parametrize("verdict,expected_emoji", [
        (Verdict.REAL, "✅"),
        (Verdict.FAKE, "🚨"),
        (Verdict.UNCERTAIN, "⚠️"),
    ])
    def test_all_verdicts_have_correct_emoji(self, verdict: Verdict, expected_emoji: str):
        text = format_result(_make_result(verdict=verdict))
        assert expected_emoji in text
