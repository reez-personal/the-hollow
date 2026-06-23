import * as THREE from 'three'
import type { ThreeEngine } from './ThreeEngine'
import { ExamineUI } from '../ui/ExamineUI'
import { WorldState } from '../systems/WorldState'

export type RoomId = 'motel_room_3' | 'motel_room_1' | 'diner' | 'church' | 'general_store'

const SPEED        = 2.5
const INTERACT_DIST = 1.6
const FRUSTUM      = 9

interface ItemDef  { label: string; tx: number; ty: number; pages: string[] }
interface BoxDef   { tx: number; ty: number; tw: number; td: number; th: number; color: number }

interface RoomDef {
  title: string
  w: number; d: number; wallH: number
  wallColor: number; floorColor: number; ceilColor: number
  boxes: BoxDef[]
  items: ItemDef[]
  startTX: number; startTY: number
  questFlag?: string; questEvent?: string
  extraFlags?: Record<string, string>
}

const ROOMS: Record<RoomId, RoomDef> = {
  motel_room_3: {
    title: 'Room 3', w: 10, d: 8, wallH: 3,
    wallColor: 0x2a2420, floorColor: 0x221c18, ceilColor: 0x181410,
    boxes: [
      { tx: 1.5, ty: 0.8, tw: 4,   td: 2,   th: 0.6, color: 0x302820 },
      { tx: 8.2, ty: 1.5, tw: 0.8, td: 3,   th: 0.9, color: 0x2a2218 },
      { tx: 7.0, ty: 3.0, tw: 0.8, td: 0.8, th: 0.5, color: 0x221c14 },
      { tx: 0.5, ty: 0.8, tw: 0.9, td: 0.9, th: 0.6, color: 0x282018 },
    ],
    items: [
      { label: 'Notes pinned to the wall', tx: 4.5, ty: 0.5, pages: [
        'FIELD NOTES — D. FARROW\n\nDay 1: Town found. Population sign reads 32.\nCounted myself. There are 31 people here.\nSomeone is being counted that I cannot see.\n\nOr someone left while I was counting.',
        "Day 4: They all know my name.\nI didn't tell anyone my name.\n\nMaren called me by it when I walked in.\n'The usual, Daniel?' But I'd never been here.\n\nShe looked confused when I asked how she knew.",
        'Day 8: Found records in the town hall basement.\nEvery 31 years a new person arrives.\nThey stay for a season.\nThen the count goes back to 31.\n\nI asked Edmund what happened to them.\nHe started counting again from the beginning.',
        "Day 9: I know what I have to do.\nI know what they're waiting for.\n\nIf you're reading this:\nDon't let the count change.\nDon't become the 32nd.\n\n— D",
      ]},
      { label: 'Strip of photographs', tx: 8.5, ty: 1.5, pages: [
        "A strip of four photographs taken in a booth.\n\nIn the first three, Daniel is grinning.\nPointing at something off-frame.\nLooking pleased with himself.\n\nIn the fourth photograph, he is looking directly at the camera.\nHe is not smiling.\nHe is mouthing something.",
        "You study the shape of his lips in the fourth photo.\n\nTwo words.\n\n'Run now.'",
      ]},
      { label: 'Under the bed', tx: 2, ty: 2.5, pages: [
        'You reach under the bed.\n\nA hardcover notebook, spiral-bound.\nWater-damaged. The cover reads:\n\n  31 → 32 → 31\n  IT CHOSE ME\n  it chose me\n  it chose me',
        "'I was not the 32nd. I was the door.'\n\nOver and over.\nForty-seven pages.",
      ]},
      { label: 'The cracked window', tx: 9.4, ty: 4.5, pages: [
        'The crack runs from the bottom-left corner to the top-right.\n\nNot a break from impact.\nSomething pushed outward from inside.\n\nThe frame is bent the wrong way.',
        'There are finger marks in the dust on the sill.\nSmudged. Pointing out.\n\nOr clinging on.',
      ]},
      { label: 'Wall above the desk', tx: 8.5, ty: 3.0, pages: [
        "Daniel covered the wall with photographs, notes, string.\n\nEverything connects to a circle in red pen:\n\n  'THE WELL'\n\n'It is not a well. It has always been a mouth.'",
        "One photo shows Ashveil from above.\nThe streets form a shape you didn't notice before.\n\nYou are not standing in a town.\n\nYou are standing in a letter.",
      ]},
    ],
    startTX: 5, startTY: 7,
    questFlag: 'clue_daniel_notes',
    questEvent: "Player searched Room 3. Found Daniel Farrow's notes.",
  },

  motel_room_1: {
    title: 'Room 1 — Yours', w: 8, d: 7, wallH: 3,
    wallColor: 0x262018, floorColor: 0x1e1a14, ceilColor: 0x141210,
    boxes: [
      { tx: 1.0, ty: 0.8, tw: 3.5, td: 2,   th: 0.6, color: 0x2e2620 },
      { tx: 5.2, ty: 0.8, tw: 0.9, td: 0.9, th: 0.6, color: 0x261e18 },
      { tx: 6.5, ty: 5.5, tw: 0.4, td: 0.4, th: 1.6, color: 0x1e1812 },
    ],
    items: [
      { label: 'Nightstand drawer', tx: 5.5, ty: 1.2, pages: [
        "You almost didn't open it.\n\nA wallet. Worn brown leather.\nYour name is on the ID inside.\n\nEli Cross. Your photograph. Your face.\n\nBut the name on the motel register below is Daniel Farrow.\n\nAnd you know what Daniel Farrow looks like.\n\nYou've been looking at his face all week.",
        "There is a note folded behind the ID.\n\nIn your handwriting.\n\n'You'll remember eventually. You always do.\nThis time, try to remember sooner.\n\nThe well is due. You know where it is.\nYou've been there before.\n\n— You.'",
      ]},
      { label: 'Your coat', tx: 6.5, ty: 5.5, pages: [
        "A coat hanging on the hook.\n\nHeavy. Dark. You've been wearing it this whole time.\n\nIn the inner pocket: a matchbook.\n\nA phone number is written inside in pencil.\nThe handwriting is yours.\n\nYou don't remember writing it.",
      ]},
      { label: 'The mirror', tx: 0.3, ty: 3.5, pages: [
        "You look at yourself for a long time.\n\nYou don't look like someone who just arrived.\n\nYou look like someone who has been here a long time\nand forgotten they were ever anywhere else.",
      ]},
    ],
    startTX: 4, startTY: 6,
    questFlag: 'wallet_found',
    questEvent: 'Player found the wallet in Room 1. Identity revealed.',
    extraFlags: { matchbook_found: 'true' },
  },

  diner: {
    title: 'Ashveil Diner', w: 14, d: 9, wallH: 3,
    wallColor: 0x28221a, floorColor: 0x201a12, ceilColor: 0x141008,
    boxes: [
      { tx: 10.5, ty: 0.8, tw: 3,   td: 7,   th: 1.0, color: 0x342a20 },
      { tx: 1,    ty: 1.5, tw: 3,   td: 1.5, th: 0.9, color: 0x2a2018 },
      { tx: 1,    ty: 3.5, tw: 3,   td: 1.5, th: 0.9, color: 0x2a2018 },
      { tx: 1,    ty: 5.5, tw: 3,   td: 1.5, th: 0.9, color: 0x2a2018 },
      { tx: 5.5,  ty: 2,   tw: 1.2, td: 1.2, th: 0.8, color: 0x261e14 },
      { tx: 7.5,  ty: 5,   tw: 1.2, td: 1.2, th: 0.8, color: 0x261e14 },
    ],
    items: [
      { label: 'Receipt under the cup', tx: 11.5, ty: 3, pages: [
        'A paper receipt, face-down.\n\nYou turn it over.\n\nDate: November 3rd.\nOrder: The Usual.\nCustomer name: DANIEL / ELI / DANIEL\n\nThe name has been written and crossed out twice.',
      ]},
      { label: 'The coffee pot', tx: 11, ty: 1, pages: [
        "Still warm.\n\nIt's been warm every time you've come in.\n\nYou think about asking Maren how long it's been on.\n\nYou decide not to.",
      ]},
      { label: 'Far booth', tx: 1.5, ty: 5.5, pages: [
        "The booth in the far corner.\n\nSomeone sat here for a long time.\nThe vinyl is worn through on one side.\n\nThere are scratch marks on the table.\nLetters: D F.\n\nUnder that, smaller: E C.\n\nUnder that, smaller still: someone else entirely.",
      ]},
    ],
    startTX: 7, startTY: 8,
  },

  church: {
    title: 'The Church', w: 10, d: 14, wallH: 5,
    wallColor: 0x201e22, floorColor: 0x181618, ceilColor: 0x0e0c10,
    boxes: [
      { tx: 0.8, ty: 2,  tw: 3.5, td: 0.7, th: 0.9, color: 0x201a20 },
      { tx: 5.7, ty: 2,  tw: 3.5, td: 0.7, th: 0.9, color: 0x201a20 },
      { tx: 0.8, ty: 4,  tw: 3.5, td: 0.7, th: 0.9, color: 0x201a20 },
      { tx: 5.7, ty: 4,  tw: 3.5, td: 0.7, th: 0.9, color: 0x201a20 },
      { tx: 0.8, ty: 6,  tw: 3.5, td: 0.7, th: 0.9, color: 0x201a20 },
      { tx: 5.7, ty: 6,  tw: 3.5, td: 0.7, th: 0.9, color: 0x201a20 },
      { tx: 0.8, ty: 8,  tw: 3.5, td: 0.7, th: 0.9, color: 0x201a20 },
      { tx: 5.7, ty: 8,  tw: 3.5, td: 0.7, th: 0.9, color: 0x201a20 },
      { tx: 3.5, ty: 0.3, tw: 3, td: 1.5, th: 1.3, color: 0x282228 },
      { tx: 0,   ty: 3,  tw: 0.9, td: 2.5, th: 2.5, color: 0x1c181c },
    ],
    items: [
      { label: 'Open Bible', tx: 5, ty: 0.8, pages: [
        "Left open to a passage underlined in red:\n\n'And the number of them was thirty and two.'\n\nBelow that, handwritten in the margin:\n\n'32 enters. 32 is kept. 31 remains.'",
      ]},
      { label: 'The confessional', tx: 0.5, ty: 4.5, pages: [
        "You open the door.\n\nSomething is written on the inside wall.\n\nThe same phrase, in six different handwritings:\n\n'I AM NOT THE FIRST.'",
      ]},
      { label: 'Tally marks on the pew', tx: 2, ty: 8.5, pages: [
        "Carved into the back of the last pew.\n\nTally marks.\nGroup after group of five.\n\nYou count them.\n\nThirty-one groups.\nThe thirty-second mark is a question.",
      ]},
    ],
    startTX: 5, startTY: 13,
  },

  general_store: {
    title: 'General Store', w: 12, d: 8, wallH: 3,
    wallColor: 0x28221a, floorColor: 0x201c14, ceilColor: 0x14100c,
    boxes: [
      { tx: 9,   ty: 0.8, tw: 2,   td: 5,   th: 1.0, color: 0x342a1e },
      { tx: 0.2, ty: 0.8, tw: 0.3, td: 6,   th: 2.0, color: 0x2a2218 },
      { tx: 4,   ty: 1.5, tw: 0.3, td: 5,   th: 1.8, color: 0x261e14 },
      { tx: 10.8,ty: 1.5, tw: 0.5, td: 3,   th: 2.0, color: 0x201c14 },
    ],
    items: [
      { label: 'Locked cabinet', tx: 11, ty: 3, pages: [
        "A cabinet behind the counter.\n\nYou can see through the glass:\n\nBoxes, each labeled with a number and a name.\n\nARRIVAL KIT #32 — ELI CROSS\n\nIt was already there when you arrived.",
      ]},
      { label: 'Inventory list', tx: 9.5, ty: 1, pages: [
        'Handwritten list near the register.\n\nApples: 7\nCandles: 31\nDays remaining: 12\nThose who stayed: 6\nThose who are staying: 1',
      ]},
      { label: 'Wall calendar', tx: 0.4, ty: 3, pages: [
        "A calendar pinned to the wall.\n\nEvery day has been crossed out except today.\n\nToday's date is circled in red.\n\nIn the margin, someone has written:\n\n'The last one always stays.'",
      ]},
    ],
    startTX: 6, startTY: 7,
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTextSprite(text: string, color: string, w: number, h: number): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 32
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 256, 32)
  ctx.font = 'bold 14px monospace'
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.fillText(text, 128, 22)
  const tex = new THREE.CanvasTexture(canvas)
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, sizeAttenuation: true })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(w, h, 1)
  return sprite
}

