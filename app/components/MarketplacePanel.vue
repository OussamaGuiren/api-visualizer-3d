<template>
  <section class="market">
    <div class="market-head">
      <div>
        <p class="eyebrow">Marketplace · {{ dept.nom }}</p>
        <p class="market-sub">Qui vend, qui achète et ce qui se vend sur ce territoire</p>
      </div>
      <div class="tabs" role="tablist">
        <button
          v-for="t in TABS"
          :key="t.key"
          type="button"
          role="tab"
          class="tab"
          :class="{ active: tab === t.key }"
          :aria-selected="tab === t.key"
          @click="tab = t.key"
        >
          {{ t.label }}
          <span v-if="data" class="tab-count num">{{ data[t.key].length }}</span>
        </button>
      </div>
    </div>

    <div v-if="status === 'pending' && !data" class="skeleton" aria-busy="true">
      <span v-for="i in 4" :key="i" />
    </div>
    <p v-else-if="status === 'error'" class="market-error">Impossible de charger les données de ce territoire.</p>

    <ul v-else-if="data && tab === 'vendeurs'" class="rows">
      <li v-for="v in data.vendeurs" :key="v.id" class="row">
        <div class="row-main">
          <span class="row-title">{{ v.nom }}</span>
          <span class="row-meta">{{ v.ville }} · {{ v.categorie }} · depuis {{ v.depuis }}</span>
        </div>
        <div class="row-side">
          <span class="row-value num">{{ formatDecimal(v.ventes) }} k€</span>
          <span class="row-meta num">★ {{ v.note.toFixed(1) }} · {{ v.produits }} produits</span>
        </div>
      </li>
    </ul>

    <ul v-else-if="data && tab === 'acheteurs'" class="rows">
      <li v-for="a in data.acheteurs" :key="a.id" class="row">
        <div class="row-main">
          <span class="row-title">{{ a.nom }}</span>
          <span class="row-meta">{{ a.ville }} · <span class="tag tag-mini">{{ a.type }}</span></span>
        </div>
        <div class="row-side">
          <span class="row-value num">{{ formatDecimal(a.montant) }} k€</span>
          <span class="row-meta num">{{ a.commandes }} commandes</span>
        </div>
      </li>
    </ul>

    <ul v-else-if="data" class="rows">
      <li v-for="p in data.produits" :key="p.id" class="row">
        <div class="row-main">
          <span class="row-title">{{ p.nom }}</span>
          <span class="row-meta">{{ p.categorie }} · {{ p.vendeur }}</span>
        </div>
        <div class="row-side">
          <span class="row-value num">{{ formatInt(p.prix) }} €</span>
          <span class="row-meta num">{{ formatInt(p.ventes) }} vendus</span>
        </div>
      </li>
    </ul>

    <p class="market-note">
      Chargé à la demande via <code>GET /api/departements/{{ dept.code }}/marketplace</code> — dans un projet réel,
      ce point d’entrée interroge votre base.
    </p>
  </section>
</template>

<script setup lang="ts">
import type { Dept, Marketplace } from '~/types/departements'

const props = defineProps<{ dept: Dept }>()

const TABS = [
  { key: 'vendeurs', label: 'Vendeurs' },
  { key: 'acheteurs', label: 'Acheteurs' },
  { key: 'produits', label: 'Produits' },
] as const

const tab = ref<(typeof TABS)[number]['key']>('vendeurs')

// Un appel par département, mis en cache par clé ; le panneau reste réactif au changement de sélection.
const { data, status } = useLazyFetch<Marketplace>(() => `/api/departements/${props.dept.code}/marketplace`, {
  key: () => `marketplace-${props.dept.code}`,
})
</script>

<style scoped>
.market {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.market-head {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.market-sub {
  font-size: 12px;
  color: var(--text-muted);
}

.tabs {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: var(--radius-sm);
  background: var(--tile-bg);
  border: 1px solid var(--border);
}

.tab {
  flex: 1;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  height: 28px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  transition: background 0.15s, color 0.15s;
}

.tab.active {
  background: #fff;
  color: var(--text);
  box-shadow: var(--shadow-sm);
}

.tab-count {
  padding: 0 6px;
  border-radius: 999px;
  background: var(--track);
  font-size: 10px;
  color: var(--text-muted);
}

.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--border);
}

.row:last-child {
  border-bottom: 0;
}

.row-main,
.row-side {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.row-side {
  align-items: flex-end;
  flex-shrink: 0;
}

.row-title {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-meta {
  font-size: 11px;
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-text);
}

.tag-mini {
  height: 16px;
  padding: 0 6px;
  font-size: 10px;
}

.skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton span {
  height: 34px;
  border-radius: 6px;
  background: linear-gradient(90deg, var(--tile-bg), var(--track), var(--tile-bg));
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

.market-error {
  font-size: 12px;
  color: var(--negative);
}

.market-note {
  font-size: 11px;
  color: var(--text-dim);
}

.market-note code {
  font-size: 10.5px;
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--tile-bg);
  border: 1px solid var(--border);
}
</style>
