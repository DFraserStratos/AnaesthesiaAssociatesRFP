import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDays, format, parseISO } from 'date-fns'
import { accent, neutral, radius } from '../../../theme/tokens'
import type { ListKind, RecurringBooking, Session } from '../../../domain/types'
import { coversDate, type PlanKept, type PlanSkipped } from '../../../domain/recurringBookingProjection'
import { recurringClashListId } from '../../../domain/draftLists'
import {
  addRecurringBooking,
  editRecurringBooking,
  previewRecurringBookingChange,
  previewRetireRecurringBooking,
  retireRecurringBooking,
  scheduleHorizon,
  tomorrowISO,
  useAppStore,
  type Actor,
  type RecurringBookingApplyResult,
} from '../../../store'
import { Button, FieldLabel, FormError, Segmented, TextField, useSurface } from '../../../shared'
import { shortDay } from '../../../shared/format'
import { selectControlStyle as selectStyle } from './fieldChrome'
import { NotPreferredWarning, SurgeonPicker, useNotPreferredWarning } from '../components/pairing'
import { keptDetail, previewLine, resultLine, retirePreviewLine, retireResultLine, SKIPPED_DETAIL, SKIPPED_HEADING } from '../recurringBookingCopy'
import { textActionStyle } from '../tableChrome'

interface Props {
  open: boolean
  actor: Actor
  /** Present = edit; absent = add. */
  recurringBooking?: RecurringBooking
  onClose: () => void
}

const DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
]

/** A recurring booking projects a private, public or pre-op List (catch-up Phase 28: free and leave are session statuses, never a recurring booking). */
const KINDS: { value: ListKind; label: string }[] = [
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public' },
  { value: 'preop', label: 'Pre-op' },
]

type Applied = { line: string; result: RecurringBookingApplyResult }

/**
 * Add or edit a recurring booking (US-01.3.2, DM-53; catch-up Phase 30). The
 * primary "Apply to canvas now" saves it and projects it over the schedule
 * ahead in one action (from tomorrow to the far end of the horizon), so an
 * edit is never saved without reaching the canvas. The live preview line
 * reads the same plan the store applies. Weekend days and start and end dates
 * work; edit mode can retire it (no hard delete). Phase 17's not-preferred
 * surgeon warning reads "Apply anyway" and never disables the button.
 */
