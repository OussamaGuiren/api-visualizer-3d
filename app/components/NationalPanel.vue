<template>
  <section class="panel" data-tour="panel">
    <header>
      <p class="eyebrow">Vue nationale</p>
      <h2 class="panel-title">France entière</h2>
      <p class="panel-sub">
        {{ depts.length }} départements · {{ regions.length }} régions
        <template v-if="dataset.stats"> · {{ formatInt(dataset.stats.matched) }} lignes importées</template>
      </p>
    </header>

    <div class="grid">
      <KpiTile :label="def('ca').label" :value="formatValue(national.ca, 'ca')" size="lg" tone="accent" />
      <KpiTile :label="def('clients').label" :value="formatInt(national.clients)" size="lg" />
      <KpiTile
        v-if="has('evolution')"
        label="Évolution annuelle"
        :value="`${formatSigned(national.evolution)} %`"
        :tone="national.evolution >= 0 ? 'positive' : 'negative'"
        hint="pondérée par le volume"
      />
      <KpiTile v-else :label="def('panier').label" :value="formatValue(national.panier, 'panier')" />
      <KpiTile
        v-if="dataset.hasObjectif"
        label="Atteinte de l’objectif"
        :value="formatPercent(national.atteinte)"
        :tone="national.atteinte >= 1 ? 'positive' : 'negative'"
      />
      <KpiTile v-else label="Départements couverts" :value="`${covered} / ${depts.length}`" hint="au moins une ligne" />
    </div>

    <div>
      <div class="list-head">
        <span class="eyebrow">Top 5 · {{ def(metric).label }}</span>
        <span class="list-hint">cliquer pour zoomer</span>
      </div>
      <ol class="ranking">
        <li v-for="(d, i) in ranking" :key="d.code">
          <button type="button" class="row" @click="emit('select', d.code)">
            <span class="rank num">{{ i + 1 }}</span>
            <span class="row-name">{{ d.nom }} <span class="row-code num">{{ d.code }}</span></span>
            <span class="row-bar"><span :style="{ width: `${barWidth(d)}%` }" /></span>
            <span class="row-value num">{{ format(d, metric) }}</span>
          </button>
        </li>
      </ol>
    </div>

    <div>
      <div class="list-head">
        <span class="eyebrow">Régions · poids dans le total</span>
      </div>
      <ul class="regions">
        <li v-for="r in regions" :key="r.region" class="region-row">
          <span class="region-name">{{ r.region }}</span>
          <span class="row-bar"><span :style="{ width: `${(r.ca / (regions[0]?.ca || 1)) * 100}%` }" /></span>
          <span class="row-value num">{{ formatPercent(national.ca ? r.ca / national.ca : 0) }}</span>
        </li>
      </ul>
    </div>

    <p v-if="!isDemo" class="hint">
      Cliquez un département pour sa fiche. Les recommandations s’appuient sur le rang, le poids régional
      <template v-if="has('evolution')">et l’évolution</template>.
    </p>
  </section>
</template>

<script setup lang="ts">
import type { Dept, DeptCode, MetricKey } from '~/types/departements'

const props = defineProps<{ metric: MetricKey }>()
const emit = defineEmits<{ select: [code: DeptCode] }>()

const { depts, national, regions, top } = useDepartements()
const { def, format, formatValue } = useMetrics()
const { dataset, isDemo } = useDataset()

const has = (key: MetricKey) => dataset.value.metrics.includes(key)
const ranking = computed(() => top(props.metric, 5))
const covered = computed(() => depts.value.filter((d) => d.ca > 0 || d.clients > 0).length)

const barWidth = (d: Dept): number => {
  const max = Math.max(...ranking.value.map((r) => Math.abs(r[props.metric]))) || 1
  return (Math.abs(d[props.metric]) / max) * 100
}
</script>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.panel-title {
  margin-top: 2px;
  font-family: var(--display);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.panel-sub {
  font-size: 12px;
  color: var(--text-muted);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.list-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.list-hint {
  font-size: 11px;
  color: var(--text-dim);
}

.ranking,
.regions {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.row,
.region-row {
  display: grid;
  grid-template-columns: 22px minmax(0, 1.5fr) 1fr auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
  text-align: left;
}

.region-row {
  grid-template-columns: minmax(0, 1.5fr) 1fr auto;
}

.row {
  transition: background 0.15s;
}

.row:hover {
  background: var(--hover-bg);
}

.rank {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--accent-soft);
  color: var(--accent-text);
  font-size: 11px;
  font-weight: 600;
}

.row-name,
.region-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.row-code {
  color: var(--text-dim);
  font-size: 11px;
}

.row-bar {
  height: 5px;
  border-radius: 999px;
  background: var(--track);
  overflow: hidden;
}

.row-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--bar);
}

.row-value {
  color: var(--text-muted);
  white-space: nowrap;
}

.hint {
  font-size: 12px;
  color: var(--text-dim);
}
</style>
