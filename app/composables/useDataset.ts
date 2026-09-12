import type { Dataset } from '~/types/departements'

const STORAGE_KEY = 'atlas-dataset'

export const DEMO_DATASET: Dataset = {
  source: 'demo',
  name: 'Démo · données fictives',
  unit: 'k€',
  labels: { ca: 'Chiffre d’affaires', clients: 'Clients actifs' },
  metrics: ['ca', 'clients', 'panier', 'evolution'],
  hasObjectif: true,
}

/**
 * Jeu de données courant : la démo embarquée, ou le fichier importé par le
 * visiteur (conservé dans son navigateur uniquement, jamais envoyé).
 */
export const useDataset = () => {
  const dataset = useState<Dataset>('dataset', () => DEMO_DATASET)

  const apply = (next: Dataset) => {
    dataset.value = next
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* stockage indisponible : l'import ne survivra pas au rechargement */
    }
  }

  const reset = () => {
    dataset.value = DEMO_DATASET
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignoré */
    }
  }

  /** Recharge un import précédent depuis le navigateur (à appeler côté client). */
  const restore = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) dataset.value = JSON.parse(saved) as Dataset
    } catch {
      /* fichier corrompu ou stockage indisponible : on reste sur la démo */
    }
  }

  const isDemo = computed(() => dataset.value.source === 'demo')

  return { dataset, isDemo, apply, reset, restore }
}
