<template>
  <AppModal :open="open" label="Me contacter" size="lg" @close="emit('close')">
    <div class="layout">
      <div class="cover">
        <span class="kicker">Et si c’était vos données ?</span>
        <h2 class="headline">Une carte comme celle-ci,<br />branchée sur votre activité.</h2>
        <p class="sub">
          Je conçois et développe des interfaces de visualisation sur mesure — de la maquette avec vos
          vraies données jusqu’à la connexion à vos outils.
        </p>
        <ul class="steps">
          <li v-for="s in STEPS" :key="s.title">
            <strong>{{ s.title }}</strong>
            <span>{{ s.text }}</span>
          </li>
        </ul>
        <p class="note">{{ author.name }} · {{ author.role }} · réponse sous 48 h.</p>
      </div>

      <form class="form" @submit.prevent="send">
        <h3 class="form-title">Demander des renseignements</h3>
        <p class="form-sub">Ce formulaire prépare un e-mail dans votre messagerie : rien n’est stocké ici.</p>

        <label class="field">
          <span>Votre nom</span>
          <input v-model="form.name" type="text" autocomplete="name" placeholder="Prénom Nom" required />
        </label>
        <label class="field">
          <span>Entreprise ou activité</span>
          <input v-model="form.company" type="text" autocomplete="organization" placeholder="Ex. réseau de 40 magasins, boutique Shopify…" />
        </label>
        <label class="field">
          <span>Votre besoin</span>
          <select v-model="form.need">
            <option v-for="n in NEEDS" :key="n" :value="n">{{ n }}</option>
          </select>
        </label>
        <label class="field">
          <span>Votre contexte</span>
          <textarea
            v-model="form.message"
            rows="4"
            placeholder="Quelles données avez-vous (CRM, Excel, boutique en ligne…) ? Qui utiliserait la carte ? Quelle question voulez-vous lire dessus ?"
          />
        </label>

        <div class="actions">
          <button type="submit" class="btn btn-primary">✉ Ouvrir l’e-mail pré-rempli</button>
          <button type="button" class="btn" @click="copyEmail">{{ copied ? 'Adresse copiée ✓' : 'Copier l’adresse' }}</button>
        </div>
        <p class="direct">
          Ou écrivez directement à <a :href="`mailto:${author.email}`">{{ author.email }}</a>
        </p>
      </form>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { author } = useAppConfig()
const { dataset, isDemo } = useDataset()
const toast = useToast()

const NEEDS = [
  'Renseignements généraux',
  'Une maquette avec mes données (1 à 2 semaines)',
  'Connecter la carte à mes outils (CRM, boutique, base)',
  'Une carte à l’échelle de ma ville ou de ma région',
  'Autre chose',
] as const

const STEPS = [
  { title: 'Cadrage — 1 semaine', text: 'On liste vos indicateurs, vos sources et vos utilisateurs.' },
  { title: 'Maquette interactive', text: 'Vous validez sur une version avec vos vraies données.' },
  { title: 'Intégration & livraison', text: 'Connexion à vos systèmes, sécurité, déploiement, formation.' },
]

const form = reactive({ name: '', company: '', need: NEEDS[0] as string, message: '' })
const copied = ref(false)

const mailto = computed(() => {
  const context = isDemo.value
    ? ''
    : `\n(J’ai testé la carte avec mon fichier « ${dataset.value.name} » : ${dataset.value.stats?.matched ?? 0} lignes, ${dataset.value.stats?.departements ?? 0} départements.)\n`
  const body = [
    'Bonjour,',
    '',
    `Je suis ${form.name || '…'}${form.company ? ` (${form.company})` : ''}.`,
    `Besoin : ${form.need}`,
    '',
    form.message || 'Contexte : …',
    context,
    'Pouvons-nous en discuter ?',
  ].join('\n')
  return `mailto:${author.email}?subject=${encodeURIComponent(`${author.subject} — ${form.need}`)}&body=${encodeURIComponent(body)}`
})

const send = () => {
  window.location.href = mailto.value
  toast.success('Votre messagerie s’ouvre avec l’e-mail pré-rempli. Relisez, puis envoyez.')
}

const copyEmail = async () => {
  try {
    await navigator.clipboard.writeText(author.email)
    copied.value = true
    toast.success(`Adresse copiée : ${author.email}`)
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    window.location.href = `mailto:${author.email}`
  }
}
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.cover {
  padding: 36px 32px;
  background:
    radial-gradient(circle at 85% 15%, rgba(249, 115, 22, 0.25), transparent 45%),
    radial-gradient(circle at 10% 90%, rgba(124, 58, 237, 0.22), transparent 50%),
    linear-gradient(135deg, #0f172a, #1e1b4b);
  color: #fff;
}

.kicker {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.headline {
  margin-top: 14px;
  font-family: var(--display);
  font-size: 26px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.sub {
  margin-top: 12px;
  font-size: 13.5px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.78);
}

.steps {
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.steps li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 12.5px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.78);
}

.steps strong {
  color: #fff;
  font-weight: 600;
}

.note {
  margin-top: 18px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.form {
  padding: 28px 28px 24px;
}

.form-title {
  font-family: var(--display);
  font-size: 18px;
  font-weight: 700;
}

.form-sub {
  margin: 4px 0 16px;
  font-size: 12px;
  color: var(--text-muted);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

input,
select,
textarea {
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-strong);
  background: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 400;
  color: var(--text);
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  outline: 2px solid var(--info);
  outline-offset: 1px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.direct {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-dim);
}

@media (max-width: 760px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .cover,
  .form {
    padding-left: 20px;
    padding-right: 20px;
  }

  .steps {
    display: none;
  }
}
</style>
