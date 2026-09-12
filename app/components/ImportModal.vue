<template>
  <AppModal :open="open" label="Tester avec mes données" size="lg" @close="emit('close')">
    <header class="head">
      <span class="tag tag-accent">Testez en direct</span>
      <h2 class="title">Mettez <em>vos</em> chiffres sur la carte</h2>
      <p class="lead">
        Un export de commandes, de clients, d’interventions… n’importe quel fichier avec un code postal
        ou un département par ligne. <strong>Tout se calcule dans votre navigateur : rien n’est envoyé.</strong>
      </p>
      <ol class="steps" aria-label="Étapes">
        <li :class="{ active: step === 1, done: step > 1 }"><span>1</span> Fichier</li>
        <li :class="{ active: step === 2 }"><span>2</span> Colonnes</li>
        <li><span>3</span> Carte</li>
      </ol>
    </header>

    <!-- Étape 1 : fichier -->
    <div v-if="step === 1" class="body">
      <label
        class="drop"
        :class="{ over: dragging }"
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
        @drop.prevent="onDrop"
      >
        <input type="file" accept=".csv,text/csv,.txt" class="drop-input" @change="onPick" />
        <span class="drop-icon" aria-hidden="true">⤓</span>
        <span class="drop-title">Glissez votre fichier CSV ici</span>
        <span class="drop-sub">ou cliquez pour le choisir · export Shopify, WooCommerce, Excel, CRM…</span>
      </label>

      <div class="or"><span>ou</span></div>

      <div class="sample">
        <div>
          <p class="sample-title">Pas de fichier sous la main ?</p>
          <p class="sample-text">
            Essayez avec un exemple : 900 commandes fictives sur 24 mois
            (<code>date;client;code_postal;ville;produit;montant</code>).
          </p>
        </div>
        <div class="sample-actions">
          <button type="button" class="btn btn-primary" @click="useSample">Essayer avec l’exemple</button>
          <button type="button" class="btn btn-ghost" @click="downloadSample">Télécharger le CSV</button>
        </div>
      </div>

      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <details class="help">
        <summary>Quelles colonnes sont attendues ?</summary>
        <ul>
          <li><strong>Obligatoire</strong> — une colonne de <em>code postal</em>, de <em>code département</em> (01…95, 2A, 2B) ou de <em>nom de département</em>.</li>
          <li><strong>Recommandé</strong> — un <em>montant</em> (sinon on compte les lignes) et un <em>identifiant client</em> (e-mail, nom…) pour compter les clients distincts.</li>
          <li><strong>Optionnel</strong> — une <em>date</em> : avec au moins 13 mois de données, la carte affiche l’évolution sur un an.</li>
        </ul>
        <p>Séparateur (; , tabulation), guillemets et formats de nombres français (« 1 234,56 ») sont détectés automatiquement. Les DOM-TOM ne sont pas encore sur cette carte.</p>
        <p class="examples-title">Autres fichiers d’exemple à télécharger :</p>
        <ul class="examples">
          <li v-for="ex in EXAMPLES" :key="ex.file">
            <a :href="`/exemples/${ex.file}`" download>{{ ex.file }}</a> — {{ ex.note }}
          </li>
        </ul>
      </details>
    </div>

    <!-- Étape 2 : colonnes -->
    <div v-else-if="step === 2 && parsed" class="body">
      <div class="mapping">
        <section class="mapping-form">
          <h3 class="section-title">Comment lire votre fichier</h3>
          <p class="section-sub">{{ fileName }} · {{ formatInt(parsed.rows.length) }} lignes · colonnes détectées automatiquement, corrigez si besoin.</p>

          <label class="field">
            <span>Colonne géographique <b>*</b></span>
            <span class="field-row">
              <select v-model.number="mapping.geo">
                <option v-for="(h, i) in parsed.headers" :key="i" :value="i">{{ h || `Colonne ${i + 1}` }}</option>
              </select>
              <select v-model="mapping.geoKind" aria-label="Nature de la colonne">
                <option value="cp">Code postal</option>
                <option value="dept">Code département</option>
                <option value="nom">Nom du département</option>
              </select>
            </span>
          </label>

          <label class="field">
            <span>Montant</span>
            <select v-model="mapping.amount">
              <option :value="null">— Compter les lignes —</option>
              <option v-for="(h, i) in parsed.headers" :key="i" :value="i">{{ h || `Colonne ${i + 1}` }}</option>
            </select>
          </label>

          <label class="field">
            <span>Identifiant client</span>
            <select v-model="mapping.client">
              <option :value="null">— Compter les lignes —</option>
              <option v-for="(h, i) in parsed.headers" :key="i" :value="i">{{ h || `Colonne ${i + 1}` }}</option>
            </select>
          </label>

          <label class="field">
            <span>Date</span>
            <select v-model="mapping.date">
              <option :value="null">— Aucune —</option>
              <option v-for="(h, i) in parsed.headers" :key="i" :value="i">{{ h || `Colonne ${i + 1}` }}</option>
            </select>
          </label>

          <div class="field-grid">
            <label class="field">
              <span>Nom de l’indicateur</span>
              <input v-model="labelCa" type="text" placeholder="Chiffre d’affaires" />
            </label>
            <label class="field">
              <span>Unité</span>
              <input v-model="unit" type="text" placeholder="€" />
            </label>
            <label class="field">
              <span>Nom du compteur</span>
              <input v-model="labelClients" type="text" placeholder="Clients" />
            </label>
          </div>
        </section>

        <section class="mapping-preview">
          <h3 class="section-title">Résultat</h3>
          <div v-if="result" class="stats">
            <div class="stat">
              <span class="stat-value num" :class="{ warn: matchRate < 0.5 }">{{ formatPercent(matchRate) }}</span>
              <span class="stat-label">des lignes rattachées à un département</span>
            </div>
            <ul class="stat-list">
              <li><b class="num">{{ formatInt(result.stats.matched) }}</b> lignes utilisées sur {{ formatInt(result.stats.rows) }}</li>
              <li><b class="num">{{ result.stats.departements }}</b> départements couverts</li>
              <li v-if="result.stats.ignored"><b class="num">{{ formatInt(result.stats.ignored) }}</b> ignorées (valeur vide ou non reconnue)</li>
              <li v-if="result.stats.offMap"><b class="num">{{ formatInt(result.stats.offMap) }}</b> hors métropole (non affichables)</li>
              <li v-if="mapping.date !== null">
                <b class="num">{{ result.stats.monthsSpan }}</b> mois de données —
                <span v-if="result.stats.hasDates">évolution sur un an disponible</span>
                <span v-else>il en faut 13 pour calculer l’évolution</span>
              </li>
            </ul>
            <p v-if="matchRate < 0.5" class="warn-text">
              Peu de lignes reconnues : vérifiez la colonne géographique et sa nature (code postal / département / nom).
            </p>
          </div>

          <div class="preview">
            <table>
              <thead>
                <tr>
                  <th v-for="(h, i) in parsed.headers" :key="i" :class="roleOf(i)">
                    {{ h || `Col. ${i + 1}` }}
                    <small v-if="roleOf(i)">{{ ROLE_LABEL[roleOf(i)!] }}</small>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, r) in parsed.rows.slice(0, 5)" :key="r">
                  <td v-for="(_, i) in parsed.headers" :key="i" :class="roleOf(i)">{{ row[i] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>

    <footer class="foot">
      <p class="privacy">🔒 Vos données restent dans votre navigateur. Elles sont mémorisées localement pour votre prochaine visite.</p>
      <div class="foot-actions">
        <button v-if="step === 2" type="button" class="btn btn-ghost" @click="step = 1">← Autre fichier</button>
        <button v-if="step === 2" type="button" class="btn btn-primary" :disabled="!result || result.stats.matched === 0" @click="applyImport">
          Afficher sur la carte →
        </button>
      </div>
    </footer>
  </AppModal>
</template>

<script setup lang="ts">
import type { Dataset, MetricKey } from '~/types/departements'
import { parseCsv, detectColumns, aggregate, normalizeName, type ParsedCsv, type ColumnMapping, type AggregateResult } from '~/utils/csv'
import { buildSampleCsv, downloadSampleCsv, SAMPLE_FILENAME } from '~/utils/sampleCsv'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; applied: [] }>()

const demo = useDepartementsRaw()
const { apply } = useDataset()
const toast = useToast()

const step = ref<1 | 2>(1)
const dragging = ref(false)
const error = ref<string | null>(null)
const fileName = ref('')
const parsed = ref<ParsedCsv | null>(null)
const mapping = reactive<ColumnMapping>({ geo: 0, geoKind: 'cp', amount: null, client: null, date: null })
const labelCa = ref('')
const unit = ref('€')
const labelClients = ref('')

const ROLE_LABEL = { geo: 'géo', amount: 'montant', client: 'client', date: 'date' } as const

/** Fichiers de public/exemples/, générés par scripts/generate-examples.mjs. */
const EXAMPLES = [
  { file: 'boutique-complet.csv', note: 'export e-commerce complet, 24 mois' },
  { file: 'boutique-partiel.csv', note: 'fichier imparfait : zéros perdus, « € », codes vides, DOM-TOM' },
  { file: 'minimal-code-postal.csv', note: 'une seule colonne, on compte les lignes' },
  { file: 'minimal-departement.csv', note: 'code département + montant, virgules' },
  { file: 'artisan-interventions.csv', note: 'noms de départements, montants HT' },
  { file: 'association-adherents.csv', note: 'adhérents, tabulations, sans montant' },
  { file: 'commercial-par-departement.csv', note: 'déjà agrégé, une ligne par département' },
] as const
type Role = keyof typeof ROLE_LABEL

const roleOf = (i: number): Role | null =>
  i === mapping.geo ? 'geo' : i === mapping.amount ? 'amount' : i === mapping.client ? 'client' : i === mapping.date ? 'date' : null

const byName = computed(() => new Map(Object.entries(demo.value).map(([code, d]) => [normalizeName(d.nom), code])))

const result = computed<AggregateResult | null>(() => {
  if (!parsed.value) return null
  try {
    return aggregate(parsed.value, mapping, demo.value)
  } catch {
    return null
  }
})

const matchRate = computed(() => (result.value && result.value.stats.rows ? result.value.stats.matched / result.value.stats.rows : 0))

const load = (text: string, name: string) => {
  error.value = null
  try {
    const p = parseCsv(text)
    if (p.headers.length < 2) throw new Error('Une seule colonne détectée : vérifiez le séparateur du fichier.')
    parsed.value = p
    fileName.value = name
    Object.assign(mapping, detectColumns(p, byName.value))
    labelCa.value = mapping.amount === null ? 'Enregistrements' : ''
    unit.value = mapping.amount === null ? '' : '€'
    labelClients.value = mapping.client === null ? 'Lignes' : ''
    step.value = 2
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Fichier illisible.'
  }
}

const readFile = (file: File) => {
  if (file.size > 20 * 1024 * 1024) {
    error.value = 'Fichier trop volumineux (20 Mo maximum pour un test dans le navigateur).'
    return
  }
  const reader = new FileReader()
  reader.onload = () => load(String(reader.result ?? ''), file.name)
  reader.onerror = () => (error.value = 'Impossible de lire ce fichier.')
  reader.readAsText(file, 'utf-8')
}

const onPick = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) readFile(file)
}

