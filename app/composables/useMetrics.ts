import type { Dept, MetricDef, MetricKey } from '~/types/departements'

/**
 * Métriques disponibles pour le jeu de données courant, avec libellés et
 * unités adaptés (la démo parle de CA en k€, un import peut parler de
 * commandes en €, d'interventions, d'adhérents…).
 */
export const useMetrics = () => {
  const { dataset } = useDataset()

  const metrics = computed<MetricDef[]>(() =>
    METRICS.filter((m) => dataset.value.metrics.includes(m.key)).map((m) => {
      const { labels, unit } = dataset.value
      switch (m.key) {
        case 'ca':
          return { ...m, label: labels.ca, unit }
        case 'clients':
          return { ...m, label: labels.clients, short: labels.clients.split(' ')[0] ?? m.short, unit: '' }
        case 'panier':
          return { ...m, label: `${labels.ca} par ${singular(labels.clients)}`, unit }
        default:
          return m
      }
    }),
  )

  const def = (key: MetricKey): MetricDef => metrics.value.find((m) => m.key === key) ?? metrics.value[0] ?? METRICS[0]!

  /** Valeur formatée avec son unité, ex. « 1 250 k€ ». */
  const format = (dept: Dept, key: MetricKey): string => {
    const d = def(key)
    return d.unit ? `${d.format(dept[key])} ${d.unit}` : d.format(dept[key])
  }

  /** Valeur brute formatée avec l'unité de la métrique (pour les agrégats nationaux). */
  const formatValue = (value: number, key: MetricKey): string => {
    const d = def(key)
    return d.unit ? `${d.format(value)} ${d.unit}` : d.format(value)
  }

  return { metrics, def, format, formatValue }
}

/** « Clients actifs » → « client » ; approximation suffisante pour un libellé. */
const singular = (label: string): string => {
  const word = (label.split(' ')[0] ?? label).toLowerCase()
  return word.endsWith('s') ? word.slice(0, -1) : word
}
