import { createInitialFarm } from '@/game/logic/farm'
import { pickDailyModifier, pickMysteryPlot } from '@/game/logic/daily'
import type { GameSaveV1 } from '@/game/save/schema'

export function startNewSeason(save: GameSaveV1, nowMs: number): { next: GameSaveV1; bonus: number } {
  const seed = (nowMs % 2147483647) | 0
  const plots = createInitialFarm(seed)
  const dailyModifier = pickDailyModifier(seed, 0)
  const mysteryPlotId = pickMysteryPlot(seed, 0, plots, dailyModifier.id)

  const bonus = Math.max(0, save.season.stats.handsWon) * 150

  const next: GameSaveV1 = {
    ...save,
    seed,
    player: {
      ...save.player,
      credits: save.player.credits + bonus,
    },
    farm: { plots },
    metaPots: {
      mini: { amount: 0, triggers: 0 },
      major: { amount: 0, triggers: 0 },
      grand: { amount: 0, triggers: 0 },
    },
    streaks: {
      ...save.streaks,
      winStreak: 0,
    },
    season: {
      startMs: nowMs,
      dayIndex: 0,
      ended: false,
      stats: {
        handsPlayed: 0,
        handsWon: 0,
        creditsEarned: 0,
        metaPotTriggers: { mini: 0, major: 0, grand: 0 },
        bestWinStreak: 0,
      },
    },
    daily: {
      modifierId: dailyModifier.id,
      mysteryPlotId,
    },
    poker: { handIndex: 0 },
  }

  return { next, bonus }
}

