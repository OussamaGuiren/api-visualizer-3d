import type { Dept, MetricDef, MetricKey } from '~/types/departements'

const integer = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export const formatInt = (value: number): string => integer.format(value)
export const formatDecimal = (value: number): string => decimal.format(value)
export const formatSigned = (value: number): string => `${value > 0 ? '+' : ''}${decimal.format(value)}`
export const formatPercent = (ratio: number): string => `${integer.format(ratio * 100)} %`

export const METRICS: readonly MetricDef[] = [
  { key: 'ca', label: 'Chiffre d’affaires', short: 'CA', unit: 'k€', format: formatInt },
  { key: 'clients', label: 'Clients actifs', short: 'Clients', unit: '', format: formatInt },
  { key: 'panier', label: 'CA moyen par client', short: 'Panier', unit: 'k€', format: formatDecimal },
  { key: 'evolution', label: 'Évolution annuelle', short: 'Évolution', unit: '%', format: formatSigned, signed: true },
]

export const metricDef = (key: MetricKey): MetricDef => METRICS.find((m) => m.key === key) ?? METRICS[0]!

/** Valeur formatée avec son unité, ex. « 1 250 k€ ». */
export const formatMetric = (dept: Dept, key: MetricKey): string => {
  const def = metricDef(key)
  return def.unit ? `${def.format(dept[key])} ${def.unit}` : def.format(dept[key])
}
