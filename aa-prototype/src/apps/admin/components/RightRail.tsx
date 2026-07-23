import { useState } from 'react'
import { addMonths, format, getDay, getDaysInMonth, parseISO, startOfMonth } from 'date-fns'
import { accent, brand, neutral, radius, semantic } from '../../../theme/tokens'
import type { DayNote } from '../../../domain/types'

interface ReviewRow {
  listId: string
  title: string
  sub: string
}

interface RightRailProps {
  /** The month to show (derived from the selected day). */
  monthDateISO: string
  selectedDateISO: string
  todayISO: string
  onNavigateDate: (dateISO: string) => void
  notes: DayNote[]
  onAddNote: (text: string, flagged: boolean) => void
  reviewRows: ReviewRow[]
  onReviewList: (listId: string) => void
}

export function RightRail(props: RightRailProps) {
  return (
    <div style={{ width: 256, flex: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <MiniCalendar monthDateISO={props.monthDateISO} selectedDateISO={props.selectedDateISO} todayISO={props.todayISO} onNavigateDate={props.onNavigateDate} />
      <InternalNotes notes={props.notes} onAddNote={props.onAddNote} />
      <AwaitingReview rows={props.reviewRows} onReviewList={props.onReviewList} />
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mini month calendar
// ---------------------------------------------------------------------------

function MiniCalendar({ monthDateISO, selectedDateISO, todayISO, onNavigateDate }: { monthDateISO: string; selectedDateISO: string; todayISO: string; onNavigateDate: (d: string) => void }) {
  const month = startOfMonth(parseISO(monthDateISO))
  const daysInMonth = getDaysInMonth(month)
  // Monday-first: convert Sun(0)..Sat(6) to leading blanks.
  const leading = (getDay(month) + 6) % 7
  const cells: (number | null)[] = [...Array(leading).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const monthPrefix = format(month, 'yyyy-MM')
  const weekNumber = format(parseISO(selectedDateISO), 'II')

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NavArrow glyph="‹" onClick={() => onNavigateDate(format(addMonths(month, -1), 'yyyy-MM-dd'))} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{format(month, 'MMMM yyyy')}</span>
          <NavArrow glyph="›" onClick={() => onNavigateDate(format(addMonths(month, 1), 'yyyy-MM-dd'))} />
        </div>
        <span style={{ fontSize: 11, color: neutral.mist }}>week {weekNumber}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, textAlign: 'center' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} style={{ fontSize: 9.5, fontWeight: 600, color: neutral.mist, padding: '3px 0' }}>{d}</span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={`b${i}`} />
          const iso = `${monthPrefix}-${String(d).padStart(2, '0')}`
          const isToday = iso === todayISO
          const isSelected = iso === selectedDateISO
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onNavigateDate(iso)}
              style={{
                fontSize: 11,
                lineHeight: '24px',
                height: 24,
                borderRadius: 6,
                border: isSelected && !isToday ? `1px solid ${accent.base}` : '1px solid transparent',
                fontWeight: isToday ? 700 : 400,
                color: isToday ? '#FFFFFF' : neutral.ink,
                background: isToday ? brand.base : 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {d}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function NavArrow({ glyph, onClick }: { glyph: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${neutral.line}`, background: neutral.surface, color: neutral.slate, cursor: 'pointer', fontSize: 13, lineHeight: '20px', padding: 0 }}>
      {glyph}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Internal notes
// ---------------------------------------------------------------------------

function InternalNotes({ notes, onAddNote }: { notes: DayNote[]; onAddNote: (text: string, flagged: boolean) => void }) {
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const [flagged, setFlagged] = useState(false)

  function save() {
    if (text.trim() === '') return
    onAddNote(text, flagged)
    setText('')
    setFlagged(false)
    setAdding(false)
  }

  return (
    <Card>
      <div style={{ fontSize: 14, fontWeight: 600 }}>Internal notes</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notes.length === 0 && <div style={{ fontSize: 12.5, color: neutral.mist }}>No notes for this day.</div>}
        {notes.map((n) => (
          <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: 2, borderLeft: `3px solid ${n.flagged ? semantic.warning.solid : neutral.line}`, paddingLeft: 10 }}>
            <span className="mono" style={{ fontSize: 10, color: neutral.mist }}>{n.atISO.slice(11, 16)} · {n.initials}</span>
            <span style={{ fontSize: 12.5, lineHeight: '18px', color: neutral.ink }}>{n.text}</span>
          </div>
        ))}
      </div>

      {adding ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add an internal note for this day"
            autoFocus
            style={{ width: '100%', boxSizing: 'border-box', minHeight: 60, borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, padding: 10, fontFamily: 'inherit', fontSize: 12.5, resize: 'none', background: neutral.bg }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: neutral.slate, cursor: 'pointer' }}>
            <input type="checkbox" checked={flagged} onChange={(e) => setFlagged(e.target.checked)} /> Flag (amber)
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={save} disabled={text.trim() === ''} style={{ flex: 1, height: 34, borderRadius: 10, border: 'none', background: accent.base, color: '#FFFFFF', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: text.trim() === '' ? 'default' : 'pointer', opacity: text.trim() === '' ? 0.5 : 1 }}>Save note</button>
            <button type="button" onClick={() => { setAdding(false); setText('') }} style={{ flex: 'none', height: 34, padding: '0 12px', borderRadius: 10, border: `1px solid ${neutral.line}`, background: neutral.surface, color: neutral.slate, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} style={{ height: 36, borderRadius: 10, border: `1px solid ${neutral.line}`, background: neutral.surface, color: neutral.slate, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>+ Add note</button>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Awaiting review
// ---------------------------------------------------------------------------

function AwaitingReview({ rows, onReviewList }: { rows: ReviewRow[]; onReviewList: (listId: string) => void }) {
  return (
    <Card>
      <div style={{ fontSize: 14, fontWeight: 600 }}>Awaiting review</div>
      {rows.length === 0 && <div style={{ fontSize: 12.5, color: neutral.mist }}>Nothing awaiting review.</div>}
      {rows.map((r) => (
        <button
          key={r.listId}
          type="button"
          onClick={() => onReviewList(r.listId)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 12px', background: neutral.bg, borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
        >
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: neutral.ink }}>{r.title}</span>
            <span style={{ fontSize: 11, color: neutral.slate }}>{r.sub}</span>
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: accent.base }}>Review →</span>
        </button>
      ))}
    </Card>
  )
}
