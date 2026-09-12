<template>
  <div class="page">
    <!-- Hero -->
    <section class="hero">
      <div class="container">
        <span class="tag tag-accent">À quoi ça sert</span>
        <h1 class="hero-title">Une carte pour toute activité<br />qui a une <em>adresse</em>.</h1>
        <p class="hero-lead">
          Le « chiffre d’affaires » de la démo n’est qu’un exemple. L’outil ne connaît que deux choses :
          <strong>un territoire</strong> et <strong>un nombre par territoire</strong>. Commandes, interventions,
          adhérents, patients, candidatures, dossiers… tout ce qui a un code postal peut se lire comme ça.
        </p>
        <div class="hero-actions">
          <button type="button" class="btn btn-primary" @click="open('import')">⤓ Tester avec mes données</button>
          <NuxtLink to="/" class="btn">Voir la démo</NuxtLink>
          <button type="button" class="btn btn-ghost" @click="open('contact')">Poser une question</button>
        </div>
      </div>
    </section>

    <!-- Pourquoi -->
    <section class="section">
      <div class="container">
        <p class="eyebrow">Pourquoi cet outil</p>
        <h2 class="section-title">Un tableau de 96 lignes ne se lit pas. Une carte, si.</h2>
        <div class="before-after">
          <div class="ba ba-before card">
            <span class="ba-tag">Aujourd’hui</span>
            <div class="fake-table" aria-hidden="true">
              <div class="fake-row head"><span>Dépt</span><span>CA</span><span>Clients</span><span>N-1</span></div>
              <div v-for="r in FAKE_ROWS" :key="r.code" class="fake-row"><span>{{ r.code }}</span><span>{{ r.ca }}</span><span>{{ r.clients }}</span><span :class="{ neg: r.evo.startsWith('−') }">{{ r.evo }}</span></div>
              <div class="fake-row more">… 88 lignes de plus</div>
            </div>
            <p class="ba-text"><b>L’export Excel.</b> Les chiffres sont là, mais personne ne voit que trois départements voisins sont vides, ni que l’Occitanie décroche.</p>
          </div>
          <div class="ba-arrow" aria-hidden="true">→</div>
          <div class="ba ba-after card">
            <span class="ba-tag ba-tag-after">Avec la carte</span>
            <div class="ba-map" aria-hidden="true">
              <span v-for="(h, i) in [30, 62, 44, 78, 36, 52, 24, 66, 40]" :key="i" class="ba-bar" :class="{ hot: h > 60, empty: h < 30 }" :style="{ height: h + '%', animationDelay: i * 0.08 + 's' }" />
            </div>
            <p class="ba-text"><b>La même donnée, en relief.</b> Le fort saute aux yeux, le vide aussi, et l’évolution se lit d’un coup. La fiche de chaque territoire dit quoi faire.</p>
          </div>
        </div>
        <ul class="promises">
          <li v-for="p in PROMISES" :key="p.value" class="promise card">
            <span class="promise-value num">{{ p.value }}</span>
            <span class="promise-label">{{ p.label }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Schéma -->
    <section class="section">
      <div class="container">
        <p class="eyebrow">Comment ça marche</p>
        <h2 class="section-title">De vos fichiers à une décision, en cinq étapes</h2>
        <ProductFlow />
      </div>
    </section>

    <!-- Trois lectures -->
    <section class="section section-alt">
      <div class="container">
        <p class="eyebrow">Une carte, trois questions</p>
        <h2 class="section-title">Ce qu’un tableau ne montre pas</h2>
        <div class="reads">
          <article v-for="r in READS" :key="r.k" class="read card">
            <span class="read-dot" :style="{ background: r.color }" />
            <h3>{{ r.title }}</h3>
            <p>{{ r.text }}</p>
            <p class="read-example">{{ r.example }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Usages -->
    <section class="section">
      <div class="container">
        <p class="eyebrow">Qui s’en sert</p>
        <h2 class="section-title">Le même outil, d’autres métiers</h2>
        <p class="section-lead">
          Dans l’import, vous renommez l’indicateur et le compteur ; la carte parle votre langue. La colonne
          <strong>date</strong> donne l’évolution sur un an, la colonne <strong>identifiant</strong> compte des personnes
          plutôt que des lignes.
        </p>
        <div class="uses">
          <article v-for="u in USES" :key="u.who" class="use card">
            <span class="use-icon" :style="{ background: u.color }" aria-hidden="true">{{ u.icon }}</span>
            <h3>{{ u.who }}</h3>
            <dl>
              <div><dt>Indicateur</dt><dd>{{ u.amount }}</dd></div>
              <div><dt>Compteur</dt><dd>{{ u.counter }}</dd></div>
            </dl>
            <p class="use-question">« {{ u.question }} »</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Échelles -->
    <section class="section section-alt">
      <div class="container two-cols">
        <div>
          <p class="eyebrow">Changer d’échelle</p>
          <h2 class="section-title">Pas seulement la France entière</h2>
          <p class="section-lead">
            Le découpage est un fichier de contours qu’on remplace. Le geste reste le même : un code sur chaque
            ligne, un contour par zone.
          </p>
          <ul class="scales">
            <li v-for="s in SCALES" :key="s.title"><b>{{ s.title }}</b> — {{ s.text }}</li>
          </ul>
        </div>
        <div class="limits card">
          <h3>Les limites, honnêtement</h3>
          <p>L’outil n’est pas fait pour :</p>
          <ul>
            <li>des données <b>sans lieu</b> — une activité 100 % en ligne sans adresse client ;</li>
            <li>l’analyse <b>à l’intérieur</b> d’un lieu — le plan d’un magasin, le parcours sur un site web ;</li>
            <li>les <b>DOM-TOM</b>, pas encore sur cette carte.</li>
          </ul>
          <p class="limits-rule">Il faut que la question commence par « <b>où</b> ».</p>
        </div>
      </div>
    </section>

    <!-- Paliers + CTA -->
    <section class="section">
      <div class="container">
        <p class="eyebrow">Et après la démo</p>
        <h2 class="section-title">De votre fichier à une carte qui vit toute seule</h2>
        <div class="paliers">
          <article v-for="p in PALIERS" :key="p.title" class="palier card" :class="{ live: p.live }">
            <span class="palier-num num">{{ p.num }}</span>
            <h3>{{ p.title }} <span v-if="p.live" class="tag tag-positive">Disponible</span></h3>
            <p>{{ p.text }}</p>
          </article>
        </div>
        <div class="final">
          <div>
            <h3 class="final-title">Vous voyez votre activité dedans ?</h3>
            <p class="final-text">Testez avec un export en trente secondes, ou décrivez-moi votre cas.</p>
          </div>
          <div class="hero-actions">
            <button type="button" class="btn btn-primary" @click="open('import')">Tester mes données</button>
            <button type="button" class="btn" @click="open('contact')">Me contacter</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'À quoi ça sert · Atlas Commercial' })

