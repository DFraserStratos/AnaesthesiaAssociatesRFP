import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import type { DateRange, DayButtonProps } from 'react-day-picker'
import { ChevronLeftIcon, ChevronRightIcon, RepeatIcon } from 'lucide-react'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { useAppStore } from '@proto/store'
import { defaultSlotStatus } from '@proto/domain/slotStatus'
import { resolveDisplayStatus, useAnaesthetistStatusChoices, useSlotStatusRecords } from '@proto/shared'
import { describeDayForScreenReaders, monthOf, shiftMonth, useAvailabilityBounds, useAvailabilityMonth } from '@proto/shared/availability'
import { sessionText } from '@proto/domain/outOfHours'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { blockClasses, Panel, StatusBadge, TONE, useTone, Wide } from './shared'

interface Session {
  slotId: string
  session: string
  displayKey: string
  note?: string
  list?: { hospitalName: string }
  series?: { line: string }
  conflict: boolean
}
interface Day {
  dateISO: string
  AM?: Session
  PM?: Session
}

type Selection = { from: string; to: string } | null

interface GridCtx {
  byDate: Map<string, Day>
  todayISO: string
  selection: Selection
  labelOf: (key: string) => string
}
const Ctx = createContext<GridCtx | null>(null)

const iso = (d: Date) => format(d, 'yyyy-MM-dd')

/**
 * My availability's month on shadcn Calendar (react-day-picker): a custom DayButton draws each day's AM
 * and PM sessions in the Web Availability cell anatomy. DayPicker brings the grid roles, arrow-key and
 * Page Up/Down movement, a visible focus ring and the bounds (this month to the schedule horizon; past
 * days and days with no sessions disabled). The right rail's editor writes to the demo data, so here it
 * only reports the selection; "Your series" is left out.
 */
