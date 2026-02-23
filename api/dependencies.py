"""DI dependencies: DB session, settings."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from db.engine import async_session_factory


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
