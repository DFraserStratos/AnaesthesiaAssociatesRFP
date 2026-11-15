import { useId, useMemo, useState, type ReactNode } from 'react'
import { addDays, differenceInCalendarDays, differenceInCalendarWeeks, format, parseISO } from 'date-fns'
import { ChevronLeft, Repeat } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '@proto/store'
import { anaesthetistChoices, defaultSlotStatus, isClosedKey, statusFor } from '@proto/domain/slotStatus'
import { seriesLine, weekdayOf, WEEKDAY_NAMES, WEEKDAYS } from '@proto/domain/availabilitySeries'
import { SESSIONS_IN_ORDER, sessionText } from '@proto/domain/outOfHours'
import { describeAvailabilityOutcome, LIST_SESSION_LINE, useAvailabilityBounds, useAvailabilityDay } from '@proto/shared/availability'
import { OUT_OF_HOURS_SESSION } from '@proto/shared/outOfHoursTerms'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent } from '@/components/ui/popover'
import { DatePickerTrigger, dayText } from '../../shared/DatePickerTrigger'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { Echo, Knobs, StatusBadge, type WebFixtures } from './shared'

export type DateInputKind = 'native' | 'calendar'

type SessionChoice = 'AM' | 'PM' | 'both' | 'OOH'
type RepeatChoice = 'none' | '1' | '2' | 'more'
interface SlotStatus {
  key: string
  longLabel: string
  anaesthetistCanSet?: boolean
}
interface CalendarSession {
  slotId: string
  session: string
  statusKey: string
  displayKey: string
  note?: string
  list?: { id: string; hospitalName: string; state: string }
  series?: { id: string; line: string }
  conflict: boolean
}
interface ChangeRequest {
  sessions: SessionChoice
  statusKey?: string
  note?: string
  instance?: boolean
}

const ISO = /^\d{4}-\d{2}-\d{2}$/
const iso = (d: Date) => format(d, 'yyyy-MM-dd')
const plusDays = (dateISO: string, n: number) => (ISO.test(dateISO) ? iso(addDays(parseISO(dateISO), n)) : '')
const minISO = (a: string, b: string) => (a < b ? a : b)
const NO_CHANGE = { set: 0, leftAsIs: 0, seriesEdited: 0, unchanged: 0, holdingLists: 0 }

/**
 * The availability rail (AvailabilityEditor) with its form on React Hook Form
 * + Zod + shadcn Field. The day's sessions read live from the store, as
 * Cards; the form's choices are ToggleGroups (status, sessions, repeat,
 * weekdays) and Toggles (quick spans). Saving is LOCAL: the result line is
 * worded by the prototype's own describeAvailabilityOutcome over a count of
 * the sessions the save would set (Lists in the way are not checked).
 * `dates` picks the date inputs: the native date input (today) or a Popover
 * with the kit Calendar.
 */
export function AvailabilityEditorReplacement({ dates }: { dates: DateInputKind }) {
  const f = useWebFixtures() as WebFixtures
  const [span, setSpan] = useState<'one' | 'three'>('one')
  return (
    <>
      <Knobs label="Selection" value={span} options={[{ value: 'one', label: 'One day' }, { value: 'three', label: 'Three days' }]} onChange={setSpan} />
      <Editor key={span} f={f} fromISO={f.todayISO} {...(span === 'three' ? { toISO: plusDays(f.todayISO, 2) } : {})} dates={dates} />
    </>
  )
}

