import { addDays, format, parseISO } from 'date-fns'
import { accent, neutral, radius } from '../../../theme/tokens'
import { shiftWeeks } from '../../../shared/format'

export type SortMode = 'roster' | 'az'

interface DayNavProps {
  selectedDateISO: string
  summary: string
  sortMode: SortMode
  onSort: (mode: SortMode) => void
  onNavigateDate: (dateISO: string) => void
  todayISO: string
}

export function DayNav({ selectedDateISO, summary, sortMode, onSort, onNavigateDate, todayISO }: DayNavProps) {
  const title = format(parseISO(selectedDateISO), 'EEEE d MMMM yyyy')
  const step = (days: number) => onNavigateDate(format(addDays(parseISO(selectedDateISO), days), 'yyyy-MM-dd'))
  const week = (weeks: number) => onNavigateDate(shiftWeeks(selectedDateISO, weeks))

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</h1>
        <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>{summary}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <SortToggle sortMode={sortMode} onSort={onSort} />
        <TextBtn onClick={() => week(-4)}>-4w</TextBtn>
        <TextBtn onClick={() => week(-1)}>-1w</TextBtn>
        <SquareBtn onClick={() => step(-1)}>‹</SquareBtn>
        <button
          type="button"
          onClick={() => onNavigateDate(todayISO)}
          style={{ height: 36, padding: '0 14px', borderRadius: 10, border: `1px solid ${accent.base}`, background: neutral.surface, color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Today
        </button>
        <SquareBtn onClick={() => step(1)}>›</SquareBtn>
        <TextBtn onClick={() => week(1)}>+1w</TextBtn>
        <TextBtn onClick={() => week(4)}>+4w</TextBtn>
        <input
          type="date"
          value={selectedDateISO}
          onChange={(e) => e.target.value !== '' && onNavigateDate(e.target.value)}
          style={{ height: 36, borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.surface, padding: '0 10px', fontFamily: 'inherit', fontSize: 13, color: neutral.ink }}
        />
      </div>
    </div>
  )
}

function SortToggle({ sortMode, onSort }: { sortMode: SortMode; onSort: (m: SortMode) => void }) {
  const opt = (mode: SortMode, label: string) => {
    const active = mode === sortMode
    return (
      <button
        type="button"
        onClick={() => onSort(mode)}
        style={{ height: 30, padding: '0 10px', borderRadius: 8, border: 'none', background: active ? accent.base : 'transparent', color: active ? '#FFFFFF' : neutral.slate, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
      >
        {label}
      </button>
    )
  }
  return (
    <div title="Row order" style={{ display: 'flex', background: neutral.sunken, borderRadius: 10, padding: 3, gap: 2 }}>
      {opt('roster', 'Roster order')}
      {opt('az', 'A to Z')}
    </div>
  )
}

function SquareBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${neutral.line}`, background: neutral.surface, color: neutral.slate, cursor: 'pointer', fontSize: 15, fontFamily: 'inherit' }}>
      {children}
    </button>
  )
}

function TextBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ height: 36, padding: '0 10px', borderRadius: 10, border: `1px solid ${neutral.line}`, background: neutral.surface, color: neutral.slate, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit' }}>
      {children}
    </button>
  )
}
