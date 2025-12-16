import type { Card, Suit } from '@/types/card.types'
import styles from '@/poker/PokerModal.module.css'

const SUIT_GLYPHS: Record<Suit, string> = {
  spades: '♠',
  clubs: '♣',
  hearts: '♥',
  diamonds: '♦',
}

function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds'
}

export function CardView(props: { card?: Card; hidden?: boolean; label?: string }) {
  const { card, hidden, label } = props
  const face = !hidden && card

  return (
    <div className={`${styles.card} ${hidden ? styles.cardBack : ''}`}>
      {label ? <div className={styles.cardLabel}>{label}</div> : null}
      {face ? (
        <>
          <div className={`${styles.cardCorner} ${isRed(face.suit) ? styles.red : styles.black}`}>
            <div>{face.rank}</div>
            <div className={styles.suit}>{SUIT_GLYPHS[face.suit]}</div>
          </div>
          <div className={`${styles.cardCenter} ${isRed(face.suit) ? styles.red : styles.black}`}>
            {SUIT_GLYPHS[face.suit]}
          </div>
        </>
      ) : (
        <div className={styles.cardBackInner} />
      )}
    </div>
  )
}

