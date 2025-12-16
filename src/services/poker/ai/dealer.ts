/**
 * T-078, T-079, T-080: AI Dealer Base Class and Factory
 * Abstract AI dealer with difficulty-based strategies
 */
import type {
  DifficultyLevel,
  GameContext,
  AIDecision,
  AIModifiers,
  DealerPersonality,
} from '@/types/ai.types'
import type { Card } from '@/types/card.types'
import { findBestHand, getHandStrengthPercentage } from '@/services/poker/evaluator'
import { calculatePotOdds } from '@/services/poker/betting'
import { getRankValue } from '@/utils/cards'

/**
 * Default AI modifiers (no modifications)
 */
const DEFAULT_MODIFIERS: AIModifiers = {
  scrambled: false,
  distracted: false,
  skillReduction: 0,
}

/**
 * Pre-configured personalities for each difficulty
 */
const PERSONALITIES: Record<DifficultyLevel, DealerPersonality> = {
  seedling: {
    id: 'seedling',
    name: 'Seedling',
    aggression: 0.2,
    bluffFrequency: 0.05,
    tightness: 0.6,
    riskTolerance: 0.3,
    adaptability: 0.1,
    dialogueStyle: 'friendly',
  },
  sprout: {
    id: 'sprout',
    name: 'Sprout',
    aggression: 0.4,
    bluffFrequency: 0.15,
    tightness: 0.5,
    riskTolerance: 0.5,
    adaptability: 0.3,
    dialogueStyle: 'professional',
  },
  bloom: {
    id: 'bloom',
    name: 'Bloom',
    aggression: 0.7,
    bluffFrequency: 0.25,
    tightness: 0.4,
    riskTolerance: 0.7,
    adaptability: 0.6,
    dialogueStyle: 'competitive',
  },
  harvest: {
    id: 'harvest',
    name: 'Harvest',
    aggression: 0.75,
    bluffFrequency: 0.28,
    tightness: 0.35,
    riskTolerance: 0.8,
    adaptability: 0.9,
    dialogueStyle: 'stoic',
  },
}

/**
 * T-078: Abstract AIDealer class
 */
export abstract class AIDealer {
  protected difficulty: DifficultyLevel
  protected personality: DealerPersonality
  protected seed: number

  constructor(difficulty: DifficultyLevel, seed?: number) {
    this.difficulty = difficulty
    this.personality = PERSONALITIES[difficulty]
    this.seed = seed ?? Date.now()
  }

  /**
   * Get the AI difficulty level
   */
  getDifficulty(): DifficultyLevel {
    return this.difficulty
  }

  /**
   * Get the personality configuration
   */
  getPersonality(): DealerPersonality {
    return this.personality
  }

  /**
   * Get bluff frequency (0-1)
   */
  abstract getBluffFrequency(): number

  /**
   * Get aggression level (0-1)
   */
  abstract getAggressionLevel(): number

  /**
   * Make a decision based on game context
   */
  abstract decide(context: GameContext, modifiers?: AIModifiers): Promise<AIDecision>

  /**
   * T-085: Evaluate hand strength for AI decision making
   */
  evaluateHandStrength(hand: Card[], community: Card[]): number {
    // Safety check for undefined arrays
    const safeHand = hand || []
    const safeCommunity = community || []

    // Pre-flop: evaluate hole card strength
    if (safeCommunity.length === 0) {
      return this.evaluatePreflopStrength(safeHand)
    }

    // Post-flop: evaluate made hand and potential
    const allCards = [...safeHand, ...safeCommunity]
    const evaluatedHand = findBestHand(allCards)
    const handStrength = getHandStrengthPercentage(evaluatedHand) / 100

    // Add potential for draws
    const drawPotential = this.evaluateDrawPotential(safeHand, safeCommunity)

    return Math.min(1, handStrength + drawPotential * 0.2)
  }

