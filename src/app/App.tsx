import { useEffect, useMemo, useRef, useState } from 'react'
import styles from '@/app/App.module.css'
import { FarmBoard } from '@/game/components/FarmBoard'
import { gameConfig } from '@/game/gameConfig'
import { toggleConnectedSelection } from '@/game/logic/selection'
import type { PlotId } from '@/game/model'
import { PokerModal } from '@/poker/PokerModal'
import type { DifficultyLevel } from '@/types/ai.types'
import { applyBuffsFromMatch, type BuffFx } from '@/game/logic/buffs'
import { useGameSave } from '@/game/save/useGameSave'
import { computeNowMs, computeSeasonDayIndex, rollToDay } from '@/game/logic/season'
import { resolveMatchRewards } from '@/game/logic/rewards'
import { CreditCascade, type CreditCascadeEvent } from '@/ui/effects/CreditCascade'
import { SeasonSummaryModal } from '@/game/components/SeasonSummaryModal'
import { startNewSeason } from '@/game/logic/reset'
import { DevPanel } from '@/game/components/DevPanel'
import { resetGameSave } from '@/game/save/storage'
import { UpgradeStoreModal } from '@/game/components/UpgradeStoreModal'

export function App() {
  const [save, updateSave] = useGameSave()

  const nowMs = computeNowMs(save)
  const computedDayIndex = computeSeasonDayIndex(save, nowMs)
  const seasonDayDisplay = Math.min(save.season.dayIndex + 1, gameConfig.season.lengthDays)
  const seasonLabel = `Day ${seasonDayDisplay}/${gameConfig.season.lengthDays}`

  const plots = save.farm.plots
  const plotIdSet = useMemo(() => new Set(plots.map((p) => p.id)), [plots])
  const [selection, setSelection] = useState<PlotId[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [buffAura, setBuffAura] = useState<Record<PlotId, number> | null>(null)
  const [buffFx, setBuffFx] = useState<BuffFx[]>([])
  const [cascadeEvents, setCascadeEvents] = useState<CreditCascadeEvent[]>([])
  const [devOpen, setDevOpen] = useState(false)
  const [storeOpen, setStoreOpen] = useState(false)
  const [poker, setPoker] = useState<{
    open: boolean
    seed: number
    stake: number
    difficulty: DifficultyLevel
    selection: PlotId[]
  } | null>(null)

  const timeoutsRef = useRef<{ toast?: number; fx?: number; cascade?: number }>({})

  const dailyModifier = useMemo(() => {
    return (
      gameConfig.daily.modifiers.find((m) => m.id === save.daily.modifierId) ??
      gameConfig.daily.modifiers[0]
    )
  }, [save.daily.modifierId])

  useEffect(() => {
    const rolled = rollToDay({ save, targetDayIndex: computedDayIndex, nowMs })
    if (rolled.save === save) return
    updateSave(() => rolled.save)
    if (rolled.messages.length > 0) showToast(rolled.messages[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedDayIndex])

  const stake = useMemo(() => {
    const count = selection.length
    return gameConfig.poker.stake.base + count * gameConfig.poker.stake.perPlot
  }, [selection.length])

  const maxSelection = useMemo(() => {
    return gameConfig.selection.maxPlots + save.progression.operations.selectionBonus
  }, [save.progression.operations.selectionBonus])

  const difficulty = useMemo(() => {
    const cappedCount = Math.max(1, Math.min(selection.length, Math.max(1, maxSelection))) as
      | 1
      | 2
      | 3
      | 4
      | 5
      | 6
      | 7
    const desired = gameConfig.poker.difficultyBySelectionCount[cappedCount]
    return capDifficulty(desired, save.progression.maxContractUnlocked)
  }, [selection.length, maxSelection, save.progression.maxContractUnlocked])

  function showToast(message: string) {
    setToast(message)
    if (timeoutsRef.current.toast) window.clearTimeout(timeoutsRef.current.toast)
    timeoutsRef.current.toast = window.setTimeout(() => setToast(null), 1700)
  }

  return (
    <div className={styles.app}>
      <div className={styles.backdrop} />
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandMark} aria-hidden="true" />
          <div>
            <div className={styles.title}>Farming in Purria</div>
            <div className={styles.subtitle}>
              {seasonLabel} · {dailyModifier.name}
            </div>
          </div>
        </div>
        <div className={styles.topStats}>
          <div className={styles.statPill}>
            <span className={styles.statLabel}>Tulip Bulbs</span>
            <span className={styles.statValue}>{save.player.tulipBulbs.toLocaleString()}</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statLabel}>Tulip Credits</span>
            <span className={styles.statValue}>{save.player.credits.toLocaleString()}</span>
          </div>
          <button className={styles.statPillBtn} onClick={() => setStoreOpen(true)}>
            Upgrades
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.boardShell}>
          <div className={styles.boardArea}>
            <FarmBoard
              plots={plots}
              selected={selection}
              hexSize={gameConfig.grid.hexSize}
              aura={buffAura ?? undefined}
              fx={buffFx}
              chargedPlotId={save.daily.mysteryPlotId}
              onToggle={(id) => {
                const result = toggleConnectedSelection({
                  current: selection,
                  id,
                  max: maxSelection,
                  exists: (p) => plotIdSet.has(p),
                })
                setSelection(result.next)
                if (result.reason === 'max') showToast(`Select up to ${maxSelection} connected plots.`)
                if (result.reason === 'not-adjacent') showToast('Selection must stay connected.')
                if (result.reason === 'disconnected') showToast('Disconnected plots were dropped.')
              }}
            />
            <div className={styles.bottomBar}>
              <div className={styles.potDisplay}>
                <div className={styles.potLabel}>Bet Pot</div>
                <div className={styles.potValue}>{stake.toLocaleString()}</div>
                <div className={styles.potSub}>
                  {selection.length === 0
                    ? `Select connected plots (max ${maxSelection})`
                    : `Difficulty: ${difficulty} · Streak: ${save.streaks.winStreak}`}
                </div>
              </div>
              <button
                className={styles.primaryBtn}
                disabled={selection.length === 0 || save.season.ended || save.player.credits < stake}
                onClick={() => {
                  if (save.season.ended) {
                    showToast('Season ended — view summary to reset.')
                    return
                  }
                  if (save.player.credits < stake) {
                    showToast('Not enough credits for this stake.')
                    return
                  }

                  const nextSeed =
                    save.seed +
                    save.season.dayIndex * 131 +
                    save.poker.handIndex * 9973 +
                    hashSelection(selection)

                  updateSave((prev) => ({
                    ...prev,
                    poker: { ...prev.poker, handIndex: prev.poker.handIndex + 1 },
                  }))

                  setPoker({
                    open: true,
                    seed: nextSeed,
                    stake,
                    difficulty,
                    selection: [...selection],
                  })
                }}
              >
                Start Hold'em
              </button>
            </div>
            {toast ? <div className={styles.toast}>{toast}</div> : null}
          </div>
        </div>

        <aside className={styles.sidebar}>
          <section className={styles.panel}>
            <div className={styles.panelTitle}>Meta-Pots</div>
            <div className={styles.metaPots}>
              <div className={styles.metaPot}>
                <div className={styles.metaLabel}>Mini</div>
                <div className={styles.metaMeter}>
                  <div
                    className={styles.metaFill}
                    style={{
                      width: `${Math.min(
                        100,
                        (save.metaPots.mini.amount / gameConfig.metaPots.mini.threshold) * 100
                      ).toFixed(1)}%`,
                    }}
                  />
                </div>
                <div className={styles.metaValue}>
                  {save.metaPots.mini.amount.toLocaleString()} / {gameConfig.metaPots.mini.threshold.toLocaleString()}
                </div>
              </div>
              <div className={styles.metaPot}>
                <div className={styles.metaLabel}>Major</div>
                <div className={styles.metaMeter}>
                  <div
                    className={styles.metaFill}
                    style={{
                      width: `${Math.min(
                        100,
                        (save.metaPots.major.amount / gameConfig.metaPots.major.threshold) * 100
                      ).toFixed(1)}%`,
                    }}
                  />
                </div>
                <div className={styles.metaValue}>
                  {save.metaPots.major.amount.toLocaleString()} / {gameConfig.metaPots.major.threshold.toLocaleString()}
                </div>
              </div>
              <div className={styles.metaPot}>
                <div className={styles.metaLabel}>Grand</div>
                <div className={styles.metaMeter}>
                  <div
                    className={styles.metaFill}
                    style={{
                      width: `${Math.min(
                        100,
                        (save.metaPots.grand.amount / gameConfig.metaPots.grand.threshold) * 100
                      ).toFixed(1)}%`,
                    }}
                  />
                </div>
                <div className={styles.metaValue}>
                  {save.metaPots.grand.amount.toLocaleString()} / {gameConfig.metaPots.grand.threshold.toLocaleString()}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelTitle}>Rewards</div>
            <div className={styles.rewardList}>
              <div className={styles.rewardRow}>
                <span>Daily</span>
                <span className={styles.rewardPct}>{dailyModifier.blurb}</span>
              </div>
              <div className={styles.rewardRow}>
                <span>Login Streak</span>
                <span className={styles.rewardPct}>{save.streaks.dailyLoginStreak}d</span>
              </div>
              <div className={styles.rewardRow}>
                <span>Contract Cap</span>
                <span className={styles.rewardPct}>{save.progression.maxContractUnlocked}</span>
              </div>
              <div className={styles.rewardRow}>
                <span>Water</span>
                <span className={styles.rewardPct}>+20%</span>
              </div>
              <div className={styles.rewardRow}>
                <span>Sun</span>
                <span className={styles.rewardPct}>+15%</span>
              </div>
              <div className={styles.rewardRow}>
                <span>Pest</span>
                <span className={styles.rewardPct}>+25%</span>
              </div>
              <div className={styles.rewardRow}>
                <span>Growth</span>
                <span className={styles.rewardPct}>+15%</span>
              </div>
            </div>
          </section>
        </aside>
      </main>

      <SeasonSummaryModal
        open={save.season.ended}
        stats={save.season.stats}
        onNewSeason={() => {
          const { next, bonus } = startNewSeason(save, nowMs)
          updateSave(() => next)
          setSelection([])
          setBuffAura(null)
          setBuffFx([])
          setPoker(null)
          showToast(bonus > 0 ? `Season bonus +${bonus.toLocaleString()} credits` : 'New season started')
        }}
      />

      <UpgradeStoreModal
        open={storeOpen}
        save={save}
        updateSave={updateSave}
        onClose={() => setStoreOpen(false)}
      />

      <PokerModal
        open={Boolean(poker?.open)}
        seed={poker?.seed ?? save.seed}
        stake={poker?.stake ?? stake}
        difficulty={poker?.difficulty ?? difficulty}
        onClose={() => setPoker(null)}
        onResolved={(hand) => {
          const didWin = hand.winner === 'player'
          const resolvedAtMs = nowMs
          const selected = poker?.selection ?? selection
          const effectiveStake = poker?.stake ?? stake

          const primary = pickPrimarySimulinFromSelection(plots, selected)
          const simulinTier = save.progression.simulinTiers[primary] ?? 0
          const simulinMult = 1 + simulinTier * 0.12
          const dailyFocusMult = dailyModifier.focus === primary ? 1.15 : 1

          const rewardResolution = resolveMatchRewards({
            save,
            hand,
            stake: effectiveStake,
            selection: selected,
          })

          const winBoost = didWin ? rewardResolution.streakMultiplier : 1
          const rarityBoost = rewardResolution.isRareHand ? 1.08 : 1
          const mysteryBoost = rewardResolution.isMysteryHit ? 1.12 : 1
          const magnitudeMultiplier = simulinMult * dailyFocusMult * winBoost * rarityBoost * mysteryBoost

          const applied = applyBuffsFromMatch({
            plots,
            selected,
            didWin,
            nowMs: resolvedAtMs,
            tuning: {
              radius: gameConfig.buffs.radius + save.progression.operations.buffRadiusBonus,
              magnitudeMultiplier,
            },
          })

          updateSave(() => ({
            ...rewardResolution.save,
            farm: { ...rewardResolution.save.farm, plots: applied.plots },
          }))

          setSelection([])
          setBuffAura(applied.aura)
          setBuffFx(applied.fx)

          if (rewardResolution.messages.length > 0) {
            showToast(rewardResolution.messages[0])
          } else if (!didWin && hand.winner !== 'tie') {
            showToast(`Stake lost: ${effectiveStake.toLocaleString()}`)
          } else {
            const delta = rewardResolution.creditDelta
            showToast(delta >= 0 ? `Credits +${delta.toLocaleString()}` : `Credits ${delta.toLocaleString()}`)
          }

          if (rewardResolution.metaPotTriggers.length > 0) {
            const events: CreditCascadeEvent[] = rewardResolution.metaPotTriggers.map((t, i) => ({
              id: `${resolvedAtMs}:${t.tier}:${i}`,
              tier: t.tier,
              amount: t.amount,
              atMs: resolvedAtMs + i * 35,
            }))
            setCascadeEvents(events)
            if (timeoutsRef.current.cascade) window.clearTimeout(timeoutsRef.current.cascade)
            timeoutsRef.current.cascade = window.setTimeout(() => setCascadeEvents([]), 1450)
          }

          if (timeoutsRef.current.fx) window.clearTimeout(timeoutsRef.current.fx)
          timeoutsRef.current.fx = window.setTimeout(() => {
            setBuffAura(null)
            setBuffFx([])
          }, 1250)

          setPoker(null)
        }}
      />

      <CreditCascade events={cascadeEvents} />

      <DevPanel
        open={devOpen}
        dayIndex={save.season.dayIndex}
        offsetDays={save.dev.dayOffsetDays}
        onToggle={() => setDevOpen((v) => !v)}
        onAddDayOffset={(delta) =>
          updateSave((prev) => ({
            ...prev,
            dev: { ...prev.dev, dayOffsetDays: prev.dev.dayOffsetDays + delta },
          }))
        }
        onEndSeason={() =>
          updateSave((prev) => ({
            ...prev,
            season: { ...prev.season, dayIndex: gameConfig.season.lengthDays, ended: true },
          }))
        }
        onResetSave={() => {
          setSelection([])
          setBuffAura(null)
          setBuffFx([])
          setPoker(null)
          updateSave(() => resetGameSave())
        }}
      />
    </div>
  )
}

function capDifficulty(desired: DifficultyLevel, maxUnlocked: DifficultyLevel): DifficultyLevel {
  const order: DifficultyLevel[] = ['seedling', 'sprout', 'bloom', 'harvest']
  const desiredIdx = order.indexOf(desired)
  const maxIdx = order.indexOf(maxUnlocked)
  return order[Math.min(desiredIdx, maxIdx)] ?? 'seedling'
}

function pickPrimarySimulinFromSelection(
  plots: { id: PlotId; simulin?: string }[],
  selected: PlotId[]
): 'energy' | 'growth' | 'water' | 'pest' | 'health' {
  const counts = new Map<string, number>()
  const byId = new Map(plots.map((p) => [p.id, p] as const))

  for (const id of selected) {
    const sim = byId.get(id)?.simulin
    if (!sim) continue
    counts.set(sim, (counts.get(sim) ?? 0) + 1)
  }

  const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  return (entries[0]?.[0] as 'energy' | 'growth' | 'water' | 'pest' | 'health') ?? 'health'
}

function hashSelection(ids: PlotId[]): number {
  let h = 2166136261
  for (const id of ids) {
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
  }
  return h >>> 0
}
