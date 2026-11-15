import { useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addDays, format, parseISO } from 'date-fns'
import { ChevronLeft, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Alert } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useAppStore, useToday } from '@proto/store'
import { anaesthetistChoices, defaultSlotStatus, isClosedKey, statusFor } from '@proto/domain/slotStatus'
import { WEEKDAY_NAMES, WEEKDAYS, weekdayOf } from '@proto/domain/availabilitySeries'
import { SESSIONS_IN_ORDER, sessionText } from '@proto/domain/outOfHours'
import { LIST_SESSION_LINE, useAvailabilityBounds, useAvailabilityDay } from '@proto/shared/availability'
import { dayWithYear } from '@proto/shared/format'
import { StatusBadge, useMobilePersona } from './shared'
import { SegmentedToggle } from './Segmented'
import { PRESS } from './Controls'

// ---------------------------------------------------------------------------
// Types read from the prototype (loosely typed through @proto)
// ---------------------------------------------------------------------------

type SessionChoice = 'AM' | 'PM' | 'both' | 'OOH'
type RepeatChoice = 'none' | '1' | '2' | 'more'
type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

interface StatusRec {
  key: string
  longLabel: string
  anaesthetistCanSet: boolean
}
interface CalendarSession {
  slotId: string
  session: 'AM' | 'PM' | 'OOH'
  statusKey: string
  displayKey: string
  note?: string
  list?: { id: string; hospitalName: string; state: string }
  series?: { id: string; line: string }
  conflict: boolean
}
type CalendarDay = { dateISO: string } & Partial<Record<'AM' | 'PM' | 'OOH', CalendarSession>>

