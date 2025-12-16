import type { SeasonStats } from '@/game/save/schema'
import styles from '@/game/components/SeasonSummaryModal.module.css'

export function SeasonSummaryModal(props: {
  open: boolean
  stats: SeasonStats
  onNewSeason: () => void
}) {
  const { open, stats, onNewSeason } = props
  if (!open) return null

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Season summary">
      <div className={styles.modal}>
        <div className={styles.title}>Season Complete</div>
        <div className={styles.subtitle}>42 days tallied. Your operation rolls over with a bonus.</div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Hands</div>
            <div className={styles.cardValue}>{stats.handsPlayed.toLocaleString()}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Wins</div>
            <div className={styles.cardValue}>{stats.handsWon.toLocaleString()}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Credits Δ</div>
            <div className={styles.cardValue}>{stats.creditsEarned.toLocaleString()}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Best Streak</div>
            <div className={styles.cardValue}>{stats.bestWinStreak.toLocaleString()}</div>
          </div>
        </div>

        <div className={styles.meta}>
          <div className={styles.metaRow}>
            <span>Mini triggers</span>
            <span>{stats.metaPotTriggers.mini}</span>
          </div>
          <div className={styles.metaRow}>
            <span>Major triggers</span>
            <span>{stats.metaPotTriggers.major}</span>
          </div>
          <div className={styles.metaRow}>
            <span>Grand triggers</span>
            <span>{stats.metaPotTriggers.grand}</span>
          </div>
        </div>

        <button className={styles.primaryBtn} onClick={onNewSeason}>
          Start New Season
        </button>
      </div>
    </div>
  )
}

