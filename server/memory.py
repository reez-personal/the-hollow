from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, select
from sqlalchemy.ext.asyncio import AsyncSession
from .database import Base


class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    npc_id = Column(String, nullable=False)
    summary = Column(Text, default="")
    turn_count = Column(Integer, default=0)
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc))


async def get_or_create_player(db: AsyncSession, name: str) -> Player:
    result = await db.execute(select(Player).where(Player.name == name))
    player = result.scalar_one_or_none()
    if not player:
        player = Player(name=name)
        db.add(player)
        await db.commit()
        await db.refresh(player)
    return player


async def get_conversation(db: AsyncSession, player_id: int, npc_id: str) -> Conversation:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.player_id == player_id, Conversation.npc_id == npc_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        conv = Conversation(player_id=player_id, npc_id=npc_id)
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
    return conv


async def record_turn(
    db: AsyncSession,
    player_name: str,
    npc_id: str,
    player_text: str,
    npc_text: str,
) -> None:
    player = await get_or_create_player(db, player_name)
    conv = await get_conversation(db, player.id, npc_id)

    conv.turn_count += 1
    conv.last_updated = datetime.now(timezone.utc)

    # Append to summary
    new_entry = f"[Turn {conv.turn_count}] Player: {player_text[:120]} | NPC: {npc_text[:120]}"
    existing = conv.summary or ""
    lines = existing.split("\n") if existing else []
    lines.append(new_entry)
    # Keep last 20 turns in raw form; older turns stay compressed
    conv.summary = "\n".join(lines[-20:])

    await db.commit()


async def get_memory_summary(db: AsyncSession, player_name: str, npc_id: str) -> str:
    result = await db.execute(select(Player).where(Player.name == player_name))
    player = result.scalar_one_or_none()
    if not player:
        return "You have not met this person before."

    conv = await get_conversation(db, player.id, npc_id)
    if not conv.summary:
        return "You have not spoken to this person before."

    return f"Previous conversations with this person:\n{conv.summary}"
