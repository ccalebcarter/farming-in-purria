import { useEffect, useRef, useState } from 'react'
import { loadGameSave, persistGameSave } from '@/game/save/storage'
import type { GameSaveV1 } from '@/game/save/schema'

export function useGameSave(): [GameSaveV1, (updater: (prev: GameSaveV1) => GameSaveV1) => void] {
  const [save, setSave] = useState<GameSaveV1>(() => loadGameSave())
  const saveRef = useRef(save)
  saveRef.current = save

  useEffect(() => {
    const t = window.setTimeout(() => persistGameSave(saveRef.current), 150)
    return () => window.clearTimeout(t)
  }, [save])

  function update(updater: (prev: GameSaveV1) => GameSaveV1) {
    setSave((prev) => {
      const next = updater(prev)
      return { ...next, updatedAtMs: Date.now() }
    })
  }

  return [save, update]
}