const { open } = useOverlay()

const FAKE_ROWS = [
  { code: '01', ca: '750', clients: '42', evo: '+3,1 %' },
  { code: '02', ca: '300', clients: '15', evo: '−4,2 %' },
  { code: '03', ca: '410', clients: '20', evo: '+1,0 %' },
  { code: '04', ca: '520', clients: '18', evo: '−9,8 %' },
  { code: '05', ca: '270', clients: '10', evo: '+0,4 %' },
  { code: '06', ca: '1 100', clients: '54', evo: '+6,3 %' },
  { code: '07', ca: '440', clients: '25', evo: '−2,1 %' },
  { code: '08', ca: '260', clients: '12', evo: '+12,0 %' },
]

const PROMISES = [
  { value: '30 s', label: 'pour voir vos chiffres sur la carte, à partir d’un simple export' },
  { value: '0', label: 'donnée envoyée : au palier « Fichier », tout reste dans votre navigateur' },
  { value: '3', label: 'questions qu’un tableau ne montre pas : où c’est fort, vide, en mouvement' },
  { value: '1', label: 'colonne suffit — un code postal — pour commencer' },
]

const READS = [
  {
    k: 'fort',
    short: 'Où c’est fort',
    color: '#f97316',
    title: 'Où c’est fort',
    text: 'La concentration : les zones qui portent l’activité. C’est là qu’on sécurise et qu’on renforce.',
    example: 'Ex. : 33 % du volume en Île-de-France → un interlocuteur dédié.',
  },
  {
    k: 'vide',
    short: 'Où c’est vide',
    color: '#94a3b8',
    title: 'Où c’est vide',
    text: 'Les zones blanches : rien, alors qu’il devrait y avoir quelque chose. Invisible dans un tableau, évident sur une carte.',
    example: 'Ex. : aucun client dans trois départements limitrophes → campagne locale.',
  },
  {
    k: 'bouge',
    short: 'Où ça bouge',
    color: '#10b981',
    title: 'Où ça bouge',
    text: 'L’évolution sur un an : ce qui décolle ou décroche, avant que ça se voie dans le total.',
    example: 'Ex. : −18 % dans un département pourtant historique → aller voir pourquoi.',
  },
]

