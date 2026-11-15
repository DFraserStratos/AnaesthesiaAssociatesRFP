import type { ComponentProps, ReactNode } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/** "Tue 21 Jul 2026": how the prototype shows a day with its year (dayWithYear). */
export function dayText(day: Date | string): string {
  const d = typeof day === 'string' ? parseISO(day.slice(0, 10)) : day
  return isValid(d) ? format(d, 'EEE d MMM yyyy') : ''
}

/**
 * The look of every date field and date trigger: the kit field (`@/components/ui/input`), 48px on
 * the background colour with the `line` border and `rounded-ctl`. `compact` is the 40px toolbar size.
 * Exported so a typed date field (InputGroup) can take the same height and type size.
 */
export const dateFieldClass = {
  base: 'tw:inline-flex tw:w-full tw:min-w-0 tw:items-center tw:justify-between tw:gap-2 tw:rounded-ctl tw:border tw:border-line tw:bg-background tw:text-left tw:text-ink tw:transition-[border-color,box-shadow] tw:duration-150 tw:outline-none tw:cursor-pointer tw:focus-visible:border-primary tw:focus-visible:shadow-focus tw:data-popup-open:border-primary tw:disabled:cursor-not-allowed tw:disabled:bg-sunken tw:disabled:text-mist tw:aria-invalid:border-error',
  default: 'tw:h-12 tw:px-3.5 tw:text-[15px]',
  compact: 'tw:h-10 tw:px-3 tw:text-sm',
} as const

export type DateTriggerSize = 'default' | 'compact'

/**
 * The one trigger for a Calendar in a Popover: shows the chosen day as "Tue 21 Jul 2026" (or the
 * caller's own text, such as a range), a placeholder in mist when empty, and the calendar icon at
 * the end. Render it inside a `<Popover>`.
 */
export function DatePickerTrigger({
  size = 'default',
  text,
  placeholder = 'Choose a date',
  icon,
  className,
  ...props
}: Omit<ComponentProps<'button'>, 'children'> & {
  size?: DateTriggerSize
  /** The shown value, already formatted (use `dayText`); empty or undefined shows the placeholder. */
  text?: string
  placeholder?: string
  /** Something before the text (rare; the calendar icon always sits at the end). */
  icon?: ReactNode
}) {
  const empty = text === undefined || text === ''
  return (
    <PopoverTrigger
      render={<button type="button" {...props} className={cn(dateFieldClass.base, dateFieldClass[size], className)} />}
    >
      <span className="tw:flex tw:min-w-0 tw:items-center tw:gap-2">
        {icon}
        <span className={cn('tw:truncate tw:tabular-nums', empty && 'tw:text-mist')}>{empty ? placeholder : text}</span>
      </span>
      <CalendarIcon aria-hidden className="tw:size-4 tw:flex-none tw:text-slate" />
    </PopoverTrigger>
  )
}
