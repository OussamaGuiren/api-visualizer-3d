import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js'
import gsap from 'gsap'
import { geojsonToShapes, project, type FeatureCollection } from './projection'
import { COLORS, SCENE, colorFor } from './palette'
import type { DeptCode } from '~/types/departements'

export interface HoverPayload {
  code: DeptCode
  /** Position du pointeur relative au conteneur (px). */
  x: number
  y: number
}

export interface FranceMapEvents {
  onHover?: (payload: HoverPayload | null) => void
  onSelect?: (code: DeptCode | null) => void
}

/** Valeur normalisée d'un département pour la métrique courante. */
export interface DeptValue {
  /** t ∈ [0,1] : pilote la couleur. */
  t: number
  /** h ∈ [0,1] : pilote la hauteur d'extrusion. */
  h: number
}

type VisualState = 'idle' | 'hover' | 'selected' | 'mate'

interface DeptMesh extends THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> {
  userData: { code: DeptCode; nom: string; center: THREE.Vector3; baseColor: THREE.Color }
}

const HEIGHT_MIN = 2
const HEIGHT_MAX = 42
const PLINTH_DEPTH = 4
const LIFT: Record<VisualState, number> = { idle: 0, mate: 0, hover: 1.5, selected: 4 }
const CLICK_TOLERANCE_PX = 6
const FLY_DISTANCE = 170
/** Nombre d'étiquettes affichées en vue éloignée. */
const LABELS_FAR = 12
/** En deçà de cette distance caméra, toutes les étiquettes sont affichées. */
const LABELS_NEAR_DISTANCE = 330
/** Distance minimale (unités scène) entre deux étiquettes en vue éloignée. */
const LABELS_MIN_GAP = 28

/**
 * Carte 3D extrudée des départements. Indépendante de Vue : le composant
 * `FranceMap.vue` l'instancie, lui pousse les valeurs et écoute ses événements.
 */
export class FranceMap {
  private readonly scene = new THREE.Scene()
  private readonly camera: THREE.PerspectiveCamera
  private readonly renderer: THREE.WebGLRenderer
  private readonly controls: OrbitControls
  private readonly keyLight: THREE.DirectionalLight
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private readonly resizeObserver: ResizeObserver
  private readonly abort = new AbortController()

  private readonly labelRenderer: CSS2DRenderer
  private readonly labels = new Map<DeptCode, CSS2DObject>()
  /** Codes dont l'étiquette reste visible même en vue éloignée. */
  private priority = new Set<DeptCode>()
  private readonly offset = new THREE.Vector2()

  private readonly depts = new Map<DeptCode, DeptMesh>()
  private readonly meshes: DeptMesh[] = []
  private readonly group = new THREE.Group()
  private bounds = new THREE.Box3()

  private hovered: DeptMesh | null = null
  private selected: DeptMesh | null = null
  private regionMates = new Set<DeptCode>()
  private pointerDirty = false
  private pointerDown: { x: number; y: number } | null = null
  private frame = 0
  private disposed = false

  constructor(
    private readonly container: HTMLElement,
    private readonly events: FranceMapEvents = {},
  ) {
    const { clientWidth: width, clientHeight: height } = container

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.setSize(width, height)
    this.renderer.setClearColor(0x000000, 0)
    // Neutral préserve les teintes saturées de la palette, là où ACES les délave.
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.toneMappingExposure = SCENE.exposure
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.style.touchAction = 'none'
    this.renderer.domElement.style.cursor = 'grab'
    container.appendChild(this.renderer.domElement)

    // Étiquettes HTML (noms de villes) projetées par-dessus le canvas.
    this.labelRenderer = new CSS2DRenderer()
    this.labelRenderer.setSize(width, height)
    Object.assign(this.labelRenderer.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' })
    container.appendChild(this.labelRenderer.domElement)

    this.scene.fog = new THREE.Fog(SCENE.fog, 900, 1600)

    this.camera = new THREE.PerspectiveCamera(36, width / height, 1, 5000)
    this.camera.up.set(0, 0, 1)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.minPolarAngle = 0.12
    this.controls.maxPolarAngle = Math.PI / 2.25
    this.controls.minDistance = 90
    this.controls.maxDistance = 1100
    this.controls.screenSpacePanning = false

    this.scene.add(this.group)
    this.keyLight = this.addLights()
    this.bindPointer()

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)

    this.loop()
  }

  // ---------------------------------------------------------------- Chargement

