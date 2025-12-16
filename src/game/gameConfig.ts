import { HandRank } from '@/types/card.types'

export type MetaPotTier = 'mini' | 'major' | 'grand'
export type SimulinType = 'energy' | 'growth' | 'water' | 'pest' | 'health'

export const gameConfig = {
  grid: {
    cols: 7,
    rows: 7,
    hexSize: 46,
  },
  selection: {
    maxPlots: 5,
  },
  poker: {
    stake: {
      base: 750,
      perPlot: 250,
    },
    difficultyBySelectionCount: {
      1: 'seedling',
      2: 'seedling',
      3: 'sprout',
      4: 'bloom',
      5: 'harvest',
      6: 'harvest',
      7: 'harvest',
    } as const,
    betting: {
      minBet: 100,
      maxBet: 5000,
      smallBlind: 50,
      bigBlind: 100,
    },
  },
  buffs: {
    radius: 2,
    falloffByDistance: {
      0: 1,
      1: 0.55,
      2: 0.25,
      3: 0.12,
      4: 0.06,
    } as const,
    baseMagnitude: 14,
  },
  metaPots: {
    mini: { threshold: 2000, fillRate: 0.08 },
    major: { threshold: 10000, fillRate: 0.05 },
    grand: { threshold: 50000, fillRate: 0.03 },
  } satisfies Record<MetaPotTier, { threshold: number; fillRate: number }>,
  streaks: {
    hotHandThreshold: 3,
    winStreakMultipliers: [1, 1.05, 1.1, 1.2, 1.35, 1.55],
    rareHandMinRank: HandRank.Straight,
    rareHandMetaPotBonus: 0.08,
    comebackLowStackFraction: 0.2,
  },
  season: {
    lengthDays: 42,
    msPerDay: 86_400_000,
  },
  daily: {
    modifiers: [
      { id: 'morning-dew', name: 'Morning Dew', blurb: '+Water buffs today.', focus: 'water' },
      { id: 'sunbreak', name: 'Sunbreak', blurb: '+Growth buffs today.', focus: 'growth' },
      { id: 'pest-surge', name: 'Pest Surge', blurb: '+Pest Control buffs today.', focus: 'pest' },
      { id: 'power-grid', name: 'Power Grid', blurb: '+Energy buffs today.', focus: 'energy' },
      { id: 'butterfly-kiss', name: 'Butterfly Kiss', blurb: '+Health buffs today.', focus: 'health' },
      { id: 'mystery-seed', name: 'Mystery Seed', blurb: 'A tile is “charged” with luck.', focus: 'health' },
    ],
  },
} as const
