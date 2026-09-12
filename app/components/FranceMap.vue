<template>
  <div class="map">
    <div ref="container" class="map-canvas" />

    <Transition name="fade">
      <div v-if="loading" class="map-loading" role="status">
        <span class="spinner" aria-hidden="true" />
        Construction de la carte 3D…
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="hovered"
        class="tooltip"
        :style="{ transform: `translate(${hovered.x + 14}px, ${hovered.y + 14}px)` }"
      >
        <div class="tooltip-name">
          <span class="tooltip-code num">{{ hovered.dept.code }}</span>
          {{ hovered.dept.nom }}
        </div>
        <div class="tooltip-value num">
          {{ def(metric).label }} · <strong>{{ format(hovered.dept, metric) }}</strong>
        </div>
      </div>
    </Transition>

    <slot />
  </div>
</template>

<script setup lang="ts">
import type { Dept, DeptCode, MetricKey } from '~/types/departements'
import type { FranceMap, HoverPayload } from '~/three/FranceMap'
import type { FeatureCollection } from '~/three/projection'

const props = defineProps<{
  metric: MetricKey
  selected: DeptCode | null
}>()

const emit = defineEmits<{
  'update:selected': [code: DeptCode | null]
}>()

const { depts, byCode, siblings, mapValues } = useDepartements()
const { def, format } = useMetrics()

const container = ref<HTMLElement | null>(null)
const loading = ref(true)
const hovered = ref<(HoverPayload & { dept: Dept }) | null>(null)

let map: FranceMap | null = null

const applyMetric = (stagger = false) => {
  map?.setValues(mapValues(props.metric), { signed: def(props.metric).signed, stagger })
}

const applySelection = () => {
  map?.select(props.selected)
  const dept = props.selected ? byCode.value.get(props.selected) : undefined
  map?.highlightRegion(dept ? siblings(dept).map((d) => d.code) : [])
}

onMounted(async () => {
  if (!container.value) return
  // Three.js n'existe que côté client : import dynamique pour garder le bundle SSR léger.
  const [{ FranceMap: Engine }, geojson] = await Promise.all([
    import('~/three/FranceMap'),
    $fetch<FeatureCollection>('/data/france-departements.geojson'),
  ])

  map = new Engine(container.value, {
    onHover: (payload) => {
      const dept = payload && byCode.value.get(payload.code)
      hovered.value = payload && dept ? { ...payload, dept } : null
    },
    onSelect: (code) => emit('update:selected', code),
  })
  map.load(geojson)
  map.setLabels(new Map(depts.value.map((d) => [d.code, { name: d.ville, lon: d.lon, lat: d.lat }])))
  loading.value = false
  applyMetric(true)
  applySelection()
})

onBeforeUnmount(() => {
  map?.dispose()
  map = null
})

const { dataset } = useDataset()

watch(() => props.metric, () => applyMetric())
// Un import de données recolore et ré-extrude toute la carte.
watch(dataset, () => applyMetric(true))
watch(() => props.selected, applySelection)

defineExpose({
  resetView: () => map?.resetView(),
})
</script>

<style scoped>
.map {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--stage-bg);
}

.map-canvas {
  position: absolute;
  inset: 0;
}

.map-loading {
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

.tooltip {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: var(--tooltip-bg);
  border: 1px solid var(--border-strong);
  box-shadow: var(--shadow);
  white-space: nowrap;
  z-index: 5;
}

.tooltip-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.tooltip-code {
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--accent-soft);
  color: var(--accent-text);
  font-size: 11px;
}

.tooltip-value {
  margin-top: 3px;
  font-size: 12px;
  color: var(--text-muted);
}

.tooltip-value strong {
  color: var(--text);
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
