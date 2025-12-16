import { useEffect, useMemo, useRef, useState } from 'react'
import type { DifficultyLevel, GameContext } from '@/types/ai.types'
import type { PlayerAction } from '@/types/game.types'
import type { HandResult } from '@/types/game.types'
import type { PublicEngineState } from '@/services/poker'
import { PokerEngine } from '@/services/poker'
import { createAIDealer, type AIDealer } from '@/services/poker/ai'
import { CardView } from '@/poker/CardView'
import styles from '@/poker/PokerModal.module.css'

function createBettingConfig(stake: number, difficulty: DifficultyLevel) {
  const bigBlind = Math.max(50, Math.floor(stake))
  const smallBlind = Math.max(25, Math.floor(bigBlind / 2))
  const maxMult = difficulty === 'harvest' ? 10 : difficulty === 'bloom' ? 8 : difficulty === 'sprout' ? 6 : 4
  return {
    minBet: bigBlind,
    maxBet: bigBlind * maxMult,
    smallBlind,
    bigBlind,
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export function PokerModal(props: {
  open: boolean
  seed: number
  stake: number
  difficulty: DifficultyLevel
  onClose: () => void
  onResolved: (result: HandResult) => void
}) {
  const { open, seed, stake, difficulty, onClose, onResolved } = props
  const engineRef = useRef<PokerEngine | null>(null)
  const dealerRef = useRef<AIDealer | null>(null)
  const [engineState, setEngineState] = useState<PublicEngineState | null>(null)
  const [result, setResult] = useState<HandResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const playerActionsRef = useRef<PlayerAction[]>([])

  const betting = useMemo(() => createBettingConfig(stake, difficulty), [stake, difficulty])
  const stacks = useMemo(() => {
    const base = betting.bigBlind * 10
    return { player: Math.floor(base), dealer: Math.floor(base) }
  }, [betting.bigBlind, difficulty])

  useEffect(() => {
    if (!open) return

    const engine = new PokerEngine(betting, seed)
    const dealer = createAIDealer(difficulty, seed + 1337)
    engine.startHand(stacks.player, stacks.dealer)
    engine.deal()

    engineRef.current = engine
    dealerRef.current = dealer
    playerActionsRef.current = []
    setLog([])
    setResult(null)
    setEngineState(engine.getState())

    void settleAndMaybeAct()

    return () => {
      engineRef.current = null
      dealerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seed, betting.bigBlind, betting.smallBlind, betting.minBet, betting.maxBet, stacks.player, stacks.dealer, difficulty])

  const toCall = useMemo(() => {
    if (!engineState) return 0
    return Math.max(0, engineState.currentBet - engineState.playerBet)
  }, [engineState])

  async function settleAndMaybeAct(): Promise<void> {
    const engine = engineRef.current
    if (!engine) return

    // Resolve phase advances synchronously (no dealer input needed).
    for (let guard = 0; guard < 32; guard++) {
      const st = engine.getState()

      if (st.phase === 'showdown') {
        const hand = engine.resolveHand()
        setResult(hand)
        setEngineState(engine.getState())
        return
      }

      if (st.phase === 'fold') {
        const hand = engine.resolveHand()
        setResult(hand)
        setEngineState(engine.getState())
        return
      }

      if (engine.isBettingRoundComplete()) {
        engine.advancePhase()
        continue
      }

      break
    }

    setEngineState(engine.getState())

    if (engine.isDealerTurn()) {
      await runDealerTurn()
    }
  }

  async function runDealerTurn(): Promise<void> {
    const engine = engineRef.current
    const dealer = dealerRef.current
    if (!engine || !dealer) return
    if (!engine.isDealerTurn()) return

    setBusy(true)
    await delay(280)

    const st = engine.getState()
    const context: GameContext = {
      hand: st.dealerHand,
      community: st.communityCards,
      pot: st.pot,
      playerBet: st.playerBet,
      dealerBet: st.dealerBet,
      phase: st.phase,
      bettingRound: st.bettingRound,
      playerChips: st.playerStack,
      dealerChips: st.dealerStack,
      minBet: betting.minBet,
      maxBet: betting.maxBet,
      playerActions: playerActionsRef.current,
    }

    const decision = await dealer.decide(context)
    const attempted = decision.action
    const amount = decision.amount
    let res = engine.dealerAction(attempted, amount)
    if (!res.success) {
      res = engine.dealerAction(context.playerBet > context.dealerBet ? 'call' : 'check')
    }

    setLog((prev) => [
      ...prev,
      `Dealer: ${attempted}${typeof amount === 'number' ? ` → ${amount}` : ''}`,
    ])

    setBusy(false)
    await settleAndMaybeAct()
  }

  function runPlayerAction(action: PlayerAction): void {
    const engine = engineRef.current
    if (!engine || !engineState) return
    if (!engine.isPlayerTurn()) return
    if (busy || result) return

    playerActionsRef.current = [...playerActionsRef.current, action]
    const res = engine.playerAction(action)
    if (!res.success) {
      setLog((prev) => [...prev, `Player: ${action} (blocked)`])
      setEngineState(engine.getState())
      return
    }

    setLog((prev) => [...prev, `Player: ${action}${res.amount ? ` → ${res.amount}` : ''}`])
    void settleAndMaybeAct()
  }

  if (!open || !engineState) return null

  const isShowdown = Boolean(result) || engineState.phase === 'result'
  const revealDealer = isShowdown || engineState.phase === 'showdown'

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Texas Hold’em match">
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalTitle}>Texas Hold’em</div>
            <div className={styles.modalSub}>
              Stake: <b>{stake.toLocaleString()}</b> · Dealer: <b>{difficulty}</b>
              {busy ? <span className={styles.thinking}> · thinking…</span> : null}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close poker table">
            Close
          </button>
        </div>

        <div className={styles.table}>
          <div className={styles.dealerRow}>
            <div className={styles.label}>Dealer</div>
            <div className={styles.cards}>
              <CardView card={engineState.dealerHand[0]} hidden={!revealDealer} />
              <CardView card={engineState.dealerHand[1]} hidden={!revealDealer} />
            </div>
          </div>

          <div className={styles.community}>
            <div className={styles.label}>Community</div>
            <div className={styles.cards}>
              {Array.from({ length: 5 }).map((_, i) => (
                <CardView key={i} card={engineState.communityCards[i]} hidden={!engineState.communityCards[i]} />
              ))}
            </div>
          </div>

          <div className={styles.playerRow}>
            <div className={styles.label}>You</div>
            <div className={styles.cards}>
              <CardView card={engineState.playerHand[0]} />
              <CardView card={engineState.playerHand[1]} />
            </div>
          </div>

          <div className={styles.potBox}>
            <div className={styles.potLabel}>Pot</div>
            <div className={styles.potValue}>{engineState.pot.toLocaleString()}</div>
            <div className={styles.potSub}>
              Bet: {engineState.currentBet.toLocaleString()} · To call: {toCall.toLocaleString()}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.actionBtn}
              onClick={() => runPlayerAction('fold')}
              disabled={!engineState || busy || Boolean(result) || !engineRef.current?.isPlayerTurn()}
            >
              Fold
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => runPlayerAction('all-in')}
              disabled={!engineState || busy || Boolean(result) || !engineRef.current?.isPlayerTurn()}
            >
              All-in
            </button>
            <button
              className={styles.actionBtnPrimary}
              onClick={() => runPlayerAction(toCall > 0 ? 'call' : 'check')}
              disabled={!engineState || busy || Boolean(result) || !engineRef.current?.isPlayerTurn()}
            >
              {toCall > 0 ? `Call ${toCall.toLocaleString()}` : 'Check'}
            </button>
          </div>

          <div className={styles.log}>
            {result ? (
              <div className={styles.resultBox}>
                <div className={styles.resultTitle}>
                  {result.winner === 'player' ? 'Victory' : result.winner === 'dealer' ? 'Defeat' : 'Tie'}
                </div>
                <div className={styles.resultSub}>
                  You: {result.playerHand.name} · Dealer: {result.dealerHand.name}
                </div>
                <button className={styles.applyBtn} onClick={() => onResolved(result)}>
                  Apply Buffs & Return
                </button>
              </div>
            ) : null}
            <div className={styles.logList}>
              {log.slice(-8).map((line, i) => (
                <div key={i} className={styles.logLine}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