  /**
   * Evaluate pre-flop hand strength (0-1)
   */
  protected evaluatePreflopStrength(hand: Card[]): number {
    if (hand.length < 2) return 0

    const [card1, card2] = hand
    const rank1 = getRankValue(card1.rank)
    const rank2 = getRankValue(card2.rank)
    const isPair = card1.rank === card2.rank
    const isSuited = card1.suit === card2.suit
    const isConnected = Math.abs(rank1 - rank2) === 1

    let strength = 0

    // Base strength from high cards
    strength += (rank1 + rank2) / 28 // Max is 28 (AA)

    // Pair bonus
    if (isPair) {
      strength += 0.2 + (rank1 / 14) * 0.1
    }

    // Suited bonus
    if (isSuited) {
      strength += 0.05
    }

    // Connected bonus
    if (isConnected) {
      strength += 0.03
    }

    // Premium hands get extra boost
    if (isPair && rank1 >= 10) {
      strength += 0.1 // Premium pairs
    }

    // AK, AQ, AJ get a boost
    if ((rank1 === 14 || rank2 === 14) && (rank1 >= 11 || rank2 >= 11)) {
      strength += 0.1
    }

    return Math.min(1, Math.max(0, strength))
  }

  /**
   * Evaluate draw potential
   */
  protected evaluateDrawPotential(hand: Card[], community: Card[]): number {
    const allCards = [...hand, ...community]
    let potential = 0

    // Check for flush draw
    const suitCounts = new Map<string, number>()
    for (const card of allCards) {
      suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1)
    }
    for (const count of suitCounts.values()) {
      if (count === 4) {
        potential += 0.35 // 4 to a flush
      } else if (count === 3 && community.length <= 3) {
        potential += 0.15 // 3 to a flush on flop
      }
    }

    // Check for straight draw
    const ranks = allCards.map((c) => getRankValue(c.rank)).sort((a, b) => a - b)
    const uniqueRanks = [...new Set(ranks)]

    // Open-ended straight draw (4 in a row)
    for (let i = 0; i < uniqueRanks.length - 3; i++) {
      if (uniqueRanks[i + 3] - uniqueRanks[i] === 3) {
        potential += 0.32
        break
      }
    }

    // Gutshot straight draw
    for (let i = 0; i < uniqueRanks.length - 3; i++) {
      if (uniqueRanks[i + 3] - uniqueRanks[i] === 4) {
        potential += 0.16
        break
      }
    }

    return Math.min(0.5, potential)
  }

  /**
   * T-086: Calculate pot odds for AI decisions
   */
  calculatePotOdds(context: GameContext): number {
    const toCall = context.playerBet - context.dealerBet
    if (toCall <= 0) return 0 // Free to check

    const potOddsResult = calculatePotOdds(context.pot, toCall)
    return potOddsResult.potOdds
  }

  /**
   * T-087: Determine if should bluff
   */
  shouldBluff(context: GameContext): boolean {
    const bluffFreq = this.getBluffFrequency()
    const random = this.getSeededRandom()

    // Base bluff check
    if (random > bluffFreq) return false

    // Don't bluff if pot is too large (risk too high)
    if (context.pot > context.dealerChips * 0.5) return false

    // Don't bluff on river with made hand showing
    if (context.bettingRound === 'river') {
      const strength = this.evaluateHandStrength(context.hand, context.community)
      if (strength > 0.6) return false // We have a real hand
    }

    // Bluff more often in position
    const inPosition = context.bettingRound !== 'preflop'
    if (inPosition && random < bluffFreq * 1.2) return true

    return random < bluffFreq
  }

  /**
   * T-088: Calculate raise amount based on hand strength
   */
  calculateRaiseAmount(context: GameContext, handStrength: number): number {
    const { pot, minBet, maxBet, dealerChips, dealerBet } = context

    // Base raise is proportional to hand strength and pot
    const strengthFactor = 0.3 + handStrength * 0.7
    const potBased = pot * strengthFactor
    const aggression = this.getAggressionLevel()

    // Calculate raise considering aggression
    let raiseAmount = Math.round(potBased * (0.5 + aggression * 0.5))

    // Ensure minimum bet
    raiseAmount = Math.max(raiseAmount, minBet)

    // Ensure maximum bet
    raiseAmount = Math.min(raiseAmount, maxBet)

    // Ensure we have enough chips
    const totalNeeded = raiseAmount - dealerBet
    if (totalNeeded > dealerChips) {
      raiseAmount = dealerChips + dealerBet
    }

    return raiseAmount
  }

  /**
   * Get seeded random number between 0 and 1
   */
  protected getSeededRandom(): number {
    // Simple LCG for reproducible but varying results
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff
    return (this.seed % 1000) / 1000
  }

  /**
   * Introduce random mistakes based on difficulty
   */
  protected shouldMakeMistake(): boolean {
    const mistakeRate = this.getMistakeRate()
    return this.getSeededRandom() < mistakeRate
  }

  /**
   * Get mistake rate based on difficulty
   */
  protected getMistakeRate(): number {
    switch (this.difficulty) {
      case 'seedling':
        return 0.2 // 20% mistakes
      case 'sprout':
        return 0.1 // 10% mistakes
      case 'bloom':
        return 0.05 // 5% mistakes
      case 'harvest':
        return 0.02 // 2% mistakes
      default:
        return 0.1
    }
  }
}

