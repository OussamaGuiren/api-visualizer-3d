<template>
  <div class="switch card" role="radiogroup" aria-label="Indicateur affiché sur la carte">
    <button
      v-for="m in metrics"
      :key="m.key"
      type="button"
      role="radio"
      class="switch-item"
      :class="{ active: m.key === modelValue }"
      :aria-checked="m.key === modelValue"
      :title="m.label"
      @click="emit('update:modelValue', m.key)"
    >
      {{ m.short }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { MetricKey } from '~/types/departements'

const props = defineProps<{ modelValue: MetricKey }>()
const emit = defineEmits<{ 'update:modelValue': [key: MetricKey] }>()

const { metrics } = useMetrics()

// Si l'indicateur courant disparaît (import sans dates), on retombe sur le premier disponible.
watch(metrics, (list) => {
  if (list.length && !list.some((m) => m.key === props.modelValue)) emit('update:modelValue', list[0]!.key)
})
</script>

<style scoped>
.switch {
  display: inline-flex;
  padding: 4px;
  gap: 2px;
}

.switch-item {
  height: 30px;
  padding: 0 12px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  transition: background 0.15s, color 0.15s;
}

.switch-item:hover {
  color: var(--text);
}

.switch-item.active {
  background: var(--accent-soft);
  color: var(--accent-text);
  box-shadow: inset 0 0 0 1px var(--accent-ring);
}
</style>
