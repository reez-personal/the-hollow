import * as THREE from 'three'

export class ThreeEngine {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  lantern: THREE.PointLight

  private readonly FRUSTUM = 13  // tiles visible vertically

  constructor(container: HTMLElement) {
    const w = window.innerWidth
    const h = window.innerHeight

    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
    this.renderer.setSize(w, h)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.setClearColor(0x010206)
    this.renderer.toneMapping = THREE.ReinhardToneMapping
    this.renderer.toneMappingExposure = 1.6   // was 0.7 — needed to make dark tiles visible
    container.appendChild(this.renderer.domElement)
    this.renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;'

    this.scene = new THREE.Scene()
    // Camera sits ~29 units from the ground. FogExp2(0.055) = 80% fog at that distance.
    // Drop density to 0.010 so only distant world edges fade to black.
    this.scene.fog = new THREE.FogExp2(0x010206, 0.010)

    const aspect = w / h
    const f = this.FRUSTUM
    this.camera = new THREE.OrthographicCamera(-f * aspect / 2, f * aspect / 2, f / 2, -f / 2, 0.1, 600)

    this.lantern = new THREE.PointLight(0xff9933, 0, 0)
    this.scene.add(this.lantern)

    this.setupLights()
    window.addEventListener('resize', () => this.onResize())
  }

  private setupLights() {
    // Dim blue-gray ambient — dark but not invisible
    this.scene.add(new THREE.AmbientLight(0x253040, 2.5))

    // Cold moonlight
    const moon = new THREE.DirectionalLight(0x9ab0d0, 2.2)
    moon.position.set(-10, 16, -10)
    moon.castShadow = true
    moon.shadow.mapSize.set(2048, 2048)
    moon.shadow.bias = -0.001
    const sc = moon.shadow.camera as THREE.OrthographicCamera
    sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40
    sc.near = 1; sc.far = 100
    this.scene.add(moon)

    // Warm fill — opposite side
    const fill = new THREE.DirectionalLight(0x3a2010, 0.4)
    fill.position.set(6, 4, 8)
    this.scene.add(fill)
  }

  setCameraTarget(tx: number, ty: number) {
    const o = 17
    this.camera.position.set(tx + o, o, ty + o)
    this.camera.lookAt(tx, 0, ty)
  }

  setLantern(tx: number, ty: number, intensity = 3.5) {
    this.lantern.position.set(tx, 1.4, ty)
    this.lantern.intensity = intensity
    this.lantern.distance = 12
    this.lantern.decay = 1.5
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  private onResize() {
    const w = window.innerWidth, h = window.innerHeight
    const aspect = w / h
    const f = this.FRUSTUM
    this.camera.left = -f * aspect / 2; this.camera.right = f * aspect / 2
    this.camera.top = f / 2; this.camera.bottom = -f / 2
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }
}
