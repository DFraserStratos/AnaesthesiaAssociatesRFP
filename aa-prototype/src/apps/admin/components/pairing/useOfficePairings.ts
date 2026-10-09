/**
 * Admin hooks over the office-private slice (catch-up Phase 17). They read it
 * through `store/officePrivate.ts` and compute through the one pure helper.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../../../store'
import { selectPairingPreferences, selectPriorityTiers } from '../../../../store/officePrivate'
import { notPreferredWarning, pairingSentence, pairingsOnProfile, type NotPreferredWarning } from '../../../../domain/pairingPreferences'
import { pairingSubject, type PairingPerspective } from './perspective'

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

/**
 * A profile's History: the record itself plus every pairing entry on it,
 * active or ended, each pairing row labelled with its side sentence, so the
 * office reads who added, ended or changed what.
 */
export function useProfileHistory(perspective: PairingPerspective, recordId: string): { ids: string[]; labels: Record<string, string> } {
  const entries = usePairingEntries()
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  return useMemo(() => {
    const p = pairingsOnProfile(entries, pairingSubject(perspective, recordId))
    const pairings = [...p.notPreferred, ...p.preferred, ...p.ended]
    const labels: Record<string, string> = {}
    for (const e of pairings) {
      labels[e.id] = pairingSentence(e.kind, e.raisedBy, anaesthetists[e.anaesthetistId]?.name ?? e.anaesthetistId, surgeons[e.surgeonId]?.name ?? e.surgeonId)
    }
    return { ids: [recordId, ...pairings.map((e) => e.id)], labels }
  }, [entries, anaesthetists, surgeons, perspective, recordId])
}

export function usePriorityTiers() {
  return useAppStore(selectPriorityTiers)
}

/**
 * The candidate picker's shuffle key: `scope:suggestionSeq`, with the counter
 * bumped once each time the picker opens (`open` turning true), so reopening
 * reshuffles within a tier and a fresh Reset replays the same orders. Until
 * the bump lands, the key is the value the bump will produce (the store's
 * counter plus one), so the first render of an opening already has its final
 * order, whether the picker mounts open or is opened later; the ref keeps a
 * StrictMode double effect to one bump.
 */
export function useSuggestionKey(scope: string, open: boolean): string {
  const [bumped, setBumped] = useState<number | null>(null)
  const opened = useRef(false)
  useEffect(() => {
    if (open && !opened.current) {
      opened.current = true
      setBumped(useAppStore.getState().nextSuggestionSeq())
    }
    if (!open && opened.current) {
      opened.current = false
      setBumped(null)
    }
  }, [open])
  const seq = bumped ?? useAppStore.getState().shell.suggestionSeq + 1
  return `${scope}:${seq}`
}
