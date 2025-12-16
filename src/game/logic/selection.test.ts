import { describe, expect, it } from 'vitest'
import { toggleConnectedSelection } from '@/game/logic/selection'
import type { PlotId } from '@/game/model'

describe('toggleConnectedSelection', () => {
  const exists = (_: PlotId) => true

  it('adds first plot', () => {
    const r = toggleConnectedSelection({ current: [], id: '0,0', max: 5, exists })
    expect(r.next).toEqual(['0,0'])
  })

  it('rejects non-adjacent additions', () => {
    const r = toggleConnectedSelection({ current: ['0,0'], id: '2,0', max: 5, exists })
    expect(r.reason).toBe('not-adjacent')
    expect(r.next).toEqual(['0,0'])
  })

  it('drops disconnected tiles after removal', () => {
    const current: PlotId[] = ['0,0', '1,0', '2,0']
    const r = toggleConnectedSelection({ current, id: '1,0', max: 5, exists })
    expect(r.reason).toBe('disconnected')
    expect(r.next).toEqual(['0,0'])
    expect(r.dropped).toEqual(['2,0'])
  })

  it('enforces max selection', () => {
    const r = toggleConnectedSelection({ current: ['0,0', '1,0'], id: '2,0', max: 2, exists })
    expect(r.reason).toBe('max')
    expect(r.next).toEqual(['0,0', '1,0'])
  })
})

