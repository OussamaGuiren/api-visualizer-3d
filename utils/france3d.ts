// Fichier principal pour la carte 3D de la France, gère l'affichage et l'interaction.
import * as THREE from 'three' // Importe la librairie Three.js pour la 3D.
import gsap from 'gsap' // Importe GSAP pour les animations fluides.

type RawDeptInfo = { clients?: number; ca?: number; region?: string } // Type pour les infos d'un département.
type DeptInfo = Record<string, RawDeptInfo> // Associe chaque code de département à ses infos.

export async function initFrance3D( // Fonction principale pour initialiser la carte 3D.
  container: HTMLElement,
  onSelectDept: (code: string, info: RawDeptInfo) => void
) {
  const scene = new THREE.Scene() // Crée la scène 3D qui va contenir tous les objets.
  scene.background = new THREE.Color(0xf9fafb) // Définit la couleur de fond de la scène.

  const width = container.clientWidth || 300 // Récupère la largeur du conteneur ou met 300 par défaut.
  const height = container.clientHeight || 300 // Récupère la hauteur du conteneur ou met 300 par défaut.

  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 50000) // Crée une caméra perspective pour voir la scène.
  camera.position.set(0, 0, 5000) // Place la caméra au-dessus de la carte.
  camera.lookAt(0, 0, 0) // Oriente la caméra vers le centre de la scène.

  const renderer = new THREE.WebGLRenderer({ antialias: true }) // Crée le moteur de rendu WebGL avec lissage des bords.
  renderer.setSize(width, height) // Définit la taille du rendu selon le conteneur.

  function getDPR() { // Fonction pour limiter la résolution sur mobile.
    return Math.min(window.devicePixelRatio || 1, 1.5) // Évite de surcharger le GPU sur petits écrans.
  }
  renderer.setPixelRatio(getDPR()) // Applique le ratio de pixels calculé.

  container.appendChild(renderer.domElement) // Ajoute le canvas 3D dans le conteneur HTML.

  // Lumières
  const ambient = new THREE.AmbientLight(0xffffff, 1.2) // Crée une lumière ambiante douce.
  scene.add(ambient) // Ajoute la lumière ambiante à la scène.

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8) // Crée une lumière directionnelle pour les ombres.
  dirLight.position.set(200, 300, 400) // Positionne la lumière pour un effet réaliste.
  scene.add(dirLight) // Ajoute la lumière directionnelle à la scène.

  const raycaster = new THREE.Raycaster() // Permet de détecter les objets sous la souris.
  const mouse = new THREE.Vector2() // Stocke la position de la souris pour le raycast.
  const departements: THREE.Mesh[] = [] // Liste des départements sous forme de mesh 3D.
  const franceGroup = new THREE.Group() // Groupe qui contient tous les départements.
  scene.add(franceGroup) // Ajoute le groupe à la scène.

  let hovered: THREE.Mesh | null = null // Stocke le département survolé.
  let selected: THREE.Mesh | null = null // Stocke le département sélectionné.
  let info: DeptInfo = {} // Stocke les infos business de chaque département.
  let lastMouseX = 0 // Dernière position X de la souris (pour le tooltip).
  let lastMouseY = 0 // Dernière position Y de la souris (pour le tooltip).
  let pointerInside = false // Indique si la souris est dans la carte.

  // Tooltip HTML
  container.style.position = 'relative' // Permet de positionner le tooltip par rapport au conteneur.
  const tooltip = document.createElement('div') // Crée l'élément HTML du tooltip.
  tooltip.className = 'map-tooltip' // Donne une classe pour le style du tooltip.
  Object.assign(tooltip.style, { // Définit le style CSS du tooltip.
    position: 'absolute',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    background: '#ffffff',
    color: '#111827',
    border: '1px solid #d1d5db',
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    pointerEvents: 'none',
    transform: 'translate3d(0,0,0)',
    opacity: '0',
    transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
    whiteSpace: 'nowrap',
    zIndex: '10'
  } as CSSStyleDeclaration)
  container.appendChild(tooltip) // Ajoute le tooltip dans le conteneur.

  // === Camera-fit helper pour le responsive === // Fonction pour adapter la caméra à la taille de la France.
  function updateCameraToFitFrance() {
    if (franceGroup.children.length === 0) return

    const box = new THREE.Box3().setFromObject(franceGroup)
    const size = new THREE.Vector3()
    box.getSize(size)

    const fovRad = (camera.fov * Math.PI) / 160
    const halfHeight = size.y / 2
    const halfWidth = size.x / 2
    const aspect = camera.aspect

    const distHeight = halfHeight / Math.tan(fovRad / 2)
    const distWidth = halfWidth / (Math.tan(fovRad / 2) * aspect)

    const dist = Math.max(distHeight, distWidth) * 1.15 // petite marge

    camera.position.set(0, 0, dist)
    camera.lookAt(0, 0, 0)
  }

  // Resize responsive // Fonction pour adapter la scène et la caméra au conteneur.
  function resizeScene() {
    const w = container.clientWidth || 1
    const h = container.clientHeight || 1

    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
    renderer.setPixelRatio(getDPR())

    updateCameraToFitFrance()
  }

  window.addEventListener('resize', resizeScene) // Met à jour la scène quand la fenêtre est redimensionnée.

  if (typeof ResizeObserver !== 'undefined') { // Utilise ResizeObserver pour détecter les changements de taille du conteneur.
    const ro = new ResizeObserver(() => {
      resizeScene() // Met à jour la scène si le conteneur change de taille.
    })
    ro.observe(container)
  }

  resizeScene() // Ajuste la scène dès le départ.

  // Chargement des données France // Charge les données géographiques et business.
  await loadFrance()

  async function loadFrance() {
    const [geojsonRes, infoRes] = await Promise.all([
      fetch('/data/france-departements.geojson'),
      fetch('/data/departements-info.json')
    ])

    if (!geojsonRes.ok || !infoRes.ok) {
      console.error(
        '[France3D] Erreur chargement données',
        geojsonRes.status,
        infoRes.status
      )
      return
    }

    const geojson = await geojsonRes.json()
    info = await infoRes.json()

    buildFlatMapFromGeoJSON(geojson, franceGroup, departements)

    if (departements.length === 0) {
      console.error('[France3D] Aucun département créé')
      return
    }

    // Centre une seule fois
    const box = new THREE.Box3().setFromObject(franceGroup)
    const center = new THREE.Vector3()
    box.getCenter(center)
    franceGroup.position.sub(center)

    updateCameraToFitFrance()
  }

  // Events // Gère les interactions souris et tactile.

  function onMouseMove(event: MouseEvent) {
    pointerInside = true

    const rect = container.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    lastMouseX = event.clientX - rect.left
    lastMouseY = event.clientY - rect.top
  }

  function onMouseLeave() {
    pointerInside = false

    if (hovered && hovered !== selected) {
      resetHover(hovered)
    }
    hovered = null
    tooltip.style.opacity = '0'
  }

  function onClick() {
    if (!hovered) return

    if (selected && selected !== hovered) {
      resetSelected(selected)
    }

    selected = hovered
    applySelected(selected)

    const code = (selected.userData.code as string) ?? '--'
    const deptInfo: RawDeptInfo = info[code] ?? { clients: 0, ca: 0, region: '' }
    onSelectDept(code, deptInfo)
  }

  container.addEventListener('mousemove', onMouseMove)
  container.addEventListener('mouseleave', onMouseLeave)
  container.addEventListener('click', onClick)

  // Support tactile minimal
  container.addEventListener('touchmove', (e: TouchEvent) => {
    if (!e.touches || e.touches.length === 0) return
    pointerInside = true
    const touch = e.touches[0]!
    const rect = container.getBoundingClientRect()
    mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1
    lastMouseX = touch.clientX - rect.left
    lastMouseY = touch.clientY - rect.top
  })
  container.addEventListener('touchend', () => {
    onClick()
  })

  // Boucle d'animation // Fonction qui met à jour la scène en continu.
  function animate() {
    requestAnimationFrame(animate)

    // Si la souris est hors de la carte
    if (!pointerInside) {
      if (hovered && hovered !== selected) {
        resetHover(hovered)
      }
      hovered = null
      tooltip.style.opacity = '0'
      renderer.render(scene, camera)
      return
    }

    // Raycast
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(departements)

    if (intersects.length > 0) {
      const mesh = intersects[0]?.object as THREE.Mesh | undefined

      if (mesh && hovered !== mesh) {
        if (hovered && hovered !== selected) resetHover(hovered)
        hovered = mesh
        applyHover(mesh)
      }

      const code = mesh ? (mesh.userData.code as string) ?? '' : ''
      const name = mesh ? (mesh.userData.name as string) ?? '' : ''
      tooltip.textContent = name ? `${code} · ${name}` : code
      tooltip.style.opacity = '1'
      tooltip.style.left = `${lastMouseX + 12}px`
      tooltip.style.top = `${lastMouseY + 12}px`
    } else {
      if (hovered && hovered !== selected) resetHover(hovered)
      hovered = null
      tooltip.style.opacity = '0'
    }

    renderer.render(scene, camera)
  }

  animate()
}