interface ChangeRequest {
  sessions: SessionChoice
  statusKey?: string
  note?: string
  instance?: boolean
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const iso = (d: Date) => format(d, 'yyyy-MM-dd')
const plusDays = (dateISO: string, n: number) => (ISO_DATE.test(dateISO) ? iso(addDays(parseISO(dateISO), n)) : '')
const minISO = (a: string, b: string) => (a < b ? a : b)
const longDay = (dateISO: string) => (ISO_DATE.test(dateISO) ? format(parseISO(dateISO), 'EEE d MMM') : dateISO)

/** A chip-sized action (the panel's PanelAction): outline pill, teal-pressed text; primary is filled teal. */
function PanelAction({ onClick, children, primary }: { onClick: () => void; children: ReactNode; primary?: boolean }) {
  return (
    <Button
      variant={primary ? 'default' : 'outline'}
      onClick={onClick}
      className={cn('tw:h-[38px] tw:rounded-pill! tw:px-3.5 tw:text-[13px]', primary ? '' : 'tw:border-line-strong tw:text-teal-pressed', PRESS)}
    >
      {children}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// The day's sessions (AvailabilitySlotPanel)
// ---------------------------------------------------------------------------

function SessionPanel({ day, todayISO, isAnaesthetist, onChange, onLine }: { day: CalendarDay; todayISO: string; isAnaesthetist: boolean; onChange: (r: ChangeRequest) => void; onLine: (line: string) => void }) {
  const records = useAppStore((s: any) => s.masters.slotStatuses)
  const defaultStatus = defaultSlotStatus(records) as StatusRec
  const past = day.dateISO < todayISO
  const [confirmSeries, setConfirmSeries] = useState<string | null>(null)
  const sessions = (SESSIONS_IN_ORDER as ('AM' | 'PM' | 'OOH')[]).map((s) => day[s]).filter((s): s is CalendarSession => s !== undefined)

  if (sessions.length === 0) {
    return <div className="tw:text-[13px] tw:text-mist">No session on this day: it is before your start date or outside the schedule.</div>
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      {sessions.map((s) => {
        const oneOff = s.series === undefined && (s.statusKey !== defaultStatus.key || s.note !== undefined)
        const officeOnly = isAnaesthetist && (statusFor(records, s.statusKey) as StatusRec | undefined)?.anaesthetistCanSet === false
        return (
          <section key={s.slotId} aria-label={`${sessionText(s.session)} session`} className="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-card tw:border tw:border-line tw:bg-surface tw:p-3">
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
            {s.list !== undefined && !past && (
              <div className="tw:rounded-ctl tw:bg-sunken tw:px-2.5 tw:py-2 tw:text-[12.5px] tw:leading-[18px] tw:text-slate">{LIST_SESSION_LINE}</div>
            )}
            {/* "Move this List" shows only under the app's move-List prompt host, which the
                catalogue example does not mount, so (as on the left) it is not offered here. */}
            {past ? (
              <div className="tw:text-xs tw:text-mist">Past sessions cannot be changed.</div>
            ) : officeOnly ? (
              <div className="tw:text-xs tw:text-mist">Set by the office. Ask the office to change it.</div>
            ) : s.series !== undefined ? (
              <div className="tw:flex tw:flex-wrap tw:gap-2">
                <PanelAction onClick={() => onChange({ sessions: s.session, statusKey: s.statusKey, ...(s.note !== undefined ? { note: s.note } : {}), instance: true })}>Change this one</PanelAction>
                <PanelAction onClick={() => onLine(`Would return this ${sessionText(s.session)} session to ${defaultStatus.longLabel}.`)}>Delete this one</PanelAction>
                <PanelAction onClick={() => setConfirmSeries(s.slotId)}>Delete the series</PanelAction>
              </div>
            ) : (
              <div className="tw:flex tw:flex-wrap tw:gap-2">
                <PanelAction onClick={() => onChange({ sessions: s.session, statusKey: s.statusKey, ...(s.note !== undefined ? { note: s.note } : {}) })}>Change</PanelAction>
                {oneOff && <PanelAction onClick={() => onLine(`Would return this ${sessionText(s.session)} session to ${defaultStatus.longLabel}.`)}>Remove</PanelAction>}
              </div>
            )}
            {confirmSeries === s.slotId && s.series !== undefined && (
              <div role="group" aria-label="Delete the series" className="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-ctl tw:bg-background tw:p-3">
                <div className="tw:text-[13px] tw:leading-[19px] tw:text-ink">
                  Delete the series? Its sessions from today on return to {defaultStatus.longLabel}. Days you changed on their own keep their status, and past days stay as they were.
                </div>
                <div className="tw:flex tw:flex-wrap tw:gap-2">
                  <PanelAction
                    primary
                    onClick={() => {
                      setConfirmSeries(null)
                      onLine('Would delete the series.')
                    }}
                  >
                    Delete the series
                  </PanelAction>
                  <PanelAction onClick={() => setConfirmSeries(null)}>Keep it</PanelAction>
                </div>
              </div>
            )}
          </section>
        )
      })}
      {!past && day.AM !== undefined && day.PM !== undefined && (
        <PanelAction onClick={() => onChange({ sessions: 'both' })}>Change both sessions</PanelAction>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// The form (AvailabilityForm) on React Hook Form + Zod
// ---------------------------------------------------------------------------

function makeSchema(todayISO: string, horizonEndISO: string, allowRepeat: boolean) {
  return z
    .object({
      statusKey: z.string().min(1, 'Choose a status.'),
      sessions: z.enum(['AM', 'PM', 'both', 'OOH']),
      repeat: z.enum(['none', '1', '2', 'more']),
      moreWeeks: z.union([z.literal(3), z.literal(4)]),
      fromISO: z.string().regex(ISO_DATE, 'Choose a date.'),
      toISO: z.string(),
      weekdays: z.array(z.number()),
      untilISO: z.string().nullable(),
      note: z.string().max(200, 'Keep the note to 200 characters.'),
    })
    .superRefine((v, ctx) => {
      const repeating = allowRepeat && v.repeat !== 'none' && v.sessions !== 'OOH'
      if (v.fromISO < todayISO) ctx.addIssue({ code: 'custom', path: ['fromISO'], message: 'Choose today or a later date.' })
      if (v.fromISO > horizonEndISO) ctx.addIssue({ code: 'custom', path: ['fromISO'], message: `The schedule runs to ${longDay(horizonEndISO)}.` })
      if (repeating) {
        if (v.weekdays.length === 0) ctx.addIssue({ code: 'custom', path: ['weekdays'], message: 'Choose at least one day.' })
        if (v.untilISO !== null && v.untilISO < v.fromISO) ctx.addIssue({ code: 'custom', path: ['untilISO'], message: 'Until must be on or after the start.' })
      } else {
        if (!ISO_DATE.test(v.toISO)) ctx.addIssue({ code: 'custom', path: ['toISO'], message: 'Choose a date.' })
        else if (v.toISO < v.fromISO) ctx.addIssue({ code: 'custom', path: ['toISO'], message: 'To must be on or after From.' })
        else if (v.toISO > horizonEndISO) ctx.addIssue({ code: 'custom', path: ['toISO'], message: `The schedule runs to ${longDay(horizonEndISO)}.` })
      }
    })
}
type FormValues = z.input<ReturnType<typeof makeSchema>>

/** A small selectable chip (the form's Chip): Toggle, teal border and tint when on. */
function Chip({ pressed, onPressedChange, children }: { pressed: boolean; onPressedChange: () => void; children: ReactNode }) {
  return (
    <Toggle
      variant="outline"
      pressed={pressed}
      onPressedChange={onPressedChange}
      className="tw:h-9 tw:flex-none tw:rounded-pill! tw:px-3.5 tw:text-[13px] tw:text-slate tw:hover:bg-surface tw:data-pressed:border-primary"
    >
      {children}
    </Toggle>
  )
}

function DateInput({ id, label, error, ...props }: { id: string; label: string; error?: string } & Omit<ComponentProps<'input'>, 'id' | 'type'>) {
  return (
    <Field data-invalid={error !== undefined || undefined} className="tw:min-w-0">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} type="date" aria-invalid={error !== undefined || undefined} className="tw:px-3 tw:font-mono tw:text-sm" {...props} />
      <FieldError>{error}</FieldError>
    </Field>
  )
}

function AvailabilityFormRhf({
  initial,
  allowRepeat,
  singleSession,
  isAnaesthetist,
  onSaved,
}: {
  initial: { fromISO: string; sessions?: SessionChoice; statusKey?: string; note?: string; span?: 'week' }
  allowRepeat: boolean
  singleSession: boolean
  isAnaesthetist: boolean
  onSaved: (line: string) => void
}) {
  const records = useAppStore((s: any) => s.masters.slotStatuses)
  const { todayISO, horizonEndISO } = useAvailabilityBounds() as { todayISO: string; horizonEndISO: string }
  const choices = useMemo(() => (isAnaesthetist ? anaesthetistChoices(records) : []) as StatusRec[], [isAnaesthetist, records])
  const schema = useMemo(() => makeSchema(todayISO, horizonEndISO, allowRepeat), [todayISO, horizonEndISO, allowRepeat])
  const [weekdaysPicked, setWeekdaysPicked] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      statusKey: initial.statusKey ?? choices[0]?.key ?? '',
      sessions: initial.sessions ?? 'both',
      repeat: 'none',
      moreWeeks: 3,
      fromISO: initial.fromISO,
      toISO: minISO(plusDays(initial.fromISO, initial.span === 'week' ? 6 : 0), horizonEndISO),
      weekdays: [weekdayOf(initial.fromISO)],
      untilISO: null,
      note: initial.note ?? '',
    },
  })
  const { control, setValue, register, formState } = form
  const [sessions, repeat, fromISO, toISO, untilISO] = useWatch({ control, name: ['sessions', 'repeat', 'fromISO', 'toISO', 'untilISO'] })
  const repeating = allowRepeat && repeat !== 'none' && sessions !== 'OOH'
  const quickSpan = fromISO === '' ? null : toISO === fromISO ? 'day' : toISO === plusDays(fromISO, 6) ? 'week' : toISO === plusDays(fromISO, 13) ? 'fortnight' : null
  const touched = () => setResult(null)

  function pickFrom(value: string) {
    touched()
    setValue('fromISO', value, { shouldValidate: formState.isSubmitted })
    if (toISO < value) setValue('toISO', value)
    if (!weekdaysPicked && ISO_DATE.test(value)) setValue('weekdays', [weekdayOf(value)])
  }
  function quick(span: 'day' | 'week' | 'fortnight') {
    if (fromISO === '') return
    touched()
    setValue('toISO', minISO(plusDays(fromISO, span === 'day' ? 0 : span === 'week' ? 6 : 13), horizonEndISO), { shouldValidate: formState.isSubmitted })
  }

  const onSubmit = form.handleSubmit((v) => {
    const label = (statusFor(records, v.statusKey) as StatusRec | undefined)?.longLabel ?? 'that status'
    const which = v.sessions === 'both' ? 'both sessions' : `${sessionText(v.sessions)} only`
    const when = repeating
      ? `every ${v.repeat === 'more' ? `${v.moreWeeks} weeks` : v.repeat === '2' ? '2 weeks' : 'week'} on ${(v.weekdays as Weekday[]).map((d) => WEEKDAY_NAMES[d].short).join(', ')}, from ${longDay(v.fromISO)}${v.untilISO !== null ? ` until ${longDay(v.untilISO)}` : ''}`
      : v.fromISO === v.toISO
        ? longDay(v.fromISO)
        : `${longDay(v.fromISO)} to ${longDay(v.toISO)}`
    const line = `Ready to save: ${label}, ${which}, ${when}. Nothing is written in this preview.`
    setResult(line)
    onSaved(line)
  })

  const e = formState.errors
  return (
    <form onSubmit={onSubmit} noValidate className="tw:flex tw:flex-col tw:gap-4">
      <Field>
        <FieldLabel id="m-sheets-av-status">Status</FieldLabel>
        <Controller
          control={control}
          name="statusKey"
          render={({ field }) => (
            <ToggleGroup
              variant="outline"
              aria-labelledby="m-sheets-av-status"
              role="radiogroup"
              value={[field.value]}
              onValueChange={(next) => {
                const picked = next[0] as string | undefined
                if (picked !== undefined) {
                  touched()
                  field.onChange(picked)
                }
              }}
              className="tw:flex-wrap tw:gap-2"
            >
              {choices.map((s) => (
                <ToggleGroupItem
                  key={s.key}
                  value={s.key}
                  role="radio"
                  aria-checked={field.value === s.key}
                  aria-pressed={undefined}
                  data-status-choice={s.key}
                  className="tw:h-11 tw:flex-none tw:rounded-pill! tw:p-1 tw:hover:bg-surface tw:data-pressed:bg-surface! tw:data-pressed:border-primary tw:data-pressed:shadow-[inset_0_0_0_1px_var(--teal)]"
                >
                  <StatusBadge statusKey={s.key} label={s.longLabel} />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        />
      </Field>

      {sessions === 'OOH' ? (
        <div className="tw:text-sm tw:text-ink">
          <FieldLabel>Session</FieldLabel>
          <div className="tw:mt-1.5">{sessionText('OOH')}</div>
        </div>
      ) : (
        <Field>
          <FieldLabel id="m-sheets-av-sessions">Sessions</FieldLabel>
          <Controller
            control={control}
            name="sessions"
            render={({ field }) => (
              <SegmentedToggle
                value={field.value}
                options={[
                  { value: 'AM', label: 'AM' },
                  { value: 'PM', label: 'PM' },
                  { value: 'both', label: 'Both' },
                ]}
                onSelect={(v) => {
                  touched()
                  field.onChange(v)
                }}
                ariaLabelledBy="m-sheets-av-sessions"
              />
            )}
          />
        </Field>
      )}

      {allowRepeat && !singleSession && sessions !== 'OOH' && (
        <Field>
          <FieldLabel id="m-sheets-av-repeat">Repeat</FieldLabel>
          <Controller
            control={control}
            name="repeat"
            render={({ field }) => (
              <SegmentedToggle<RepeatChoice>
                value={field.value}
                layout="two-column"
                options={[
                  { value: 'none', label: 'Does not repeat' },
                  { value: '1', label: 'Every week' },
                  { value: '2', label: 'Every 2 weeks' },
                  { value: 'more', label: 'More' },
                ]}
                onSelect={(v) => {
                  touched()
                  field.onChange(v)
                }}
                ariaLabelledBy="m-sheets-av-repeat"
              />
            )}
          />
          {repeat === 'more' && (
            <Controller
              control={control}
              name="moreWeeks"
              render={({ field }) => (
                <div className="tw:flex tw:gap-2">
                  {([3, 4] as const).map((n) => (
                    <Chip
                      key={n}
                      pressed={field.value === n}
                      onPressedChange={() => {
                        touched()
                        field.onChange(n)
                      }}
                    >
                      Every {n} weeks
                    </Chip>
                  ))}
                </div>
              )}
            />
          )}
        </Field>
      )}

      {repeating ? (
        <>
          <DateInput id="m-sheets-av-starts" label="Starts" value={fromISO} min={todayISO} max={horizonEndISO} onChange={(ev) => pickFrom(ev.target.value)} error={e.fromISO?.message} />
          <Field data-invalid={e.weekdays !== undefined || undefined}>
            <FieldLabel id="m-sheets-av-on">On</FieldLabel>
            <Controller
              control={control}
              name="weekdays"
              render={({ field }) => (
                <ToggleGroup
                  multiple
                  variant="outline"
                  aria-labelledby="m-sheets-av-on"
                  value={field.value.map(String)}
                  onValueChange={(next) => {
                    touched()
                    setWeekdaysPicked(true)
                    field.onChange((next as string[]).map(Number).sort((a, b) => a - b))
                  }}
                  className="tw:grid tw:w-full tw:grid-cols-7 tw:gap-1.5"
                >
                  {(WEEKDAYS as Weekday[]).map((d) => (
                    <ToggleGroupItem
                      key={d}
                      value={String(d)}
                      aria-label={WEEKDAY_NAMES[d].long}
                      className="tw:h-10 tw:min-w-0 tw:rounded-pill! tw:border tw:border-line tw:bg-surface tw:px-0 tw:text-[13px] tw:font-bold tw:text-slate tw:hover:bg-surface tw:data-pressed:border-primary tw:data-pressed:bg-primary! tw:data-pressed:text-white"
                    >
                      {WEEKDAY_NAMES[d].initial}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
            />
            <FieldError>{e.weekdays?.message}</FieldError>
          </Field>
          <div className="tw:flex tw:items-end tw:gap-2">
            <div className="tw:flex-1">
              <DateInput
                id="m-sheets-av-until"
                label="Until"
                value={untilISO ?? ''}
                min={fromISO}
                placeholder="No end date"
                onChange={(ev) => {
                  touched()
                  setValue('untilISO', ev.target.value === '' ? null : ev.target.value, { shouldValidate: formState.isSubmitted })
                }}
                error={e.untilISO?.message}
              />
            </div>
            <Chip
              pressed={untilISO === null}
              onPressedChange={() => {
                touched()
                setValue('untilISO', null)
              }}
            >
              No end date
            </Chip>
          </div>
        </>
      ) : singleSession || sessions === 'OOH' ? (
        <div className="tw:text-sm tw:text-ink">
          <FieldLabel>Date</FieldLabel>
          <div className="tw:mt-1.5">{ISO_DATE.test(fromISO) ? format(parseISO(fromISO), 'EEEE d MMMM') : fromISO}</div>
        </div>
      ) : (
        <div className="tw:flex tw:flex-col tw:gap-2">
          <div className="tw:grid tw:grid-cols-2 tw:gap-2.5">
            <DateInput id="m-sheets-av-from" label="From" value={fromISO} min={todayISO} max={horizonEndISO} onChange={(ev) => pickFrom(ev.target.value)} error={e.fromISO?.message} />
            <DateInput
              id="m-sheets-av-to"
              label="To"
              value={toISO}
              min={fromISO}
              max={horizonEndISO}
              onChange={(ev) => {
                touched()
                setValue('toISO', ev.target.value, { shouldValidate: formState.isSubmitted })
              }}
              error={e.toISO?.message}
            />
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

      <Field data-invalid={e.note !== undefined || undefined}>
        <FieldLabel htmlFor="m-sheets-av-note">Note (optional)</FieldLabel>
        <Input id="m-sheets-av-note" placeholder="For example, conference" aria-invalid={e.note !== undefined || undefined} {...register('note', { onChange: touched })} />
        <FieldError>{e.note?.message}</FieldError>
      </Field>

      {result !== null && (
        <Alert role="status" className="tw:border-transparent tw:bg-teal-tint tw:text-teal-pressed">
          {result}
        </Alert>
      )}
      <Button type="submit" size="cta" className={cn('tw:w-full', PRESS)}>
        Save
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// The editor (AvailabilityEditor) and its sheet host
// ---------------------------------------------------------------------------

function Editor({ anaesthetistId, fromISO, formPreset, onDone }: { anaesthetistId: string; fromISO: string; formPreset?: { sessions: 'both'; span: 'week' }; onDone: () => void }) {
  const { todayISO } = useAvailabilityBounds() as { todayISO: string }
  const day = useAvailabilityDay(anaesthetistId, fromISO) as CalendarDay | undefined
  const [request, setRequest] = useState<ChangeRequest | null>(formPreset !== undefined ? { sessions: formPreset.sessions } : null)
  const [line, setLine] = useState<string | null>(null)
  const title = formPreset !== undefined ? 'Add days off' : format(parseISO(fromISO), 'EEEE d MMMM')
  const subtitle = request === null ? 'Your AM and PM sessions' : request.instance === true ? 'Change this one only; the series carries on' : 'Set a status for these sessions'

  return (
    <div className="tw:flex tw:flex-col tw:gap-3.5">
      <div className="tw:flex tw:items-center tw:gap-2">
        {request !== null && formPreset === undefined && (
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Back to the sessions"
            className="tw:flex-none tw:rounded-pill! tw:text-teal-pressed"
            onClick={() => {
              setRequest(null)
              setLine(null)
            }}
          >
            <ChevronLeft aria-hidden />
          </Button>
        )}
        <div>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription className="tw:text-[12.5px] tw:text-mist">{subtitle}</DrawerDescription>
        </div>
      </div>
      {request === null && day !== undefined ? (
        <>
          <SessionPanel
            day={day}
            todayISO={todayISO}
            isAnaesthetist
            onChange={(r) => {
              setLine(null)
              setRequest(r)
            }}
            onLine={setLine}
          />
          {line !== null && (
            <Alert role="status" className="tw:border-transparent tw:bg-teal-tint tw:text-teal-pressed">
              {line}
            </Alert>
          )}
        </>
      ) : (
        <AvailabilityFormRhf
          key={`${fromISO}-${request?.sessions ?? ''}`}
          isAnaesthetist
          allowRepeat={request?.instance !== true}
          singleSession={request?.instance === true}
          initial={{
            fromISO,
            ...formPreset,
            ...(request !== null ? { sessions: request.sessions } : {}),
            ...(request?.statusKey !== undefined && formPreset === undefined ? { statusKey: request.statusKey } : {}),
            ...(request?.note !== undefined ? { note: request.note } : {}),
          }}
          onSaved={setLine}
        />
      )}
      {line !== null && (
        <Button variant="outline" size="lg" className={cn('tw:rounded-card! tw:border-line-strong tw:text-teal-pressed', PRESS)} onClick={onDone}>
          Done
        </Button>
      )}
    </div>
  )
}

/** The current example's two triggers and the bottom sheet that hosts the editor (shadcn Drawer). */
export function AvailabilityEditorReplacement() {
  const { anaesthetistId } = useMobilePersona()
  const todayISO = useToday() as string
  const [sheet, setSheet] = useState<'day' | 'add' | null>(null)
  return (
    <>
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
        <Button variant="outline" size="lg" className={PRESS} onClick={() => setSheet('day')}>
          Change {dayWithYear(todayISO)}
        </Button>
        <Button size="cta" className={PRESS} onClick={() => setSheet('add')}>
          Add days off
        </Button>
      </div>
      <Drawer open={sheet !== null} onOpenChange={(open) => !open && setSheet(null)}>
        <DrawerContent style={{ bottom: 'var(--aa-keyboard-inset, 0px)', maxHeight: 'calc(90% - var(--aa-keyboard-inset, 0px))' }}>
          <div className="tw:overflow-auto tw:px-5 tw:pb-[max(calc(var(--aa-inset-bottom,34px)+2px),20px)]">
            {sheet !== null && (
              <Editor
                key={sheet}
                anaesthetistId={anaesthetistId}
                fromISO={todayISO}
                {...(sheet === 'add' ? { formPreset: { sessions: 'both' as const, span: 'week' as const } } : {})}
                onDone={() => setSheet(null)}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