function makePlayerSprite(): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 24; canvas.height = 40
  const ctx = canvas.getContext('2d')!
  const cx = 12
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.beginPath(); ctx.ellipse(cx, 38, 6, 2, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#2a2218'
  ctx.fillRect(cx - 5, 15, 10, 15); ctx.fillRect(cx - 6, 19, 12, 10)
  ctx.fillStyle = '#1a1610'
  ctx.fillRect(cx - 5, 25, 10, 3)
  ctx.fillStyle = '#221e16'
  ctx.fillRect(cx - 8, 16, 3, 11); ctx.fillRect(cx + 5, 16, 3, 11)
  ctx.fillStyle = '#1a1812'
  ctx.fillRect(cx - 5, 30, 4, 7); ctx.fillRect(cx + 1, 30, 4, 7)
  ctx.fillStyle = '#0e0c0a'
  ctx.fillRect(cx - 5, 35, 5, 4); ctx.fillRect(cx + 1, 35, 5, 4)
  ctx.fillStyle = '#4a3c2e'
  ctx.beginPath(); ctx.arc(cx, 9, 5, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#1e1c14'
  ctx.fillRect(cx - 7, 4, 14, 3); ctx.fillRect(cx - 5, 1, 10, 6)
  const tex = new THREE.CanvasTexture(canvas)
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, sizeAttenuation: true })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(0.55, 0.9, 1)
  return sprite
}

