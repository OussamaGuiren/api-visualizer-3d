/** Code INSEE d'un département ("01", "2A", "75"…). */
export type DeptCode = string

/**
 * Indicateurs d'un département tels que renvoyés par `GET /api/departements`.
 * C'est le contrat à respecter pour brancher une source réelle (voir docs/INTEGRATION.md).
 */
export interface DeptRaw {
  nom: string
  region: string
  /** Préfecture, utilisée comme étiquette sur les cartes. */
  ville: string
  lat: number
  lon: number
  clients: number
  /** Chiffre d'affaires annuel (k€). */
  ca: number
  /** Évolution du CA sur un an (%). */
  evolution: number
  /** Objectif annuel de CA (k€). */
  objectif: number
}

/** Département enrichi des indicateurs dérivés utilisés par l'UI et la carte. */
export interface Dept extends DeptRaw {
  code: DeptCode
  /** CA moyen par client (k€). */
  panier: number
  /** Taux d'atteinte de l'objectif (ratio, 1 = 100 %). */
  atteinte: number
  /** Rang national sur le CA (1 = premier). */
  rang: number
}

export type MetricKey = 'ca' | 'clients' | 'panier' | 'evolution'

export interface MetricDef {
  key: MetricKey
  label: string
  /** Libellé court pour les puces et la légende. */
  short: string
  unit: string
  format: (value: number) => string
  /** Une métrique signée est centrée sur 0 (palette divergente). */
  signed?: boolean
}

export interface RegionStats {
  region: string
  ca: number
  clients: number
  departements: number
}

export interface FeatureProps {
  code: DeptCode
  nom: string
}

// ---------------------------------------------------------------- Marketplace

/** Contrat de `GET /api/departements/:code/marketplace`. */
export interface Marketplace {
  code: DeptCode
  vendeurs: Vendeur[]
  acheteurs: Acheteur[]
  produits: Produit[]
}

export interface Vendeur {
  id: string
  nom: string
  ville: string
  categorie: string
  /** Note moyenne sur 5. */
  note: number
  produits: number
  /** Ventes sur 12 mois (k€). */
  ventes: number
  depuis: number
}

export interface Acheteur {
  id: string
  nom: string
  ville: string
  type: 'Entreprise' | 'Collectivité' | 'Particulier'
  commandes: number
  /** Montant sur 12 mois (k€). */
  montant: number
}

export interface Produit {
  id: string
  nom: string
  categorie: string
  vendeur: string
  /** Prix unitaire (€). */
  prix: number
  ventes: number
}

// ---------------------------------------------------------------- Jeu de données courant

/** Décrit d'où viennent les chiffres affichés : démo embarquée ou fichier importé par le visiteur. */
export interface Dataset {
  source: 'demo' | 'csv'
  /** Nom affiché (ex. « Démo · données fictives » ou le nom du fichier). */
  name: string
  /** Unité des montants (k€ pour la démo, € ou autre pour un import). */
  unit: string
  /** Libellés des deux indicateurs de base, adaptables au métier du visiteur. */
  labels: { ca: string; clients: string }
  /** Indicateurs disponibles (un import sans dates n'a pas d'évolution). */
  metrics: MetricKey[]
  hasObjectif: boolean
  /** Données par département quand la source est un import ; sinon la démo est utilisée. */
  data?: Record<DeptCode, DeptRaw>
  stats?: { rows: number; matched: number; ignored: number; departements: number }
  importedAt?: string
}
