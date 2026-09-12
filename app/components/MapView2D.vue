<template>
  <div class="map2d">
    <div ref="container" class="map2d-canvas" />
    <Transition name="fade">
      <div v-if="loading" class="map2d-loading" role="status">
        <span class="spinner" aria-hidden="true" />
        Chargement du fond de carte…
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type * as Leaflet from 'leaflet'
import type { DeptCode, MetricKey } from '~/types/departements'
import type { FeatureCollection } from '~/three/projection'
import { colorFor } from '~/three/palette'

/**
 * Vue « carte réelle » : fond OpenStreetMap (rendu CARTO, avec routes et noms
 * de villes), départements colorés selon l'indicateur, préfectures étiquetées.
 */
const props = defineProps<{ metric: MetricKey; selected: DeptCode | null }>()
const emit = defineEmits<{ 'update:selected': [code: DeptCode | null] }>()

const { depts, byCode, mapValues } = useDepartements()
const { def, format } = useMetrics()

const container = ref<HTMLElement | null>(null)
const loading = ref(true)

let L: typeof Leaflet
let map: Leaflet.Map | null = null
let layer: Leaflet.GeoJSON | null = null
let labels: Leaflet.LayerGroup | null = null
let observer: ResizeObserver | null = null

const FRANCE_CENTER: Leaflet.LatLngExpression = [46.6, 2.4]
const LABELS_FAR = 12
const LABELS_NEAR_ZOOM = 7
/** Écart minimal (degrés, longitude corrigée) entre deux étiquettes en zoom éloigné. */
const LABELS_MIN_GAP_DEG = 0.45

const styleFor = (code: DeptCode): Leaflet.PathOptions => {
  const metric = def(props.metric)
  const value = mapValues(props.metric).get(code) ?? { t: metric.signed ? 0.5 : 0, h: 0 }
  const isSelected = code === props.selected
  return {
    fillColor: `#${colorFor(value.t, metric.signed).getHexString()}`,
    fillOpacity: isSelected ? 0.92 : 0.7,
    color: isSelected ? '#ea580c' : '#ffffff',
    weight: isSelected ? 3 : 1,
  }
}

const restyle = () => {
  layer?.eachLayer((l) => {
    const feature = (l as Leaflet.Path & { feature?: { properties: { code: DeptCode } } }).feature
    if (feature) (l as Leaflet.Path).setStyle(styleFor(feature.properties.code))
  })
  const selected = props.selected ? findLayer(props.selected) : null
  selected?.bringToFront()
}

const findLayer = (code: DeptCode): Leaflet.Path | null => {
  let found: Leaflet.Path | null = null
  layer?.eachLayer((l) => {
    const feature = (l as Leaflet.Path & { feature?: { properties: { code: DeptCode } } }).feature
    if (feature?.properties.code === code) found = l as Leaflet.Path
  })
  return found
}

/** Préfectures : toutes en zoom rapproché, sinon celles des territoires les plus forts. */
const updateLabels = () => {
  if (!map || !labels) return
  const zoom = map.getZoom()
  const values = mapValues(props.metric)
  // Les plus forts d'abord, en écartant les étiquettes trop proches (petite couronne parisienne).
  const kept: { lat: number; lon: number }[] = []
  const priority = new Set(
    [...values.entries()]
      .sort((a, b) => b[1].h - a[1].h)
      .filter(([code]) => {
        const d = byCode.value.get(code)
        if (!d) return false
        if (kept.some((k) => Math.hypot(k.lat - d.lat, (k.lon - d.lon) * 0.7) < LABELS_MIN_GAP_DEG)) return false
        kept.push(d)
        return kept.length <= LABELS_FAR
      })
      .map(([code]) => code),
  )
  labels.eachLayer((marker) => {
    const code = (marker as Leaflet.Marker & { options: { code: DeptCode } }).options.code
    const element = (marker as Leaflet.Marker).getElement()
    if (!element) return
    const visible = zoom >= LABELS_NEAR_ZOOM || priority.has(code) || code === props.selected
    element.style.display = visible ? '' : 'none'
    element.querySelector('.map-label')?.classList.toggle('map-label-active', code === props.selected)
  })
}

