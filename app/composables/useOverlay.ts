export type OverlayName = 'intro' | 'usecases' | 'data' | 'contact' | 'import'

/**
 * État partagé des modales (ouvertes depuis l'en-tête, la page ou les encarts)
 * et compteur d'interactions utilisé pour déclencher les encarts promotionnels.
 */
export const useOverlay = () => {
  const current = useState<OverlayName | null>('overlay', () => null)
  const interactions = useState<number>('overlay-interactions', () => 0)
  /** Visite guidée en cours (index de l'étape) ou -1. */
  const tourStep = useState<number>('tour-step', () => -1)

  return {
    current,
    interactions,
    tourStep,
    open: (name: OverlayName) => (current.value = name),
    close: () => (current.value = null),
    track: () => interactions.value++,
    startTour: () => {
      current.value = null
      tourStep.value = 0
    },
  }
}