function buildFlatMapFromGeoJSON( // Fonction qui transforme le GeoJSON en objets 3D pour chaque département.
  geojson: any,
  group: THREE.Group,
  departements: THREE.Mesh[]
) {
  const MS_BLUE = 0x0078d4 // bleu Microsoft-ish

  if (!geojson?.features?.length) {
    console.error('[France3D] GeoJSON sans features')
    return
  }

  const features = geojson.features
  const shapesData: {
    code: string
    name: string
    points: { x: number; y: number }[]
  }[] = []

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const feature of features) {
    const coords = feature.geometry.coordinates
    const code =
      feature.properties.code ||
      feature.properties.CODE_DEPT ||
      feature.properties.CODE_DEPTMT

    const name =
      feature.properties.nom ||
      feature.properties.NOM_DEPT ||
      feature.properties.NOM_DEPTMT ||
      ''

    const polygons = feature.geometry.type === 'Polygon' ? [coords] : coords

    for (const polygon of polygons) {
      const ring = polygon[0]
      const pts = ring.map(([lon, lat]: [number, number]) => {
        const x = lon
        const y = lat
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
        return { x, y }
      })
      shapesData.push({ code, name, points: pts })
    }
  }

  const scale = 10
  const offsetX = (minX + maxX) / 2
  const offsetY = (minY + maxY) / 2

  for (const { code, name, points } of shapesData) {
    const shape = new THREE.Shape()

    points.forEach((p, i) => {
      const x = (p.x - offsetX) * scale
      const y = (p.y - offsetY) * scale
      if (i === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    })
    shape.closePath()

    // Couche de base
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a
    })
    const baseGeometry = new THREE.ShapeGeometry(shape)
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial)
    baseMesh.position.z = 0

    // Couche top (département)
    const extrudeSettings = {
      depth: 6,
      bevelEnabled: false
    }
    const topGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    topGeometry.computeBoundingBox()

    const topMaterial = new THREE.MeshStandardMaterial({
      color: MS_BLUE
    })
    const topMesh = new THREE.Mesh(topGeometry, topMaterial)
    topMesh.position.z = 0.5

    // Décalage léger pour effet dispatché
    const bbox = topGeometry.boundingBox!
    const cx = (bbox.min.x + bbox.max.x) / 2
    const cy = (bbox.min.y + bbox.max.y) / 2
    const pushFactor = 0.03
    const offsetXDept = cx * pushFactor
    const offsetYDept = cy * pushFactor

    baseMesh.position.x += offsetXDept
    baseMesh.position.y += offsetYDept
    topMesh.position.x += offsetXDept
    topMesh.position.y += offsetYDept

    topMesh.userData = {
      code,
      name,
      baseColor: topMaterial.color.clone(),
      baseZ: topMesh.position.z,
      isSelected: false
    }

    group.add(baseMesh)
    group.add(topMesh)
    departements.push(topMesh)

    // Contours
    const edgeGeom = new THREE.EdgesGeometry(topGeometry)
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0xf9fafb,
      linewidth: 2
    })
    const edges = new THREE.LineSegments(edgeGeom, edgeMat)
    edges.position.copy(topMesh.position)
    group.add(edges)
  }
}

