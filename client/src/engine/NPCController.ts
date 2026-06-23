import * as THREE from 'three'
import { NPC_DATA } from '../data/npcs'
import { MAP_W, MAP_H } from './WorldBuilder'

const NPC_SPEED = 0.75  // tiles/sec

const ISO_NPC_SPAWNS: Record<string, [number, number]> = {
  maren:        [12, 13],
  father_crale: [ 5,  9],
  edmund:       [20, 11],
  ruth:         [22, 19],
  the_boy:      [44,  8],
  lena:         [ 8, 21],
  sheriff_cole: [26, 10],
  doc_havel:    [19, 17],
  vera_marsh:   [19, 12],
  hal_tuttle:   [ 4, 20],
  nan_bly:      [ 7, 23],
  silas_reed:   [32,  8],
  opal_wren:    [41,  7],
  cass_dolby:   [44,  8],
  tom_finch:    [30, 19],
  ida_crane:    [36, 18],
  mr_poole:     [43, 13],
  grace_holt:   [47, 19],
  pete_sykes:   [ 9, 30],
  nora_ash:     [ 7, 31],
  ward_gibbs:   [33, 13],
  theo_vale:    [21, 25],
  bess_moon:    [16, 31],
  arlo_crane:   [21, 31],
  miller_cross: [43, 25],
  agnes_fell:   [ 9, 36],
  sam_pitch:    [16, 36],
}

// NPC accent colors for sprites
const NPC_COLORS: Record<string, number> = {
  maren:        0xc8a060,
  father_crale: 0x303d55,
  the_boy:      0x44445a,
  lena:         0x4a3040,
  ruth:         0x443050,
  edmund:       0x3a3e2c,
  sheriff_cole: 0x2a2a1a,
}

export interface NPC {
  id: string
  tx: number
  ty: number
  spawnTX: number
  spawnTY: number
  sprite: THREE.Sprite
  indicator: THREE.Sprite
  nameLabel: THREE.Sprite
  data: (typeof NPC_DATA)[string]
  following: boolean
  // Wander
  wanderTargetTX: number
  wanderTargetTY: number
  wanderPauseTimer: number
  wanderMoving: boolean
  // Chat
  chatLabel?: THREE.Sprite
  chatCooldown: number
  chatFadeTimer: number
  // Agent
  agentCooldown: number
  agentThinking: boolean
}

export class NPCController {
  npcs: NPC[] = []
  private scene: THREE.Scene
  private solidFn: (tx: number, ty: number) => boolean

  constructor(scene: THREE.Scene, solidFn: (tx: number, ty: number) => boolean) {
    this.scene = scene
    this.solidFn = solidFn
    this.spawnNPCs()
  }

  private spawnNPCs() {
    for (const [id, data] of Object.entries(NPC_DATA)) {
      const spawnTile = ISO_NPC_SPAWNS[id] ?? data.spawnTile
      const [tx, ty] = spawnTile

      const sprite = this.makeSprite(id, data)
      sprite.position.set(tx, 0.5, ty)

      const indicator = this.makeIndicatorSprite('[E]')
      indicator.position.set(tx, 1.1, ty)
      indicator.visible = false

      const nameLabel = this.makeTextSprite(data.displayName, '#888880', 2.5, 0.35)
      nameLabel.position.set(tx, 1.25, ty)
      nameLabel.visible = false

      this.scene.add(sprite, indicator, nameLabel)

      this.npcs.push({
        id, tx, ty, spawnTX: tx, spawnTY: ty,
        sprite, indicator, nameLabel,
        data, following: false,
        wanderTargetTX: tx, wanderTargetTY: ty,
        wanderPauseTimer: 1500 + Math.random() * 4000,
        wanderMoving: false,
        chatCooldown: Math.random() * 15000,
        chatFadeTimer: 0,
        agentCooldown: 5000 + Math.random() * 25000,
        agentThinking: false,
      })
    }
  }