/**
 * T-081: Seedling Strategy - Easy, passive, predictable
 */
class SeedlingDealer extends AIDealer {
  getBluffFrequency(): number {
    return 0.05
  }

  getAggressionLevel(): number {
    return 0.2
  }

  async decide(context: GameContext, modifiers: AIModifiers = DEFAULT_MODIFIERS): Promise<AIDecision> {
    const hand = context.hand || []
    const community = context.community || []
    const handStrength = this.evaluateHandStrength(hand, community)
    const potOdds = this.calculatePotOdds(context)
    const toCall = (context.playerBet || 0) - (context.dealerBet || 0)

    // Apply distraction modifier
    const effectiveStrength = modifiers.distracted
      ? handStrength * (1 - modifiers.skillReduction * 0.5)
      : handStrength

    // Seedling plays very straightforward
    // Strong hand -> bet/raise
    if (effectiveStrength > 0.7) {
      const amount = this.calculateRaiseAmount(context, effectiveStrength)
      return {
        action: 'raise',
        amount,
        confidence: effectiveStrength,
        isBluff: false,
      }
    }

    // Medium hand + good pot odds -> call
    if (effectiveStrength > 0.4 || (potOdds < 0.2 && effectiveStrength > 0.25)) {
      if (toCall === 0) {
        return { action: 'check', confidence: 0.6 }
      }
      return { action: 'call', confidence: 0.5 }
    }

    // Weak hand with free check
    if (toCall === 0) {
      return { action: 'check', confidence: 0.4 }
    }

    // Fold weak hands
    return { action: 'fold', confidence: 0.7 }
  }
}

/**
 * T-082: Sprout Strategy - Balanced, occasional bluffs
 */
class SproutDealer extends AIDealer {
  getBluffFrequency(): number {
    return 0.15
  }

  getAggressionLevel(): number {
    return 0.4
  }

  async decide(context: GameContext, modifiers: AIModifiers = DEFAULT_MODIFIERS): Promise<AIDecision> {
    const hand = context.hand || []
    const community = context.community || []
    const handStrength = this.evaluateHandStrength(hand, community)
    const potOdds = this.calculatePotOdds(context)
    const toCall = (context.playerBet || 0) - (context.dealerBet || 0)

    // Apply modifiers
    const effectiveStrength = modifiers.distracted
      ? handStrength * (1 - modifiers.skillReduction * 0.5)
      : handStrength

    // Check for bluff opportunity
    if (effectiveStrength < 0.3 && this.shouldBluff(context)) {
      const bluffAmount = this.calculateRaiseAmount(context, 0.6) // Bluff as if medium hand
      return {
        action: 'raise',
        amount: bluffAmount,
        confidence: 0.4,
        isBluff: true,
      }
    }

    // Strong hand -> value bet
    if (effectiveStrength > 0.65) {
      const amount = this.calculateRaiseAmount(context, effectiveStrength)
      return {
        action: 'raise',
        amount,
        confidence: effectiveStrength,
        isBluff: false,
      }
    }

    // Medium hand evaluation
    if (effectiveStrength > 0.35) {
      // Good pot odds -> call
      if (potOdds < effectiveStrength * 0.8 || toCall === 0) {
        if (toCall === 0) {
          // Occasionally bet medium hands
          if (this.getSeededRandom() < 0.3) {
            return {
              action: 'raise',
              amount: this.calculateRaiseAmount(context, effectiveStrength * 0.8),
              confidence: 0.5,
              isBluff: false,
            }
          }
          return { action: 'check', confidence: 0.5 }
        }
        return { action: 'call', confidence: 0.5 }
      }
    }

    // Free check
    if (toCall === 0) {
      return { action: 'check', confidence: 0.4 }
    }

    // Fold
    return { action: 'fold', confidence: 0.6 }
  }
}

/**
 * T-083: Bloom Strategy - Aggressive, reads patterns, 25% bluff
 */