export function AvailabilityMonthReplacement({ selectMode = 'shift' }: { selectMode?: 'shift' | 'range' }) {
  const f = useWebFixtures() as { anaesthetistId: string }
  const { todayISO, horizonEndISO } = useAvailabilityBounds() as { todayISO: string; horizonEndISO: string }
  const firstMonth = monthOf(todayISO) as string
  const lastMonth = monthOf(horizonEndISO) as string
  const [month, setMonth] = useState(firstMonth)
  const [selection, setSelection] = useState<Selection>(null)
  const [anchor, setAnchor] = useState<string | null>(null)
  const days = useAvailabilityMonth(f.anaesthetistId, month) as Day[]
  const byDate = useMemo(() => new Map(days.map((d) => [d.dateISO, d])), [days])
  const choices = useAnaesthetistStatusChoices() as { key: string; longLabel: string }[]
  const records = useSlotStatusRecords()
  const defaultLabel = useAppStore((s: any) => (defaultSlotStatus(s.masters.slotStatuses) as { longLabel: string }).longLabel)
  const labelOf = (key: string) => (resolveDisplayStatus(key, records) as { label: string }).label

  /** Today's gesture: a click picks one day, shift-click extends from where the range began. */
  function pickShift(dateISO: string, extend: boolean) {
    if (extend && anchor !== null) setSelection(dateISO < anchor ? { from: dateISO, to: anchor } : { from: anchor, to: dateISO })
    else {
      setAnchor(dateISO)
      setSelection({ from: dateISO, to: dateISO })
    }
  }

  const selectedRange: DateRange | undefined = selection === null ? undefined : { from: parseISO(selection.from), to: parseISO(selection.to) }
  const disabled = (d: Date) => {
    const k = iso(d)
    const day = byDate.get(k)
    return k < todayISO || (day?.AM === undefined && day?.PM === undefined)
  }
  const monthDate = parseISO(`${month}-01`)

  return (
    <Wide width={1180}>
      {/* The page header and the Find cover / My availability switch, as plain static stand-ins (the switch changes page in the prototype). */}
      <div className="tw:mb-4 tw:flex tw:flex-col tw:gap-3">
        <div>
          <h1 className="tw:m-0 tw:text-[28px] tw:leading-[34px] tw:font-bold tw:tracking-[-0.015em]">Availability</h1>
          <div className="tw:mt-1 tw:text-sm tw:text-slate">
            Mark days off weeks ahead, set repeating days off, and change or delete one occurrence. Every session is {defaultLabel} until you change it.
          </div>
        </div>
        <ToggleGroup aria-label="Availability page" value={['mine']} className="tw:self-start">
          <ToggleGroupItem value="cover" className="tw:px-6">Find cover</ToggleGroupItem>
          <ToggleGroupItem value="mine" className="tw:px-6">My availability</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="tw:grid tw:grid-cols-[minmax(0,1fr)_340px] tw:items-start tw:gap-5">
        <Panel
          title={format(monthDate, 'MMMM yyyy')}
          action={
            <div className="tw:flex tw:items-center tw:gap-1.5">
              <Button variant="outline" size="icon" aria-label="Previous month" disabled={month <= firstMonth} onClick={() => setMonth(shiftMonth(month, -1))} className="tw:size-[34px] tw:text-slate">
                <ChevronLeftIcon aria-hidden />
              </Button>
              <Button variant="outline" size="icon" aria-label="Next month" disabled={month >= lastMonth} onClick={() => setMonth(shiftMonth(month, 1))} className="tw:size-[34px] tw:text-slate">
                <ChevronRightIcon aria-hidden />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMonth(firstMonth)} className="tw:h-[34px] tw:border-primary tw:text-primary">
                This month
              </Button>
            </div>
          }
        >
          <div className="tw:-mt-1.5 tw:text-[12.5px] tw:text-mist">
            {selectMode === 'shift' ? 'Click a day to see its sessions. Shift-click another day to select the dates between.' : 'Click a day to start a range, then the last day to end it.'}
          </div>
          <Ctx.Provider value={{ byDate, todayISO, selection, labelOf }}>
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={(range, triggerDate) => {
                if (selectMode !== 'range') return
                // react-day-picker's range: the first click starts it, the second ends it, a third starts again.
                if (range?.from === undefined) setSelection({ from: iso(triggerDate), to: iso(triggerDate) })
                else setSelection({ from: iso(range.from), to: iso(range.to ?? range.from) })
              }}
              onDayClick={(d, _m, e) => {
                if (selectMode === 'shift') pickShift(iso(d), e.shiftKey)
              }}
              month={monthDate}
              onMonthChange={(d) => setMonth(format(d, 'yyyy-MM'))}
              startMonth={parseISO(`${firstMonth}-01`)}
              endMonth={parseISO(`${lastMonth}-01`)}
              disabled={disabled}
              today={parseISO(todayISO)}
              weekStartsOn={1}
              showOutsideDays={false}
              hideNavigation
              formatters={{ formatWeekdayName: (d) => format(d, 'EEE') }}
              labels={{ labelGrid: (d) => `${format(d, 'MMMM yyyy')}, your sessions` }}
              className="tw:w-full tw:bg-transparent tw:p-0"
              classNames={{
                root: 'tw:w-full',
                months: 'tw:w-full',
                month: 'tw:flex tw:w-full tw:flex-col',
                month_caption: 'tw:hidden',
                month_grid: 'tw:w-full tw:table-fixed tw:border-separate tw:border-spacing-1.5 tw:-m-1.5 tw:w-[calc(100%+12px)]',
                weekdays: '',
                weekday: 'tw:pl-1 tw:text-left tw:text-[11px] tw:font-semibold tw:tracking-[0.06em] tw:text-mist tw:uppercase',
                week: '',
                day: 'tw:p-0 tw:align-top',
                today: '',
                range_start: '',
                range_middle: '',
                range_end: '',
                selected: '',
                disabled: '',
                outside: '',
              }}
              components={{ DayButton: MonthDayButton }}
            />
          </Ctx.Provider>
        </Panel>

        <div className="tw:flex tw:flex-col tw:gap-4">
          <Panel>
            {selection === null ? (
              <div className="tw:text-sm tw:leading-5 tw:text-slate">Select a day to see its AM and PM sessions, or shift-click to select a range of days off.</div>
            ) : (
              <div role="status" className="tw:flex tw:flex-col tw:gap-1 tw:text-sm tw:leading-5">
                <span className="tw:font-semibold">
                  {selection.from === selection.to ? format(parseISO(selection.from), 'EEEE d MMMM') : `${format(parseISO(selection.from), 'EEE d MMM')} to ${format(parseISO(selection.to), 'EEE d MMM')}`}
                </span>
                <span className="tw:text-[12.5px] tw:text-mist">The session editor saves to the demo data, so it is left out of this preview. Every session is {defaultLabel} until changed.</span>
              </div>
            )}
          </Panel>
          <Panel title="Legend">
            <div className="tw:flex tw:flex-wrap tw:gap-1.5">
              {choices.map((s) => (
                <StatusBadge key={s.key} status={s.key} label={s.longLabel} />
              ))}
            </div>
            <div className="tw:text-[12.5px] tw:text-mist">A session holding a List shows the List in place of its status.</div>
          </Panel>
        </div>
      </div>
    </Wide>
  )
}

