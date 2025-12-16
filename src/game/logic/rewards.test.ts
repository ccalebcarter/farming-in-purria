import { describe, expect, it } from 'vitest'
import { createNewGameSave } from '@/game/save/schema'
import { resolveMatchRewards } from '@/game/logic/rewards'
import { HandRank, type EvaluatedHand } from '@/types/card.types'
import type { HandResult } from '@/types/game.types'

function eh(rank: HandRank, name: string): EvaluatedHand {
  return { rank, name, cards: [], kickers: [], value: 0 }
}

describe('resolveMatchRewards', () => {
  it('burns stake on loss', () => {
    const save = createNewGameSave(1_700_000_000_000)
    const hand: HandResult = {
      winner: 'dealer',
      playerHand: eh(HandRank.HighCard, 'High Card'),
      dealerHand: eh(HandRank.Pair, 'Pair'),
      pot: 100,
      winnings: 100,
    }

    const res = resolveMatchRewards({ save, hand, stake: 500, selection: [] })
    expect(res.save.player.credits).toBe(save.player.credits - 500)
  })

  it('flags rare hands', () => {
    const save = createNewGameSave(1_700_000_000_000)
    const hand: HandResult = {
      winner: 'player',
      playerHand: eh(HandRank.Straight, 'Straight'),
      dealerHand: eh(HandRank.Pair, 'Pair'),
      pot: 100,
      winnings: 100,
    }

    const res = resolveMatchRewards({ save, hand, stake: 500, selection: [] })
    expect(res.isRareHand).toBe(true)
  })
})

