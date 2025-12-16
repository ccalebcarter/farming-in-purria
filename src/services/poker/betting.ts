/**
 * T-074, T-075, T-076, T-077: Betting System
 * Bet validation, pot odds, presets, and side pots
 */
import type { BettingConfig } from '@/types/game.types'

// ===== T-074: Bet Validation =====

export interface BetValidationContext {
  currentBet: number
  playerBet: number
  playerStack: number
  config: BettingConfig
  isAllIn?: boolean
  isCall?: boolean
}

export interface BetValidation {
  isValid: boolean
  error?: string
  actualBet?: number
  callAmount?: number
}

/**
 * Validate a bet amount
 */
export function validateBet(amount: number, context: BetValidationContext): BetValidation {
  const { currentBet, playerBet, playerStack, config, isAllIn, isCall } = context
  const toCall = currentBet - playerBet

  // If this is a call, just validate the call amount
  if (isCall) {
    const callAmount = Math.min(toCall, playerStack)
    return {
      isValid: true,
      callAmount,
      actualBet: playerBet + callAmount,
    }
  }

  // All-in is always valid (even if below min raise)
  if (isAllIn) {
    return {
      isValid: true,
      actualBet: playerBet + playerStack,
    }
  }

  // Check minimum bet
  if (amount < config.minBet) {
    return {
      isValid: false,
      error: `Bet must be at least the minimum of ${config.minBet}`,
    }
  }

  // Check maximum bet
  if (amount > config.maxBet) {
    return {
      isValid: false,
      error: `Bet cannot exceed the maximum of ${config.maxBet}`,
    }
  }

  // Check stack
  const betIncrease = amount - playerBet
  if (betIncrease > playerStack) {
    return {
      isValid: false,
      error: `Not enough chips. You have ${playerStack}`,
    }
  }

  // If raising, must raise by at least the min bet over current bet
  if (amount > currentBet) {
    const minRaise = currentBet + config.minBet
    if (amount < minRaise) {
      return {
        isValid: false,
        error: `Raise must be at least ${minRaise}`,
      }
    }
  }

  return {
    isValid: true,
    actualBet: amount,
  }
}

// ===== T-075: Pot Odds Calculator =====

export interface PotOddsResult {
  /** Pot odds as decimal (0-1) */
  potOdds: number
  /** Pot odds as percentage */
  potOddsPercent: number
  /** Implied odds considering future bets */
  impliedOdds: number
  /** Minimum equity needed to break even */
  breakEvenEquity: number
  /** Check if a call is profitable given equity */
  isGoodCall: (equity: number) => boolean
}

/**
 * Calculate pot odds for a given situation
 * @param pot Current pot size
 * @param callAmount Amount needed to call
 * @param impliedValue Expected future winnings if hit
 */
export function calculatePotOdds(
  pot: number,
  callAmount: number,
  impliedValue = 0
): PotOddsResult {
  // Handle edge case
  if (callAmount === 0) {
    return {
      potOdds: 0,
      potOddsPercent: 0,
      impliedOdds: 0,
      breakEvenEquity: 0,
      isGoodCall: () => true, // Free to check/call
    }
  }

  // Pot odds = call / (pot + call)
  const totalPot = pot + callAmount
  const potOdds = callAmount / totalPot

  // Implied odds = call / (pot + call + implied)
  const impliedPot = pot + callAmount + impliedValue
  const impliedOdds = callAmount / impliedPot

  // Break even equity = pot odds
  const breakEvenEquity = potOdds

  return {
    potOdds,
    potOddsPercent: potOdds * 100,
    impliedOdds,
    breakEvenEquity,
    isGoodCall: (equity: number) => equity >= breakEvenEquity,
  }
}

// ===== T-076: Quick Bet Presets =====

export interface QuickBetPresets {
  quarterPot: number
  halfPot: number
  threequarterPot: number
  pot: number
  maxBet: number
}

