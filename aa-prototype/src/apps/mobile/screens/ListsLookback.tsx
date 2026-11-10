/**
 * The Lists tab's way back to past work on the phone (catch-up Phase 38a;
 * US-03.1.6, US-03.1.7, US-15.0.2): a search field in the Procedure code
 * sheet's anatomy, a calendar button that opens a bottom sheet of months, the
 * day view under a dismissible teal day chip, and the search results. Own work
 * only (the store's selectors decide). No native date input, no centred modal,
 * nothing under 44px tall.
 */

import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarDays, ChevronRight, Search, X } from 'lucide-react'
import { accent, elevation, neutral, radius } from '../../../theme/tokens'
import { LIST_PROGRESS_LABEL } from '../../../domain/listProgress'
import {
  listDaysFor,
  listsOnDayFor,
  lookbackBoundsFor,
  searchBookingsFor,
  useAppStore,
  type BookingSearchRow,
  type LookbackList,
} from '../../../store'
import { MonthGrid } from '../../../shared/calendar'
import { monthOf } from '../../../shared/availability/monthCells'
import { ProgressPill, useBookingWarnings, useSurface, WarningTriangle } from '../../../shared'
import { ListRow, type ListRowRight } from '../components'
import { DAY_EMPTY, SEARCH_EMPTY } from '../../../shared/schedule'
import { locationName, nhiBadge } from '../../../shared/format'

// ---------------------------------------------------------------------------
// The header row: search field and calendar button
// ---------------------------------------------------------------------------

