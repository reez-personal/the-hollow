import { ThreeEngine } from './ThreeEngine'
import { WorldBuilder, MAP_W, MAP_H } from './WorldBuilder'
import { PlayerController } from './PlayerController'
import { NPCController } from './NPCController'
import { WorldState } from '../systems/WorldState'
import { INTERACTABLES, type Interactable } from '../data/interactables'
import { DialogueUI } from '../ui/DialogueUI'
import { ExamineUI } from '../ui/ExamineUI'
import { HUD } from '../ui/HUD'
import { RoomController, type RoomId } from './RoomController'

// ─── Proximity atmospheric triggers ──────────────────────────────────────────
const PROXIMITY_TRIGGERS = [
  { id: 'town_entrance',  tx:  6, ty: 13, radius: 2.0, text: "You don't remember arriving.\nYou've just always been here." },
  { id: 'well_near',      tx: 13, ty: 11, radius: 2.5, text: "Thirty-one marks on the stone.\nYou haven't counted them yet." },
  { id: 'church_near',    tx:  5, ty:  7, radius: 2.5, text: "The bell hasn't rung in years.\nYou can still hear it." },
  { id: 'motel_room4',    tx:  9, ty: 20, radius: 2.0, text: "Room 4. Long-term resident.\nNo one uses that room." },
  { id: 'cemetery_gate',  tx: 44, ty: 12, radius: 3.0, text: "The most recent gravestone\nhas no dates on it." },
  { id: 'creek_path',     tx: 28, ty: 24, radius: 2.0, text: "The water moves upstream here.\nYou almost didn't notice." },
  { id: 'gas_station',    tx: 33, ty: 10, radius: 2.5, text: "No cars since before you arrived.\nThe pumps still run." },
  { id: 'farmhouse_ruin', tx: 42, ty: 21, radius: 2.5, text: "Someone lived here until recently.\nThe calendar says October." },
  { id: 'water_tower',    tx: 30, ty:  6, radius: 2.5, text: "Your name is written somewhere\nyou haven't looked yet." },
  { id: 'town_square',    tx: 13, ty: 13, radius: 1.5, text: "Everyone knows everyone here.\nThey know you too." },
  { id: 'sheriff_office', tx: 26, ty:  9, radius: 2.0, text: "The sheriff's records go back decades.\nYour name appears in them." },
  { id: 'mill_south',     tx: 37, ty: 29, radius: 2.5, text: "The mill stopped turning\nthe same week Daniel Farrow left." },
]

// Building entrances
const ENTRANCES: Array<{ tx: number; ty: number; roomId: RoomId; label: string }> = [
  { tx:  9, ty: 11, roomId: 'diner',        label: 'Ashveil Diner' },
  { tx:  8, ty: 21, roomId: 'motel_room_3', label: 'Room 3' },
  { tx: 16, ty: 20, roomId: 'motel_room_1', label: 'Room 1 — Yours' },
  { tx:  5, ty:  9, roomId: 'church',        label: 'Church' },
  { tx: 20, ty: 11, roomId: 'general_store', label: 'General Store' },
]

// Voice fragments shown at voice_source interactable
const VOICE_FRAGMENTS: string[][] = [
  ["You stop.\n\nThere is something at the edge of hearing.\nNot wind. Not rain.\n\nA voice. Distant. Fragmented.\n\nYou can't make out the words.\n\nBut it sounds like someone you know."],
  ["—if you're hearing this...\n\nYou strain to listen.\n\nThe voice cuts out.", "You stand very still.\n\nThe voice is familiar in a way you can't name.\nNot like a stranger's voice.\n\nLike your own voice, recorded."],
  ["—you came back. You always come back.\n\nA long pause in the static.\n\n—my name is Daniel Farrow. Or it was.", "The voice is clearer now.\nCloser.\n\nYou look south.\n\nSomething is waiting to be found."],
  ["—I called my sister. She said a man named Eli Cross had already called her.\nAsking about a missing person named Daniel Farrow.\n\nThat was me.\n\nI called her as Eli.\nI was already gone.", "The voice is right there.\nVery close now.\n\nA few steps further south.\n\nA cassette recorder.\nLeft here on purpose.\n\nFor you."],
]