const USES = [
  { icon: '🔧', color: '#fff1e6', who: 'Artisan, dépanneur, installateur', amount: 'Montant HT des interventions', counter: 'Interventions', question: 'Où je me déplace le plus, et est-ce que ça vaut le coup d’aller si loin ?' },
  { icon: '🤝', color: '#ecfdf5', who: 'Association, club, fédération', amount: 'Cotisations (ou rien)', counter: 'Adhérents', question: 'Où sont nos membres, où sommes-nous absents ?' },
  { icon: '🎓', color: '#eff6ff', who: 'École, organisme de formation', amount: 'Frais d’inscription', counter: 'Inscrits', question: 'D’où viennent nos élèves, où communiquer ?' },
  { icon: '🩺', color: '#fdf2f8', who: 'Cabinet, réseau de soins', amount: '—', counter: 'Patients, consultations', question: 'Quelle zone couvrons-nous réellement ?' },
  { icon: '🧑‍💼', color: '#f5f3ff', who: 'Recruteur, employeur', amount: '—', counter: 'Candidatures', question: 'Où recruter, où nos annonces ne touchent personne ?' },
  { icon: '📦', color: '#fef9c3', who: 'Service client, SAV', amount: 'Coût des retours', counter: 'Réclamations', question: 'Où ça casse : un transporteur, un secteur ?' },
  { icon: '🏠', color: '#ede9fe', who: 'Immobilier', amount: 'Prix de vente, loyer', counter: 'Biens, mandats', question: 'Où est la tension, où les délais s’allongent ?' },
  { icon: '🚚', color: '#e0f2fe', who: 'Logistique, livraison', amount: 'Coût par livraison', counter: 'Colis', question: 'Où livrer coûte cher, où le délai dérape ?' },
  { icon: '🏛️', color: '#fef3c7', who: 'Collectivité, mairie', amount: 'Budget engagé', counter: 'Dossiers, demandes', question: 'Où va l’argent, où les citoyens sollicitent ?' },
  { icon: '🎟️', color: '#ffe4e6', who: 'Événementiel, tourisme', amount: 'Dépense moyenne', counter: 'Visiteurs, billets', question: 'D’où viennent nos visiteurs, où faire de la pub ?' },
  { icon: '🛡️', color: '#f1f5f9', who: 'Assurance, gestion de sinistres', amount: 'Montant des sinistres', counter: 'Dossiers', question: 'Où est le risque ?' },
  { icon: '📣', color: '#fce7f3', who: 'Marketing, acquisition', amount: 'Coût d’acquisition', counter: 'Leads, conversions', question: 'Où mon budget convertit ?' },
]