class BloomDealer extends AIDealer {
  getBluffFrequency(): number {
    return 0.25
  }

  getAggressionLevel(): number {
    return 0.7
  }

  async decide(context: GameContext, modifiers: AIModifiers = DEFAULT_MODIFIERS): Promise<AIDecision> {
    const hand = context.hand || []
    const community = context.community || []
    const handStrength = this.evaluateHandStrength(hand, community)
    const potOdds = this.calculatePotOdds(context)
    const toCall = (context.playerBet || 0) - (context.dealerBet || 0)

    // Apply modifiers
    let effectiveStrength = modifiers.distracted
      ? handStrength * (1 - modifiers.skillReduction)
      : handStrength

    // Read player patterns if not scrambled
    let playerAggression = 0.5 // Default assumption
    if (!modifiers.scrambled && context.playerActions && context.playerActions.length > 0) {
      const raises = context.playerActions.filter((a) => a === 'raise').length
      playerAggression = raises / context.playerActions.length
    }

    // Semi-bluff with draws
    if (effectiveStrength < 0.4 && effectiveStrength > 0.25) {
      if (this.shouldBluff(context)) {
        return {
          action: 'raise',
          amount: this.calculateRaiseAmount(context, 0.65),
          confidence: 0.45,
          isBluff: true,
        }
      }
    }

    // Strong hand -> aggressive value betting
    if (effectiveStrength > 0.6) {
      const amount = this.calculateRaiseAmount(context, effectiveStrength)
      return {
        action: effectiveStrength > 0.85 ? (this.getSeededRandom() < 0.3 ? 'all-in' : 'raise') : 'raise',
        amount,
        confidence: effectiveStrength,
        isBluff: false,
      }
    }

    // Medium hand vs aggressive player -> call down
    if (effectiveStrength > 0.35 && playerAggression > 0.6) {
      if (toCall === 0) {
        return {
          action: 'raise',
          amount: this.calculateRaiseAmount(context, effectiveStrength),
          confidence: 0.55,
          isBluff: false,
        }
      }
      return { action: 'call', confidence: 0.5 }
    }

    // Medium hand with good pot odds
    if (effectiveStrength > 0.3 && potOdds < effectiveStrength) {
      if (toCall === 0) {
        if (this.getSeededRandom() < 0.4) {
          return {
            action: 'raise',
            amount: this.calculateRaiseAmount(context, effectiveStrength),
            confidence: 0.5,
            isBluff: false,
          }
        }
        return { action: 'check', confidence: 0.5 }
      }
      return { action: 'call', confidence: 0.5 }
    }

    // Bluff opportunity
    if (this.shouldBluff(context)) {
      return {
        action: 'raise',
        amount: this.calculateRaiseAmount(context, 0.6),
        confidence: 0.35,
        isBluff: true,
      }
    }

    // Free check
    if (toCall === 0) {
      return { action: 'check', confidence: 0.4 }
    }

    // Fold
    return { action: 'fold', confidence: 0.6 }
  }
}

/**
 * T-084: Harvest Strategy - Expert, adaptive, psychological pressure
 */
class HarvestDealer extends AIDealer {
  getBluffFrequency(): number {
    return 0.28
  }

  getAggressionLevel(): number {
    return 0.75
  }

