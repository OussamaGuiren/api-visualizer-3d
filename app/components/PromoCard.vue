<template>
  <Transition name="promo">
    <aside v-if="message" class="promo" role="complementary" aria-label="Encart">
      <span class="promo-label">Encart · {{ message.kicker }}</span>
      <button type="button" class="promo-close" aria-label="Fermer" @click="dismiss">✕</button>
      <p class="promo-title">{{ message.title }}</p>
      <p class="promo-text">{{ message.text }}</p>
      <div class="promo-actions">
        <button type="button" class="btn btn-primary" @click="contact">{{ message.cta }}</button>
        <button type="button" class="btn btn-ghost" @click="dismiss">Plus tard</button>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
/**
 * Encart promotionnel façon page de magazine : apparaît après un délai ou un
 * certain nombre d'interactions, au plus `maxPerSession` fois par session.
 */
const { promo } = useAppConfig()
const { open, interactions, current, tourStep } = useOverlay()

const MESSAGES = [
  {
    kicker: 'Sur mesure',
    title: 'Vous aimeriez la même carte pour votre activité ?',
    text: 'Magasins, livraisons, patients, campagnes : tout ce qui a une adresse peut se lire comme ça. En quelques semaines, avec vos données.',
    cta: 'Discutons-en',
  },
  {
    kicker: 'Vos données',
    title: 'Elle tourne déjà avec un fichier Excel.',
    text: 'Pas besoin d’un entrepôt de données : un export de votre CRM suffit pour une première version.',
    cta: 'Voir comment',
  },
]

const SESSION_KEY = 'atlas-promo-shown'

const shown = ref(0)
const message = ref<(typeof MESSAGES)[number] | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

const canShow = () => shown.value < Math.min(promo.maxPerSession, MESSAGES.length) && !message.value

const show = () => {
  if (!canShow()) return
  // Jamais par-dessus une modale ou la visite guidée : on réessaie un peu plus tard.
  if (current.value !== null || tourStep.value >= 0) {
    clearTimeout(timer)
    timer = setTimeout(show, 15_000)
    return
  }
  message.value = MESSAGES[shown.value] ?? null
  shown.value++
  try {
    sessionStorage.setItem(SESSION_KEY, String(shown.value))
  } catch {
    /* stockage indisponible : l'encart pourra réapparaître après rechargement */
  }
}

const dismiss = () => {
  message.value = null
  // Le second encart attend un nouveau cycle d'interactions ou un nouveau délai.
  clearTimeout(timer)
  timer = setTimeout(show, promo.firstDelayMs * 2.5)
}

const contact = () => {
  message.value = null
  clearTimeout(timer)
  open(shown.value >= 2 ? 'data' : 'contact')
}

onMounted(() => {
  try {
    shown.value = Number(sessionStorage.getItem(SESSION_KEY) ?? 0)
  } catch {
    shown.value = 0
  }
  timer = setTimeout(show, promo.firstDelayMs)
})

onBeforeUnmount(() => clearTimeout(timer))

watch(interactions, (count) => {
  if (count > 0 && count % promo.interactionsThreshold === 0) show()
})
</script>

<style scoped>
.promo {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1150;
  width: min(360px, calc(100vw - 32px));
  padding: 18px 18px 16px;
  border-radius: var(--radius);
  background: #fff;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.promo::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 4px;
  background: linear-gradient(90deg, var(--accent), var(--violet), var(--info));
}

.promo-label {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.promo-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  color: var(--text-dim);
}

.promo-close:hover {
  background: var(--hover-bg);
  color: var(--text);
}

.promo-title {
  margin-top: 8px;
  font-family: var(--display);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.promo-text {
  margin-top: 6px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-muted);
}

.promo-actions {
  display: flex;
  gap: 6px;
  margin-top: 14px;
}

.promo-enter-active {
  transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.2, 1.1), opacity 0.3s ease;
}

.promo-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.promo-enter-from,
.promo-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.98);
}
</style>
