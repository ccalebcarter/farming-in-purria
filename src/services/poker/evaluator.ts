/**
 * T-060, T-061, T-062, T-063: Poker Hand Evaluator
 * Evaluates poker hands and determines winners
 */
import type { Card, EvaluatedHand } from '@/types/card.types'
import { HandRank } from '@/types/card.types'
import {
  sortCardsByRank,
  groupByRank,
  groupBySuit,
  getRankValue,
} from '@/utils/cards'

/**
 * Hand strength base percentages for each rank
 * Used for getHandStrengthPercentage
 */
const HAND_STRENGTH_BASE: Record<HandRank, number> = {
  [HandRank.HighCard]: 0,
  [HandRank.Pair]: 17,
  [HandRank.TwoPair]: 35,
  [HandRank.ThreeOfAKind]: 47,
  [HandRank.Straight]: 58,
  [HandRank.Flush]: 68,
  [HandRank.FullHouse]: 78,
  [HandRank.FourOfAKind]: 88,
  [HandRank.StraightFlush]: 96,
  [HandRank.RoyalFlush]: 100,
}

/**
 * Calculate a numerical value for a hand for comparison
 * Higher is better
 */
function calculateHandValue(rank: HandRank, primaryCards: Card[], kickers: Card[]): number {
  // Base value from hand rank (multiply by large number to ensure rank matters most)
  let value = rank * 1000000

  // Add value from primary cards (pair, trips, etc.)
  primaryCards.forEach((card, index) => {
    value += getRankValue(card.rank) * Math.pow(100, 4 - index)
  })

  // Add kicker values
  kickers.forEach((card, index) => {
    value += getRankValue(card.rank) * Math.pow(10, 3 - index)
  })

  return value
}

/**
 * Generate high cards array for tie-breaking comparison
 */
function getHighCards(primaryCards: Card[], kickers: Card[]): number[] {
  const allCards = [...primaryCards, ...kickers]
  return sortCardsByRank(allCards).map(c => getRankValue(c.rank))
}

/**
 * Check for flush (5+ cards of same suit)
 */
function findFlush(cards: Card[]): Card[] | null {
  const bySuit = groupBySuit(cards)

  for (const [, suited] of bySuit) {
    if (suited.length >= 5) {
      // Return top 5 cards of this suit
      return sortCardsByRank(suited).slice(0, 5)
    }
  }

  return null
}

/**
 * Check for straight (5 consecutive ranks)
 */
function findStraight(cards: Card[]): Card[] | null {
  // Get unique ranks sorted descending
  const sorted = sortCardsByRank(cards)
  const uniqueRanks = new Map<number, Card>()

  for (const card of sorted) {
    const value = getRankValue(card.rank)
    if (!uniqueRanks.has(value)) {
      uniqueRanks.set(value, card)
    }
  }

  const values = Array.from(uniqueRanks.keys()).sort((a, b) => b - a)

  // Check for regular straight
  for (let i = 0; i <= values.length - 5; i++) {
    if (values[i] - values[i + 4] === 4) {
      // Found a straight
      const straightCards: Card[] = []
      for (let j = 0; j < 5; j++) {
        straightCards.push(uniqueRanks.get(values[i + j])!)
      }
      return straightCards
    }
  }

  // Check for wheel straight (A-2-3-4-5)
  if (
    uniqueRanks.has(14) && // Ace
    uniqueRanks.has(2) &&
    uniqueRanks.has(3) &&
    uniqueRanks.has(4) &&
    uniqueRanks.has(5)
  ) {
    return [
      uniqueRanks.get(5)!,
      uniqueRanks.get(4)!,
      uniqueRanks.get(3)!,
      uniqueRanks.get(2)!,
      uniqueRanks.get(14)!, // Ace plays as 1
    ]
  }

  return null
}

/**
 * Check for straight flush (straight + flush together)
 */
function findStraightFlush(cards: Card[]): Card[] | null {
  const bySuit = groupBySuit(cards)

  for (const [, suited] of bySuit) {
    if (suited.length >= 5) {
      const straight = findStraight(suited)
      if (straight) {
        return straight
      }
    }
  }

  return null
}

/**
 * Check if a hand is a royal flush
 */
function isRoyalFlush(cards: Card[]): boolean {
  if (cards.length !== 5) return false

  const ranks = cards.map((c) => c.rank)
  const suits = new Set(cards.map((c) => c.suit))

  return (
    suits.size === 1 &&
    ranks.includes('A') &&
    ranks.includes('K') &&
    ranks.includes('Q') &&
    ranks.includes('J') &&
    ranks.includes('10')
  )
}

/**
 * Find n-of-a-kind (pairs, trips, quads)
 */
