<template>
  <div class="flow card" @mouseenter="paused = true" @mouseleave="paused = false">
    <div class="flow-head">
      <div>
        <p class="flow-kicker">Le parcours d’une donnée</p>
        <h3 class="flow-title">{{ current.headline }}</h3>
        <p class="flow-text">{{ current.text }}</p>
      </div>
      <div class="flow-stepper" role="tablist" aria-label="Étapes">
        <button
          v-for="(s, i) in STEPS"
          :key="s.key"
          type="button"
          role="tab"
          class="step"
          :class="{ active: i === step, done: i < step }"
          :aria-selected="i === step"
          @click="go(i)"
        >
          <span class="step-num num">{{ i + 1 }}</span>
          <span class="step-label">{{ s.label }}</span>
          <span v-if="i === step" class="step-progress" :style="{ animationDuration: `${INTERVAL}ms`, animationPlayState: paused ? 'paused' : 'running' }" />
        </button>
      </div>
    </div>

    <svg viewBox="0 0 1200 500" class="flow-svg" :class="`focus-${current.key}`" role="img" aria-labelledby="flow-title">
      <title id="flow-title">Vos sources alimentent un moteur qui rattache et agrège, puis une carte qui se lit en trois questions et conduit à une décision.</title>
      <defs>
        <linearGradient id="pf-engine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#3b82f6" />
          <stop offset="0.55" stop-color="#7c3aed" />
          <stop offset="1" stop-color="#f97316" />
        </linearGradient>
        <linearGradient id="pf-bar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#3b82f6" />
          <stop offset="1" stop-color="#7c3aed" />
        </linearGradient>
        <linearGradient id="pf-bar-hot" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#f97316" />
          <stop offset="1" stop-color="#fb923c" />
        </linearGradient>
        <filter id="pf-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.10" />
        </filter>
        <filter id="pf-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <!-- ===== Connecteurs sources → moteur ===== -->
      <g class="zone zone-sources zone-engine">
        <path v-for="(s, i) in SOURCES" :key="s.label" :d="sourcePath(i)" class="link" />
        <circle v-for="(s, i) in SOURCES" :key="`p-${s.label}`" r="4" class="packet">
          <animateMotion :dur="`${2.6 + i * 0.35}s`" repeatCount="indefinite" :begin="`${i * 0.5}s`" :path="sourcePath(i)" />
        </circle>
      </g>

      <!-- ===== Sources ===== -->
      <g class="zone zone-sources">
        <text x="40" y="52" class="zone-title">VOS SOURCES</text>
        <g v-for="(s, i) in SOURCES" :key="s.label" :transform="`translate(40, ${sourceY(i)})`" class="source">
          <rect width="230" height="56" rx="12" class="source-box" />
          <circle cx="30" cy="28" r="16" :fill="s.color" />
          <text x="30" y="33" text-anchor="middle" font-size="15">{{ s.icon }}</text>
          <text x="58" y="25" class="source-label">{{ s.label }}</text>
          <text x="58" y="42" class="source-sub">{{ s.sub }}</text>
        </g>
      </g>

      <!-- ===== Moteur ===== -->
      <g class="zone zone-engine" transform="translate(470, 120)">
        <circle cx="130" cy="130" r="150" class="engine-halo" />
        <rect x="0" y="0" width="260" height="260" rx="24" class="engine-box" />
        <rect x="0" y="0" width="260" height="6" rx="3" fill="url(#pf-engine)" />
        <text x="130" y="42" text-anchor="middle" class="engine-title">Le moteur</text>
        <text x="130" y="62" text-anchor="middle" class="engine-sub">dans votre navigateur, ou sur votre serveur</text>
        <g v-for="(r, i) in ENGINE" :key="r.title" :transform="`translate(24, ${92 + i * 52})`" class="engine-row" :class="{ lit: r.step === current.key }">
          <rect x="0" y="0" width="212" height="40" rx="10" class="engine-row-box" />
          <circle cx="20" cy="20" r="9" class="engine-dot" />
          <path d="M15 20 l4 4 l7 -8" class="engine-check" />
          <text x="38" y="18" class="engine-row-title">{{ r.title }}</text>
          <text x="38" y="32" class="engine-row-sub">{{ r.sub }}</text>
        </g>
      </g>

      <!-- ===== Connecteur moteur → carte ===== -->
      <g class="zone zone-engine zone-map">
        <path :d="ENGINE_TO_MAP" class="link link-main" />
        <circle v-for="i in 3" :key="`m-${i}`" r="5" class="packet packet-main">
          <animateMotion dur="2.2s" repeatCount="indefinite" :begin="`${(i - 1) * 0.7}s`" :path="ENGINE_TO_MAP" />
        </circle>
      </g>

      <!-- ===== Carte ===== -->
      <g class="zone zone-map" transform="translate(800, 40)">
        <text x="0" y="12" class="zone-title">LA CARTE</text>
        <rect x="0" y="26" width="360" height="350" rx="20" class="map-box" />
        <g transform="translate(26, 44) scale(0.86)">
          <path :d="FRANCE_PATH" class="france" />
          <g v-for="b in BARS" :key="b.name" :transform="`translate(${b.x}, ${b.y})`" class="bar-group">
            <ellipse cx="0" cy="0" rx="9" ry="3.5" class="bar-base" />
            <rect x="-7" :y="-b.h" width="14" :height="b.h" rx="3" :fill="b.hot ? 'url(#pf-bar-hot)' : 'url(#pf-bar)'" class="bar" :style="{ animationDelay: `${b.delay}s` }" />
            <text x="12" :y="-b.h + 4" class="bar-label">{{ b.name }}</text>
          </g>
        </g>
        <!-- Lectures -->
        <g transform="translate(20, 322)" class="reads">
          <g v-for="(r, i) in READS" :key="r.label" :transform="`translate(${i * 108}, 0)`" class="read" :class="{ lit: current.key === 'lectures' }">
            <rect width="100" height="40" rx="10" class="read-box" />
            <circle cx="16" cy="20" r="6" :fill="r.color" />
            <text x="30" y="24" class="read-label">{{ r.label }}</text>
          </g>
        </g>
      </g>

      <!-- ===== Décision ===== -->
      <g class="zone zone-decision" transform="translate(800, 404)">
        <path d="M180 -22 V16" class="link" />
        <g v-for="(d, i) in DECISIONS" :key="d.label" :transform="`translate(${i * 122}, 20)`" class="decision">
          <rect width="114" height="52" rx="12" class="decision-box" :style="{ animationDelay: `${i * 0.25}s` }" />
          <text x="57" y="22" text-anchor="middle" font-size="16">{{ d.icon }}</text>
          <text x="57" y="42" text-anchor="middle" class="decision-label">{{ d.label }}</text>
        </g>
      </g>

      <!-- ===== Repère bas gauche ===== -->
      <g class="zone zone-sources zone-engine" transform="translate(40, 430)">
        <rect width="400" height="44" rx="22" class="note-box" />
        <text x="22" y="27" class="note">🔒 Au palier « Fichier », rien ne quitte votre navigateur.</text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
