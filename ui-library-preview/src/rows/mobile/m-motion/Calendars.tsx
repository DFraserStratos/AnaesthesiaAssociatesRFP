import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { addDays, format, parseISO, startOfMonth } from 'date-fns'
import type { DayButtonProps, MonthCaptionProps } from 'react-day-picker'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Repeat } from 'lucide-react'
import { isOpenSlotView, listDaysFor, slotViewsForDate, useAppStore, useToday } from '@proto/store'
import { useLookbackBounds } from '@proto/shared/schedule'
import { describeDayForScreenReaders, monthOf, useAvailabilityBounds, useAvailabilityMonth } from '@proto/shared/availability'
import { resolveDisplayStatus, useDisplayStatus, useSlotStatusRecords } from '@proto/shared'
import { dayWithYear, longDay } from '@proto/shared/format'
import { sessionText } from '@proto/domain/outOfHours'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { blockFillStyle, ON_TINT, Said, tokenOf, useMobilePersona, type ResolvedStatus } from './shared'

const iso = (d: Date) => format(d, 'yyyy-MM-dd')
const monthDate = (monthISO: string) => parseISO(`${monthISO}-01`)

// ===========================================================================
// MonthGrid (LookbackDateSheet): Drawer + Calendar
// ===========================================================================

interface LookbackCtx {
  selectedISO: string | null
  listsOn: (dateISO: string) => number
  firstMonth: string
  lastMonth: string
  pickerOpen: boolean
  onTogglePicker: () => void
  onStep: (delta: number) => void
}
const LookbackContext = createContext<LookbackCtx | null>(null)

/** A 44px round month button, as the prototype's RoundButton (outline, teal-pressed glyph). */
function RoundButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="tw:size-11 tw:flex-none tw:rounded-pill! tw:text-teal-pressed tw:disabled:text-line-strong"
    >
      {children}
    </Button>
  )
}

/** Today's header: previous, the title that opens the month and year panel, next. */
function LookbackCaption({ calendarMonth }: MonthCaptionProps) {
  const ctx = useContext(LookbackContext)
  if (ctx === null) return <></>
  const m = monthOf(iso(calendarMonth.date))
  return <LookbackHeader monthISO={m} ctx={ctx} />
}

function LookbackHeader({ monthISO, ctx }: { monthISO: string; ctx: LookbackCtx }) {
  const title = format(monthDate(monthISO), 'MMMM yyyy')
  return (
    <div className="tw:flex tw:w-full tw:items-center tw:gap-2">
      <RoundButton label="Previous month" disabled={monthISO <= ctx.firstMonth} onClick={() => ctx.onStep(-1)}>
        <ChevronLeft className="tw:size-[18px]" aria-hidden />
      </RoundButton>
      <button
        type="button"
        aria-expanded={ctx.pickerOpen}
        aria-label={`${title}. Choose a month and year`}
        onClick={ctx.onTogglePicker}
        className="tw:inline-flex tw:min-h-11 tw:flex-1 tw:cursor-pointer tw:items-center tw:justify-center tw:gap-1 tw:rounded-ctl tw:border-0 tw:bg-transparent tw:p-0 tw:text-[17px] tw:font-bold tw:text-ink tw:outline-none tw:focus-visible:shadow-focus"
      >
        {title}
        {ctx.pickerOpen ? <ChevronUp className="tw:size-4 tw:text-primary" aria-hidden /> : <ChevronDown className="tw:size-4 tw:text-primary" aria-hidden />}
      </button>
      <RoundButton label="Next month" disabled={monthISO >= ctx.lastMonth} onClick={() => ctx.onStep(1)}>
        <ChevronRight className="tw:size-[18px]" aria-hidden />
      </RoundButton>
    </div>
  )
}

