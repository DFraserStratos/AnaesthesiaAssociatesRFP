import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'
import { addMonths, format, parseISO, startOfMonth } from 'date-fns'
import type { DayButtonProps } from 'react-day-picker'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { hospitalMonth } from '@proto/store'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { DatePicker, toISO } from './DatePicker'
import { useDemoToday, useHorizon, useStore } from './data'
import { Echo, FormAlert, Header, TextAction } from './shared'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { dayText } from '../../shared/DatePickerTrigger'

interface Holiday {
  id: string
  hospitalId: string
  dateISO: string
  name: string
}

interface DayInfo {
  closures: Holiday[]
  listCount: number
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`

/** What each day cell reads, by context, so DayPicker gets one stable DayButton. */
const MonthCtx = createContext<{ days: Map<string, DayInfo>; horizon: { startISO: string; endISO: string } } | null>(null)

/**
 * HospitalsView's Calendar mode on shadcn Calendar (react-day-picker 10) with custom day content:
 * one hospital's month, Monday first, bounded by the schedule horizon, each day showing its
 * closure as a holiday-tint block, the Lists at that hospital that day and the flagged count. A
 * closure opens to change or delete; an open day adds one. Holidays are a local copy of the store's,
 * so add, change and delete never reach the store; List counts are the store's.
 */
export function HospitalCalendarReplacement() {
  const hospitalsById = useStore((s) => s.masters.hospitals) as Record<string, { id: string; name: string; contactEmail?: string }>
  const storeHolidays = useStore((s) => s.masters.holidays) as Record<string, Holiday>
  const schedule = useStore((s) => s.schedule)
  const masters = useStore((s) => s.masters)
  const horizon = useHorizon()
  const { today } = useDemoToday()
  const hospitals = useMemo(() => Object.values(hospitalsById).sort((a, b) => a.name.localeCompare(b.name)), [hospitalsById])
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.id ?? '')
  // Opens on List, as HospitalsView does; Calendar is the other half of the switch.
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [holidays, setHolidays] = useState<Record<string, Holiday>>(storeHolidays)
  const [month, setMonth] = useState<Date>(startOfMonth(today))
  const [sheet, setSheet] = useState<{ dateISO?: string; holidayId?: string } | null>(null)
  const [result, setResult] = useState('Choose an open day to add a closure, or a closure to change or delete it.')
  const monthISO = format(month, 'yyyy-MM')
  const firstMonth = startOfMonth(parseISO(horizon.startISO))
  const lastMonth = startOfMonth(parseISO(horizon.endISO))

  const days = useMemo(() => {
    const counts = new Map((hospitalMonth({ schedule, masters }, hospitalId, monthISO) as { dateISO: string; listCount: number }[]).map((d) => [d.dateISO, d.listCount]))
    const map = new Map<string, DayInfo>()
    for (const [dateISO, listCount] of counts) map.set(dateISO, { closures: [], listCount })
    for (const h of Object.values(holidays)) {
      if (h.hospitalId !== hospitalId || !h.dateISO.startsWith(monthISO)) continue
      const d = map.get(h.dateISO) ?? { closures: [], listCount: 0 }
      d.closures.push(h)
      map.set(h.dateISO, d)
    }
    return map
  }, [schedule, masters, hospitalId, monthISO, holidays])

  const listsOn = (dateISO: string) => days.get(dateISO)?.listCount ?? 0
  const inHorizon = (d: Date) => {
    const iso = toISO(d)
    return iso >= horizon.startISO && iso <= horizon.endISO
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-3.5">
      <Header
        title="Hospitals & holidays"
        sub="Each hospital keeps its own closure calendar. A closure flags every List at that hospital on that date; editing or deleting it clears the flags. Adding a hospital also adds its Party."
        action={
          <Button variant="secondary" size="lg" onClick={() => setResult('Add hospital (stubbed: the hospital sheet is not part of this row).')}>
            Add hospital
          </Button>
        }
      />
      <ToggleGroup
        variant="teal"
        aria-label="View"
        value={[view]}
        onValueChange={(next) => {
          const v = next[0] as 'list' | 'calendar' | undefined
          if (v !== undefined) setView(v)
        }}
        className="tw:w-[240px]"
      >
        <ToggleGroupItem value="list" className="tw:flex-1">List</ToggleGroupItem>
        <ToggleGroupItem value="calendar" className="tw:flex-1">Calendar</ToggleGroupItem>
      </ToggleGroup>
      {view === 'list' ? (
        <div className="tw:flex tw:flex-col tw:gap-2.5">
          {hospitals.map((h) => {
            const own = Object.values(holidays)
              .filter((x) => x.hospitalId === h.id)
              .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
            return (
              <div key={h.id} className="tw:rounded-card tw:border tw:border-line tw:bg-surface tw:p-3.5">
                <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-3">
                  <div className="tw:min-w-0">
                    <div className="tw:text-sm tw:font-semibold">{h.name}</div>
                    <div className={cn('tw:mt-0.5 tw:text-[12.5px]', h.contactEmail !== undefined ? 'tw:text-slate' : 'tw:text-mist')}>{h.contactEmail ?? 'No contact email'}</div>
                  </div>
                  <div className="tw:flex tw:flex-none tw:gap-4">
                    <TextAction label={`Edit ${h.name}`} onClick={() => setResult(`Edit ${h.name} (stubbed: the hospital sheet is not part of this row).`)}>
                      Edit
                    </TextAction>
                    <TextAction
                      onClick={() => {
                        setHospitalId(h.id)
                        setSheet({})
                      }}
                    >
                      Add holiday
                    </TextAction>
                  </div>
                </div>
                <div className="tw:mt-2.5 tw:flex tw:flex-wrap tw:gap-1.5">
                  {own.length === 0 ? (
                    <span className="tw:text-xs tw:text-mist">No holidays recorded.</span>
                  ) : (
                    own.map((hol) => (
                      <Badge
                        key={hol.id}
                        render={<button type="button" />}
                        title={`Change or delete ${hol.name}`}
                        onClick={() => {
                          setHospitalId(h.id)
                          setSheet({ holidayId: hol.id })
                        }}
                        className="tw:cursor-pointer tw:border tw:border-line tw:bg-sunken tw:text-[11.5px] tw:font-normal tw:text-slate"
                      >
                        {dayText(hol.dateISO)} · {hol.name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
    <div className="tw:flex tw:flex-col tw:gap-3 tw:rounded-card tw:border tw:border-line tw:bg-surface tw:p-4" data-shot="hospital-calendar">
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
        <Select value={hospitalId} onValueChange={(v) => setHospitalId(String(v))} items={hospitals.map((h) => ({ value: h.id, label: h.name }))}>
          <SelectTrigger aria-label="Hospital" className="tw:h-10! tw:w-[280px] tw:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hospitals.map((h) => (
              <SelectItem key={h.id} value={h.id}>
                {h.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="tw:ml-auto tw:flex tw:items-center tw:gap-2">
          <Button variant="outline" size="icon" className="tw:size-9 tw:text-primary" aria-label="Previous month" disabled={month <= firstMonth} onClick={() => setMonth(addMonths(month, -1))}>
            <ChevronLeftIcon />
          </Button>
          <span className="tw:min-w-[130px] tw:text-center tw:text-[15px] tw:font-bold" aria-live="polite">
            {format(month, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon" className="tw:size-9 tw:text-primary" aria-label="Next month" disabled={month >= lastMonth} onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRightIcon />
          </Button>
        </div>
      </div>

      <MonthCtx.Provider value={{ days, horizon }}>
        <Calendar
          mode="single"
          month={month}
          onMonthChange={setMonth}
          startMonth={firstMonth}
          endMonth={lastMonth}
          today={today}
          weekStartsOn={1}
          showOutsideDays={false}
          hideNavigation
          disabled={(d) => !inHorizon(d) && (days.get(toISO(d))?.closures.length ?? 0) === 0}
          onDayClick={(d) => {
            const iso = toISO(d)
            const closure = days.get(iso)?.closures[0]
            setSheet(closure !== undefined ? { holidayId: closure.id } : { dateISO: iso })
          }}
          formatters={{ formatWeekdayName: (d) => format(d, 'EEE') }}
          labels={{ labelGrid: (d) => `${hospitalsById[hospitalId]?.name ?? 'Hospital'}, ${format(d, 'MMMM yyyy')}` }}
          className="tw:w-full tw:bg-transparent tw:p-0"
          classNames={{
            root: 'tw:w-full',
            months: 'tw:flex tw:flex-col',
            month: 'tw:flex tw:w-full tw:flex-col',
            month_caption: 'tw:sr-only',
            month_grid: 'tw:w-full',
            weekdays: 'tw:grid tw:grid-cols-7 tw:gap-1.5',
            weekday: 'tw:px-1 tw:text-left tw:text-[11.5px] tw:font-semibold tw:text-mist',
            week: 'tw:mt-1.5 tw:grid tw:grid-cols-7 tw:gap-1.5',
            day: 'tw:min-w-0 tw:p-0',
            today: '',
            selected: '',
            disabled: '',
            outside: '',
          }}
          components={{ DayButton: HospitalDayButton }}
        />
      </MonthCtx.Provider>
    </div>
      )}
      <Echo>{result}</Echo>

      <HolidayDialog
        sheet={sheet}
        hospitalName={hospitalsById[hospitalId]?.name ?? ''}
        holiday={sheet?.holidayId !== undefined ? holidays[sheet.holidayId] : undefined}
        today={today}
        horizon={horizon}
        listsOn={listsOn}
        onClose={() => setSheet(null)}
        onSave={(h, mode) => {
          const clash = Object.values(holidays).find((x) => x.id !== h.id && x.hospitalId === h.hospitalId && x.dateISO === h.dateISO)
          if (clash !== undefined) return `${hospitalsById[hospitalId]?.name ?? 'This hospital'} is already closed on that date (${clash.name}).`
          setHolidays((all) => ({ ...all, [h.id]: h }))
          setResult(mode === 'add' ? `Holiday added locally. ${plural(listsOn(h.dateISO), 'List')} flagged.` : `Holiday updated locally. ${plural(listsOn(h.dateISO), 'List')} flagged.`)
          setSheet(null)
          return null
        }}
        onDelete={(h) => {
          setHolidays((all) => {
            const next = { ...all }
            delete next[h.id]
            return next
          })
          setResult(`Holiday deleted locally. ${plural(listsOn(h.dateISO), 'flag')} cleared.`)
          setSheet(null)
        }}
        newId={() => `local-holiday-${Object.keys(holidays).length + 1}`}
        hospitalId={hospitalId}
      />
    </div>
  )
}

/** One day: the numeral, its closures as holiday blocks, the Lists that day and the flagged count. */
function HospitalDayButton({ day, modifiers, className, ...props }: DayButtonProps) {
  const ctx = useContext(MonthCtx)
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])
  const iso = toISO(day.date)
  const info = ctx?.days.get(iso)
  const closures = info?.closures ?? []
  const closed = closures.length > 0
  const listCount = info?.listCount ?? 0
  const inHorizon = ctx !== null && iso >= ctx.horizon.startISO && iso <= ctx.horizon.endISO
  const label = `${format(day.date, 'EEEE d MMMM')}: ${closed ? `closed, ${closures.map((c) => c.name).join(' and ')}` : 'open'}, ${plural(listCount, 'List')}`
  return (
    <button
      ref={ref}
      {...props}
      aria-label={label}
      data-calendar-day={iso}
      className={cn(
        className,
        'tw:flex tw:min-h-[84px] tw:w-full tw:flex-col tw:items-stretch tw:gap-1 tw:rounded-ctl tw:border tw:p-1.5 tw:text-left tw:outline-none tw:focus-visible:shadow-focus',
        closed ? 'tw:border-status-holiday' : 'tw:border-line',
        inHorizon ? 'tw:cursor-pointer tw:bg-surface tw:hover:bg-sunken' : 'tw:bg-background',
        !inHorizon && closed && 'tw:cursor-pointer',
        'tw:disabled:cursor-default',
      )}
    >
      <span className={cn('tw:font-mono tw:text-xs tw:font-semibold', inHorizon ? 'tw:text-ink' : 'tw:text-mist')}>{day.date.getDate()}</span>
      {closures.map((c) => (
        <span
          key={c.id}
          className="tw:truncate tw:rounded-[6px] tw:bg-status-holiday-tint tw:py-[3px] tw:pr-1.5 tw:pl-2 tw:text-[11px] tw:leading-[14px] tw:font-semibold tw:text-status-holiday-on-tint tw:shadow-[inset_3px_0_0_var(--status-holiday)]"
        >
          {c.name}
        </span>
      ))}
      <span className="tw:mt-auto tw:flex tw:flex-wrap tw:items-center tw:gap-x-1.5 tw:text-[11px] tw:text-slate">
        {listCount > 0 && <span className="tw:whitespace-nowrap">{plural(listCount, 'List')}</span>}
        {closed && listCount > 0 && (
          <span className="tw:inline-flex tw:items-center tw:gap-[3px] tw:font-semibold tw:whitespace-nowrap tw:text-warning-on-tint">
            <span aria-hidden className="tw:inline-flex tw:size-3 tw:items-center tw:justify-center tw:rounded-full tw:bg-warning tw:text-[9px] tw:leading-none tw:font-bold tw:text-white">
              !
            </span>
            {listCount} flagged
          </span>
        )}
      </span>
    </button>
  )
}

/** HolidaySheet as a shadcn Dialog: add (hospital fixed from the calendar) or change and delete, local only. */
function HolidayDialog({
  sheet,
  hospitalName,
  hospitalId,
  holiday,
  today,
  horizon,
  listsOn,
  onClose,
  onSave,
  onDelete,
  newId,
}: {
  sheet: { dateISO?: string; holidayId?: string } | null
  hospitalName: string
  hospitalId: string
  holiday: Holiday | undefined
  today: Date
  horizon: { startISO: string; endISO: string }
  listsOn: (dateISO: string) => number
  onClose: () => void
  onSave: (h: Holiday, mode: 'add' | 'edit') => string | null
  onDelete: (h: Holiday) => void
  newId: () => string
}) {
  const editing = holiday !== undefined
  const ids = { date: useId(), name: useId() }
  const [dateISO, setDateISO] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  useEffect(() => {
    if (sheet === null) return
    setDateISO(holiday?.dateISO ?? sheet.dateISO ?? '')
    setName(holiday?.name ?? '')
    setError(null)
    setConfirmDelete(false)
  }, [sheet, holiday])

  function save() {
    if (dateISO === '') return setError('Choose a date.')
    if (name.trim() === '') return setError('Enter a name for the holiday.')
    const out = onSave({ id: holiday?.id ?? newId(), hospitalId: holiday?.hospitalId ?? hospitalId, dateISO, name: name.trim() }, editing ? 'edit' : 'add')
    setError(out)
  }

  return (
    <Dialog open={sheet !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="tw:gap-3.5">
        <DialogTitle className="tw:pr-0">{editing ? 'Change a hospital holiday' : 'Add a hospital holiday'}</DialogTitle>
        <Field>
          <span className="tw:text-[11px] tw:leading-[14px] tw:font-semibold tw:tracking-[0.06em] tw:text-mist tw:uppercase">Hospital</span>
          <div className="tw:text-[15px] tw:text-ink">{hospitalName}</div>
          {editing && <FieldDescription>To close a different hospital, delete this holiday and add one there.</FieldDescription>}
        </Field>
        <Field>
          <FieldLabel htmlFor={ids.date}>Date</FieldLabel>
          <DatePicker id={ids.date} value={dateISO} onChange={setDateISO} today={today} min={horizon.startISO} max={horizon.endISO} />
        </Field>
        <Field>
          <FieldLabel htmlFor={ids.name}>Name</FieldLabel>
          <Input id={ids.name} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Planned maintenance closure" />
        </Field>
        {editing && <div className="tw:text-[12.5px] tw:text-slate">It flags {plural(listsOn(holiday.dateISO), 'List')} now. Moving or deleting it clears those flags.</div>}
        <FormAlert message={error} />
        {confirmDelete && holiday !== undefined ? (
          <div className="tw:flex tw:flex-col tw:gap-2.5">
            <div className="tw:rounded-ctl tw:bg-background tw:px-3 tw:py-2.5 tw:text-[13px]">
              Deleting {holiday.name} on {format(parseISO(holiday.dateISO), 'EEE d MMM')} clears {plural(listsOn(holiday.dateISO), 'flagged List')}.
            </div>
            <div className="tw:flex tw:gap-2">
              <Button variant="outline" size="lg" className="tw:flex-1" onClick={() => setConfirmDelete(false)}>
                Keep it
              </Button>
              <Button size="lg" className="tw:flex-1" onClick={() => onDelete(holiday)}>
                Delete holiday
              </Button>
            </div>
          </div>
        ) : editing ? (
          <div className="tw:flex tw:gap-2">
            <Button variant="outline" size="lg" className="tw:flex-1" onClick={() => setConfirmDelete(true)}>
              Delete holiday
            </Button>
            <Button size="lg" className="tw:flex-1" onClick={save}>
              Save changes
            </Button>
          </div>
        ) : (
          <Button size="cta" className="tw:w-full" onClick={save}>
            Add holiday
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