/**
 * Schéma produit animé : les données circulent des sources vers le moteur puis
 * vers la carte ; un pas-à-pas met en lumière chaque zone et explique l'intention.
 */
const INTERVAL = 4500

const STEPS = [
  {
    key: 'sources',
    label: 'Vos données',
    headline: 'Vous avez déjà tout ce qu’il faut.',
    text: 'Un export de commandes, de clients, d’interventions ou d’adhérents. Peu importe l’outil d’origine : il suffit d’un code postal, d’un département ou d’une ville sur chaque ligne.',
  },
  {
    key: 'engine',
    label: 'Le moteur',
    headline: 'Chaque ligne est rattachée à son territoire, puis résumée.',
    text: 'Le moteur reconnaît vos colonnes, relie chaque ligne à un département, additionne, compte les clients distincts et calcule l’évolution sur un an. Au palier « Fichier », tout se passe dans votre navigateur.',
  },
  {
    key: 'map',
    label: 'La carte',
    headline: 'Vos chiffres deviennent un relief.',
    text: 'La hauteur et la couleur de chaque département suivent l’indicateur choisi. Ce qu’un tableau de 96 lignes cache, la carte le montre en trois secondes — en 3D pour la vue d’ensemble, sur fond réel pour le détail.',
  },
  {
    key: 'lectures',
    label: 'Trois lectures',
    headline: 'Où c’est fort, où c’est vide, où ça bouge.',
    text: 'Trois questions auxquelles un tableau ne répond pas : la concentration à sécuriser, les zones blanches à conquérir, les territoires qui décollent ou décrochent avant que ça se voie dans le total.',
  },
  {
    key: 'decision',
    label: 'La décision',
    headline: 'Vous agissez au bon endroit.',
    text: 'Renforcer une équipe, prospecter une zone, réallouer un budget, alerter un responsable : la carte donne le « où », et la fiche de chaque territoire donne le « pourquoi ».',
  },
] as const

