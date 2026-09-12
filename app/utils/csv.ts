import type { DeptCode, DeptRaw } from '~/types/departements'

/**
 * Import d'un fichier CSV côté navigateur : lecture, détection des colonnes,
 * rattachement de chaque ligne à un département, agrégation.
 * Rien ne quitte le navigateur.
 */

export interface ParsedCsv {
  headers: string[]
  rows: string[][]
  delimiter: string
}

export type GeoKind = 'cp' | 'dept' | 'nom'

export interface ColumnMapping {
  /** Index de la colonne géographique et sa nature. */
  geo: number
  geoKind: GeoKind
  /** Colonne des montants ; `null` = on compte les lignes. */
  amount: number | null
  /** Colonne identifiant le client ; `null` = on compte les lignes. */
  client: number | null
  /** Colonne de date ; permet l'évolution sur 12 mois. */
  date: number | null
}

export interface ImportStats {
  rows: number
  matched: number
  ignored: number
  /** Lignes hors métropole (DOM-TOM, étranger) : non affichables sur cette carte. */
  offMap: number
  departements: number
  hasDates: boolean
  /** Étendue des dates en mois, si une colonne de date est mappée. */
  monthsSpan: number
}

export interface AggregateResult {
  data: Record<DeptCode, DeptRaw>
  stats: ImportStats
}

// ---------------------------------------------------------------- Lecture

/** Devine le séparateur sur la première ligne (; , tabulation). */
const detectDelimiter = (line: string): string => {
  const candidates = [';', ',', '\t', '|']
  let best = ','
  let max = 0
  for (const c of candidates) {
    const count = line.split(c).length - 1
    if (count > max) {
      max = count
      best = c
    }
  }
  return best
}

const splitLine = (line: string, delimiter: string): string[] => {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        quoted = false
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === delimiter) {
      cells.push(cell)
      cell = ''
    } else {
      cell += ch
    }
  }
  cells.push(cell)
  return cells.map((c) => c.trim())
}

export function parseCsv(text: string): ParsedCsv {
  const clean = text.replace(/^﻿/, '')
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) throw new Error('Le fichier doit contenir une ligne d’en-tête et au moins une ligne de données.')
  const delimiter = detectDelimiter(lines[0]!)
  const headers = splitLine(lines[0]!, delimiter)
  const rows = lines.slice(1).map((l) => splitLine(l, delimiter))
  return { headers, rows, delimiter }
}

// ---------------------------------------------------------------- Conversions

