<template>
  <div class="layout">
    <div class="stage" data-tour="map">
      <FranceMap v-if="view === '3d'" ref="map3dRef" v-model:selected="selected" :metric="metric" />
      <MapView2D v-else ref="map2dRef" v-model:selected="selected" :metric="metric" />

      <div class="hud hud-top-left">
        <div class="view-switch card" role="radiogroup" aria-label="Type de carte" data-tour="view">
          <button
            v-for="v in VIEWS"
            :key="v.key"
            type="button"
            role="radio"
            class="view-item"
            :class="{ active: view === v.key }"
            :aria-checked="view === v.key"
            :title="v.title"
            @click="view = v.key"
          >
            {{ v.label }}
          </button>
        </div>
        <div data-tour="metric">
          <MetricSwitch v-model="metric" />
        </div>
      </div>
      <div class="hud hud-top-right">
        <button type="button" class="btn btn-icon" title="Recadrer la France" @click="resetView">⌂</button>
        <button type="button" class="btn btn-icon" title="Visite guidée" @click="startTour">?</button>
      </div>
      <div class="hud hud-bottom-left">
        <MapLegend :metric="metric" :min="range.min" :max="range.max" />
      </div>
      <Transition name="fade">
        <p v-if="!selected && !hintDismissed" class="hud hud-hint">
          Survolez un département, cliquez pour ouvrir sa fiche
          <button type="button" aria-label="Fermer" @click="hintDismissed = true">✕</button>
        </p>
      </Transition>
    </div>

    <aside class="sidebar">
      <div class="sidebar-scroll">
        <Transition name="swap" mode="out-in">
          <DeptPanel
            v-if="selectedDept"
            :key="selectedDept.code"
            :dept="selectedDept"
            :metric="metric"
            @close="selected = null"
            @select="selected = $event"
          />
          <NationalPanel v-else :metric="metric" @select="selected = $event" />
        </Transition>

        <button v-if="isDemo" type="button" class="cta cta-import" @click="open('import')">
          <span class="cta-kicker">Testez en direct</span>
          <span class="cta-title">Mettre mes propres données sur la carte →</span>
        </button>
        <button type="button" class="cta" @click="open('contact')">
          <span class="cta-kicker">Vous voulez la même chose ?</span>
          <span class="cta-title">Cette carte, connectée à vos outils →</span>
        </button>
      </div>
      <footer class="sidebar-foot">
        <button type="button" class="foot-note" @click="open('data')">
          <template v-if="isDemo">Données fictives · <u>d’où viendraient les vraies ?</u></template>
          <template v-else>Vos données · <u>calculées dans votre navigateur</u></template>
        </button>
        <button type="button" class="btn" @click="exportCsv">
          <span aria-hidden="true">⤓</span> Exporter CSV
        </button>
      </footer>
    </aside>
  </div>
</template>

<script setup lang="ts">
import type { DeptCode, MetricKey } from '~/types/departements'

const VIEWS = [
  { key: '3d', label: '3D', title: 'Carte 3D extrudée' },
  { key: '2d', label: 'Carte', title: 'Fond de carte réel (OpenStreetMap)' },
] as const

const { depts, byCode } = useDepartements()
const { open, track, startTour } = useOverlay()
const { dataset, isDemo } = useDataset()
const toast = useToast()

const map3dRef = ref<{ resetView: () => void } | null>(null)
const map2dRef = ref<{ resetView: () => void } | null>(null)
const view = ref<(typeof VIEWS)[number]['key']>('3d')
const metric = ref<MetricKey>('ca')
const selected = ref<DeptCode | null>(null)
const hintDismissed = ref(false)

const selectedDept = computed(() => (selected.value ? byCode.value.get(selected.value) : undefined))

const range = computed(() => {
  const values = depts.value.map((d) => d[metric.value])
  return values.length ? { min: Math.min(...values), max: Math.max(...values) } : { min: 0, max: 0 }
})

const resetView = () => (view.value === '3d' ? map3dRef.value : map2dRef.value)?.resetView()

const exportCsv = () => {
  downloadCsv(depts.value, isDemo.value ? 'performances-departements.csv' : `carte-${dataset.value.name.replace(/\.csv$/i, '')}.csv`)
  toast.success('Export CSV téléchargé — un tableau par département, prêt pour Excel.')
}

// Chaque exploration compte pour le déclenchement des encarts ; la première sélection ferme l'aide.
watch(metric, track)
watch(view, track)
watch(selected, (code) => {
  if (code) {
    track()
    hintDismissed.value = true
  }
})
// Un nouveau jeu de données repart de la vue nationale.
watch(dataset, () => (selected.value = null))
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  height: 100%;
}

.stage {
  position: relative;
  min-height: 0;
}

.hud {
  position: absolute;
  /* Au-dessus des calques (400) et contrôles (1000) de Leaflet en vue « Carte ». */
  z-index: 1100;
  display: flex;
  gap: 8px;
}

.hud-top-left {
  top: 16px;
  left: 16px;
}

.hud-top-right {
  top: 16px;
  right: 16px;
}

.hud-bottom-left {
  bottom: 16px;
  left: 16px;
}

.hud-hint {
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  align-items: center;
  gap: 10px;
  padding: 8px 8px 8px 14px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.85);
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}

.hud-hint button {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.7);
  font-size: 10px;
}

.hud-hint button:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.view-switch {
  display: inline-flex;
  padding: 4px;
  gap: 2px;
}

.view-item {
  height: 30px;
  padding: 0 12px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  transition: background 0.15s, color 0.15s;
}

.view-item:hover {
  color: var(--text);
}

.view-item.active {
  background: var(--text);
  color: #fff;
}

.sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--bg-elevated);
  border-left: 1px solid var(--border);
}

.sidebar-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 22px 22px 16px;
}

.cta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  margin-top: 12px;
  padding: 14px 16px;
  border-radius: var(--radius);
  text-align: left;
  color: #fff;
  background:
    radial-gradient(circle at 90% 10%, rgba(249, 115, 22, 0.55), transparent 45%),
    linear-gradient(135deg, #1e1b4b, #312e81);
  box-shadow: 0 10px 24px rgba(49, 46, 129, 0.25);
  transition: transform 0.15s, box-shadow 0.15s;
}

.cta:first-of-type {
  margin-top: 22px;
}

.cta-import {
  color: var(--text);
  background: linear-gradient(135deg, #fff7ed, #ffedd5);
  border: 1px solid rgba(249, 115, 22, 0.4);
  box-shadow: none;
}

.cta-import .cta-kicker {
  color: var(--accent-text);
}

.cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(49, 46, 129, 0.32);
}

.cta-import:hover {
  box-shadow: 0 10px 24px rgba(249, 115, 22, 0.2);
}

.cta-kicker {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}

.cta-title {
  font-family: var(--display);
  font-size: 15px;
  font-weight: 700;
}

.sidebar-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 22px;
  border-top: 1px solid var(--border);
}

.foot-note {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 11px;
  color: var(--text-dim);
  text-align: left;
}

.foot-note:hover {
  color: var(--text-muted);
}

.sidebar-foot .btn {
  flex-shrink: 0;
  white-space: nowrap;
}

.swap-enter-active,
.swap-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.swap-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.swap-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(360px, 55vh) minmax(0, 1fr);
  }

  .sidebar {
    border-left: 0;
    border-top: 1px solid var(--border);
  }

  .hud-bottom-left,
  .hud-hint {
    display: none;
  }

  .hud-top-left {
    flex-wrap: wrap;
    right: 100px;
  }
}
</style>
