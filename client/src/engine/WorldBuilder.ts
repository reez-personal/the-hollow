import * as THREE from 'three'

export const MAP_W = 56
export const MAP_H = 56

type TileType = 'dark_grass' | 'grass' | 'dirt' | 'mud' | 'stone' | 'water'

interface BuildingDef {
  tx: number; ty: number; tw: number; td: number; th: number
  roofColor: number; wallR: number; wallL: number
  label?: string; chimney?: boolean; ruined?: boolean
}

const TILE_COLORS: Record<TileType, number[]> = {
  dark_grass: [0x0a1108, 0x0c1209, 0x0b1108],
  grass:      [0x121e0c, 0x142010, 0x12200e],
  dirt:       [0x1a1610, 0x1c1812, 0x1b1711],
  mud:        [0x100d08, 0x120e09, 0x110d08],
  stone:      [0x1c1c1c, 0x202020, 0x1a1a1a],
  water:      [0x050b11, 0x060e18, 0x050c15],
}

export class WorldBuilder {
  private scene: THREE.Scene
  private solidSet = new Set<string>()
  private grid: TileType[][] = []
  private waterTiles: { mesh: THREE.Mesh; tx: number; ty: number }[] = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
    for (let ty = 0; ty < MAP_H; ty++) {
      this.grid[ty] = []
      for (let tx = 0; tx < MAP_W; tx++) this.grid[ty][tx] = 'dark_grass'
    }
  }

  build() {
    this.buildGrid()
    this.buildGround()
    this.buildBuildings()
    this.buildTrees()
    this.buildProps()
  }

  isSolid(tx: number, ty: number) {
    return this.solidSet.has(`${Math.round(tx)},${Math.round(ty)}`)
  }

  updateWater(time: number) {
    for (const { mesh, tx, ty } of this.waterTiles) {
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (mat.map) {
        mat.map.offset.x = Math.sin(time * 0.4 + tx * 0.3) * 0.05
        mat.map.offset.y = Math.cos(time * 0.3 + ty * 0.4) * 0.05
      }
    }
  }

  private solid(tx: number, ty: number) { this.solidSet.add(`${tx},${ty}`) }

  private buildGrid() {
    for (let tx = 2; tx < MAP_W - 2; tx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const ty = 13 + dy
        if (ty >= 0 && ty < MAP_H) this.grid[ty][tx] = 'stone'
      }
    }
    for (let ty = 2; ty < MAP_H - 2; ty++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = 13 + dx
        if (tx >= 0 && tx < MAP_W) this.grid[ty][tx] = 'stone'
      }
    }
    for (let tx = 14; tx < MAP_W - 2; tx++) {
      for (let dy = -1; dy <= 0; dy++) {
        const ty = 25 + dy
        if (ty >= 0 && ty < MAP_H) this.grid[ty][tx] = 'stone'
      }
    }
    for (let ty = 13; ty < 45; ty++) {
      for (let dx = 0; dx <= 1; dx++) {
        const tx = 26 + dx
        if (tx >= 0 && tx < MAP_W) this.grid[ty][tx] = 'stone'
      }
    }
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) this.grid[13 + dy][13 + dx] = 'dirt'
    }
    for (let tx = 6; tx < 28; tx++) {
      if (this.grid[12][tx] === 'stone') this.grid[11][tx] = 'dirt'
      if (this.grid[14][tx] === 'stone') this.grid[15][tx] = 'dirt'
    }
    for (let ty = 9; ty < 30; ty++) {
      for (let tx = 28; tx < 50; tx++) {
        if (this.grid[ty][tx] === 'dark_grass') {
          const h = Math.abs(Math.sin(tx * 2.7 + ty * 1.9))
          if (h < 0.3) this.grid[ty][tx] = 'grass'
        }
      }
    }
    for (let ty = 6; ty < 28; ty++) {
      for (let tx = 4; tx < 26; tx++) {
        if (this.grid[ty][tx] === 'dark_grass') {
          const h = Math.abs(Math.sin(tx * 7.3 + ty * 3.1))
          if (h < 0.12) this.grid[ty][tx] = 'dirt'
          else if (h < 0.04) this.grid[ty][tx] = 'mud'
        }
      }
    }
    let creekX = 28
    for (let ty = 18; ty < 52; ty++) {
      const wobble = Math.round(Math.sin(ty * 0.4) * 1.5)
      creekX = Math.max(27, Math.min(32, creekX + wobble))
      for (let dx = 0; dx <= 1; dx++) {
        const tx = creekX + dx
        if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H) this.grid[ty][tx] = 'water'
      }
    }
    for (let ty = 0; ty < 6; ty++) {
      for (let tx = 0; tx < 6 - ty; tx++) this.grid[ty][tx] = 'water'
    }
    for (let ty = 48; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const h = Math.abs(Math.sin(tx * 1.3 + ty * 2.7))
        this.grid[ty][tx] = h < 0.5 ? 'water' : 'mud'
      }
    }
  }

  private buildGround() {
    const tileGeo = new THREE.PlaneGeometry(1, 1)
    tileGeo.rotateX(-Math.PI / 2)

    // Water material — reflective
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x060d18,
      metalness: 0.85,
      roughness: 0.15,
    })

    // Shared materials by tile type — colors are 3-4× brighter than "design"
    // so they remain visible under atmospheric dark lighting
    const mats: Record<TileType, THREE.Material> = {
      dark_grass: new THREE.MeshLambertMaterial({ color: 0x1e2e18 }),
      grass:      new THREE.MeshLambertMaterial({ color: 0x2a3e1e }),
      dirt:       new THREE.MeshLambertMaterial({ color: 0x3a3025 }),
      mud:        new THREE.MeshLambertMaterial({ color: 0x241e14 }),
      stone:      new THREE.MeshLambertMaterial({ color: 0x404040 }),
      water:      waterMat,
    }

    // Road texture — bake lane marks to canvas
    const roadCanvas = document.createElement('canvas')
    roadCanvas.width = 64; roadCanvas.height = 64
    const rCtx = roadCanvas.getContext('2d')!
    rCtx.fillStyle = '#404040'
    rCtx.fillRect(0, 0, 64, 64)
    rCtx.fillStyle = '#505050'
    rCtx.fillRect(0, 30, 64, 4)
    rCtx.fillStyle = '#363636'
    rCtx.fillRect(0, 0, 1, 64); rCtx.fillRect(63, 0, 1, 64)
    const roadTex = new THREE.CanvasTexture(roadCanvas)
    roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
    (mats.stone as THREE.MeshLambertMaterial).map = roadTex

    const dummy = new THREE.Object3D()
    const groups: Partial<Record<TileType, number[]>> = {}

    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const type = this.grid[ty][tx]
        if (!groups[type]) groups[type] = []
        groups[type]!.push(tx, ty)
      }
    }

    for (const [type, coords] of Object.entries(groups) as [TileType, number[]][]) {
      const count = coords.length / 2
      const inst = new THREE.InstancedMesh(tileGeo, mats[type], count)
      inst.receiveShadow = true
      inst.name = `tile_${type}`
      let i = 0
      for (let c = 0; c < coords.length; c += 2) {
        const tx = coords[c], ty = coords[c + 1]
        dummy.position.set(tx, -0.01, ty)
        dummy.updateMatrix()
        inst.setMatrixAt(i, dummy.matrix)
        if (type === 'water') {
          this.waterTiles.push({ mesh: inst as unknown as THREE.Mesh, tx, ty })
        }
        i++
      }
      inst.instanceMatrix.needsUpdate = true
      this.scene.add(inst)
    }
  }

  private buildBuildings() {
    const buildings: BuildingDef[] = [
      { tx: 4,  ty: 4,  tw: 3, td: 5, th: 9, roofColor: 0x1a1c20, wallR: 0x141618, wallL: 0x0e1012, label: 'Church' },
      { tx: 6,  ty: 7,  tw: 5, td: 4, th: 4, roofColor: 0x1c1810, wallR: 0x141208, wallL: 0x0e0c06, label: 'Diner' },
      { tx: 18, ty: 7,  tw: 4, td: 4, th: 4, roofColor: 0x1a1810, wallR: 0x141206, wallL: 0x100e04 },
      { tx: 16, ty: 3,  tw: 5, td: 5, th: 6, roofColor: 0x1c1c1c, wallR: 0x161616, wallL: 0x101010 },
      { tx: 24, ty: 5,  tw: 5, td: 5, th: 5, roofColor: 0x181818, wallR: 0x141414, wallL: 0x101010, chimney: true },
      { tx: 22, ty: 4,  tw: 3, td: 3, th: 3, roofColor: 0x161414, wallR: 0x121010, wallL: 0x0e0c0c },
      { tx: 32, ty: 5,  tw: 3, td: 3, th: 3, roofColor: 0x181410, wallR: 0x141008, wallL: 0x100c06 },
      { tx: 38, ty: 6,  tw: 3, td: 3, th: 3, roofColor: 0x141618, wallR: 0x101214, wallL: 0x0c0e10 },
      { tx: 44, ty: 5,  tw: 3, td: 3, th: 3, roofColor: 0x181610, wallR: 0x141208, wallL: 0x100e06 },
      { tx: 32, ty: 9,  tw: 4, td: 3, th: 3, roofColor: 0x141010, wallR: 0x100c08, wallL: 0x0c0a06, ruined: true },
      { tx: 44, ty: 2,  tw: 2, td: 3, th: 5, roofColor: 0x18181e, wallR: 0x141418, wallL: 0x0e0e12 },
      { tx: 6,  ty: 15, tw: 5, td: 6, th: 5, roofColor: 0x181614, wallR: 0x121210, wallL: 0x0e0e0c },
      { tx: 15, ty: 17, tw: 2, td: 3, th: 3, roofColor: 0x181614, wallR: 0x121210, wallL: 0x0e0e0c },
      { tx: 4,  ty: 17, tw: 3, td: 3, th: 3, roofColor: 0x181814, wallR: 0x141210, wallL: 0x101008 },
      { tx: 4,  ty: 22, tw: 3, td: 3, th: 3, roofColor: 0x161610, wallR: 0x121208, wallL: 0x0e0e06 },
      { tx: 8,  ty: 27, tw: 3, td: 3, th: 3, roofColor: 0x181414, wallR: 0x141010, wallL: 0x100c0c },
      { tx: 4,  ty: 30, tw: 3, td: 3, th: 3, roofColor: 0x181814, wallR: 0x141412, wallL: 0x101010 },
      { tx: 16, ty: 17, tw: 3, td: 3, th: 3, roofColor: 0x181410, wallR: 0x121008, wallL: 0x0e0c06 },
      { tx: 21, ty: 16, tw: 3, td: 3, th: 3, roofColor: 0x161414, wallR: 0x121010, wallL: 0x0e0c0c },
      { tx: 16, ty: 22, tw: 3, td: 3, th: 3, roofColor: 0x181818, wallR: 0x141414, wallL: 0x101010 },
      { tx: 21, ty: 22, tw: 3, td: 3, th: 3, roofColor: 0x181610, wallR: 0x141208, wallL: 0x100e06 },
      { tx: 16, ty: 28, tw: 3, td: 3, th: 3, roofColor: 0x161618, wallR: 0x121214, wallL: 0x0e0e10 },
      { tx: 21, ty: 28, tw: 3, td: 3, th: 3, roofColor: 0x181816, wallR: 0x141412, wallL: 0x101010 },
      { tx: 25, ty: 17, tw: 3, td: 3, th: 2, roofColor: 0x141010, wallR: 0x100c08, wallL: 0x0c0a06, ruined: true },
      { tx: 30, ty: 16, tw: 3, td: 3, th: 3, roofColor: 0x181410, wallR: 0x141008, wallL: 0x100c06 },
      { tx: 36, ty: 15, tw: 3, td: 3, th: 3, roofColor: 0x161614, wallR: 0x121210, wallL: 0x0e0e0c },
      { tx: 43, ty: 10, tw: 3, td: 3, th: 3, roofColor: 0x181614, wallR: 0x141210, wallL: 0x100e0c },
      { tx: 47, ty: 16, tw: 3, td: 3, th: 3, roofColor: 0x181418, wallR: 0x141014, wallL: 0x100c10 },
      { tx: 43, ty: 22, tw: 3, td: 3, th: 3, roofColor: 0x181810, wallR: 0x141408, wallL: 0x101006 },
      { tx: 40, ty: 19, tw: 6, td: 5, th: 3, roofColor: 0x141010, wallR: 0x100c08, wallL: 0x0c0a06, ruined: true },
      { tx: 35, ty: 28, tw: 5, td: 4, th: 6, roofColor: 0x1a1816, wallR: 0x141412, wallL: 0x101010, chimney: true },
      { tx: 8,  ty: 35, tw: 3, td: 3, th: 3, roofColor: 0x161814, wallR: 0x121410, wallL: 0x0e100c },
      { tx: 16, ty: 35, tw: 3, td: 3, th: 3, roofColor: 0x181614, wallR: 0x141210, wallL: 0x100e0c },
    ]

    for (const b of buildings) {
      this.addBuilding(b)
      for (let dy = 0; dy < b.td; dy++) {
        for (let dx = 0; dx < b.tw; dx++) this.solid(b.tx + dx, b.ty + dy)
      }
    }
  }

  private addBuilding(b: BuildingDef) {
    const heightY = b.th * 0.25
    const cx = b.tx + b.tw / 2
    const cz = b.ty + b.td / 2

    // BoxGeometry face material order: +X, -X, +Y, -Y, +Z, -Z
    // Camera at (+,+,+) → sees +X (east), +Y (roof), +Z (south)
    const opacity = b.ruined ? 0.88 : 1.0
    const mats = [
      new THREE.MeshLambertMaterial({ color: b.wallR }),     // east  (+X)
      new THREE.MeshLambertMaterial({ color: 0x060606 }),    // west  (-X)
      new THREE.MeshLambertMaterial({ color: b.roofColor }), // roof  (+Y)
      new THREE.MeshLambertMaterial({ color: 0x000000 }),    // floor (-Y)
      new THREE.MeshLambertMaterial({ color: b.wallL }),     // south (+Z)
      new THREE.MeshLambertMaterial({ color: 0x060606 }),    // north (-Z)
    ]

    const geo = new THREE.BoxGeometry(b.tw, heightY, b.td)
    const mesh = new THREE.Mesh(geo, mats)
    mesh.position.set(cx, heightY / 2, cz)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.scene.add(mesh)

    // Windows — south face (+Z), east face (+X)
    if (!b.ruined && b.th >= 3) {
      this.addWindows(mesh, b, heightY, cx, cz)
    }

    // Chimney
    if (b.chimney) {
      const chGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2)
      const chMat = new THREE.MeshLambertMaterial({ color: 0x1a1612 })
      const ch = new THREE.Mesh(chGeo, chMat)
      ch.position.set(cx + b.tw * 0.2, heightY + 0.3, cz - b.td * 0.2)
      ch.castShadow = true
      this.scene.add(ch)
    }

    // Church steeple
    if (b.th >= 8) {
      const stGeo = new THREE.ConeGeometry(Math.min(b.tw, b.td) * 0.4, heightY * 0.7, 4)
      const stMat = new THREE.MeshLambertMaterial({ color: b.roofColor })
      const st = new THREE.Mesh(stGeo, stMat)
      st.position.set(cx, heightY + heightY * 0.35, cz)
      st.castShadow = true
      this.scene.add(st)
    }

    // Labels
    if (b.label && !b.ruined) {
      this.addLabel(b.label, cx, heightY + 0.1, cz + b.td / 2 + 0.01)
    }
  }

  private addWindows(
    _parent: THREE.Mesh,
    b: BuildingDef,
    heightY: number,
    cx: number,
    cz: number,
  ) {
    const winMat = new THREE.MeshLambertMaterial({ color: 0x050810, emissive: 0x0a0c14 })
    const winH = Math.max(0.12, heightY * 0.35)
    const winW = 0.12

    // South face windows (along X axis)
    const southFaceZ = cz + b.td / 2
    const numSouth = Math.min(b.tw, 3)
    for (let i = 0; i < numSouth; i++) {
      const xPos = cx - b.tw / 2 + b.tw * ((i + 1) / (numSouth + 1))
      const wGeo = new THREE.BoxGeometry(winW, winH, 0.02)
      const w = new THREE.Mesh(wGeo, winMat)
      w.position.set(xPos, heightY * 0.55, southFaceZ + 0.01)
      this.scene.add(w)
    }

    // East face windows (along Z axis)
    const eastFaceX = cx + b.tw / 2
    const numEast = Math.min(b.td, 2)
    for (let i = 0; i < numEast; i++) {
      const zPos = cz - b.td / 2 + b.td * ((i + 1) / (numEast + 1))
      const wGeo = new THREE.BoxGeometry(0.02, winH, winW)
      const w = new THREE.Mesh(wGeo, winMat)
      w.position.set(eastFaceX + 0.01, heightY * 0.55, zPos)
      this.scene.add(w)
    }
  }

  private addLabel(text: string, x: number, y: number, z: number) {
    const canvas = document.createElement('canvas')
    canvas.width = 128; canvas.height = 32
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'rgba(0,0,0,0)'
    ctx.clearRect(0, 0, 128, 32)
    ctx.font = '10px monospace'
    ctx.fillStyle = '#4a4028'
    ctx.textAlign = 'center'
    ctx.fillText(text.toUpperCase(), 64, 20)
    const tex = new THREE.CanvasTexture(canvas)
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
    const sprite = new THREE.Sprite(mat)
    sprite.position.set(x, y + 0.15, z)
    sprite.scale.set(1.5, 0.4, 1)
    this.scene.add(sprite)
  }

  private buildTrees() {
    const positions: [number, number][] = [
      [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[0,1],[1,1],[2,1],[3,1],[4,1],
      [0,2],[1,2],[2,2],[3,2],[0,3],[1,3],[2,3],[0,4],[1,4],[0,5],[0,6],[0,7],
      [50,0],[51,0],[52,0],[53,0],[54,0],[55,0],[50,1],[51,1],[52,1],[53,1],[54,1],[55,1],
      [51,2],[52,2],[53,2],[54,2],[55,2],[52,3],[53,3],[54,3],[55,3],[53,4],[54,4],[55,4],
      [8,0],[9,0],[10,0],[11,0],[15,0],[16,0],[17,0],
      [22,0],[23,0],[24,0],[25,0],[26,0],[27,0],[28,0],[29,0],
      [34,0],[35,0],[36,0],[37,0],[38,0],[39,0],
      [43,0],[44,0],[45,0],[46,0],[47,0],[48,0],[49,0],
      [2,9],[3,10],[1,12],[2,16],[1,20],[3,25],[2,30],[1,35],[3,38],
      [11,2],[12,2],[13,2],[14,2],[15,2],[17,2],[19,2],[20,2],[21,2],
      [6,3],[7,3],[8,3],[29,3],[30,3],[31,3],[33,3],[34,3],[35,3],[36,3],
      [40,3],[41,3],[42,3],
      [2,27],[3,27],[1,33],[2,37],[3,42],
      [30,22],[31,24],[33,25],[29,30],[30,35],[31,38],
      [37,22],[38,25],[39,30],[40,35],[48,22],[49,25],
      [26,20],[26,22],[26,24],[26,26],[26,28],[33,20],[33,22],[33,25],
    ]

    // Shared geometry + material
    const trunkGeo = new THREE.CylinderGeometry(0.04, 0.07, 0.5, 5)
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x1a1008 })
    const canopyMats = [
      new THREE.MeshLambertMaterial({ color: 0x0a1308 }),
      new THREE.MeshLambertMaterial({ color: 0x0c1609 }),
      new THREE.MeshLambertMaterial({ color: 0x0e1a0a }),
    ]
    const canopyGeos = [
      new THREE.ConeGeometry(0.55, 0.9, 6),
      new THREE.ConeGeometry(0.42, 0.75, 6),
      new THREE.ConeGeometry(0.30, 0.60, 6),
    ]

    for (const [tx, ty] of positions) {
      if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) continue
      const x = tx, z = ty

      const trunk = new THREE.Mesh(trunkGeo, trunkMat)
      trunk.position.set(x, 0.25, z)
      trunk.castShadow = true
      this.scene.add(trunk)

      // 3 layered canopy cones
      const heights = [0.75, 1.05, 1.3]
      for (let c = 0; c < 3; c++) {
        const cone = new THREE.Mesh(canopyGeos[c], canopyMats[c])
        cone.position.set(x, heights[c], z)
        cone.castShadow = true
        this.scene.add(cone)
      }

      this.solid(tx, ty)
    }
  }

  private buildProps() {
    this.addWell(13, 11)
    this.solid(13, 11)

    this.addWaterTower(30, 6)
    this.solid(30, 6)
    this.solid(31, 6)

    // Cemetery fence + gravestones
    for (let tx = 42; tx <= 52; tx++) {
      this.addFencePost(tx, 1); this.addFencePost(tx, 12)
    }
    for (let ty = 1; ty <= 12; ty++) {
      this.addFencePost(41, ty); this.addFencePost(52, ty)
    }
    for (let i = 0; i < 12; i++) {
      const tx = 42 + (i % 4) * 2
      const ty = 2 + Math.floor(i / 4) * 3
      this.addGravestone(tx, ty)
      this.solid(tx, ty)
    }

    // Lamps
    for (const [tx, ty] of [[11,11],[15,11],[15,15],[11,15],[26,13],[26,25]] as [number,number][]) {
      this.addLamp(tx, ty)
    }

    // Barrels
    this.addBarrel(22, 12)
    this.addBarrel(23, 12)
  }

  private addWell(tx: number, ty: number) {
    // Stone ring
    const ringGeo = new THREE.TorusGeometry(0.45, 0.12, 6, 12)
    const ringMat = new THREE.MeshLambertMaterial({ color: 0x3a3830 })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2
    ring.position.set(tx, 0.12, ty)
    ring.castShadow = true
    this.scene.add(ring)

    // Dark interior
    const wellGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 10)
    const wellMat = new THREE.MeshLambertMaterial({ color: 0x030508 })
    const well = new THREE.Mesh(wellGeo, wellMat)
    well.position.set(tx, 0.12, ty)
    this.scene.add(well)

    // Posts + crossbeam
    const postMat = new THREE.MeshLambertMaterial({ color: 0x2a2010 })
    for (const [ox, oz] of [[-0.45, 0], [0.45, 0]] as [number,number][]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 5), postMat)
      p.position.set(tx + ox, 0.35, ty + oz)
      this.scene.add(p)
    }
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 5), postMat)
    beam.rotation.z = Math.PI / 2
    beam.position.set(tx, 0.7, ty)
    this.scene.add(beam)
  }

  private addWaterTower(tx: number, ty: number) {
    const legMat = new THREE.MeshLambertMaterial({ color: 0x181410 })
    const tankMat = new THREE.MeshLambertMaterial({ color: 0x1c1a16 })

    // 4 legs
    for (const [ox, oz] of [[-0.3,-0.3],[0.3,-0.3],[-0.3,0.3],[0.3,0.3]] as [number,number][]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.0, 5), legMat)
      leg.position.set(tx + ox, 1.0, ty + oz)
      this.scene.add(leg)
    }
    // Tank
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.4, 0.9, 10), tankMat)
    tank.position.set(tx, 2.45, ty)
    tank.castShadow = true
    this.scene.add(tank)
  }

  private addFencePost(tx: number, ty: number) {
    const mat = new THREE.MeshLambertMaterial({ color: 0x1a1610 })
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), mat)
    post.position.set(tx, 0.2, ty)
    this.scene.add(post)
  }

  private addGravestone(tx: number, ty: number) {
    const mat = new THREE.MeshLambertMaterial({ color: 0x1c1c1e })
    const stone = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 0.06), mat)
    stone.position.set(tx, 0.175, ty)
    stone.castShadow = true
    this.scene.add(stone)
  }

  private addLamp(tx: number, ty: number) {
    const postMat = new THREE.MeshLambertMaterial({ color: 0x1e1c18 })
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.4, 5), postMat)
    post.position.set(tx, 0.7, ty)
    this.scene.add(post)

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), new THREE.MeshLambertMaterial({ color: 0x302818 }))
    head.position.set(tx, 1.4, ty)
    this.scene.add(head)

    // Glow point light (small radius, warm)
    const glow = new THREE.PointLight(0xffcc66, 0.6, 3, 2)
    glow.position.set(tx, 1.4, ty)
    this.scene.add(glow)
  }

  private addBarrel(tx: number, ty: number) {
    const mat = new THREE.MeshLambertMaterial({ color: 0x1c1810 })
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.35, 8), mat)
    barrel.position.set(tx, 0.175, ty)
    barrel.castShadow = true
    this.scene.add(barrel)
  }
}