const RECORDER_PAGES = [
  "An old cassette recorder, half-buried in wet leaves.\n\nYou press play.\n\nThere is a long hiss of static.\n\nThen a voice.",
  "\"My name is Daniel Farrow.\n\nI don't know how long I've been here.\n\nThey did something to me.\n\nI woke up in this town with a different name,\ndifferent memories, but the same feeling.\nThe same thing I came here for is still there.\nI still don't know what it is.\"",
  "\"I called my sister.\n\nShe said a man named Eli Cross had already called her,\nasking about a missing person named Daniel Farrow.\n\nThat was me.\n\nI called her as Eli.\n\nI was already gone before I knew it.\"",
  "\"If you're hearing this — you found it.\n\nYou're me.\n\nDon't let them do it again.\n\nLena knows. Room 4.\n\nWhatever you came here to find —\nwhatever I came here to find —\nit's still here.\n\nCheck your room.\nThe drawer.\n\nYou are not—\"\n\n[Recording cuts off.]",
]

const WELL_REVELATION_PAGES = [
  "You stand at the edge of the well.\n\nThe one Daniel's notes pointed to.\nThe one on the cassette.\nThe one you have been circling this entire time.\n\nYou are here now.",
  "You look down.\n\nIt is very deep.\nThere is no water.\n\nBut there is a sound.\nBreathing.\n\nIt does not echo.\nIt does not come from below.\n\nIt is at the same level as your face.\nSomething is looking up at you\nfrom the exact distance\nyou are looking down.",
  "There are marks on the stone rim.\nTally marks.\n\nYou count them.\n\n31.\n\nThe thirty-second mark is different.\nNot a tally.\n\nA name.\n\nIn your handwriting.\n\nDANIEL FARROW.",
  "You understand it now.\n\nThe Keeping doesn't take your life.\nIt takes your name.\nYour reasons.\nThe wound you came here carrying.\n\nIt leaves you clean.\nReady to come back and search again.\nFor yourself.\nUsing a different name.",
  "The cassette recorder.\nYou buried it for yourself.\n\nThe matchbook.\nYou left it in the jacket pocket.\n\nThe notes on the wall.\nYou wrote them.\n\nEvery clue in this town that led you here\nwas left by a previous version of you\nfor the next version of you.\n\nFor thirty-one cycles.",
  "You are not Eli Cross searching for Daniel Farrow.\n\nYou are Daniel Farrow.\n\nYou have always been Daniel Farrow.\n\nYou have been here four times.\n\nYou have stood at this well four times.",
  "The well doesn't rush you.\n\nIt has waited thirty-one times.\nIt will wait a little longer.\n\nYou can give it what it wants —\nthe grief, the searching, the wound —\nand wake up new somewhere down the road.\n\nOr you can hold on to what you know.\nRefuse.\nRemember.\n\nBe the first one who did.",
]

// Agent think system
const AGENT_NPCS = new Set([
  'maren', 'father_crale', 'edmund', 'ruth', 'the_boy', 'lena', 'sheriff_cole', 'doc_havel',
])
const MAX_AGENT_CALLS = 2

export class GameController {
  private engine: ThreeEngine
  private world: WorldBuilder
  private player: PlayerController
  private npcs: NPCController
  private worldState = WorldState.getInstance()

  private dialogueUI = new DialogueUI()
  private examineUI = new ExamineUI()
  private activeRoom: RoomController | null = null
  private hud = new HUD()

  private firedTriggers = new Set<string>()
  private lastQuestStage = -1
  private gameStartTime = Date.now()
  private readonly NIGHT_DURATION_MS = 90 * 60 * 1000

  private agentCallsInFlight = 0

  // Entrance label overlay
  private entranceLabel: HTMLDivElement
  private interactableLabel: HTMLDivElement

  // Audio
  private audioCtx?: AudioContext
  private npcGains = new Map<string, GainNode>()
  private audioReady = false

  private blocked = false  // dialogue / examine / interior open

  constructor(container: HTMLElement) {
    this.engine = new ThreeEngine(container)
    this.world  = new WorldBuilder(this.engine.scene)
    this.world.build()
    this.player = new PlayerController(this.engine.scene, (tx, ty) => this.world.isSolid(tx, ty))
    this.npcs   = new NPCController(this.engine.scene, (tx, ty) => this.world.isSolid(tx, ty))

    this.entranceLabel = this.makeLabel()
    this.interactableLabel = this.makeLabel()

    const initAudio = () => {
      this.initAudio()
      window.removeEventListener('keydown', initAudio)
      window.removeEventListener('click', initAudio)
    }
    window.addEventListener('keydown', initAudio, { once: true })
    window.addEventListener('click', initAudio, { once: true })

    void this.worldState.sync().then(() => {
      if (!this.worldState.getFlag('player_name')) {
        void this.worldState.setFlag('player_name', 'Eli Cross')
      }
    })
  }

