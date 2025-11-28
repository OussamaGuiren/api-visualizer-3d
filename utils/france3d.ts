// utils/france3d.ts
import * as THREE from 'three'
import gsap from 'gsap'

type DeptInfo = Record<string, { clients?: number; ca?: number; region?: string }>

export async function initFrance3D(
  container: HTMLElement,
  onSelectDept: (code: string, info: any) => void
) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf9fafb)

  const width = container.clientWidth || 300
  const height = container.clientHeight || 300

  // 📸 Caméra vue de dessus, style 2D
  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 50000)
  camera.position.set(0, 0, 5000)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)

  
  container.appendChild(renderer.domElement)

  // 💡 Lumières plus claires et contrastées
const ambient = new THREE.AmbientLight(0xffffff, 1.2)
scene.add(ambient)

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
dirLight.position.set(200, 300, 400)
scene.add(dirLight)

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  const departements: THREE.Mesh[] = []
  const franceGroup = new THREE.Group()
  scene.add(franceGroup)

  let hovered: THREE.Mesh | null = null
  let selected: THREE.Mesh | null = null
  let info: DeptInfo = {}
  let lastMouseX = 0
  let lastMouseY = 0

  let pointerInside = false  // 👈 nou

  function onMouseLeave() {
    pointerInside = false  // 👈 la souris n’est plus dans la carte

    // on remet le dernier hovered à plat s'il n'est pas sélectionné
    if (hovered && hovered !== selected) {
      resetHover(hovered)
    }
    hovered = null

    // on cache le tooltip si tu en as un
    if (tooltip) {
      tooltip.style.opacity = '0'
    }
  }
  function onMouseMove(event: MouseEvent) {
  pointerInside = true  // 👈 on note que la souris est dans la carte

  const rect = container.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  lastMouseX = event.clientX - rect.left
  lastMouseY = event.clientY - rect.top
}
  
  // 🏷️ Tooltip HTML type "75 · Paris"
  container.style.position = 'relative'
  const tooltip = document.createElement('div')
  tooltip.className = 'map-tooltip'
  Object.assign(tooltip.style, {
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

  container.appendChild(tooltip)

  // 🌍 Resize responsive
  window.addEventListener('resize', () => {
    const w = container.clientWidth || 1
    const h = container.clientHeight || 1
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  })


  // 🧠 Chargement des données France
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

    // 🎯 Center + zoom comme une carte 2D
    const box = new THREE.Box3().setFromObject(franceGroup)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    franceGroup.position.sub(center)

    const maxDim = Math.max(size.x, size.y)
    const fovRad = (camera.fov * Math.PI) / 180
    const dist = (maxDim / (2 * Math.tan(fovRad / 2))) * 0.8

    camera.position.set(0, 0, dist)
    camera.lookAt(0, 0, 0)

    // aucune rotation : carte plate, vue de dessus
    franceGroup.rotation.set(0, 0, 0)
  }

  

  function onClick() {
  if (!hovered) return

  if (selected && selected !== hovered) {
    resetSelected(selected)
  }

  selected = hovered
  applySelected(selected)

  const code = (selected.userData.code as string) ?? '--'
  onSelectDept(code, info[code])
}

  container.addEventListener('mousemove', onMouseMove)
  container.addEventListener('click', onClick)
  container.addEventListener('mouseleave', onMouseLeave)


  function animate() {
    requestAnimationFrame(animate)

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(departements)
    if (!intersects[0]) return;
    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh
      if (hovered !== mesh) {
        if (hovered && hovered !== selected) resetHover(hovered)
        hovered = mesh
        applyHover(mesh)
      }

      const code = (mesh.userData.code as string) ?? ''
      const name = (mesh.userData.name as string) ?? ''
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

function buildFlatMapFromGeoJSON(
  geojson: any,
  group: THREE.Group,
  departements: THREE.Mesh[]
) {

  const MS_BLUE = 0x0078d4 // bleu Microsoft

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

  // 1. Collecte des points + bbox
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

  // 🎨 Couche de base : fond bleu nuit
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    // metalness: 0,
    // roughness: 0
  })
  const baseGeometry = new THREE.ShapeGeometry(shape)
  const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial)
  baseMesh.position.z = 0

  // 🧱 Couche top : bloc bleu Microsoft
  const extrudeSettings = {
    depth: 6,
    bevelEnabled: false
  }
  const topGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  topGeometry.computeBoundingBox()

  const topMaterial = new THREE.MeshStandardMaterial({
    color: MS_BLUE,        // bleu Microsoft
    // emissive: 0x60a5fa,     // bleu clair (reflet)
    // emissiveIntensity: 0.35,
    // metalness: 0,
    // roughness: 0
  })
  const topMesh = new THREE.Mesh(topGeometry, topMaterial)
  topMesh.position.z = 0.5

  // 📍 Décalage léger pour effet "dispatché"
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

  // 🧠 Métadonnées pour interaction
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

  // 🧵 Contours renforcés bleu clair
  const edgeGeom = new THREE.EdgesGeometry(topGeometry)
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0xf9fafb, // blanc cassé
    linewidth: 2
  })
  const edges = new THREE.LineSegments(edgeGeom, edgeMat)
  edges.position.copy(topMesh.position)
  group.add(edges)
}
}

