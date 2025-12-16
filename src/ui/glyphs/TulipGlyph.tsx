export function TulipGlyph(props: { size: number; tone: 'healthy' | 'stressed' | 'shortage' }) {
  const { size, tone } = props
  const scale = size / 100
  const fill =
    tone === 'healthy'
      ? 'rgba(255, 120, 165, 0.95)'
      : tone === 'stressed'
        ? 'rgba(255, 175, 120, 0.95)'
        : 'rgba(255, 95, 120, 0.95)'

  const leaf = 'rgba(120, 255, 190, 0.55)'

  return (
    <g transform={`scale(${scale}) translate(-50 -58)`} opacity={0.96}>
      <path
        d="M50 58c-6 0-12-6-14-13-2-7 1-16 7-22 3-3 5-7 7-11 2 4 4 8 7 11 6 6 9 15 7 22-2 7-8 13-14 13Z"
        fill={fill}
      />
      <path
        d="M36 30c3-10 9-18 14-24 5 6 11 14 14 24-3-3-7-5-14-5s-11 2-14 5Z"
        fill="rgba(255,255,255,0.14)"
      />
      <path d="M50 58c0 20-5 30-5 30h10s-5-10-5-30Z" fill="rgba(255,255,255,0.12)" />
      <path d="M45 72c-10-2-18-9-22-18 12 2 20 8 22 18Z" fill={leaf} />
      <path d="M55 72c10-2 18-9 22-18-12 2-20 8-22 18Z" fill={leaf} />
    </g>
  )
}