export function RecurringBookingSheet({ open, actor, recurringBooking, onClose }: Props) {
  const { Overlay } = useSurface()
  const navigate = useNavigate()
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const clock = useAppStore((s) => s.clock)
  const appSettings = useAppStore((s) => s.appSettings)

  const [anaesthetistId, setAnaesthetistId] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [session, setSession] = useState<Session>('AM')
  const [kind, setKind] = useState<ListKind>('private')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [hospitalId, setHospitalId] = useState('')
  const [surgeonId, setSurgeonId] = useState('')
  const [notes, setNotes] = useState('')
  const [fromISO, setFromISO] = useState('')
  const [toISO, setToISO] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState<Applied | null>(null)
  const [retiring, setRetiring] = useState(false)
  const [lastDate, setLastDate] = useState(clock.todayISO)
  // Catch-up Phase 17: a not-preferred usual surgeon warns and never blocks;
  // on an edit, only a changed pairing warns (as only it is acknowledged).
  const pairingChanged = recurringBooking === undefined || anaesthetistId !== recurringBooking.anaesthetistId || surgeonId !== recurringBooking.surgeonId
  const pairingWarning = useNotPreferredWarning(anaesthetistId !== '' ? anaesthetistId : undefined, pairingChanged ? surgeonId : undefined)

  useEffect(() => {
    if (!open) return
    setAnaesthetistId(recurringBooking?.anaesthetistId ?? '')
    setDayOfWeek(recurringBooking?.dayOfWeek ?? 1)
    setSession(recurringBooking?.session ?? 'AM')
    setKind(recurringBooking?.kind ?? 'private')
    setStartTime(recurringBooking?.startTime ?? '')
    setEndTime(recurringBooking?.endTime ?? '')
    setHospitalId(recurringBooking?.hospitalId ?? '')
    setSurgeonId(recurringBooking?.surgeonId ?? '')
    setNotes(recurringBooking?.notes ?? '')
    setFromISO(recurringBooking?.effectiveFromISO ?? '')
    setToISO(recurringBooking?.effectiveToISO ?? '')
    setError(null)
    setApplied(null)
    setRetiring(false)
    setLastDate(useAppStore.getState().clock.todayISO)
    // Reset on opening (or another row), not when the saved record changes under
    // an open sheet: applying rewrites it, and the result must stay on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recurringBooking?.id])

  // The draft as a recurring booking, for the live preview (the store applies the same plan).
  const draft = useMemo((): RecurringBooking | undefined => {
    // No preview until the pairing is complete (US-01.3.1): saving refuses an incomplete one.
    if (anaesthetistId === '' || hospitalId === '' || surgeonId === '') return undefined
    const d: RecurringBooking = {
      id: recurringBooking?.id ?? 'RCB-preview',
      anaesthetistId,
      dayOfWeek: dayOfWeek as RecurringBooking['dayOfWeek'],
      session,
      kind,
      hospitalId,
      surgeonId,
    }
    if (startTime !== '') d.startTime = startTime
    if (endTime !== '') d.endTime = endTime
    if (notes.trim() !== '') d.notes = notes.trim()
    if (fromISO !== '') d.effectiveFromISO = fromISO
    if (toISO !== '') d.effectiveToISO = toISO
    return d
  }, [recurringBooking?.id, anaesthetistId, dayOfWeek, session, kind, hospitalId, surgeonId, startTime, endTime, notes, fromISO, toISO])

  const state = useMemo(() => ({ schedule, masters, clock, appSettings }), [schedule, masters, clock, appSettings])
  const plan = useMemo(
    () => (draft !== undefined && applied === null ? previewRecurringBookingChange(state, recurringBooking, draft) : null),
    [draft, applied, state, recurringBooking],
  )
  const retirePlan = useMemo(
    () =>
      retiring && recurringBooking !== undefined && lastDate !== ''
        ? previewRetireRecurringBooking(state, recurringBooking, lastDate)
        : null,
    [retiring, recurringBooking, lastDate, state],
  )

  function coveredDays(rb: Pick<RecurringBooking, 'dayOfWeek' | 'effectiveFromISO' | 'effectiveToISO'>): number {
    const s = useAppStore.getState()
    const end = scheduleHorizon(s).endISO
    let n = 0
    for (let d = parseISO(tomorrowISO(s)); format(d, 'yyyy-MM-dd') <= end; d = addDays(d, 1)) if (coversDate(rb, format(d, 'yyyy-MM-dd'))) n++
    return n
  }

  function apply() {
    if (draft === undefined) {
      setError(anaesthetistId === '' ? 'Choose an anaesthetist.' : hospitalId === '' ? 'Choose the hospital.' : 'Choose the surgeon.')
      return
    }
    // The same draft the preview reads; blanked optional fields are sent as
    // cleared so an edit removes them (catch-up Phase 30: preview equals apply).
    const { id: _id, ...rest } = draft
    void _id
    const fields = {
      ...rest,
      startTime: draft.startTime ?? '',
      endTime: draft.endTime ?? '',
      notes: draft.notes ?? '',
      effectiveFromISO: draft.effectiveFromISO,
      effectiveToISO: draft.effectiveToISO,
    }
    const outcome = recurringBooking !== undefined
      ? editRecurringBooking(useAppStore, actor, recurringBooking.id, fields)
      : addRecurringBooking(useAppStore, actor, fields)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setError(null)
    const rb = useAppStore.getState().masters.recurringBookings[outcome.value.id]!
    setApplied({ line: resultLine(outcome.value, coveredDays(rb), rb.dayOfWeek), result: outcome.value })
  }

  function retire() {
    if (recurringBooking === undefined) return
    const outcome = retireRecurringBooking(useAppStore, actor, recurringBooking.id, lastDate)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setError(null)
    setRetiring(false)
    const r = outcome.value
    setApplied({ line: retireResultLine(r, shortDay(lastDate)), result: r })
  }

  const editing = recurringBooking !== undefined
  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="recurring-booking-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{editing ? 'Edit recurring booking' : 'Add recurring booking'}</div>
        {applied !== null ? (
          <AppliedView
            applied={applied}
            onShow={(dateISO) => {
              onClose()
              navigate(`/admin/day/${dateISO}`)
            }}
            onOpenDraftLists={(listId) => {
              onClose()
              navigate(listId !== undefined ? `/admin/draft-lists?open=${listId}` : '/admin/draft-lists')
            }}
            onDone={onClose}
          />
        ) : (
          <>
            <div style={{ fontSize: 13, color: neutral.slate, lineHeight: '19px' }}>
              A pattern of Lists for this anaesthetist, surgeon and hospital on one day and session each week, not a Booking for a patient.
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel>Anaesthetist</FieldLabel>
              <select value={anaesthetistId} onChange={(e) => setAnaesthetistId(e.target.value)} style={selectStyle}>
                <option value="">Select an anaesthetist</option>
                {Object.values(anaesthetists).map((a) => (
                  <option key={a.registrationNumber} value={a.registrationNumber}>{a.name}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel>Day of week</FieldLabel>
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} style={selectStyle}>
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </label>
            <Segmented label="Session" value={session} options={[{ value: 'AM', label: 'AM' }, { value: 'PM', label: 'PM' }]} onChange={setSession} />
            <Segmented label="Kind of List" value={kind} options={KINDS} onChange={setKind} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <FieldLabel>Start (optional)</FieldLabel>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={selectStyle} />
                </label>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <FieldLabel>End (optional)</FieldLabel>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={selectStyle} />
                </label>
              </div>
              <span style={{ fontSize: 12, color: neutral.slate }}>Leave blank for the default session times.</span>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel>Hospital (usual)</FieldLabel>
              <select value={hospitalId} onChange={(e) => setHospitalId(e.target.value)} style={selectStyle}>
                <option value="" disabled>Choose a hospital</option>
                {Object.values(hospitals).map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel>Usual surgeon</FieldLabel>
              <SurgeonPicker anaesthetistId={anaesthetistId !== '' ? anaesthetistId : undefined} value={surgeonId} onChange={setSurgeonId} emptyLabel="Choose a surgeon" style={selectStyle} />
            </label>
            <TextField label="Display note (optional)" value={notes} onChange={setNotes} placeholder="e.g. Elective ortho" />
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <TextField label="Starts (optional)" type="date" value={fromISO} onChange={setFromISO} />
              </div>
              <div style={{ flex: 1 }}>
                <TextField label="Runs until (optional)" type="date" value={toISO} onChange={setToISO} />
              </div>
            </div>
            <FormError message={error} />
            <NotPreferredWarning warning={pairingWarning} shot="recurring-booking-pairing-warning" />
            {retiring && recurringBooking !== undefined ? (
              <div data-shot="recurring-booking-retire" style={{ display: 'flex', flexDirection: 'column', gap: 10, background: neutral.bg, borderRadius: radius.card, padding: 12 }}>
                <TextField label="Last date it runs" type="date" value={lastDate} onChange={setLastDate} />
                {retirePlan !== null && (
                  <div style={{ fontSize: 13, color: neutral.ink, lineHeight: '19px' }}>
                    {retirePreviewLine({ removed: retirePlan.remove.length, kept: retirePlan.kept })}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="secondary" block onClick={() => setRetiring(false)}>Keep it running</Button>
                  <Button variant="primary" block onClick={retire}>Retire</Button>
                </div>
              </div>
            ) : (
              <>
                {plan !== null && (
                  <div role="status" data-shot="recurring-booking-preview" style={{ background: accent.tint, color: accent.pressed, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13, lineHeight: '19px' }}>
                    {previewLine({ created: plan.create.length, updated: plan.update.length, removed: plan.remove.length, kept: plan.kept, skipped: plan.skipped }, draft?.dayOfWeek)}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  {editing && <Button variant="secondary" onClick={() => setRetiring(true)}>Retire</Button>}
                  <Button variant="primary" block onClick={apply}>{pairingWarning !== null ? 'Apply anyway' : 'Apply to canvas now'}</Button>
                </div>
                <div style={{ fontSize: 12, color: neutral.mist }}>Saves it and applies it to the schedule ahead, from tomorrow. Lists with Bookings or office edits are left as they are.</div>
              </>
            )}
          </>
        )}
      </div>
    </Overlay>
  )
}

function AppliedView({ applied, onShow, onOpenDraftLists, onDone }: { applied: Applied; onShow: (dateISO: string) => void; onOpenDraftLists: (listId?: string) => void; onDone: () => void }) {
  const { result } = applied
  const slots = useAppStore((s) => s.schedule.slots)
  // Each date opens its own Draft List (the clash id is derived from the recurring booking, day and session).
  const draftListOf = (k: PlanSkipped) => {
    const session = slots[k.slotId]?.session
    return session === undefined ? undefined : recurringClashListId(k.recurringBookingId, k.dateISO, session)
  }
  return (
    <div data-shot="recurring-booking-result" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div role="status" style={{ background: accent.tint, color: accent.pressed, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13, lineHeight: '19px' }}>{applied.line}</div>
      {result.firstAffectedDateISO !== undefined && (
        <button type="button" style={{ ...textActionStyle, alignSelf: 'flex-start', fontSize: 13 }} onClick={() => onShow(result.firstAffectedDateISO!)}>
          Show on day grid ({shortDay(result.firstAffectedDateISO)})
        </button>
      )}
      <DetailList title={`Kept (${result.kept.length})`} rows={result.kept} line={(k: PlanKept) => `${shortDay(k.dateISO)}: ${keptDetail(k)}`} />
      <DetailList
        title={`${SKIPPED_HEADING} (${result.skipped.length})`}
        rows={result.skipped}
        line={(s: PlanSkipped) => `${shortDay(s.dateISO)}: ${SKIPPED_DETAIL}`}
        onOpen={(s: PlanSkipped) => {
          const id = draftListOf(s)
          if (id !== undefined) onOpenDraftLists(id)
        }}
      />
      {result.skipped.length > 0 && (
        <button type="button" data-shot="recurring-booking-draft-lists" style={{ ...textActionStyle, alignSelf: 'flex-start', fontSize: 13 }} onClick={() => onOpenDraftLists()}>
          See them on {SKIPPED_HEADING}
        </button>
      )}
      <Button variant="primary" block onClick={onDone}>Done</Button>
    </div>
  )
}

function DetailList<T extends { dateISO: string; slotId?: string; listId?: string }>({ title, rows, line, onOpen }: { title: string; rows: readonly T[]; line: (row: T) => string; onOpen?: (row: T) => void }) {
  if (rows.length === 0) return null
  return (
    <details style={{ fontSize: 13, color: neutral.slate }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{title}</summary>
      <ul style={{ margin: '6px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rows.map((r) => (
          <li key={`${r.listId ?? r.slotId ?? ''}-${r.dateISO}`}>
            {onOpen !== undefined ? (
              <button type="button" style={{ ...textActionStyle, fontSize: 13, fontWeight: 500, textAlign: 'left' }} onClick={() => onOpen(r)}>
                {line(r)}
              </button>
            ) : (
              line(r)
            )}
          </li>
        ))}
      </ul>
    </details>
  )
}
