"""GET /health — liveness and readiness probe."""

import logging

from fastapi import APIRouter
from sqlalchemy import text

from api.schemas import HealthResponse
from db.engine import async_session_factory

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    db_status = "ok"
    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
    except Exception as exc:
        logger.error("Health check DB failure: %s", exc)
        db_status = "unavailable"

    return HealthResponse(status="ok", version="0.1.0", db=db_status)
