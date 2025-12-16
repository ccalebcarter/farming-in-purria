import type { PlotId } from '@/game/model'
import { plotNeighbors } from '@/game/hex'

export interface SelectionResult {
  next: PlotId[]
  dropped?: PlotId[]
  reason?: 'max' | 'not-adjacent' | 'disconnected'
}

export function toggleConnectedSelection(options: {
  current: PlotId[]
  id: PlotId
  max: number
  exists: (id: PlotId) => boolean
}): SelectionResult {
  const { current, id, max, exists } = options
  const isSelected = current.includes(id)

  if (isSelected) {
    const remaining = current.filter((x) => x !== id)
    if (remaining.length <= 1) return { next: remaining }

    const kept = keepConnectedComponent(remaining, exists)
    const dropped = remaining.filter((x) => !kept.includes(x))
    if (dropped.length > 0) return { next: kept, dropped, reason: 'disconnected' }
    return { next: remaining }
  }

  if (current.length >= max) return { next: current, reason: 'max' }

  if (current.length === 0) return { next: [id] }

  const neighborSet = new Set(current.flatMap((x) => plotNeighbors(x)))
  if (!neighborSet.has(id)) return { next: current, reason: 'not-adjacent' }

  return { next: [...current, id] }
}

function keepConnectedComponent(selection: PlotId[], exists: (id: PlotId) => boolean): PlotId[] {
  const seed = selection[0]
  const visited = new Set<PlotId>()
  const queue: PlotId[] = [seed]

  while (queue.length > 0) {
    const next = queue.shift()!
    if (visited.has(next)) continue
    visited.add(next)

    for (const n of plotNeighbors(next)) {
      if (!exists(n)) continue
      if (!selection.includes(n)) continue
      if (!visited.has(n)) queue.push(n)
    }
  }

  return selection.filter((id) => visited.has(id))
}

