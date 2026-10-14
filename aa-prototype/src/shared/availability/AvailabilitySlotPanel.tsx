import { useState, type ReactNode } from 'react'
import { Repeat } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import type { SlotStatusKey } from '../../domain/types'
import { defaultSlotStatus, isClosedKey, statusFor, type SessionChoice } from '../../domain/slotStatus'
import { clearAvailability, deleteAvailabilitySeries, useAppStore, type Actor, type CalendarDay, type CalendarSession } from '../../store'
import { StatusChip } from '../StatusChip'
import { FormError } from '../ui'
import { describeAvailabilityOutcome } from './describeAvailabilityOutcome'
import { useMoveListPrompt } from '../flows/MoveListPrompt'

/** What the panel asks its host to open: the form for one session (or both), prefilled. */
export interface ChangeRequest {
  sessions: SessionChoice
  statusKey?: SlotStatusKey
  note?: string
  /** True for "Change this one" on a series instance (no Repeat). */
  instance?: boolean
}

interface AvailabilitySlotPanelProps {
  actor: Actor
  day: CalendarDay
  todayISO: string
  onChange: (request: ChangeRequest) => void
  /** A removal or deletion's result line. */
  onResult: (line: string) => void
}

/**
 * On a session holding her List (catch-up Phase 32; US-01.5.5): marking it not
 * available asks where the List goes first, so no List is left with her.
 */
export const LIST_SESSION_LINE = 'This session holds a List. Marking it not available asks whether the List goes back to the office or to a colleague.'

/**
 * What a tapped day shows before the form (catch-up Phase 29; US-01.5.3; the
 * code says panel, the UI says session): each session's status, or the List
 * in its place, with what can be done. A one-off day off offers Change and
 * Remove; a series instance offers Change this one, Delete this one and Delete
 * the series; a session holding a List still lets the anaesthetist change the
 * status, and marking it not available asks where the List goes (the move
 * sheet's unavailable mode, catch-up Phase 32). A past session is read only.
 */
