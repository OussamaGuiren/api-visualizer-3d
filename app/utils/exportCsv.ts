import type { Dept } from '~/types/departements'

const COLUMNS: { header: string; value: (d: Dept) => string | number }[] = [
  { header: 'Code', value: (d) => d.code },
  { header: 'Département', value: (d) => d.nom },
  { header: 'Région', value: (d) => d.region },
  { header: 'Clients actifs', value: (d) => d.clients },
  { header: 'CA (k€)', value: (d) => d.ca },
  { header: 'CA moyen par client (k€)', value: (d) => d.panier.toFixed(1) },
  { header: 'Objectif (k€)', value: (d) => d.objectif },
  { header: 'Atteinte objectif (%)', value: (d) => Math.round(d.atteinte * 100) },
  { header: 'Évolution (%)', value: (d) => d.evolution },
  { header: 'Rang national', value: (d) => d.rang },
]

const escape = (cell: string | number): string => {
  const text = String(cell)
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Sérialise les départements en CSV (séparateur « ; », compatible Excel FR). */
export const toCsv = (depts: Dept[]): string =>
  [COLUMNS.map((c) => c.header), ...depts.map((d) => COLUMNS.map((c) => c.value(d)))]
    .map((row) => row.map(escape).join(';'))
    .join('\r\n')

/** Déclenche le téléchargement du CSV côté navigateur. */
export const downloadCsv = (depts: Dept[], filename = 'performances-departements.csv'): void => {
  // BOM UTF-8 pour qu'Excel reconnaisse les accents.
  const blob = new Blob(['﻿', toCsv(depts)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), { href: url, download: filename })
  link.click()
  URL.revokeObjectURL(url)
}
