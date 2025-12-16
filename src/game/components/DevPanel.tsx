import styles from '@/game/components/DevPanel.module.css'

export function DevPanel(props: {
  open: boolean
  dayIndex: number
  offsetDays: number
  onToggle: () => void
  onAddDayOffset: (delta: number) => void
  onEndSeason: () => void
  onResetSave: () => void
}) {
  const { open, dayIndex, offsetDays, onToggle, onAddDayOffset, onEndSeason, onResetSave } = props

  return (
    <div className={styles.wrap}>
      <button className={styles.toggle} onClick={onToggle}>
        Dev
      </button>
      {open ? (
        <div className={styles.panel}>
          <div className={styles.row}>
            <span>Season day index</span>
            <span className={styles.mono}>{dayIndex}</span>
          </div>
          <div className={styles.row}>
            <span>Day offset</span>
            <span className={styles.mono}>{offsetDays}</span>
          </div>

          <div className={styles.actions}>
            <button className={styles.btn} onClick={() => onAddDayOffset(-1)}>
              -1 Day
            </button>
            <button className={styles.btn} onClick={() => onAddDayOffset(1)}>
              +1 Day
            </button>
            <button className={styles.btn} onClick={onEndSeason}>
              End Season
            </button>
            <button className={styles.btnDanger} onClick={onResetSave}>
              Reset Save
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