function Editor({ f, fromISO, toISO, dates }: { f: WebFixtures; fromISO: string; toISO?: string; dates: DateInputKind }) {
  const { todayISO } = useAvailabilityBounds() as { todayISO: string }
  const day = useAvailabilityDay(f.anaesthetistId, fromISO) as Record<string, CalendarSession | undefined> | undefined
  const range = toISO !== undefined && toISO !== fromISO
  const [request, setRequest] = useState<ChangeRequest | null>(range ? { sessions: 'both' } : null)
  const [line, setLine] = useState<string | null>(null)
  const title = range ? `${format(parseISO(fromISO), 'EEE d MMM')} to ${format(parseISO(toISO ?? fromISO), 'EEE d MMM')}` : format(parseISO(fromISO), 'EEEE d MMMM')

  return (
    <div className="tw:flex tw:flex-col tw:gap-3.5">
      <div className="tw:flex tw:items-center tw:gap-2">
        {request !== null && !range && (
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Back to the sessions"
            className="tw:rounded-pill! tw:text-teal-pressed"
            onClick={() => {
              setRequest(null)
              setLine(null)
            }}
          >
            <ChevronLeft aria-hidden />
          </Button>
        )}
        <div>
          <h3 className="tw:m-0 tw:text-lg tw:leading-6 tw:font-bold tw:text-ink">{title}</h3>
          <div className="tw:text-[12.5px] tw:text-mist">
            {request === null ? 'Your AM and PM sessions' : request.instance === true ? 'Change this one only; the series carries on' : 'Set a status for these sessions'}
          </div>
        </div>
      </div>
      {request === null && day !== undefined ? (
        <>
          <SessionPanel
            f={f}
            day={day}
            dateISO={fromISO}
            todayISO={todayISO}
            onChange={(r) => {
              setLine(null)
              setRequest(r)
            }}
            onResult={setLine}
          />
          <ResultAlert line={line} />
        </>
      ) : (
        <AvailabilityForm
          key={`${fromISO}-${toISO ?? ''}-${request?.sessions ?? ''}`}
          dates={dates}
          allowRepeat={request?.instance !== true}
          singleSession={request?.instance === true}
          initial={{ fromISO, toISO, sessions: request?.sessions ?? 'both', statusKey: request?.statusKey, note: request?.note }}
        />
      )}
    </div>
  )
}

function ResultAlert({ line }: { line: string | null }) {
  if (line === null) return null
  return (
    <Alert role="status" className="tw:bg-teal-tint">
      <AlertDescription className="tw:text-teal-pressed">{line}</AlertDescription>
    </Alert>
  )
}