export function LookbackSearchRow({
  query,
  onQueryChange,
  onOpenCalendar,
}: {
  query: string
  onQueryChange: (q: string) => void
  onOpenCalendar: () => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <Search size={16} aria-hidden color={neutral.mist} style={{ position: 'absolute', left: 14, top: 16 }} />
        <input
          type="search"
          inputMode="search"
          aria-label="Search your Bookings"
          placeholder="Search patient name or NHI"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          data-testid="mobile-lists-search"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            height: 48,
            borderRadius: radius.ctl,
            border: `1px solid ${neutral.line}`,
            background: neutral.bg,
            padding: query !== '' ? '0 44px 0 38px' : '0 14px 0 38px',
            fontFamily: 'inherit',
            fontSize: 15,
            color: neutral.ink,
            appearance: 'none',
          }}
        />
        {query !== '' && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onQueryChange('')}
            style={{ position: 'absolute', right: 2, top: 2, width: 44, height: 44, border: 'none', background: 'none', color: neutral.slate, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={18} aria-hidden />
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="Go to a date"
        onClick={onOpenCalendar}
        style={{ width: 48, height: 48, flex: 'none', borderRadius: radius.ctl, border: `1.5px solid ${accent.base}`, background: neutral.surface, color: accent.base, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        <CalendarDays size={20} strokeWidth={2.2} aria-hidden />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// The date sheet
// ---------------------------------------------------------------------------

export function LookbackDateSheet({
  open,
  onClose,
  anaesthetistId,
  todayISO,
  selectedISO,
  onPick,
}: {
  open: boolean
  onClose: () => void
  anaesthetistId: string
  todayISO: string
  selectedISO: string | null
  onPick: (dateISO: string) => void
}) {
  const { Overlay } = useSurface()
  return (
    <Overlay open={open} onClose={onClose}>
      {open && (
        <DateSheetBody anaesthetistId={anaesthetistId} todayISO={todayISO} selectedISO={selectedISO} onPick={onPick} />
      )}
    </Overlay>
  )
}

function DateSheetBody({ anaesthetistId, todayISO, selectedISO, onPick }: { anaesthetistId: string; todayISO: string; selectedISO: string | null; onPick: (d: string) => void }) {
  const schedule = useAppStore((s) => s.schedule)
  const clock = useAppStore((s) => s.clock)
  const appSettings = useAppStore((s) => s.appSettings)
  const bounds = useMemo(() => lookbackBoundsFor({ schedule, clock, appSettings }, anaesthetistId), [schedule, clock, appSettings, anaesthetistId])
  const start = selectedISO ?? todayISO
  const [monthISO, setMonthISO] = useState(monthOf(start))
  const days = useMemo(() => new Map(listDaysFor({ schedule }, anaesthetistId, monthISO).map((d) => [d.dateISO, d])), [schedule, anaesthetistId, monthISO])

  return (
    <div data-shot="mobile-lookback-calendar" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 600 }}>Go to a date</div>
        <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>A dot marks a day with one of your Lists.</div>
      </div>
      <MonthGrid
        monthISO={monthISO}
        onMonthChange={setMonthISO}
        bounds={bounds}
        todayISO={todayISO}
        initialFocusISO={start}
        onPickDay={onPick}
        dayLabel={(d) => {
          const n = days.get(d)?.lists ?? 0
          return `${format(parseISO(d), 'EEEE d MMMM yyyy')}, ${n === 0 ? 'no Lists' : `${n} ${n === 1 ? 'List' : 'Lists'}`}`
        }}
        renderDay={(d, { today }) => {
          const has = days.has(d)
          const selected = d === selectedISO
          return (
            <>
              <span className="mono" style={{ fontSize: 14, lineHeight: '16px', fontWeight: today || selected ? 700 : 500, color: selected ? accent.base : today ? accent.base : neutral.ink }}>
                {Number(d.slice(8))}
              </span>
              <span aria-hidden style={{ width: 5, height: 5, borderRadius: 99, background: has ? neutral.slate : 'transparent' }} />
            </>
          )
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// The day chip, the day view and the results
// ---------------------------------------------------------------------------

/** "Fri 13 Mar 2026" with a close glyph: one teal chip that ends the day view. */
export function DayChip({ dateISO, onClose }: { dateISO: string; onClose: () => void }) {
  const label = format(parseISO(dateISO), 'EEE d MMM yyyy')
  return (
    <button
      type="button"
      data-testid="mobile-lists-day-chip"
      aria-label={`${format(parseISO(dateISO), 'EEEE d MMMM yyyy')}. Close the day and go back to your Lists`}
      onClick={onClose}
      style={{ height: 38, minWidth: 44, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 10px 0 16px', borderRadius: 999, border: 'none', background: accent.base, color: neutral.surface, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
    >
      <span className="mono">{label}</span>
      <X size={16} strokeWidth={2.4} aria-hidden />
    </button>
  )
}

/** A day row's right-hand cluster: progress from the one label source, or the Booking count for upcoming work. */
function dayRowRight(l: LookbackList, incomplete: number): ListRowRight {
  if (l.progress === 'toFinish') return { kind: 'toFinish', count: incomplete }
  if (l.progress === 'upcoming') return { kind: 'count', count: l.bookings.length, statusKey: l.list.kind }
  return { kind: 'progress', progress: l.progress }
}

export function LookbackDayView({ anaesthetistId, dateISO, todayISO, onOpenList }: { anaesthetistId: string; dateISO: string; todayISO: string; onOpenList: (listId: string) => void }) {
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const appSettings = useAppStore((s) => s.appSettings)
  const day = useMemo(
    () => listsOnDayFor({ schedule, masters, appSettings }, anaesthetistId, dateISO, todayISO),
    [schedule, masters, appSettings, anaesthetistId, dateISO, todayISO],
  )
  const incomplete = (l: LookbackList): number =>
    Object.values(schedule.bookings).filter((b) => b.listId === l.list.id && b.cancellation === undefined && !b.completed).length
  return (
    <section aria-label={`Lists on ${format(parseISO(dateISO), 'EEEE d MMMM yyyy')}`} data-shot="mobile-lookback-day">
      {day.length === 0 && <div style={{ marginTop: 20, textAlign: 'center', color: neutral.mist, fontSize: 14 }}>{DAY_EMPTY}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {day.map((l) => {
          const isPreop = l.list.kind === 'preop'
          const hospital = locationName(l.list.hospitalId, masters.hospitals)
          const surgeon = masters.surgeons[l.list.surgeonId]
          const n = l.bookings.length
          const right = dayRowRight(l, incomplete(l))
          return (
            <ListRow
              key={l.list.id}
              statusKey={l.list.kind}
              session={l.list.session}
              time={l.startTime}
              title={isPreop ? 'Pre-op assessment' : hospital}
              subtitle={[isPreop ? hospital : surgeon?.name, `${n} ${n === 1 ? 'booking' : 'bookings'}`].filter(Boolean).join(' · ')}
              right={right}
              listId={l.list.id}
              quiet={l.progress === 'submitted'}
              onClick={() => onOpenList(l.list.id)}
            />
          )
        })}
      </div>
    </section>
  )
}

export function useBookingSearch(anaesthetistId: string, rawQuery: string, todayISO: string) {
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  return useMemo(() => searchBookingsFor({ schedule, masters }, anaesthetistId, rawQuery, todayISO), [schedule, masters, anaesthetistId, rawQuery, todayISO])
}

export function LookbackResults({
  upcoming,
  past,
  onOpenBooking,
}: {
  upcoming: BookingSearchRow[]
  past: BookingSearchRow[]
  onOpenBooking: (listId: string, bookingId: string) => void
}) {
  if (upcoming.length === 0 && past.length === 0) {
    return <div style={{ marginTop: 20, textAlign: 'center', color: neutral.mist, fontSize: 14 }}>{SEARCH_EMPTY}</div>
  }
  return (
    <div data-shot="mobile-lookback-search">
      {upcoming.length > 0 && (
        <section aria-label="Upcoming Bookings">
          <GroupHeading>Upcoming</GroupHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.map((r) => <ResultRow key={r.bookingId} row={r} onOpen={onOpenBooking} />)}
          </div>
        </section>
      )}
      {past.length > 0 && (
        <section aria-label="Past Bookings">
          <GroupHeading>Past</GroupHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {past.map((r) => <ResultRow key={r.bookingId} row={r} onOpen={onOpenBooking} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function GroupHeading({ children }: { children: string }) {
  return <div style={{ fontSize: 13, fontWeight: 600, color: neutral.slate, margin: '16px 0 8px' }}>{children}</div>
}

/** A Booking found by search, in the List row's anatomy (a button; the triangle is an image). */
function ResultRow({ row, onOpen }: { row: BookingSearchRow; onOpen: (listId: string, bookingId: string) => void }) {
  const warnings = useBookingWarnings(row.bookingId)
  const when = format(parseISO(row.dateISO), 'EEE d MMM')
  const subtitle = [when, row.session, row.hospitalName, row.procedureNames[0]].filter(Boolean).join(' · ')
  const nhi = nhiBadge(row.nhi).text
  const progress = row.progress === 'upcoming' ? '' : LIST_PROGRESS_LABEL[row.progress]
  return (
    <button
      type="button"
      data-booking-id={row.bookingId}
      aria-label={[row.patientName, subtitle, nhi, progress].filter(Boolean).join(', ')}
      onClick={() => onOpen(row.listId, row.bookingId)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.card, width: '100%', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', background: neutral.surface, border: `1px solid ${neutral.line}`, boxShadow: elevation.e1 }}
    >
      <span style={{ width: 46, flex: 'none', display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: neutral.ink }}>{row.session}</span>
        {row.scheduledTime !== undefined && <span className="mono" style={{ fontSize: 11, color: neutral.mist }}>{row.scheduledTime}</span>}
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: neutral.ink }}>{row.patientName}</span>
          <WarningTriangle warnings={warnings} size="sm" />
        </span>
        <span style={{ fontSize: 12, color: neutral.slate }}>{subtitle}</span>
        <span className="mono" style={{ fontSize: 11.5, color: neutral.mist }}>{nhi}</span>
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
        <ProgressPill progress={row.progress} />
        <ChevronRight size={16} strokeWidth={2.2} color={neutral.mist} aria-hidden />
      </span>
    </button>
  )
}

