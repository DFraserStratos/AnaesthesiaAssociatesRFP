import { useEffect, useState } from 'react'
import { format, isValid, parse, parseISO } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DatePickerTrigger, dayText } from '../../shared/DatePickerTrigger'
import { Calendar } from '@/components/ui/calendar'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/** "2026-07-21" from a Date, in local time (never through toISOString). */
export function toISO(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/** A Date from "2026-07-21", or undefined when blank or not a real day. */
export function fromISO(iso: string | undefined): Date | undefined {
  if (iso === undefined || iso === '') return undefined
  const d = parseISO(iso)
  return isValid(d) ? d : undefined
}

/** What the office may type: Tue 21 Jul 2026, 21 Jul 2026, 21/07/2026, 21/7/26 or 2026-07-21. */
const TYPED_FORMATS = ['EEE d MMM yyyy', 'EEEE d MMMM yyyy', 'd MMM yyyy', 'd MMMM yyyy', 'd/M/yyyy', 'd/M/yy', 'yyyy-MM-dd']

export function parseTyped(text: string, reference: Date): Date | undefined {
  const t = text.trim()
  for (const f of TYPED_FORMATS) {
    const d = parse(t, f, reference)
    if (isValid(d) && d.getFullYear() > 1900) return d
  }
  return undefined
}

export interface DatePickerProps {
  /** ISO day, or '' for none. */
  value: string
  onChange: (iso: string) => void
  /** The demo clock's today (DEMO_TODAY), outlined in the grid. */
  today: Date
  /** Earliest and latest choosable days (ISO), and the months the grid may page to. */
  min?: string
  max?: string
  /** Type the date into the field as well as picking it (the trigger is then the calendar icon). */
  typed?: boolean
  size?: 'default' | 'sm'
  id?: string
  'aria-label'?: string
  'aria-describedby'?: string
  invalid?: boolean
  placeholder?: string
  className?: string
}

/**
 * The shadcn Date Picker: a Popover holding the branded Calendar (react-day-picker). Monday-first
 * weeks, today from the demo clock, bounds from the caller (the schedule horizon, or none for a
 * dated price). `typed` keeps a text field the office can type into, with the calendar on the icon.
 */
export function DatePicker({
  value,
  onChange,
  today,
  min,
  max,
  typed = false,
  size = 'default',
  id,
  invalid,
  placeholder,
  className,
  ...aria
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = fromISO(value)
  const minDate = fromISO(min)
  const maxDate = fromISO(max)
  const sm = size === 'sm'

  const calendar = (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={(d) => {
        if (d !== undefined) onChange(toISO(d))
        setOpen(false)
      }}
      defaultMonth={selected ?? today}
      today={today}
      weekStartsOn={1}
      startMonth={minDate}
      endMonth={maxDate}
      disabled={[...(minDate !== undefined ? [{ before: minDate }] : []), ...(maxDate !== undefined ? [{ after: maxDate }] : [])]}
      autoFocus
    />
  )

  if (typed) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <TypedDate
          value={value}
          onChange={onChange}
          today={today}
          min={min}
          max={max}
          id={id}
          sm={sm}
          invalid={invalid}
          placeholder={placeholder}
          className={className}
          aria-label={aria['aria-label']}
          aria-describedby={aria['aria-describedby']}
        />
        <PopoverContent align="end" className="tw:w-auto tw:p-0">
          {calendar}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <DatePickerTrigger
        id={id}
        size={sm ? 'compact' : 'default'}
        text={selected !== undefined ? dayText(selected) : undefined}
        placeholder={placeholder}
        aria-invalid={invalid === true ? true : undefined}
        {...aria}
        className={className}
      />
      <PopoverContent align="start" className="tw:w-auto tw:p-0">
        {calendar}
      </PopoverContent>
    </Popover>
  )
}

/** The typed variant's field: free text, parsed on blur or Enter, the calendar on the icon. */
function TypedDate({
  value,
  onChange,
  today,
  min,
  max,
  id,
  sm,
  invalid,
  placeholder,
  className,
  ...aria
}: {
  value: string
  onChange: (iso: string) => void
  today: Date
  min?: string
  max?: string
  id?: string
  sm: boolean
  invalid?: boolean
  placeholder?: string
  className?: string
  'aria-label'?: string
  'aria-describedby'?: string
}) {
  // The field shows the day as the prototype does ("Tue 21 Jul 2026"); only the value is ISO.
  const [text, setText] = useState(value === '' ? '' : dayText(value))
  const [bad, setBad] = useState(false)
  // A pick from the calendar (or a parent reset) rewrites the text.
  useEffect(() => {
    setText(value === '' ? '' : dayText(value))
    setBad(false)
  }, [value])

  function commit() {
    if (text.trim() === '') {
      setBad(false)
      if (value !== '') onChange('')
      return
    }
    const d = parseTyped(text, today)
    const iso = d !== undefined ? toISO(d) : null
    const outOfBounds = iso !== null && ((min !== undefined && iso < min) || (max !== undefined && iso > max))
    if (iso === null || outOfBounds) {
      setBad(true)
      return
    }
    setBad(false)
    setText(dayText(iso))
    if (iso !== value) onChange(iso)
  }

  return (
    <InputGroup className={cn(sm ? 'tw:h-10' : 'tw:h-12', className)}>
      <InputGroupInput
        id={id}
        value={text}
        placeholder={placeholder ?? 'e.g. Tue 21 Jul 2026'}
        aria-invalid={bad || invalid === true ? true : undefined}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
        }}
        className={cn('tw:tabular-nums', sm ? 'tw:text-sm' : 'tw:text-[15px]')}
        {...aria}
      />
      <InputGroupAddon align="inline-end">
        <PopoverTrigger render={<InputGroupButton size="icon-xs" aria-label="Open the calendar" className="tw:text-slate" />}>
          <CalendarIcon aria-hidden />
        </PopoverTrigger>
      </InputGroupAddon>
    </InputGroup>
  )
}

