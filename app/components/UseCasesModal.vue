<template>
  <AppModal :open="open" label="Cas d’usage" size="lg" @close="emit('close')">
    <header class="head">
      <span class="tag tag-accent">Cas d’usage</span>
      <h2 class="title">La même carte, avec <em>vos</em> indicateurs</h2>
      <p class="lead">
        Le moteur ne connaît pas le « chiffre d’affaires » : il lit n’importe quelle valeur rattachée à un
        territoire. Changer de métier, c’est changer le fichier de données et les libellés.
      </p>
    </header>

    <div class="grid">
      <article v-for="(c, i) in CASES" :key="c.title" class="case" :class="{ 'case-featured': i === 0 }">
        <div class="case-icon" :style="{ background: c.color }" aria-hidden="true">{{ c.icon }}</div>
        <h3 class="case-title">{{ c.title }}</h3>
        <p class="case-text">{{ c.text }}</p>
        <ul class="case-metrics">
          <li v-for="m in c.metrics" :key="m">{{ m }}</li>
        </ul>
      </article>
    </div>

    <footer class="foot">
      <div class="foot-scales">
        <span class="eyebrow">Autres mailles possibles</span>
        <span class="scales">
          <span class="tag">Communes</span>
          <span class="tag">Régions</span>
          <span class="tag">Zones de chalandise</span>
          <span class="tag">Pays d’Europe</span>
          <span class="tag">Monde</span>
        </span>
      </div>
      <div class="foot-actions">
        <NuxtLink to="/usages" class="btn" @click="emit('close')">Voir tous les usages →</NuxtLink>
        <button type="button" class="btn btn-primary" @click="emit('contact')">Parler de mon cas</button>
      </div>
    </footer>
  </AppModal>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; contact: [] }>()

const CASES = [
  {
    icon: '🛒',
    color: '#ffedd5',
    title: 'Marketplace & réseau de partenaires',
    text: 'Cliquer une zone pour voir ses vendeurs, ses acheteurs et ses produits phares — comme dans la fiche département de cette démo.',
    metrics: ['Vendeurs actifs', 'Acheteurs', 'Ventes par zone', 'Top produits'],
  },
  {
    icon: '🏬',
    color: '#fff1e6',
    title: 'Réseau de magasins & franchises',
    text: 'Comparer les points de vente d’un coup d’œil, repérer les zones blanches et arbitrer les ouvertures.',
    metrics: ['CA par magasin', 'Panier moyen', 'Fréquentation', 'Atteinte des objectifs'],
  },
  {
    icon: '🚚',
    color: '#e0f2fe',
    title: 'Logistique & livraison',
    text: 'Visualiser la qualité de service par zone et prioriser les hubs à renforcer.',
    metrics: ['Délai moyen', 'Volume de colis', 'Taux de retard', 'Coût par livraison'],
  },
  {
    icon: '🏠',
    color: '#ede9fe',
    title: 'Immobilier & foncier',
    text: 'Lire la tension d’un marché et l’évolution des prix pour orienter les investissements.',
    metrics: ['Prix au m²', 'Stock disponible', 'Délai de vente', 'Évolution annuelle'],
  },
  {
    icon: '🩺',
    color: '#dcfce7',
    title: 'Santé, mutuelles & assurance',
    text: 'Cartographier la couverture et la sinistralité pour ajuster l’offre territoriale.',
    metrics: ['Assurés', 'Densité de praticiens', 'Sinistralité', 'Délai de prise en charge'],
  },
  {
    icon: '🏛️',
    color: '#fef9c3',
    title: 'Collectivités & services publics',
    text: 'Rendre compte de l’action publique avec un support lisible par les élus et les citoyens.',
    metrics: ['Taux d’équipement', 'Population couverte', 'Budget engagé', 'Satisfaction'],
  },
  {
    icon: '📣',
    color: '#fce7f3',
    title: 'Marketing & acquisition',
    text: 'Suivre la performance des campagnes par zone et réallouer le budget là où ça convertit.',
    metrics: ['Leads', 'Coût d’acquisition', 'Taux de conversion', 'Part de marché'],
  },
] as const
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

.title em {
  font-style: normal;
  color: var(--accent);
}

.lead {
  margin-top: 8px;
  max-width: 62ch;
  font-size: 14px;
  color: var(--text-muted);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 22px 28px;
}

.case {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--tile-bg);
  transition: transform 0.15s, box-shadow 0.15s;
}

.case:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.case-featured {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    'icon title'
    'icon text'
    'icon metrics';
  column-gap: 16px;
  align-items: start;
  background: linear-gradient(135deg, #fff7ed, #fff);
  border-color: rgba(249, 115, 22, 0.35);
}

.case-featured .case-icon {
  grid-area: icon;
  width: 56px;
  height: 56px;
  font-size: 28px;
}

.case-featured .case-title {
  grid-area: title;
  margin-top: 0;
  font-size: 16px;
}

.case-featured .case-text {
  grid-area: text;
}

.case-featured .case-metrics {
  grid-area: metrics;
}

.case-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  font-size: 20px;
}

.case-title {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 600;
}

.case-text {
  margin-top: 4px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-muted);
}

.case-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.case-metrics li {
  padding: 2px 8px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-muted);
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

.foot-scales {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.foot-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.foot-actions a {
  text-decoration: none;
}

.scales {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

@media (max-width: 860px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .grid {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .head,
  .foot {
    padding-left: 16px;
    padding-right: 16px;
  }

  .foot {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
