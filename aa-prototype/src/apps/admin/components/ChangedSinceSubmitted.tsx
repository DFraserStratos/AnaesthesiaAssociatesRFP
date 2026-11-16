/**
 * The "Changed since submitted" cue (catch-up Phase 38a; US-07.2.1, US-07.2.3):
 * the anaesthetist can still change a submitted List until the office
 * authorises it, and the office sees those changes at review. A quiet outlined
 * pill (not a status colour, not an action): the count, and when the last one
 * was made. Reads `changedSinceSubmitted`, so it ends at authorise.
 */

import { useMemo } from 'react'
import { PenLine } from 'lucide-react'
import { Pill } from '../../../shared/ui/Pill'
import { changedSinceSubmitted, useAppStore, type ChangedSinceSubmitted } from '../../../store'
import { dayWithYear, hhmm, plural } from '../../../shared/format'

/** The cue for one List, memoised over the records it reads. */
export function useChangedSinceSubmitted(listId: string | undefined): ChangedSinceSubmitted | null {
  const schedule = useAppStore((s) => s.schedule)
  const audit = useAppStore((s) => s.audit)
  const masters = useAppStore((s) => s.masters)
  return useMemo(
    () => (listId === undefined ? null : changedSinceSubmitted({ schedule, audit, masters }, listId)),
    [schedule, audit, masters, listId],
  )
}

export function ChangedSinceSubmittedPill({ cue }: { cue: ChangedSinceSubmitted }) {
  const changes = plural(cue.count, 'change')
  return (
    <Pill
      tone="warning"
      variant="outline"
      size="lg"
      shot="review-changed-since-submitted"
      title={`${changes} by the anaesthetist since the List was submitted, the last on ${dayWithYear(cue.lastAtISO)} at ${hhmm(cue.lastAtISO)}`}
      leading={<PenLine size={12} strokeWidth={2.4} aria-hidden />}
    >
      Changed since submitted · <span className="mono">{cue.count}</span>
    </Pill>
  )
}