function findNOfAKind(cards: Card[], n: number): { cards: Card[]; kickers: Card[] } | null {
  const byRank = groupByRank(cards)

  for (const [, same] of byRank) {
    if (same.length >= n) {
      const nCards = same.slice(0, n)
      const kickers = sortCardsByRank(
        cards.filter((c) => c.rank !== same[0].rank)
      ).slice(0, 5 - n)
      return { cards: nCards, kickers }
    }
  }

  return null
}

/**
 * Find two pair
 */
function findTwoPair(cards: Card[]): { cards: Card[]; kickers: Card[] } | null {
  const byRank = groupByRank(cards)
  const pairs: Card[][] = []

  // Find all pairs (sorted by rank descending)
  const entries = Array.from(byRank.entries())
  entries.sort((a, b) => getRankValue(b[0]) - getRankValue(a[0]))

  for (const [, same] of entries) {
    if (same.length >= 2) {
      pairs.push(same.slice(0, 2))
    }
  }

  if (pairs.length >= 2) {
    const twoPairCards = [...pairs[0], ...pairs[1]]
    const usedRanks = new Set([pairs[0][0].rank, pairs[1][0].rank])
    const kickers = sortCardsByRank(cards.filter((c) => !usedRanks.has(c.rank))).slice(0, 1)
    return { cards: twoPairCards, kickers }
  }

  return null
}

/**
 * Find full house (trips + pair)
 */
function findFullHouse(cards: Card[]): { cards: Card[]; kickers: Card[] } | null {
  const byRank = groupByRank(cards)
  const trips: Card[] = []
  const pairs: Card[] = []

  // Sort by rank descending
  const entries = Array.from(byRank.entries())
  entries.sort((a, b) => getRankValue(b[0]) - getRankValue(a[0]))

  for (const [, same] of entries) {
    if (same.length >= 3 && trips.length === 0) {
      trips.push(...same.slice(0, 3))
    } else if (same.length >= 2 && pairs.length === 0) {
      pairs.push(...same.slice(0, 2))
    }
  }

  if (trips.length === 3 && pairs.length === 2) {
    return { cards: [...trips, ...pairs], kickers: [] }
  }

  return null
}

/**
 * Evaluate a 5-card poker hand
 */
export function evaluateHand(cards: Card[]): EvaluatedHand {
  if (cards.length < 5) {
    throw new Error('Need at least 5 cards to evaluate a hand')
  }

  const fiveCards = cards.length === 5 ? cards : sortCardsByRank(cards).slice(0, 5)

  // Check for straight flush / royal flush first
  const straightFlush = findStraightFlush(fiveCards)
  if (straightFlush) {
    const isRoyal = isRoyalFlush(straightFlush)
    return {
      rank: isRoyal ? HandRank.RoyalFlush : HandRank.StraightFlush,
      name: isRoyal ? 'Royal Flush' : 'Straight Flush',
      cards: straightFlush,
      kickers: [],
      value: calculateHandValue(
        isRoyal ? HandRank.RoyalFlush : HandRank.StraightFlush,
        straightFlush,
        []
      ),
      highCards: getHighCards(straightFlush, []),
    }
  }

  // Four of a kind
  const quads = findNOfAKind(fiveCards, 4)
  if (quads) {
    return {
      rank: HandRank.FourOfAKind,
      name: 'Four of a Kind',
      cards: quads.cards,
      kickers: quads.kickers,
      value: calculateHandValue(HandRank.FourOfAKind, quads.cards, quads.kickers),
      highCards: getHighCards(quads.cards, quads.kickers),
    }
  }

  // Full house
  const fullHouse = findFullHouse(fiveCards)
  if (fullHouse) {
    return {
      rank: HandRank.FullHouse,
      name: 'Full House',
      cards: fullHouse.cards,
      kickers: [],
      value: calculateHandValue(HandRank.FullHouse, fullHouse.cards, []),
      highCards: getHighCards(fullHouse.cards, []),
    }
  }

  // Flush
  const flush = findFlush(fiveCards)
  if (flush) {
    return {
      rank: HandRank.Flush,
      name: 'Flush',
      cards: flush,
      kickers: [],
      value: calculateHandValue(HandRank.Flush, flush, []),
      highCards: getHighCards(flush, []),
    }
  }

  // Straight
  const straight = findStraight(fiveCards)
  if (straight) {
    return {
      rank: HandRank.Straight,
      name: 'Straight',
      cards: straight,
      kickers: [],
      value: calculateHandValue(HandRank.Straight, straight, []),
      highCards: getHighCards(straight, []),
    }
  }

  // Three of a kind
  const trips = findNOfAKind(fiveCards, 3)
  if (trips) {
    return {
      rank: HandRank.ThreeOfAKind,
      name: 'Three of a Kind',
      cards: trips.cards,
      kickers: trips.kickers,
      value: calculateHandValue(HandRank.ThreeOfAKind, trips.cards, trips.kickers),
      highCards: getHighCards(trips.cards, trips.kickers),
    }
  }

  // Two pair
  const twoPair = findTwoPair(fiveCards)
  if (twoPair) {
    return {
      rank: HandRank.TwoPair,
      name: 'Two Pair',
      cards: twoPair.cards,
      kickers: twoPair.kickers,
      value: calculateHandValue(HandRank.TwoPair, twoPair.cards, twoPair.kickers),
      highCards: getHighCards(twoPair.cards, twoPair.kickers),
    }
  }

  // One pair
  const pair = findNOfAKind(fiveCards, 2)
  if (pair) {
    return {
      rank: HandRank.Pair,
      name: 'Pair',
      cards: pair.cards,
      kickers: pair.kickers,
      value: calculateHandValue(HandRank.Pair, pair.cards, pair.kickers),
      highCards: getHighCards(pair.cards, pair.kickers),
    }
  }

  // High card
  const sorted = sortCardsByRank(fiveCards)
  return {
    rank: HandRank.HighCard,
    name: 'High Card',
    cards: [sorted[0]],
    kickers: sorted.slice(1),
    value: calculateHandValue(HandRank.HighCard, [sorted[0]], sorted.slice(1)),
    highCards: getHighCards([sorted[0]], sorted.slice(1)),
  }
}

