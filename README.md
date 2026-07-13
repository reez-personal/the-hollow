# The Hollow

A first-person isometric horror game set in Ashveil — a small, dying town that most people left years ago, for reasons no one discusses. You arrived looking for someone named Daniel Farrow. The town already knows your name.

Every NPC is powered by a local LLM. They have memories, secrets, and a trust system that shifts based on how you talk to them. Some of them make their own decisions about where to go and what to say, without being prompted.

---

## Stack

| Layer | Technology |
|---|---|
| Renderer | Three.js (orthographic isometric, billboard sprites) |
| Frontend build | Vite + TypeScript |
| Backend | FastAPI (Python) |
| Database | SQLite via SQLAlchemy async |
| LLM inference | Ollama (local) |
| Dialogue transport | WebSocket (streaming tokens) |

---

## Project Structure

```
the-hollow/
├── client/                     # Vite + Three.js frontend
│   ├── src/
│   │   ├── main.ts             # Entry point
│   │   ├── game.ts             # Intro overlay + RAF game loop
│   │   ├── engine/
│   │   │   ├── ThreeEngine.ts      # Renderer, camera, lighting, fog
│   │   │   ├── WorldBuilder.ts     # Procedural world geometry (tiles, buildings, trees, props)
│   │   │   ├── PlayerController.ts # WASD movement, collision, key state
│   │   │   ├── NPCController.ts    # NPC sprites, wander AI, chat bubbles
│   │   │   ├── GameController.ts   # Main game loop, orchestrates all systems
│   │   │   └── RoomController.ts   # Interior rooms (walk-around 3D spaces)
│   │   ├── ui/
│   │   │   ├── DialogueUI.ts       # NPC conversation panel (DOM overlay)
│   │   │   ├── ExamineUI.ts        # Multi-page item examination
│   │   │   ├── HUD.ts              # Quest objective + proximity text
│   │   │   └── InteriorUI.ts       # (Legacy — replaced by RoomController)
│   │   ├── systems/
│   │   │   ├── DialogueManager.ts  # WebSocket client wrapper
│   │   │   └── WorldState.ts       # Quest flags, relationships, sync
│   │   └── data/
│   │       ├── npcs.ts             # Client-side NPC definitions (display names, greetings)
│   │       └── interactables.ts    # World objects (notes, signs, cassette recorder, the well)
│   ├── vite.config.ts          # Dev proxy: /ws, /world, /npc → localhost:8000
│   └── index.html
│
├── server/
│   ├── main.py                 # FastAPI app, all routes, WebSocket handler
│   ├── npc_engine.py           # LLM prompt building, Ollama calls, think system
│   ├── database.py             # SQLAlchemy async engine + session
│   ├── memory.py               # Conversation + Player ORM models
│   ├── world_state.py          # WorldFlag + TownEvent ORM models
│   └── npc_definitions/        # 27 JSON character files (one per NPC)
│
└── hollow.db                   # SQLite database (created on first run)
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **Ollama** running locally — [ollama.com](https://ollama.com)

Pull the models used for dialogue and NPC decisions:

```bash
ollama pull mistral
ollama pull qwen2.5:1.5b
```

---

### Running the backend

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install fastapi uvicorn httpx sqlalchemy aiosqlite websockets
uvicorn main:app --reload --port 8000
```

The server starts at `http://localhost:8000`. On first run it creates `hollow.db` and loads all 27 NPC definitions from `npc_definitions/`.

---

### Running the frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/ws`, `/world`, and `/npc` requests to the FastAPI server automatically.

---

### Production build

```bash
# Build the client
cd client && npm run build

# The FastAPI server also serves the built client
cd server && uvicorn main:app --port 8000
# Visit http://localhost:8000
```

---

## Environment Variables

Set these in `server/.env` or as shell exports before running uvicorn:

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API endpoint |
| `OLLAMA_MODEL` | `mistral` | Model used for NPC dialogue |
| `OLLAMA_THINK_MODEL` | `qwen2.5:1.5b` | Lightweight model for NPC autonomous decisions |

The SQLite database path is hardcoded as `./hollow.db` relative to where uvicorn runs.

---

## How the World Works

### World generation

The map is **56×56 tiles**, built procedurally at startup in `WorldBuilder.ts`. It generates:

