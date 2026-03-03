"""Auth router — registration, login (JWT), Telegram webhook auth."""

import hashlib
import hmac
import logging
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_db_session
from core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Pydantic schemas ──────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str  # min 6 chars enforced on frontend


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str


class TelegramAuthData(BaseModel):
    id: int
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    photo_url: str | None = None
    auth_date: int
    hash: str


# ── Password hashing (bcrypt via hashlib fallback) ────────────

def _hash_password(password: str) -> str:
    """Hash password with SHA-256 + salt. For production, use passlib[bcrypt]."""
    import secrets

    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${hashed}"


def _verify_password(password: str, stored: str) -> bool:
    """Verify password against stored salt$hash."""
    if "$" not in stored:
        return False
    salt, hashed = stored.split("$", 1)
    check = hashlib.sha256((salt + password).encode()).hexdigest()
    return hmac.compare_digest(check, hashed)


# ── JWT helpers ───────────────────────────────────────────────

JWT_SECRET = settings.api_secret_key
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 72


def _create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ── Inline WebUser model (avoids circular import at module level) ─

_WebUser = None


def _get_web_user_model():
    global _WebUser
    if _WebUser is None:
        from db.models import WebUser

        _WebUser = WebUser
    return _WebUser


# ── Endpoints ─────────────────────────────────────────────────


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, session: AsyncSession = Depends(get_db_session)):
    """Register a new web user with email + password."""
    WebUser = _get_web_user_model()

    # Check duplicate
    result = await session.execute(select(WebUser).where(WebUser.email == body.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user = WebUser(
        email=body.email,
        password_hash=_hash_password(body.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    token = _create_token({"sub": str(user.id), "email": user.email})
    return TokenResponse(access_token=token, email=user.email)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, session: AsyncSession = Depends(get_db_session)):
    """Login with email + password, returns JWT."""
    WebUser = _get_web_user_model()

    result = await session.execute(select(WebUser).where(WebUser.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not _verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = _create_token({"sub": str(user.id), "email": user.email})
    return TokenResponse(access_token=token, email=user.email)


@router.post("/telegram", response_model=TokenResponse)
async def telegram_auth(body: TelegramAuthData, session: AsyncSession = Depends(get_db_session)):
    """Verify Telegram Login Widget data and issue JWT."""
    # Verify hash
    bot_token = settings.bot_token
    secret_key = hashlib.sha256(bot_token.encode()).digest()

    check_data = "\n".join(
        f"{k}={v}"
        for k, v in sorted(body.model_dump(exclude={"hash"}).items())
        if v is not None
    )
    computed_hash = hmac.new(secret_key, check_data.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, body.hash):
        raise HTTPException(status_code=401, detail="Invalid Telegram auth data")

    # Check auth_date is recent (within 1 day)
    if abs(datetime.now(timezone.utc).timestamp() - body.auth_date) > 86400:
        raise HTTPException(status_code=401, detail="Auth data expired")

    WebUser = _get_web_user_model()

    # Find or create user by telegram_id
    result = await session.execute(select(WebUser).where(WebUser.telegram_id == body.id))
    user = result.scalar_one_or_none()

    if not user:
        user = WebUser(
            telegram_id=body.id,
            email=f"tg_{body.id}@istochnik.local",
            password_hash="",  # No password for TG users
            first_name=body.first_name,
            username=body.username,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    token = _create_token({"sub": str(user.id), "email": user.email, "tg_id": body.id})
    return TokenResponse(access_token=token, email=user.email)


@router.get("/me")
async def get_me(token: str):
    """Decode JWT and return user info."""
    payload = _decode_token(token)
    return {"id": payload.get("sub"), "email": payload.get("email")}
