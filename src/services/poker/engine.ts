/**
 * T-065 to T-072: PokerEngine
 * Core game state machine for Texas Hold'em
 */
import type {
  GamePhase,
  BettingRound,
  PlayerAction,
  ActionResult,
  HandResult,
  BettingConfig,
} from '@/types/game.types'
import type { Card, EvaluatedHand } from '@/types/card.types'
import { createDeck } from '@/utils/random'
import { findBestHand, compareHands } from './evaluator'

/**
 * Internal engine state
 */
interface EngineState {
  phase: GamePhase
  bettingRound: BettingRound | null

  // Cards
  deck: Card[]
  playerHand: Card[]
  dealerHand: Card[]
  communityCards: Card[]
  burnPile: Card[]

  // Betting
  pot: number
  playerBet: number
  dealerBet: number
  currentBet: number
  playerStack: number
  dealerStack: number

  // Turn tracking
  playerActed: boolean
  dealerActed: boolean

  // Result
  winner: 'player' | 'dealer' | 'tie' | null
}

/**
 * Public state exposed to consumers
 */
export interface PublicEngineState {
  phase: GamePhase
  bettingRound: BettingRound | null
  playerHand: Card[]
  dealerHand: Card[]
  communityCards: Card[]
  pot: number
  playerBet: number
  dealerBet: number
  currentBet: number
  playerStack: number
  dealerStack: number
  deckSize: number
  winner: 'player' | 'dealer' | 'tie' | null
}

/**
 * PokerEngine - Core game state machine
 */
export class PokerEngine {
  private state: EngineState
  private config: BettingConfig
  private seed?: number

  constructor(config: BettingConfig, seed?: number) {
    this.config = config
    this.seed = seed
    this.state = this.createInitialState()
  }

  /**
   * Create initial empty state
   */
  private createInitialState(): EngineState {
    return {
      phase: 'idle',
      bettingRound: null,
      deck: [],
      playerHand: [],
      dealerHand: [],
      communityCards: [],
      burnPile: [],
      pot: 0,
      playerBet: 0,
      dealerBet: 0,
      currentBet: 0,
      playerStack: 0,
      dealerStack: 0,
      playerActed: false,
      dealerActed: false,
      winner: null,
    }
  }

  // ===== T-065: State Transitions =====

  /**
   * Get current game phase
   */
  getPhase(): GamePhase {
    return this.state.phase
  }

  /**
   * Get public state for UI
   */
  getState(): PublicEngineState {
    return {
      phase: this.state.phase,
      bettingRound: this.state.bettingRound,
      playerHand: this.state.playerHand,
      dealerHand: this.state.dealerHand,
      communityCards: this.state.communityCards,
      pot: this.state.pot,
      playerBet: this.state.playerBet,
      dealerBet: this.state.dealerBet,
      currentBet: this.state.currentBet,
      playerStack: this.state.playerStack,
      dealerStack: this.state.dealerStack,
      deckSize: this.state.deck.length,
      winner: this.state.winner,
    }
  }

  /**
   * Start a new hand with given stack sizes
   */
  startHand(playerStack: number, dealerStack: number): void {
    this.state = this.createInitialState()
    this.state.playerStack = playerStack
    this.state.dealerStack = dealerStack
    this.state.phase = 'dealing'
  }

  // ===== T-066: Deal Cards =====

  /**
   * Deal hole cards and post blinds
   */
  deal(): void {
    if (this.state.phase !== 'dealing') {
      throw new Error(`Cannot deal in phase: ${this.state.phase}`)
    }

    // Create and shuffle deck
    this.state.deck = createDeck(this.seed)

    // Deal 2 cards to each player
    this.state.playerHand = [this.drawCard()!, this.drawCard()!]
    this.state.dealerHand = [this.drawCard()!, this.drawCard()!]

    // Post blinds (T-067)
    this.postBlinds()

    // Move to preflop
    this.state.phase = 'preflop'
    this.state.bettingRound = 'preflop'

    // Reset action tracking for new betting round
    this.state.playerActed = false
    this.state.dealerActed = false
  }

  /**
   * Draw a card from the deck
   */
  private drawCard(): Card | undefined {
    return this.state.deck.pop()
  }

  /**
   * Burn a card (discard face down)
   */
  private burnCard(): void {
    const card = this.drawCard()
    if (card) {
      this.state.burnPile.push(card)
    }
  }

  // ===== T-067: Blind Posting =====

  /**
   * Post blinds at start of hand
   * In heads-up: dealer posts small blind, non-dealer posts big blind
   */
  private postBlinds(): void {
    const { smallBlind, bigBlind } = this.config

    // Dealer posts small blind
    this.state.dealerStack -= smallBlind
    this.state.dealerBet = smallBlind
    this.state.pot += smallBlind

    // Player posts big blind
    this.state.playerStack -= bigBlind
    this.state.playerBet = bigBlind
    this.state.pot += bigBlind

    // Current bet is big blind
    this.state.currentBet = bigBlind
  }