const onDrop = (e: DragEvent) => {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) readFile(file)
}

const useSample = () => load(buildSampleCsv(demo.value), SAMPLE_FILENAME)
const downloadSample = () => {
  downloadSampleCsv(demo.value)
  toast.info('Exemple téléchargé — glissez-le dans la zone pour l’importer.')
}

const applyImport = () => {
  if (!result.value) return
  const metrics: MetricKey[] = ['ca', 'clients', 'panier']
  if (result.value.stats.hasDates) metrics.push('evolution')
  const dataset: Dataset = {
    source: 'csv',
    name: fileName.value,
    unit: unit.value.trim(),
    labels: {
      ca: labelCa.value.trim() || (mapping.amount === null ? 'Enregistrements' : 'Chiffre d’affaires'),
      clients: labelClients.value.trim() || (mapping.client === null ? 'Lignes' : 'Clients'),
    },
    metrics,
    hasObjectif: false,
    data: result.value.data,
    stats: {
      rows: result.value.stats.rows,
      matched: result.value.stats.matched,
      ignored: result.value.stats.ignored + result.value.stats.offMap,
      departements: result.value.stats.departements,
    },
    importedAt: new Date().toISOString(),
  }
  apply(dataset)
  toast.success(`${formatInt(dataset.stats!.matched)} lignes de « ${dataset.name} » sont sur la carte.`)
  emit('applied')
  emit('close')
  step.value = 1
  parsed.value = null
}
</script>

