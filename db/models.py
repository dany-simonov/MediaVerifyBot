"""SQLAlchemy ORM models — users, checks, rate_limits."""

import uuid
from datetime import datetime, date

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    Float,
    Integer,
    String,
    Text,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, comment="Telegram user_id")
    username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    first_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    daily_checks_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    daily_checks_reset: Mapped[datetime | None] = mapped_column(
        default=None, nullable=True, comment="Timestamp of last counter reset"
    )
    total_checks: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(default=func.now(), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(), server_default=func.now(), onupdate=func.now()
    )

    checks: Mapped[list["Check"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    rate_limit_entries: Mapped[list["RateLimit"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username}>"


class Check(Base):
    __tablename__ = "checks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid()
    )
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    media_type: Mapped[str] = mapped_column(String(20), nullable=False, comment="image | audio | video | text")
    verdict: Mapped[str] = mapped_column(String(20), nullable=False, comment="REAL | FAKE | UNCERTAIN")
    confidence: Mapped[float] = mapped_column(Float, nullable=False, comment="0.0 – 1.0")
    model_used: Mapped[str] = mapped_column(String(50), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False, default="")
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    processing_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="Processing time in ms")
    created_at: Mapped[datetime] = mapped_column(default=func.now(), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="checks")

    def __repr__(self) -> str:
        return f"<Check id={self.id} verdict={self.verdict}>"


class RateLimit(Base):
    __tablename__ = "rate_limits"

    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), primary_key=True)
    date: Mapped[date] = mapped_column(Date, primary_key=True)
    count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")

    user: Mapped["User"] = relationship(back_populates="rate_limit_entries")

    def __repr__(self) -> str:
        return f"<RateLimit user_id={self.user_id} date={self.date} count={self.count}>"
