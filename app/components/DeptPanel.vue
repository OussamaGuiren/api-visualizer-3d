<template>
  <section class="panel" data-tour="panel">
    <header class="panel-head">
      <div>
        <p class="eyebrow">{{ dept.region }}</p>
        <h2 class="panel-title">
          <span class="code num">{{ dept.code }}</span>
          {{ dept.nom }}
        </h2>
      </div>
      <button type="button" class="btn btn-ghost btn-icon" title="Revenir à la vue nationale" @click="emit('close')">
        ✕
      </button>
    </header>

    <div class="tags">
      <span class="tag tag-accent">{{ segment }}</span>
      <span v-if="has('evolution')" class="tag" :class="dept.evolution >= 0 ? 'tag-positive' : 'tag-negative'">
        {{ formatSigned(dept.evolution) }} % sur un an
      </span>
      <span class="tag">{{ rankLabel }}</span>
    </div>

    <div class="grid">
      <KpiTile :label="def('ca').label" :value="format(dept, 'ca')" size="lg" tone="accent" />
      <KpiTile :label="def('clients').label" :value="formatInt(dept.clients)" size="lg" />
      <KpiTile :label="def('panier').label" :value="format(dept, 'panier')" />
      <KpiTile
        v-if="dataset.hasObjectif"
        label="Atteinte de l’objectif"
        :value="formatPercent(dept.atteinte)"
        :hint="`objectif ${formatValue(dept.objectif, 'ca')}`"
        :tone="dept.atteinte >= 1 ? 'positive' : 'negative'"
      />
      <KpiTile v-else label="Part du total national" :value="formatPercent(share)" :hint="`${dept.rang}ᵉ sur ${depts.length}`" />
    </div>

    <div v-if="dataset.hasObjectif" class="objective">
      <div class="objective-head">
        <span>Progression vers l’objectif</span>
        <span class="num">{{ def('ca').format(dept.ca) }} / {{ formatValue(dept.objectif, 'ca') }}</span>
      </div>
      <div class="objective-track">
        <div class="objective-fill" :class="{ over: dept.atteinte >= 1 }" :style="{ width: `${Math.min(dept.atteinte, 1) * 100}%` }" />
      </div>
    </div>

    <p class="insight">{{ insight }}</p>

    <div v-if="region" class="region">
      <div class="region-head">
        <span class="eyebrow">Poids dans la région</span>
        <span class="num region-share">{{ formatPercent(region.ca ? dept.ca / region.ca : 0) }} du total</span>
      </div>
      <ul class="siblings">
        <li v-for="s in siblingsSorted" :key="s.code">
          <button type="button" class="sibling" @click="emit('select', s.code)">
            <span class="sibling-name"><span class="code num">{{ s.code }}</span>{{ s.nom }}</span>
            <span class="sibling-bar"><span :style="{ width: `${(Math.abs(s[metric]) / maxSibling) * 100}%` }" /></span>
            <span class="sibling-value num">{{ format(s, metric) }}</span>
          </button>
        </li>
      </ul>
    </div>

    <MarketplacePanel v-if="isDemo" :dept="dept" />
  </section>
</template>

<script setup lang="ts">
import type { Dept, DeptCode, MetricKey } from '~/types/departements'

const props = defineProps<{ dept: Dept; metric: MetricKey }>()
const emit = defineEmits<{ close: []; select: [code: DeptCode] }>()

const { depts, national, regionOf, siblings, rankOn } = useDepartements()
const { def, format, formatValue } = useMetrics()
const { dataset, isDemo } = useDataset()

const has = (key: MetricKey) => dataset.value.metrics.includes(key)

const region = computed(() => regionOf(props.dept))
const share = computed(() => (national.value.ca ? props.dept.ca / national.value.ca : 0))

const siblingsSorted = computed(() => siblings(props.dept).sort((a, b) => b[props.metric] - a[props.metric]))
const maxSibling = computed(
  () => Math.max(Math.abs(props.dept[props.metric]), ...siblingsSorted.value.map((s) => Math.abs(s[props.metric]))) || 1,
)

