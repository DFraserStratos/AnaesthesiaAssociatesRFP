import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronLeft } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'
import type { Actor } from '../../store'
import { AvailabilityForm, ResultLine, type AvailabilityFormInitial } from './AvailabilityForm'
import { AvailabilitySlotPanel, type ChangeRequest } from './AvailabilitySlotPanel'
import { useAvailabilityBounds, useAvailabilityDay } from './useAvailability'

interface AvailabilityEditorProps {
  actor: Actor
  anaesthetistId: string
  /** The tapped day, or the first day of a selected range. */
  fromISO: string
  /** The last day of a selected range (web shift-click); a range opens straight on the form. */
  toISO?: string
  /** Open straight on the form with these presets ("Add days off"). */
  formPreset?: Omit<AvailabilityFormInitial, 'fromISO'>
  /** After any save or removal, with the result line. */
  onResult?: (line: string) => void
  /** Hooks for capture recipes and tests. */
  shot?: string
  /** A sheet host's close: shows "Done" once something is saved. */
  onDone?: () => void
}

/**
 * A day's sessions, then the form (catch-up Phase 29): the one editor both
 * apps host, mobile in a bottom sheet and web in the right rail, so they do
 * the same things through the same store actions (US-03.1.4). A single day
 * opens on the session panel; a range or "Add days off" opens on the form.
 */
export function AvailabilityEditor({ actor, anaesthetistId, fromISO, toISO, formPreset, onResult, shot, onDone }: AvailabilityEditorProps) {
  const { todayISO } = useAvailabilityBounds()
  const day = useAvailabilityDay(anaesthetistId, fromISO)
  const range = toISO !== undefined && toISO !== fromISO
  const [request, setRequest] = useState<ChangeRequest | null>(range || formPreset !== undefined ? { sessions: formPreset?.sessions ?? 'both' } : null)
  const [line, setLine] = useState<string | null>(null)

  const title = range
    ? `${format(parseISO(fromISO), 'EEE d MMM')} to ${format(parseISO(toISO ?? fromISO), 'EEE d MMM')}`
    : format(parseISO(fromISO), 'EEEE d MMMM')

  function result(text: string) {
    setLine(text)
    onResult?.(text)
  }

  return (
    <div data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {request !== null && !range && formPreset === undefined && (
          <button type="button" aria-label="Back to the sessions" onClick={() => { setRequest(null); setLine(null) }} style={{ width: 32, height: 32, borderRadius: 999, border: `1px solid ${neutral.line}`, background: neutral.surface, color: accent.pressed, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
            <ChevronLeft size={16} aria-hidden />
          </button>
        )}
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: neutral.ink }}>{formPreset !== undefined ? 'Add days off' : title}</div>
          <div style={{ fontSize: 12.5, color: neutral.mist }}>
            {request === null ? 'Your AM and PM sessions' : request.instance === true ? 'Change this one only; the series carries on' : 'Set a status for these sessions'}
          </div>
        </div>
      </div>
      {request === null && day !== undefined ? (
        <>
          <AvailabilitySlotPanel actor={actor} day={day} todayISO={todayISO} onChange={(r) => { setLine(null); setRequest(r) }} onResult={result} />
          <ResultLine line={line} />
        </>
      ) : (
        <AvailabilityForm
          key={`${fromISO}-${toISO ?? ''}-${request?.sessions ?? ''}`}
          actor={actor}
          anaesthetistId={anaesthetistId}
          allowRepeat={request?.instance !== true}
          singleSession={request?.instance === true}
          initial={{
            fromISO,
            ...(toISO !== undefined ? { toISO } : {}),
            ...formPreset,
            ...(request !== null ? { sessions: request.sessions } : {}),
            ...(request?.statusKey !== undefined && formPreset === undefined ? { statusKey: request.statusKey } : {}),
            ...(request?.note !== undefined ? { note: request.note } : {}),
          }}
          onSaved={(text) => { setLine(text); onResult?.(text) }}
          shot="availability-form"
        />
      )}
      {onDone !== undefined && line !== null && (
        <button type="button" onClick={onDone} style={{ height: 48, borderRadius: radius.card, border: `1px solid ${neutral.lineStrong}`, background: neutral.surface, color: accent.pressed, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          Done
        </button>
      )}
    </div>
  )
}
