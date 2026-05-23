from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

_engine = None
_async_session = None


def _get_engine():
    global _engine
    if _engine is None:
        _engine = create_async_engine(settings.database_url, echo=False)
    return _engine


def _get_async_session():
    global _async_session
    if _async_session is None:
        _async_session = async_sessionmaker(
            _get_engine(), class_=AsyncSession, expire_on_commit=False
        )
    return _async_session


async def get_db() -> AsyncSession:
    async with _get_async_session()() as session:
        yield session


class Base(DeclarativeBase):
    pass