  private makeSprite(id: string, data: (typeof NPC_DATA)[string]): THREE.Sprite {
    const canvas = document.createElement('canvas')
    canvas.width = 24; canvas.height = 40
    const ctx = canvas.getContext('2d')!
    const color = NPC_COLORS[id]
    this.drawNPCCharacter(ctx, 24, 40, color)
    const tex = new THREE.CanvasTexture(canvas)
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, sizeAttenuation: true })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(0.5, 0.85, 1)
    sprite.name = `npc_${id}`
    return sprite
  }

  private drawNPCCharacter(ctx: CanvasRenderingContext2D, w: number, h: number, accentColor?: number) {
    ctx.clearRect(0, 0, w, h)
    const cx = w / 2

    // Convert accent hex to CSS
    const accent = accentColor ? `#${accentColor.toString(16).padStart(6, '0')}` : '#3a3028'

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.beginPath(); ctx.ellipse(cx, h - 2, 5, 2, 0, 0, Math.PI * 2); ctx.fill()

    // Body
    ctx.fillStyle = accent
    ctx.fillRect(cx - 4, h * 0.38, 8, h * 0.35)
    ctx.fillRect(cx - 5, h * 0.48, 10, h * 0.22)

    // Arms
    ctx.fillStyle = accent
    ctx.fillRect(cx - 7, h * 0.40, 3, h * 0.26)
    ctx.fillRect(cx + 4, h * 0.40, 3, h * 0.26)

    // Legs
    ctx.fillStyle = '#1a1812'
    ctx.fillRect(cx - 4, h * 0.72, 3, h * 0.18)
    ctx.fillRect(cx + 1, h * 0.72, 3, h * 0.18)

    // Boots
    ctx.fillStyle = '#0e0c0a'
    ctx.fillRect(cx - 4, h * 0.87, 4, h * 0.10)
    ctx.fillRect(cx + 1, h * 0.87, 4, h * 0.10)

    // Head
    ctx.fillStyle = '#4a3c2e'
    ctx.beginPath(); ctx.arc(cx, h * 0.22, 4, 0, Math.PI * 2); ctx.fill()
  }

  private makeIndicatorSprite(text: string): THREE.Sprite {
    return this.makeTextSprite(text, '#aaaaaa', 0.8, 0.25)
  }

  private makeTextSprite(text: string, color: string, w = 2.0, h = 0.35): THREE.Sprite {
    const canvas = document.createElement('canvas')
    canvas.width = 128; canvas.height = 28
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, 128, 28)
    ctx.font = 'bold 13px monospace'
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.fillText(text, 64, 20)
    const tex = new THREE.CanvasTexture(canvas)
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, sizeAttenuation: true })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(w, h, 1)
    return sprite
  }

  update(delta: number, playerTX: number, playerTY: number) {
    const dt = delta / 1000
    for (const npc of this.npcs) {
      if (npc.chatFadeTimer > 0) {
        npc.chatFadeTimer -= delta
        if (npc.chatFadeTimer <= 0 && npc.chatLabel) {
          this.scene.remove(npc.chatLabel)
          npc.chatLabel = undefined
        }
      }
      this.updateWander(npc, dt, playerTX, playerTY)
      this.updateSpritePosition(npc)
      this.updateIndicator(npc, playerTX, playerTY)
    }
  }

  private updateWander(npc: NPC, dt: number, playerTX: number, playerTY: number) {
    if (npc.following) return

    const distToPlayer = Math.hypot(npc.tx - playerTX, npc.ty - playerTY)
    if (distToPlayer < 2.5) {
      npc.wanderMoving = false
      return
    }

    if (npc.wanderMoving) {
      const tdx = npc.wanderTargetTX - npc.tx
      const tdy = npc.wanderTargetTY - npc.ty
      const tdist = Math.hypot(tdx, tdy)

      if (tdist < 0.15) {
        npc.wanderMoving = false
        npc.wanderPauseTimer = 2000 + Math.random() * 3500
      } else {
        const moveDist = Math.min(NPC_SPEED * dt, tdist)
        const angle = Math.atan2(tdy, tdx)
        const newTX = npc.tx + Math.cos(angle) * moveDist
        const newTY = npc.ty + Math.sin(angle) * moveDist
        if (!this.solidFn(Math.round(newTX), Math.round(npc.ty))) npc.tx = newTX
        if (!this.solidFn(Math.round(npc.tx), Math.round(newTY))) npc.ty = newTY
      }
    } else {
      npc.wanderPauseTimer -= dt * 1000
      if (npc.wanderPauseTimer <= 0) {
        const radius = 2.5
        const angle = Math.random() * Math.PI * 2
        const dist = 0.5 + Math.random() * radius
        const tTX = Math.max(1, Math.min(MAP_W - 2, npc.spawnTX + Math.cos(angle) * dist))
        const tTY = Math.max(1, Math.min(MAP_H - 2, npc.spawnTY + Math.sin(angle) * dist))
        if (!this.solidFn(Math.round(tTX), Math.round(tTY))) {
          npc.wanderTargetTX = tTX; npc.wanderTargetTY = tTY; npc.wanderMoving = true
        } else {
          npc.wanderPauseTimer = 1200
        }
      }
    }
  }

  private updateSpritePosition(npc: NPC) {
    npc.sprite.position.set(npc.tx, 0.5, npc.ty)
    npc.indicator.position.set(npc.tx, 1.1, npc.ty)
    npc.nameLabel.position.set(npc.tx, 1.25, npc.ty)
    if (npc.chatLabel) npc.chatLabel.position.set(npc.tx, 1.4, npc.ty)
  }

  private updateIndicator(npc: NPC, playerTX: number, playerTY: number) {
    const dist = Math.hypot(npc.tx - playerTX, npc.ty - playerTY)
    const inRange = dist < 2.0
    npc.indicator.visible = inRange
    npc.nameLabel.visible = dist < 5.0
  }

  showChatBubble(npc: NPC, text: string) {
    if (npc.chatLabel) {
      this.scene.remove(npc.chatLabel)
      npc.chatLabel = undefined
    }
    npc.chatLabel = this.makeTextSprite(`"${text}"`, '#7a7060', 4.0, 0.4)
    npc.chatLabel.position.set(npc.tx, 1.4, npc.ty)
    this.scene.add(npc.chatLabel)
    npc.chatFadeTimer = 5000
  }

  getNearestNPC(playerTX: number, playerTY: number, maxDist = 2.0): NPC | null {
    let nearest: NPC | null = null
    let minDist = maxDist
    for (const npc of this.npcs) {
      const d = Math.hypot(npc.tx - playerTX, npc.ty - playerTY)
      if (d < minDist) { minDist = d; nearest = npc }
    }
    return nearest
  }
}