const SOURCES = [
  { icon: '🛒', color: '#fff1e6', label: 'Boutique en ligne', sub: 'Shopify, WooCommerce, PrestaShop' },
  { icon: '📇', color: '#eff6ff', label: 'CRM', sub: 'HubSpot, Salesforce, Pipedrive' },
  { icon: '📊', color: '#ecfdf5', label: 'Excel / CSV', sub: 'un export, un Google Sheet' },
  { icon: '🗄️', color: '#f5f3ff', label: 'Base de données', sub: 'ERP, logiciel métier, SQL' },
  { icon: '🧾', color: '#fef9c3', label: 'Facturation', sub: 'devis, factures, interventions' },
]

const ENGINE = [
  { step: 'engine', title: 'Rattachement', sub: 'code postal → département' },
  { step: 'engine', title: 'Agrégation', sub: 'sommes, clients distincts' },
  { step: 'map', title: 'Normalisation', sub: 'hauteur, couleur, évolution' },
]

const READS = [
  { label: 'Où c’est fort', color: '#f97316' },
  { label: 'Où c’est vide', color: '#94a3b8' },
  { label: 'Où ça bouge', color: '#10b981' },
]

const DECISIONS = [
  { icon: '💪', label: 'Renforcer' },
  { icon: '🎯', label: 'Prospecter' },
  { icon: '🔔', label: 'Alerter' },
]

// ---- Géométrie du schéma ------------------------------------------------------
const sourceY = (i: number) => 70 + i * 72
const sourcePath = (i: number) => {
  const y = sourceY(i) + 28
  return `M270 ${y} C 370 ${y}, 380 250, 470 250`
}
const ENGINE_TO_MAP = 'M730 250 C 765 250, 765 220, 800 220'

/** Silhouette simplifiée de la France (lon/lat → repère local 340×300). */
const OUTLINE: [number, number][] = [
  [1.85, 50.95], [2.4, 51.05], [3.2, 50.75], [3.95, 50.3], [4.95, 49.7], [5.75, 49.5], [6.6, 49.4], [7.95, 49.05],
  [7.8, 48.55], [7.55, 47.55], [6.4, 46.9], [6.05, 46.2], [7.0, 45.9], [7.1, 45.2], [7.5, 43.8], [7.25, 43.65],
  [5.9, 43.1], [5.35, 43.25], [3.9, 43.5], [3.05, 42.55], [1.5, 42.55], [-0.7, 42.8], [-1.78, 43.35], [-1.5, 43.6],
  [-1.25, 44.65], [-1.05, 45.65], [-1.2, 46.15], [-1.8, 46.5], [-2.3, 47.25], [-2.75, 47.55], [-4.3, 47.85],
  [-4.8, 48.4], [-3.95, 48.75], [-2.0, 48.65], [-1.5, 48.65], [-1.6, 49.65], [-0.3, 49.35], [0.1, 49.5], [1.1, 49.95],
  [1.6, 50.75],
]
const K = 24
const px = ([lon, lat]: [number, number]) => [(lon + 5.2) * K, (51.3 - lat) * K * 1.42] as const
const FRANCE_PATH = OUTLINE.map((p, i) => `${i ? 'L' : 'M'}${px(p)[0].toFixed(1)} ${px(p)[1].toFixed(1)}`).join(' ') + ' Z'

