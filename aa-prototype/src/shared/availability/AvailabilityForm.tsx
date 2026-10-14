import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { accent, neutral, radius } from '../../theme/tokens'
import type { SlotStatusKey, Weekday } from '../../domain/types'
import { anaesthetistChoices, activeStatuses, statusFor, type SessionChoice } from '../../domain/slotStatus'
import { seriesLine, weekdayOf, WEEKDAY_NAMES, WEEKDAYS } from '../../domain/availabilitySeries'
import { createAvailabilitySeries, setAvailabilityRange, useAppStore, type Actor } from '../../store'
import { Button, FieldLabel, FormError, Segmented, SlidingSegmentedControl, TextField } from '../ui'
import { StatusChip } from '../StatusChip'
import { describeAvailabilityOutcome } from './describeAvailabilityOutcome'
import { useAvailabilityBounds } from './useAvailability'
import { useMoveListPrompt } from '../flows/MoveListPrompt'

type RepeatChoice = 'none' | '1' | '2' | 'more'

export interface AvailabilityFormInitial {
  fromISO: string
  toISO?: string
  sessions?: SessionChoice
  statusKey?: SlotStatusKey
  note?: string
  /** "1 week" ready: To is From plus six days. */
  span?: 'day' | 'week' | 'fortnight'
}

interface AvailabilityFormProps {
  actor: Actor
  anaesthetistId: string
  initial: AvailabilityFormInitial
  /** False when changing one instance of a series (no Repeat). */
  allowRepeat?: boolean
  /** One session only ("Change this one"): the date is fixed, no range. */
  singleSession?: boolean
  /** Called with the result line after a save. */
  onSaved?: (line: string) => void
  /** The hook the capture recipes and tests use. */
  shot?: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const iso = (d: Date) => format(d, 'yyyy-MM-dd')
/** A cleared date input gives '': nothing to add to, so it stays ''. */
const plusDays = (dateISO: string, n: number) => (ISO_DATE.test(dateISO) ? iso(addDays(parseISO(dateISO), n)) : '')
const minISO = (a: string, b: string) => (a < b ? a : b)

/**
 * The one availability form, shared by the mobile sheet and the web rail
 * (catch-up Phase 29; US-01.2.1, US-01.5.3, US-03.1.4): status as chips,
 * sessions as a segmented control, dates with quick chips, Repeat with weekday
 * chips and an Until date, an optional note, one teal Save. It calls the same
 * store actions on both apps and shows the store's result line or refusal.
 */
export function AvailabilityForm({ actor, anaesthetistId, initial, allowRepeat = true, singleSession = false, onSaved, shot }: AvailabilityFormProps) {
  const records = useAppStore((s) => s.masters.slotStatuses)
  const { todayISO, horizonEndISO } = useAvailabilityBounds()
  const choices = useMemo(() => (actor.role === 'anaesthetist' ? anaesthetistChoices(records) : activeStatuses(records)), [actor.role, records])

  const spanDays = initial.span === 'week' ? 6 : initial.span === 'fortnight' ? 13 : 0
  const [statusKey, setStatusKey] = useState<SlotStatusKey>(initial.statusKey ?? choices[0]?.key ?? '')
  const [sessions, setSessions] = useState<SessionChoice>(initial.sessions ?? 'both')
  const [fromISO, setFromISO] = useState(initial.fromISO)
  const [toISO, setToISO] = useState(initial.toISO ?? minISO(plusDays(initial.fromISO, spanDays), horizonEndISO))
  const [repeat, setRepeat] = useState<RepeatChoice>('none')
  const [moreWeeks, setMoreWeeks] = useState<3 | 4>(3)
  const [weekdays, setWeekdays] = useState<Weekday[]>(() => [weekdayOf(initial.fromISO)])
  // Once the anaesthetist picks the days themselves, a new start date leaves them alone.
  const [weekdaysPicked, setWeekdaysPicked] = useState(false)
  const [untilISO, setUntilISO] = useState<string | null>(null)
  const [note, setNote] = useState(initial.note ?? '')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // US-01.5.5 (catch-up Phase 32): a closed status over her List asks where the List goes first.
  const prompt = useMoveListPrompt()

  /** A `holdsList` refusal: prompt for each List, then save again; any other refusal shows inline. */
  function refused(out: { code: string; message: string; details?: unknown }) {
    const listIds = (out.details as { listIds?: string[] } | undefined)?.listIds
    if (out.code === 'holdsList' && prompt !== null && listIds !== undefined && listIds.length > 0) {
      setError(null)
      // Where each List is now: once moved, a series takes these sessions as its own.
      const lists = useAppStore.getState().schedule.lists
      const slotIds = listIds.flatMap((id) => {
        const slotId = lists[id]?.slotId
        return slotId !== undefined ? [slotId] : []
      })
      prompt.promptUnavailable({
        listIds,
        statusKey,
        onDone: (allMoved) => {
          if (allMoved) save(listIds.length, slotIds)
          else setError('Not saved. Sessions whose List you moved are already marked; the others are unchanged.')
        },
      })
      return
    }
    setError(out.message)
  }

  const repeating = allowRepeat && repeat !== 'none'
  const everyWeeks = (repeat === 'more' ? moreWeeks : Number(repeat)) as 1 | 2 | 3 | 4
  const quickSpan = fromISO === '' ? null : toISO === fromISO ? 'day' : toISO === plusDays(fromISO, 6) ? 'week' : toISO === plusDays(fromISO, 13) ? 'fortnight' : null

  function touched() {
    setResult(null)
    setError(null)
  }

  function pickFrom(value: string) {
    touched()
    setFromISO(value)
    if (toISO < value) setToISO(value)
    if (!weekdaysPicked && ISO_DATE.test(value)) setWeekdays([weekdayOf(value)])
  }

  function quick(span: 'day' | 'week' | 'fortnight') {
    if (fromISO === '') return
    touched()
    setToISO(minISO(plusDays(fromISO, span === 'day' ? 0 : span === 'week' ? 6 : 13), horizonEndISO))
  }

  function toggleDay(day: Weekday) {
    touched()
    setWeekdaysPicked(true)
    setWeekdays((cur) => (cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day].sort((a, b) => a - b)))
  }

