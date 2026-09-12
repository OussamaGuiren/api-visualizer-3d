/**
 * Génère des fichiers CSV fictifs pour tester l'import, dans public/exemples/.
 * Chaque fichier illustre un cas : export complet, fichier « sale », colonnes
 * minimales, noms de départements, séparateur virgule, tabulation…
 *
 * Usage : node scripts/generate-examples.mjs
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'

const OUT = new URL('../public/exemples/', import.meta.url)
mkdirSync(OUT, { recursive: true })

const reference = JSON.parse(readFileSync(new URL('../app/assets/data/departements-info.json', import.meta.url), 'utf8'))
const codes = Object.keys(reference)

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PRENOMS = ['Camille', 'Lucas', 'Emma', 'Hugo', 'Léa', 'Nathan', 'Chloé', 'Louis', 'Manon', 'Jules', 'Inès', 'Arthur', 'Zoé', 'Gabriel']
const NOMS = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Garcia']
const PRODUITS = [
  ['Coffret découverte 3 savons', 24.9],
  ['Savon lait d’ânesse', 6.5],
  ['Huile sèche 100 ml', 18],
  ['Baume réparateur', 12.9],
  ['Shampoing solide', 9.9],
  ['Bougie cire de soja', 22],
  ['Trousse toilette lin', 29],
  ['Carte cadeau 50 €', 50],
]

const pad = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const fr = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`

const pick = (random, list) => list[Math.floor(random() * list.length)]
const weightedCode = (random) => {
  // Les départements « forts » de la démo reçoivent plus de lignes.
  const weights = codes.map((c) => Math.sqrt(reference[c].ca))
  const total = weights.reduce((s, w) => s + w, 0)
  let r = random() * total
  for (let i = 0; i < codes.length; i++) {
    r -= weights[i]
    if (r <= 0) return codes[i]
  }
  return codes[codes.length - 1]
}
const postalFor = (code, random) =>
  code === '2A' ? '20000' : code === '2B' ? '20200' : `${code}${String(Math.floor(random() * 900)).padStart(3, '0')}`
const dateBack = (random, months, end = new Date(2025, 11, 31)) => {
  const back = Math.floor(random() ** 1.15 * months)
  return new Date(end.getFullYear(), end.getMonth() - back, 1 + Math.floor(random() * 28))
}

const files = []
const write = (name, header, rows, note) => {
  writeFileSync(new URL(name, OUT), '﻿' + [header, ...rows].join('\r\n') + '\r\n')
  files.push({ name, rows: rows.length, note })
}

// 1. Boutique e-commerce : export complet, toutes les colonnes, 24 mois --------------------
{
  const random = rng(101)
  const rows = []
  for (let i = 0; i < 600; i++) {
    const code = weightedCode(random)
    const d = dateBack(random, 24)
    const [produit, prix] = pick(random, PRODUITS)
    const qte = 1 + Math.floor(random() ** 2 * 4)
    const prenom = pick(random, PRENOMS)
    const nom = pick(random, NOMS)
    const email = `${prenom}.${nom}${Math.floor(random() * 90)}@exemple.fr`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    rows.push(
      [
        iso(d),
        `CMD-${2024 + Math.floor(i / 400)}-${String(i + 1).padStart(4, '0')}`,
        email,
        postalFor(code, random),
        reference[code].ville,
        produit,
        qte,
        (prix * qte + 4.9).toFixed(2).replace('.', ','),
        random() < 0.15 ? 'Retrait boutique' : 'Colissimo',
      ].join(';'),
    )
  }
  write(
    'boutique-complet.csv',
    'date;numero_commande;client_email;code_postal;ville;produit;quantite;montant_ttc;livraison',
    rows,
    'Export type Shopify/WooCommerce : date, client, code postal, montant → tous les indicateurs, évolution incluse.',
  )
}

// 2. Boutique : fichier « comme dans la vraie vie » -------------------------------------------
//    Zéros perdus par Excel, montants avec €, codes postaux vides, DOM-TOM, doublons de format.
{
  const random = rng(202)
  const rows = []
  for (let i = 0; i < 250; i++) {
    const code = weightedCode(random)
    const d = dateBack(random, 14)
    const [produit, prix] = pick(random, PRODUITS)
    let cp = postalFor(code, random)
    const roll = random()
    if (roll < 0.08) cp = '' // code postal manquant → ligne ignorée
    else if (roll < 0.13) cp = '97400' // La Réunion → hors carte
    else if (roll < 0.25 && cp.startsWith('0')) cp = cp.slice(1) // « 1000 » au lieu de 01000
    else if (roll < 0.35) cp = cp.slice(0, 2) + ' ' + cp.slice(2) // « 75 011 »
    const montant = random() < 0.05 ? '' : random() < 0.5 ? `${(prix + 4.9).toFixed(2).replace('.', ',')} €` : (prix + 4.9).toFixed(2)
    rows.push([fr(d), `${pick(random, PRENOMS)} ${pick(random, NOMS)}`, cp, produit, montant].join(';'))
  }
  write(
    'boutique-partiel.csv',
    'Date;Client;CP;Article;Total',
    rows,
    'Fichier imparfait : dates au format 14/03/2025, zéros initiaux perdus, « 75 011 », montants avec €, codes postaux vides ou DOM-TOM → l’aperçu compte les lignes ignorées.',
  )
}

// 3. Minimal : une seule colonne (code postal) → on compte les lignes ----------------------
{
  const random = rng(303)
  const rows = []
  for (let i = 0; i < 300; i++) rows.push(postalFor(weightedCode(random), random))
  write('minimal-code-postal.csv', 'code_postal', rows, 'La seule colonne obligatoire. Pas de montant : la carte compte les lignes (« Enregistrements »).')
}

// 4. Minimal : code département + montant, séparateur virgule ----------------------------------
{
  const random = rng(404)
  const rows = []
  for (let i = 0; i < 200; i++) {
    const code = weightedCode(random)
    rows.push(`${code},${(50 + random() * 1200).toFixed(0)}`)
  }
  write('minimal-departement.csv', 'departement,montant', rows, 'Codes département (01…95, 2A, 2B) et montant, séparés par des virgules.')
}

// 5. Artisan : interventions par nom de département, montants HT, virgule + guillemets ---------
{
  const random = rng(505)
  const TYPES = ['Dépannage', 'Installation', 'Entretien', 'Devis', 'Urgence']
  const rows = []
  for (let i = 0; i < 180; i++) {
    const code = weightedCode(random)
    const d = dateBack(random, 18)
    const type = pick(random, TYPES)
    const duree = (0.5 + random() * 6).toFixed(1)
    const montant = (Number(duree) * (55 + random() * 40) + (type === 'Installation' ? 400 : 0)).toFixed(2)
    rows.push([iso(d), `"${reference[code].nom}"`, type, duree, montant].join(','))
  }
  write(
    'artisan-interventions.csv',
    'date,departement,type_intervention,duree_h,montant_ht',
    rows,
    'Plombier / électricien : nom du département entre guillemets, pas de client → renommez l’indicateur « CA HT » et le compteur « Interventions ».',
  )
}

// 6. Association : adhérents, ni montant ni date, séparateur tabulation ------------------------
{
  const random = rng(606)
  const STATUTS = ['Actif', 'Actif', 'Actif', 'Bienfaiteur', 'Étudiant']
  const rows = []
  for (let i = 0; i < 220; i++) {
    const code = weightedCode(random)
    rows.push([`ADH-${String(i + 1).padStart(4, '0')}`, postalFor(code, random), reference[code].ville, pick(random, STATUTS)].join('\t'))
  }
  write(
    'association-adherents.csv',
    'adherent_id\tcode_postal\tville\tstatut',
    rows,
    'Liste d’adhérents séparée par tabulations : identifiant + code postal → nombre d’adhérents par département.',
  )
}

// 7. Force de vente : chiffre par département déjà agrégé, avec objectif (colonne ignorée) -----
{
  const random = rng(707)
  const rows = codes.map((code) => {
    const ca = Math.round(reference[code].ca * (0.7 + random() * 0.6) * 1000)
    return [code, reference[code].nom, pick(random, NOMS), ca, Math.round(ca * (0.9 + random() * 0.3))].join(';')
  })
  write(
    'commercial-par-departement.csv',
    'code_dept;departement;commercial;ca_annuel;objectif',
    rows,
    'Déjà agrégé (une ligne par département) : la carte lit directement le CA annuel ; les colonnes non mappées sont ignorées.',
  )
}

writeFileSync(
  new URL('README.md', OUT),
  [
    '# Fichiers d’exemple pour l’import',
    '',
    'Tous fictifs, générés par `scripts/generate-examples.mjs`. Glissez-les dans « Tester mes données ».',
    '',
    '| Fichier | Lignes | Ce qu’il illustre |',
    '| --- | --- | --- |',
    ...files.map((f) => `| \`${f.name}\` | ${f.rows} | ${f.note} |`),
    '',
  ].join('\n'),
)

for (const f of files) console.log(`${f.name.padEnd(34)} ${String(f.rows).padStart(4)} lignes`)