const CITIES: { name: string; lon: number; lat: number; h: number; hot?: boolean }[] = [
  { name: 'Paris', lon: 2.35, lat: 48.86, h: 74, hot: true },
  { name: 'Lyon', lon: 4.84, lat: 45.76, h: 46 },
  { name: 'Marseille', lon: 5.37, lat: 43.3, h: 40 },
  { name: 'Lille', lon: 3.06, lat: 50.63, h: 38 },
  { name: 'Bordeaux', lon: -0.58, lat: 44.84, h: 34 },
  { name: 'Toulouse', lon: 1.44, lat: 43.6, h: 32 },
  { name: 'Nantes', lon: -1.55, lat: 47.22, h: 26 },
  { name: 'Strasbourg', lon: 7.75, lat: 48.57, h: 24 },
  { name: 'Rennes', lon: -1.68, lat: 48.12, h: 18 },
]
const BARS = CITIES.map((c, i) => {
  const [x, y] = px([c.lon, c.lat])
  return { ...c, x: +x.toFixed(1), y: +y.toFixed(1), delay: +(i * 0.12).toFixed(2) }
})

// ---- Pas-à-pas -------------------------------------------------------------------
const step = ref(0)
const paused = ref(false)
const current = computed(() => STEPS[step.value]!)
let timer: ReturnType<typeof setInterval> | undefined

const go = (i: number) => {
  step.value = i
  restart()
}

const restart = () => {
  clearInterval(timer)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  timer = setInterval(() => {
    if (!paused.value) step.value = (step.value + 1) % STEPS.length
  }, INTERVAL)
}

onMounted(restart)
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.flow {
  padding: 24px 24px 12px;
  overflow: hidden;
}

.flow-head {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  margin-bottom: 8px;
}

.flow-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-text);
}

.flow-title {
  margin-top: 6px;
  font-family: var(--display);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  min-height: 2.4em;
}

.flow-text {
  margin-top: 8px;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--text-muted);
  min-height: 4.8em;
}

.flow-stepper {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
}

.step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--tile-bg);
  text-align: left;
  overflow: hidden;
  transition: border-color 0.2s, background 0.2s;
}

.step:hover {
  border-color: var(--border-strong);
}

.step.active {
  background: #fff;
  border-color: var(--accent);
}

.step-num {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--track);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
}

.step.active .step-num {
  background: var(--accent);
  color: #fff;
}

.step.done .step-num {
  background: var(--positive);
  color: #fff;
}

.step-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.step.active .step-label {
  color: var(--text);
}

.step-progress {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: var(--accent);
  transform-origin: left;
  animation: progress linear forwards;
}

@keyframes progress {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

.flow-svg {
  display: block;
  width: 100%;
  height: auto;
  min-width: 720px;
}

/* ---- Zones : dimmer tout sauf la zone en cours ---- */
.zone {
  transition: opacity 0.45s ease;
  opacity: 0.38;
}

.focus-sources .zone-sources,
.focus-engine .zone-engine,
.focus-map .zone-map,
.focus-lectures .zone-map,
.focus-decision .zone-decision,
.focus-decision .zone-map {
  opacity: 1;
}

.zone-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  fill: #94a3b8;
}