  /** `movedLists`: the Lists the unavailable prompt moved first (catch-up Phase 32), for the result line. */
  function save(movedLists = 0, movedSlotIds: readonly string[] = []) {
    const label = statusFor(records, statusKey)?.longLabel ?? 'that status'
    const trimmed = note.trim()
    const movedFirst = movedLists > 0 ? { movedFirst: { lists: movedLists, sessionsAlreadySet: trimmed === '' ? movedLists : 0 } } : {}
    if (repeating) {
      const draft = {
        anaesthetistId,
        statusKey,
        sessions,
        weekdays,
        everyWeeks,
        startISO: fromISO,
        ...(untilISO !== null ? { untilISO } : {}),
        ...(trimmed !== '' ? { note: trimmed } : {}),
      }
      const out = createAvailabilitySeries(useAppStore, actor, draft, movedSlotIds.length > 0 ? { adoptSlotIds: movedSlotIds } : {})
      if (!out.ok) {
        refused(out)
        return
      }
      const line = describeAvailabilityOutcome(out.value, { kind: 'series', statusLabel: label, seriesLine: seriesLine(draft, records), ...movedFirst })
      setResult(line)
      onSaved?.(line)
      return
    }
    const out = setAvailabilityRange(useAppStore, actor, { anaesthetistId, fromISO, toISO, sessions, statusKey, note: trimmed })
    if (!out.ok) {
      refused(out)
      return
    }
    const line = describeAvailabilityOutcome(out.value, { kind: 'range', statusLabel: label, fromISO, toISO, ...movedFirst })
    setResult(line)
    onSaved?.(line)
  }

  return (
    <div data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <FieldLabel>Status</FieldLabel>
        <div role="group" aria-label="Status" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {choices.map((s) => {
            const selected = s.key === statusKey
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={selected}
                data-status-choice={s.key}
                onClick={() => { touched(); setStatusKey(s.key) }}
                style={choiceStyle(selected)}
              >
                <StatusChip status={s.key} label={s.longLabel} />
              </button>
            )
          })}
        </div>
      </div>

      <Segmented
        label="Sessions"
        value={sessions}
        options={[
          { value: 'AM', label: 'AM' },
          { value: 'PM', label: 'PM' },
          { value: 'both', label: 'Both' },
        ]}
        onChange={(v) => { touched(); setSessions(v) }}
      />

