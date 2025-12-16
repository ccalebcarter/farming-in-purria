import { createNewGameSave, isGameSaveV1, type GameSaveV1 } from '@/game/save/schema'

const STORAGE_KEY = 'farming-in-purria.save.v1'

export function loadGameSave(): GameSaveV1 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createNewGameSave(Date.now())
    const parsed = JSON.parse(raw) as unknown
    if (isGameSaveV1(parsed)) return parsed
    return createNewGameSave(Date.now())
  } catch {
    return createNewGameSave(Date.now())
  }
}

export function persistGameSave(save: GameSaveV1): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save))
}

export function resetGameSave(): GameSaveV1 {
  const next = createNewGameSave(Date.now())
  persistGameSave(next)
  return next
}

