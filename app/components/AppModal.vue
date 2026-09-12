<template>
  <Transition name="modal">
    <div v-if="open" class="overlay" @click.self="emit('close')">
      <div class="modal card" :class="`modal-${size}`" role="dialog" aria-modal="true" :aria-label="label">
        <button type="button" class="close btn btn-ghost btn-icon" aria-label="Fermer" @click="emit('close')">✕</button>
        <slot />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ open: boolean; label: string; size?: 'md' | 'lg' }>(), { size: 'md' })
const emit = defineEmits<{ close: [] }>()

// Échap ferme la modale ouverte.
const onKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.open) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--overlay);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.modal {
  position: relative;
  width: 100%;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: var(--surface-strong);
  box-shadow: var(--shadow);
}

.modal-md {
  max-width: 760px;
}

.modal-lg {
  max-width: 960px;
}

.close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.22s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(12px) scale(0.98);
}
</style>