<style scoped>
.head {
  padding: 28px 28px 18px;
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
  max-width: 66ch;
  font-size: 14px;
  color: var(--text-muted);
}

.lead strong {
  color: var(--text);
}

.steps {
  display: flex;
  gap: 18px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dim);
}

.steps li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.steps span {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--border-strong);
  font-size: 11px;
}

.steps .active {
  color: var(--accent-text);
}

.steps .active span {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.steps .done span {
  background: var(--positive);
  border-color: var(--positive);
  color: #fff;
}

.body {
  padding: 22px 28px;
}

.drop {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 34px 20px;
  border: 2px dashed var(--border-strong);
  border-radius: var(--radius);
  background: var(--tile-bg);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.drop:hover,
.drop.over {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.drop-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.drop-icon {
  font-size: 26px;
  color: var(--accent);
}

.drop-title {
  font-size: 15px;
  font-weight: 600;
}

.drop-sub {
  font-size: 12px;
  color: var(--text-muted);
}

.or {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  color: var(--text-dim);
  font-size: 12px;
}

.or::before,
.or::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.sample {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.sample-title {
  font-size: 14px;
  font-weight: 600;
}

.sample-text {
  margin-top: 2px;
  font-size: 12.5px;
  color: var(--text-muted);
}

.sample-text code {
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--tile-bg);
  border: 1px solid var(--border);
}

.sample-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.error {
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: #fef2f2;
  border: 1px solid rgba(220, 38, 38, 0.3);
  color: var(--negative);
  font-size: 13px;
}

.help {
  margin-top: 16px;
  font-size: 12.5px;
  color: var(--text-muted);
}

.help summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--text);
}

.help ul {
  margin: 8px 0;
  padding-left: 18px;
}

.help li {
  margin: 4px 0;
}

.examples-title {
  margin-top: 10px;
  font-weight: 600;
  color: var(--text);
}

.examples {
  margin-top: 4px !important;
}

.examples a {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px;
  color: var(--accent-text);
}

.mapping {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  gap: 24px;
}

.mapping-form,
.mapping-preview {
  min-width: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
}

.section-sub {
  margin: 2px 0 12px;
  font-size: 12px;
  color: var(--text-muted);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.field b {
  color: var(--accent);
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.field-grid {
  display: grid;
  grid-template-columns: 1.4fr 0.6fr 1fr;
  gap: 8px;
}

select,
input[type='text'] {
  height: 34px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-strong);
  background: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 400;
  color: var(--text);
}

select:focus,
input:focus {
  outline: 2px solid var(--info);
  outline-offset: 1px;
}

.stats {
  padding: 14px;
  border-radius: var(--radius);
  background: var(--tile-bg);
  border: 1px solid var(--border);
}

.stat {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.stat-value {
  font-family: var(--display);
  font-size: 28px;
  font-weight: 700;
  color: var(--positive);
}

.stat-value.warn {
  color: var(--negative);
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
}

.stat-list {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  font-size: 12.5px;
  color: var(--text-muted);
}

.stat-list li {
  margin: 2px 0;
}

.stat-list b {
  color: var(--text);
}

.warn-text {
  margin-top: 8px;
  font-size: 12px;
  color: var(--negative);
}

.preview {
  margin-top: 12px;
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.preview table {
  border-collapse: collapse;
  width: 100%;
  font-size: 11.5px;
}

.preview th,
.preview td {
  padding: 6px 8px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--border);
}

.preview th {
  background: var(--tile-bg);
  font-weight: 600;
}

.preview th small {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--accent-text);
}

.preview .geo {
  background: var(--accent-soft);
}

.preview .amount {
  background: #eff6ff;
}

.preview .client {
  background: #f5f3ff;
}

.preview .date {
  background: #ecfdf5;
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

.privacy {
  font-size: 12px;
  color: var(--text-muted);
}

.foot-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 820px) {
  .mapping {
    grid-template-columns: 1fr;
  }

  .sample,
  .foot {
    flex-direction: column;
    align-items: stretch;
  }

  .head,
  .body,
  .foot {
    padding-left: 16px;
    padding-right: 16px;
  }

  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