/** The day: mono numeral (teal and bold when today or picked) over a slate dot when she has a List. */
function LookbackDayButton({ day, modifiers, className, ...props }: DayButtonProps) {
  const ctx = useContext(LookbackContext)
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus({ preventScroll: true })
  }, [modifiers.focused])
  const d = iso(day.date)
  const n = ctx?.listsOn(d) ?? 0
  const today = modifiers.today === true
  const picked = ctx?.selectedISO === d
  return (
    <button
      ref={ref}
      {...props}
      aria-label={`${longDay(d)}, ${n === 0 ? 'no Lists' : `${n} ${n === 1 ? 'List' : 'Lists'}`}`}
      aria-current={today ? 'date' : undefined}
      className={cn(
        className,
        'tw:flex tw:min-h-11 tw:w-full tw:min-w-0 tw:cursor-pointer tw:flex-col tw:items-center tw:justify-center tw:gap-[3px] tw:rounded-ctl tw:border-[1.5px] tw:border-transparent tw:bg-surface tw:p-0 tw:outline-none',
        'tw:focus-visible:z-10 tw:focus-visible:shadow-focus tw:disabled:cursor-default tw:disabled:opacity-35',
        today && 'tw:border-primary',
      )}
    >
      <span className={cn('tw:font-mono tw:text-sm tw:leading-4 tw:tabular-nums', today || picked ? 'tw:font-bold tw:text-primary' : 'tw:font-medium tw:text-ink')}>{day.date.getDate()}</span>
      <span aria-hidden className={cn('tw:size-[5px] tw:rounded-pill', n > 0 ? 'tw:bg-slate' : 'tw:bg-transparent')} />
    </button>
  )
}