- Stone road network (main cross + east road)
- 33 buildings (diner, motel, church, sheriff's office, general store, cemetery, farmhouse ruins, mill, water tower, and residential houses)
- Creek (procedurally wandering south through the east half)
- Trees, fence posts, gravestones, well, barrel props, gas station
- Swamp and marsh areas in the south

Tiles are rendered as `InstancedMesh` (one draw call per tile type). Buildings are `BoxGeometry` with per-face materials (visible east wall, south wall, and roof from the isometric angle).

### Camera

Orthographic isometric camera. Offset: `(+17, +17, +17)` from the player position, looking at `(playerX, 0, playerZ)`. Frustum height = 13 tiles. The player's lantern (`PointLight`) provides the main illumination; moonlight (`DirectionalLight`) is the fill.

### Collision

Solid tiles are stored in a `Set<string>` keyed by `"tx,ty"`. Building footprints and certain world objects are added to this set during world generation. Both player and NPCs use axis-independent sliding collision.

---

## NPC Systems

### 27 NPCs

Each NPC is defined by two files:
- **`server/npc_definitions/{id}.json`** — full character sheet (backstory, personality, secrets, emotional state, speech style)
- **`client/src/data/npcs.ts`** — client-side entry (display name, spawn position, initial greeting)

The 6 core NPCs who drive the story: **Maren** (diner), **Father Crale** (church), **Edmund** (general store), **Ruth** (motel), **Lena** (motel room 4), **The Boy** (cemetery).

### Dialogue (WebSocket streaming)

Pressing **E** near an NPC opens the dialogue panel and connects a WebSocket to `/ws/npc/{id}`. The server:

1. Loads the NPC's JSON definition
2. Fetches the last 20 conversation turns from SQLite (persistent across sessions)
3. Fetches the last 8 town events
4. Builds a system prompt including: backstory, personality, emotional state, speech style, secrets, memory of past conversations, recent events, and a **relationship modifier** (see below)
5. Streams tokens from Ollama back to the client as they're generated
6. Saves the full exchange to SQLite

#### Relationship system

Each NPC has a trust score stored as a world flag (`rel_{npc_id}`), ranging from **-3 to +3**. It starts at 0 and shifts based on what you say:

| Score | Effect on NPC |
|---|---|
| -3 | One-word answers. Trying to end conversation. |
| -2 | Guarded. Won't give anything away. |
| -1 | Polite but careful. |
| 0 | Neutral baseline. |
| +1 | Occasionally says more than they meant to. |
| +2 | Lets things slip. Shows more feeling. |
| +3 | Shares things they've told no one. May warn you. |

Accusatory language decrements trust. Empathetic language increments it. Revealing your name earns +1.

### Agentic NPCs (autonomous behavior)

Eight named NPCs (`maren`, `father_crale`, `edmund`, `ruth`, `the_boy`, `lena`, `sheriff_cole`, `doc_havel`) periodically call `POST /npc/think` with their current world context (nearby NPCs, player distance, recent town events). The server uses a lightweight model (`qwen2.5:1.5b`) to return a JSON action:

```json
{ "action": "speak", "text": "He was asking about the well again." }
{ "action": "move", "dx": 2, "dy": -1 }
{ "action": "approach_player" }
{ "action": "idle" }
```

Actions are validated before execution. Max 2 concurrent LLM calls. Cooldown: 45–75 seconds per NPC. Action history resets on server restart (intentional — NPCs forget between sessions).

---

## Interior Rooms

Five buildings have walkable interiors, entered by pressing **F** near the entrance:

| Building | Key items |
|---|---|
| Room 3 (motel) | Daniel Farrow's field notes, photographs, notebook under the bed, wall map pointing to the well |
| Room 1 (yours) | Wallet with your ID, matchbook with the payphone number, mirror |
| Ashveil Diner | Receipt with a name crossed out twice, far booth with initials carved in |
| The Church | Open Bible with margin notes, confessional with six handwritings, tally marks on a pew |
| General Store | Locked arrival kit cabinet (#32 — your name), inventory list, wall calendar |

Interiors are actual 3D Three.js rooms — same isometric camera, same player sprite, lantern illumination. Walk around with WASD, approach glowing markers to examine items.

---

## Quest & World State

Progress is tracked via string flags stored in SQLite and synced to the client at startup. Quest stages 0–7:

| Stage | Trigger | Objective shown |
|---|---|---|
| 0 | Start | Find someone who knew Daniel Farrow |
| 1 | Talk to a lead NPC | Daniel Farrow stayed in Room 3. Investigate. |
| 2 | Find first clue | Follow Daniel's trail |
| 3 | Find matchbook | Find the payphone |
| 4 | Use payphone | Follow the voice south |
| 5 | Hear all voice fragments | Find what the voice left behind |
| 6 | Find cassette recorder | Room 1. Your room. The drawer. |
| 7 | Find wallet | You know what you are. The well is waiting. |

**World interactables** (E to examine): missing poster, town sign, church bulletin, diner menu, motel register, Edmund's ledger, Ruth's knitting, payphone, voice source, cassette recorder, the well.

---

## Controls

| Key | Action |
|---|---|
| W A S D / Arrow keys | Move |
| E | Talk to NPC / Examine item |
| F | Enter building |
| Esc | Close dialogue / Leave room |
| Space | Skip typewriter text |
| 1–4 | Quick reply shortcuts in dialogue |

---

## Architecture Notes

**Why local LLM?** The game was designed around Ollama so it runs completely offline. `mistral` (4.4GB) handles nuanced character dialogue. `qwen2.5:1.5b` handles fast agentic decisions (sub-second on most hardware).

**Dialogue persistence vs. session state**: Full conversation turns persist to SQLite. NPC action history (what they said or did autonomously this session) is in-memory only and resets on restart.

**Sprites vs. meshes for characters**: Player and NPCs use `THREE.Sprite` with canvas-drawn pixel art. This keeps them always facing the camera without any animation rig. Buildings and room furniture use `BoxGeometry`.

**Fog math**: The isometric camera sits ~29 world units from the ground plane. `FogExp2` density was tuned to `0.010` — at that distance this gives ~25% fog, keeping the atmosphere without making the world invisible.

---

## Deployment

The client is a static Vite build that can go on Vercel or any CDN. The server requires a persistent host with WebSocket support (Railway, Render, Fly.io). Ollama must run separately — either self-hosted on a GPU instance or replaced with a compatible API (Groq's OpenAI-compatible endpoint is a drop-in swap in `npc_engine.py`).

---

## License

MIT