/* ---- Sources ---- */
.source-box {
  fill: #fff;
  stroke: #e2e8f0;
  filter: url(#pf-shadow);
}

.source-label {
  font-size: 13px;
  font-weight: 700;
  fill: #0f172a;
}

.source-sub {
  font-size: 10.5px;
  fill: #64748b;
}

/* ---- Liens et paquets ---- */
.link {
  fill: none;
  stroke: #cbd5e1;
  stroke-width: 2;
  stroke-dasharray: 6 8;
  animation: dash 1.2s linear infinite;
}

.link-main {
  stroke-width: 3;
  stroke: #a5b4fc;
}

@keyframes dash {
  to {
    stroke-dashoffset: -14;
  }
}

.packet {
  fill: #7c3aed;
  filter: url(#pf-glow);
}

.packet-main {
  fill: #f97316;
}

/* ---- Moteur ---- */
.engine-halo {
  fill: url(#pf-engine);
  opacity: 0.08;
  transform-origin: 130px 130px;
  animation: halo 3.2s ease-in-out infinite;
}

@keyframes halo {
  0%,
  100% {
    transform: scale(0.92);
    opacity: 0.06;
  }
  50% {
    transform: scale(1.04);
    opacity: 0.14;
  }
}

.engine-box {
  fill: #fff;
  stroke: #e2e8f0;
  filter: url(#pf-shadow);
}

.engine-title {
  font-family: var(--display);
  font-size: 18px;
  font-weight: 700;
  fill: #0f172a;
}

.engine-sub {
  font-size: 10.5px;
  fill: #64748b;
}

.engine-row-box {
  fill: #f8fafc;
  stroke: #e2e8f0;
  transition: fill 0.3s, stroke 0.3s;
}

.engine-row.lit .engine-row-box {
  fill: #fff7ed;
  stroke: #f97316;
}

.engine-dot {
  fill: #e2e8f0;
  transition: fill 0.3s;
}

.engine-row.lit .engine-dot {
  fill: #10b981;
}

.engine-check {
  fill: none;
  stroke: #fff;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.engine-row-title {
  font-size: 12.5px;
  font-weight: 700;
  fill: #0f172a;
}

.engine-row-sub {
  font-size: 10px;
  fill: #64748b;
}

/* ---- Carte ---- */
.map-box {
  fill: #fff;
  stroke: #e2e8f0;
  filter: url(#pf-shadow);
}

.france {
  fill: #e8eefb;
  stroke: #c7d2e6;
  stroke-width: 1.5;
  stroke-linejoin: round;
}

.bar-base {
  fill: #cbd5e1;
}

.bar {
  transform-origin: 0 0;
  transform: scaleY(0.25);
  animation: rise 4s ease-in-out infinite;
}

@keyframes rise {
  0%,
  8% {
    transform: scaleY(0.25);
  }
  40%,
  70% {
    transform: scaleY(1);
  }
  100% {
    transform: scaleY(0.25);
  }
}

.bar-label {
  font-size: 9.5px;
  font-weight: 600;
  fill: #334155;
}

.read-box {
  fill: #f8fafc;
  stroke: #e2e8f0;
  transition: fill 0.3s, stroke 0.3s;
}

.read.lit .read-box {
  fill: #fff;
  stroke: #0f172a;
}

.read-label {
  font-size: 11px;
  font-weight: 600;
  fill: #0f172a;
}

/* ---- Décision ---- */
.decision-box {
  fill: #fff;
  stroke: #e2e8f0;
  filter: url(#pf-shadow);
}

.focus-decision .decision-box {
  animation: pop 0.6s cubic-bezier(0.2, 0.9, 0.2, 1.2) both;
  stroke: #10b981;
}

@keyframes pop {
  from {
    transform: translateY(8px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.decision-label {
  font-size: 12px;
  font-weight: 700;
  fill: #0f172a;
}

.note-box {
  fill: #f8fafc;
  stroke: #e2e8f0;
}

.note {
  font-size: 12px;
  fill: #475569;
}

@media (max-width: 900px) {
  .flow-head {
    grid-template-columns: 1fr;
  }

  .flow {
    overflow-x: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .link,
  .bar,
  .engine-halo,
  .step-progress,
  .decision-box {
    animation: none !important;
  }

  .bar {
    transform: scaleY(1);
  }
}
</style>
