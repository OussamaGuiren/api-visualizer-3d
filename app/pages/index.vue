<template>
  <div class="france-page">
    <!-- Partie gauche : carte -->
    <div ref="sceneContainer" class="scene-wrapper"></div>

   <!-- Partie droite : panneau infos style dashboard Microsoft -->
<aside class="dashboard-panel">
  <div class="dashboard-card">
    <header class="dashboard-header">
      <div class="header-line"></div>
      <div>
        <h2 class="dashboard-title">{{ title }}</h2>
        <p class="dashboard-subtitle">
          Département <strong>{{ code ?? '--' }}</strong>
          <span v-if="region">— {{ region }}</span>
        </p>
      </div>
    </header>

    <main class="dashboard-content">
      <div class="data-grid">
        <div class="data-block">
          <span class="data-label">Clients</span>
          <span class="data-value">{{ clients ?? '--' }}</span>
        </div>
        <div class="data-block">
          <span class="data-label">Chiffre d’affaires (k€)</span>
          <span class="data-value">{{ ca ?? '--' }}</span>
        </div>
        <div class="data-block">
          <span class="data-label">Segment</span>
          <span class="data-value">{{ segment ?? 'Standard' }}</span>
        </div>
      </div>

      <div class="data-summary">
        <p>
          <strong>Analyse :</strong> ce département affiche une
          performance moyenne. La clientèle est principalement issue du segment
          {{ segment ?? 'standard' }} avec un volume estimé à
          {{ clients ?? '---' }} comptes actifs.
        </p>
      </div>
    </main>

    <footer class="dashboard-footer">
      <button class="dashboard-btn" type="button" @click="openExportPopup">
        📈 Exporter les données
      </button>
    </footer>
  </div>
</aside>

  </div>



   <!-- Popup d’intro (business + tech) -->
  <!-- Popup d’intro (business + tech, style Microsoft) -->
  <div
    v-if="showIntroPopup"
    class="intro-overlay"
    @click.self="closeIntroPopup"
  >
    <div class="intro-modal">
      <header class="intro-header">
        <div class="intro-header-accent"></div>
        <div class="intro-header-text">
          <div class="intro-badge">Cas d’usage fictif</div>
          <h2 class="intro-title">
            Analyse géographique des performances commerciales
          </h2>
          <p class="intro-subtitle">
            Cette interface illustre un scénario imaginaire d’entreprise afin de
            présenter mes compétences techniques et produit.
          </p>
        </div>
        <button type="button" class="intro-close" @click="closeIntroPopup">
          ×
        </button>
      </header>

      <div class="intro-body">
        <section class="intro-column">
          <h3 class="intro-section-title">Côté métier</h3>
          <p class="intro-text">
            La carte représente une vision <strong>France entière</strong> des
            performances par département : chiffre d’affaires estimé, nombre de
            clients et niveau de priorité du territoire.
          </p>
          <p class="intro-text">
            Ce type de vue pourrait être utilisé par une
            <strong>direction commerciale</strong> ou
            <strong>marketing</strong> pour :
          </p>
          <ul class="intro-list">
            <li>identifier les zones à fort potentiel,</li>
            <li>prioriser les actions régionales,</li>
            <li>suivre l’évolution de l’activité sur le territoire.</li>
          </ul>
        </section>

        <section class="intro-column">
          <h3 class="intro-section-title">Côté technique</h3>
          <p class="intro-text">
            Cette démo s’appuie sur <strong>Nuxt</strong> pour le front,
            <strong>Three.js</strong> pour la carte interactive et
            <strong>TypeScript</strong> pour la structuration du code.
          </p>
          <p class="intro-text">
            Chaque bloc 3D correspond à un département : au survol et au clic,
            les données de la fiche à droite sont mises à jour (clients, CA,
            segmentation), comme dans un véritable tableau de bord.
          </p>
          <p class="intro-text">
            L’objectif n’est pas la précision des chiffres mais de montrer
            une <strong>intégration solide entre UI, 3D et logique métier</strong>.
          </p>
        </section>
      </div>

      <footer class="intro-footer">
        <button type="button" class="intro-primary" @click="closeIntroPopup">
          Découvrir la carte
        </button>
      </footer>
    </div>
  </div>

  <!-- Popup Export non disponible -->
  <div
    v-if="showExportPopup"
    class="export-overlay"
    @click.self="closeExportPopup"
  >
    <div class="export-modal">
      <header class="export-header">
        <h3 class="export-title">Export des données</h3>
        <button type="button" class="export-close" @click="closeExportPopup">
          ×
        </button>
      </header>

      <div class="export-body">
        <p>
          Dans cette version de démonstration, la fonction
          <strong>“Exporter les données”</strong> n’est pas encore
          implémentée. Elle le sera prochainement.
        </p>
        <p>
          L’objectif de ce module est avant tout de présenter l’interface
          utilisateur, la visualisation 3D et la logique métier autour des
          départements. Dans un contexte réel, ce bouton permettrait de
          générer un fichier <strong>CSV</strong> ou <strong>Excel</strong>
          contenant les indicateurs affichés sur la carte.
        </p>
      </div>

      <footer class="export-footer">
        <button type="button" class="export-btn" @click="closeExportPopup">
          OK
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const sceneContainer = ref<HTMLElement | null>(null)

