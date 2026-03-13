"""Appwrite Function entrypoint for media/text analysis.

This file is used by Appwrite Functions with entrypoint `src/main.py`.
It supports two payload shapes from frontend:
- {"text": "...", "mediaType": "text", ...}
- {"fileId": "...", "mediaType": "image|audio|video", ...}
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import time
import threading
from pathlib import Path
from typing import Any

import httpx

# Ensure project root imports work when entrypoint is src/main.py
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.enums import MediaType  # noqa: E402
from router.media_router import MediaRouter  # noqa: E402


def _extract_payload(req: Any) -> dict[str, Any]:
    """Extract request payload from Appwrite context.req in a robust way."""
    for attr in ("body_json", "bodyJson", "json"):
        value = getattr(req, attr, None)
        if value:
            if callable(value):
                value = value()
            if isinstance(value, dict):
                return value

    raw = getattr(req, "body", None)
    if callable(raw):
        raw = raw()

    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8", errors="replace")

    if isinstance(raw, str) and raw.strip():
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            return {"text": raw}

    return {}


def _response_json(context: Any, payload: dict[str, Any], status: int = 200):
    """Return JSON response compatible with Appwrite runtime variants."""
    try:
        return context.res.json(payload, status)
    except TypeError:
        try:
            return context.res.json(payload)
        except Exception:
            return payload


def _detect_media_type_from_payload(payload: dict[str, Any]) -> MediaType:
    raw = str(payload.get("mediaType") or "").strip().lower()
    mapping = {
        "image": MediaType.IMAGE,
        "audio": MediaType.AUDIO,
        "video": MediaType.VIDEO,
        "text": MediaType.TEXT,
    }
    return mapping.get(raw, MediaType.TEXT)


async def _download_file_bytes(file_id: str, bucket_id: str) -> bytes:
    endpoint = os.getenv("APPWRITE_FUNCTION_API_ENDPOINT", "").rstrip("/")
    project_id = os.getenv("APPWRITE_FUNCTION_PROJECT_ID", "")
    api_key = os.getenv("APPWRITE_FUNCTION_API_KEY", "")

    if not endpoint or not project_id or not api_key:
        raise RuntimeError("Missing APPWRITE_FUNCTION_API_ENDPOINT/PROJECT_ID/API_KEY")

    url = f"{endpoint}/storage/buckets/{bucket_id}/files/{file_id}/download"
    headers = {
        "X-Appwrite-Project": project_id,
        "X-Appwrite-Key": api_key,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(url, headers=headers)
        if response.status_code >= 400:
            raise RuntimeError(
                f"Storage download failed ({response.status_code}) for bucket={bucket_id}, fileId={file_id}"
            )
        return response.content


async def _analyze(payload: dict[str, Any]) -> dict[str, Any]:
    router = MediaRouter()
    started = time.perf_counter()

    text = str(payload.get("text") or "").strip()
    media_type = _detect_media_type_from_payload(payload)

    if text:
        result = await router.route(MediaType.TEXT, b"", text)
    else:
        file_id = str(payload.get("fileId") or "").strip()
        if not file_id:
            raise ValueError("fileId is required when text is empty")

        bucket_id = (
            os.getenv("VITE_APPWRITE_UPLOADS_BUCKET_ID")
            or os.getenv("UPLOADS_BUCKET_ID")
            or "69af36f900139c5afe5b"
        )
        file_bytes = await _download_file_bytes(file_id, bucket_id)

        # If mediaType was not explicitly provided, router will infer as much as possible.
        if media_type == MediaType.TEXT:
            media_type = router.detect_type(None, "uploaded.bin", "")

        result = await router.route(media_type, file_bytes, "")

    processing_ms = int((time.perf_counter() - started) * 1000)
    body = result.model_dump()
    body["processing_ms"] = processing_ms
    return body


def _run_coro_sync(coro: Any) -> Any:
    """Run coroutine from sync code even when an event loop is already running."""
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)

    result_holder: dict[str, Any] = {}
    error_holder: dict[str, BaseException] = {}

    def _runner() -> None:
        try:
            result_holder["result"] = asyncio.run(coro)
        except BaseException as exc:  # pragma: no cover
            error_holder["error"] = exc

    thread = threading.Thread(target=_runner, daemon=True)
    thread.start()
    thread.join()

    if "error" in error_holder:
        raise error_holder["error"]
    return result_holder.get("result")


def main(context: Any):
    """Appwrite function handler."""
    try:
        payload = _extract_payload(context.req)
        result = _run_coro_sync(_analyze(payload))
        return _response_json(context, result, 200)
    except Exception as exc:
        return _response_json(context, {"detail": str(exc)}, 400)
