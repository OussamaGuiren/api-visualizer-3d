<template>
  <div class="shell">
    <header class="header">
      <div class="brand">
        <div class="logo" aria-hidden="true">OG</div>
        <div>
          <h1 class="title">Atlas Commercial</h1>
          <p class="subtitle">Vos indicateurs, lus sur une carte</p>
        </div>
      </div>

      <div class="dataset" :class="{ custom: !isDemo }">
        <span class="dataset-dot" aria-hidden="true" />
        <span class="dataset-name">{{ dataset.name }}</span>
        <button v-if="!isDemo" type="button" class="dataset-reset" @click="backToDemo">Revenir à la démo</button>
      </div>

      <nav class="nav" aria-label="Sections">
        <NuxtLink to="/" class="btn btn-ghost nav-link" active-class="active" :class="{ active: route.path === '/' }">Démo</NuxtLink>
        <NuxtLink to="/usages" class="btn btn-ghost nav-link" active-class="active">À quoi ça sert</NuxtLink>
        <button type="button" class="btn btn-ghost" @click="open('intro')">Présentation</button>
        <button type="button" class="btn btn-ghost" @click="open('usecases')">Cas d’usage</button>
        <button type="button" class="btn btn-ghost" @click="open('data')">Données</button>
        <button type="button" class="btn nav-import" data-tour="import" @click="open('import')">
          <span aria-hidden="true">⤓</span> Tester mes données
        </button>
        <button type="button" class="btn btn-primary" @click="open('contact')">Me contacter</button>
      </nav>
    </header>

    <main class="main">
      <NuxtPage />
    </main>

    <IntroModal
      :open="current === 'intro'"
      @close="closeIntro"
      @usecases="open('usecases')"
      @data="open('data')"
      @import="open('import')"
      @tour="beginTour"
    />
    <UseCasesModal :open="current === 'usecases'" @close="close" @contact="open('contact')" />
    <DataSourcesModal :open="current === 'data'" @close="close" @contact="open('contact')" @import="open('import')" />
    <ImportModal :open="current === 'import'" @close="close" />
    <ContactModal :open="current === 'contact'" @close="close" />
    <GuidedTour ref="tour" />
    <PromoCard />
    <ToastHost />
  </div>
</template>

<script setup lang="ts">
const INTRO_KEY = 'atlas-intro-seen'

const { current, open, close, startTour } = useOverlay()
const { dataset, isDemo, reset, restore } = useDataset()
const toast = useToast()
const route = useRoute()
const tour = ref<{ neverDone: () => boolean } | null>(null)

// Indicateurs chargés une fois côté serveur (SSR) puis partagés à tous les composants.
await callOnce(loadDepartements)

onMounted(() => {
  // Un import précédent est conservé dans le navigateur du visiteur.
  restore()
  // La présentation ne s'impose qu'à la première visite de la démo ; le bouton « Présentation » la rouvre.
  if (route.path !== '/') return
  try {
    if (localStorage.getItem(INTRO_KEY) !== '1') open('intro')
  } catch {
    open('intro')
  }
})

// La visite guidée cible les éléments de la démo : on s'y rend d'abord si besoin.
const beginTour = async () => {
  try {
    localStorage.setItem(INTRO_KEY, '1')
  } catch {
    /* ignoré */
  }
  if (route.path !== '/') await navigateTo('/')
  startTour()
}

const closeIntro = () => {
  const first = (() => {
    try {
      return localStorage.getItem(INTRO_KEY) !== '1'
    } catch {
      return false
    }
  })()
  close()
  try {
    localStorage.setItem(INTRO_KEY, '1')
  } catch {
    /* stockage indisponible : la modale se réaffichera à la prochaine visite */
  }
  // Première visite : on enchaîne sur la visite guidée, sauf si elle a déjà été faite.
  if (first && tour.value?.neverDone()) setTimeout(startTour, 400)
}

const backToDemo = () => {
  const previous = dataset.value
  reset()
  toast.info('Retour à la démo.', { label: 'Annuler', run: () => useDataset().apply(previous) })
}
</script>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  flex: 0 0 var(--header-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 20px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.35);
}

.title {
  font-family: var(--display);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.subtitle {
  font-size: 12px;
  color: var(--text-muted);
}

.dataset {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 12px 0 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--tile-bg);
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

.dataset.custom {
  border-color: rgba(5, 150, 105, 0.35);
  background: #ecfdf5;
  color: var(--positive);
}

.dataset-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-dim);
}

.dataset.custom .dataset-dot {
  background: var(--positive);
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.2);
}

.dataset-name {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.dataset-reset {
  padding: 2px 8px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid rgba(5, 150, 105, 0.35);
  font-size: 11px;
  font-weight: 600;
  color: var(--positive);
}

.dataset-reset:hover {
  background: var(--positive);
  color: #fff;
}

.nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  text-decoration: none;
}

.nav-link.active {
  color: var(--text);
  background: var(--hover-bg);
}

.nav-import {
  border-color: rgba(249, 115, 22, 0.45);
  color: var(--accent-text);
  background: var(--accent-soft);
}

.nav-import:hover {
  border-color: var(--accent);
}

.main {
  flex: 1;
  min-height: 0;
}

@media (max-width: 1240px) {
  .dataset-name {
    max-width: 120px;
  }

  /* Les modales restent accessibles via la page « À quoi ça sert » et le « ? » de la carte. */
  .nav .btn-ghost:not(.nav-link) {
    display: none;
  }
}

@media (max-width: 900px) {
  .nav-link {
    display: none;
  }
}

@media (max-width: 720px) {
  .subtitle,
  .dataset {
    display: none;
  }

  .nav-import span {
    display: none;
  }
}
</style>
