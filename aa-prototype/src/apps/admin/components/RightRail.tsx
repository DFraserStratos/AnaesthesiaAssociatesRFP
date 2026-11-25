import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { contractPath } from '../contractsPaths'
import { addMonths, format, parseISO, startOfMonth } from 'date-fns'
import { brand, neutral, radius, semantic } from '../../../theme/tokens'
import type { DayNote } from '../../../domain/types'
import type { Actor, OpenWarningRow } from '../../../store'
import { RailReadings } from './RailReadings'
import { RailWorkCard } from './RailWorkCard'
import type { NotificationTarget } from '../../../store'
import { ADMIN_RIGHT_RAIL_WIDTH } from '../layout'
import { hhmm, longDay } from '../../../shared/format'
import { useCalendarKeys } from '../../../shared/calendar'
import { monthCells, WEEKDAY_INITIALS } from '../../../shared/availability/monthCells'
import { Button, Card, Checkbox, TextAction, TextArea } from '../../../shared/ui'

interface RightRailProps {
  /** The month to show (derived from the selected day). */
  monthDateISO: string
  selectedDateISO: string
  todayISO: string
  onNavigateDate: (dateISO: string) => void
  notes: DayNote[]
  onAddNote: (text: string, flagged: boolean) => void
  shellScrollbarWidth: number
  /** Every open warning (US-13.7.2), and the office actor that clears them. */
  todoRows: readonly OpenWarningRow[]
  actor: Actor
  onOpenBooking: (dateISO: string, bookingId: string) => void
  onOpenConflicts?: () => void
  /** The Invoices screen's Awaiting approval strip (catch-up Phase 27). */
  onOpenInvoices?: () => void
  /** Catch-up Phase 32: open a notification's List or Draft List, and the Notifications page. */
  onOpenNotification?: (target: NotificationTarget) => void
  onSeeAllNotifications?: () => void
  /** The Notifications page with Show resolved on (catch-up Phase 32b). */
  onShowResolvedNotifications?: () => void
}

/**
 * The Admin Day rail: the calendar, two readings (Books square, Pre-payments), one work card with
 * To-do and Notifications tabs, and the day's notes. Draft Lists and Lists awaiting review have
 * their own pages; the day's Draft Lists also sit in the band above the grid.
 */