// ─── RoomController ───────────────────────────────────────────────────────────

interface LiveItem {
  def: ItemDef
  marker: THREE.Mesh
  label: THREE.Sprite
  indicator: THREE.Sprite
}

export class RoomController {
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private lantern: THREE.PointLight

  private playerSprite: THREE.Sprite
  tx: number
  ty: number

  private heldKeys = new Set<string>()
  private _ePressed = false
  private _exitPressed = false

  private liveItems: LiveItem[] = []
  private examine = new ExamineUI()
  private worldState = WorldState.getInstance()
  private blocked = false

  private roomDef: RoomDef
  private exitLabel: HTMLDivElement
  private titleLabel: HTMLDivElement

  private renderer: THREE.WebGLRenderer
  private onExitCb: () => void
  private keydownHandler: (e: KeyboardEvent) => void
  private keyupHandler: (e: KeyboardEvent) => void

  constructor(
    renderer: THREE.WebGLRenderer,
    roomId: RoomId,
    onExit: () => void,
  ) {
    this.renderer = renderer
    this.onExitCb = onExit
    this.roomDef = ROOMS[roomId]
    const def = this.roomDef

    this.tx = def.startTX
    this.ty = def.startTY

    // Apply quest flags
    if (def.questFlag)  void this.worldState.setFlag(def.questFlag, 'true')
    if (def.questEvent) void this.worldState.logEvent(def.questEvent)
    if (def.extraFlags) {
      for (const [k, v] of Object.entries(def.extraFlags)) void this.worldState.setFlag(k, v)
    }

    // Scene
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x010206, 0.08)

