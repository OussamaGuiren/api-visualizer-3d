<template>
  <AppModal :open="open" label="Sources de données" size="lg" @close="emit('close')">
    <header class="head">
      <span class="tag tag-accent">Données</span>
      <h2 class="title">D’où viennent les chiffres ?</h2>
      <p class="lead">
        Par défaut, tout est fictif. Vous pouvez tester avec votre propre fichier dès maintenant ; dans un
        projet, la carte se branche sur vos outils et se met à jour toute seule.
      </p>
    </header>

    <div class="paliers">
      <article v-for="p in PALIERS" :key="p.title" class="palier" :class="{ live: p.live }">
        <span class="palier-num num">{{ p.num }}</span>
        <div>
          <h3 class="palier-title">{{ p.title }} <span v-if="p.live" class="tag tag-positive">Disponible ici</span></h3>
          <p class="palier-text">{{ p.text }}</p>
          <p class="palier-meta">{{ p.meta }}</p>
        </div>
      </article>
    </div>

    <div class="columns">
      <section>
        <h3 class="col-title">Dans cette démo</h3>
        <dl class="facts">
          <div>
            <dt>Indicateurs</dt>
            <dd>Fichier JSON généré : montants, clients, évolution et objectif par département — plausibles mais inventés. Aucune entreprise réelle n’est représentée.</dd>
          </div>
          <div>
            <dt>Contours & fonds</dt>
            <dd>Limites administratives officielles (IGN Admin Express via data.gouv.fr), simplifiées de 3,3 Mo à 0,7 Mo. Fond de carte OpenStreetMap.</dd>
          </div>
          <div class="fact-api">
            <dt>Deux points d’entrée API, déjà en place</dt>
            <dd>
              <code>GET /api/departements</code> — indicateurs de tous les départements<br />
              <code>GET /api/departements/:code/marketplace</code> — vendeurs, acheteurs, produits<br />
              La carte ne lit que ces deux URL : brancher vos données, c’est réécrire ce qu’elles renvoient, sans toucher à l’interface.
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h3 class="col-title">Dans un projet réel</h3>
        <ol class="pipeline">
          <li v-for="(step, i) in PIPELINE" :key="step.title">
            <span class="step-index num">{{ i + 1 }}</span>
            <div>
              <h4 class="step-title">{{ step.title }}</h4>
              <p class="step-text">{{ step.text }}</p>
              <p class="step-examples">{{ step.examples }}</p>
            </div>
          </li>
        </ol>
      </section>
    </div>

    <footer class="foot">
      <div class="guarantees">
        <span v-for="g in GUARANTEES" :key="g" class="guarantee">✓ {{ g }}</span>
      </div>
      <div class="actions">
        <button type="button" class="btn" @click="emit('import')">Tester avec mon fichier</button>
        <button type="button" class="btn btn-primary" @click="emit('contact')">Brancher mes données</button>
      </div>
    </footer>
  </AppModal>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; contact: []; import: [] }>()

const PALIERS = [
  {
    num: '1',
    title: 'Fichier',
    text: 'Vous glissez un export CSV (commandes, clients, interventions…). Tout se calcule dans votre navigateur.',
    meta: 'Photo à l’instant T · zéro configuration · rien n’est envoyé',
    live: true,
  },
  {
    num: '2',
    title: 'Lien',
    text: 'Vous collez l’adresse d’un Google Sheet ou d’un fichier partagé ; la carte le relit à intervalle régulier.',
    meta: 'Mise à jour automatique · sans développement chez vous',
    live: false,
  },
  {
    num: '3',
    title: 'Connecteur',
    text: 'La carte se branche sur Shopify, WooCommerce, HubSpot, votre base SQL… et se met à jour en continu.',
    meta: 'Temps réel · droits par périmètre · historique',
    live: false,
  },
] as const

