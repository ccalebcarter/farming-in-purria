import type { SimulinType } from '@/game/gameConfig'

const SIMULIN_COLORS: Record<SimulinType, { fill: string; stroke: string }> = {
  energy: { fill: 'rgba(255, 220, 120, 0.95)', stroke: 'rgba(110, 70, 20, 0.9)' },
  growth: { fill: 'rgba(120, 255, 170, 0.9)', stroke: 'rgba(24, 90, 56, 0.9)' },
  water: { fill: 'rgba(120, 220, 255, 0.95)', stroke: 'rgba(18, 64, 110, 0.9)' },
  pest: { fill: 'rgba(255, 110, 110, 0.92)', stroke: 'rgba(110, 24, 24, 0.9)' },
  health: { fill: 'rgba(200, 160, 255, 0.92)', stroke: 'rgba(72, 34, 120, 0.9)' },
}

export function SimulinGlyph(props: { type: SimulinType; size: number }) {
  const { type, size } = props
  const { fill, stroke } = SIMULIN_COLORS[type]
  const s = size

  // Small “creature coin” icon with subtle type-specific silhouette.
  return (
    <g>
      <circle r={s * 0.48} fill="rgba(0,0,0,0.28)" />
      <circle r={s * 0.45} fill={fill} stroke={stroke} strokeWidth={s * 0.06} />
      {type === 'water' ? (
        <path
          d={`M 0 ${-s * 0.22} C ${s * 0.18} ${-s * 0.02}, ${s * 0.08} ${s * 0.22}, 0 ${
            s * 0.26
          } C ${-s * 0.08} ${s * 0.22}, ${-s * 0.18} ${-s * 0.02}, 0 ${-s * 0.22} Z`}
          fill="rgba(255,255,255,0.42)"
        />
      ) : null}
      {type === 'energy' ? (
        <path
          d={`M ${-s * 0.12} ${-s * 0.2} L ${s * 0.02} ${-s * 0.02} L ${-s * 0.02} ${
            -s * 0.02
          } L ${s * 0.12} ${s * 0.2} L ${-s * 0.02} ${s * 0.02} L ${s * 0.02} ${
            s * 0.02
          } Z`}
          fill="rgba(255,255,255,0.42)"
        />
      ) : null}
      {type === 'growth' ? (
        <path
          d={`M 0 ${s * 0.26} C ${-s * 0.04} ${s * 0.04}, ${-s * 0.22} ${
            -s * 0.02
          }, ${-s * 0.18} ${-s * 0.2} C ${-s * 0.06} ${-s * 0.16}, ${-s * 0.02} ${
            -s * 0.06
          }, 0 0 C ${s * 0.02} ${-s * 0.06}, ${s * 0.06} ${-s * 0.16}, ${
            s * 0.18
          } ${-s * 0.2} C ${s * 0.22} ${-s * 0.02}, ${s * 0.04} ${s * 0.04}, 0 ${
            s * 0.26
          } Z`}
          fill="rgba(255,255,255,0.36)"
        />
      ) : null}
      {type === 'pest' ? (
        <>
          <circle cx={-s * 0.12} cy={-s * 0.04} r={s * 0.06} fill="rgba(0,0,0,0.2)" />
          <circle cx={s * 0.12} cy={-s * 0.04} r={s * 0.06} fill="rgba(0,0,0,0.2)" />
          <path
            d={`M ${-s * 0.18} ${s * 0.14} C ${-s * 0.06} ${s * 0.04}, ${s * 0.06} ${
              s * 0.04
            }, ${s * 0.18} ${s * 0.14}`}
            stroke="rgba(0,0,0,0.22)"
            strokeWidth={s * 0.08}
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : null}
      {type === 'health' ? (
        <path
          d={`M 0 ${s * 0.22} C ${-s * 0.26} ${s * 0.02}, ${-s * 0.16} ${
            -s * 0.2
          }, 0 ${-s * 0.08} C ${s * 0.16} ${-s * 0.2}, ${s * 0.26} ${s * 0.02}, 0 ${
            s * 0.22
          } Z`}
          fill="rgba(255,255,255,0.36)"
        />
      ) : null}
    </g>
  )
}