  async decide(context: GameContext, modifiers: AIModifiers = DEFAULT_MODIFIERS): Promise<AIDecision> {
    const hand = context.hand || []
    const community = context.community || []
    const handStrength = this.evaluateHandStrength(hand, community)
    const potOdds = this.calculatePotOdds(context)
    const toCall = (context.playerBet || 0) - (context.dealerBet || 0)

    // Apply modifiers
    let effectiveStrength = modifiers.distracted
      ? handStrength * (1 - modifiers.skillReduction)
      : handStrength

    // Advanced pattern reading
    let playerProfile = { aggression: 0.5, foldRate: 0.3, bluffFrequency: 0.1 }
    if (!modifiers.scrambled && context.playerActions && context.playerActions.length >= 3) {
      const raises = context.playerActions.filter((a) => a === 'raise').length
      const folds = context.playerActions.filter((a) => a === 'fold').length
      playerProfile.aggression = raises / context.playerActions.length
      playerProfile.foldRate = folds / context.playerActions.length
    }

    // Exploit tight players with bluffs
    if (playerProfile.foldRate > 0.4 && effectiveStrength < 0.3) {
      if (this.getSeededRandom() < 0.4) {
        return {
          action: 'raise',
          amount: this.calculateRaiseAmount(context, 0.7),
          confidence: 0.45,
          isBluff: true,
          reasoning: 'Exploiting tight fold rate',
        }
      }
    }

    // Monster hand -> vary between slow play and aggression
    if (effectiveStrength > 0.85) {
      // Occasionally slow play
      if (this.getSeededRandom() < 0.2 && toCall <= context.pot * 0.1) {
        if (toCall === 0) {
          return { action: 'check', confidence: 0.9, reasoning: 'Slow play monster' }
        }
        return { action: 'call', confidence: 0.9, reasoning: 'Slow play monster' }
      }

      // Usually aggressive
      if (this.getSeededRandom() < 0.35) {
        return {
          action: 'all-in',
          amount: context.dealerChips + context.dealerBet,
          confidence: 0.95,
          isBluff: false,
          reasoning: 'Maximum value with monster',
        }
      }

      return {
        action: 'raise',
        amount: this.calculateRaiseAmount(context, effectiveStrength),
        confidence: effectiveStrength,
        isBluff: false,
      }
    }

    // Strong hand -> value bet
    if (effectiveStrength > 0.6) {
      const amount = this.calculateRaiseAmount(context, effectiveStrength)
      return {
        action: 'raise',
        amount,
        confidence: effectiveStrength,
        isBluff: false,
      }
    }

    // Medium-strong hands -> balanced play
    if (effectiveStrength > 0.4) {
      // vs aggressive player, call more
      if (playerProfile.aggression > 0.6) {
        if (toCall === 0) {
          return {
            action: 'raise',
            amount: this.calculateRaiseAmount(context, effectiveStrength),
            confidence: 0.55,
            isBluff: false,
          }
        }
        return { action: 'call', confidence: 0.55 }
      }

      // vs passive player, bet for value
      if (toCall === 0) {
        return {
          action: 'raise',
          amount: this.calculateRaiseAmount(context, effectiveStrength),
          confidence: 0.55,
          isBluff: false,
        }
      }

      if (potOdds < effectiveStrength * 0.9) {
        return { action: 'call', confidence: 0.5 }
      }
    }

    // Draw hands with potential
    if (effectiveStrength > 0.25 && context.bettingRound !== 'river') {
      const drawOdds = this.evaluateDrawPotential(context.hand, context.community)
      if (drawOdds > 0.2) {
        if (potOdds < drawOdds * 1.2 || toCall === 0) {
          if (toCall === 0 && this.getSeededRandom() < 0.35) {
            return {
              action: 'raise',
              amount: this.calculateRaiseAmount(context, 0.5),
              confidence: 0.45,
              isBluff: true,
              reasoning: 'Semi-bluff with draw',
            }
          }
          if (toCall === 0) {
            return { action: 'check', confidence: 0.5 }
          }
          return { action: 'call', confidence: 0.45 }
        }
      }
    }

    // Occasional bluff
    if (this.shouldBluff(context)) {
      return {
        action: 'raise',
        amount: this.calculateRaiseAmount(context, 0.65),
        confidence: 0.35,
        isBluff: true,
      }
    }

    // Free check
    if (toCall === 0) {
      return { action: 'check', confidence: 0.4 }
    }

    // Fold
    return { action: 'fold', confidence: 0.6 }
  }
}

/**
 * T-079: Factory function for creating AI dealers
 */
export function createAIDealer(difficulty: DifficultyLevel, seed?: number): AIDealer {
  switch (difficulty) {
    case 'seedling':
      return new SeedlingDealer(difficulty, seed)
    case 'sprout':
      return new SproutDealer(difficulty, seed)
    case 'bloom':
      return new BloomDealer(difficulty, seed)
    case 'harvest':
      return new HarvestDealer(difficulty, seed)
    default:
      return new SeedlingDealer('seedling', seed)
  }
}

/**
 * Get all available difficulty levels
 */
export function getDifficultyLevels(): DifficultyLevel[] {
  return ['seedling', 'sprout', 'bloom', 'harvest']
}

/**
 * Get personality preset for a difficulty
 */
export function getPersonalityPreset(difficulty: DifficultyLevel): DealerPersonality {
  return PERSONALITIES[difficulty]
}
