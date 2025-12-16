import type { SimulinType } from '@/game/gameConfig'
import { gameConfig } from '@/game/gameConfig'
import { distanceBetweenPlotIds } from '@/game/hex'
import type { Plot, PlotId, PlotVitals } from '@/game/model'

export interface BuffFx {
  id: PlotId
  kind: 'buff' | 'debuff'
  type: SimulinType
  text: string
  intensity: number
  atMs: number
}

const STAT_KEYS: Record<SimulinType, keyof PlotVitals> = {
  energy: 'energy',
  growth: 'growth',
  water: 'water',
  pest: 'pest',
  health: 'health',
}

export function applyBuffsFromMatch(options: {
  plots: Plot[]
  selected: PlotId[]
  didWin: boolean
  nowMs: number
  tuning?: {
    radius?: number
    baseMagnitude?: number
    magnitudeMultiplier?: number
    primaryOverride?: SimulinType
  }
}): {
  plots: Plot[]
  aura: Record<PlotId, number>
  fx: BuffFx[]
  primary: SimulinType
} {
  const { plots, selected, didWin, nowMs, tuning } = options
  if (selected.length === 0) return { plots, aura: {}, fx: [], primary: 'health' }

  const plotById = new Map<PlotId, Plot>()
  for (const p of plots) plotById.set(p.id, p)

  const primary = tuning?.primaryOverride ?? pickPrimarySimulin(plots, selected)
  const primaryKey = STAT_KEYS[primary]

  const aura: Record<PlotId, number> = {}
  const fx: BuffFx[] = []

  const radius = tuning?.radius ?? gameConfig.buffs.radius
  const base =
    (tuning?.baseMagnitude ?? gameConfig.buffs.baseMagnitude) *
    (tuning?.magnitudeMultiplier ?? 1)

  const affected: { id: PlotId; intensity: number }[] = []
  for (const p of plots) {
    const minDist = minDistanceToSelection(p.id, selected)
    if (minDist > radius) continue
    const intensity = (gameConfig.buffs.falloffByDistance as Record<number, number>)[minDist] ?? 0
    if (intensity <= 0) continue
    affected.push({ id: p.id, intensity })
  }

  const nextPlots = plots.map((plot) => {
    const hit = affected.find((a) => a.id === plot.id)
    if (!hit) return plot
    const intensity = hit.intensity

    const direction = didWin ? 1 : -1
    const primaryDelta = base * intensity * (didWin ? 1 : 0.35) * direction
    const healthDelta = base * intensity * (didWin ? 0.55 : 0.22) * direction

    aura[plot.id] = intensity

    const next = {
      ...plot,
      vitals: {
        ...plot.vitals,
        [primaryKey]: clampStat(plot.vitals[primaryKey] + primaryDelta),
        health: clampStat(plot.vitals.health + healthDelta),
      },
      buff: {
        ...plot.buff,
        [primaryKey]: plot.buff[primaryKey] + primaryDelta,
        health: plot.buff.health + healthDelta,
      },
      lastBuffAtMs: nowMs,
    } satisfies Plot

    return next
  })

  for (const id of selected) {
    const plot = plotById.get(id)
    if (!plot) continue
    const minDist = minDistanceToSelection(id, selected)
    const intensity = (gameConfig.buffs.falloffByDistance as Record<number, number>)[minDist] ?? 1
    const amount = Math.round(base * intensity * (didWin ? 1 : 0.35))
    fx.push({
      id,
      kind: didWin ? 'buff' : 'debuff',
      type: primary,
      text: `${didWin ? '+' : '-'}${amount}`,
      intensity,
      atMs: nowMs,
    })
  }

  return { plots: nextPlots, aura, fx, primary }
}

function minDistanceToSelection(id: PlotId, selected: PlotId[]): number {
  let best = Number.POSITIVE_INFINITY
  for (const s of selected) {
    const d = distanceBetweenPlotIds(id, s)
    if (d < best) best = d
    if (best === 0) return 0
  }
  return best
}

function clampStat(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function pickPrimarySimulin(plots: Plot[], selected: PlotId[]): SimulinType {
  const counts: Record<SimulinType, number> = {
    energy: 0,
    growth: 0,
    water: 0,
    pest: 0,
    health: 0,
  }

  const plotById = new Map(plots.map((p) => [p.id, p] as const))
  for (const id of selected) {
    const sim = plotById.get(id)?.simulin
    if (sim) counts[sim] += 1
  }

  const entries = Object.entries(counts) as [SimulinType, number][]
  entries.sort((a, b) => b[1] - a[1])
  const [topType, topCount] = entries[0]
  return topCount > 0 ? topType : 'health'
}
