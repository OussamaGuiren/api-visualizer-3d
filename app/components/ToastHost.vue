<template>
  <div class="toasts" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="`toast-${t.tone}`" role="status">
        <span class="toast-icon" aria-hidden="true">{{ ICONS[t.tone] }}</span>
        <span class="toast-text">{{ t.message }}</span>
        <button v-if="t.action" type="button" class="toast-action" @click="run(t)">{{ t.action.label }}</button>
        <button type="button" class="toast-close" aria-label="Fermer" @click="dismiss(t.id)">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import type { Toast } from '~/composables/useToast'

const { toasts, dismiss } = useToast()

const ICONS: Record<Toast['tone'], string> = { info: 'ℹ', success: '✓', error: '!' }

const run = (t: Toast) => {
  t.action?.run()
  dismiss(t.id)
}
</script>

<style scoped>
.toasts {
  position: fixed;
  left: 50%;
  bottom: 20px;
  z-index: 1300;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transform: translateX(-50%);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 280px;
  max-width: min(520px, calc(100vw - 32px));
  padding: 10px 12px 10px 14px;
  border-radius: 10px;
  background: #0f172a;
  color: #fff;
  font-size: 13px;
  box-shadow: var(--shadow);
  pointer-events: auto;
}

.toast-icon {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.15);
}

.toast-success .toast-icon {
  background: var(--positive);
}

.toast-error .toast-icon {
  background: var(--negative);
}

.toast-text {
  flex: 1;
}

.toast-action {
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
  color: #fdba74;
}

.toast-action:hover {
  background: rgba(255, 255, 255, 0.1);
}

.toast-close {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
}

.toast-close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
