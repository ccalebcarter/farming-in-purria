/**
 * Card Types
 * Type definitions for playing cards and poker hands
 */

/**
 * Card suits
 */
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'

/**
 * Card ranks (2-10, J, Q, K, A)
 */
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'

/**
 * Playing card interface
 */
export interface Card {
  /** The suit of the card */
  suit: Suit
  /** The rank of the card */
  rank: Rank
  /** Whether the card is face up (visible) */
  faceUp: boolean
}

/**
 * Hand rank enumeration
 * Higher values beat lower values
 */
export enum HandRank {
  HighCard = 1,
  Pair = 2,
  TwoPair = 3,
  ThreeOfAKind = 4,
  Straight = 5,
  Flush = 6,
  FullHouse = 7,
  FourOfAKind = 8,
  StraightFlush = 9,
  RoyalFlush = 10,
}

/**
 * Evaluated hand result
 */
export interface EvaluatedHand {
  /** The rank of the hand */
  rank: HandRank
  /** Human-readable name of the hand */
  name: string
  /** The cards that make up the best hand */
  cards: Card[]
  /** Kickers for tie-breaking */
  kickers: Card[]
  /** Numerical value for comparison (higher is better) */
  value: number
  /** High cards for comparison (alias for kickers + primary cards) */
  highCards?: number[]
}

/**
 * Suit symbols for display
 */
export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

/**
 * Suit colors
 */
export const SUIT_COLORS: Record<Suit, 'red' | 'black'> = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black',
}

/**
 * Rank values for comparison
 */
export const RANK_VALUES: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14,
}

/**
 * Hand rank display names
 */
export const HAND_RANK_NAMES: Record<HandRank, string> = {
  [HandRank.HighCard]: 'High Card',
  [HandRank.Pair]: 'Pair',
  [HandRank.TwoPair]: 'Two Pair',
  [HandRank.ThreeOfAKind]: 'Three of a Kind',
  [HandRank.Straight]: 'Straight',
  [HandRank.Flush]: 'Flush',
  [HandRank.FullHouse]: 'Full House',
  [HandRank.FourOfAKind]: 'Four of a Kind',
  [HandRank.StraightFlush]: 'Straight Flush',
  [HandRank.RoyalFlush]: 'Royal Flush',
}