const showIntroPopup = ref<boolean>(false)

const closeIntroPopup = () => {
  showIntroPopup.value = false
}

const showExportPopup = ref<boolean>(false)

const openExportPopup = () => {
  showExportPopup.value = true
}

const closeExportPopup = () => {
  showExportPopup.value = false
}


// état réactif pour la card
const title = ref('Sélectionnez un département')
const code = ref<string | null>(null)
const region = ref<string | null>(null)
const clients = ref<number | null>(null)
const ca = ref<number | null>(null) // en k€

// CA moyen par client (en k€)
const avgCaPerClient = computed<number | null>(() => {
  if (ca.value == null || clients.value == null || clients.value === 0) {
    return null
  }
  const value = ca.value / clients.value
  return Number(value.toFixed(1))
})

// Segment business
const segment = computed<string>(() => {
  if (ca.value == null) return 'Aucun chiffre pour le moment'

  if (ca.value >= 2500) return 'Compte stratégique'
  if (ca.value >= 1200) return 'Compte clé'
  if (ca.value >= 600) return 'Compte à potentiel'
  return 'Compte standard'
})

// Résumé texte business
const summary = computed<string>(() => {
  if (!code.value || !region.value || ca.value == null || clients.value == null) {
    return "Survolez ou cliquez un département sur la carte pour afficher un résumé business synthétique."
  }

  const ticket = avgCaPerClient.value
  const partTexte =
    ca.value >= 2500
      ? "Ce territoire représente un volume d'affaires majeur pour le portefeuille."
      : ca.value >= 1200
      ? "Ce territoire contribue fortement au chiffre d’affaires global."
      : ca.value >= 600
      ? "Ce territoire montre un potentiel intéressant à développer."
      : "Ce territoire reste aujourd'hui un marché secondaire."

  return `Le département ${code.value} (${region.value}) réalise un chiffre d’affaires annuel estimé à ${ca.value} k€ pour ${clients.value} clients actifs, soit ${ticket ?? '-'} k€ par client en moyenne. ${partTexte}`
})

onMounted(async () => {
  if (!sceneContainer.value) return

  const { initFrance3D } = await import('../../utils/france3d')

  initFrance3D(sceneContainer.value, (deptCode: string, info: any) => {
    code.value = deptCode
    region.value = info?.region ?? null
    clients.value = info?.clients ?? null
    ca.value = info?.ca ?? null
    title.value = info?.region
      ? `Vue business – Département ${deptCode}`
      : `Département ${deptCode}`
  })

  // Timer pour afficher la popup après 5 secondes
  setTimeout(() => {
    showIntroPopup.value = true
  }, 5000)
})
</script>

<style scoped>
.france-page {
  display: flex;
  flex-direction: row;
  height: calc(100vh - 64px); /* 64px = header app.vue */
  max-height: 900px;
  background: #f3f4f6;
  /* border-radius: 16px; */
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
}

/* Partie carte */
.scene-wrapper {
  flex: 1.6;
  position: relative;
  min-height: 260px;
  /* Responsive height: keep the layout but allow the scene to take a viewport proportion on narrow screens */
  height: min(60vh, calc(100vh - 64px));
  background: radial-gradient(
    circle at top,
    #e5f3ff 0,
    #dbeafe 35%,
    #e5e7eb 100%
  );
}

.scene-wrapper canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* === Panneau style Microsoft Dashboard === */

.dashboard-panel {
  flex: 1;
  display: flex;
  /* align-items: center; */
  justify-content: center;
  background: #f3f4f6;
  /* padding: 24px; */
}

.dashboard-card {
  width: 100%;
  max-width: 480px;
  background: #ffffff;
  /* border: 1px solid #e5e7eb; */
  border-radius: 8px;
  /* box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08); */
  display: flex;
  flex-direction: column;
}

/* Header */

.dashboard-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 18px 20px 10px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
}

.header-line {
  width: 4px;
  border-radius: 2px;
  background: linear-gradient(180deg, #2563eb, #f97316);
  flex-shrink: 0;
}

.dashboard-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.dashboard-subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  color: #6b7280;
}

/* Corps */

.dashboard-content {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
}

.data-block {
  display: flex;
  flex-direction: column;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px 12px;
  transition: all 0.15s ease;
}

