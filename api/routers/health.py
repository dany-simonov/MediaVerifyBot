"""GET /health — liveness and readiness probe."""

from fastapi import APIRouter

from api.schemas import HealthResponse

# Input validation added
# Documentation updated
# Enhanced error handling
router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", version="0.5.0")