const PIPELINE = [
  {
    title: 'Vos systèmes',
    text: 'Les données restent là où elles sont. On lit, on ne duplique pas.',
    examples: 'CRM (Salesforce, HubSpot), ERP, base SQL, exports Excel/CSV, API métier, Google Sheets',
  },
  {
    title: 'Rattachement géographique',
    text: 'Chaque ligne est reliée à un territoire à partir de ce que vous avez déjà.',
    examples: 'Code postal → département, adresse → géocodage (Base Adresse Nationale), SIRET → commune',
  },
  {
    title: 'Agrégation & indicateurs',
    text: 'Sommes, moyennes, évolutions N-1, objectifs : calculés côté serveur, à la fréquence voulue.',
    examples: 'Rafraîchissement quotidien, horaire ou temps réel selon le besoin',
  },
  {
    title: 'API sécurisée',
    text: 'Un point d’entrée JSON, avec authentification et droits par périmètre.',
    examples: 'Un directeur régional ne voit que sa région ; la direction voit tout',
  },
  {
    title: 'La carte',
    text: 'Le front que vous voyez ici, aux couleurs de votre marque, intégrable dans votre intranet ou outil BI.',
    examples: 'Web, tablette, écran de salle de réunion — et la maille de votre choix : communes, régions, pays',
  },
] as const

const GUARANTEES = ['Aucune donnée ne transite par un tiers', 'Historique conservé pour comparer', 'Export CSV / Excel natif']
</script>

<style scoped>
.head {
  padding: 28px 28px 20px;
  border-bottom: 1px solid var(--border);
}

.title {
  margin-top: 12px;
  font-family: var(--display);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.lead {
  margin-top: 8px;
  max-width: 66ch;
  font-size: 14px;
  color: var(--text-muted);
}

.paliers {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 20px 28px 4px;
}

.palier {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 10px;
  padding: 14px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--tile-bg);
}

.palier.live {
  border-color: rgba(5, 150, 105, 0.35);
  background: #f0fdf4;
}

.palier-num {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--text);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.palier.live .palier-num {
  background: var(--positive);
}

.palier-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
}

.palier-title .tag {
  height: 20px;
  font-size: 10px;
}

.palier-text {
  margin-top: 4px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-muted);
}

.palier-meta {
  margin-top: 6px;
  font-size: 11px;
  color: var(--text-dim);
}

.columns {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 24px;
  padding: 18px 28px 22px;
}

.col-title {
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--accent-text);
}

.facts {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.facts div {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--tile-bg);
  border: 1px solid var(--border);
}

.facts dt {
  font-size: 12px;
  font-weight: 600;
}

.facts dd {
  margin: 2px 0 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-muted);
}

.fact-api {
  border-color: rgba(249, 115, 22, 0.35) !important;
  background: #fff7ed !important;
}

.fact-api code {
  display: inline-block;
  margin: 2px 0;
  padding: 1px 6px;
  border-radius: 4px;
  background: #fff;
  border: 1px solid var(--border);
  font-size: 11px;
  color: var(--accent-text);
}

.pipeline {
  position: relative;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pipeline li {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 12px;
  position: relative;
}

.pipeline li:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 13px;
  top: 30px;
  bottom: -14px;
  width: 2px;
  background: var(--track);
}

.step-index {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--info), var(--violet));
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.step-title {
  margin: 4px 0 0;
  font-size: 13.5px;
  font-weight: 600;
}

.step-text {
  margin-top: 2px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-muted);
}

.step-examples {
  margin-top: 4px;
  font-size: 11.5px;
  color: var(--text-dim);
}

.foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 28px;
  border-top: 1px solid var(--border);
  background: var(--foot-bg);
}

.guarantees {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  font-size: 12px;
  color: var(--positive);
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

@media (max-width: 860px) {
  .paliers,
  .columns {
    grid-template-columns: 1fr;
    padding-left: 16px;
    padding-right: 16px;
  }

  .head,
  .foot {
    padding-left: 16px;
    padding-right: 16px;
  }

  .foot,
  .actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