  private makeLabel(): HTMLDivElement {
    const el = document.createElement('div')
    Object.assign(el.style, {
      position: 'fixed', bottom: '60px', left: '50%', transform: 'translateX(-50%)',
      fontFamily: 'monospace', fontSize: '10px', color: '#886644',
      background: 'rgba(10,10,8,0.85)', padding: '3px 8px',
      pointerEvents: 'none', zIndex: '400', display: 'none',
    })
    document.body.appendChild(el)
    return el
  }

  update(delta: number) {
    if (this.activeRoom) { this.activeRoom.update(delta); return }
    if (this.blocked) return

    const ptx = this.player.tx
    const pty = this.player.ty

    this.player.update(delta)
    this.engine.setCameraTarget(this.player.tx, this.player.ty)
    this.engine.setLantern(this.player.tx, this.player.ty)
    this.world.updateWater(Date.now() / 1000)
    this.npcs.update(delta, this.player.tx, this.player.ty)

    void ptx; void pty

    this.updateNightLantern()
    this.updateProximityTriggers()
    this.updateEntranceLabel()
    this.updateInteractableLabel()
    this.updateQuestHud()
    this.updateAgents(delta)
    this.updateAudio()

    // Key actions
    if (this.player.eJustPressed) {
      this.handleE()
    }
    if (this.player.fJustPressed) {
      this.handleF()
    }
  }

  private handleE() {
    const px = Math.round(this.player.tx)
    const py = Math.round(this.player.ty)

    // Close interactables first
    for (const item of INTERACTABLES) {
      if (!this.isInteractableUnlocked(item)) continue
      const dist = Math.hypot(item.tileX - px, item.tileY - py)
      if (dist <= 1.0) { this.openExamine(item); return }
    }

    // NPC
    const npc = this.npcs.getNearestNPC(this.player.tx, this.player.ty, 2.0)
    if (npc) {
      this.blocked = true
      this.player.setInputEnabled(false)
      this.dialogueUI.open(npc.id, npc.data.displayName, npc.data.initialGreeting, (followReq, stopFollow, npcId) => {
        this.blocked = false
        this.player.setInputEnabled(true)

        // Quest progression
        const leadNPCs = ['maren', 'vera_marsh', 'father_crale', 'edmund', 'lena', 'the_boy', 'doc_havel']
        if (leadNPCs.includes(npcId) && !this.worldState.hasFlag('talked_to_lead')) {
          void this.worldState.setFlag('talked_to_lead', 'true')
        }

        if (followReq) {
          const target = this.npcs.npcs.find(n => n.id === npcId)
          if (target) target.following = true
        } else if (stopFollow) {
          const target = this.npcs.npcs.find(n => n.id === npcId)
          if (target) {
            target.following = false
            target.tx = target.spawnTX
            target.ty = target.spawnTY
          }
        }
      })
      return
    }

    // Farther interactables
    for (const item of INTERACTABLES) {
      if (!this.isInteractableUnlocked(item)) continue
      const dx = Math.abs(item.tileX - px)
      const dy = Math.abs(item.tileY - py)
      if (dx <= 2 && dy <= 2) { this.openExamine(item); return }
    }
  }

  private handleF() {
    for (const entrance of ENTRANCES) {
      const dx = Math.abs(entrance.tx - this.player.tx)
      const dy = Math.abs(entrance.ty - this.player.ty)
      if (dx <= 2 && dy <= 3) {
        this.blocked = true
        this.player.setInputEnabled(false)
        this.activeRoom = new RoomController(this.engine.renderer, entrance.roomId, () => {
          this.activeRoom = null
          this.blocked = false
          this.player.setInputEnabled(true)
        })
        return
      }
    }
  }

