import { gameConfig, type MetaPotTier } from '@/game/gameConfig'
import type { GameSaveV1 } from '@/game/save/schema'
import type { HandResult } from '@/types/game.types'
import type { PlotId } from '@/game/model'

export interface MetaPotTrigger {
  tier: MetaPotTier
  amount: number
}

export interface RewardResolution {
  save: GameSaveV1
  messages: string[]
  creditDelta: number
  winStreak: number
  streakMultiplier: number
  metaPotTriggers: MetaPotTrigger[]
  isRareHand: boolean
  isMysteryHit: boolean
  isComeback: boolean
}

export function resolveMatchRewards(options: {
  save: GameSaveV1
  hand: HandResult
  stake: number
  selection: PlotId[]
}): RewardResolution {
  const { save, hand, stake, selection } = options
  const messages: string[] = []
  const didWin = hand.winner === 'player'
  const isTie = hand.winner === 'tie'

  const nextWinStreak = didWin ? save.streaks.winStreak + 1 : isTie ? save.streaks.winStreak : 0
  const streakMultiplier = getStreakMultiplier(nextWinStreak)
  const isRareHand = didWin && hand.playerHand.rank >= gameConfig.streaks.rareHandMinRank
  const isMysteryHit = Boolean(save.daily.mysteryPlotId && didWin && selection.includes(save.daily.mysteryPlotId))
  const isComeback =
    didWin && save.player.credits <= Math.round(stake * (1 + gameConfig.streaks.comebackLowStackFraction))

  if (nextWinStreak >= gameConfig.streaks.hotHandThreshold && didWin) {
    messages.push(`Hot hand! x${streakMultiplier.toFixed(2)}`)
  }
  if (isRareHand) messages.push('Rare bloom hand!')
  if (isMysteryHit) messages.push('Mystery Seed charged the pot!')
  if (isComeback) messages.push('Comeback win!')

  // Risk-reward: win earns profit, loss burns stake, tie returns nothing.
  const comebackBonus = isComeback ? Math.round(stake * 0.12) : 0
  const creditDelta = (didWin ? Math.round(stake * streakMultiplier) + comebackBonus : isTie ? 0 : -stake)

  const metaPotTriggers: MetaPotTrigger[] = []
  let next = save

  // Meta-pot fill (win-driven, with streak/rare modifiers).
  const fillMult =
    (didWin ? 1 : 0.35) *
    streakMultiplier *
    (isRareHand ? 1 + gameConfig.streaks.rareHandMetaPotBonus : 1) *
    (isMysteryHit ? 1.18 : 1) *
    (isComeback ? 1.1 : 1)

  for (const tier of ['mini', 'major', 'grand'] as const) {
    const cfg = gameConfig.metaPots[tier]
    const added = Math.max(0, Math.round(stake * cfg.fillRate * fillMult))
    const current = next.metaPots[tier]
    let amount = current.amount + added
    let triggers = current.triggers

    while (amount >= cfg.threshold) {
      amount -= cfg.threshold
      triggers += 1
      metaPotTriggers.push({ tier, amount: cfg.threshold })
    }

    next = {
      ...next,
      metaPots: {
        ...next.metaPots,
        [tier]: { amount, triggers },
      },
    }
  }

  // Credit payouts from triggered meta-pots.
  const metaPotPayout = metaPotTriggers.reduce((sum, t) => sum + t.amount, 0)
  const totalCreditDelta = creditDelta + metaPotPayout
  if (metaPotPayout > 0) messages.push(`Meta-pot payout +${metaPotPayout.toLocaleString()}`)

  const bestWinStreak = Math.max(save.streaks.bestWinStreak, nextWinStreak)

  const stats = next.season.stats
  next = {
    ...next,
    player: { ...next.player, credits: Math.max(0, next.player.credits + totalCreditDelta) },
    streaks: {
      ...next.streaks,
      winStreak: nextWinStreak,
      bestWinStreak,
    },
    season: {
      ...next.season,
      stats: {
        ...stats,
        handsPlayed: stats.handsPlayed + 1,
        handsWon: stats.handsWon + (didWin ? 1 : 0),
        creditsEarned: stats.creditsEarned + totalCreditDelta,
        bestWinStreak: Math.max(stats.bestWinStreak, nextWinStreak),
        metaPotTriggers: {
          mini: stats.metaPotTriggers.mini + metaPotTriggers.filter((t) => t.tier === 'mini').length,
          major: stats.metaPotTriggers.major + metaPotTriggers.filter((t) => t.tier === 'major').length,
          grand: stats.metaPotTriggers.grand + metaPotTriggers.filter((t) => t.tier === 'grand').length,
        },
      },
    },
  }

  return {
    save: next,
    messages,
    creditDelta: totalCreditDelta,
    winStreak: nextWinStreak,
    streakMultiplier,
    metaPotTriggers,
    isRareHand,
    isMysteryHit,
    isComeback,
  }
}

function getStreakMultiplier(winStreak: number): number {
  const arr = gameConfig.streaks.winStreakMultipliers
  const idx = Math.min(Math.max(0, winStreak), arr.length - 1)
  return arr[idx]
}
