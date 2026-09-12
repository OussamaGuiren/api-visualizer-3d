export interface Toast {
  id: number
  message: string
  tone: 'info' | 'success' | 'error'
  /** Action optionnelle (ex. « Annuler »). */
  action?: { label: string; run: () => void }
}

let nextId = 1

/** Notifications discrètes en bas de l'écran : retour immédiat après une action. */
export const useToast = () => {
  const toasts = useState<Toast[]>('toasts', () => [])

  const dismiss = (id: number) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const push = (message: string, tone: Toast['tone'] = 'info', action?: Toast['action'], duration = 4000) => {
    const id = nextId++
    toasts.value = [...toasts.value.slice(-2), { id, message, tone, action }]
    setTimeout(() => dismiss(id), duration)
    return id
  }

  return {
    toasts,
    dismiss,
    info: (message: string, action?: Toast['action']) => push(message, 'info', action),
    success: (message: string, action?: Toast['action']) => push(message, 'success', action),
    error: (message: string) => push(message, 'error', undefined, 6000),
  }
}
