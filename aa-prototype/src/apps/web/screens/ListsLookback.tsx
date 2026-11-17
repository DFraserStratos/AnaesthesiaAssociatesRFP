/**
 * The web Lists page's way back to past work (catch-up Phase 38a; US-03.1.4,
 * US-03.1.6, US-03.1.7): the search field (the "Search name" pill anatomy,
 * widened), a "Go to date" input, the results table and the day view, both in
 * the Lists table's anatomy. Own work only (the store's selectors decide).
 */

import { useMemo } from 'react'
import { X } from 'lucide-react'
import { accent, neutral, radius } from '../../../theme/tokens'
import { listsOnDayFor, useAppStore, type BookingSearchRow } from '../../../store'
import { ProgressPill, resolveDisplayStatus, StatusChip, useBookingWarnings, WarningTriangle } from '../../../shared'
import { dayWithYear, locationName, longDay, nhiBadge } from '../../../shared/format'
import { DAY_EMPTY, SEARCH_EMPTY, useLookbackBounds } from '../../../shared/schedule'
import { sessionText } from '../../../domain/outOfHours'
import { DateJumpInput } from '../../../shared/ui/DateFields'

export function WebGoToDate({ anaesthetistId, dayISO, onDayChange }: { anaesthetistId: string; dayISO: string | null; onDayChange: (d: string | null) => void }) {
  const bounds = useLookbackBounds(anaesthetistId)
  return (
    // The shared jump control (UI unification U4) keeps only a full day inside the bounds.
    <DateJumpInput
      label="Go to date"
      labelVisible
      height={38}
      testId="web-lists-go-to-date"
      value={dayISO ?? ''}
      min={bounds.firstISO}
      max={bounds.lastISO}
      onPick={onDayChange}
    />
  )
}