export function RightRail(props: RightRailProps) {
  // A replaced Contract's to-do opens its page (build plan Phase 49).
  const navigate = useNavigate()
  return (
    <div data-testid="admin-right-rail" style={{ width: ADMIN_RIGHT_RAIL_WIDTH - props.shellScrollbarWidth, flex: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <MiniCalendar monthDateISO={props.monthDateISO} selectedDateISO={props.selectedDateISO} todayISO={props.todayISO} onNavigateDate={props.onNavigateDate} />
      <RailReadings onOpenBooking={props.onOpenBooking} {...(props.onOpenInvoices !== undefined ? { onOpenInvoices: props.onOpenInvoices } : {})} />
      <RailWorkCard
        todoRows={props.todoRows}
        actor={props.actor}
        onOpenBooking={props.onOpenBooking}
        {...(props.onOpenConflicts !== undefined ? { onOpenConflicts: props.onOpenConflicts } : {})}
        onOpenNotification={props.onOpenNotification ?? (() => undefined)}
        onSeeAllNotifications={props.onSeeAllNotifications ?? (() => undefined)}
        {...(props.onShowResolvedNotifications !== undefined ? { onShowResolvedNotifications: props.onShowResolvedNotifications } : {})}
        onOpenContract={(contractId) => navigate(contractPath(contractId))}
      />
      <DayNotes notes={props.notes} onAddNote={props.onAddNote} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mini month calendar
// ---------------------------------------------------------------------------

function MiniCalendar({ monthDateISO, selectedDateISO, todayISO, onNavigateDate }: { monthDateISO: string; selectedDateISO: string; todayISO: string; onNavigateDate: (d: string) => void }) {
  const [visibleMonthISO, setVisibleMonthISO] = useState(() => format(startOfMonth(parseISO(monthDateISO)), 'yyyy-MM-dd'))
  const [focusedDateISO, setFocusedDateISO] = useState(selectedDateISO)
  const month = startOfMonth(parseISO(visibleMonthISO))
  const monthPrefix = format(month, 'yyyy-MM')
  const cells = monthCells(monthPrefix)
  const weekNumber = format(parseISO(selectedDateISO), 'II')

  useEffect(() => {
    setVisibleMonthISO(format(startOfMonth(parseISO(monthDateISO)), 'yyyy-MM-dd'))
    setFocusedDateISO(selectedDateISO)
  }, [monthDateISO, selectedDateISO])

  // The shared calendar keyboard model (UI unification U4). No bounds: paging past the horizon still lands on
  // Admin Day's "Beyond the schedule horizon" (Phase 28). Its look (crimson today and selection, the
  // `.aa-admin-calendar-day` ring) stays this calendar's own.
  const keys = useCalendarKeys({
    monthISO: monthPrefix,
    focusISO: focusedDateISO,
    onFocusMove: setFocusedDateISO,
    onMonthChange: (m) => setVisibleMonthISO(`${m}-01`),
  })

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NavArrow label="Previous month" glyph="‹" onClick={() => onNavigateDate(format(addMonths(month, -1), 'yyyy-MM-dd'))} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{format(month, 'MMMM yyyy')}</span>
          <NavArrow label="Next month" glyph="›" onClick={() => onNavigateDate(format(addMonths(month, 1), 'yyyy-MM-dd'))} />
        </div>
        <span style={{ fontSize: 11, color: neutral.mist }}>week {weekNumber}</span>
      </div>
      <div
        role="group"
        aria-label={`${format(month, 'MMMM yyyy')} calendar. Use arrow keys to move by day or week, Home and End to move within a week, and Page Up and Page Down to move by month. Hold Shift with Page Up or Page Down to move by year. Press Enter or Space to select a date.`}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, textAlign: 'center' }}
      >
        {WEEKDAY_INITIALS.map((d, i) => (
          <span key={i} aria-hidden="true" style={{ fontSize: 9.5, fontWeight: 600, color: neutral.mist, padding: '3px 0' }}>{d}</span>
        ))}
        {cells.map((iso, i) => {
          if (iso === null) return <span key={`b${i}`} />
          const d = Number(iso.slice(8))
          const isToday = iso === todayISO
          const isSelected = iso === selectedDateISO
          return (
            <button
              key={iso}
              {...keys.dayProps(iso)}
              type="button"
              className="aa-admin-calendar-day"
              aria-current={isToday ? 'date' : undefined}
              aria-label={longDay(iso)}
              aria-pressed={isSelected}
              onClick={() => onNavigateDate(iso)}
              style={{
                fontSize: 11,
                lineHeight: '24px',
                height: 24,
                borderRadius: radius.xs,
                border: isSelected && !isToday ? `1px solid ${brand.base}` : '1px solid transparent',
                fontWeight: isToday ? 700 : 400,
                color: isToday ? neutral.surface : neutral.ink,
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

function NavArrow({ label, glyph, onClick }: { label: string; glyph: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} style={{ width: 22, height: 22, borderRadius: radius.xs, border: `1px solid ${neutral.line}`, background: neutral.surface, color: neutral.slate, cursor: 'pointer', fontSize: 13, lineHeight: '20px', padding: 0 }}>
      {glyph}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Day notes
// ---------------------------------------------------------------------------

/** Notes pinned to the day on screen: one line until there is a note, "Add note" in the heading. */
function DayNotes({ notes, onAddNote }: { notes: DayNote[]; onAddNote: (text: string, flagged: boolean) => void }) {
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
    <Card
      shot="admin-day-notes"
      title="Day notes"
      {...(adding ? {} : { action: <TextAction size="sm" flush onClick={() => setAdding(true)}>Add note</TextAction> })}
    >
      {notes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notes.map((n) => (
            <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: 2, borderLeft: `3px solid ${n.flagged ? semantic.warning.solid : neutral.line}`, paddingLeft: 10 }}>
              <span className="mono" style={{ fontSize: 10, color: neutral.mist }}>{hhmm(n.atISO)} · {n.initials}</span>
              <span style={{ fontSize: 12.5, lineHeight: '18px', color: neutral.ink }}>{n.text}</span>
            </div>
          ))}
        </div>
      )}
      {adding && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <TextArea size="compact" ariaLabel="Note for this day" value={text} onChange={setText} placeholder="Add a note for this day" autoFocus />
          <Checkbox checked={flagged} onChange={setFlagged} style={{ gap: 6, fontSize: 12, color: neutral.slate }}>Flag (amber)</Checkbox>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="compact" onClick={save} disabled={text.trim() === ''} style={{ flex: 1 }}>Save note</Button>
            <Button variant="secondary" size="compact" onClick={() => { setAdding(false); setText('') }} style={{ flex: 'none' }}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  )
}
