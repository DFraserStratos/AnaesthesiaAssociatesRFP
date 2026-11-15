import { useId, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { XIcon } from 'lucide-react'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { useLookbackBounds } from '@proto/shared/schedule'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent } from '@/components/ui/popover'
import { DatePickerTrigger, dayText } from '../../shared/DatePickerTrigger'
import { Said } from './shared'

const iso = (d: Date) => format(d, 'yyyy-MM-dd')

/**
 * A bounded day picker on shadcn's Date Picker pattern (Popover + Calendar). Today is the demo clock's;
 * days outside her first and last day with work are disabled and the month navigation stops at them.
 */
export function DayPicker({
  label,
  valueISO,
  onChange,
  firstISO,
  lastISO,
  todayISO,
  dropdowns = false,
  clearable = true,
}: {
  label: string
  valueISO: string | null
  onChange: (iso: string | null) => void
  firstISO: string
  lastISO: string
  todayISO: string
  dropdowns?: boolean
  clearable?: boolean
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const first = parseISO(firstISO)
  const last = parseISO(lastISO)
  const today = parseISO(todayISO)
  const selected = valueISO !== null ? parseISO(valueISO) : undefined
  const startOn = selected ?? (today < first ? first : today > last ? last : today)
  return (
    <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[13px] tw:text-slate">
      <span id={`${id}-label`}>{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <DatePickerTrigger
          size="compact"
          aria-labelledby={`${id}-label ${id}-value`}
          text={valueISO === null ? undefined : dayText(valueISO)}
          placeholder="Pick a day"
          className="tw:w-[180px]"
        />
        <PopoverContent align="start" className="tw:w-auto tw:p-2">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => {
              onChange(d === undefined ? null : iso(d))
              setOpen(false)
            }}
            defaultMonth={startOn}
            startMonth={first}
            endMonth={last}
            disabled={[{ before: first }, { after: last }]}
            today={today}
            weekStartsOn={1}
            captionLayout={dropdowns ? 'dropdown' : 'label'}
          />
          {clearable && valueISO !== null && (
            <div className="tw:flex tw:justify-end tw:border-t tw:border-line tw:pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange(null)
                  setOpen(false)
                }}
              >
                <XIcon aria-hidden /> Clear
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

/** The Lists page's Go to date, bounded by her first and last day with work (useLookbackBounds). */
export function GoToDateReplacement({ dropdowns = false }: { dropdowns?: boolean }) {
  const f = useWebFixtures() as { anaesthetistId: string; todayISO: string }
  const bounds = useLookbackBounds(f.anaesthetistId) as { firstISO: string; lastISO: string }
  const [dayISO, setDayISO] = useState<string | null>(null)
  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      <DayPicker label="Go to date" valueISO={dayISO} onChange={setDayISO} firstISO={bounds.firstISO} lastISO={bounds.lastISO} todayISO={f.todayISO} dropdowns={dropdowns} />
      <Said text={dayISO === null ? null : `Would go to ${format(parseISO(dayISO), 'EEE d MMM yyyy')}`} />
    </div>
  )
}
