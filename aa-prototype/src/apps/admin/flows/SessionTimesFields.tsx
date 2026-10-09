/**
 * A session's start and end times (catch-up Phase 28; US-01.1.4: "Admins set
 * default start and end times for AM and PM Slots, and each Slot can
 * override"). The fields show the effective times; a hint says whether they
 * are the default or the session's own, and "Use default" clears the override.
 * Shared by Edit list and the empty-session Edit times sheet.
 */

import type { CSSProperties } from 'react'
import { accent, neutral } from '../../../theme/tokens'
import type { Session } from '../../../domain/types'
import { isWallTime } from '../../../domain/slots'
import { FieldLabel } from '../../../shared/ui'
import { assignSelectStyle } from './AssignListFields'

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
  controlStyle = assignSelectStyle,
}: {
  session: Session
  draft: TimesDraft
  defaults: TimesDraft
  onChange: (next: TimesDraft) => void
  /** The sheet's own control style, so the time inputs match its other fields. */
  controlStyle?: CSSProperties
}) {
  const isDefault = draft.startTime === defaults.startTime && draft.endTime === defaults.endTime
  return (
    <div data-shot="session-times" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Start</FieldLabel>
          <input type="time" value={draft.startTime} onChange={(e) => onChange({ ...draft, startTime: e.target.value })} style={controlStyle} />
        </label>
        <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>End</FieldLabel>
          <input type="time" value={draft.endTime} onChange={(e) => onChange({ ...draft, endTime: e.target.value })} style={controlStyle} />
        </label>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 12, color: neutral.slate }}>
        {isDefault ? (
          <span>Default {session} times ({defaults.startTime} to {defaults.endTime})</span>
        ) : (
          <>
            <span>Own times. The {session} default is {defaults.startTime} to {defaults.endTime}.</span>
            <button
              type="button"
              onClick={() => onChange({ ...defaults })}
              style={{ border: 0, padding: 0, background: 'transparent', color: accent.base, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Use default
            </button>
          </>
        )}
      </div>
    </div>
  )
}
