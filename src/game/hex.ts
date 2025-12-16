import type { AxialCoord, PlotId } from '@/game/model'
import { parsePlotId, plotId } from '@/game/model'

export function axialToPixel(q: number, r: number, size: number): { x: number; y: number } {
  const x = size * Math.sqrt(3) * (q + r / 2)
  const y = size * (3 / 2) * r
  return { x, y }
}

export function hexPolygonPoints(
  cx: number,
  cy: number,
  size: number
): string {
  const points: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30) // pointy-top
    const x = cx + size * Math.cos(angle)
    const y = cy + size * Math.sin(angle)
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return points.join(' ')
}

export function neighborCoords({ q, r }: AxialCoord): AxialCoord[] {
  return [
    { q: q + 1, r },
    { q: q - 1, r },
    { q, r: r + 1 },
    { q, r: r - 1 },
    { q: q + 1, r: r - 1 },
    { q: q - 1, r: r + 1 },
  ]
}

export function plotNeighbors(id: PlotId): PlotId[] {
  const coord = parsePlotId(id)
  return neighborCoords(coord).map((c) => plotId(c.q, c.r))
}

export function axialDistance(a: AxialCoord, b: AxialCoord): number {
  // axial -> cube (x = q, z = r, y = -x-z)
  const ax = a.q
  const az = a.r
  const ay = -ax - az

  const bx = b.q
  const bz = b.r
  const by = -bx - bz

  return (Math.abs(ax - bx) + Math.abs(ay - by) + Math.abs(az - bz)) / 2
}

export function distanceBetweenPlotIds(a: PlotId, b: PlotId): number {
  return axialDistance(parsePlotId(a), parsePlotId(b))
}