/**
 * A From to To pair as one range picker (AuditViewer): one Popover, a two-month range Calendar,
 * and a Clear. Either end may stay open, as today's pair of inputs allows.
 */
export function DateRangePicker({
  from,
  to,
  onChange,
  today,
  max,
  min,
  size = 'sm',
  label = 'Date range',
}: {
  from: string
  to: string
  onChange: (from: string, to: string) => void
  today: Date
  min?: string
  max?: string
  size?: 'default' | 'sm'
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const range: DateRange | undefined = from === '' && to === '' ? undefined : { from: fromISO(from), to: fromISO(to) }
  const minDate = fromISO(min)
  const maxDate = fromISO(max)
  const text = from === '' && to === '' ? '' : `${from !== '' ? dayText(from) : 'Any'} to ${to !== '' ? dayText(to) : 'today'}`
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <DatePickerTrigger
        size={size === 'sm' ? 'compact' : 'default'}
        text={text}
        placeholder="Any date"
        aria-label={`${label}: ${text === '' ? 'Any date' : text}`}
        className="tw:w-auto tw:min-w-[260px]"
      />
      <PopoverContent align="start" className="tw:w-auto tw:gap-0 tw:p-0">
        <Calendar
          mode="range"
          selected={range}
          onSelect={(r) => onChange(r?.from !== undefined ? toISO(r.from) : '', r?.to !== undefined ? toISO(r.to) : '')}
          numberOfMonths={2}
          defaultMonth={range?.from ?? (maxDate !== undefined ? new Date(maxDate.getFullYear(), maxDate.getMonth() - 1, 1) : today)}
          today={today}
          weekStartsOn={1}
          startMonth={minDate}
          endMonth={maxDate}
          disabled={[...(minDate !== undefined ? [{ before: minDate }] : []), ...(maxDate !== undefined ? [{ after: maxDate }] : [])]}
          autoFocus
        />
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:border-t tw:border-line tw:px-3 tw:py-2">
          <span className="tw:text-[12.5px] tw:text-slate">{text === '' ? 'Any date' : text}</span>
          <div className="tw:flex tw:gap-2">
            <Button variant="ghost" size="sm" onClick={() => onChange('', '')} disabled={from === '' && to === ''}>
              Clear
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
