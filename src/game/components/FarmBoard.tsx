import { useMemo, useState } from 'react'
import type { Plot, PlotId, PlotStatus } from '@/game/model'
import { axialToPixel, hexPolygonPoints } from '@/game/hex'
import { TulipGlyph } from '@/ui/glyphs/TulipGlyph'
import { SimulinGlyph } from '@/ui/glyphs/SimulinGlyph'
import styles from '@/game/components/FarmBoard.module.css'
import type { BuffFx } from '@/game/logic/buffs'

const STATUS_COLORS: Record<PlotStatus, string> = {
  healthy: '#66ffb8',
  stressed: '#ffd67a',
  shortage: '#ff6b6b',
}

function getPlotStatus(plot: Plot): PlotStatus {
  const score =
    (plot.vitals.health +
      plot.vitals.water +
      plot.vitals.growth +
      plot.vitals.energy +
      plot.vitals.pest) /
    5

  if (score >= 70) return 'healthy'
  if (score >= 42) return 'stressed'
  return 'shortage'
}

export function FarmBoard(props: {
  plots: Plot[]
  selected: PlotId[]
  hexSize: number
  aura?: Record<PlotId, number>
  fx?: BuffFx[]
  chargedPlotId?: PlotId
  onToggle: (id: PlotId) => void
}) {
  const { plots, selected, hexSize, onToggle, aura, fx, chargedPlotId } = props
  const [hovered, setHovered] = useState<PlotId | null>(null)

  const geometry = useMemo(() => {
    const centers = plots.map((p) => ({ id: p.id, ...axialToPixel(p.q, p.r, hexSize) }))
    const minX = Math.min(...centers.map((c) => c.x - hexSize))
    const minY = Math.min(...centers.map((c) => c.y - hexSize))
    const maxX = Math.max(...centers.map((c) => c.x + hexSize))
    const maxY = Math.max(...centers.map((c) => c.y + hexSize))
    const padding = hexSize * 1.25
    return {
      centers,
      viewBox: `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`,
    }
  }, [plots, hexSize])

  const selectedSet = useMemo(() => new Set(selected), [selected])

  return (
    <div className={styles.wrap}>
      <svg className={styles.svg} viewBox={geometry.viewBox} role="group" aria-label="Farm hex grid">
        <defs>
          <filter id="purriaGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.9 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="hexFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="1" stopColor="rgba(0,0,0,0.22)" />
          </linearGradient>
        </defs>

        {geometry.centers.map((c) => {
          const plot = plots.find((p) => p.id === c.id)!
          const status = getPlotStatus(plot)
          const isSelected = selectedSet.has(plot.id)
          const isHovered = hovered === plot.id
          const stroke = isSelected ? STATUS_COLORS[status] : 'rgba(255,255,255,0.18)'
          const strokeWidth = isSelected ? 4 : isHovered ? 3 : 2
          const points = hexPolygonPoints(c.x, c.y, hexSize)
          const auraIntensity = aura?.[plot.id] ?? 0
          const isCharged = chargedPlotId === plot.id

          return (
            <g
              key={plot.id}
              className={styles.hex}
              onMouseEnter={() => setHovered(plot.id)}
              onMouseLeave={() => setHovered((prev) => (prev === plot.id ? null : prev))}
              onClick={() => onToggle(plot.id)}
              role="button"
              aria-label={`Plot ${plot.id}`}
            >
              {isCharged ? (
                <polygon
                  points={points}
                  fill="transparent"
                  stroke="rgba(255, 220, 120, 0.9)"
                  strokeWidth={4}
                  strokeDasharray="10 8"
                  className={styles.charged}
                />
              ) : null}
              {auraIntensity > 0 ? (
                <polygon
                  points={points}
                  fill={`rgba(120, 255, 210, ${0.12 + auraIntensity * 0.14})`}
                  stroke={`rgba(120, 255, 210, ${0.18 + auraIntensity * 0.4})`}
                  strokeWidth={2}
                  className={styles.aura}
                />
              ) : null}
              <polygon
                points={points}
                fill="url(#hexFill)"
                stroke={stroke}
                strokeWidth={strokeWidth}
                filter={isSelected ? 'url(#purriaGlow)' : undefined}
                className={isSelected ? styles.selected : undefined}
              />
              <g transform={`translate(${c.x},${c.y})`}>
                <TulipGlyph size={hexSize * 0.62} tone={status} />
              </g>
              <g transform={`translate(${c.x + hexSize * 0.48},${c.y - hexSize * 0.52})`}>
                <circle r={hexSize * 0.12} fill={STATUS_COLORS[status]} opacity={0.95} />
              </g>
              {plot.simulin ? (
                <g transform={`translate(${c.x - hexSize * 0.48},${c.y + hexSize * 0.42})`}>
                  <SimulinGlyph type={plot.simulin} size={hexSize * 0.36} />
                </g>
              ) : null}
            </g>
          )
        })}

        {(fx ?? []).map((e) => {
          const center = geometry.centers.find((c) => c.id === e.id)
          if (!center) return null
          return (
            <g key={`${e.id}:${e.atMs}`} transform={`translate(${center.x},${center.y})`} className={styles.fxGroup}>
              <circle r={hexSize * 0.62} className={styles.fxRing} />
              <text className={styles.fxText} y={-hexSize * 0.25} textAnchor="middle">
                {e.text}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
