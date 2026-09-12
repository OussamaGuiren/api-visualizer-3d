/**
 * Simplifie le GeoJSON des départements (Douglas-Peucker) et arrondit les
 * coordonnées pour réduire le poids servi au client.
 *
 * Usage : node scripts/simplify-geojson.mjs [tolérance en degrés]
 */
import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE = new URL('../data/france-departements.source.geojson', import.meta.url)
const TARGET = new URL('../public/data/france-departements.geojson', import.meta.url)
const TOLERANCE = Number(process.argv[2] ?? 0.0025)
const PRECISION = 4

const sqSegDist = ([px, py], [ax, ay], [bx, by]) => {
  let x = ax
  let y = ay
  let dx = bx - ax
  let dy = by - ay
  if (dx !== 0 || dy !== 0) {
    const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    if (t > 1) {
      x = bx
      y = by
    } else if (t > 0) {
      x += dx * t
      y += dy * t
    }
  }
  dx = px - x
  dy = py - y
  return dx * dx + dy * dy
}

const douglasPeucker = (points, sqTolerance) => {
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [first, last] = stack.pop()
    let maxDist = sqTolerance
    let index = -1
    for (let i = first + 1; i < last; i++) {
      const dist = sqSegDist(points[i], points[first], points[last])
      if (dist > maxDist) {
        index = i
        maxDist = dist
      }
    }
    if (index !== -1) {
      keep[index] = 1
      stack.push([first, index], [index, last])
    }
  }
  return points.filter((_, i) => keep[i])
}

const round = (value) => Number(value.toFixed(PRECISION))

const simplifyRing = (ring) => {
  const simplified = douglasPeucker(ring, TOLERANCE * TOLERANCE).map(([x, y]) => [round(x), round(y)])
  // Un anneau doit garder au moins 4 points (fermé) pour rester un polygone valide.
  return simplified.length >= 4 ? simplified : ring.map(([x, y]) => [round(x), round(y)])
}

const geojson = JSON.parse(readFileSync(SOURCE, 'utf8'))
let before = 0
let after = 0

for (const feature of geojson.features) {
  const { geometry } = feature
  const mapPolygon = (polygon) =>
    polygon.map((ring) => {
      before += ring.length
      const simplified = simplifyRing(ring)
      after += simplified.length
      return simplified
    })
  geometry.coordinates =
    geometry.type === 'Polygon' ? mapPolygon(geometry.coordinates) : geometry.coordinates.map(mapPolygon)
  feature.properties = { code: feature.properties.code, nom: feature.properties.nom }
}

writeFileSync(TARGET, JSON.stringify(geojson))
console.log(`points : ${before} → ${after} (tolérance ${TOLERANCE}°)`)
console.log(`poids  : ${(readFileSync(SOURCE).length / 1024).toFixed(0)} Ko → ${(readFileSync(TARGET).length / 1024).toFixed(0)} Ko`)
