import { gameConfig } from '@/game/gameConfig'
import type { Plot, PlotId } from '@/game/model'

function hashInts(...ints: number[]): number {
  let h = 2166136261
  for (const n of ints) {
    h ^= n >>> 0
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function createRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1103515245 + 12345) >>> 0
    return (s % 10000) / 10000
  }
}

export function pickDailyModifier(seed: number, dayIndex: number) {
  const mods = gameConfig.daily.modifiers
  const idx = hashInts(seed, dayIndex, 17) % mods.length
  return mods[idx]
}

export function pickMysteryPlot(
  seed: number,
  dayIndex: number,
  plots: Plot[],
  modifierId: string
): PlotId | undefined {
  if (modifierId !== 'mystery-seed') return undefined
  const rand = createRng(hashInts(seed, dayIndex, 991))
  const pick = plots[Math.floor(rand() * plots.length)]
  return pick?.id
}

export function reseedDailySimulins(seed: number, dayIndex: number, plots: Plot[]): Plot[] {
  const rand = createRng(hashInts(seed, dayIndex, 431))
  const pool = ['energy', 'growth', 'water', 'pest', 'health'] as const

  return plots.map((p) => {
    const has = rand() < 0.22
    const simulin = has ? pool[Math.floor(rand() * pool.length)] : undefined
    return { ...p, simulin }
  })
}

