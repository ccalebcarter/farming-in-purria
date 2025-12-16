import { gameConfig, type SimulinType } from '@/game/gameConfig'
import type { DifficultyLevel } from '@/types/ai.types'
import type { GameSaveV1 } from '@/game/save/schema'
import styles from '@/game/components/UpgradeStoreModal.module.css'

const SIMULIN_LABELS: Record<SimulinType, string> = {
  water: 'Spider (Water)',
  energy: 'Yellowjacket (Energy)',
  growth: 'Grasshopper (Growth)',
  pest: 'Ladybug (Pest Control)',
  health: 'Butterfly (Health)',
}

export function UpgradeStoreModal(props: {
  open: boolean
  save: GameSaveV1
  onClose: () => void
  updateSave: (updater: (prev: GameSaveV1) => GameSaveV1) => void
}) {
  const { open, save, onClose, updateSave } = props
  if (!open) return null

  const credits = save.player.credits
  const ops = save.progression.operations
  const simTiers = save.progression.simulinTiers
  const gifts = save.progression.npcGifts

  function buy(cost: number, apply: (prev: GameSaveV1) => GameSaveV1) {
    if (credits < cost) return
    updateSave((prev) => apply({ ...prev, player: { ...prev.player, credits: prev.player.credits - cost } }))
  }

  const selectionCost = costSelectionBonus(ops.selectionBonus)
  const radiusCost = costRadiusBonus(ops.buffRadiusBonus)

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Upgrade store">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>Upgrade Store</div>
            <div className={styles.sub}>Credits: {credits.toLocaleString()}</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Operations</div>
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemName}>Expanded Selection</div>
              <div className={styles.itemDesc}>Increase max connected plot selection.</div>
              <div className={styles.itemMeta}>
                Level {ops.selectionBonus} · Max plots: {gameConfig.selection.maxPlots + ops.selectionBonus}
              </div>
            </div>
            <div className={styles.itemAction}>
              <div className={styles.cost}>{selectionCost ? selectionCost.toLocaleString() : 'Max'}</div>
              <button
                className={styles.buyBtn}
                disabled={!selectionCost || credits < selectionCost}
                onClick={() =>
                  selectionCost &&
                  buy(selectionCost, (prev) => ({
                    ...prev,
                    progression: {
                      ...prev.progression,
                      operations: { ...prev.progression.operations, selectionBonus: prev.progression.operations.selectionBonus + 1 },
                    },
                  }))
                }
              >
                Upgrade
              </button>
            </div>
          </div>

          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemName}>Wider Buff Aura</div>
              <div className={styles.itemDesc}>Increase buff radius falloff range.</div>
              <div className={styles.itemMeta}>
                Level {ops.buffRadiusBonus} · Radius: {gameConfig.buffs.radius + ops.buffRadiusBonus}
              </div>
            </div>
            <div className={styles.itemAction}>
              <div className={styles.cost}>{radiusCost ? radiusCost.toLocaleString() : 'Max'}</div>
              <button
                className={styles.buyBtn}
                disabled={!radiusCost || credits < radiusCost}
                onClick={() =>
                  radiusCost &&
                  buy(radiusCost, (prev) => ({
                    ...prev,
                    progression: {
                      ...prev.progression,
                      operations: {
                        ...prev.progression.operations,
                        buffRadiusBonus: prev.progression.operations.buffRadiusBonus + 1,
                      },
                    },
                  }))
                }
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Simulin Tiers</div>
          <div className={styles.grid}>
            {Object.keys(simTiers).map((key) => {
              const type = key as SimulinType
              const tier = simTiers[type]
              const cost = costSimulinTier(tier)
              return (
                <div key={type} className={styles.card}>
                  <div className={styles.cardTitle}>{SIMULIN_LABELS[type]}</div>
                  <div className={styles.cardMeta}>Tier {tier} · Buff +{Math.round(tier * 12)}%</div>
                  <div className={styles.cardActions}>
                    <div className={styles.cost}>{cost ? cost.toLocaleString() : 'Max'}</div>
                    <button
                      className={styles.buyBtn}
                      disabled={!cost || credits < cost}
                      onClick={() =>
                        cost &&
                        buy(cost, (prev) => ({
                          ...prev,
                          progression: {
                            ...prev.progression,
                            simulinTiers: { ...prev.progression.simulinTiers, [type]: prev.progression.simulinTiers[type] + 1 },
                          },
                        }))
                      }
                    >
                      Upgrade
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Gifts (Contracts)</div>
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemName}>Mayor Miso</div>
              <div className={styles.itemDesc}>Unlocks Bloom contracts at gift level 1.</div>
              <div className={styles.itemMeta}>Gift level {gifts['Mayor Miso'] ?? 0}</div>
            </div>
            <div className={styles.itemAction}>
              <div className={styles.cost}>{costGift(gifts['Mayor Miso'] ?? 0).toLocaleString()}</div>
              <button
                className={styles.buyBtn}
                disabled={credits < costGift(gifts['Mayor Miso'] ?? 0)}
                onClick={() =>
                  buy(costGift(gifts['Mayor Miso'] ?? 0), (prev) => {
                    const nextGifts = { ...prev.progression.npcGifts, 'Mayor Miso': (prev.progression.npcGifts['Mayor Miso'] ?? 0) + 1 }
                    return {
                      ...prev,
                      progression: {
                        ...prev.progression,
                        npcGifts: nextGifts,
                        maxContractUnlocked: deriveMaxContractUnlocked(nextGifts, prev.progression.maxContractUnlocked),
                      },
                    }
                  })
                }
              >
                Gift
              </button>
            </div>
          </div>

          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemName}>Archivist Saffron</div>
              <div className={styles.itemDesc}>Unlocks Harvest contracts at gift level 1.</div>
              <div className={styles.itemMeta}>Gift level {gifts['Archivist Saffron'] ?? 0}</div>
            </div>
            <div className={styles.itemAction}>
              <div className={styles.cost}>{costGift(gifts['Archivist Saffron'] ?? 0).toLocaleString()}</div>
              <button
                className={styles.buyBtn}
                disabled={credits < costGift(gifts['Archivist Saffron'] ?? 0)}
                onClick={() =>
                  buy(costGift(gifts['Archivist Saffron'] ?? 0), (prev) => {
                    const nextGifts = {
                      ...prev.progression.npcGifts,
                      'Archivist Saffron': (prev.progression.npcGifts['Archivist Saffron'] ?? 0) + 1,
                    }
                    return {
                      ...prev,
                      progression: {
                        ...prev.progression,
                        npcGifts: nextGifts,
                        maxContractUnlocked: deriveMaxContractUnlocked(nextGifts, prev.progression.maxContractUnlocked),
                      },
                    }
                  })
                }
              >
                Gift
              </button>
            </div>
          </div>

          <div className={styles.hint}>
            Contract cap: <b>{save.progression.maxContractUnlocked}</b>
          </div>
        </div>
      </div>
    </div>
  )
}

function costSelectionBonus(level: number): number | null {
  const costs = [1500, 2500, 4200]
  return costs[level] ?? null
}

function costRadiusBonus(level: number): number | null {
  const costs = [1200, 2200, 3600]
  return costs[level] ?? null
}

function costSimulinTier(tier: number): number | null {
  if (tier >= 3) return null
  return 650 + tier * 650
}

function costGift(level: number): number {
  return 900 + level * 900
}

function deriveMaxContractUnlocked(
  gifts: Record<string, number>,
  fallback: DifficultyLevel
): DifficultyLevel {
  const mayor = gifts['Mayor Miso'] ?? 0
  const archivist = gifts['Archivist Saffron'] ?? 0
  if (archivist >= 1) return 'harvest'
  if (mayor >= 1) return 'bloom'
  return fallback === 'seedling' ? 'sprout' : fallback
}