/** « 1 234,56 € » → 1234.56 ; « 1,234.50 » → 1234.5. */
export function parseAmount(raw: string): number | null {
  const s = raw.replace(/[€$£\s ]/g, '')
  if (!s) return null
  // Format français : virgule décimale (avec ou sans points de milliers).
  const normalized = /,\d{1,2}$/.test(s) ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

/** ISO (2025-03-14), français (14/03/2025), ou timestamp reconnu par Date. */
export function parseDate(raw: string): Date | null {
  const s = raw.trim()
  if (!s) return null
  const fr = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/)
  if (fr) {
    const year = fr[3]!.length === 2 ? 2000 + Number(fr[3]) : Number(fr[3])
    const d = new Date(year, Number(fr[2]) - 1, Number(fr[1]))
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

export const normalizeName = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

/** Convertit une valeur de cellule en code département, ou `null` si impossible. */
export function toDeptCode(value: string, kind: GeoKind, byName: Map<string, DeptCode>): DeptCode | null | 'off-map' {
  const v = value.trim().toUpperCase()
  if (!v) return null
  if (kind === 'nom') return byName.get(normalizeName(v)) ?? null
  if (kind === 'dept') {
    if (/^2[AB]$/.test(v)) return v
    const n = Number(v)
    if (Number.isInteger(n) && n >= 1 && n <= 95) return String(n).padStart(2, '0')
    if (Number.isInteger(n) && n >= 971) return 'off-map'
    return null
  }
  // Code postal : Excel perd parfois le zéro initial (« 1000 » pour 01000).
  const digits = v.replace(/\D/g, '')
  if (digits.length < 4 || digits.length > 5) return null
  const cp = digits.padStart(5, '0')
  const n = Number(cp)
  if (n >= 97000) return 'off-map'
  if (cp.startsWith('20')) return n < 20200 ? '2A' : '2B'
  const dept = cp.slice(0, 2)
  const dn = Number(dept)
  return dn >= 1 && dn <= 95 ? dept : null
}

// ---------------------------------------------------------------- Détection

const HEADER_HINTS = {
  cp: /code.?postal|^cp$|postal|zip/i,
  dept: /^d[ée]p(t|artement)?(\s*code)?$|code.?d[ée]p/i,
  nom: /nom.?d[ée]p|d[ée]partement.?nom|^d[ée]partement$/i,
  amount: /montant|total|^ca$|^ca[_ -]|[_ -]ca$|chiffre|prix|amount|revenu|ventes?|_ht$|_ttc$|^ht$|^ttc$|annuel/i,
  client: /client|customer|acheteur|email|e-mail|compte|id/i,
  date: /date|jour|created|commande.?le|le$/i,
}

const share = (rows: string[][], index: number, test: (v: string) => boolean): number => {
  const sample = rows.slice(0, 200)
  if (!sample.length) return 0
  return sample.filter((r) => test(r[index] ?? '')).length / sample.length
}

/** Devine le rôle de chaque colonne à partir des en-têtes puis du contenu. */
export function detectColumns(parsed: ParsedCsv, byName: Map<string, DeptCode>): ColumnMapping {
  const { headers, rows } = parsed
  const find = (re: RegExp) => headers.findIndex((h) => re.test(h))

  let geo = find(HEADER_HINTS.cp)
  let geoKind: GeoKind = 'cp'
  if (geo === -1) {
    const nom = find(HEADER_HINTS.nom)
    const dept = find(HEADER_HINTS.dept)
    if (nom !== -1 && share(rows, nom, (v) => byName.has(normalizeName(v))) > 0.5) {
      geo = nom
      geoKind = 'nom'
    } else if (dept !== -1) {
      geo = dept
      geoKind = share(rows, dept, (v) => /^\d{1,2}$|^2[ab]$/i.test(v.trim())) > 0.5 ? 'dept' : 'nom'
    }
  }
  if (geo === -1) {
    // Contenu : une colonne de codes postaux à 4-5 chiffres.
    geo = headers.findIndex((_, i) => share(rows, i, (v) => /^\d{4,5}$/.test(v.replace(/\s/g, ''))) > 0.6)
    geoKind = 'cp'
  }
  if (geo === -1) {
    geo = headers.findIndex((_, i) => share(rows, i, (v) => byName.has(normalizeName(v))) > 0.5)
    geoKind = 'nom'
  }

  const isNumeric = (i: number) => share(rows, i, (v) => parseAmount(v) !== null && v.trim() !== '') > 0.8
  let amount = headers.findIndex((h, i) => HEADER_HINTS.amount.test(h) && i !== geo && isNumeric(i))
  if (amount === -1) {
    amount = headers.findIndex((_, i) => i !== geo && isNumeric(i) && share(rows, i, (v) => /[.,]\d/.test(v)) > 0.3)
  }

  const date = headers.findIndex((h, i) => i !== geo && i !== amount && HEADER_HINTS.date.test(h) && share(rows, i, (v) => parseDate(v) !== null) > 0.8)
  const client = headers.findIndex((h, i) => i !== geo && i !== amount && i !== date && HEADER_HINTS.client.test(h))

  return { geo: Math.max(geo, 0), geoKind, amount: amount === -1 ? null : amount, client: client === -1 ? null : client, date: date === -1 ? null : date }
}

// ---------------------------------------------------------------- Agrégation

const MONTH = 1000 * 60 * 60 * 24 * 30.44

/**
 * Agrège les lignes par département. `reference` fournit noms, régions et
 * coordonnées ; les départements sans ligne restent à zéro.
 */
export function aggregate(parsed: ParsedCsv, mapping: ColumnMapping, reference: Record<DeptCode, DeptRaw>): AggregateResult {
  const byName = new Map(Object.entries(reference).map(([code, d]) => [normalizeName(d.nom), code]))
  const buckets = new Map<DeptCode, { amount: number; clients: Set<string>; rows: number; dated: { t: number; amount: number }[] }>()
  let matched = 0
  let ignored = 0
  let offMap = 0
  let minT = Infinity
  let maxT = -Infinity

  for (const row of parsed.rows) {
    const code = toDeptCode(row[mapping.geo] ?? '', mapping.geoKind, byName)
    if (code === 'off-map') {
      offMap++
      continue
    }
    if (!code || !reference[code]) {
      ignored++
      continue
    }
    const amount = mapping.amount === null ? 1 : parseAmount(row[mapping.amount] ?? '')
    if (amount === null) {
      ignored++
      continue
    }
    const bucket = buckets.get(code) ?? { amount: 0, clients: new Set<string>(), rows: 0, dated: [] }
    bucket.amount += amount
    bucket.rows++
    if (mapping.client !== null) {
      const id = (row[mapping.client] ?? '').trim()
      if (id) bucket.clients.add(id)
    }
    if (mapping.date !== null) {
      const d = parseDate(row[mapping.date] ?? '')
      if (d) {
        const t = d.getTime()
        bucket.dated.push({ t, amount })
        minT = Math.min(minT, t)
        maxT = Math.max(maxT, t)
      }
    }
    buckets.set(code, bucket)
    matched++
  }

  const monthsSpan = Number.isFinite(minT) ? (maxT - minT) / MONTH : 0
  // L'évolution N-1 n'a de sens qu'avec au moins 13 mois de données.
  const hasDates = mapping.date !== null && monthsSpan >= 13

  const data: Record<DeptCode, DeptRaw> = {}
  for (const [code, ref] of Object.entries(reference)) {
    const b = buckets.get(code)
    let evolution = 0
    if (b && hasDates) {
      const last = b.dated.filter((d) => d.t > maxT - 12 * MONTH).reduce((s, d) => s + d.amount, 0)
      const prev = b.dated.filter((d) => d.t <= maxT - 12 * MONTH && d.t > maxT - 24 * MONTH).reduce((s, d) => s + d.amount, 0)
      evolution = prev > 0 ? ((last - prev) / prev) * 100 : 0
    }
    data[code] = {
      nom: ref.nom,
      region: ref.region,
      ville: ref.ville,
      lat: ref.lat,
      lon: ref.lon,
      ca: b ? Math.round(b.amount * 100) / 100 : 0,
      clients: b ? (mapping.client !== null ? b.clients.size : b.rows) : 0,
      evolution: Math.round(evolution * 10) / 10,
      objectif: 0,
    }
  }

  return {
    data,
    stats: { rows: parsed.rows.length, matched, ignored, offMap, departements: buckets.size, hasDates, monthsSpan: Math.round(monthsSpan) },
  }
}