/** The day's sessions (AvailabilitySlotPanel) as Cards; actions are local. */
function SessionPanel({
  f,
  day,
  dateISO,
  todayISO,
  onChange,
  onResult,
}: {
  f: WebFixtures
  day: Record<string, CalendarSession | undefined>
  dateISO: string
  todayISO: string
  onChange: (r: ChangeRequest) => void
  onResult: (line: string) => void
}) {
  const records = useAppStore((s: { masters: { slotStatuses: Record<string, SlotStatus> } }) => s.masters.slotStatuses)
  const def = defaultSlotStatus(records) as SlotStatus
  const past = dateISO < todayISO
  const [confirmSeries, setConfirmSeries] = useState<CalendarSession | null>(null)
  const sessions = (SESSIONS_IN_ORDER as string[]).map((s) => day[s]).filter((s): s is CalendarSession => s !== undefined)
  if (sessions.length === 0) return <div className="tw:text-[13px] tw:text-mist">No session on this day: it is before your start date or outside the schedule.</div>

  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      {sessions.map((s) => {
        const oneOff = s.series === undefined && (s.statusKey !== def.key || s.note !== undefined)
        const officeOnly = f.actor.role === 'anaesthetist' && (statusFor(records, s.statusKey) as SlotStatus | undefined)?.anaesthetistCanSet === false
        const session = s.session as SessionChoice
        return (
          <Card key={s.slotId} className="tw:gap-2.5 tw:p-3 tw:shadow-none">
            <div className="tw:flex tw:items-center tw:gap-2.5">
              <span className="tw:w-[26px] tw:flex-none tw:font-mono tw:text-xs tw:font-bold tw:text-slate">{sessionText(s.session)}</span>
              <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1">
                <span className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                  <StatusBadge statusKey={s.displayKey} />
                  {s.list !== undefined && <span className="tw:text-[13px] tw:font-semibold tw:text-ink">{s.list.hospitalName}</span>}
                  {s.list !== undefined && isClosedKey(records, s.statusKey) && (
                    <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-slate">
                      marked <StatusBadge statusKey={s.statusKey} />
                    </span>
                  )}
                </span>
                {s.note !== undefined && <span className="tw:text-[12.5px] tw:text-slate">{s.note}</span>}
                {s.series !== undefined && (
                  <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[12.5px] tw:text-slate">
                    <Repeat className="tw:size-[13px]" aria-label="Repeating" /> {s.series.line}
                  </span>
                )}
                {s.conflict && <span className="tw:text-xs tw:font-semibold tw:text-warning-on-tint">This List has a conflict for the office to resolve</span>}
              </span>
            </div>
            {s.list !== undefined && !past && <div className="tw:rounded-ctl tw:bg-sunken tw:px-2.5 tw:py-2 tw:text-[12.5px] tw:leading-[18px] tw:text-slate">{LIST_SESSION_LINE}</div>}
            {!past && s.list !== undefined && s.list.state === 'ACTIVE' && f.actor.role === 'anaesthetist' && (
              <Actions>
                <PanelAction primary onClick={() => onResult(`Would open the move sheet for ${s.list?.hospitalName ?? 'this List'} (local only).`)}>
                  Move this List
                </PanelAction>
              </Actions>
            )}
            {past ? (
              <div className="tw:text-xs tw:text-mist">Past sessions cannot be changed.</div>
            ) : officeOnly ? (
              <div className="tw:text-xs tw:text-mist">Set by the office. Ask the office to change it.</div>
            ) : s.series !== undefined ? (
              <Actions>
                <PanelAction onClick={() => onChange({ sessions: session, statusKey: s.statusKey, ...(s.note !== undefined ? { note: s.note } : {}), instance: true })}>Change this one</PanelAction>
                <PanelAction onClick={() => onResult(describeAvailabilityOutcome({ ...NO_CHANGE, set: 1 }, { kind: 'cleared', statusLabel: def.longLabel, fromISO: dateISO }) + ' (local only)')}>
                  Delete this one
                </PanelAction>
                <PanelAction onClick={() => setConfirmSeries(s)}>Delete the series</PanelAction>
              </Actions>
            ) : (
              <Actions>
                <PanelAction onClick={() => onChange({ sessions: session, statusKey: s.statusKey, ...(s.note !== undefined ? { note: s.note } : {}) })}>Change</PanelAction>
                {oneOff && (
                  <PanelAction onClick={() => onResult(describeAvailabilityOutcome({ ...NO_CHANGE, set: 1 }, { kind: 'cleared', statusLabel: def.longLabel, fromISO: dateISO }) + ' (local only)')}>
                    Remove
                  </PanelAction>
                )}
              </Actions>
            )}
          </Card>
        )
      })}
      {!past && day.AM !== undefined && day.PM !== undefined && (
        <div>
          <PanelAction onClick={() => onChange({ sessions: 'both' })}>Change both sessions</PanelAction>
        </div>
      )}
      <AlertDialog open={confirmSeries !== null} onOpenChange={(o) => !o && setConfirmSeries(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete the series?</AlertDialogTitle>
            <AlertDialogDescription>
              Its sessions from today on return to {def.longLabel}. Days you changed on their own keep their status, and past days stay as they were.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel autoFocus>Keep it</AlertDialogCancel>
            <Button
              onClick={() => {
                setConfirmSeries(null)
                onResult('Series deleted (local only).')
              }}
            >
              Delete the series
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="tw:flex tw:flex-wrap tw:gap-2">{children}</div>
}

/** The panel's pill actions: teal filled for the primary, outline with teal-pressed text otherwise. */
function PanelAction({ onClick, children, primary = false }: { onClick: () => void; children: ReactNode; primary?: boolean }) {
  return (
    <Button
      variant={primary ? 'default' : 'outline'}
      onClick={onClick}
      className={cn('tw:h-[38px] tw:rounded-pill! tw:px-3.5 tw:text-[13px]', !primary && 'tw:border-line-strong tw:text-teal-pressed')}
    >
      {children}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// The form
// ---------------------------------------------------------------------------

function makeSchema(todayISO: string, horizonEndISO: string, allowRepeat: boolean, single: boolean) {
  return z
    .object({
      statusKey: z.string().min(1, 'Choose a status.'),
      sessions: z.enum(['AM', 'PM', 'both', 'OOH']),
      repeat: z.enum(['none', '1', '2', 'more']),
      moreWeeks: z.union([z.literal(3), z.literal(4)]),
      fromISO: z.string(),
      toISO: z.string(),
      weekdays: z.array(z.number()),
      untilISO: z.string().nullable(),
      note: z.string(),
    })
    .superRefine((v, ctx) => {
      const repeating = allowRepeat && v.repeat !== 'none' && v.sessions !== 'OOH'
      if (single || v.sessions === 'OOH') return
      if (!ISO.test(v.fromISO)) ctx.addIssue({ code: 'custom', path: ['fromISO'], message: 'Choose a start date.' })
      else if (v.fromISO < todayISO) ctx.addIssue({ code: 'custom', path: ['fromISO'], message: 'Choose today or a later day.' })
      else if (v.fromISO > horizonEndISO) ctx.addIssue({ code: 'custom', path: ['fromISO'], message: 'That day is past the end of the schedule.' })
      if (repeating) {
        if (v.weekdays.length === 0) ctx.addIssue({ code: 'custom', path: ['weekdays'], message: 'Choose at least one day of the week.' })
        if (v.untilISO !== null && v.untilISO < v.fromISO) ctx.addIssue({ code: 'custom', path: ['untilISO'], message: 'Until must be on or after the start.' })
      } else {
        if (!ISO.test(v.toISO)) ctx.addIssue({ code: 'custom', path: ['toISO'], message: 'Choose an end date.' })
        else if (v.toISO < v.fromISO) ctx.addIssue({ code: 'custom', path: ['toISO'], message: 'To must be on or after From.' })
        else if (v.toISO > horizonEndISO) ctx.addIssue({ code: 'custom', path: ['toISO'], message: 'That day is past the end of the schedule.' })
      }
    })
}
type FormValues = z.infer<ReturnType<typeof makeSchema>>

/** Sessions a save would set: days in range (or matching the series rule up to Until or the horizon) times sessions. */
function countSessions(v: FormValues, repeating: boolean, horizonEndISO: string): number {
  const per = v.sessions === 'both' ? 2 : 1
  if (!repeating) return (differenceInCalendarDays(parseISO(v.toISO), parseISO(v.fromISO)) + 1) * per
  const every = v.repeat === 'more' ? v.moreWeeks : Number(v.repeat)
  const end = minISO(v.untilISO ?? horizonEndISO, horizonEndISO)
  const start = parseISO(v.fromISO)
  let n = 0
  for (let d = start; iso(d) <= end; d = addDays(d, 1)) {
    const week = differenceInCalendarWeeks(d, start, { weekStartsOn: 1 })
    if (week % every === 0 && v.weekdays.includes(weekdayOf(iso(d)))) n += per
  }
  return n
}

function AvailabilityForm({
  dates,
  allowRepeat,
  singleSession,
  initial,
}: {
  dates: DateInputKind
  allowRepeat: boolean
  singleSession: boolean
  initial: { fromISO: string; toISO?: string; sessions: SessionChoice; statusKey?: string; note?: string }
}) {
  const records = useAppStore((s: { masters: { slotStatuses: Record<string, SlotStatus> } }) => s.masters.slotStatuses)
  const { todayISO, horizonEndISO } = useAvailabilityBounds() as { todayISO: string; horizonEndISO: string }
  const choices = useMemo(() => anaesthetistChoices(records) as SlotStatus[], [records])
  const schema = useMemo(() => makeSchema(todayISO, horizonEndISO, allowRepeat, singleSession), [todayISO, horizonEndISO, allowRepeat, singleSession])
  const [result, setResult] = useState<string | null>(null)
  const [weekdaysPicked, setWeekdaysPicked] = useState(false)
  const ids = { status: useId(), sessions: useId(), repeat: useId(), on: useId(), from: useId(), to: useId(), until: useId(), note: useId() }

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      statusKey: initial.statusKey ?? choices[0]?.key ?? '',
      sessions: initial.sessions,
      repeat: 'none',
      moreWeeks: 3,
      fromISO: initial.fromISO,
      toISO: initial.toISO ?? initial.fromISO,
      weekdays: [weekdayOf(initial.fromISO)],
      untilISO: null,
      note: initial.note ?? '',
    },
  })
  const v = useWatch({ control: form.control }) as FormValues
  const errors = form.formState.errors
  const repeating = allowRepeat && v.repeat !== 'none' && v.sessions !== 'OOH'
  const quickSpan = v.fromISO === '' ? null : v.toISO === v.fromISO ? 'day' : v.toISO === plusDays(v.fromISO, 6) ? 'week' : v.toISO === plusDays(v.fromISO, 13) ? 'fortnight' : null

  // Any edit clears the last result line, as today.
  const touched = () => setResult(null)
  const set = <K extends keyof FormValues>(name: K, value: FormValues[K]) => {
    touched()
    form.setValue(name, value as never, { shouldValidate: form.formState.isSubmitted, shouldDirty: true })
  }

  function pickFrom(value: string) {
    set('fromISO', value)
    if (v.toISO < value) set('toISO', value)
    if (!weekdaysPicked && ISO.test(value)) set('weekdays', [weekdayOf(value)])
  }
  function quick(span: 'day' | 'week' | 'fortnight') {
    if (v.fromISO === '') return
    set('toISO', minISO(plusDays(v.fromISO, span === 'day' ? 0 : span === 'week' ? 6 : 13), horizonEndISO))
  }

  const onSave = form.handleSubmit((values) => {
    const label = (statusFor(records, values.statusKey) as SlotStatus | undefined)?.longLabel ?? 'that status'
    const n = countSessions(values, repeating, horizonEndISO)
    const text = repeating
      ? describeAvailabilityOutcome(
          { ...NO_CHANGE, set: n },
          {
            kind: 'series',
            statusLabel: label,
            seriesLine: seriesLine(
              { weekdays: values.weekdays, everyWeeks: values.repeat === 'more' ? values.moreWeeks : Number(values.repeat), sessions: values.sessions, statusKey: values.statusKey, ...(values.untilISO !== null ? { untilISO: values.untilISO } : {}) },
              records,
            ),
          },
        )
      : describeAvailabilityOutcome({ ...NO_CHANGE, set: n }, { kind: 'range', statusLabel: label, fromISO: values.fromISO, toISO: singleSession || values.sessions === 'OOH' ? values.fromISO : values.toISO })
    setResult(`${text} (local only)`)
  })

  return (
    <form noValidate onSubmit={onSave} className="tw:flex tw:flex-col tw:gap-4">
      <Field>
        <FieldLabel id={ids.status}>Status</FieldLabel>
        <Controller
          control={form.control}
          name="statusKey"
          render={({ field }) => (
            <ToggleGroup
              variant="outline"
              aria-labelledby={ids.status}
              className="tw:flex-wrap tw:gap-2"
              value={[field.value]}
              onValueChange={(next) => {
                const picked = next[0] as string | undefined
                if (picked !== undefined) {
                  touched()
                  field.onChange(picked)
                }
              }}
            >
              {choices.map((s) => (
                <ToggleGroupItem
                  key={s.key}
                  value={s.key}
                  aria-label={s.longLabel}
                  className="tw:h-11 tw:flex-none tw:rounded-pill! tw:bg-surface tw:p-1 tw:hover:bg-surface tw:data-pressed:bg-surface tw:data-pressed:shadow-[inset_0_0_0_1px_var(--teal)] tw:data-pressed:border-primary"
                >
                  <StatusBadge statusKey={s.key} label={s.longLabel} />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        />
      </Field>

      {v.sessions === 'OOH' ? (
        <div className="tw:text-sm tw:text-ink">
          <FieldLabel>Session</FieldLabel>
          <div className="tw:mt-1.5">{OUT_OF_HOURS_SESSION}</div>
        </div>
      ) : (
        <Field>
          <FieldLabel id={ids.sessions}>Sessions</FieldLabel>
          <Segmented labelledBy={ids.sessions} value={v.sessions} options={[['AM', 'AM'], ['PM', 'PM'], ['both', 'Both']]} onChange={(x) => set('sessions', x as SessionChoice)} />
        </Field>
      )}

      {allowRepeat && !singleSession && v.sessions !== 'OOH' && (
        <Field>
          <FieldLabel id={ids.repeat}>Repeat</FieldLabel>
          <Segmented
            labelledBy={ids.repeat}
            twoColumn
            value={v.repeat}
            options={[
              ['none', 'Does not repeat'],
              ['1', 'Every week'],
              ['2', 'Every 2 weeks'],
              ['more', 'More'],
            ]}
            onChange={(x) => set('repeat', x as RepeatChoice)}
          />
          {v.repeat === 'more' && (
            <div className="tw:flex tw:gap-2">
              {([3, 4] as const).map((n) => (
                <Chip key={n} pressed={v.moreWeeks === n} onPressedChange={() => set('moreWeeks', n)}>
                  Every {n} weeks
                </Chip>
              ))}
            </div>
          )}
        </Field>
      )}

      {repeating ? (
        <>
          <DateField id={ids.from} label="Starts" kind={dates} value={v.fromISO} min={todayISO} max={horizonEndISO} today={todayISO} onChange={pickFrom} error={errors.fromISO?.message} />
          <Field data-invalid={errors.weekdays !== undefined || undefined}>
            <FieldLabel id={ids.on}>On</FieldLabel>
            <ToggleGroup
              multiple
              variant="outline"
              aria-labelledby={ids.on}
              className="tw:grid tw:w-full tw:grid-cols-7 tw:gap-1.5"
              value={v.weekdays.map(String)}
              onValueChange={(next) => {
                setWeekdaysPicked(true)
                set(
                  'weekdays',
                  (next as string[]).map(Number).sort((a, b) => a - b),
                )
              }}
            >
              {(WEEKDAYS as number[]).map((d) => (
                <ToggleGroupItem
                  key={d}
                  value={String(d)}
                  aria-label={WEEKDAY_NAMES[d].long}
                  className="tw:h-10 tw:min-w-0 tw:rounded-pill! tw:text-[13px] tw:font-bold tw:data-pressed:border-primary tw:data-pressed:bg-primary tw:data-pressed:text-white tw:hover:data-pressed:bg-primary"
                >
                  {WEEKDAY_NAMES[d].initial}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldError errors={[errors.weekdays]} />
          </Field>
          <div className="tw:flex tw:items-end tw:gap-2">
            <div className="tw:min-w-0 tw:flex-1">
              <DateField
                id={ids.until}
                label="Until"
                kind={dates}
                value={v.untilISO ?? ''}
                min={v.fromISO}
                max={horizonEndISO}
                today={todayISO}
                placeholder="No end date"
                onChange={(x) => set('untilISO', x === '' ? null : x)}
                error={errors.untilISO?.message}
              />
            </div>
            <Chip pressed={v.untilISO === null} onPressedChange={() => set('untilISO', null)} className="tw:mb-1.5">
              No end date
            </Chip>
          </div>
        </>
      ) : singleSession || v.sessions === 'OOH' ? (
        <div className="tw:text-sm tw:text-ink">
          <FieldLabel>Date</FieldLabel>
          <div className="tw:mt-1.5">{ISO.test(v.fromISO) ? format(parseISO(v.fromISO), 'EEEE d MMMM') : v.fromISO}</div>
        </div>
      ) : (
        <div className="tw:flex tw:flex-col tw:gap-2">
          <div className="tw:grid tw:grid-cols-2 tw:gap-2.5">
            <DateField id={ids.from} label="From" kind={dates} value={v.fromISO} min={todayISO} max={horizonEndISO} today={todayISO} onChange={pickFrom} error={errors.fromISO?.message} />
            <DateField id={ids.to} label="To" kind={dates} value={v.toISO} min={v.fromISO} max={horizonEndISO} today={todayISO} onChange={(x) => set('toISO', x)} error={errors.toISO?.message} />
          </div>
          <div className="tw:flex tw:flex-wrap tw:gap-2">
            <Chip pressed={quickSpan === 'day'} onPressedChange={() => quick('day')}>
              Just this day
            </Chip>
            <Chip pressed={quickSpan === 'week'} onPressedChange={() => quick('week')}>
              1 week
            </Chip>
            <Chip pressed={quickSpan === 'fortnight'} onPressedChange={() => quick('fortnight')}>
              2 weeks
            </Chip>
          </div>
        </div>
      )}

      <Field>
        <FieldLabel htmlFor={ids.note}>Note (optional)</FieldLabel>
        <Input id={ids.note} placeholder="For example, conference" {...form.register('note', { onChange: touched })} />
      </Field>

      {result !== null && (
        <Alert role="status" className="tw:bg-teal-tint">
          <AlertDescription className="tw:text-teal-pressed">{result}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" size="cta" className="tw:w-full">
        Save
      </Button>
      <Echo>Local only: Save words the result but changes nothing in the demo data.</Echo>
    </form>
  )
}

/** The prototype's segmented control (Segmented, SlidingSegmentedControl) as a single-select teal ToggleGroup. */
function Segmented({ labelledBy, value, options, onChange, twoColumn = false }: { labelledBy: string; value: string; options: [string, string][]; onChange: (v: string) => void; twoColumn?: boolean }) {
  return (
    <ToggleGroup
      variant="teal"
      role="radiogroup"
      aria-labelledby={labelledBy}
      className={cn('tw:w-full', twoColumn && 'tw:grid tw:grid-cols-2')}
      value={[value]}
      onValueChange={(next) => {
        const picked = next[0] as string | undefined
        if (picked !== undefined) onChange(picked)
      }}
    >
      {options.map(([val, label]) => (
        <ToggleGroupItem key={val} value={val} role="radio" aria-checked={val === value} aria-pressed={undefined} className="tw:h-10 tw:min-w-0">
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/** A quick-choice chip (Toggle): teal-tint with a teal border when on, as today. */
function Chip({ pressed, onPressedChange, children, className }: { pressed: boolean; onPressedChange: () => void; children: ReactNode; className?: string }) {
  return (
    <Toggle
      variant="outline"
      size="sm"
      pressed={pressed}
      onPressedChange={onPressedChange}
      className={cn('tw:h-9 tw:flex-none tw:rounded-pill! tw:px-3.5 tw:data-pressed:border-primary', className)}
    >
      {children}
    </Toggle>
  )
}

/** A date field: the native date input (today) or a Popover holding the kit Calendar. Bounds are the same either way. */
function DateField({
  id,
  label,
  kind,
  value,
  min,
  max,
  today,
  placeholder,
  onChange,
  error,
}: {
  id: string
  label: string
  kind: DateInputKind
  value: string
  min?: string
  max?: string
  today: string
  placeholder?: string
  onChange: (v: string) => void
  error?: string
}) {
  const [open, setOpen] = useState(false)
  const invalid = error !== undefined
  return (
    <Field data-invalid={invalid || undefined} className="tw:min-w-0">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {kind === 'native' ? (
        <Input id={id} type="date" value={value} min={min} max={max} placeholder={placeholder} aria-invalid={invalid || undefined} onChange={(e) => onChange(e.target.value)} className="tw:px-3 tw:font-mono tw:text-sm" />
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <DatePickerTrigger id={id} aria-invalid={invalid || undefined} text={ISO.test(value) ? dayText(value) : undefined} placeholder={placeholder ?? 'Choose a day'} />
          <PopoverContent align="start" className="tw:w-auto tw:p-0">
            <Calendar
              mode="single"
              weekStartsOn={1}
              today={parseISO(today)}
              selected={ISO.test(value) ? parseISO(value) : undefined}
              defaultMonth={ISO.test(value) ? parseISO(value) : parseISO(min ?? today)}
              disabled={[...(min !== undefined && ISO.test(min) ? [{ before: parseISO(min) }] : []), ...(max !== undefined ? [{ after: parseISO(max) }] : [])]}
              {...(min !== undefined && ISO.test(min) ? { startMonth: parseISO(min) } : {})}
              {...(max !== undefined ? { endMonth: parseISO(max) } : {})}
              onSelect={(d: Date | undefined) => {
                if (d !== undefined) onChange(iso(d))
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      )}
      <FieldError>{error}</FieldError>
    </Field>
  )
}
