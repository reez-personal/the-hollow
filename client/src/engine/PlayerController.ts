import * as THREE from 'three'
import { MAP_W, MAP_H } from './WorldBuilder'

const PLAYER_SPEED = 2.8  // tiles/sec

export class PlayerController {
  tx = 13.5
  ty = 16.0

  private sprite!: THREE.Sprite
  private scene: THREE.Scene
  private solidFn: (tx: number, ty: number) => boolean

  private heldKeys = new Set<string>()
  private _eJustPressed = false
  private _fJustPressed = false

  get eJustPressed() { const v = this._eJustPressed; this._eJustPressed = false; return v }
  get fJustPressed() { const v = this._fJustPressed; this._fJustPressed = false; return v }

  // Last movement direction for NPC proximity check
  facing: 'down' | 'up' | 'left' | 'right' = 'down'
  isMoving = false

  constructor(scene: THREE.Scene, solidFn: (tx: number, ty: number) => boolean) {
    this.scene = scene
    this.solidFn = solidFn
    this.createSprite()
    this.setupKeys()
  }

  private createSprite() {
    const canvas = document.createElement('canvas')
    canvas.width = 24; canvas.height = 40
    const ctx = canvas.getContext('2d')!
    this.drawCharacter(ctx, 24, 40)
    const tex = new THREE.CanvasTexture(canvas)
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, sizeAttenuation: true })
    this.sprite = new THREE.Sprite(mat)
    this.sprite.scale.set(0.55, 0.9, 1)
    this.sprite.castShadow = false
    this.scene.add(this.sprite)
    this.updateSpritePos()
  }

  private drawCharacter(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.clearRect(0, 0, w, h)
    const cx = w / 2

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.beginPath(); ctx.ellipse(cx, h - 2, 6, 2, 0, 0, Math.PI * 2); ctx.fill()

    // Coat / body
    ctx.fillStyle = '#2a2218'
    ctx.fillRect(cx - 5, h * 0.38, 10, h * 0.38)
    ctx.fillRect(cx - 6, h * 0.48, 12, h * 0.25)

    // Belt
    ctx.fillStyle = '#1a1610'
    ctx.fillRect(cx - 5, h * 0.62, 10, 3)

    // Arms
    ctx.fillStyle = '#221e16'
    ctx.fillRect(cx - 8, h * 0.40, 3, h * 0.28)
    ctx.fillRect(cx + 5, h * 0.40, 3, h * 0.28)

    // Legs
    ctx.fillStyle = '#1a1812'
    ctx.fillRect(cx - 5, h * 0.74, 4, h * 0.18)
    ctx.fillRect(cx + 1, h * 0.74, 4, h * 0.18)

    // Boots
    ctx.fillStyle = '#0e0c0a'
    ctx.fillRect(cx - 5, h * 0.88, 5, h * 0.10)
    ctx.fillRect(cx + 1, h * 0.88, 5, h * 0.10)

    // Head
    ctx.fillStyle = '#4a3c2e'
    ctx.beginPath(); ctx.arc(cx, h * 0.22, 5, 0, Math.PI * 2); ctx.fill()

    // Hat
    ctx.fillStyle = '#1e1c14'
    ctx.fillRect(cx - 7, h * 0.10, 14, 3)
    ctx.fillRect(cx - 5, h * 0.04, 10, 6)

    // Eyes
    ctx.fillStyle = '#0a0808'
    ctx.fillRect(cx - 3, h * 0.20, 2, 2)
    ctx.fillRect(cx + 1, h * 0.20, 2, 2)
  }

  private setupKeys() {
    const onDown = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLInputElement) return
      this.heldKeys.add(e.key.toLowerCase())
      if (e.key.toLowerCase() === 'e') { this._eJustPressed = true; e.preventDefault() }
      if (e.key.toLowerCase() === 'f') { this._fJustPressed = true; e.preventDefault() }
      if (['arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) e.preventDefault()
    }
    const onUp = (e: KeyboardEvent) => this.heldKeys.delete(e.key.toLowerCase())
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
  }

  isKeyHeld(key: string) { return this.heldKeys.has(key.toLowerCase()) }

  update(delta: number) {
    const dt = delta / 1000
    const spd = PLAYER_SPEED

    const left  = this.heldKeys.has('a') || this.heldKeys.has('arrowleft')
    const right = this.heldKeys.has('d') || this.heldKeys.has('arrowright')
    const up    = this.heldKeys.has('w') || this.heldKeys.has('arrowup')
    const down  = this.heldKeys.has('s') || this.heldKeys.has('arrowdown')

    let dtx = 0, dty = 0
    if (left)  dtx -= spd * dt
    if (right) dtx += spd * dt
    if (up)    dty -= spd * dt
    if (down)  dty += spd * dt

    this.isMoving = dtx !== 0 || dty !== 0

    if (dtx !== 0 && dty !== 0) { dtx *= 0.707; dty *= 0.707 }

    // Determine facing
    if (up)    this.facing = 'up'
    if (down)  this.facing = 'down'
    if (left)  this.facing = 'left'
    if (right) this.facing = 'right'

    const newTX = Math.max(0.5, Math.min(MAP_W - 1.5, this.tx + dtx))
    const newTY = Math.max(0.5, Math.min(MAP_H - 1.5, this.ty + dty))

    if (!this.solidFn(Math.round(newTX), Math.round(this.ty))) this.tx = newTX
    if (!this.solidFn(Math.round(this.tx), Math.round(newTY))) this.ty = newTY

    this.updateSpritePos()
  }

  private updateSpritePos() {
    this.sprite.position.set(this.tx, 0.55, this.ty)
  }

  setInputEnabled(enabled: boolean) {
    if (!enabled) this.heldKeys.clear()
  }

  getPosition(): THREE.Vector3 {
    return new THREE.Vector3(this.tx, 0, this.ty)
  }
}
