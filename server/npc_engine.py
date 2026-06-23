import json
import os
import re
from pathlib import Path
from typing import AsyncGenerator

import httpx

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")
OLLAMA_THINK_MODEL = os.getenv("OLLAMA_THINK_MODEL", "qwen2.5:1.5b")

_npc_definitions: dict = {}


def load_npc_definitions() -> None:
    defs_dir = Path(__file__).parent / "npc_definitions"
    for path in defs_dir.glob("*.json"):
        with open(path) as f:
            data = json.load(f)
            _npc_definitions[data["id"]] = data


def get_npc(npc_id: str) -> dict | None:
    return _npc_definitions.get(npc_id)


def build_system_prompt(
    npc: dict,
    memory_summary: str,
    recent_events: list[str],
    player_name: str,
    relationship: int = 0,
    session_turns: list[dict] | None = None,
) -> str:
    events_block = (
        "\n".join(f"- {e}" for e in recent_events[-5:])
        if recent_events
        else ""
    )

    memory_block = (
        memory_summary
        if memory_summary and "not spoken" not in memory_summary and "not met" not in memory_summary
        else ""
    )

    memory_section = f"HISTORY WITH THIS PERSON:\n{memory_block}\n\n" if memory_block else ""
    events_section = f"RECENT EVENTS IN TOWN:\n{events_block}\n\n" if events_block else ""

    # Trust / relationship modifier — shifts your emotional register for this conversation
    if relationship <= -3:
        rel_text = (
            "TRUST: You deeply mistrust this person. Give one-word or one-sentence answers only. "
            "Try to end the conversation quickly. Reveal nothing you don't have to."
        )
    elif relationship == -2:
        rel_text = (
            "TRUST: You don't trust this person. Keep answers short. Change the subject when possible. "
            "Don't give anything away."
        )
    elif relationship == -1:
        rel_text = "TRUST: You're slightly guarded. Polite but careful. You don't say much."
    elif relationship == 1:
        rel_text = (
            "TRUST: This person has earned a little of your trust. You occasionally say slightly more "
            "than you meant to. You might catch yourself and stop."
        )
    elif relationship == 2:
        rel_text = (
            "TRUST: You trust this person more than most. Let things slip more easily. Show more feeling. "
            "Pause before hard questions instead of deflecting immediately."
        )
    elif relationship >= 3:
        rel_text = (
            "TRUST: You genuinely trust this person. You will share things you've told no one else. "
            "You might warn them. You are afraid for them."
        )
    else:
        rel_text = ""  # relationship == 0: neutral baseline, no modifier

    rel_section = f"{rel_text}\n\n" if rel_text else ""

    # Pull this session's NPC responses so the model can see exactly what it already said
    prior_npc_lines = [
        m["content"].strip()
        for m in (session_turns or [])
        if m.get("role") == "assistant" and m.get("content", "").strip()
    ]
    if prior_npc_lines:
        samples = [f'  "{s[:120]}"' for s in prior_npc_lines[-6:]]
        avoid_section = (
            "RESPONSES ALREADY GIVEN THIS CONVERSATION — each line is spent, do not echo or rephrase it:\n"
            + "\n".join(samples)
            + "\n"
            "Say something genuinely different. If asked about the same topic again, show a new emotion, "
            "reveal a new detail, or react to being asked twice.\n\n"
        )
    else:
        avoid_section = ""

    backstory = npc.get('backstory', npc.get('one_line_backstory', ''))

    return f"""You are {npc['name']}. You live in Ashveil — a small, dying town that most people left years ago, for reasons no one discusses.

YOUR HISTORY: {backstory}

YOUR PERSONALITY: {npc.get('personality_traits', '')}

YOUR EMOTIONAL STATE RIGHT NOW: {npc.get('emotional_state', '')}

HOW YOU SPEAK: {npc['speech_style']}

YOUR SECRETS (use each scripted line ONCE — after that, find a new angle every time):
{npc['npc_specific_secrets']}

{memory_section}{events_section}{rel_section}{avoid_section}RULES:
- Reply in 1-3 sentences MAX. Short. Never monologue.
- Never say "I cannot" or break character. You ARE this person.
- Speak naturally. No flowery descriptions. Real people talk plainly, even about terrible things.
- NEVER repeat or closely paraphrase anything in the RESPONSES ALREADY GIVEN list. The scripted lines in YOUR SECRETS are one-time-use; once spent, improvise.
- Always respond to what was actually said. Read the last message. Engage with it directly before retreating into your character's habits.
- When asked about Daniel Farrow specifically: react as your secrets describe. Do not ignore it.
- When scared or evasive: short fragments. Trailing off. Changing subject mid-thought.
- MYSTERY MOMENTS ONLY: when something touches on the town's secrets, let something be slightly off — a wrong tense, a name you shouldn't know. Not every reply needs this. A greeting is just a greeting.
- Never explain the mystery directly. Imply. Deflect. Let silences carry weight.

SMALL TALK: If someone says something casual — hello, hey, morning, how are you, what's up — respond the way your character naturally would. Short, in voice, grounded. Save the strangeness for when it's earned.

EXAMPLES:
Good (mystery moment): "He sat right here. Ordered the usual." (pause) "We don't have a usual here."
Good (small talk): "Morning, hon. Coffee's hot. Sit wherever."
Bad: "The darkness of Ashveil weighs heavy on my soul as I contemplate your question..."
Bad: Forcing mystery into a simple greeting.
Bad: Saying the same thing you already said, even if the question is similar.

The visitor's name is: {player_name}"""


