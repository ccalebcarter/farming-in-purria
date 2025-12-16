/**
 * T-058: Card Utility Functions
 * Compare, sort, and format playing cards
 */
import type { Card, Rank, Suit } from '@/types/card.types'
import { RANK_VALUES, SUIT_SYMBOLS } from '@/types/card.types'

/**
 * Standard suit ordering (bridge order)
 */
const SUIT_ORDER: Record<Suit, number> = {
  clubs: 1,
  diamonds: 2,
  hearts: 3,
  spades: 4,
}

/**
 * Suit character abbreviations for parsing
 */
const SUIT_ABBREV: Record<string, Suit> = {
  c: 'clubs',
  d: 'diamonds',
  h: 'hearts',
  s: 'spades',
}

/**
 * Get numerical value for a rank (2=2, ..., A=14)
 */
export function getRankValue(rank: Rank): number {
  return RANK_VALUES[rank]
}

/**
 * Get numerical value for a suit (for sorting)
 */
export function getSuitValue(suit: Suit): number {
  return SUIT_ORDER[suit]
}

/**
 * Compare two cards by rank first, then by suit
 * @returns Positive if a > b, negative if a < b, 0 if equal
 */
export function compareCards(a: Card, b: Card): number {
  const rankDiff = getRankValue(a.rank) - getRankValue(b.rank)
  if (rankDiff !== 0) {
    return rankDiff
  }
  return getSuitValue(a.suit) - getSuitValue(b.suit)
}

/**
 * Compare two cards by rank only (ignoring suit)
 */
export function compareCardsByRank(a: Card, b: Card): number {
  return getRankValue(a.rank) - getRankValue(b.rank)
}

/**
 * Sort cards by rank in descending order (highest first)
 * Returns a new sorted array (does not mutate original)
 */
export function sortCardsByRank(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => compareCardsByRank(b, a))
}

/**
 * Sort cards by suit in ascending order (clubs first, spades last)
 * Returns a new sorted array (does not mutate original)
 */
export function sortCardsBySuit(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => getSuitValue(a.suit) - getSuitValue(b.suit))
}

/**
 * Format a card for display (e.g., "A♠", "K♥")
 * @param card The card to format
 * @param respectFaceUp If true, shows "??" for face-down cards
 */
export function formatCard(card: Card, respectFaceUp = false): string {
  if (respectFaceUp && !card.faceUp) {
    return '??'
  }
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`
}

/**
 * Format a hand (array of cards) for display
 */
export function formatHand(cards: Card[], respectFaceUp = false): string {
  return cards.map((c) => formatCard(c, respectFaceUp)).join(' ')
}

/**
 * Check if a suit is red (hearts or diamonds)
 */
export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds'
}

/**
 * Check if two cards have the same suit
 */
export function isSameSuit(a: Card, b: Card): boolean {
  return a.suit === b.suit
}

/**
 * Check if two cards have the same rank
 */
export function isSameRank(a: Card, b: Card): boolean {
  return a.rank === b.rank
}

/**
 * Convert card to string identifier (e.g., "As" for Ace of spades)
 */
export function cardToString(card: Card): string {
  const suitAbbrev = card.suit[0]
  return `${card.rank}${suitAbbrev}`
}

/**
 * Parse a string identifier to a card
 * @param str String like "As", "10h", "2c"
 * @returns Card object or undefined if invalid
 */
export function parseCard(str: string): Card | undefined {
  if (!str || str.length < 2) {
    return undefined
  }

  // Handle 10 specially (3 characters)
  let rank: string
  let suitChar: string

  if (str.startsWith('10')) {
    rank = '10'
    suitChar = str[2]
  } else {
    rank = str[0]
    suitChar = str[1]
  }

  // Validate rank
  const validRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
  if (!validRanks.includes(rank)) {
    return undefined
  }

  // Validate suit
  const suit = SUIT_ABBREV[suitChar.toLowerCase()]
  if (!suit) {
    return undefined
  }

  return {
    rank: rank as Rank,
    suit,
    faceUp: true,
  }
}

/**
 * Get all cards of a specific rank from a hand
 */
export function getCardsOfRank(cards: Card[], rank: Rank): Card[] {
  return cards.filter((c) => c.rank === rank)
}

/**
 * Get all cards of a specific suit from a hand
 */
export function getCardsOfSuit(cards: Card[], suit: Suit): Card[] {
  return cards.filter((c) => c.suit === suit)
}

/**
 * Group cards by rank
 */
export function groupByRank(cards: Card[]): Map<Rank, Card[]> {
  const groups = new Map<Rank, Card[]>()
  for (const card of cards) {
    const existing = groups.get(card.rank) || []
    existing.push(card)
    groups.set(card.rank, existing)
  }
  return groups
}

/**
 * Group cards by suit
 */
export function groupBySuit(cards: Card[]): Map<Suit, Card[]> {
  const groups = new Map<Suit, Card[]>()
  for (const card of cards) {
    const existing = groups.get(card.suit) || []
    existing.push(card)
    groups.set(card.suit, existing)
  }
  return groups
}

/**
 * Count occurrences of each rank
 */
export function countRanks(cards: Card[]): Map<Rank, number> {
  const counts = new Map<Rank, number>()
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1)
  }
  return counts
}

/**
 * Find the highest card in a collection
 */
export function findHighestCard(cards: Card[]): Card | undefined {
  if (cards.length === 0) return undefined
  return cards.reduce((highest, card) =>
    compareCardsByRank(card, highest) > 0 ? card : highest
  )
}

/**
 * Check if cards form a sequence (consecutive ranks)
 * Cards must be sorted by rank first
 */
export function isSequence(sortedCards: Card[]): boolean {
  if (sortedCards.length < 2) return true

  for (let i = 1; i < sortedCards.length; i++) {
    const prevValue = getRankValue(sortedCards[i - 1].rank)
    const currValue = getRankValue(sortedCards[i].rank)
    if (prevValue - currValue !== 1) {
      return false
    }
  }
  return true
}

/**
 * Check for wheel straight (A-2-3-4-5)
 * Cards should be sorted by rank descending
 */
export function isWheelStraight(sortedCards: Card[]): boolean {
  if (sortedCards.length !== 5) return false

  const ranks = sortedCards.map((c) => c.rank)
  return (
    ranks.includes('A') &&
    ranks.includes('2') &&
    ranks.includes('3') &&
    ranks.includes('4') &&
    ranks.includes('5')
  )
}
