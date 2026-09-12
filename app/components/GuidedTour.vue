<template>
  <Teleport to="body">
    <div v-if="current" class="tour" role="dialog" aria-label="Visite guidée">
      <!-- Quatre voiles autour de la cible : plus fiable qu'une ombre géante. -->
      <div v-for="(veil, i) in veils" :key="i" class="veil" :style="veil" />
      <div class="spot" :style="spotStyle" />
      <div class="card" :style="cardStyle">
        <p class="tour-step">Étape {{ tourStep + 1 }} / {{ STEPS.length }}</p>
        <p class="tour-title">{{ current.title }}</p>
        <p class="tour-text">{{ current.text }}</p>
        <div class="tour-actions">
          <button type="button" class="btn btn-ghost" @click="stop">Passer</button>
          <button type="button" class="btn btn-primary" @click="next">
            {{ tourStep === STEPS.length - 1 ? 'Terminer' : 'Suivant →' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Visite guidée : met en lumière tour à tour les zones de l'interface
 * (repérées par `data-tour="…"`) avec une explication courte.
 */
const TOUR_KEY = 'atlas-tour-done'

const STEPS = [
  {
    target: 'metric',
    title: 'Choisissez ce que vous regardez',
    text: 'Chiffre d’affaires, clients, panier moyen, évolution : la hauteur et la couleur de chaque département suivent l’indicateur choisi.',
  },
  {
    target: 'map',
    title: 'Explorez la carte',
    text: 'Glissez pour tourner, molette pour zoomer. Survolez un département pour sa valeur, cliquez-le pour ouvrir sa fiche.',
  },
  {
    target: 'view',
    title: 'Deux façons de voir',
    text: '« 3D » pour la lecture d’ensemble, « Carte » pour un fond géographique réel avec routes et villes.',
  },
  {
    target: 'panel',
    title: 'La fiche du territoire',
    text: 'Indicateurs, objectif, rang, poids dans la région et une recommandation. Les départements voisins de la même région s’allument.',
  },
  {
    target: 'import',
    title: 'Testez avec vos données',
    text: 'Glissez un export CSV : la carte affiche vos chiffres, sans rien envoyer sur un serveur. Un fichier d’exemple est fourni.',
  },
] as const

const { tourStep } = useOverlay()

const current = computed(() => (tourStep.value >= 0 ? STEPS[tourStep.value] : null))
const rect = ref<DOMRect | null>(null)

const measure = () => {
  if (!current.value) return
  const el = document.querySelector<HTMLElement>(`[data-tour="${current.value.target}"]`)
  rect.value = el?.getBoundingClientRect() ?? null
}

const PAD = 8
const spotStyle = computed(() => {
  const r = rect.value
  if (!r) return { display: 'none' }
  return { left: `${r.left - PAD}px`, top: `${r.top - PAD}px`, width: `${r.width + PAD * 2}px`, height: `${r.height + PAD * 2}px` }
})

const veils = computed(() => {
  const r = rect.value
  if (!r) return [{ inset: '0' }]
  const top = r.top - PAD
  const bottom = r.bottom + PAD
  const left = r.left - PAD
  const right = r.right + PAD
  return [
    { left: '0', top: '0', right: '0', height: `${Math.max(top, 0)}px` },
    { left: '0', top: `${bottom}px`, right: '0', bottom: '0' },
    { left: '0', top: `${top}px`, width: `${Math.max(left, 0)}px`, height: `${bottom - top}px` },
    { left: `${right}px`, top: `${top}px`, right: '0', height: `${bottom - top}px` },
  ]
})

const cardStyle = computed(() => {
  const r = rect.value
  const width = 340
  if (!r) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  const vw = window.innerWidth
  const vh = window.innerHeight
  // Sous la cible si possible, sinon au-dessus ; à gauche si la cible est à droite.
  let left = Math.min(Math.max(r.left, 12), vw - width - 12)
  if (r.left > vw / 2) left = Math.max(12, r.right - width)
  const below = r.bottom + 14
  const top = below + 220 < vh ? below : Math.max(12, r.top - 14 - 200)
  return { left: `${left}px`, top: `${top}px`, width: `${width}px` }
})

const finish = () => {
  tourStep.value = -1
  try {
    localStorage.setItem(TOUR_KEY, '1')
  } catch {
    /* ignoré */
  }
}

const stop = finish
const next = () => {
  if (tourStep.value >= STEPS.length - 1) finish()
  else tourStep.value++
}

watch(tourStep, async () => {
  await nextTick()
  measure()
})

onMounted(() => {
  window.addEventListener('resize', measure)
  window.addEventListener('scroll', measure, true)
  measure()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measure)
  window.removeEventListener('scroll', measure, true)
})

/** Vrai si la visite n'a jamais été terminée sur ce navigateur. */
defineExpose({
  neverDone: () => {
    try {
      return localStorage.getItem(TOUR_KEY) !== '1'
    } catch {
      return false
    }
  },
})
</script>

<style scoped>
.tour {
  position: fixed;
  inset: 0;
  z-index: 1250;
  pointer-events: none;
}

.veil {
  position: absolute;
  background: rgba(15, 23, 42, 0.55);
  pointer-events: auto;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.spot {
  position: absolute;
  border-radius: 12px;
  box-shadow: 0 0 0 2px var(--accent), 0 0 24px rgba(249, 115, 22, 0.45);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.card {
  position: absolute;
  padding: 16px 18px;
  border-radius: var(--radius);
  background: #fff;
  box-shadow: var(--shadow);
  pointer-events: auto;
  transition: left 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.tour-step {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-text);
}

.tour-title {
  margin-top: 4px;
  font-family: var(--display);
  font-size: 16px;
  font-weight: 700;
}

.tour-text {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-muted);
}

.tour-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 14px;
}
</style>