  // ===== T-068: Betting Round Flow =====

  /**
   * Check if it's player's turn
   */
  isPlayerTurn(): boolean {
    if (!this.isBettingPhase()) return false

    // Preflop: dealer acts first (small blind position)
    if (this.state.bettingRound === 'preflop') {
      return this.state.dealerActed && !this.state.playerActed
    }

    // Post-flop: player acts first
    return !this.state.playerActed
  }

  /**
   * Check if it's dealer's turn
   */
  isDealerTurn(): boolean {
    if (!this.isBettingPhase()) return false

    // Preflop: dealer acts first
    if (this.state.bettingRound === 'preflop') {
      return !this.state.dealerActed
    }

    // Post-flop: dealer acts after player
    return this.state.playerActed && !this.state.dealerActed
  }

  /**
   * Check if current phase is a betting phase
   */
  private isBettingPhase(): boolean {
    return ['preflop', 'flop', 'turn', 'river'].includes(this.state.phase)
  }

  /**
   * Check if betting round is complete
   */
  isBettingRoundComplete(): boolean {
    // Both have acted and bets are equal
    return (
      this.state.playerActed &&
      this.state.dealerActed &&
      this.state.playerBet === this.state.dealerBet
    )
  }

  // ===== T-069: Player Actions =====

  /**
   * Execute a player action
   */
  playerAction(action: PlayerAction, amount?: number): ActionResult {
    if (!this.isPlayerTurn()) {
      return {
        success: false,
        action,
        newPhase: this.state.phase,
        error: 'Not player turn',
      }
    }

    return this.executeAction('player', action, amount)
  }

  /**
   * Execute a dealer action
   */
  dealerAction(action: PlayerAction, amount?: number): ActionResult {
    if (!this.isDealerTurn()) {
      return {
        success: false,
        action,
        newPhase: this.state.phase,
        error: 'Not dealer turn',
      }
    }

    return this.executeAction('dealer', action, amount)
  }

  /**
   * Execute an action for a participant
   */
  private executeAction(
    participant: 'player' | 'dealer',
    action: PlayerAction,
    amount?: number
  ): ActionResult {
    const isPlayer = participant === 'player'
    const currentBet = isPlayer ? this.state.playerBet : this.state.dealerBet
    const toCall = this.state.currentBet - currentBet

    switch (action) {
      case 'fold':
        return this.handleFold(participant)

      case 'check':
        if (toCall > 0) {
          return {
            success: false,
            action,
            newPhase: this.state.phase,
            error: 'Cannot check - must call or fold',
          }
        }
        return this.handleCheck(participant)

      case 'call':
        return this.handleCall(participant, toCall)

      case 'raise':
        return this.handleRaise(participant, amount || 0)

      case 'all-in':
        return this.handleAllIn(participant)
    }
  }

  private handleFold(participant: 'player' | 'dealer'): ActionResult {
    this.state.phase = 'fold'
    this.state.winner = participant === 'player' ? 'dealer' : 'player'

    return {
      success: true,
      action: 'fold',
      newPhase: 'fold',
      handEnded: true,
    }
  }

  private handleCheck(participant: 'player' | 'dealer'): ActionResult {
    if (participant === 'player') {
      this.state.playerActed = true
    } else {
      this.state.dealerActed = true
    }

    return {
      success: true,
      action: 'check',
      newPhase: this.state.phase,
    }
  }

  private handleCall(participant: 'player' | 'dealer', toCall: number): ActionResult {
    const isPlayer = participant === 'player'
    const stack = isPlayer ? this.state.playerStack : this.state.dealerStack
    const callAmount = Math.min(toCall, stack)

    if (isPlayer) {
      this.state.playerStack -= callAmount
      this.state.playerBet += callAmount
      this.state.playerActed = true
    } else {
      this.state.dealerStack -= callAmount
      this.state.dealerBet += callAmount
      this.state.dealerActed = true
    }

    this.state.pot += callAmount

    return {
      success: true,
      action: 'call',
      amount: callAmount,
      newPhase: this.state.phase,
    }
  }