/**
 * Get quick bet preset amounts
 */
export function getQuickBetPresets(
  pot: number,
  context: BetValidationContext
): QuickBetPresets {
  const { playerBet, playerStack, config } = context

  // Calculate effective max (minimum of stack and config max)
  const effectiveMax = Math.min(playerStack + playerBet, config.maxBet)

  // Calculate percentages
  const quarterPot = Math.round(pot * 0.25)
  const halfPot = Math.round(pot * 0.5)
  const threequarterPot = Math.round(pot * 0.75)
  const fullPot = pot

  // Apply constraints
  const constrainBet = (bet: number): number => {
    // At least min bet
    const withMin = Math.max(bet, config.minBet)
    // At most effective max
    const withMax = Math.min(withMin, effectiveMax)
    return withMax
  }

  return {
    quarterPot: constrainBet(quarterPot),
    halfPot: constrainBet(halfPot),
    threequarterPot: constrainBet(threequarterPot),
    pot: constrainBet(fullPot),
    maxBet: effectiveMax,
  }
}

// ===== T-077: Side Pots =====

export interface SidePotContext {
  playerAllIn: number
  dealerStack: number
  existingPot: number
  thirdPartyAllIn?: number
}

export interface SidePotResult {
  /** Main pot all players are eligible for */
  mainPot: number
  /** Side pot for remaining players */
  sidePot: number
  /** Amount to return to player if dealer can't match */
  returnToPlayer: number
  /** Effective stack size for the hand */
  effectiveStack: number
}

/**
 * Calculate side pots for all-in situations
 */
export function calculateSidePot(context: SidePotContext): SidePotResult {
  const { playerAllIn, dealerStack, existingPot, thirdPartyAllIn } = context

  // Effective stack is the minimum that can be matched
  const effectiveStack = Math.min(playerAllIn, dealerStack)

  // If third party involved, use minimum of all three
  const effectiveStackAll = thirdPartyAllIn !== undefined
    ? Math.min(effectiveStack, thirdPartyAllIn)
    : effectiveStack

  // Handle two-player case
  if (thirdPartyAllIn === undefined) {
    if (dealerStack >= playerAllIn) {
      // Dealer can fully match - simple pot
      return {
        mainPot: existingPot + playerAllIn + playerAllIn,
        sidePot: 0,
        returnToPlayer: 0,
        effectiveStack,
      }
    } else {
      // Dealer can't fully match - return excess
      return {
        mainPot: existingPot + dealerStack + dealerStack,
        sidePot: 0,
        returnToPlayer: playerAllIn - dealerStack,
        effectiveStack,
      }
    }
  }

  // Three-way pot calculation
  const mainPotContribution = effectiveStackAll * 3
  const mainPot = existingPot + mainPotContribution

  // Side pot for players who contributed more than the minimum
  const playerExcess = playerAllIn - effectiveStackAll
  const dealerExcess = Math.min(dealerStack - effectiveStackAll, playerExcess)

  const sidePot = playerExcess > 0 && dealerExcess > 0
    ? playerExcess + dealerExcess
    : 0

  return {
    mainPot,
    sidePot,
    returnToPlayer: 0,
    effectiveStack: effectiveStackAll,
  }
}

/**
 * Get call amount for a player
 */
export function getCallAmount(currentBet: number, playerBet: number, playerStack: number): number {
  return Math.min(currentBet - playerBet, playerStack)
}

/**
 * Check if player can afford to call
 */
export function canAffordCall(currentBet: number, playerBet: number, playerStack: number): boolean {
  return playerStack > 0 || playerBet >= currentBet
}

/**
 * Check if player is all-in
 */
export function isAllIn(playerStack: number): boolean {
  return playerStack === 0
}

/**
 * Calculate raise amount from total bet
 */
export function getRaiseAmount(totalBet: number, playerBet: number): number {
  return totalBet - playerBet
}
