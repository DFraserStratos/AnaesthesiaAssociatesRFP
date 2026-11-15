import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { addMonths, format, parseISO, startOfMonth } from 'date-fns'
import type { DayButtonProps, MonthCaptionProps } from 'react-day-picker'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useSeedIds } from '@proto/apps/demo/catalogue/admin/adminData'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { WarningsToDoReplacement } from '../a-overlays/WarningsToDo'

/** The prototype rail's width (ADMIN_RIGHT_RAIL_WIDTH: 440 drawer less the 28 page inset). */
const RAIL_WIDTH = 412

/**
 * The admin right rail's month calendar on shadcn Calendar (react-day-picker 10). The day grid,
 * Monday-first weeks, ISO week number, and the keyboard (arrows, Home/End within the week, Page Up
 * and Down by month, Shift for a year) are DayPicker's own. The day cells are a custom DayButton
 * kept at the rail's compact size, today filled crimson and the selected day outlined crimson, as
 * the prototype draws them. No navigation limits, as today. The rail's To-do, notes and Awaiting
 * review cards are left out: this row is about the calendar.
 */
export function MiniCalendarReplacement({ arrowsMoveSelection = true }: { arrowsMoveSelection?: boolean }) {
  const { todayISO } = useSeedIds() as { todayISO: string }
  const today = parseISO(todayISO)
  const [selected, setSelected] = useState<Date>(today)
  const [month, setMonth] = useState<Date>(startOfMonth(today))

  /** The rail's arrows move the day view to the 1st of the next or previous month, as the prototype's do. */
  function stepMonth(delta: number) {
    const first = startOfMonth(addMonths(month, delta))
    // react-day-picker's own arrows change the shown month only; today's rail moves the day too.
    if (arrowsMoveSelection) setSelected(first)
    setMonth(first)
  }

  return (
    <div>
      <div role="status" className="tw:mt-2 tw:min-h-[18px] tw:text-[12.5px] tw:text-slate">
        Selected {format(selected, 'yyyy-MM-dd')}
      </div>
      <div
        className="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-card tw:border tw:border-line tw:bg-surface tw:p-4"
        style={{ width: RAIL_WIDTH }}
      >
        <RailContext.Provider value={{ selected, onStep: stepMonth }}>
        <Calendar
          mode="single"
          required
          selected={selected}
          onSelect={(d) => {
            setSelected(d)
            setMonth(startOfMonth(d))
          }}
          month={month}
          onMonthChange={setMonth}
          today={today}
          weekStartsOn={1}
          ISOWeek
          showOutsideDays={false}
          hideNavigation
          formatters={{ formatWeekdayName: (d) => format(d, 'EEEEE') }}
          labels={{ labelGrid: (d) => `${format(d, 'MMMM yyyy')} calendar` }}
          className="tw:w-full tw:bg-transparent tw:p-0"
          classNames={{
            root: 'tw:w-full',
            months: 'tw:relative tw:flex tw:flex-col',
            month: 'tw:flex tw:w-full tw:flex-col tw:gap-2.5',
            month_caption: 'tw:flex tw:w-full',
            weekdays: 'tw:grid tw:grid-cols-7 tw:gap-0.5',
            weekday: 'tw:py-[3px] tw:text-center tw:text-[9.5px] tw:leading-[normal] tw:font-semibold tw:text-mist tw:select-none',
            week: 'tw:mt-0.5 tw:grid tw:grid-cols-7 tw:gap-0.5',
            day: 'tw:p-0 tw:text-center',
            today: '',
            outside: '',
          }}
          components={{
            MonthCaption: RailCaption,
            DayButton: RailDayButton,
          }}
        />
        </RailContext.Provider>
      </div>
      {/* The rail's To-do card below the calendar, reusing the WarningsToDo row's replacement so the comparison is like for like. */}
      <div className="tw:mt-3" style={{ width: RAIL_WIDTH }}>
        <WarningsToDoReplacement />
      </div>
    </div>
  )
}

/** The caption reads the selection and the arrows' handler from here, so DayPicker gets a stable component. */
const RailContext = createContext<{ selected: Date; onStep: (delta: number) => void } | null>(null)

function RailCaption({ calendarMonth }: MonthCaptionProps) {
  const ctx = useContext(RailContext)
  if (ctx === null) return <></>
  const { selected, onStep } = ctx
  return (
    <div className="tw:flex tw:w-full tw:items-center tw:justify-between">
      <div className="tw:flex tw:items-center tw:gap-1">
        <Button variant="outline" size="icon-xs" aria-label="Previous month" onClick={() => onStep(-1)} className="tw:size-[22px] tw:rounded-[6px]! tw:text-slate">
          <ChevronLeftIcon className="tw:size-3.5" />
        </Button>
        <span className="tw:text-sm tw:font-semibold" aria-live="polite">
          {format(calendarMonth.date, 'MMMM yyyy')}
        </span>
        <Button variant="outline" size="icon-xs" aria-label="Next month" onClick={() => onStep(1)} className="tw:size-[22px] tw:rounded-[6px]! tw:text-slate">
          <ChevronRightIcon className="tw:size-3.5" />
        </Button>
      </div>
      <span className="tw:text-[11px] tw:text-mist">week {format(selected, 'II')}</span>
    </div>
  )
}

/** The compact rail day: 24px tall, 11px figures; today filled crimson, the selected day outlined crimson. */
function RailDayButton({ day, modifiers, className, ...props }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])
  const isToday = modifiers.today === true
  const isSelected = modifiers.selected === true
  return (
    <button
      ref={ref}
      {...props}
      aria-current={isToday ? 'date' : undefined}
      aria-label={format(day.date, 'EEEE d MMMM yyyy')}
      className={cn(
        className,
        'tw:relative tw:h-6 tw:w-full tw:cursor-pointer tw:rounded-[6px] tw:border tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[11px] tw:leading-6 tw:text-ink tw:outline-none',
        'tw:focus-visible:z-10 tw:focus-visible:shadow-focus',
        !isToday && 'tw:hover:bg-sunken',
        isSelected && !isToday && 'tw:border-brand',
        isToday && 'tw:bg-brand tw:font-bold tw:text-white',
      )}
    />
  )
}
