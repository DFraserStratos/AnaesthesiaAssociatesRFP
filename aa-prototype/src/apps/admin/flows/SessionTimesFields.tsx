/**
 * A session's start and end times (catch-up Phase 28; US-01.1.4: "Admins set
 * default start and end times for AM and PM Slots, and each Slot can
 * override"). The fields show the effective times; a hint says whether they
 * are the default or the session's own, and "Use default" clears the override.
 * Shared by Edit list and the empty-session Edit times sheet. Built on the
 * shared `TimeRangeFields` since UI unification U4 (48px, the one focus ring).
 */

import type { Session } from '../../../domain/types'
import { isWallTime } from '../../../domain/slots'
import { TextAction, TimeRangeFields } from '../../../shared/ui'
import { sessionText } from '../../../domain/outOfHours'

export interface TimesDraft {
  startTime: string
  endTime: string
}

/** The inline error for a times draft, or null (both times set, start before end). */
export function timesDraftError(draft: TimesDraft): string | null {
  if (!isWallTime(draft.startTime) || !isWallTime(draft.endTime)) return 'Enter a start and an end time.'
  if (!(draft.startTime < draft.endTime)) return 'The start time must be before the end time.'
  return null
}

/** The setSlotTimes patch for a draft: an override only where it differs from the default; empty clears. */
export function timesPatch(draft: TimesDraft, defaults: TimesDraft): { startTime: string; endTime: string } {
  return {
    startTime: draft.startTime === defaults.startTime ? '' : draft.startTime,
    endTime: draft.endTime === defaults.endTime ? '' : draft.endTime,
  }
}

export function SessionTimesFields({
  session,
  draft,
  defaults,
  onChange,
}: {
  session: Session
  draft: TimesDraft
  defaults: TimesDraft
  onChange: (next: TimesDraft) => void
}) {
  const isDefault = draft.startTime === defaults.startTime && draft.endTime === defaults.endTime
  return (
    <TimeRangeFields
      shot="session-times"
      value={{ start: draft.startTime, end: draft.endTime }}
      onChange={(next) => onChange({ startTime: next.start, endTime: next.end })}
      hint={
        isDefault ? (
          <span>Default {sessionText(session)} times ({defaults.startTime} to {defaults.endTime})</span>
        ) : (
          <>
            <span>Own times. The {sessionText(session)} default is {defaults.startTime} to {defaults.endTime}.</span>
            <TextAction size="sm" flush onClick={() => onChange({ ...defaults })}>
              Use default
            </TextAction>
          </>
        )
      }
    />
  )
}
