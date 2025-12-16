import { gameConfig } from '@/game/gameConfig'
import type { GameSaveV1 } from '@/game/save/schema'
import { pickDailyModifier, pickMysteryPlot, reseedDailySimulins } from '@/game/logic/daily'

export function computeNowMs(save: GameSaveV1): number {
  return Date.now() + save.dev.dayOffsetDays * gameConfig.season.msPerDay
}

export function computeSeasonDayIndex(save: GameSaveV1, nowMs: number): number {
  const raw = Math.floor((nowMs - save.season.startMs) / gameConfig.season.msPerDay)
  return Math.max(0, raw)
}

export function rollToDay(options: {
  save: GameSaveV1
  targetDayIndex: number
  nowMs: number
}): { save: GameSaveV1; messages: string[] } {
  const { save, targetDayIndex, nowMs } = options
  const messages: string[] = []

  const clampedDayIndex = Math.max(0, targetDayIndex)
  const ended = clampedDayIndex >= gameConfig.season.lengthDays

  let next = save
  const previousDayIndex = next.season.dayIndex
  if (clampedDayIndex === previousDayIndex && next.season.ended === ended) return { save, messages }

  // Daily rollover only when moving forward (including dev fast-forward).
  if (clampedDayIndex > previousDayIndex) {
    const delta = clampedDayIndex - next.streaks.lastLoginDayIndex
    const dailyLoginStreak = delta === 1 ? next.streaks.dailyLoginStreak + 1 : 1
    const dailyReward = 120 + dailyLoginStreak * 30

    const modifier = pickDailyModifier(next.seed, clampedDayIndex)
    const plotsWithNewSimulins = reseedDailySimulins(next.seed, clampedDayIndex, next.farm.plots)
    const mysteryPlotId = pickMysteryPlot(next.seed, clampedDayIndex, plotsWithNewSimulins, modifier.id)

    messages.push(`Daily reward +${dailyReward.toLocaleString()} credits`)
    messages.push(`Modifier: ${modifier.name}`)

    next = {
      ...next,
      player: { ...next.player, credits: next.player.credits + dailyReward },
      farm: { ...next.farm, plots: plotsWithNewSimulins },
      daily: { modifierId: modifier.id, mysteryPlotId },
      streaks: {
        ...next.streaks,
        dailyLoginStreak,
        lastLoginDayIndex: clampedDayIndex,
      },
    }
  }

  next = {
    ...next,
    season: {
      ...next.season,
      dayIndex: clampedDayIndex,
      ended,
    },
  }

  return { save: next, messages }
}

