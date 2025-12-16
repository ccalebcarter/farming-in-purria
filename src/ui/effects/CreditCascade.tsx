import styles from '@/ui/effects/CreditCascade.module.css'
import type { MetaPotTier } from '@/game/gameConfig'

export interface CreditCascadeEvent {
  id: string
  tier: MetaPotTier
  amount: number
  atMs: number
}

function createRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return (s % 10000) / 10000
  }
}

const COIN_COUNT: Record<MetaPotTier, number> = {
  mini: 14,
  major: 22,
  grand: 32,
}

export function CreditCascade(props: { events: CreditCascadeEvent[] }) {
  const { events } = props
  if (events.length === 0) return null

  return (
    <div className={styles.wrap} aria-hidden="true">
      {events.flatMap((e) => {
        const rand = createRng(e.atMs + e.amount)
        const count = COIN_COUNT[e.tier]
        return Array.from({ length: count }).map((_, i) => {
          const left = Math.round(rand() * 100)
          const delay = rand() * 0.45 + i * 0.01
          const size = 10 + rand() * 14
          const drift = (rand() - 0.5) * 120
          return (
            <span
              key={`${e.id}:${i}`}
              className={`${styles.coin} ${styles[e.tier]}`}
              style={{
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${delay}s`,
                ['--drift' as never]: `${drift}px`,
              }}
            />
          )
        })
      })}
    </div>
  )
}