function applyHover(mesh: THREE.Mesh) {
const LBC_ORANGE = 0xFF8B43   // orange Leboncoin
  if (!mesh || !mesh.userData) return

  const mat = mesh.material as THREE.MeshBasicMaterial
  const baseZ = (mesh.userData.baseZ as number) ?? 0
  const isSelected = !!mesh.userData.isSelected
  const targetZ = isSelected ? baseZ + 10 : baseZ + 4

  // bloc qui sort un peu
  gsap.to(mesh.position, { z: targetZ, duration: 0.12 })
  gsap.to(mesh.scale, { x: 1.03, y: 1.03, duration: 0.12 })

  // couleur : ORANGE LEBONCOIN EXACT
  if (!isSelected) {
    mat.color.setHex(LBC_ORANGE)
  }
}


function resetHover(mesh: THREE.Mesh) {
  if (!mesh || !mesh.userData) return

  const mat = mesh.material as THREE.MeshBasicMaterial
  const baseZ = (mesh.userData.baseZ as number) ?? 0
  const isSelected = !!mesh.userData.isSelected
  const targetZ = isSelected ? baseZ + 10 : baseZ

  gsap.to(mesh.position, { z: targetZ, duration: 0.12 })
  gsap.to(mesh.scale, { x: 1, y: 1, duration: 0.12 })

  if (!isSelected) {
    const baseColor = mesh.userData.baseColor as THREE.Color
    if (baseColor) {
      mat.color.copy(baseColor) // retour EXACT au bleu Microsoft
    }
  }
}


function applySelected(mesh: THREE.Mesh) {
const LBC_ORANGE =0xFF8B43 // orange Leboncoin
  if (!mesh || !mesh.userData) return

  const mat = mesh.material as THREE.MeshBasicMaterial
  const baseZ = (mesh.userData.baseZ as number) ?? 0

  mesh.userData.isSelected = true

  gsap.to(mesh.position, { z: baseZ + 10, duration: 0.18 })
  gsap.to(mesh.scale, { x: 1.05, y: 1.05, duration: 0.18 })

  // on garde l'orange pour le sélectionné
  mat.color.setHex(LBC_ORANGE)
}


function resetSelected(mesh: THREE.Mesh) {
  if (!mesh || !mesh.userData) return

  const mat = mesh.material as THREE.MeshBasicMaterial
  const baseZ = (mesh.userData.baseZ as number) ?? 0
  const baseColor = mesh.userData.baseColor as THREE.Color

  mesh.userData.isSelected = false

  gsap.to(mesh.position, { z: baseZ, duration: 0.18 })
  gsap.to(mesh.scale, { x: 1, y: 1, duration: 0.18 })

  if (baseColor) {
    mat.color.copy(baseColor) // retour au bleu Microsoft exact
  }
}

