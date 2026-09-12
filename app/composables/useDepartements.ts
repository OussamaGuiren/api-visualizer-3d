import type { Dept, DeptCode, DeptRaw, MetricKey, RegionStats } from '~/types/departements'
import type { DeptValue } from '~/three/FranceMap'

/**
 * Expose les indicateurs par département et les agrégats dérivés
 * (rangs, totaux nationaux, régions) ainsi que la normalisation pour les cartes.
 *
 * Les données brutes sont chargées une seule fois depuis `GET /api/departements`
 * (voir `loadDepartements`, appelé dans app.vue) et partagées via `useState`.
 */
export const useDepartementsRaw = () => useState<Record<DeptCode, DeptRaw>>('departements-raw', () => ({}))

export const loadDepartements = async () => {
  const raw = useDepartementsRaw()
  if (Object.keys(raw.value).length) return
  raw.value = await $fetch<Record<DeptCode, DeptRaw>>('/api/departements')
}

export const useDepartements = () => {
  const demo = useDepartementsRaw()
  const { dataset } = useDataset()
  // Un import du visiteur remplace la démo ; la démo sert de référence géographique.
  const raw = computed(() => dataset.value.data ?? demo.value)

  const depts = computed<Dept[]>(() => {
    const list = Object.entries(raw.value).map(([code, d]) => ({
      ...d,
      code,
      panier: d.clients ? d.ca / d.clients : 0,
      atteinte: d.objectif ? d.ca / d.objectif : 0,
      rang: 0,
    }))
    ;[...list].sort((a, b) => b.ca - a.ca).forEach((d, i) => (d.rang = i + 1))
    return list.sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }))
  })

  const byCode = computed(() => new Map(depts.value.map((d) => [d.code, d])))

  const national = computed(() => {
    const ca = depts.value.reduce((sum, d) => sum + d.ca, 0)
    const clients = depts.value.reduce((sum, d) => sum + d.clients, 0)
    const objectif = depts.value.reduce((sum, d) => sum + d.objectif, 0)
    // Évolution nationale pondérée par le CA de chaque département.
    const evolution = ca ? depts.value.reduce((sum, d) => sum + d.evolution * d.ca, 0) / ca : 0
    return { ca, clients, objectif, evolution, panier: clients ? ca / clients : 0, atteinte: objectif ? ca / objectif : 0 }
  })

  const regions = computed<RegionStats[]>(() => {
    const map = new Map<string, RegionStats>()
    for (const d of depts.value) {
      const stats = map.get(d.region) ?? { region: d.region, ca: 0, clients: 0, departements: 0 }
      stats.ca += d.ca
      stats.clients += d.clients
      stats.departements += 1
      map.set(d.region, stats)
    }
    return [...map.values()].sort((a, b) => b.ca - a.ca)
  })

  const regionOf = (dept: Dept): RegionStats | undefined => regions.value.find((r) => r.region === dept.region)

  const siblings = (dept: Dept): Dept[] => depts.value.filter((d) => d.region === dept.region && d.code !== dept.code)

  const top = (metric: MetricKey, count = 5): Dept[] =>
    [...depts.value].sort((a, b) => b[metric] - a[metric]).slice(0, count)

  const rankOn = (dept: Dept, metric: MetricKey): number =>
    depts.value.filter((d) => d[metric] > dept[metric]).length + 1

  /**
   * Normalise une métrique pour les cartes : la couleur suit le rang (répartition
   * uniforme de la palette), la hauteur suit la valeur (racine carrée pour que
   * Paris n'écrase pas le reste du territoire).
   */
  const mapValues = (metric: MetricKey): Map<DeptCode, DeptValue> => {
    const list = depts.value
    const values = list.map((d) => d[metric])
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = max - min || 1
    const sorted = [...values].sort((a, b) => a - b)
    const signed = metricDef(metric).signed === true
    const maxAbs = Math.max(Math.abs(min), Math.abs(max)) || 1

    return new Map(
      list.map((d) => {
        const value = d[metric]
        const t = signed ? 0.5 + value / (2 * maxAbs) : sorted.indexOf(value) / (sorted.length - 1 || 1)
        const h = signed ? (value - min) / span : Math.sqrt((value - min) / span)
        return [d.code, { t, h }]
      }),
    )
  }

  return { depts, byCode, national, regions, regionOf, siblings, top, rankOn, mapValues }
}
