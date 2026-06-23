from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer, Text, select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from .database import Base


class WorldFlag(Base):
    __tablename__ = "world_flags"
    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class TownEvent(Base):
    __tablename__ = "town_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    event_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)


async def set_flag(db: AsyncSession, key: str, value: str) -> None:
    existing = await db.get(WorldFlag, key)
    if existing:
        existing.value = value
        existing.updated_at = datetime.now(timezone.utc)
    else:
        db.add(WorldFlag(key=key, value=value))
    await db.commit()


async def get_flag(db: AsyncSession, key: str) -> str | None:
    obj = await db.get(WorldFlag, key)
    return obj.value if obj else None


async def get_all_flags(db: AsyncSession) -> dict[str, str]:
    result = await db.execute(select(WorldFlag))
    return {row.key: row.value for row in result.scalars().all()}


async def add_event(db: AsyncSession, text: str, expires_at: datetime | None = None) -> None:
    db.add(TownEvent(event_text=text, expires_at=expires_at))
    await db.commit()


async def get_recent_events(db: AsyncSession, limit: int = 8) -> list[str]:
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(TownEvent)
        .where((TownEvent.expires_at == None) | (TownEvent.expires_at > now))  # noqa: E711
        .order_by(TownEvent.created_at.desc())
        .limit(limit)
    )
    events = result.scalars().all()
    return [e.event_text for e in reversed(events)]
