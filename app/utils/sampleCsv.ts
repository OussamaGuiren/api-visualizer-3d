import type { DeptCode, DeptRaw } from '~/types/departements'

/**
 * Fichier d'exemple pour tester l'import : des commandes fictives sur 24 mois,
 * avec les colonnes les plus courantes d'un export e-commerce. Généré de façon
 * déterministe pour que l'exemple soit toujours le même.
 */

const PRENOMS = ['Camille', 'Lucas', 'Emma', 'Hugo', 'Léa', 'Nathan', 'Chloé', 'Louis', 'Manon', 'Jules', 'Inès', 'Arthur']
const NOMS = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent']
const PRODUITS = ['Coffret découverte', 'Abonnement annuel', 'Huile d’olive 50 cl', 'Pack famille', 'Carte cadeau', 'Kit débutant']

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const SAMPLE_FILENAME = 'exemple-commandes.csv'

export function buildSampleCsv(reference: Record<DeptCode, DeptRaw>, count = 900): string {
  const random = rng(20240601)
  const codes = Object.keys(reference)
  // Pondération : les départements « forts » de la démo reçoivent plus de commandes.
  const weights = codes.map((c) => Math.sqrt(reference[c]!.ca))
  const total = weights.reduce((s, w) => s + w, 0)
  const pickCode = () => {
    let r = random() * total
    for (let i = 0; i < codes.length; i++) {
      r -= weights[i]!
      if (r <= 0) return codes[i]!
    }
    return codes[codes.length - 1]!
  }

  const end = new Date(2025, 11, 31)
  const rows: string[] = ['date;client;code_postal;ville;produit;montant']
  for (let i = 0; i < count; i++) {
    const code = pickCode()
    const dept = reference[code]!
    // Léger biais vers les 12 derniers mois pour produire une évolution positive plausible (~ +15 %).
    const monthsBack = Math.floor(random() ** 1.12 * 24)
    const date = new Date(end.getFullYear(), end.getMonth() - monthsBack, 1 + Math.floor(random() * 28))
    const cp = code === '2A' ? '20000' : code === '2B' ? '20200' : `${code}${String(Math.floor(random() * 900)).padStart(3, '0')}`
    const client = `${PRENOMS[Math.floor(random() * PRENOMS.length)]} ${NOMS[Math.floor(random() * NOMS.length)]}`
    const produit = PRODUITS[Math.floor(random() * PRODUITS.length)]
    const montant = (18 + random() * 240).toFixed(2).replace('.', ',')
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    rows.push([iso, client, cp, dept.ville, produit, montant].join(';'))
  }
  return rows.join('\r\n')
}

export function downloadSampleCsv(reference: Record<DeptCode, DeptRaw>): void {
  const blob = new Blob(['﻿', buildSampleCsv(reference)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), { href: url, download: SAMPLE_FILENAME })
  link.click()
  URL.revokeObjectURL(url)
}
