import * as THREE from 'three'

/** Rampe séquentielle : bleu clair → bleu → violet → orange (valeurs fortes). */
const SEQUENTIAL = ['#93c5fd', '#3b82f6', '#7c3aed', '#f97316'].map((c) => new THREE.Color(c))
/** Rampe divergente centrée sur 0 : rouge → gris clair → vert. */
const DIVERGING = ['#ef4444', '#cbd5e1', '#10b981'].map((c) => new THREE.Color(c))

/** Couleurs des états interactifs des départements. */
export const COLORS = {
  base: new THREE.Color('#93c5fd'),
  edge: new THREE.Color('#ffffff'),
  hover: new THREE.Color('#ffffff'),
  selected: new THREE.Color('#f97316'),
  regionMate: new THREE.Color('#fdba74'),
} as const

/** Ambiance de la scène (thème clair). */
export const SCENE = {
  fog: new THREE.Color('#e6edf9'),
  plinth: new THREE.Color('#ffffff'),
  plinthSide: new THREE.Color('#d6dfef'),
  shadowOpacity: 0.16,
  hemisphere: { sky: '#ffffff', ground: '#dbe4f5', intensity: 0.9 },
  key: { color: '#ffffff', intensity: 1.35 },
  rim: { color: '#c7d2fe', intensity: 0.5 },
  exposure: 1.0,
  /** Lueur émissive de base, préserve la saturation de la palette. */
  glow: 0.18,
} as const

function sample(stops: THREE.Color[], t: number, target = new THREE.Color()): THREE.Color {
  const clamped = Math.min(1, Math.max(0, t))
  const scaled = clamped * (stops.length - 1)
  const index = Math.min(Math.floor(scaled), stops.length - 2)
  const a = stops[index]!
  const b = stops[index + 1]!
  return target.copy(a).lerp(b, scaled - index)
}

/** Couleur pour une valeur normalisée `t ∈ [0,1]` (0.5 = neutre pour une palette divergente). */
export function colorFor(t: number, signed = false, target?: THREE.Color): THREE.Color {
  return sample(signed ? DIVERGING : SEQUENTIAL, t, target)
}

/** Dégradé CSS équivalent à la rampe, pour la légende. */
export function cssGradient(signed = false): string {
  const stops = signed ? DIVERGING : SEQUENTIAL
  return `linear-gradient(90deg, ${stops.map((c) => `#${c.getHexString()}`).join(', ')})`
}