export function AvailabilitySlotPanel({ actor, day, todayISO, onChange, onResult }: AvailabilitySlotPanelProps) {
  const records = useAppStore((s) => s.masters.slotStatuses)
  const defaultStatus = defaultSlotStatus(records)
  const defaultLabel = defaultStatus.longLabel
  const past = day.dateISO < todayISO
  const [confirmSeries, setConfirmSeries] = useState<CalendarSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Catch-up Phase 32 (Phase 29's handoff): a movable List offers "Move this List" here.
  const movePrompt = useMoveListPrompt()
  const sessions = (['AM', 'PM'] as const).map((s) => day[s]).filter((s): s is CalendarSession => s !== undefined)

  function remove(session: CalendarSession) {
    const out = clearAvailability(useAppStore, actor, session.slotId)
    if (!out.ok) {
      setError(out.message)
      return
    }
    onResult(describeAvailabilityOutcome(out.value, { kind: 'cleared', statusLabel: defaultLabel, fromISO: day.dateISO }))
  }

  function deleteSeries(session: CalendarSession) {
    if (session.series === undefined) return
    const out = deleteAvailabilitySeries(useAppStore, actor, session.series.id)
    setConfirmSeries(null)
    if (!out.ok) {
      setError(out.message)
      return
    }
    onResult(describeAvailabilityOutcome(out.value, { kind: 'seriesDeleted', statusLabel: defaultLabel }))
  }

  if (sessions.length === 0) {
    return <div style={{ fontSize: 13, color: neutral.mist }}>No session on this day: it is before your start date or outside the schedule.</div>
  }

  return (
    <div data-shot="availability-session-panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sessions.map((s) => {
        // A one-off: anything but the plain default (a status or a note) that no series set.
        const oneOff = s.series === undefined && (s.statusKey !== defaultStatus.key || s.note !== undefined)
        // An anaesthetist cannot change a status only the office may set.
        const officeOnly = actor.role === 'anaesthetist' && statusFor(records, s.statusKey)?.anaesthetistCanSet === false
        return (
          <div
            key={s.slotId}
            data-slot-id={s.slotId}
            style={{ border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, background: neutral.surface }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="mono" style={{ width: 26, fontSize: 12, fontWeight: 700, color: neutral.slate, flex: 'none' }}>{s.session}</span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <StatusChip status={s.displayKey} />
                  {s.list !== undefined && <span style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>{s.list.hospitalName}</span>}
                  {s.list !== undefined && isClosedKey(records, s.statusKey) && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: neutral.slate }}>marked <StatusChip status={s.statusKey} /></span>
                  )}
                </span>
                {s.note !== undefined && <span style={{ fontSize: 12.5, color: neutral.slate }}>{s.note}</span>}
                {s.series !== undefined && (
                  <span data-shot="availability-series-line" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: neutral.slate }}>
                    <Repeat size={13} aria-label="Repeating" /> {s.series.line}
                  </span>
                )}
                {s.conflict && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: semantic.warning.onTint }}>This List has a conflict for the office to resolve</span>
                )}
              </span>
            </div>
            {s.list !== undefined && !past && (
              <div style={{ fontSize: 12.5, lineHeight: '18px', color: neutral.slate, background: neutral.sunken, borderRadius: radius.ctl, padding: '8px 10px' }}>
                {LIST_SESSION_LINE}
              </div>
            )}
            {!past && s.list !== undefined && s.list.state === 'ACTIVE' && actor.role === 'anaesthetist' && movePrompt !== null && (
              <Actions>
                <span data-shot="availability-panel-move" style={{ display: 'contents' }}>
                  <PanelAction primary onClick={() => movePrompt.openMove(s.list!.id)}>Move this List</PanelAction>
                </span>
              </Actions>
            )}
            {past ? (
              <div style={{ fontSize: 12, color: neutral.mist }}>Past sessions cannot be changed.</div>
            ) : officeOnly ? (
              <div style={{ fontSize: 12, color: neutral.mist }}>Set by the office. Ask the office to change it.</div>
            ) : s.series !== undefined ? (
              <Actions>
                <PanelAction onClick={() => onChange({ sessions: s.session, statusKey: s.statusKey, ...(s.note !== undefined ? { note: s.note } : {}), instance: true })}>Change this one</PanelAction>
                <PanelAction onClick={() => remove(s)}>Delete this one</PanelAction>
                <PanelAction onClick={() => setConfirmSeries(s)}>Delete the series</PanelAction>
              </Actions>
            ) : (
              <Actions>
                <PanelAction onClick={() => onChange({ sessions: s.session, statusKey: s.statusKey, ...(s.note !== undefined ? { note: s.note } : {}) })}>Change</PanelAction>
                {oneOff && <PanelAction onClick={() => remove(s)}>Remove</PanelAction>}
              </Actions>
            )}
            {confirmSeries?.slotId === s.slotId && s.series !== undefined && (
              <div data-shot="availability-series-confirm" role="group" aria-label="Delete the series" style={{ background: neutral.bg, borderRadius: radius.ctl, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13, lineHeight: '19px', color: neutral.ink }}>
                  Delete the series? Its sessions from today on return to {defaultLabel}. Days you changed on their own keep their status, and past days stay as they were.
                </div>
                <Actions>
                  <PanelAction primary onClick={() => deleteSeries(s)}>Delete the series</PanelAction>
                  <PanelAction onClick={() => setConfirmSeries(null)}>Keep it</PanelAction>
                </Actions>
              </div>
            )}
          </div>
        )
      })}
      {!past && sessions.length === 2 && (
        <PanelAction onClick={() => onChange({ sessions: 'both' })}>Change both sessions</PanelAction>
      )}
      <FormError message={error} />
    </div>
  )
}

function Actions({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{children}</div>
}

function PanelAction({ onClick, children, primary }: { onClick: () => void; children: ReactNode; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 38,
        padding: '0 14px',
        borderRadius: 999,
        border: `1px solid ${primary === true ? accent.base : neutral.lineStrong}`,
        background: primary === true ? accent.base : neutral.surface,
        color: primary === true ? neutral.surface : accent.pressed,
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
