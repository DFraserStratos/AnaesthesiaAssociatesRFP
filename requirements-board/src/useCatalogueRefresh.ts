/**
 * Re-run something when the catalogue's records change on disk, or when the window comes back into
 * focus (a commit made in a terminal). A delivery that changes no record (card positions, checks,
 * settings, screenshot versions) is left out.
 */
import { useEffect, useRef } from 'react'
import { changesRecords } from '../shared/delivery.ts'
import type { CatalogueDelivery } from '../shared/types.ts'

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
    const onEvent = (d: CatalogueDelivery) => {
      if (changesRecords(d)) later()
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
