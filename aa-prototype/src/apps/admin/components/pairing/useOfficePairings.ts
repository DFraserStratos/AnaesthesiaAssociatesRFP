/**
 * Admin hooks over the office-private slice (catch-up Phase 17). They read it
 * through `store/officePrivate.ts` and compute through the one pure helper.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../../../store'
import { selectPairingPreferences, selectPriorityTiers } from '../../../../store/officePrivate'
import { notPreferredWarning, type NotPreferredWarning } from '../../../../domain/pairingPreferences'

/** The soft warning for a pair, or null (preferred and clear pairs never warn). */
export function useNotPreferredWarning(anaesthetistId: string | undefined, surgeonId: string | undefined | null): NotPreferredWarning | null {
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const entries = useAppStore(selectPairingPreferences)
  return useMemo(
    () => notPreferredWarning({ anaesthetists, surgeons }, entries, anaesthetistId, surgeonId),
    [anaesthetists, surgeons, entries, anaesthetistId, surgeonId],
  )
}

export function usePairingEntries() {
  return useAppStore(selectPairingPreferences)
}

export function usePriorityTiers() {
  return useAppStore(selectPriorityTiers)
}

/**
 * The candidate picker's shuffle key: `scope:suggestionSeq`, with the counter
 * bumped once each time the picker opens (`open` turning true), so reopening
 * reshuffles within a tier and a fresh Reset replays the same orders. The
 * first render already uses the value the bump will produce, so the order
 * never flickers; the ref keeps a StrictMode double effect to one bump.
 */
export function useSuggestionKey(scope: string, open: boolean): string {
  const [seq, setSeq] = useState(() => useAppStore.getState().shell.suggestionSeq + (open ? 1 : 0))
  const opened = useRef(false)
  useEffect(() => {
    if (open && !opened.current) {
      opened.current = true
      setSeq(useAppStore.getState().nextSuggestionSeq())
    }
    if (!open) opened.current = false
  }, [open])
  return `${scope}:${seq}`
}
