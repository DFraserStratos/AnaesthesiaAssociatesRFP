/**
 * The "Changed since submitted" cue (catch-up Phase 38a; US-07.2.1, US-07.2.3):
 * the anaesthetist can still change a submitted List until the office
 * authorises it, and the office sees those changes at review. A quiet outlined
 * pill (not a status colour, not an action): the count, and when the last one
 * was made. Reads `changedSinceSubmitted`, so it ends at authorise.
 */

import { useMemo } from 'react'
import { PenLine } from 'lucide-react'
import { neutral, semantic } from '../../../theme/tokens'
import { changedSinceSubmitted, useAppStore, type ChangedSinceSubmitted } from '../../../store'
import { dayWithYear, hhmm } from '../../../shared/format'

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
  const changes = `${cue.count} change${cue.count === 1 ? '' : 's'}`
  return (
    <span
      data-shot="review-changed-since-submitted"
      title={`${changes} by the anaesthetist since the List was submitted, the last on ${dayWithYear(cue.lastAtISO)} at ${hhmm(cue.lastAtISO)}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 12,
        fontWeight: 600,
        color: semantic.warning.onTint,
        background: neutral.surface,
        border: `1px solid ${semantic.warning.solid}66`,
        borderRadius: 999,
        padding: '3px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      <PenLine size={12} strokeWidth={2.4} aria-hidden />
      Changed since submitted · <span className="mono">{cue.count}</span>
    </span>
  )
}