/** The day chip: the picked date with a close glyph, back to the main view. */
export function WebDayChip({ dateISO, onClose }: { dateISO: string; onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label={`${longDay(dateISO)}. Close the day and go back to your Lists`}
      onClick={onClose}
      style={{ height: 32, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 10px 0 14px', borderRadius: radius.pill, border: 'none', background: accent.base, color: neutral.surface, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
    >
      <span className="mono">{dayWithYear(dateISO)}</span>
      <X size={14} strokeWidth={2.4} aria-hidden />
    </button>
  )
}

const th = { textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase', whiteSpace: 'nowrap' } as const
const td = { padding: '12px 20px', verticalAlign: 'middle', whiteSpace: 'nowrap' } as const

function GroupRow({ span, children }: { span: number; children: string }) {
  return (
    <tr style={{ borderBottom: `1px solid ${neutral.line}`, background: neutral.bg }}>
      <th colSpan={span} scope="colgroup" style={{ textAlign: 'left', padding: '10px 20px', fontSize: 13, fontWeight: 600, color: neutral.slate }}>{children}</th>
    </tr>
  )
}

const RESULT_COLUMNS = ['Date', 'Session', 'Patient', 'NHI', 'Hospital', 'Procedure', 'Progress']

export function WebResultsTable({ upcoming, past, onOpenBooking }: { upcoming: BookingSearchRow[]; past: BookingSearchRow[]; onOpenBooking: (listId: string, bookingId: string) => void }) {
  return (
    <table data-shot="web-lookback-search" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${neutral.line}` }}>
          {RESULT_COLUMNS.map((h) => <th key={h} style={th}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {upcoming.length === 0 && past.length === 0 && (
          <tr>
            <td colSpan={RESULT_COLUMNS.length} style={{ padding: '24px 20px', textAlign: 'center', color: neutral.mist }}>
              {SEARCH_EMPTY}
            </td>
          </tr>
        )}
        {upcoming.length > 0 && <GroupRow span={RESULT_COLUMNS.length}>Upcoming</GroupRow>}
        {upcoming.map((r) => <ResultRow key={r.bookingId} row={r} onOpen={onOpenBooking} />)}
        {past.length > 0 && <GroupRow span={RESULT_COLUMNS.length}>Past</GroupRow>}
        {past.map((r) => <ResultRow key={r.bookingId} row={r} onOpen={onOpenBooking} />)}
      </tbody>
    </table>
  )
}

function ResultRow({ row, onOpen }: { row: BookingSearchRow; onOpen: (listId: string, bookingId: string) => void }) {
  const warnings = useBookingWarnings(row.bookingId)
  const date = dayWithYear(row.dateISO)
  return (
    <tr
      data-booking-id={row.bookingId}
      onClick={() => onOpen(row.listId, row.bookingId)}
      style={{ borderBottom: `1px solid ${neutral.sunken}`, cursor: 'pointer' }}
    >
      <td className="mono" style={td}>
        <button
          type="button"
          aria-label={`Open ${row.patientName}'s Booking on ${date} ${sessionText(row.session)}`}
          onClick={(e) => {
            e.stopPropagation()
            onOpen(row.listId, row.bookingId)
          }}
          style={{ border: 'none', background: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' }}
        >
          {date}
        </button>
      </td>
      <td className="mono" style={td}>{sessionText(row.session)}{row.scheduledTime !== undefined ? ` · ${row.scheduledTime}` : ''}</td>
      <td style={td}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          {row.patientName}
          <WarningTriangle warnings={warnings} size="sm" />
        </span>
      </td>
      <td className="mono" style={{ ...td, color: row.nhi === undefined ? neutral.mist : neutral.ink }}>{row.nhi ?? nhiBadge(undefined).text}</td>
      <td style={td}>{row.hospitalName}</td>
      <td style={{ ...td, whiteSpace: 'normal' }}>{row.procedureNames[0] ?? ''}</td>
      <td style={td}><ProgressPill progress={row.progress} /></td>
    </tr>
  )
}

const DAY_COLUMNS = ['Session', 'Time', 'Location', 'Bookings', 'Status', 'Progress']

export function WebDayTable({ anaesthetistId, dateISO, todayISO, onOpenList }: { anaesthetistId: string; dateISO: string; todayISO: string; onOpenList: (listId: string) => void }) {
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const appSettings = useAppStore((s) => s.appSettings)
  const day = useMemo(() => listsOnDayFor({ schedule, masters, appSettings }, anaesthetistId, dateISO, todayISO), [schedule, masters, appSettings, anaesthetistId, dateISO, todayISO])
  return (
    <table data-shot="web-lookback-day" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${neutral.line}` }}>
          {DAY_COLUMNS.map((h) => <th key={h} style={th}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {day.length === 0 && (
          <tr>
            <td colSpan={DAY_COLUMNS.length} style={{ padding: '24px 20px', textAlign: 'center', color: neutral.mist }}>{DAY_EMPTY}</td>
          </tr>
        )}
        {day.map((d) => {
          const surgeon = masters.surgeons[d.list.surgeonId]
          const location = [locationName(d.list.hospitalId, masters.hospitals), surgeon?.name].filter(Boolean).join(' · ')
          const c = resolveDisplayStatus(d.list.kind, masters.slotStatuses).visual
          return (
            <tr key={d.list.id} data-list-id={d.list.id} onClick={() => onOpenList(d.list.id)} style={{ borderBottom: `1px solid ${neutral.sunken}`, cursor: 'pointer' }}>
              <td className="mono" style={td}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span aria-hidden style={{ width: 3, height: 20, borderRadius: radius.pill, background: c.solid }} />
                  <button
                    type="button"
                    aria-label={`Open List ${dayWithYear(dateISO)} ${sessionText(d.list.session)}, ${location}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenList(d.list.id)
                    }}
                    style={{ border: 'none', background: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' }}
                  >
                    {sessionText(d.list.session)}
                  </button>
                </span>
              </td>
              <td className="mono" style={td}>{d.startTime}</td>
              <td style={td}>{location}</td>
              <td className="mono" style={td}>{d.bookings.length}</td>
              <td style={td}><StatusChip status={d.list.kind} /></td>
              <td style={td}><ProgressPill progress={d.progress} /></td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
