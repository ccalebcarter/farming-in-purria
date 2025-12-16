import type { SimulinType } from '@/game/gameConfig'

export type PlotId = `${number},${number}`

export type PlotStatus = 'healthy' | 'stressed' | 'shortage'

export interface PlotVitals {
  water: number
  growth: number
  energy: number
  pest: number
  health: number
}

export interface Plot {
  id: PlotId
  q: number
  r: number
  vitals: PlotVitals
  simulin?: SimulinType
  buff: {
    water: number
    growth: number
    energy: number
    pest: number
    health: number
  }
  lastBuffAtMs?: number
}

export interface AxialCoord {
  q: number
  r: number
}

export function plotId(q: number, r: number): PlotId {
  return `${q},${r}`
}

export function parsePlotId(id: PlotId): AxialCoord {
  const [q, r] = id.split(',').map(Number)
  return { q, r }
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