  private openExamine(item: Interactable) {
    const ws = this.worldState
    let pages = item.pages

    if (item.id === 'motel_register') void ws.setFlag('read_motel_register', 'true')
    if (item.id === 'missing_poster_1') void ws.logEvent('The player saw the missing poster for Daniel Farrow.')

    if (item.id === 'payphone') {
      pages = [
        "The number from the matchbook.\n\nYou pick up the receiver. It smells like cigarettes and rain.\n\nYou dial.",
        "It rings once.\nTwice.\nThree times.\n\nThen a click.",
        "Not a voice.\n\nMore like a voice.\n\nLike someone speaking from the far end of a long hall.\n\nOr from inside your own skull.\n\nThen three words, clear:\n\n\"You called yourself.\"",
        "The line goes dead.\n\nYou stand in the booth a moment longer.\n\nSomewhere south of here, something is waiting to be found.\n\nYou can almost hear it already.",
      ]
      if (!ws.hasFlag('voice_phase') || ws.getFlag('voice_phase') === '0') {
        void ws.setFlag('voice_phase', '1')
        void ws.logEvent('Player used the payphone. The voice trail has started.')
      }
    }

    if (item.id === 'voice_source') {
      const phase = parseInt(ws.getFlag('voice_phase') ?? '1', 10)
      const fragIndex = Math.max(0, phase - 1)
      pages = VOICE_FRAGMENTS[fragIndex] ?? item.pages
      void ws.setFlag('voice_phase', String(Math.min(phase + 1, VOICE_FRAGMENTS.length + 1)))
      void ws.logEvent(`Player heard voice fragment ${fragIndex + 1}.`)
    }

    if (item.id === 'cassette_recorder') {
      const phase = parseInt(ws.getFlag('voice_phase') ?? '0', 10)
      pages = phase >= VOICE_FRAGMENTS.length + 1
        ? RECORDER_PAGES
        : ["An old cassette recorder, half-buried in wet leaves.\n\nYou press play.\n\nThere is static. Then silence.\n\nYou can't hear it yet.\n\nSomething is still calling further south."]
      if (phase >= VOICE_FRAGMENTS.length + 1) {
        void ws.setFlag('recorder_found', 'true')
        void ws.logEvent('Player found and played the cassette recorder.')
      }
    }

    if (item.id === 'the_well') {
      pages = WELL_REVELATION_PAGES
      void ws.setFlag('well_visited', 'true')
      void ws.logEvent('Player reached the well. Final revelation.')
    }

    this.blocked = true
    this.player.setInputEnabled(false)
    this.examineUI.open(pages, () => {
      this.blocked = false
      this.player.setInputEnabled(true)
    })
  }

  private isInteractableUnlocked(item: Interactable): boolean {
    const ws = this.worldState
    if (item.id === 'payphone')         return ws.hasFlag('matchbook_found')
    if (item.id === 'voice_source')     return parseInt(ws.getFlag('voice_phase') ?? '0', 10) >= 1
    if (item.id === 'cassette_recorder') return parseInt(ws.getFlag('voice_phase') ?? '0', 10) >= 1
    if (item.id === 'the_well')         return ws.hasFlag('wallet_found')
    return true
  }

  private updateProximityTriggers() {
    for (const t of PROXIMITY_TRIGGERS) {
      if (this.firedTriggers.has(t.id)) continue
      const dist = Math.hypot(t.tx - this.player.tx, t.ty - this.player.ty)
      if (dist < t.radius) {
        this.firedTriggers.add(t.id)
        this.hud.showProximityText(t.text)
        break
      }
    }
  }

  private updateEntranceLabel() {
    for (const entrance of ENTRANCES) {
      const dx = Math.abs(entrance.tx - this.player.tx)
      const dy = Math.abs(entrance.ty - this.player.ty)
      if (dx <= 2 && dy <= 3) {
        this.entranceLabel.textContent = `[F] Enter ${entrance.label}`
        this.entranceLabel.style.display = 'block'
        return
      }
    }
    this.entranceLabel.style.display = 'none'
  }

  private updateInteractableLabel() {
    const px = Math.round(this.player.tx)
    const py = Math.round(this.player.ty)
    for (const item of INTERACTABLES) {
      if (!this.isInteractableUnlocked(item)) continue
      const dx = Math.abs(item.tileX - px)
      const dy = Math.abs(item.tileY - py)
      if (dx <= 2 && dy <= 2) {
        this.interactableLabel.textContent = `[E] ${item.prompt}`
        this.interactableLabel.style.display = 'block'
        return
      }
    }
    this.interactableLabel.style.display = 'none'
  }

  private updateQuestHud() {
    const stage = this.worldState.getQuestStage()
    if (stage === this.lastQuestStage) return
    this.lastQuestStage = stage
    const obj = this.worldState.getQuestObjective()
    this.hud.setQuest(obj)
  }

  private updateNightLantern() {
    const elapsed = Date.now() - this.gameStartTime
    const t = Math.min(elapsed / this.NIGHT_DURATION_MS, 1)
    // Gradually reduce lantern intensity as night deepens
    const intensity = 2.2 + t * 0.8
    this.engine.setLantern(this.player.tx, this.player.ty, intensity)
  }

  // ─── Agent think loop ─────────────────────────────────────────────────────

  private updateAgents(delta: number) {
    if (this.agentCallsInFlight >= MAX_AGENT_CALLS) return
    for (const npc of this.npcs.npcs) {
      if (!AGENT_NPCS.has(npc.id)) continue
      if (npc.following || npc.agentThinking) continue
      npc.agentCooldown -= delta
      if (npc.agentCooldown <= 0) {
        npc.agentCooldown = 45000 + Math.random() * 30000
        void this.thinkNPC(npc.id)
        if (this.agentCallsInFlight >= MAX_AGENT_CALLS) break
      }
    }
  }

