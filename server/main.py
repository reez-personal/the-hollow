import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .database import init_db, SessionLocal
from .npc_engine import (
    load_npc_definitions, get_npc, build_system_prompt, stream_ollama,
    build_think_prompt, validate_npc_action, call_ollama_think,
    record_npc_think_action, get_npc_recent_think_actions,
)
from .memory import get_memory_summary, record_turn
from .world_state import set_flag, get_all_flags, add_event, get_recent_events


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    load_npc_definitions()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


# ── World state ───────────────────────────────────────────────────────────────

class FlagBody(BaseModel):
    key: str
    value: str

class EventBody(BaseModel):
    text: str


@app.post("/world/flag")
async def post_flag(body: FlagBody):
    async with SessionLocal() as db:
        await set_flag(db, body.key, body.value)
    return {"ok": True}


@app.get("/world/flags")
async def all_flags():
    async with SessionLocal() as db:
        return await get_all_flags(db)


@app.post("/world/event")
async def post_event(body: EventBody):
    async with SessionLocal() as db:
        await add_event(db, body.text)
    return {"ok": True}


# ── NPC WebSocket ─────────────────────────────────────────────────────────────

@app.websocket("/ws/npc/{npc_id}")
async def npc_ws(websocket: WebSocket, npc_id: str):
    await websocket.accept()

    npc = get_npc(npc_id)
    if not npc:
        await websocket.send_json({"type": "error", "message": f"Unknown NPC: {npc_id}"})
        await websocket.close()
        return

    await websocket.send_json({"type": "connected", "npc_id": npc_id})

    # Per-connection message history (session memory)
    message_history: list[dict] = []

    async with SessionLocal() as db:
        try:
            while True:
                data = await websocket.receive_json()

                if data.get("type") == "disconnect":
                    break

                if data.get("type") != "player_input":
                    continue

                player_text: str = data.get("text", "").strip()
                player_name: str = data.get("player_name", "Stranger").strip() or "Stranger"
                relationship: int = int(data.get("relationship", 0) or 0)

                if not player_text:
                    continue

                # Build context
                memory_summary = await get_memory_summary(db, player_name, npc_id)
                recent_events = await get_recent_events(db)
                system_prompt = build_system_prompt(
                    npc, memory_summary, recent_events, player_name,
                    relationship, message_history,
                )

                # Append player message to history
                message_history.append({"role": "user", "content": player_text})

                # Stream Ollama response
                full_response = ""
                try:
                    async for token in stream_ollama(system_prompt, message_history):
                        full_response += token
                        await websocket.send_json({"type": "token", "text": token})
                except Exception as e:
                    await websocket.send_json({"type": "error", "message": "LLM unavailable"})
                    print(f"Ollama error: {e}")
                    continue

                await websocket.send_json({"type": "turn_end", "full_response": full_response})

                # Append NPC response to history (keep last 10 turns to avoid context bloat)
                message_history.append({"role": "assistant", "content": full_response})
                if len(message_history) > 20:
                    message_history = message_history[-20:]

                # Persist to SQLite
                await record_turn(db, player_name, npc_id, player_text, full_response)

        except WebSocketDisconnect:
            pass
        except Exception as e:
            print(f"WS error: {e}")


# ── NPC Agentic Think ────────────────────────────────────────────────────────

class NpcThinkBody(BaseModel):
    npc_id: str
    context: dict[str, Any]


@app.post("/npc/think")
async def npc_think(body: NpcThinkBody):
    npc = get_npc(body.npc_id)
    if not npc:
        return {"action": "idle"}

    async with SessionLocal() as db:
        recent_events = await get_recent_events(db)

    recent_actions = get_npc_recent_think_actions(body.npc_id)
    prompt = build_think_prompt(npc, body.context, recent_actions, recent_events)

    try:
        raw = await call_ollama_think(prompt)
    except Exception as e:
        print(f"[think] {body.npc_id}: {e}")
        return {"action": "idle"}

    player_nearby: bool = bool(body.context.get("player_nearby", False))
    action = validate_npc_action(raw, player_nearby)

    # Persist to in-memory history so next think sees what this NPC just did
    if action["action"] == "speak":
        record_npc_think_action(body.npc_id, f'said: "{action["text"]}"')
    elif action["action"] == "move":
        record_npc_think_action(body.npc_id, f'moved ({action["dx"]}, {action["dy"]})')
    elif action["action"] == "approach_player":
        record_npc_think_action(body.npc_id, "moved toward the stranger")

    return action


# ── Serve built client (production) ──────────────────────────────────────────

client_dist = os.path.join(os.path.dirname(__file__), "..", "client", "dist")
if os.path.isdir(client_dist):
    app.mount("/", StaticFiles(directory=client_dist, html=True), name="static")
