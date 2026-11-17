import { useEffect, useState } from 'react'
import { addMonths, format, parseISO, startOfMonth } from 'date-fns'
import { accent, brand, neutral, radius, semantic } from '../../../theme/tokens'
import type { DayNote } from '../../../domain/types'
import type { Actor, OpenWarningRow } from '../../../store'
import { WarningsToDo } from './WarningsToDo'
import { NeedsInvoiceDestinationCard } from './NeedsInvoiceDestinationCard'
import { DraftListsCard } from './draftLists/DraftListsCard'
import { NotificationsCard } from './NotificationsCard'
import type { NotificationTarget } from '../../../store'
import { ADMIN_RIGHT_RAIL_WIDTH } from '../layout'
import { hhmm, longDay } from '../../../shared/format'
import { useCalendarKeys } from '../../../shared/calendar'
import { monthCells, WEEKDAY_INITIALS } from '../../../shared/availability/monthCells'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Button, Card, Checkbox, TextArea } from '../../../shared/ui'

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
  shellScrollbarWidth: number
  onReviewList: (listId: string) => void
  /** Every open warning (US-13.7.2), and the office actor that clears them. */
  todoRows: readonly OpenWarningRow[]
  actor: Actor
  onOpenBooking: (dateISO: string, bookingId: string) => void
  onOpenConflicts?: () => void
  /** Catch-up Phase 31: open a Draft List's drawer, and the Draft Lists page. */
  onOpenDraftList?: (listId: string) => void
  onSeeAllDraftLists?: () => void
  /** Catch-up Phase 32: open a notification's List or Draft List, and the Notifications page. */
  onOpenNotification?: (target: NotificationTarget) => void
  onSeeAllNotifications?: () => void
  /** The Notifications page with Show resolved on (catch-up Phase 32b). */
  onShowResolvedNotifications?: () => void
}

export function RightRail(props: RightRailProps) {
  return (
    <div data-testid="admin-right-rail" style={{ width: ADMIN_RIGHT_RAIL_WIDTH - props.shellScrollbarWidth, flex: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <MiniCalendar monthDateISO={props.monthDateISO} selectedDateISO={props.selectedDateISO} todayISO={props.todayISO} onNavigateDate={props.onNavigateDate} />
      {/* Rail order (Decisions log 2026-10-10): calendar, To-do (15a), Draft
          Lists (31), the shared notification pool (32), notes, Awaiting review;
          "Needs an invoice destination" (20) under the To-do. */}
      <WarningsToDo rows={props.todoRows} actor={props.actor} onOpenBooking={props.onOpenBooking} {...(props.onOpenConflicts !== undefined ? { onOpenConflicts: props.onOpenConflicts } : {})} />
      <NeedsInvoiceDestinationCard onOpenBooking={props.onOpenBooking} />
      {props.onOpenDraftList !== undefined && props.onSeeAllDraftLists !== undefined && (
        <DraftListsCard onOpenDraftList={props.onOpenDraftList} onSeeAll={props.onSeeAllDraftLists} />
      )}
      {props.onOpenNotification !== undefined && props.onSeeAllNotifications !== undefined && (
        <NotificationsCard actor={props.actor} onOpen={props.onOpenNotification} onSeeAll={props.onSeeAllNotifications} {...(props.onShowResolvedNotifications !== undefined ? { onShowResolved: props.onShowResolvedNotifications } : {})} />
      )}
      <InternalNotes notes={props.notes} onAddNote={props.onAddNote} />
      <AwaitingReview rows={props.reviewRows} onReviewList={props.onReviewList} />
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
    <Card title="Internal notes">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notes.length === 0 && <EmptyState>No notes for this day.</EmptyState>}
        {notes.map((n) => (
          <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: 2, borderLeft: `3px solid ${n.flagged ? semantic.warning.solid : neutral.line}`, paddingLeft: 10 }}>
            <span className="mono" style={{ fontSize: 10, color: neutral.mist }}>{hhmm(n.atISO)} · {n.initials}</span>
            <span style={{ fontSize: 12.5, lineHeight: '18px', color: neutral.ink }}>{n.text}</span>
          </div>
        ))}
      </div>

      {adding ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <TextArea size="compact" ariaLabel="Internal note for this day" value={text} onChange={setText} placeholder="Add an internal note for this day" autoFocus />
          <Checkbox checked={flagged} onChange={setFlagged} style={{ gap: 6, fontSize: 12, color: neutral.slate }}>Flag (amber)</Checkbox>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="compact" onClick={save} disabled={text.trim() === ''} style={{ flex: 1 }}>Save note</Button>
            <Button variant="secondary" size="compact" onClick={() => { setAdding(false); setText('') }} style={{ flex: 'none' }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" size="compact" onClick={() => setAdding(true)}>+ Add note</Button>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Awaiting review
// ---------------------------------------------------------------------------

function AwaitingReview({ rows, onReviewList }: { rows: ReviewRow[]; onReviewList: (listId: string) => void }) {
  return (
    <Card title="Awaiting review">
      {rows.length === 0 && <EmptyState>Nothing awaiting review.</EmptyState>}
      {rows.map((r) => (
        <button
          key={r.listId}
          type="button"
          onClick={() => onReviewList(r.listId)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 12px', background: neutral.bg, borderRadius: radius.ctl, border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
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
