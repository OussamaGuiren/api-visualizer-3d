import * as THREE from 'three'
import type { FeatureProps } from '~/types/departements'

type Ring = [number, number][]
type Polygon = Ring[]

interface Feature {
  type: 'Feature'
  properties: FeatureProps
  geometry:
    | { type: 'Polygon'; coordinates: Polygon }
    | { type: 'MultiPolygon'; coordinates: Polygon[] }
}

export interface FeatureCollection {
  type: 'FeatureCollection'
  features: Feature[]
}

export interface DeptShape {
  code: string
  nom: string
  shapes: THREE.Shape[]
  /** Centre de la bounding box dans l'espace scène. */
  center: THREE.Vector2
}

export interface ProjectedCollection {
  depts: DeptShape[]
  /** Décalage appliqué pour centrer la France sur l'origine ; à soustraire à toute projection ultérieure. */
  offset: THREE.Vector2
}

/** Échelle de la scène : 1 radian de longitude ≈ SCALE unités. */
const SCALE = 1000

/** Projection Web Mercator, suffisante pour un pays de l'étendue de la France. */
export function project([lon, lat]: [number, number]): THREE.Vector2 {
  const x = (lon * Math.PI) / 180
  const y = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
  return new THREE.Vector2(x * SCALE, y * SCALE)
}

function ringToPath(ring: Ring, offset: THREE.Vector2): THREE.Vector2[] {
  const points = ring.map((coord) => project(coord).sub(offset))
  // Le GeoJSON ferme l'anneau en répétant le premier point : inutile pour THREE.Shape.
  const first = points[0]
  const last = points[points.length - 1]
  if (first && last && first.equals(last)) points.pop()
  return points
}

/**
 * Convertit chaque feature en un lot de `THREE.Shape` (un par polygone, trous inclus),
 * le tout recentré sur l'origine de la scène.
 */
export function geojsonToShapes(collection: FeatureCollection): ProjectedCollection {
  const bounds = new THREE.Box2()
  for (const feature of collection.features) {
    const polygons =
      feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
    for (const polygon of polygons) {
      for (const coord of polygon[0] ?? []) bounds.expandByPoint(project(coord))
    }
  }
  const offset = bounds.getCenter(new THREE.Vector2())

  const depts = collection.features.map((feature) => {
    const polygons =
      feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
    const box = new THREE.Box2()
    const shapes = polygons.flatMap((polygon) => {
      const [outer, ...holes] = polygon
      if (!outer) return []
      const outerPath = ringToPath(outer, offset)
      outerPath.forEach((p) => box.expandByPoint(p))
      const shape = new THREE.Shape(outerPath)
      shape.holes = holes.map((hole) => new THREE.Path(ringToPath(hole, offset)))
      return [shape]
    })
    return {
      code: feature.properties.code,
      nom: feature.properties.nom,
      shapes,
      center: box.getCenter(new THREE.Vector2()),
    }
  })

  return { depts, offset }
}
