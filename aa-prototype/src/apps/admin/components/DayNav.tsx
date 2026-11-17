import { addDays, format, parseISO } from 'date-fns'
import { neutral } from '../../../theme/tokens'
import { shiftWeeks, longDay } from '../../../shared/format'
import { Button, DateJumpInput, IconButton, SlidingSegmentedControl, type SlidingSegmentOption } from '../../../shared/ui'

export type SortMode = 'roster' | 'az'

const SORT_OPTIONS: readonly SlidingSegmentOption<SortMode>[] = [
  { value: 'roster', label: 'Roster order' },
  { value: 'az', label: 'A to Z' },
]

/** The week steps keep their narrower 10px side padding (U5). */
const WEEK_STEP = { padding: '0 10px' } as const

interface DayNavProps {
  selectedDateISO: string
  summary: string
  sortMode: SortMode
  onSort: (mode: SortMode) => void
  onNavigateDate: (dateISO: string) => void
  todayISO: string
  /** The schedule horizon's last day: the date picker stops there (catch-up Phase 28; FT-01.1). */
  maxDateISO: string
  /** Open the office's availability finder for this day (catch-up Phase 28; absent hides the action). */
  onFindAvailable?: () => void
}

export function DayNav({ selectedDateISO, summary, sortMode, onSort, onNavigateDate, todayISO, maxDateISO, onFindAvailable }: DayNavProps) {
  const title = longDay(selectedDateISO)
  const step = (days: number) => onNavigateDate(format(addDays(parseISO(selectedDateISO), days), 'yyyy-MM-dd'))
  const week = (weeks: number) => onNavigateDate(shiftWeeks(selectedDateISO, weeks))

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</h1>
        <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>{summary}</div>
      </div>

      <div data-testid="admin-day-nav" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {onFindAvailable !== undefined && (
          <Button variant="outline" size="compact" shot="admin-availability-finder-open" onClick={onFindAvailable}>
            Find available
          </Button>
        )}
        <SlidingSegmentedControl size="sm" layout="wrap" variant="teal" ariaLabel="Row order" value={sortMode} options={SORT_OPTIONS} onSelect={onSort} />
        <Button variant="secondary" size="compact" style={WEEK_STEP} onClick={() => week(-4)}>-4w</Button>
        <Button variant="secondary" size="compact" style={WEEK_STEP} onClick={() => week(-1)}>-1w</Button>
        <IconButton size={36} label="Previous day" onClick={() => step(-1)}>‹</IconButton>
        <Button variant="outline" size="compact" onClick={() => onNavigateDate(todayISO)}>
          Today
        </Button>
        <IconButton size={36} label="Next day" onClick={() => step(1)}>›</IconButton>
        <Button variant="secondary" size="compact" style={WEEK_STEP} onClick={() => week(1)}>+1w</Button>
        <Button variant="secondary" size="compact" style={WEEK_STEP} onClick={() => week(4)}>+4w</Button>
        <DateJumpInput beyondMax label="Go to date" height={36} width={139} value={selectedDateISO} max={maxDateISO} onPick={(d) => d !== null && onNavigateDate(d)} />
      </div>
    </div>
  )
}
