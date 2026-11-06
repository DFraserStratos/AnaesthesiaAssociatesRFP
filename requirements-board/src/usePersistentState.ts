/**
 * A view preference kept per browser in localStorage: read once, written on every change. Storage
 * that is blocked (a private window) or holds something unexpected falls back to the default, and
 * a pick then lasts until the page closes.
 */
import { useCallback, useState } from 'react'

export function usePersistentState<T extends string>(key: string, fallback: T, allowed: readonly T[]): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const v = localStorage.getItem(key)
      return allowed.includes(v as T) ? (v as T) : fallback
    } catch {
      return fallback
    }
  })
  const set = useCallback(
    (v: T) => {
      setValue(v)
      try {
        localStorage.setItem(key, v)
      } catch {
        // storage blocked: the pick lasts until the page closes
      }
    },
    [key],
  )
  return [value, set]
}