    // Lights
    this.scene.add(new THREE.AmbientLight(0x0d1018, 2.0))
    const moon = new THREE.DirectionalLight(0x7080a0, 1.0)
    moon.position.set(-5, 10, -5)
    this.scene.add(moon)
    this.lantern = new THREE.PointLight(0xff9933, 4.0, 10, 1.5)
    this.scene.add(this.lantern)

    // Camera
    const aspect = window.innerWidth / window.innerHeight
    const f = FRUSTUM
    this.camera = new THREE.OrthographicCamera(-f * aspect / 2, f * aspect / 2, f / 2, -f / 2, 0.1, 200)

    // Build room
    this.buildRoom(def)

    // Player
    this.playerSprite = makePlayerSprite()
    this.scene.add(this.playerSprite)

    // HUD labels
    this.exitLabel = this.makeHUDLabel('[F / Esc]  Leave', 'bottom')
    this.titleLabel = this.makeHUDLabel(def.title.toUpperCase(), 'top')

    // Keys
    this.keydownHandler = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLInputElement) return
      const k = e.key.toLowerCase()
      this.heldKeys.add(k)
      if (k === 'e') { this._ePressed = true; e.preventDefault() }
      if (k === 'f' || k === 'escape') { this._exitPressed = true; e.preventDefault() }
      if (['arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault()
    }
    this.keyupHandler = (e: KeyboardEvent) => this.heldKeys.delete(e.key.toLowerCase())
    window.addEventListener('keydown', this.keydownHandler)
    window.addEventListener('keyup',   this.keyupHandler)
  }

  // ─── Build ──────────────────────────────────────────────────────────────────

  private buildRoom(def: RoomDef) {
    const { w, d, wallH, wallColor, floorColor, ceilColor } = def

    const floorMat  = new THREE.MeshLambertMaterial({ color: floorColor, side: THREE.FrontSide })
    const wallMat   = new THREE.MeshLambertMaterial({ color: wallColor,  side: THREE.FrontSide })
    const ceilMat   = new THREE.MeshLambertMaterial({ color: ceilColor,  side: THREE.FrontSide })

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(w / 2, 0, d / 2)
    this.scene.add(floor)

    // Ceiling
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilMat)
    ceil.rotation.x = Math.PI / 2
    ceil.position.set(w / 2, wallH, d / 2)
    this.scene.add(ceil)

    // Walls
    const walls = [
      // North (ty=0)
      { geo: new THREE.PlaneGeometry(w, wallH),  pos: new THREE.Vector3(w/2, wallH/2, 0),        rot: [0, 0, 0] as [number,number,number] },
      // South (ty=d) — door gap in center
      { geo: new THREE.PlaneGeometry(w/2-0.6, wallH), pos: new THREE.Vector3(w/4*0.5-0.15+0.3, wallH/2, d), rot: [0, Math.PI, 0] as [number,number,number] },
      { geo: new THREE.PlaneGeometry(w/2-0.6, wallH), pos: new THREE.Vector3(w-w/4*0.5+0.15-0.3, wallH/2, d), rot: [0, Math.PI, 0] as [number,number,number] },
      // West (tx=0)
      { geo: new THREE.PlaneGeometry(d, wallH),  pos: new THREE.Vector3(0, wallH/2, d/2),        rot: [0, Math.PI/2, 0] as [number,number,number] },
      // East (tx=w)
      { geo: new THREE.PlaneGeometry(d, wallH),  pos: new THREE.Vector3(w, wallH/2, d/2),        rot: [0, -Math.PI/2, 0] as [number,number,number] },
    ]
    for (const wall of walls) {
      const mesh = new THREE.Mesh(wall.geo, wallMat)
      mesh.position.copy(wall.pos)
      const [rx, ry, rz] = wall.rot
      mesh.rotation.set(rx, ry, rz)
      this.scene.add(mesh)
    }

    // Furniture boxes
    for (const box of def.boxes) {
      const geo = new THREE.BoxGeometry(box.tw, box.th, box.td)
      const mat = new THREE.MeshLambertMaterial({ color: box.color })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(box.tx + box.tw / 2, box.th / 2, box.ty + box.td / 2)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.scene.add(mesh)
    }

    // Items
    for (const item of def.items) {
      // Glowing marker cube
      const markerMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a08, emissive: 0x2a2010, emissiveIntensity: 0.6,
        roughness: 1, metalness: 0,
      })
      const marker = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), markerMat)
      marker.position.set(item.tx, 0.9, item.ty)
      this.scene.add(marker)

      const label = makeTextSprite(`[E]  ${item.label}`, '#7a7060', 3.5, 0.45)
      label.position.set(item.tx, 1.3, item.ty)
      label.visible = false
      this.scene.add(label)

      const indicator = makeTextSprite('[E]', '#aaa898', 0.8, 0.28)
      indicator.position.set(item.tx, 1.1, item.ty)
      indicator.visible = false
      this.scene.add(indicator)

      this.liveItems.push({ def: item, marker, label, indicator })
    }
  }

  // ─── HUD ────────────────────────────────────────────────────────────────────

  private makeHUDLabel(text: string, pos: 'top' | 'bottom'): HTMLDivElement {
    const el = document.createElement('div')
    Object.assign(el.style, {
      position: 'fixed',
      [pos]: '18px',
      left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: 'monospace',
      fontSize: pos === 'top' ? '10px' : '9px',
      letterSpacing: '3px',
      color: pos === 'top' ? '#4a4840' : '#333330',
      pointerEvents: 'none',
      zIndex: '400',
      whiteSpace: 'nowrap',
    })
    el.textContent = text
    document.body.appendChild(el)
    return el
  }

  // ─── Update ─────────────────────────────────────────────────────────────────

  update(delta: number) {
    if (this.blocked) return

    // Exit check
    if (this._exitPressed) {
      this._exitPressed = false
      this.dispose()
      return
    }

    // E — examine nearest item
    if (this._ePressed) {
      this._ePressed = false
      let nearest: LiveItem | null = null
      let minD = INTERACT_DIST
      for (const item of this.liveItems) {
        const d = Math.hypot(item.def.tx - this.tx, item.def.ty - this.ty)
        if (d < minD) { minD = d; nearest = item }
      }
      if (nearest) {
        this.blocked = true
        this.examine.open(nearest.def.pages, () => { this.blocked = false })
        return
      }
    }

    // Movement
    const dt = delta / 1000
    const left  = this.heldKeys.has('a') || this.heldKeys.has('arrowleft')
    const right = this.heldKeys.has('d') || this.heldKeys.has('arrowright')
    const up    = this.heldKeys.has('w') || this.heldKeys.has('arrowup')
    const down  = this.heldKeys.has('s') || this.heldKeys.has('arrowdown')
    let dtx = 0, dty = 0
    if (left)  dtx -= SPEED * dt
    if (right) dtx += SPEED * dt
    if (up)    dty -= SPEED * dt
    if (down)  dty += SPEED * dt
    if (dtx && dty) { dtx *= 0.707; dty *= 0.707 }

    const { w, d } = this.roomDef
    this.tx = Math.max(0.4, Math.min(w - 0.4, this.tx + dtx))
    this.ty = Math.max(0.4, Math.min(d - 0.4, this.ty + dty))

    // Player sprite
    this.playerSprite.position.set(this.tx, 0.55, this.ty)

    // Camera — same isometric offset as world
    const o = 11
    this.camera.position.set(this.tx + o, o, this.ty + o)
    this.camera.lookAt(this.tx, 0, this.ty)

    // Lantern
    this.lantern.position.set(this.tx, 1.4, this.ty)

    // Item label visibility
    for (const item of this.liveItems) {
      const dist = Math.hypot(item.def.tx - this.tx, item.def.ty - this.ty)
      const inRange = dist < INTERACT_DIST
      item.indicator.visible = inRange
      item.label.visible = dist < 3.5
      item.label.position.set(item.def.tx, 1.3, item.def.ty)
      item.indicator.position.set(item.def.tx, 1.1, item.def.ty)
      // Pulse glow when in range
      const mat = item.marker.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = inRange ? 1.2 : 0.6
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────────

  dispose() {
    window.removeEventListener('keydown', this.keydownHandler)
    window.removeEventListener('keyup',   this.keyupHandler)
    this.examine.close()
    this.exitLabel.remove()
    this.titleLabel.remove()
    // Dispose Three.js objects
    this.scene.traverse(obj => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose())
        } else {
          (obj.material as THREE.Material).dispose()
        }
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose()
      }
    })
    this.onExitCb()
  }
}
