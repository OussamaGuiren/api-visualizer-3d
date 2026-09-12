<template>
  <div class="kpi" :class="[`kpi-${size}`]">
    <span class="kpi-label">{{ label }}</span>
    <span class="kpi-value num" :class="tone && `kpi-${tone}`">{{ value }}</span>
    <span v-if="hint" class="kpi-hint">{{ hint }}</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string
    hint?: string
    tone?: 'positive' | 'negative' | 'accent'
    size?: 'md' | 'lg'
  }>(),
  { hint: undefined, tone: undefined, size: 'md' },
)
</script>

<style scoped>
.kpi {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--tile-bg);
  border: 1px solid var(--border);
  min-width: 0;
}

.kpi-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-value {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
}

.kpi-lg .kpi-value {
  font-size: 26px;
}

.kpi-hint {
  font-size: 11px;
  color: var(--text-dim);
}

.kpi-positive {
  color: var(--positive);
}

.kpi-negative {
  color: var(--negative);
}

.kpi-accent {
  color: var(--accent-text);
}
</style>
