import type { SimulinType } from '@/game/gameConfig'
import { gameConfig } from '@/game/gameConfig'
import type { Plot } from '@/game/model'
import { plotId } from '@/game/model'

function createRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

const SIMULIN_POOL: SimulinType[] = ['energy', 'growth', 'water', 'pest', 'health']

export function createInitialFarm(seed: number): Plot[] {
  const rand = createRng(seed)
  const plots: Plot[] = []

  for (let r = 0; r < gameConfig.grid.rows; r++) {
    for (let q = 0; q < gameConfig.grid.cols; q++) {
      const base = 52 + rand() * 30
      const jitter = () => Math.max(0, Math.min(100, base + (rand() - 0.5) * 26))

      const hasSimulin = rand() < 0.22
      const simulin = hasSimulin ? SIMULIN_POOL[Math.floor(rand() * SIMULIN_POOL.length)] : undefined

      plots.push({
        id: plotId(q, r),
        q,
        r,
        vitals: {
          water: jitter(),
          growth: jitter(),
          energy: jitter(),
          pest: jitter(),
          health: jitter(),
        },
        simulin,
        buff: { water: 0, growth: 0, energy: 0, pest: 0, health: 0 },
      })
    }
  }

  return plots
}