  private handleRaise(participant: 'player' | 'dealer', amount: number): ActionResult {
    const isPlayer = participant === 'player'
    const stack = isPlayer ? this.state.playerStack : this.state.dealerStack
    const currentBet = isPlayer ? this.state.playerBet : this.state.dealerBet

    // Validate raise amount
    if (amount < this.config.minBet) {
      return {
        success: false,
        action: 'raise',
        newPhase: this.state.phase,
        error: `Raise must be at least ${this.config.minBet}`,
      }
    }

    if (amount > this.config.maxBet) {
      return {
        success: false,
        action: 'raise',
        newPhase: this.state.phase,
        error: `Raise cannot exceed ${this.config.maxBet}`,
      }
    }

    const toRaiseTo = amount
    const raiseAmount = toRaiseTo - currentBet

    if (raiseAmount > stack) {
      return {
        success: false,
        action: 'raise',
        newPhase: this.state.phase,
        error: 'Insufficient chips',
      }
    }

    if (isPlayer) {
      this.state.playerStack -= raiseAmount
      this.state.playerBet = toRaiseTo
      this.state.playerActed = true
      // Dealer must act again
      this.state.dealerActed = false
    } else {
      this.state.dealerStack -= raiseAmount
      this.state.dealerBet = toRaiseTo
      this.state.dealerActed = true
      // Player must act again
      this.state.playerActed = false
    }

    this.state.pot += raiseAmount
    this.state.currentBet = toRaiseTo

    return {
      success: true,
      action: 'raise',
      amount: toRaiseTo,
      newPhase: this.state.phase,
    }
  }

  private handleAllIn(participant: 'player' | 'dealer'): ActionResult {
    const isPlayer = participant === 'player'
    const stack = isPlayer ? this.state.playerStack : this.state.dealerStack

    if (isPlayer) {
      this.state.pot += stack
      this.state.playerBet += stack
      this.state.playerStack = 0
      this.state.playerActed = true
    } else {
      this.state.pot += stack
      this.state.dealerBet += stack
      this.state.dealerStack = 0
      this.state.dealerActed = true
    }

    // Update current bet if this is a raise
    const newBet = isPlayer ? this.state.playerBet : this.state.dealerBet
    if (newBet > this.state.currentBet) {
      this.state.currentBet = newBet
      // Other player must respond
      if (isPlayer) {
        this.state.dealerActed = false
      } else {
        this.state.playerActed = false
      }
    }

    return {
      success: true,
      action: 'all-in',
      amount: stack,
      newPhase: this.state.phase,
    }
  }

  // ===== T-070: Advance Phase =====

  /**
   * Advance to next phase and deal community cards
   */
  advancePhase(): void {
    if (!this.isBettingRoundComplete()) {
      throw new Error('Betting round not complete')
    }

    // Reset bets for next round
    this.state.playerBet = 0
    this.state.dealerBet = 0
    this.state.currentBet = 0
    this.state.playerActed = false
    this.state.dealerActed = false

    switch (this.state.phase) {
      case 'preflop':
        this.dealFlop()
        break
      case 'flop':
        this.dealTurn()
        break
      case 'turn':
        this.dealRiver()
        break
      case 'river':
        this.state.phase = 'showdown'
        break
    }
  }

  private dealFlop(): void {
    this.burnCard()
    this.state.communityCards.push(
      this.drawCard()!,
      this.drawCard()!,
      this.drawCard()!
    )
    this.state.phase = 'flop'
    this.state.bettingRound = 'flop'
  }

  private dealTurn(): void {
    this.burnCard()
    this.state.communityCards.push(this.drawCard()!)
    this.state.phase = 'turn'
    this.state.bettingRound = 'turn'
  }

  private dealRiver(): void {
    this.burnCard()
    this.state.communityCards.push(this.drawCard()!)
    this.state.phase = 'river'
    this.state.bettingRound = 'river'
  }

  // ===== T-071 & T-072: Resolve Hand =====

  /**
   * Resolve the hand and determine winner
   */
  resolveHand(): HandResult {
    // If someone folded, winner is already determined
    if (this.state.winner) {
      const foldResult: HandResult = {
        winner: this.state.winner,
        playerHand: { rank: 0, name: 'Folded', cards: [], kickers: [], value: 0 } as unknown as EvaluatedHand,
        dealerHand: { rank: 0, name: 'Folded', cards: [], kickers: [], value: 0 } as unknown as EvaluatedHand,
        pot: this.state.pot,
        winnings: this.state.pot,
      }

      this.state.phase = 'result'
      return foldResult
    }

    // Evaluate hands
    const playerAllCards = [...this.state.playerHand, ...this.state.communityCards]
    const dealerAllCards = [...this.state.dealerHand, ...this.state.communityCards]

    const playerHand = findBestHand(playerAllCards)
    const dealerHand = findBestHand(dealerAllCards)

    const comparison = compareHands(playerHand, dealerHand)

    let winner: 'player' | 'dealer' | 'tie'
    if (comparison > 0) {
      winner = 'player'
    } else if (comparison < 0) {
      winner = 'dealer'
    } else {
      winner = 'tie'
    }

    this.state.winner = winner
    this.state.phase = 'result'

    return {
      winner,
      playerHand,
      dealerHand,
      pot: this.state.pot,
      winnings: this.state.pot,
    }
  }

  /**
   * Reset engine for a new hand
   */
  reset(): void {
    this.state = this.createInitialState()
  }
}
