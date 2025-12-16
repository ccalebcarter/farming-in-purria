/**
 * Game Types
 * Type definitions for game state, actions, and results
 */

import type { Card, EvaluatedHand } from './card.types'

/**
 * Game phase enumeration
 */
export type GamePhase =
  | 'idle'        // No active game
  | 'dealing'     // Cards being dealt
  | 'preflop'     // Before community cards
  | 'flop'        // First 3 community cards
  | 'turn'        // 4th community card
  | 'river'       // 5th community card
  | 'showdown'    // Revealing hands
  | 'fold'        // Player or dealer folded
  | 'result'      // Displaying results

/**
 * Betting round type
 */
export type BettingRound = 'preflop' | 'flop' | 'turn' | 'river'

/**
 * Player action types
 */
export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'all-in'

/**
 * Bet action actor type
 */
export type BetActor = 'player' | 'dealer'

/**
 * Bet action for tracking history (P2-016)
 * Used by the BetBreadcrumbs component to show action history
 */
export interface BetAction {
  /** Who performed the action */
  actor: BetActor
  /** The type of action performed */
  action: PlayerAction
  /** Amount involved in the action */
  amount: number
  /** Pot size after this action */
  potAfter: number
  /** When the action occurred */
  timestamp: number
  /** Optional: game phase when action occurred */
  phase?: GamePhase
}

/**
 * Contract types (difficulty levels)
 * P2-058: Added 'ultra' tier for Ultimate Texas Hold'em
 */
export type ContractType = 'seedling' | 'sprout' | 'bloom' | 'harvest' | 'ultra'

/**
 * Poker variant types
 * P2-060: Variants available per contract tier
 */
export type VariantType = 'texas-holdem' | 'pineapple' | 'omaha' | 'ultimate'

/**
 * Winner of a hand
 */
export type Winner = 'player' | 'dealer' | 'tie'

/**
 * Hand result interface
 */
export interface HandResult {
  /** Who won the hand */
  winner: Winner
  /** Player's best hand */
  playerHand: EvaluatedHand
  /** Dealer's best hand */
  dealerHand: EvaluatedHand
  /** Amount in the pot */
  pot: number
  /** Amount won by the winner */
  winnings: number
  /** Streak multiplier applied */
  streakMultiplier?: number
  /** Whether a jackpot was triggered */
  jackpotWon?: JackpotWin
  /** Whether this was a special hand */
  isSpecialHand?: boolean
}

/**
 * Jackpot win details
 */
export interface JackpotWin {
  /** Type of jackpot won */
  type: 'bronze' | 'silver' | 'gold'
  /** Amount won */
  amount: number
  /** The hand that triggered it */
  triggerHand: EvaluatedHand
}

/**
 * Complete game state
 */
export interface GameState {
  // Game flow
  phase: GamePhase
  bettingRound: BettingRound | null

  // Contract
  contract: ContractType | null
  activeModifiers: string[]

  // Cards
  deck: Card[]
  playerHand: Card[]
  dealerHand: Card[]
  communityCards: Card[]

  // Betting
  pot: number
  playerBet: number
  dealerBet: number
  currentBet: number
  minBet: number
  maxBet: number

  // Session stats
  sessionStartBalance: number
  handsPlayed: number
  handsWon: number
  currentStreak: number
  bestSessionStreak: number
  sessionProfit: number

  // Progression meters
  bloomMeter: number
  luckyDrawMeter: number

  // Jackpots
  jackpots: {
    bronze: number
    silver: number
    gold: number
  }

  // History
  lastResult: HandResult | null
  handHistory: HandResult[]
}

/**
 * Result of a player action
 */
export interface ActionResult {
  /** Whether the action was successful */
  success: boolean
  /** The action that was performed */
  action: PlayerAction
  /** Amount involved in the action */
  amount?: number
  /** New game phase after action */
  newPhase: GamePhase
  /** Error message if action failed */
  error?: string
  /** Whether the hand ended immediately */
  handEnded?: boolean
  /** Message to display */
  message?: string
}

/**
 * Betting configuration
 */
export interface BettingConfig {
  /** Minimum bet amount */
  minBet: number
  /** Maximum bet amount */
  maxBet: number
  /** Small blind amount */
  smallBlind: number
  /** Big blind amount */
  bigBlind: number
  /** Ante amount (optional) */
  ante?: number
}

/**
 * Contract configuration
 */
export interface ContractConfig {
  /** Contract type */
  type: ContractType
  /** Buy-in amount */
  buyIn: number
  /** Minimum bet */
  minBet: number
  /** Maximum bet */
  maxBet: number
  /** Maximum loss before session ends */
  maxLoss: number
  /** Target win amount */
  maxWin: number
  /** AI difficulty for this contract */
  aiDifficulty: ContractType
  /** Display name */
  name: string
  /** Description */
  description: string
  /** Recommended player level */
  recommendedLevel?: string
}

/**
 * Session summary data
 */
export interface SessionSummary {
  /** Contract type played */
  contract: ContractType
  /** Starting balance */
  startBalance: number
  /** Ending balance */
  endBalance: number
  /** Net profit/loss */
  profit: number
  /** Profit percentage */
  profitPercentage: number
  /** Total hands played */
  handsPlayed: number
  /** Hands won */
  handsWon: number
  /** Hands lost */
  handsLost: number
  /** Win rate percentage */
  winRate: number
  /** Best streak achieved */
  bestStreak: number
  /** Total time played (ms) */
  duration: number
  /** Jackpots won */
  jackpotsWon: JackpotWin[]
  /** Achievements unlocked */
  achievementsUnlocked: string[]
  /** Total bloom bonuses earned */
  bloomBonuses: number
  /** Lucky draws earned */
  luckyDrawsEarned: number
}

/**
 * Game situation for AI/dialogue context
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