/** A day: its number, then the AM and PM cells. Selected is teal outline on teal tint; today is crimson outline. */
function MonthDayButton({ day, modifiers, className, ...props }: DayButtonProps) {
  const ctx = useContext(Ctx)
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])
  if (ctx === null) return <button {...props} />
  const dateISO = iso(day.date)
  const data = ctx.byDate.get(dateISO)
  const past = dateISO < ctx.todayISO
  const isToday = modifiers.today === true
  const selected = ctx.selection !== null && dateISO >= ctx.selection.from && dateISO <= ctx.selection.to
  return (
    <button
      ref={ref}
      {...props}
      data-date={dateISO}
      aria-pressed={selected}
      aria-current={isToday ? 'date' : undefined}
      aria-label={describeDayForScreenReaders(dateISO, data, ctx.labelOf, past)}
      className={cn(
        className,
        'tw:flex tw:w-full tw:min-w-0 tw:flex-col tw:gap-1 tw:rounded-[12px] tw:bg-surface tw:p-1.5 tw:text-left tw:outline-none tw:[font:inherit]',
        'tw:focus-visible:shadow-focus',
        selected ? 'tw:border-2 tw:border-primary tw:bg-teal-tint' : isToday ? 'tw:border-2 tw:border-brand' : 'tw:m-px tw:w-[calc(100%-2px)] tw:border tw:border-line',
        past && 'tw:opacity-45',
        props.disabled !== true && 'tw:cursor-pointer',
      )}
    >
      <span className={cn('tw:font-mono tw:text-xs', isToday ? 'tw:font-bold tw:text-brand' : 'tw:font-semibold tw:text-slate')}>{day.date.getDate()}</span>
      <SessionCell session={data?.AM} />
      <SessionCell session={data?.PM} />
    </button>
  )
}

function SessionCell({ session }: { session: Session | undefined }) {
  const tone = useTone(session?.displayKey ?? '')
  if (session === undefined) return <span aria-hidden className="tw:h-[34px] tw:rounded-[7px] tw:bg-sunken" />
  const line2 = session.list !== undefined ? session.list.hospitalName : (session.series?.line ?? session.note ?? '')
  const text = TONE[tone.token].text
  return (
    <span data-slot-id={session.slotId} className={cn('tw:relative tw:flex tw:h-[34px] tw:min-w-0 tw:flex-col tw:justify-center tw:rounded-[7px] tw:pr-1.5 tw:pl-[7px]', blockClasses(tone))}>
      <span className={cn('tw:flex tw:items-center tw:gap-1 tw:overflow-hidden tw:text-[11px] tw:font-semibold tw:whitespace-nowrap', text)}>
        <span className="tw:font-mono tw:text-[9.5px] tw:opacity-75">{sessionText(session.session)}</span>
        <span className="tw:truncate">{tone.label}</span>
        {session.series !== undefined && <RepeatIcon aria-label="Repeating" className="tw:size-2.5 tw:flex-none" strokeWidth={2.6} />}
      </span>
      {line2 !== '' && <span className={cn('tw:truncate tw:text-[10px] tw:opacity-75', text)}>{line2}</span>}
      {session.conflict && (
        <span title="This List has a conflict for the office to resolve" className="tw:absolute tw:-top-[5px] tw:-right-[5px] tw:flex tw:size-3.5 tw:items-center tw:justify-center tw:rounded-pill tw:bg-warning tw:text-[9px] tw:font-bold tw:text-white">
          !
        </span>
      )}
    </span>
  )
}