/* .data-block:hover {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
} */

.data-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.data-value {
  font-size: 17px;
  font-weight: 600;
  color: #1d4ed8;
}

.data-summary {
  background: #fefefe;
  border-left: 4px solid #2563eb;
  padding: 12px;
  font-size: 13px;
  color: #374151;
  border-radius: 4px;
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.03);
}

/* Footer */

.dashboard-footer {
  border-top: 1px solid #e5e7eb;
  /* background: #f9fafb; */
  padding: 10px 20px;
  display: flex;
  justify-content: flex-end;
}

.dashboard-btn {
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 8px 14px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s ease;
  font-weight: 500;
}

.dashboard-btn:hover {
  background: #1d4ed8;
}

/* Responsive */

@media (max-width: 768px) {
  /* mobile/tablet : empiler la carte et le panneau */
  .france-page {
    flex-direction: column;
    height: auto; /* laisser scroller verticalement si nécessaire */
    min-height: calc(100vh - 64px);
    max-height: none;
  }

  .scene-wrapper {
    flex: 0 0 auto;
    height: min(55vh, 520px);
    min-height: 220px;
  }

  .dashboard-panel {
    flex: 0 0 auto;
    padding: 12px;
  }

  .dashboard-card {
    max-width: 100%;
    width: 95%;
    margin: 12px auto;
  }
  .dashboard-panel {
    padding: 16px;
  }

  .dashboard-card {
    max-width: 100%;
  }

  .data-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 420px) {
  .dashboard-title {
    font-size: 16px;
  }
  .dashboard-subtitle {
    font-size: 12px;
  }
  .data-label {
    font-size: 11px;
  }
  .data-value {
    font-size: 15px;
  }
  .intro-badge {
    font-size: 20px;
  }
}


/* === Popup d’intro – style Microsoft / pro === */

.intro-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.intro-modal {
  position: relative;
  width: 95%;
  max-width: 720px; /* 👉 plus large, vraie “card” */
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.28);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */

.intro-header {
  display: flex;
  align-items: flex-start;
  padding: 16px 18px 10px;
  border-bottom: 1px solid #e5e7eb;
  gap: 12px;
}

.intro-header-accent {
  width: 4px;
  align-self: stretch;
  border-radius: 999px;
  background: linear-gradient(180deg, #2563eb, #f97316);
}

.intro-header-text {
  flex: 1;
}

.intro-badge {
  display: inline-block;
  font-size: 31px;
  padding: 2px 8px;
  border-radius:2px;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  margin-bottom: 4px;
}

.intro-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.intro-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.intro-close {
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 20px;
  cursor: pointer;
  padding: 0 0 0 8px;
}

.intro-close:hover {
  color: #4b5563;
}

/* Corps */

.intro-body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 14px 18px 10px;
}

.intro-column {
  font-size: 13px;
}

.intro-section-title {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1f2933;
}

.intro-text {
  margin: 4px 0;
  font-size: 13px;
  line-height: 1.6;
  color: #4b5563;
}

.intro-text strong {
  font-weight: 600;
  color: #111827;
}

.intro-list {
  margin: 4px 0 0 14px;
  padding: 0;
  font-size: 13px;
  color: #4b5563;
}

.intro-list li {
  margin: 2px 0;
}

/* Footer */

.intro-footer {
  border-top: 1px solid #e5e7eb;
  padding: 10px 18px;
  display: flex;
  justify-content: flex-end;
}

.intro-primary {
  border: none;
  padding: 7px 18px;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  background: #2563eb;
  color: #ffffff;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.45);
}

.intro-primary:hover {
  filter: brightness(1.05);
}

/* Responsive */

@media (max-width: 640px) {
  .intro-body {
    grid-template-columns: 1fr;
    padding: 10px 12px 8px;
  }

  .intro-modal {
    border-radius: 8px;
  }

  .intro-header {
    padding: 12px 12px 8px;
  }

  .intro-title {
    font-size: 16px;
  }

  .intro-subtitle {
    font-size: 12px;
  }

  .intro-text,
  .intro-list {
    font-size: 12px;
  }

  .intro-footer {
    padding: 8px 12px;
  }
}

/* === Popup Export non disponible === */

.export-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.export-modal {
  width: 90%;
  max-width: 460px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.export-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.export-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.export-close {
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  color: #9ca3af;
}

.export-close:hover {
  color: #4b5563;
}

.export-body {
  padding: 12px 16px;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;
}

.export-body strong {
  color: #111827;
  font-weight: 600;
}

.export-footer {
  padding: 10px 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  background: #f9fafb;
}

.export-btn {
  border: none;
  padding: 7px 14px;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  background: #2563eb;
  color: #ffffff;
  font-weight: 500;
}

.export-btn:hover {
  background: #1d4ed8;
}
</style>