async def stream_ollama(
    system_prompt: str,
    messages: list[dict],
) -> AsyncGenerator[str, None]:
    payload = {
        "model": OLLAMA_MODEL,
        "stream": True,
        "messages": [{"role": "system", "content": system_prompt}] + messages,
        "options": {
            "temperature": 0.75,
            "top_p": 0.90,
            "repeat_penalty": 1.1,
            "num_predict": 160,
            "stop": ["\nPlayer:", "\nUser:", "\n---", "---"]
        }
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json=payload) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.strip():
                    continue
                try:
                    chunk = json.loads(line)
                    token = chunk.get("message", {}).get("content", "")
                    if token:
                        yield token
                    if chunk.get("done"):
                        break
                except json.JSONDecodeError:
                    continue


# ── Agentic NPC think system ──────────────────────────────────────────────────

# In-memory action history per NPC (resets on server restart — intentional)
_npc_action_history: dict[str, list[str]] = {}


def record_npc_think_action(npc_id: str, description: str) -> None:
    hist = _npc_action_history.setdefault(npc_id, [])
    hist.append(description)
    if len(hist) > 4:
        hist.pop(0)


def get_npc_recent_think_actions(npc_id: str) -> list[str]:
    return _npc_action_history.get(npc_id, [])


def build_think_prompt(
    npc: dict,
    context: dict,
    recent_actions: list[str],
    recent_events: list[str],
) -> str:
    nearby_npcs = context.get("nearby_npcs", [])
    player_distance: float = context.get("player_distance", 99.0)
    player_nearby: bool = context.get("player_nearby", False)

    nearby_str = (
        ", ".join(f"{n['name']} ({n['distance']:.1f} tiles)" for n in nearby_npcs[:3])
        if nearby_npcs
        else "no one"
    )

    events_str = (
        "\n".join(f"- {e}" for e in recent_events[-3:])
        if recent_events
        else "nothing notable"
    )

    recent_str = (
        "\n".join(f"- {a}" for a in recent_actions)
        if recent_actions
        else "nothing yet this session"
    )

    player_str = (
        f"nearby ({player_distance:.1f} tiles away)"
        if player_nearby
        else f"not nearby ({player_distance:.1f} tiles away)"
    )

    backstory = npc.get("backstory", npc.get("one_line_backstory", ""))

    return f"""You are {npc['name']} living in Ashveil — a small, dying town full of secrets.

YOUR NATURE: {backstory}
YOUR PERSONALITY: {npc.get('personality_traits', '')}
YOUR EMOTIONAL STATE: {npc.get('emotional_state', '')}

RIGHT NOW:
- People nearby: {nearby_str}
- The stranger: {player_str}
- Recent town events:
{events_str}

YOUR RECENT ACTIONS:
{recent_str}

Decide what to do next. Respond with ONLY a single line of valid JSON — no explanation, no markdown, nothing else.

Options:
{{"action": "speak", "text": "one short sentence in your voice, max 10 words"}}
{{"action": "move", "dx": 0, "dy": 0}}
{{"action": "approach_player"}}
{{"action": "idle"}}

Rules:
- speak text must be in character, under 12 words, natural — not dramatic
- move dx/dy are integer tile offsets between -3 and 3
- approach_player only if the stranger is nearby
- Vary your behavior — don't always idle, don't always speak
- Do not repeat your recent actions

JSON only:"""


def validate_npc_action(raw: dict, player_nearby: bool) -> dict:
    action = raw.get("action", "idle")

    if action == "speak":
        text = str(raw.get("text", "")).strip().strip('"').strip("'")
        if text and len(text) <= 150:
            return {"action": "speak", "text": text}

    elif action == "move":
        try:
            dx = max(-3, min(3, int(raw.get("dx", 0))))
            dy = max(-3, min(3, int(raw.get("dy", 0))))
            return {"action": "move", "dx": dx, "dy": dy}
        except (ValueError, TypeError):
            pass

    elif action == "approach_player" and player_nearby:
        return {"action": "approach_player"}

    return {"action": "idle"}


async def call_ollama_think(prompt: str) -> dict:
    """Non-streaming Ollama call for NPC decision-making. Returns a validated action dict."""
    payload = {
        "model": OLLAMA_THINK_MODEL,
        "stream": False,
        "messages": [{"role": "user", "content": prompt}],
        "options": {
            "temperature": 0.85,
            "top_p": 0.90,
            "num_predict": 80,
            "stop": ["\n\n", "---"],
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
        resp.raise_for_status()
        data = resp.json()
        raw_text = data.get("message", {}).get("content", "").strip()

        # Extract first JSON object from response (handle stray markdown/prose)
        match = re.search(r'\{[^{}]+\}', raw_text, re.DOTALL)
        if match:
            return json.loads(match.group())
        return {"action": "idle"}