/** The month and year panel: a year stepper over twelve month chips (bounded). */
function MonthYearPanel({ monthISO, firstMonth, lastMonth, onPick }: { monthISO: string; firstMonth: string; lastMonth: string; onPick: (m: string) => void }) {
  const [year, setYear] = useState(Number(monthISO.slice(0, 4)))
  const firstYear = Number(firstMonth.slice(0, 4))
  const lastYear = Number(lastMonth.slice(0, 4))
  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      <div className="tw:flex tw:items-center tw:justify-center tw:gap-4">
        <RoundButton label="Previous year" disabled={year <= firstYear} onClick={() => setYear((y) => y - 1)}>
          <ChevronLeft className="tw:size-[18px]" aria-hidden />
        </RoundButton>
        <span aria-live="polite" className="tw:min-w-14 tw:text-center tw:font-mono tw:text-[17px] tw:font-bold tw:tabular-nums">
          {year}
        </span>
        <RoundButton label="Next year" disabled={year >= lastYear} onClick={() => setYear((y) => y + 1)}>
          <ChevronRight className="tw:size-[18px]" aria-hidden />
        </RoundButton>
      </div>
      <ToggleGroup
        aria-label={`Months of ${year}`}
        value={[monthISO]}
        onValueChange={(v: unknown[]) => {
          const m = v[0]
          if (typeof m === 'string') onPick(m)
        }}
        className="tw:grid! tw:w-full tw:grid-cols-4 tw:gap-2 tw:bg-transparent tw:p-0"
      >
        {Array.from({ length: 12 }, (_, i) => {
          const m = `${year}-${String(i + 1).padStart(2, '0')}`
          const enabled = m >= firstMonth && m <= lastMonth
          return (
            <ToggleGroupItem
              key={m}
              value={m}
              disabled={!enabled}
              aria-label={format(monthDate(m), 'MMMM yyyy')}
              className="tw:h-11 tw:rounded-pill! tw:border tw:border-line tw:bg-surface tw:text-[13px] tw:text-slate tw:aria-pressed:border-transparent tw:aria-pressed:bg-primary tw:aria-pressed:text-white tw:data-pressed:bg-primary tw:data-pressed:text-white tw:disabled:text-line-strong"
            >
              {format(monthDate(m), 'MMM')}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </div>
  )
}

function LookbackSheetBody({ caption, todayISO, selectedISO, onPick }: { caption: 'panel' | 'dropdown'; todayISO: string; selectedISO: string | null; onPick: (d: string) => void }) {
  const { anaesthetistId } = useMobilePersona()
  const schedule = useAppStore((s: { schedule: unknown }) => s.schedule)
  const bounds = useLookbackBounds(anaesthetistId) as { firstISO: string; lastISO: string }
  const wanted = selectedISO ?? todayISO
  const start = wanted < bounds.firstISO ? bounds.firstISO : wanted > bounds.lastISO ? bounds.lastISO : wanted
  const [monthISO, setMonthISO] = useState(monthOf(start) as string)
  const [picker, setPicker] = useState(false)
  const firstMonth = monthOf(bounds.firstISO) as string
  const lastMonth = monthOf(bounds.lastISO) as string
  const days = useMemo(
    () => new Map((listDaysFor({ schedule }, anaesthetistId, monthISO) as { dateISO: string; lists: number }[]).map((d) => [d.dateISO, d.lists])),
    [schedule, anaesthetistId, monthISO],
  )
  const ctx: LookbackCtx = {
    selectedISO,
    listsOn: (d) => days.get(d) ?? 0,
    firstMonth,
    lastMonth,
    pickerOpen: picker,
    onTogglePicker: () => setPicker((p) => !p),
    onStep: (delta) => setMonthISO((m) => monthOf(iso(addDays(startOfMonth(monthDate(m)), delta > 0 ? 32 : -1))) as string),
  }
  const todayInBounds = todayISO >= bounds.firstISO && todayISO <= bounds.lastISO
  const first = parseISO(bounds.firstISO)
  const last = parseISO(bounds.lastISO)

  return (
    <LookbackContext.Provider value={ctx}>
      <div className="tw:flex tw:flex-col tw:gap-3">
        {caption === 'panel' && picker ? (
          <>
            <LookbackHeader monthISO={monthISO} ctx={ctx} />
            <MonthYearPanel
              monthISO={monthISO}
              firstMonth={firstMonth}
              lastMonth={lastMonth}
              onPick={(m) => {
                setMonthISO(m)
                // Close the panel after the click finishes: unmounting the chip mid-press reads as an outside press to the Drawer.
                window.setTimeout(() => setPicker(false), 0)
              }}
            />
          </>
        ) : (
          <Calendar
            mode="single"
            selected={selectedISO !== null ? parseISO(selectedISO) : undefined}
            onDayClick={(d: Date) => onPick(iso(d))}
            month={monthDate(monthISO)}
            onMonthChange={(d: Date) => setMonthISO(monthOf(iso(d)) as string)}
            startMonth={first}
            endMonth={last}
            disabled={[{ before: first }, { after: last }]}
            today={parseISO(todayISO)}
            weekStartsOn={1}
            showOutsideDays={false}
            hideNavigation={caption === 'panel'}
            captionLayout={caption === 'dropdown' ? 'dropdown' : 'label'}
            formatters={{ formatWeekdayName: (d: Date) => format(d, 'EEEEE') }}
            labels={{ labelGrid: (d: Date) => `${format(d, 'MMMM yyyy')}, your Lists` }}
            className="tw:w-full tw:bg-transparent tw:p-0"
            classNames={{
              root: 'tw:w-full',
              months: 'tw:relative tw:flex tw:flex-col',
              month: 'tw:flex tw:w-full tw:flex-col tw:gap-3',
              weekdays: 'tw:grid tw:grid-cols-7 tw:gap-1',
              weekday: 'tw:text-center tw:text-[10.5px] tw:font-semibold tw:text-mist tw:select-none',
              week: 'tw:mt-1 tw:grid tw:grid-cols-7 tw:gap-1',
              day: 'tw:p-0 tw:text-center',
              today: '',
              disabled: '',
              ...(caption === 'panel' ? { month_caption: 'tw:flex tw:w-full' } : {}),
            }}
            components={caption === 'panel' ? { MonthCaption: LookbackCaption, DayButton: LookbackDayButton } : { DayButton: LookbackDayButton }}
          />
        )}
        <Button
          variant="outline"
          disabled={!todayInBounds}
          onClick={() => {
            setPicker(false)
            setMonthISO(monthOf(todayISO) as string)
          }}
          className="tw:h-11 tw:self-center tw:rounded-pill! tw:border-primary tw:px-[18px] tw:text-sm tw:text-primary"
        >
          Today
        </Button>
      </div>
    </LookbackContext.Provider>
  )
}

export function LookbackDateSheetReplacement({ caption }: { caption: 'panel' | 'dropdown' }) {
  const todayISO = useToday() as string
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  return (
    <>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        Go to a date
      </Button>
      <Said line={picked !== null ? `Picked ${dayWithYear(picked)}` : null} />
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <div className="tw:flex tw:flex-col tw:gap-3 tw:overflow-auto tw:px-5 tw:pb-[max(calc(var(--aa-inset-bottom,34px)+2px),20px)]">
            <div>
              <DrawerTitle className="tw:text-[17px]">Go to a date</DrawerTitle>
              <DrawerDescription className="tw:mt-0.5 tw:text-[13px] tw:text-slate">A dot marks a day with one of your Lists.</DrawerDescription>
            </div>
            {open && (
              <LookbackSheetBody
                caption={caption}
                todayISO={todayISO}
                selectedISO={picked}
                onPick={(d) => {
                  setOpen(false)
                  setPicked(d)
                }}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

// ===========================================================================
// HalfBlock (shared by the month grid and its own row)
// ===========================================================================

export interface CalendarSession {
  slotId: string
  session: string
  displayKey: string
  series?: { id: string; line: string }
  conflict?: boolean
}

/** One session's bar: the status block fill, a repeat glyph for a series, an amber ! for a flag. */
export function HalfBlockView({ session, className }: { session: CalendarSession | undefined; className?: string }) {
  const resolved = useDisplayStatus(session?.displayKey ?? '') as ResolvedStatus
  if (session === undefined) return <span aria-hidden className={cn('tw:block tw:h-[18px] tw:rounded-[5px] tw:bg-sunken', className)} />
  const { token, treatment } = tokenOf(resolved)
  return (
    <span
      data-slot-id={session.slotId}
      className={cn('tw:relative tw:box-border tw:flex tw:h-[18px] tw:items-center tw:justify-end tw:rounded-[5px] tw:pr-0.5', ON_TINT[token], className)}
      style={blockFillStyle(token, treatment)}
    >
      {session.series !== undefined && <Repeat className="tw:size-[9px]" strokeWidth={2.6} aria-hidden />}
      {session.conflict === true && (
        <span aria-hidden className="tw:absolute tw:-top-1 tw:-right-1 tw:flex tw:size-[11px] tw:items-center tw:justify-center tw:rounded-pill tw:bg-warning tw:text-[8px] tw:font-bold tw:leading-none tw:text-white">
          !
        </span>
      )}
    </span>
  )
}

/** "AM Private list", "PM Away" (what the prototype's title attribute says). */
export function useHalfBlockLabel(session: CalendarSession | undefined): string {
  const resolved = useDisplayStatus(session?.displayKey ?? '') as ResolvedStatus
  if (session === undefined) return 'No session'
  const extras = [session.series !== undefined ? session.series.line : null, session.conflict === true ? 'Flagged' : null].filter((p): p is string => p !== null)
  return [`${sessionText(session.session)} ${resolved.label}`, ...extras].join(' · ')
}

// ===========================================================================
// My calendar month grid: Calendar with a custom day of two half-blocks
// ===========================================================================

interface CalendarDay {
  dateISO: string
  AM?: CalendarSession
  PM?: CalendarSession
}

interface MyCalCtx {
  byDate: Map<string, CalendarDay>
  todayISO: string
  labelOf: (key: string) => string
  firstMonth: string
  lastMonth: string
  onStep: (delta: number) => void
}
const MyCalContext = createContext<MyCalCtx | null>(null)

function MyCalCaption({ calendarMonth }: MonthCaptionProps) {
  const ctx = useContext(MyCalContext)
  if (ctx === null) return <></>
  const m = monthOf(iso(calendarMonth.date)) as string
  return (
    <div className="tw:flex tw:w-full tw:items-center tw:justify-between tw:gap-3">
      <div>
        <h3 className="tw:m-0 tw:text-2xl tw:leading-[30px] tw:font-bold tw:tracking-[-0.01em]" aria-live="polite">
          {format(calendarMonth.date, 'MMMM yyyy')}
        </h3>
        <div className="tw:mt-0.5 tw:text-[13px] tw:text-slate">My calendar · tap a day to change it</div>
      </div>
      <div className="tw:flex tw:gap-2">
        <RoundButton label="Previous month" disabled={m <= ctx.firstMonth} onClick={() => ctx.onStep(-1)}>
          <ChevronLeft className="tw:size-[18px]" aria-hidden />
        </RoundButton>
        <RoundButton label="Next month" disabled={m >= ctx.lastMonth} onClick={() => ctx.onStep(1)}>
          <ChevronRight className="tw:size-[18px]" aria-hidden />
        </RoundButton>
      </div>
    </div>
  )
}

/** The day: mono numeral (crimson and bold for today, the identity mark it carries today) over the AM and PM bars. */
function MyCalDayButton({ day, modifiers, className, ...props }: DayButtonProps) {
  const ctx = useContext(MyCalContext)
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus({ preventScroll: true })
  }, [modifiers.focused])
  if (ctx === null) return <></>
  const d = iso(day.date)
  const cal = ctx.byDate.get(d)
  const past = d < ctx.todayISO
  const isToday = d === ctx.todayISO
  return (
    <button
      ref={ref}
      {...props}
      aria-label={describeDayForScreenReaders(d, cal, ctx.labelOf, past) as string}
      aria-current={isToday ? 'date' : undefined}
      data-date={d}
      className={cn(
        className,
        'tw:flex tw:w-full tw:min-w-0 tw:cursor-pointer tw:flex-col tw:gap-[3px] tw:rounded-ctl tw:border-[1.5px] tw:border-transparent tw:bg-surface tw:p-[3px] tw:outline-none',
        'tw:focus-visible:z-10 tw:focus-visible:shadow-focus tw:disabled:cursor-default',
        past && 'tw:opacity-[0.42]',
        isToday && 'tw:border-brand',
      )}
    >
      <span className={cn('tw:pl-0.5 tw:text-left tw:font-mono tw:text-[11px] tw:leading-[13px] tw:tabular-nums', isToday ? 'tw:font-bold tw:text-brand' : 'tw:font-semibold tw:text-slate')}>
        {day.date.getDate()}
      </span>
      <HalfBlockView session={cal?.AM} />
      <HalfBlockView session={cal?.PM} />
    </button>
  )
}

export function MyCalendarGridReplacement() {
  const { anaesthetistId } = useMobilePersona()
  const { todayISO, horizonEndISO } = useAvailabilityBounds() as { todayISO: string; horizonEndISO: string }
  const firstMonth = monthOf(todayISO) as string
  const lastMonth = monthOf(horizonEndISO) as string
  const [monthISO, setMonthISO] = useState(firstMonth)
  const days = useAvailabilityMonth(anaesthetistId, monthISO) as CalendarDay[]
  const byDate = useMemo(() => new Map(days.map((d) => [d.dateISO, d])), [days])
  const records = useSlotStatusRecords()
  const [line, setLine] = useState<string | null>(null)
  const ctx: MyCalCtx = {
    byDate,
    todayISO,
    labelOf: (key) => (resolveDisplayStatus(key, records) as ResolvedStatus).label,
    firstMonth,
    lastMonth,
    onStep: (delta) => setMonthISO((m) => monthOf(iso(addDays(startOfMonth(monthDate(m)), delta > 0 ? 32 : -1))) as string),
  }
  const isInert = (d: Date) => {
    const dI = iso(d)
    const cal = byDate.get(dI)
    return dI < todayISO || (cal?.AM === undefined && cal?.PM === undefined)
  }
  return (
    <MyCalContext.Provider value={ctx}>
      <Calendar
        onDayClick={(d: Date) => setLine(`Would open the sheet for ${dayWithYear(iso(d))}.`)}
        month={monthDate(monthISO)}
        onMonthChange={(d: Date) => setMonthISO(monthOf(iso(d)) as string)}
        startMonth={monthDate(firstMonth)}
        endMonth={monthDate(lastMonth)}
        disabled={isInert}
        today={parseISO(todayISO)}
        weekStartsOn={1}
        showOutsideDays={false}
        hideNavigation
        formatters={{ formatWeekdayName: (d: Date) => format(d, 'EEEEE') }}
        labels={{ labelGrid: (d: Date) => `${format(d, 'MMMM yyyy')}, your sessions` }}
        className="tw:w-full tw:bg-transparent tw:p-0"
        classNames={{
          root: 'tw:w-full',
          months: 'tw:relative tw:flex tw:flex-col',
          month: 'tw:flex tw:w-full tw:flex-col tw:gap-2.5',
          month_caption: 'tw:flex tw:w-full',
          weekdays: 'tw:grid tw:grid-cols-7 tw:gap-1',
          weekday: 'tw:text-center tw:text-[10.5px] tw:font-semibold tw:text-mist tw:select-none',
          week: 'tw:mt-1 tw:grid tw:grid-cols-7 tw:gap-1',
          day: 'tw:p-0',
          today: '',
          disabled: '',
        }}
        components={{ MonthCaption: MyCalCaption, DayButton: MyCalDayButton }}
      />
      <Said line={line} />
    </MyCalContext.Provider>
  )
}

// ===========================================================================
// 6-day date strip: ToggleGroup (single, radio-like)
// ===========================================================================

function useSlotState() {
  const lists = useAppStore((s: { schedule: { lists: unknown } }) => s.schedule.lists)
  const slots = useAppStore((s: { schedule: { slots: unknown } }) => s.schedule.slots)
  const appSettings = useAppStore((s: { appSettings: unknown }) => s.appSettings)
  const slotStatuses = useAppStore((s: { masters: { slotStatuses: unknown } }) => s.masters.slotStatuses)
  return useMemo(() => ({ schedule: { slots, lists }, appSettings, masters: { slotStatuses } }), [slots, lists, appSettings, slotStatuses])
}

export function DateStripReplacement() {
  const todayISO = useToday() as string
  const slotState = useSlotState()
  const [selected, setSelected] = useState(todayISO)
  const days = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = iso(addDays(parseISO(todayISO), i))
      const hasFree = (slotViewsForDate(slotState, d) as unknown[]).some((v) => isOpenSlotView(v) as boolean)
      return { dateISO: d, dow: format(parseISO(d), 'EEE').toUpperCase(), date: format(parseISO(d), 'd'), hasFree }
    })
  }, [todayISO, slotState])
  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      <ToggleGroup
        aria-label="Day"
        value={[selected]}
        onValueChange={(v: unknown[]) => {
          const next = v[0]
          if (typeof next === 'string') setSelected(next)
        }}
        className="tw:w-full tw:gap-[7px] tw:bg-transparent tw:p-0"
      >
        {days.map((d) => (
          <ToggleGroupItem
            key={d.dateISO}
            value={d.dateISO}
            data-date={d.dateISO}
            aria-label={`${longDay(d.dateISO)}${d.hasFree ? ', a free session' : ''}`}
            aria-current={d.dateISO === todayISO ? 'date' : undefined}
            className="tw:group/day tw:h-auto tw:min-w-0 tw:flex-col tw:gap-[3px] tw:rounded-[12px]! tw:bg-surface tw:px-0 tw:py-[9px] tw:hover:bg-surface tw:aria-pressed:bg-primary tw:data-pressed:bg-primary"
          >
            <span className="tw:text-[10px] tw:leading-[normal] tw:font-semibold tw:tracking-[0.04em] tw:text-mist tw:group-data-pressed/day:text-white/70">{d.dow}</span>
            <span className="tw:font-mono tw:text-[17px] tw:leading-[normal] tw:font-bold tw:text-ink tw:tabular-nums tw:group-data-pressed/day:text-white">{d.date}</span>
            <span
              aria-hidden
              className={cn('tw:size-[5px] tw:rounded-pill', d.hasFree ? 'tw:bg-status-free tw:group-data-pressed/day:bg-[color-mix(in_srgb,var(--status-free)_45%,white)]' : 'tw:bg-transparent')}
            />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <span className="tw:text-[12.5px] tw:leading-[normal] tw:text-mist">Selected {dayWithYear(selected)}. A dot marks a day with a free session.</span>
    </div>
  )
}