const SCALES = [
  { title: 'Communes d’un département', text: 'un artisan, une communauté de communes, une agence locale.' },
  { title: 'Quartiers d’une ville', text: 'une mairie, un agent immobilier, un réseau de commerces.' },
  { title: 'Régions', text: 'une direction nationale qui veut une lecture synthétique.' },
  { title: 'Pays d’Europe, monde', text: 'un exportateur, une marketplace internationale.' },
]

const PALIERS = [
  { num: '1', title: 'Fichier', text: 'Vous glissez un CSV quand vous voulez. Photo à l’instant T, rien n’est envoyé.', live: true },
  { num: '2', title: 'Lien', text: 'Vous collez l’adresse d’un Google Sheet ou d’un fichier partagé ; la carte le relit toutes les heures.', live: false },
  { num: '3', title: 'Connecteur', text: 'Branchée sur Shopify, WooCommerce, HubSpot ou votre base : la carte se met à jour toute seule.', live: false },
]
</script>

<style scoped>
.page {
  height: 100%;
  overflow-y: auto;
  background: var(--bg);
}

.container {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 24px;
}

.hero {
  padding: 56px 0 40px;
  background:
    radial-gradient(circle at 85% 0%, rgba(249, 115, 22, 0.14), transparent 40%),
    radial-gradient(circle at 10% 100%, rgba(124, 58, 237, 0.12), transparent 45%),
    var(--bg-elevated);
  border-bottom: 1px solid var(--border);
}

.hero-title {
  margin-top: 14px;
  font-family: var(--display);
  font-size: clamp(30px, 4.5vw, 46px);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.03em;
}

.hero-title em {
  font-style: normal;
  color: var(--accent);
}

.hero-lead {
  margin-top: 16px;
  max-width: 70ch;
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-muted);
}

.hero-lead strong {
  color: var(--text);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
}

.hero-actions a {
  text-decoration: none;
}

.section {
  padding: 48px 0;
}

.section-alt {
  background: var(--bg-elevated);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.section-title {
  margin-top: 6px;
  font-family: var(--display);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.section-lead {
  margin-top: 8px;
  max-width: 70ch;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-muted);
}

.section-lead strong {
  color: var(--text);
}

.before-after {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: stretch;
  margin-top: 22px;
}

.ba {
  position: relative;
  padding: 22px;
}

.ba-after {
  border-color: rgba(249, 115, 22, 0.4);
  background: linear-gradient(180deg, #fff, #fff7ed);
}

.ba-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--track);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.ba-tag-after {
  background: var(--accent);
  color: #fff;
}

.ba-arrow {
  align-self: center;
  font-size: 28px;
  color: var(--text-dim);
}

.fake-table {
  margin-top: 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  font-size: 12px;
  color: var(--text-muted);
  filter: grayscale(1);
  opacity: 0.85;
}

.fake-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border);
  font-variant-numeric: tabular-nums;
}

.fake-row.head {
  background: var(--tile-bg);
  font-weight: 700;
  color: var(--text-dim);
}

.fake-row.more {
  display: block;
  color: var(--text-dim);
  font-style: italic;
  border-bottom: 0;
}

.fake-row .neg {
  color: var(--negative);
}

.ba-map {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 190px;
  margin-top: 14px;
  padding: 16px 18px 0;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: radial-gradient(ellipse at 50% 20%, #fff 0%, #eaf0fb 70%);
}

.ba-bar {
  flex: 1;
  border-radius: 6px 6px 2px 2px;
  background: linear-gradient(180deg, #7c3aed, #3b82f6);
  box-shadow: 0 8px 14px rgba(59, 130, 246, 0.25);
  transform-origin: bottom;
  animation: ba-rise 1.2s cubic-bezier(0.2, 0.9, 0.2, 1) both;
}

.ba-bar.hot {
  background: linear-gradient(180deg, #fb923c, #f97316);
  box-shadow: 0 8px 14px rgba(249, 115, 22, 0.3);
}

.ba-bar.empty {
  background: #cbd5e1;
  box-shadow: none;
}

@keyframes ba-rise {
  from {
    transform: scaleY(0);
  }
  to {
    transform: scaleY(1);
  }
}

.ba-text {
  margin-top: 14px;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--text-muted);
}

.ba-text b {
  color: var(--text);
}

.promises {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}

.promise {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 18px;
}

.promise-value {
  font-family: var(--display);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--accent-text);
}

.promise-label {
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-muted);
}