      {allowRepeat && !singleSession && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FieldLabel>Repeat</FieldLabel>
          <SlidingSegmentedControl
            value={repeat}
            layout="two-column"
            ariaLabel="Repeat"
            options={[
              { value: 'none', label: 'Does not repeat' },
              { value: '1', label: 'Every week' },
              { value: '2', label: 'Every 2 weeks' },
              { value: 'more', label: 'More' },
            ]}
            onSelect={(v) => { touched(); setRepeat(v) }}
          />
          {repeat === 'more' && (
            <div style={{ display: 'flex', gap: 8 }}>
              {([3, 4] as const).map((n) => (
                <Chip key={n} selected={moreWeeks === n} onClick={() => { touched(); setMoreWeeks(n) }}>Every {n} weeks</Chip>
              ))}
            </div>
          )}
        </div>
      )}

      {repeating ? (
        <>
          <DateField label="Starts" value={fromISO} min={todayISO} max={horizonEndISO} onChange={pickFrom} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <FieldLabel>On</FieldLabel>
            <div role="group" aria-label="Days of the week" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {WEEKDAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={weekdays.includes(d)}
                  aria-label={WEEKDAY_NAMES[d].long}
                  data-weekday={d}
                  onClick={() => toggleDay(d)}
                  style={dayChipStyle(weekdays.includes(d))}
                >
                  {WEEKDAY_NAMES[d].initial}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <DateField
                  label="Until"
                  value={untilISO ?? ''}
                  min={fromISO}
                  onChange={(v) => { touched(); setUntilISO(v === '' ? null : v) }}
                  placeholder="No end date"
                />
              </div>
              <Chip selected={untilISO === null} onClick={() => { touched(); setUntilISO(null) }}>No end date</Chip>
            </div>
          </div>
        </>
      ) : singleSession ? (
        <div data-shot="availability-form-single" style={{ fontSize: 14, color: neutral.ink }}>
          <FieldLabel>Date</FieldLabel>
          <div style={{ marginTop: 6 }}>{ISO_DATE.test(fromISO) ? format(parseISO(fromISO), 'EEEE d MMMM') : fromISO}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <DateField label="From" value={fromISO} min={todayISO} max={horizonEndISO} onChange={pickFrom} />
            <DateField label="To" value={toISO} min={fromISO} max={horizonEndISO} onChange={(v) => { touched(); setToISO(v) }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Chip selected={quickSpan === 'day'} onClick={() => quick('day')}>Just this day</Chip>
            <Chip selected={quickSpan === 'week'} onClick={() => quick('week')}>1 week</Chip>
            <Chip selected={quickSpan === 'fortnight'} onClick={() => quick('fortnight')}>2 weeks</Chip>
          </div>
        </div>
      )}

      <TextField label="Note (optional)" value={note} onChange={(v) => { touched(); setNote(v) }} placeholder="For example, conference" />

      <FormError message={error} />
      <ResultLine line={result} />
      <Button variant="primary" block onClick={() => save()}>Save</Button>
    </div>
  )
}

/** An availability action's result line (one look on every surface). */
export function ResultLine({ line }: { line: string | null }) {
  if (line === null) return null
  return (
    <div role="status" data-shot="availability-result" style={{ background: accent.tint, color: accent.pressed, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13, lineHeight: '18px' }}>
      {line}
    </div>
  )
}

function choiceStyle(selected: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 44,
    padding: 4,
    borderRadius: 999,
    border: selected ? `2px solid ${accent.base}` : `1px solid ${neutral.line}`,
    margin: selected ? 0 : 1,
    background: neutral.surface,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}

function dayChipStyle(selected: boolean): CSSProperties {
  return {
    height: 40,
    borderRadius: 999,
    border: `1px solid ${selected ? accent.base : neutral.line}`,
    background: selected ? accent.base : neutral.surface,
    color: selected ? neutral.surface : neutral.slate,
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  }
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      style={{
        minHeight: 36,
        padding: '0 14px',
        borderRadius: 999,
        border: `1px solid ${selected ? accent.base : neutral.line}`,
        background: selected ? accent.tint : neutral.surface,
        color: selected ? accent.pressed : neutral.slate,
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flex: 'none',
      }}
    >
      {children}
    </button>
  )
}

function DateField({ label, value, min, max, onChange, placeholder }: { label: string; value: string; min?: string; max?: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mono"
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 48, borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.bg, padding: '0 12px', fontFamily: 'inherit', fontSize: 14, color: neutral.ink }}
      />
    </label>
  )
}
