import type { DifficultyLevel } from '@/types/ai.types'
import type { MetaPotTier, SimulinType } from '@/game/gameConfig'
import { gameConfig } from '@/game/gameConfig'
import type { Plot, PlotId } from '@/game/model'
import { createInitialFarm } from '@/game/logic/farm'
import { pickDailyModifier, pickMysteryPlot } from '@/game/logic/daily'

export const GAME_SAVE_VERSION = 1 as const

export interface MetaPotState {
  amount: number
  triggers: number
}

export interface SeasonStats {
  handsPlayed: number
  handsWon: number
  creditsEarned: number
  metaPotTriggers: Record<MetaPotTier, number>
  bestWinStreak: number
}

export interface GameSaveV1 {
  version: typeof GAME_SAVE_VERSION
  createdAtMs: number
  updatedAtMs: number
  seed: number

  player: {
    tulipBulbs: number
    credits: number
  }

  farm: {
    plots: Plot[]
  }

  metaPots: Record<MetaPotTier, MetaPotState>

  streaks: {
    winStreak: number
    bestWinStreak: number
    dailyLoginStreak: number
    lastLoginDayIndex: number
  }

  season: {
    startMs: number
    dayIndex: number
    ended: boolean
    stats: SeasonStats
  }

  daily: {
    modifierId: string
    mysteryPlotId?: PlotId
  }

  progression: {
    operations: {
      selectionBonus: number
      buffRadiusBonus: number
    }
    simulinTiers: Record<SimulinType, number>
    npcGifts: Record<string, number>
    maxContractUnlocked: DifficultyLevel
  }

  poker: {
    handIndex: number
  }

  dev: {
    dayOffsetDays: number
  }
}

export type GameSave = GameSaveV1

export function createNewGameSave(nowMs: number): GameSaveV1 {
  const seed = (nowMs % 2147483647) | 0
  const plots = createInitialFarm(seed)
  const dailyModifier = pickDailyModifier(seed, 0)
  const mysteryPlotId = pickMysteryPlot(seed, 0, plots, dailyModifier.id)

  return {
    version: GAME_SAVE_VERSION,
    createdAtMs: nowMs,
    updatedAtMs: nowMs,
    seed,
    player: { tulipBulbs: 10, credits: 3000 },
    farm: { plots },
    metaPots: {
      mini: { amount: 0, triggers: 0 },
      major: { amount: 0, triggers: 0 },
      grand: { amount: 0, triggers: 0 },
    },
    streaks: {
      winStreak: 0,
      bestWinStreak: 0,
      dailyLoginStreak: 1,
      lastLoginDayIndex: 0,
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
    progression: {
      operations: { selectionBonus: 0, buffRadiusBonus: 0 },
      simulinTiers: { energy: 0, growth: 0, water: 0, pest: 0, health: 0 },
      npcGifts: { 'Mayor Miso': 0, 'Archivist Saffron': 0, 'Courier Pippin': 0 },
      maxContractUnlocked: gameConfig.poker.difficultyBySelectionCount[3],
    },
    poker: { handIndex: 0 },
    dev: { dayOffsetDays: 0 },
  }
}

export function isGameSaveV1(value: unknown): value is GameSaveV1 {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<GameSaveV1>
  return v.version === GAME_SAVE_VERSION && typeof v.createdAtMs === 'number' && typeof v.seed === 'number'
}