/**
 * Find the best 5-card hand from 5, 6, or 7 cards
 */
export function findBestHand(cards: Card[]): EvaluatedHand {
  if (cards.length < 5) {
    throw new Error('Need at least 5 cards')
  }

  if (cards.length === 5) {
    return evaluateHand(cards)
  }

  // Generate all 5-card combinations and find best
  const combinations = getCombinations(cards, 5)
  let bestHand: EvaluatedHand | null = null

  for (const combo of combinations) {
    const hand = evaluateHand(combo)
    if (!bestHand || hand.value > bestHand.value) {
      bestHand = hand
    }
  }

  return bestHand!
}

/**
 * Generate all combinations of k elements from array
 */
function getCombinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = []

  function backtrack(start: number, current: T[]): void {
    if (current.length === k) {
      result.push([...current])
      return
    }

    for (let i = start; i < arr.length; i++) {
      current.push(arr[i])
      backtrack(i + 1, current)
      current.pop()
    }
  }

  backtrack(0, [])
  return result
}

/**
 * Compare two evaluated hands
 * @returns Positive if a wins, negative if b wins, 0 if tie
 */
export function compareHands(a: EvaluatedHand, b: EvaluatedHand): number {
  return a.value - b.value
}

/**
 * Calculate hand strength as a percentage (0-100)
 * Useful for UI display and AI decisions
 */
export function getHandStrengthPercentage(hand: EvaluatedHand): number {
  const strengthByRank = HAND_STRENGTH_BASE as Record<number, number>
  const baseStrength = strengthByRank[hand.rank]

  // Add bonus based on card values within the rank tier
  const maxBonus = hand.rank === HandRank.RoyalFlush
    ? 0
    : (strengthByRank[hand.rank + 1] || 100) - baseStrength - 1

  // Calculate bonus from high cards (simplified)
  const highCard = hand.cards[0]
  const rankValue = getRankValue(highCard?.rank || '2')
  const bonus = (rankValue / 14) * maxBonus

  return Math.min(100, Math.round(baseStrength + bonus))
}

/**
 * Get human-readable description of a hand
 */
export function describeHand(hand: EvaluatedHand): string {
  const highCards = sortCardsByRank(hand.cards)
  const highRank = highCards[0]?.rank || ''

  switch (hand.rank) {
    case HandRank.RoyalFlush:
      return 'Royal Flush'
    case HandRank.StraightFlush:
      return `Straight Flush, ${highRank}-high`
    case HandRank.FourOfAKind:
      return `Four of a Kind, ${highRank}s`
    case HandRank.FullHouse: {
      const trips = hand.cards.slice(0, 3)
      const pair = hand.cards.slice(3, 5)
      return `Full House, ${trips[0]?.rank}s full of ${pair[0]?.rank}s`
    }
    case HandRank.Flush:
      return `Flush, ${highRank}-high`
    case HandRank.Straight:
      return `Straight, ${highRank}-high`
    case HandRank.ThreeOfAKind:
      return `Three of a Kind, ${highRank}s`
    case HandRank.TwoPair: {
      const first = hand.cards[0]?.rank
      const second = hand.cards[2]?.rank
      return `Two Pair, ${first}s and ${second}s`
    }
    case HandRank.Pair:
      return `Pair of ${highRank}s`
    case HandRank.HighCard:
      return `High Card, ${highRank}`
    default:
      return hand.name
  }
}
