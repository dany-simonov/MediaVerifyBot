"""Unit tests for adapters — mock httpx, no real API calls."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from core.enums import Verdict, ModelUsed


@pytest.mark.asyncio
async def test_sightengine_fake_verdict():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"status": "success", "type": {"ai_generated": 0.95}}

    with patch("httpx.AsyncClient.post", return_value=mock_response):
        from adapters.sightengine import SightengineAdapter
        adapter = SightengineAdapter()
        result = await adapter.analyze(b"fake_image_bytes")
        assert result.verdict == Verdict.FAKE
        assert result.confidence >= 0.75


@pytest.mark.asyncio
async def test_sightengine_real_verdict():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"status": "success", "type": {"ai_generated": 0.10}}

    with patch("httpx.AsyncClient.post", return_value=mock_response):
        from adapters.sightengine import SightengineAdapter
        adapter = SightengineAdapter()
        result = await adapter.analyze(b"real_image_bytes")
        assert result.verdict == Verdict.REAL


@pytest.mark.asyncio
async def test_sightengine_timeout_returns_uncertain():
    import httpx
    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("timeout")):
        from adapters.sightengine import SightengineAdapter
        adapter = SightengineAdapter()
        result = await adapter.analyze(b"some_bytes")
        assert result.verdict == Verdict.UNCERTAIN
