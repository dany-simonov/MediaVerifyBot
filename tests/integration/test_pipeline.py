"""Integration tests — require real API keys and network access.

Run with: pytest tests/integration/ -m integration
"""

import pytest

from core.enums import ModelUsed, Verdict


@pytest.mark.integration
@pytest.mark.asyncio
async def test_real_image_sightengine():
    """Test SightEngine with a real image (requires media_samples/)."""
    try:
        with open("media_samples/real/photo1.jpg", "rb") as f:
            data = f.read()
    except FileNotFoundError:
        pytest.skip("Test file media_samples/real/photo1.jpg not found")

    from adapters.sightengine import SightengineAdapter
    result = await SightengineAdapter().analyze(data)
    assert result.verdict in [Verdict.REAL, Verdict.UNCERTAIN]
    assert 0 <= result.confidence <= 1


@pytest.mark.integration
@pytest.mark.asyncio
async def test_fake_image_sightengine():
    """Test SightEngine with an AI-generated image."""
    try:
        with open("media_samples/fake/ai_generated1.jpg", "rb") as f:
            data = f.read()
    except FileNotFoundError:
        pytest.skip("Test file media_samples/fake/ai_generated1.jpg not found")

    from adapters.sightengine import SightengineAdapter
    result = await SightengineAdapter().analyze(data)
    assert result.confidence >= 0
    assert result.model_used == ModelUsed.SIGHTENGINE
