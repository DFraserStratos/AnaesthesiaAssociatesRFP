/**
 * Re-run something when the catalogue's records change on disk, or when the window comes back into
 * focus (a commit made in a terminal). Events that change no record (card positions, checks,
 * settings) are left out.
 */
import { useEffect, useRef } from 'react'
import type { CatalogueEvent } from '../shared/types.ts'

const RECORD_EVENTS = new Set<CatalogueEvent['kind']>(['item', 'question', 'artifact'])

export function useCatalogueRefresh(fn: () => void, active: boolean, delay = 400) {
  const latest = useRef(fn)
  latest.current = fn
  useEffect(() => {
    if (!active) return
    let t: ReturnType<typeof setTimeout> | undefined
    const later = () => {
      clearTimeout(t)
      t = setTimeout(() => latest.current(), delay)
    }
    const onEvent = (e: CatalogueEvent) => {
      if (RECORD_EVENTS.has(e.kind)) later()
    }
    const hot = import.meta.hot
    hot?.on('catalogue:changed', onEvent)
    window.addEventListener('focus', later)
    return () => {
      clearTimeout(t)
      hot?.off('catalogue:changed', onEvent)
      window.removeEventListener('focus', later)
    }
  }, [active, delay])
}
