import { useState, type ReactNode } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent } from '@/components/ui/popover'
import { DatePickerTrigger, dayText } from '../../shared/DatePickerTrigger'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { shiftWeeks } from '@proto/shared/format'
import { useAdminDay, useSeedIds } from '@proto/apps/demo/catalogue/admin/adminData'
import { Echo, Wide } from './shared'

type SortMode = 'roster' | 'az'
export type DatePickerKind = 'native' | 'calendar'

/** The teal-outlined toolbar action (Find available, Today): the outline Button recoloured teal, 36 tall. */
const TEAL_OUTLINE = 'tw:h-9 tw:px-3.5 tw:text-[13px] tw:border-primary tw:text-primary tw:hover:bg-teal-tint'
/** The quiet line-bordered steppers, 36 tall. */
const STEP = 'tw:h-9 tw:text-slate tw:border-line'

function TextBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Button variant="outline" aria-label={label} onClick={onClick} className={`${STEP} tw:px-2.5 tw:text-[12.5px]`}>
      {children}
    </Button>
  )
}

/** The date control: the native input bounded by the horizon (as today), or a Calendar in a Popover. */
function DateControl({ kind, value, todayISO, maxISO, onChange }: { kind: DatePickerKind; value: string; todayISO: string; maxISO: string; onChange: (iso: string) => void }) {
  const [open, setOpen] = useState(false)
  if (kind === 'native') {
    return (
      <Input
        type="date"
        aria-label="Go to date"
        value={value}
        max={maxISO}
        onChange={(e) => e.target.value !== '' && onChange(e.target.value)}
        className="tw:h-9 tw:w-[139px] tw:rounded-ctl tw:border-line tw:bg-surface tw:px-2.5 tw:text-[13px]"
      />
    )
  }
  const selected = parseISO(value)
  const max = parseISO(maxISO)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <DatePickerTrigger size="compact" text={dayText(selected)} aria-label={`Go to date, ${format(selected, 'd MMMM yyyy')}`} className="tw:w-[172px]" />
      <PopoverContent align="end" className="tw:w-auto tw:p-2">
        <Calendar
          mode="single"
          required
          selected={selected}
          defaultMonth={selected}
          today={parseISO(todayISO)}
          weekStartsOn={1}
          endMonth={max}
          disabled={{ after: max }}
          onSelect={(d) => {
            onChange(format(d, 'yyyy-MM-dd'))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

/**
 * The Day view toolbar on shadcn Button, ToggleGroup and (option) Calendar in a Popover. Glyph
 * and week buttons get spoken labels; the sort is a single-select ToggleGroup (radio semantics).
 */
export function DayNavReplacement({ datePicker = 'native' }: { datePicker?: DatePickerKind }) {
  const { todayISO } = useSeedIds() as { todayISO: string }
  const { horizonEndISO } = useAdminDay(todayISO) as { horizonEndISO: string }
  const [dateISO, setDateISO] = useState(todayISO)
  const [sort, setSort] = useState<SortMode>('roster')
  const [finds, setFinds] = useState(0)

  const title = format(parseISO(dateISO), 'EEEE d MMMM yyyy')
  const step = (days: number) => setDateISO(format(addDays(parseISO(dateISO), days), 'yyyy-MM-dd'))
  const week = (weeks: number) => setDateISO(shiftWeeks(dateISO, weeks) as string)
  const summary = `Local example · ${finds === 0 ? 'Find available not clicked' : `Find available clicked ${finds}x`}`

  return (
    <Wide minWidth={980}>
      <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4">
        <div>
          <h1 className="tw:m-0 tw:text-2xl tw:leading-[30px] tw:font-bold tw:tracking-[-0.01em]">{title}</h1>
          <div className="tw:mt-0.5 tw:text-[13px] tw:text-slate">{summary}</div>
        </div>

        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
          <Button variant="outline" className={TEAL_OUTLINE} onClick={() => setFinds((n) => n + 1)}>
            Find available
          </Button>
          <ToggleGroup
            variant="teal"
            size="sm"
            role="radiogroup"
            aria-label="Row order"
            value={[sort]}
            onValueChange={(next) => {
              const picked = next[0] as SortMode | undefined
              if (picked !== undefined) setSort(picked)
            }}
            className="tw:gap-0.5 tw:rounded-ctl tw:p-[3px]"
          >
            {(
              [
                ['roster', 'Roster order'],
                ['az', 'A to Z'],
              ] as const
            ).map(([mode, label]) => (
              <ToggleGroupItem key={mode} value={mode} role="radio" aria-checked={sort === mode} aria-pressed={undefined} className="tw:h-[30px] tw:flex-none tw:rounded-[8px]! tw:px-2.5 tw:text-xs">
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <TextBtn label="Back 4 weeks" onClick={() => week(-4)}>-4w</TextBtn>
          <TextBtn label="Back 1 week" onClick={() => week(-1)}>-1w</TextBtn>
          <Button variant="outline" size="icon" aria-label="Previous day" onClick={() => step(-1)} className={`${STEP} tw:w-9`}>
            <ChevronLeftIcon aria-hidden />
          </Button>
          <Button variant="outline" className={TEAL_OUTLINE} onClick={() => setDateISO(todayISO)}>
            Today
          </Button>
          <Button variant="outline" size="icon" aria-label="Next day" onClick={() => step(1)} className={`${STEP} tw:w-9`}>
            <ChevronRightIcon aria-hidden />
          </Button>
          <TextBtn label="Forward 1 week" onClick={() => week(1)}>+1w</TextBtn>
          <TextBtn label="Forward 4 weeks" onClick={() => week(4)}>+4w</TextBtn>
          <DateControl kind={datePicker} value={dateISO} todayISO={todayISO} maxISO={horizonEndISO} onChange={setDateISO} />
        </div>
      </div>
      <Echo>
        Date {dateISO} · order {sort === 'az' ? 'A to Z' : 'roster'}
      </Echo>
    </Wide>
  )
}