onMounted(async () => {
  if (!container.value) return
  ;[L] = await Promise.all([import('leaflet').then((m) => m.default ?? m), import('leaflet/dist/leaflet.css')])
  const geojson = await $fetch<FeatureCollection>('/data/france-departements.geojson')

  map = L.map(container.value, { zoomControl: false, minZoom: 5, maxZoom: 12 }).setView(FRANCE_CENTER, 6)
  // Tuiles OpenStreetMap standard : routes, villes, reliefs — sans clé d'API.
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)
  L.control.zoom({ position: 'bottomright' }).addTo(map)

  layer = L.geoJSON(geojson as never, {
    style: (feature) => styleFor(feature?.properties.code),
    onEachFeature: (feature, l) => {
      const code = feature.properties.code as DeptCode
      const path = l as Leaflet.Path
      path.on('click', () => emit('update:selected', code === props.selected ? null : code))
      path.on('mouseover', () => {
        if (code !== props.selected) path.setStyle({ weight: 2, fillOpacity: 0.85 })
        path.bringToFront()
      })
      path.on('mouseout', () => path.setStyle(styleFor(code)))
      path.bindTooltip(
        () => {
          const dept = byCode.value.get(code)
          return dept
            ? `<strong>${dept.code} · ${dept.nom}</strong><br>${def(props.metric).label} : ${format(dept, props.metric)}`
            : code
        },
        { sticky: true, direction: 'top', opacity: 0.96 },
      )
    },
  }).addTo(map)

  labels = L.layerGroup(
    depts.value.map((d) =>
      L.marker([d.lat, d.lon], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({ className: 'map2d-label', html: `<span class="map-label">${d.ville}</span>`, iconSize: undefined }),
        // Rangé dans les options pour retrouver le département lors des mises à jour.
        ...({ code: d.code } as object),
      }),
    ),
  ).addTo(map)

  map.on('zoomend', updateLabels)
  observer = new ResizeObserver(() => map?.invalidateSize())
  observer.observe(container.value)

  loading.value = false
  updateLabels()
  if (props.selected) focus(props.selected)
})

const focus = (code: DeptCode) => {
  const target = findLayer(code) as (Leaflet.Path & { getBounds?: () => Leaflet.LatLngBounds }) | null
  const bounds = target?.getBounds?.()
  if (map && bounds) map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 9, duration: 0.8 })
}

onBeforeUnmount(() => {
  observer?.disconnect()
  map?.remove()
  map = null
})

const { dataset } = useDataset()

watch([() => props.metric, dataset], () => {
  restyle()
  updateLabels()
})

watch(() => props.selected, (code) => {
  restyle()
  updateLabels()
  if (code) focus(code)
})

defineExpose({
  resetView: () => map?.flyTo(FRANCE_CENTER, 6, { duration: 0.8 }),
})
</script>

<style scoped>
.map2d {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #eef2f9;
}

.map2d-canvas {
  position: absolute;
  inset: 0;
}

.map2d-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 13px;
  background: var(--bg);
}

.spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--track);
  border-top-color: var(--accent);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style>
/* Leaflet injecte ses propres éléments : styles globaux ciblés. */
.map2d-label {
  background: none;
  border: 0;
  transform: translate(-50%, -120%);
  width: max-content !important;
}

/* Leaflet rend les polygones focusables (infobulles) : pas de rectangle de focus au clic,
   la sélection est déjà signalée par le contour orange. */
.map2d path.leaflet-interactive:focus,
.map2d .leaflet-marker-icon:focus {
  outline: none;
}

.map2d .leaflet-tooltip {
  border-radius: 9px;
  border: 1px solid var(--border-strong);
  box-shadow: var(--shadow-sm);
  font-family: var(--font);
  font-size: 12px;
  line-height: 1.4;
  padding: 6px 10px;
}

.map2d .leaflet-control-zoom a {
  color: var(--text);
}

.map2d .leaflet-control-attribution {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.8);
}
</style>