function applyHover(mesh: THREE.Mesh) { // Fonction qui anime le département survolé.
  const LBC_ORANGE = 0xff8b43
  if (!mesh || !mesh.userData) return

  const mat = mesh.material as THREE.MeshStandardMaterial
  const baseZ = (mesh.userData.baseZ as number) ?? 0
  const isSelected = !!mesh.userData.isSelected
  const targetZ = isSelected ? baseZ + 10 : baseZ + 4

  gsap.to(mesh.position, { z: targetZ, duration: 0.12 })
  gsap.to(mesh.scale, { x: 1.03, y: 1.03, duration: 0.12 })

  if (!isSelected) {
    mat.color.setHex(LBC_ORANGE)
  }
}

function resetHover(mesh: THREE.Mesh) { // Fonction qui remet le département à son état normal après survol.
  if (!mesh || !mesh.userData) return

  const mat = mesh.material as THREE.MeshStandardMaterial
  const baseZ = (mesh.userData.baseZ as number) ?? 0
  const isSelected = !!mesh.userData.isSelected
  const targetZ = isSelected ? baseZ + 10 : baseZ

  gsap.to(mesh.position, { z: targetZ, duration: 0.12 })
  gsap.to(mesh.scale, { x: 1, y: 1, duration: 0.12 })

  if (!isSelected) {
    const baseColor = mesh.userData.baseColor as THREE.Color
    if (baseColor) {
      mat.color.copy(baseColor)
    }
  }
}

function applySelected(mesh: THREE.Mesh) { // Fonction qui anime le département sélectionné.
  const LBC_ORANGE = 0xff8b43
  if (!mesh || !mesh.userData) return

  const mat = mesh.material as THREE.MeshStandardMaterial
  const baseZ = (mesh.userData.baseZ as number) ?? 0

  mesh.userData.isSelected = true

  gsap.to(mesh.position, { z: baseZ + 10, duration: 0.18 })
  gsap.to(mesh.scale, { x: 1.05, y: 1.05, duration: 0.18 })

  mat.color.setHex(LBC_ORANGE)
}

function resetSelected(mesh: THREE.Mesh) { // Fonction qui remet le département à son état normal après sélection.
  if (!mesh || !mesh.userData) return

  const mat = mesh.material as THREE.MeshStandardMaterial
  const baseZ = (mesh.userData.baseZ as number) ?? 0
  const baseColor = mesh.userData.baseColor as THREE.Color

  mesh.userData.isSelected = false

  gsap.to(mesh.position, { z: baseZ, duration: 0.18 })
  gsap.to(mesh.scale, { x: 1, y: 1, duration: 0.18 })

  if (baseColor) {
    mat.color.copy(baseColor)
  }
}
