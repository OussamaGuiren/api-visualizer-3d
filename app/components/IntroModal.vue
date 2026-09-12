<template>
  <AppModal :open="open" label="Présentation" size="lg" @close="emit('close')">
    <header class="head">
      <span class="tag tag-accent">Démo interactive · testable avec vos données</span>
      <h2 class="title">Lire un territoire en <em>trois secondes</em>.</h2>
      <p class="lead">
        Vous avez des chiffres par zone — commandes, clients, interventions, adhérents — dans un CRM, un
        ERP ou un simple export Excel. Cette carte les rend lisibles d’un coup d’œil : où ça marche, où ça
        progresse, où agir.
      </p>
    </header>

    <div class="pillars">
      <article class="pillar">
        <span class="pillar-icon" aria-hidden="true">👀</span>
        <h3>Voir</h3>
        <p>Chaque département monte et se colore selon l’indicateur choisi. Fiche détaillée au clic, poids régional, recommandation.</p>
      </article>
      <article class="pillar">
        <span class="pillar-icon" aria-hidden="true">🧪</span>
        <h3>Tester</h3>
        <p>Glissez un CSV : vos chiffres s’affichent en quelques secondes, sans rien envoyer sur un serveur. Un fichier d’exemple est fourni.</p>
      </article>
      <article class="pillar">
        <span class="pillar-icon" aria-hidden="true">🔌</span>
        <h3>Connecter</h3>
        <p>En projet : mise à jour automatique depuis un Google Sheet, Shopify, HubSpot ou votre base — et une maille ville, région ou pays.</p>
      </article>
    </div>

    <div class="paliers">
      <span class="eyebrow">Trois paliers, un seul outil</span>
      <ol>
        <li><b>Fichier</b> — vous déposez un export quand vous voulez. <em>Disponible ici.</em></li>
        <li><b>Lien</b> — la carte relit un Google Sheet ou un fichier partagé toutes les heures.</li>
        <li><b>Connecteur</b> — branchée sur votre outil, la carte se met à jour toute seule.</li>
      </ol>
    </div>

    <footer class="foot">
      <div class="links">
        <button type="button" class="btn btn-ghost" @click="emit('usecases')">Cas d’usage</button>
        <button type="button" class="btn btn-ghost" @click="emit('data')">D’où viennent les données ?</button>
        <button type="button" class="btn btn-ghost" @click="emit('tour')">Visite guidée</button>
      </div>
      <div class="actions">
        <button type="button" class="btn" @click="emit('import')">Tester mes données</button>
        <button type="button" class="btn btn-primary" @click="emit('close')">Explorer la démo</button>
      </div>
    </footer>
  </AppModal>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; usecases: []; data: []; import: []; tour: [] }>()
</script>

<style scoped>
.head {
  padding: 28px 28px 20px;
  border-bottom: 1px solid var(--border);
}

.title {
  margin-top: 12px;
  font-family: var(--display);
  font-size: 28px;
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
  max-width: 68ch;
  font-size: 14px;
  color: var(--text-muted);
}

.pillars {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 20px 28px 8px;
}

.pillar {
  padding: 16px;
  border-radius: var(--radius);
  background: var(--tile-bg);
  border: 1px solid var(--border);
}

.pillar-icon {
  font-size: 22px;
}

.pillar h3 {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 700;
}

.pillar p {
  margin-top: 4px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-muted);
}

.paliers {
  padding: 12px 28px 20px;
}

.paliers ol {
  margin: 8px 0 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-muted);
}

.paliers b {
  color: var(--text);
}

.paliers em {
  font-style: normal;
  color: var(--positive);
  font-weight: 600;
}

.foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 28px;
  border-top: 1px solid var(--border);
  background: var(--foot-bg);
}

.links,
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.actions {
  gap: 8px;
}

@media (max-width: 760px) {
  .head,
  .pillars,
  .paliers,
  .foot {
    padding-left: 16px;
    padding-right: 16px;
  }

  .pillars {
    grid-template-columns: 1fr;
  }

  .foot {
    flex-direction: column;
    align-items: stretch;
  }

  .links {
    display: none;
  }
}
</style>