/** Segment par rang national : valable quelle que soit l'unité des données. */
const segment = computed(() => {
  const ratio = props.dept.rang / (depts.value.length || 1)
  if (props.dept.ca <= 0 && props.dept.clients <= 0) return 'Aucune activité'
  if (ratio <= 0.1) return 'Territoire majeur'
  if (ratio <= 0.3) return 'Territoire clé'
  if (ratio <= 0.6) return 'Territoire à potentiel'
  return 'Territoire secondaire'
})

const rankLabel = computed(() => `${rankOn(props.dept, props.metric)}ᵉ / ${depts.value.length} · ${def(props.metric).short}`)

const insight = computed(() => {
  const d = props.dept
  if (d.ca <= 0 && d.clients <= 0) {
    return 'Aucune ligne rattachée à ce département dans le jeu de données courant : zone blanche à explorer, ou données manquantes.'
  }
  const parts: string[] = []
  if (dataset.value.hasObjectif) {
    const gap = d.ca - d.objectif
    parts.push(
      gap >= 0
        ? `L’objectif annuel est dépassé de ${formatValue(gap, 'ca')}`
        : `Il manque ${formatValue(-gap, 'ca')} pour atteindre l’objectif annuel`,
    )
  } else {
    parts.push(`Ce département pèse ${formatPercent(share.value)} du total national${region.value ? ` et ${formatPercent(d.ca / (region.value.ca || 1))} de sa région` : ''}`)
  }
  if (has('evolution')) {
    parts.push(
      d.evolution >= 8
        ? 'sur une dynamique de forte croissance'
        : d.evolution >= 0
          ? 'avec une activité en progression modérée'
          : 'dans un contexte de recul de l’activité',
    )
  }
  const ratio = d.rang / (depts.value.length || 1)
  const priorite =
    ratio <= 0.3
      ? 'Territoire à sécuriser : forte contribution au total.'
      : has('evolution') && d.evolution >= 8
        ? 'Territoire à accélérer : la croissance justifie un renfort.'
        : dataset.value.hasObjectif && d.atteinte < 0.9
          ? 'Territoire à redresser : plan d’action à prioriser.'
          : ratio > 0.7
            ? 'Territoire peu exploité : potentiel à qualifier.'
            : 'Territoire à consolider : maintenir le niveau de service.'
  return `${parts.join(', ')}. ${priorite}`
})
</script>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
  font-family: var(--display);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.code {
  display: inline-grid;
  place-items: center;
  min-width: 34px;
  height: 24px;
  padding: 0 6px;
  border-radius: 6px;
  background: var(--accent-soft);
  color: var(--accent-text);
  font-size: 12px;
  font-weight: 600;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.objective-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.objective-track {
  height: 8px;
  border-radius: 999px;
  background: var(--track);
  overflow: hidden;
}

.objective-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--bar);
  transition: width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.objective-fill.over {
  background: linear-gradient(90deg, #7c3aed, var(--positive));
}

.insight {
  padding: 12px 14px;
  border-left: 3px solid var(--accent);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: var(--accent-soft);
  font-size: 13px;
  line-height: 1.55;
  color: var(--text-muted);
}

.region-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.region-share {
  font-size: 12px;
  color: var(--text-muted);
}

.siblings {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sibling {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) 1fr auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
  text-align: left;
  transition: background 0.15s;
}

.sibling:hover {
  background: var(--hover-bg);
}

.sibling-name {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sibling-name .code {
  min-width: 28px;
  height: 20px;
  font-size: 11px;
}

.sibling-bar {
  height: 5px;
  border-radius: 999px;
  background: var(--track);
  overflow: hidden;
}

.sibling-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--bar);
}

.sibling-value {
  color: var(--text-muted);
  white-space: nowrap;
}
</style>
