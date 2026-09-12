<template>
  <div class="legend card">
    <div class="legend-title">
      <span class="eyebrow">{{ def.label }}</span>
      <span v-if="def.unit" class="legend-unit">{{ def.unit }}</span>
    </div>
    <div class="legend-bar" :style="{ background: gradient }" />
    <div class="legend-scale num">
      <span>{{ def.format(min) }}</span>
      <span v-if="def.signed">0</span>
      <span>{{ def.format(max) }}</span>
    </div>
    <p class="legend-hint">Hauteur et couleur proportionnelles à l’indicateur</p>
  </div>
</template>

<script setup lang="ts">
import type { MetricKey } from '~/types/departements'
import { cssGradient } from '~/three/palette'

const props = defineProps<{ metric: MetricKey; min: number; max: number }>()

const { def: metricOf } = useMetrics()
const def = computed(() => metricOf(props.metric))
const gradient = computed(() => cssGradient(def.value.signed))
</script>

<style scoped>
.legend {
  width: 220px;
  padding: 12px 14px;
}

.legend-title {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.legend-unit {
  font-size: 11px;
  color: var(--text-dim);
}

.legend-bar {
  height: 8px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
}

.legend-scale {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: var(--text-muted);
}

.legend-hint {
  margin-top: 8px;
  font-size: 11px;
  color: var(--text-dim);
}
</style>