.reads {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.read {
  padding: 20px;
}

.read-dot {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-bottom: 12px;
}

.read h3 {
  font-family: var(--display);
  font-size: 17px;
  font-weight: 700;
}

.read p {
  margin-top: 6px;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--text-muted);
}

.read-example {
  margin-top: 10px !important;
  padding-top: 10px;
  border-top: 1px dashed var(--border);
  font-size: 12.5px !important;
  color: var(--text-dim) !important;
}

.uses {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.use {
  padding: 18px;
  transition: transform 0.15s, box-shadow 0.15s;
}

.use:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.use-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  font-size: 20px;
}

.use h3 {
  margin-top: 12px;
  font-size: 14.5px;
  font-weight: 700;
}

.use dl {
  margin: 10px 0 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.use dl div {
  display: flex;
  gap: 8px;
  font-size: 12.5px;
}

.use dt {
  flex: 0 0 76px;
  color: var(--text-dim);
}

.use dd {
  margin: 0;
  color: var(--text-muted);
}

.use-question {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--border);
  font-size: 13px;
  font-style: italic;
  line-height: 1.5;
  color: var(--text);
}

.two-cols {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 32px;
  align-items: start;
}

.scales {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--text-muted);
}

.scales b {
  color: var(--text);
}

.limits {
  padding: 22px;
}

.limits h3 {
  font-family: var(--display);
  font-size: 16px;
  font-weight: 700;
}

.limits p,
.limits li {
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--text-muted);
}

.limits p {
  margin-top: 8px;
}

.limits ul {
  margin: 8px 0 0;
  padding-left: 18px;
}

.limits b {
  color: var(--text);
}

.limits-rule {
  padding-top: 10px;
  border-top: 1px dashed var(--border);
  font-weight: 600;
  color: var(--text) !important;
}

.paliers {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.palier {
  position: relative;
  padding: 20px 20px 20px 62px;
}

.palier.live {
  border-color: rgba(5, 150, 105, 0.35);
  background: #f0fdf4;
}

.palier-num {
  position: absolute;
  left: 20px;
  top: 20px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--text);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.palier.live .palier-num {
  background: var(--positive);
}

.palier h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
}

.palier h3 .tag {
  height: 20px;
  font-size: 10px;
}

.palier p {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--text-muted);
}

.final {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  margin-top: 28px;
  padding: 26px 28px;
  border-radius: var(--radius);
  color: #fff;
  background:
    radial-gradient(circle at 90% 10%, rgba(249, 115, 22, 0.55), transparent 45%),
    linear-gradient(135deg, #1e1b4b, #312e81);
}

.final-title {
  font-family: var(--display);
  font-size: 20px;
  font-weight: 700;
}

.final-text {
  margin-top: 4px;
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.75);
}

.final .hero-actions {
  margin-top: 0;
}

.final .btn:not(.btn-primary) {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  color: #fff;
}

@media (max-width: 900px) {
  .before-after {
    grid-template-columns: 1fr;
  }

  .ba-arrow {
    transform: rotate(90deg);
    justify-self: center;
  }

  .promises {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .reads,
  .uses,
  .paliers {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .two-cols {
    grid-template-columns: 1fr;
  }

  .final {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 600px) {
  .reads,
  .uses,
  .paliers {
    grid-template-columns: 1fr;
  }

  .hero {
    padding: 36px 0 28px;
  }

  .section {
    padding: 36px 0;
  }
}
</style>
