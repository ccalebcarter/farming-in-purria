/**
 * AI Types
 * Type definitions for AI dealer behavior and decision-making
 */

import type { Card, EvaluatedHand } from './card.types'
import type { BettingRound, GamePhase, PlayerAction } from './game.types'

/**
 * AI difficulty levels (matching contract types)
 */
export type DifficultyLevel = 'seedling' | 'sprout' | 'bloom' | 'harvest'

/**
 * AI decision result
 */
export interface AIDecision {
  /** The action the AI will take */
  action: PlayerAction
  /** Amount for raise/bet actions */
  amount?: number
  /** Confidence level in this decision (0-1) */
  confidence: number
  /** Whether this is a bluff */
  isBluff?: boolean
  /** Reasoning for decision (debug) */
  reasoning?: string
  /** Time taken to decide (ms) */
  thinkTime?: number
}

/**
 * Game context for AI decision-making
 */
export interface GameContext {
  /** AI's hole cards */
  hand: Card[]
  /** Community cards currently visible */
  community: Card[]
  /** Current pot size */
  pot: number
  /** Player's current bet */
  playerBet: number
  /** AI's current bet */
  dealerBet: number
  /** Current game phase */
  phase: GamePhase
  /** Current betting round */
  bettingRound: BettingRound | null
  /** Player's remaining chips */
  playerChips: number
  /** AI's remaining chips */
  dealerChips: number
  /** Current minimum bet */
  minBet: number
  /** Current maximum bet */
  maxBet: number
  /** Hand history this session */
  handHistory?: HandHistory[]
  /** Player's recent actions */
  playerActions?: PlayerAction[]
}

/**
 * Historical hand data
 */
export interface HandHistory {
  /** Player's final hand */
  playerHand: EvaluatedHand
  /** Dealer's final hand */
  dealerHand: EvaluatedHand
  /** Who won */
  winner: 'player' | 'dealer' | 'tie'
  /** Player's actions during the hand */
  playerActions: PlayerAction[]
  /** Pot size */
  pot: number
  /** When this hand occurred */
  timestamp: Date
}

/**
 * Dealer personality traits
 */
export interface DealerPersonality {
  /** Personality ID */
  id: string
  /** Display name */
  name: string
  /** Base aggression level (0-1) */
  aggression: number
  /** Base bluff frequency (0-1) */
  bluffFrequency: number
  /** Tightness - how selective with hands (0-1) */
  tightness: number
  /** Risk tolerance (0-1) */
  riskTolerance: number
  /** Adaptability - learns from player (0-1) */
  adaptability: number
  /** Dialogue style */
  dialogueStyle: DialogueStyle
}

/**
 * Dialogue style options
 */
export type DialogueStyle =
  | 'professional'    // Formal, business-like
  | 'friendly'        // Casual, encouraging
  | 'competitive'     // Trash-talking, challenging
  | 'stoic'          // Minimal, serious
  | 'enthusiastic'   // Excited, energetic

/**
 * Dialogue context
 */
export interface DialogueContext {
  /** Current game situation */
  situation: GameSituation
  /** Pot size */
  potSize: number
  /** Player's recent action */
  lastPlayerAction?: PlayerAction
  /** Current win streak */
  streak?: number
  /** Is dealer winning */
  dealerWinning: boolean
}

/**
 * Game situation types for dialogue
 */
export type GameSituation =
  | 'game-start'
  | 'player-wins'
  | 'dealer-wins'
  | 'tie'
  | 'player-folds'
  | 'dealer-folds'
  | 'big-pot'
  | 'big-raise'
  | 'all-in'
  | 'jackpot'
  | 'streak-active'
  | 'streak-broken'
  | 'royal-flush'
  | 'bluff-caught'
  | 'session-end'

/**
 * AI strategy interface
 */
export interface AIStrategy {
  /** Difficulty level */
  difficulty: DifficultyLevel
  /** Personality configuration */
  personality: DealerPersonality
  /** Make a decision based on game context */
  decide(context: GameContext): Promise<AIDecision>
  /** Calculate hand strength */
  evaluateHandStrength(hand: Card[], community: Card[]): number
  /** Calculate pot odds */
  calculatePotOdds(context: GameContext): number
  /** Determine if should bluff */
  shouldBluff(context: GameContext): boolean
  /** Calculate raise amount */
  calculateRaiseAmount(context: GameContext, handStrength: number): number
  /** Update strategy based on player behavior (learning) */
  updateStrategy?(history: HandHistory[]): void
}

/**
 * Pre-configured AI personalities
 */
export interface AIPersonalityPreset {
  seedling: DealerPersonality
  sprout: DealerPersonality
  bloom: DealerPersonality
  harvest: DealerPersonality
}

/**
 * AI behavior modifiers (from player items)
 */
export interface AIModifiers {
  /** Scrambler active - can't read player tells */
  scrambled: boolean
  /** Distraction active - reduced decision quality */
  distracted: boolean
  /** Percentage reduction in AI skill */
  skillReduction: number
}

/**
 * Hand strength evaluation result
 */
export interface HandStrengthEvaluation {
  /** Current hand strength (0-1) */
  current: number
  /** Potential hand strength with remaining cards (0-1) */
  potential: number
  /** Probability of improving (0-1) */
  improvementOdds: number
  /** Estimated win probability (0-1) */
  winProbability: number
  /** Recommended action */
  recommendation: PlayerAction
}

/**
 * Pot odds calculation
 */
export interface PotOdds {
  /** Amount to call */
  toCall: number
  /** Current pot size */
  potSize: number
  /** Pot odds ratio */
  odds: number
  /** Whether pot odds favor calling */
  favorable: boolean
}

/**
 * Position analysis
 */
export interface PositionAnalysis {
  /** Is AI in favorable position */
  advantageous: boolean
  /** Who acts first */
  firstToAct: 'player' | 'dealer'
  /** Positional advantage score (-1 to 1) */
  score: number
}

/**
 * AI thought process (for debugging/display)
 */
export interface AIThoughtProcess {
  /** Hand strength assessment */
  handStrength: string
  /** Pot odds evaluation */
  potOdds: string
  /** Risk assessment */
  risk: string
  /** Final decision reasoning */
  decision: string
  /** Bluff consideration */
  bluffing?: string
}