  private async thinkNPC(npcId: string) {
    const npc = this.npcs.npcs.find(n => n.id === npcId)
    if (!npc) return

    npc.agentThinking = true
    this.agentCallsInFlight++

    const nearbyNpcs = this.npcs.npcs
      .filter(o => o.id !== npcId)
      .map(o => ({ id: o.id, name: o.data.displayName, distance: parseFloat(Math.hypot(o.tx - npc.tx, o.ty - npc.ty).toFixed(1)) }))
      .filter(o => o.distance < 5)
      .slice(0, 3)

    const playerDist = Math.hypot(this.player.tx - npc.tx, this.player.ty - npc.ty)
    const context = {
      current_tile: [Math.round(npc.tx), Math.round(npc.ty)],
      nearby_npcs: nearbyNpcs,
      player_nearby: playerDist < 7,
      player_distance: parseFloat(playerDist.toFixed(1)),
    }

    try {
      const resp = await fetch('/npc/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ npc_id: npcId, context }),
        signal: AbortSignal.timeout(28000),
      })
      if (resp.ok) {
        const action = await resp.json() as { action: string; text?: string; dx?: number; dy?: number }
        this.executeNPCAction(npcId, action)
      }
    } catch {
      // Server unavailable
    } finally {
      npc.agentThinking = false
      this.agentCallsInFlight = Math.max(0, this.agentCallsInFlight - 1)
    }
  }

  private executeNPCAction(npcId: string, action: { action: string; text?: string; dx?: number; dy?: number }) {
    const npc = this.npcs.npcs.find(n => n.id === npcId)
    if (!npc || npc.following) return

    if (action.action === 'speak' && action.text) {
      this.npcs.showChatBubble(npc, action.text)
    } else if (action.action === 'move') {
      const dx = action.dx ?? 0
      const dy = action.dy ?? 0
      const targetTX = Math.max(1, Math.min(MAP_W - 2, npc.tx + dx))
      const targetTY = Math.max(1, Math.min(MAP_H - 2, npc.ty + dy))
      if (!this.world.isSolid(Math.round(targetTX), Math.round(targetTY))) {
        npc.wanderTargetTX = targetTX
        npc.wanderTargetTY = targetTY
        npc.wanderMoving = true
      }
    } else if (action.action === 'approach_player') {
      const jitter = () => (Math.random() - 0.5) * 1.5
      const targetTX = Math.max(1, Math.min(MAP_W - 2, this.player.tx + jitter()))
      const targetTY = Math.max(1, Math.min(MAP_H - 2, this.player.ty + jitter()))
      npc.wanderTargetTX = targetTX
      npc.wanderTargetTY = targetTY
      npc.wanderMoving = true
    }
  }

  // ─── Audio ────────────────────────────────────────────────────────────────

  private initAudio() {
    if (this.audioReady) return
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.audioCtx = new AC()

      const NPC_FREQS: Record<string, number> = {
        maren: 178, father_crale: 108, the_boy: 82, lena: 232,
        ruth: 195, edmund: 218, sheriff_cole: 157, doc_havel: 201,
      }

      for (const npc of this.npcs.npcs) {
        const freq = NPC_FREQS[npc.id] ?? 190
        const osc = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()
        const filter = this.audioCtx.createBiquadFilter()
        osc.type = 'sine'
        osc.frequency.value = freq
        filter.type = 'lowpass'
        filter.frequency.value = 350
        gain.gain.value = 0
        osc.connect(filter)
        filter.connect(gain)
        gain.connect(this.audioCtx.destination)
        osc.start()
        this.npcGains.set(npc.id, gain)
      }
      this.audioReady = true
    } catch { /* unavailable */ }
  }

  private updateAudio() {
    if (!this.audioCtx || !this.audioReady) return
    const now = this.audioCtx.currentTime
    for (const npc of this.npcs.npcs) {
      const gain = this.npcGains.get(npc.id)
      if (!gain) continue
      const dist = Math.hypot(npc.tx - this.player.tx, npc.ty - this.player.ty)
      const target = dist < 5 ? Math.max(0, (1 - dist / 5)) * 0.012 : 0
      gain.gain.setTargetAtTime(target, now, 0.8)
    }
  }

  render() {
    if (this.activeRoom) { this.activeRoom.render(); return }
    this.engine.render()
  }
}