  /** Construit les meshes à partir du GeoJSON. À appeler une seule fois. */
  load(collection: FeatureCollection): void {
    const plinthShapes: THREE.Shape[] = []
    const { depts, offset } = geojsonToShapes(collection)
    this.offset.copy(offset)

    for (const dept of depts) {
      const geometry = mergeGeometries(
        dept.shapes.map((shape) => new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false })),
      )
      if (!geometry) continue
      plinthShapes.push(...dept.shapes)

      const material = new THREE.MeshStandardMaterial({
        color: COLORS.base,
        roughness: 0.55,
        metalness: 0.08,
        emissive: 0x000000,
      })
      const mesh = new THREE.Mesh(geometry, material) as DeptMesh
      mesh.userData = {
        code: dept.code,
        nom: dept.nom,
        center: new THREE.Vector3(dept.center.x, dept.center.y, 0),
        baseColor: COLORS.base.clone(),
      }
      mesh.scale.z = 0.01
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(geometry, 12),
          new THREE.LineBasicMaterial({ color: COLORS.edge, transparent: true, opacity: 0.7 }),
        ),
      )

      this.group.add(mesh)
      this.meshes.push(mesh)
      this.depts.set(dept.code, mesh)
    }

    this.addPlinth(plinthShapes)
    this.bounds = new THREE.Box3().setFromObject(this.group)
    this.fitShadowCamera()
    this.resetView(false)
  }

  /**
   * Applique couleur et hauteur pour chaque département, avec transition animée.
   * `signed` bascule sur la palette divergente ; `stagger` décale les départements
   * pour l'animation d'entrée.
   */
  setValues(values: Map<DeptCode, DeptValue>, { signed = false, stagger = false } = {}): void {
    // En vue éloignée, seules les étiquettes des territoires les plus forts restent affichées,
    // en écartant celles qui se superposeraient (petite couronne parisienne, par exemple).
    const kept: THREE.Vector3[] = []
    this.priority = new Set(
      [...values.entries()]
        .sort((a, b) => b[1].h - a[1].h)
        .filter(([code]) => {
          const position = this.labels.get(code)?.position
          if (!position) return false
          if (kept.some((p) => p.distanceTo(position) < LABELS_MIN_GAP)) return false
          kept.push(position)
          return kept.length <= LABELS_FAR
        })
        .map(([code]) => code),
    )

    this.meshes.forEach((mesh, index) => {
      const value = values.get(mesh.userData.code) ?? { t: signed ? 0.5 : 0, h: 0 }
      const from = mesh.userData.baseColor.clone()
      const to = colorFor(value.t, signed)
      const height = HEIGHT_MIN + value.h * (HEIGHT_MAX - HEIGHT_MIN)
      const delay = stagger ? index * 0.012 : 0

      mesh.userData.baseColor.copy(to)
      const tween = { t: 0 }
      gsap.to(tween, {
        t: 1,
        duration: 0.9,
        delay,
        ease: 'power2.out',
        onUpdate: () => {
          if (this.stateOf(mesh) !== 'idle') return
          const color = from.clone().lerp(to, tween.t)
          this.paint(mesh, color, color, SCENE.glow)
        },
      })
      gsap.to(mesh.scale, { z: height, duration: 1.1, delay, ease: 'power3.out', overwrite: 'auto' })
    })
  }

  // ---------------------------------------------------------------- Sélection

  select(code: DeptCode | null, { fly = true } = {}): void {
    const next = code ? (this.depts.get(code) ?? null) : null
    if (next === this.selected) return

    const previous = this.selected
    this.selected = next
    if (previous) this.restyle(previous)
    if (next) {
      this.restyle(next)
      if (fly) this.flyTo(next)
    }
    this.events.onSelect?.(next?.userData.code ?? null)
  }

  /** Met en évidence les départements d'une même région (liste vide pour annuler). */
  highlightRegion(codes: DeptCode[]): void {
    const previous = this.regionMates
    this.regionMates = new Set(codes)
    for (const code of new Set([...previous, ...codes])) {
      const mesh = this.depts.get(code)
      if (mesh) this.restyle(mesh)
    }
  }

  /** Cadre la France entière avec une vue inclinée. */
  resetView(animate = true): void {
    const size = this.bounds.getSize(new THREE.Vector3())
    const fov = (this.camera.fov * Math.PI) / 180
    const distance = (Math.max(size.x, size.y / this.camera.aspect) * 0.5) / Math.tan(fov / 2)
    this.moveCamera(
      new THREE.Vector3(0, -distance * 0.72, distance * 0.78),
      new THREE.Vector3(0, 0, 0),
      animate ? 1.2 : 0,
    )
  }


  /** Place une étiquette (nom de ville) au sommet de chaque département, à la position géographique donnée. */
  setLabels(places: Map<DeptCode, { name: string; lon: number; lat: number }>): void {
    for (const [code, place] of places) {
      const mesh = this.depts.get(code)
      if (!mesh || this.labels.has(code)) continue
      const element = document.createElement('div')
      element.className = 'map-label'
      element.textContent = place.name
      const label = new CSS2DObject(element)
      const p = project([place.lon, place.lat]).sub(this.offset)
      // z = 1 en local = sommet du bloc quelle que soit sa hauteur (scale.z).
      label.position.set(p.x, p.y, 1)
      label.center.set(0.5, 1.15)
      mesh.add(label)
      this.labels.set(code, label)
    }
  }

  private updateLabels(): void {
    if (!this.labels.size) return
    const near = this.camera.position.distanceTo(this.controls.target) < LABELS_NEAR_DISTANCE
    for (const [code, label] of this.labels) {
      const mesh = this.depts.get(code)
      const emphasised = mesh === this.selected || mesh === this.hovered || this.regionMates.has(code)
      label.visible = near || emphasised || this.priority.has(code)
      label.element.classList.toggle('map-label-active', mesh === this.selected)
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    cancelAnimationFrame(this.frame)
    this.abort.abort()
    this.resizeObserver.disconnect()
    this.controls.dispose()
    gsap.killTweensOf(this.camera.position)
    gsap.killTweensOf(this.controls.target)
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
        object.geometry.dispose()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach((m: THREE.Material) => m.dispose())
      }
    })
    this.renderer.dispose()
    this.renderer.domElement.remove()
    this.labelRenderer.domElement.remove()
  }

  // ---------------------------------------------------------------- Interne

  private addLights(): THREE.DirectionalLight {
    this.scene.add(new THREE.HemisphereLight(SCENE.hemisphere.sky, SCENE.hemisphere.ground, SCENE.hemisphere.intensity))

    const key = new THREE.DirectionalLight(SCENE.key.color, SCENE.key.intensity)
    key.position.set(-260, -320, 420)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.bias = -0.0008
    key.shadow.normalBias = 0.6
    key.shadow.radius = 4
    this.scene.add(key)

    const rim = new THREE.DirectionalLight(SCENE.rim.color, SCENE.rim.intensity)
    rim.position.set(300, 200, 150)
    this.scene.add(rim)

    return key
  }

  private fitShadowCamera(): void {
    const radius = this.bounds.getSize(new THREE.Vector3()).length() / 2
    const cam = this.keyLight.shadow.camera
    cam.left = cam.bottom = -radius
    cam.right = cam.top = radius
    cam.near = 10
    cam.far = 1500
    cam.updateProjectionMatrix()
  }

  /** Socle sous la carte et sol recevant les ombres. */
  private addPlinth(shapes: THREE.Shape[]): void {
    const plinth = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shapes, { depth: PLINTH_DEPTH, bevelEnabled: false }),
      [
        new THREE.MeshStandardMaterial({ color: SCENE.plinth, roughness: 0.95, metalness: 0 }),
        new THREE.MeshStandardMaterial({ color: SCENE.plinthSide, roughness: 0.95, metalness: 0 }),
      ],
    )
    plinth.position.z = -PLINTH_DEPTH
    plinth.receiveShadow = true
    this.group.add(plinth)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(4000, 4000),
      new THREE.ShadowMaterial({ color: 0x1e293b, opacity: SCENE.shadowOpacity }),
    )
    ground.position.z = -PLINTH_DEPTH - 0.01
    ground.receiveShadow = true
    this.scene.add(ground)

  }

  private stateOf(mesh: DeptMesh): VisualState {
    if (mesh === this.selected) return 'selected'
    if (mesh === this.hovered) return 'hover'
    if (this.regionMates.has(mesh.userData.code)) return 'mate'
    return 'idle'
  }

  /** Applique une couleur de surface et une lueur (émissif) à un mesh. */
  private paint(mesh: DeptMesh, color: THREE.Color, glow: THREE.Color, intensity: number): void {
    mesh.material.color.copy(color)
    mesh.material.emissive.copy(glow)
    mesh.material.emissiveIntensity = intensity
  }

  /** Recalcule couleur, lueur et élévation d'un mesh selon son état courant. */
  private restyle(mesh: DeptMesh): void {
    const state = this.stateOf(mesh)
    const { baseColor } = mesh.userData
    gsap.to(mesh.position, { z: LIFT[state], duration: 0.25, ease: 'power2.out', overwrite: 'auto' })

    switch (state) {
      case 'selected':
        this.paint(mesh, COLORS.selected, COLORS.selected, 0.45)
        break
      case 'mate':
        this.paint(mesh, baseColor.clone().lerp(COLORS.regionMate, 0.4), COLORS.regionMate, 0.2)
        break
      case 'hover':
        this.paint(mesh, baseColor.clone().lerp(COLORS.hover, 0.3), baseColor, 0.5)
        break
      default:
        this.paint(mesh, baseColor, baseColor, SCENE.glow)
    }
  }

  private flyTo(mesh: DeptMesh): void {
    const target = mesh.userData.center.clone().setZ(mesh.scale.z / 2)
    const direction = this.camera.position.clone().sub(this.controls.target).normalize()
    if (direction.z < 0.45) direction.setZ(0.45).normalize()
    this.moveCamera(target.clone().add(direction.multiplyScalar(FLY_DISTANCE)), target, 1)
  }

  private moveCamera(position: THREE.Vector3, target: THREE.Vector3, duration: number): void {
    gsap.killTweensOf(this.camera.position)
    gsap.killTweensOf(this.controls.target)
    if (duration === 0) {
      this.camera.position.copy(position)
      this.controls.target.copy(target)
      this.controls.update()
      return
    }
    const ease = 'power2.inOut'
    gsap.to(this.camera.position, { ...position, duration, ease })
    gsap.to(this.controls.target, { ...target, duration, ease })
  }

  private updatePointer(event: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
  }

  private bindPointer(): void {
    const el = this.renderer.domElement
    const { signal } = this.abort

    el.addEventListener(
      'pointermove',
      (event) => {
        this.updatePointer(event)
        this.pointerDirty = true
      },
      { signal },
    )
    el.addEventListener('pointerleave', () => this.setHovered(null), { signal })
    el.addEventListener(
      'pointerdown',
      (event) => {
        this.pointerDown = { x: event.clientX, y: event.clientY }
      },
      { signal },
    )
    el.addEventListener(
      'pointerup',
      (event) => {
        const down = this.pointerDown
        this.pointerDown = null
        if (!down || Math.hypot(event.clientX - down.x, event.clientY - down.y) > CLICK_TOLERANCE_PX) return
        // Sur tactile il n'y a pas de survol préalable : on raycaste au relâchement.
        this.updatePointer(event)
        this.select(this.pick()?.userData.code ?? null)
      },
      { signal },
    )
  }

  private pick(): DeptMesh | null {
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hit = this.raycaster.intersectObjects(this.meshes, false)[0]
    return (hit?.object as DeptMesh | undefined) ?? null
  }

  private setHovered(mesh: DeptMesh | null): void {
    if (mesh === this.hovered) return
    const previous = this.hovered
    this.hovered = mesh
    if (previous) this.restyle(previous)
    if (mesh) this.restyle(mesh)
    this.renderer.domElement.style.cursor = mesh ? 'pointer' : 'grab'
    if (!mesh) this.events.onHover?.(null)
  }

  private updateHover(): void {
    if (!this.pointerDirty) return
    this.pointerDirty = false
    const hit = this.pick()
    this.setHovered(hit)
    if (hit) {
      const rect = this.renderer.domElement.getBoundingClientRect()
      this.events.onHover?.({
        code: hit.userData.code,
        x: ((this.pointer.x + 1) / 2) * rect.width,
        y: ((1 - this.pointer.y) / 2) * rect.height,
      })
    }
  }

  private resize(): void {
    const { clientWidth: width, clientHeight: height } = this.container
    if (!width || !height) return
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    this.labelRenderer.setSize(width, height)
  }

  private loop = (): void => {
    if (this.disposed) return
    this.frame = requestAnimationFrame(this.loop)
    this.updateHover()
    this.controls.update()
    this.updateLabels()
    this.renderer.render(this.scene, this.camera)
    this.labelRenderer.render(this.scene, this.camera)
  }
}
