/**
 * Seeded Random Number Generator
 * Provides deterministic random numbers for fair, reproducible gameplay
 */

import type { Card, Suit, Rank } from '@/types/card.types'

/**
 * Seeded random number generator using a Linear Congruential Generator (LCG)
 * This ensures reproducible results for fair gameplay
 */
export class SeededRandom {
  private seed: number

  constructor(seed?: number) {
    this.seed = seed ?? this.generateSeed()
  }

  /**
   * Generate a cryptographic-style seed from current timestamp and random values
   */
  private generateSeed(): number {
    const timestamp = Date.now()
    const random = Math.random() * 1000000
    return Math.floor(timestamp * random) % 2147483647
  }

  /**
   * Generate next random number (0 to 1)
   * Using a Linear Congruential Generator (LCG)
   * Parameters from Numerical Recipes
   */
  next(): number {
    const a = 1664525
    const c = 1013904223
    const m = 2 ** 32

    this.seed = (a * this.seed + c) % m
    return this.seed / m
  }

  /**
   * Generate a random integer between min (inclusive) and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm with seeded randomness
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  /**
   * Get the current seed value
   */
  getSeed(): number {
    return this.seed
  }
}

/**
 * Create a standard 52-card deck and shuffle it
 * Cards are created face-down by default
 */
export function createDeck(seed?: number): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
  const ranks: Rank[] = [
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'J',
    'Q',
    'K',
    'A',
  ]

  const deck: Card[] = []
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        suit,
        rank,
        faceUp: false, // Cards start face-down
      })
    }
  }

  const rng = new SeededRandom(seed)
  return rng.shuffle(deck)
}
