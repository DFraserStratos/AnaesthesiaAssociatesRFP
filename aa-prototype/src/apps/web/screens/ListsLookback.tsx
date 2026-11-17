/**
 * The web Lists page's way back to past work (catch-up Phase 38a; US-03.1.4,
 * US-03.1.6, US-03.1.7): the search field (the "Search name" pill anatomy,
 * widened), a "Go to date" input, the results table and the day view, both in
 * the Lists table's anatomy. Own work only (the store's selectors decide).
 */

import { useMemo } from 'react'
import { neutral, radius } from '../../../theme/tokens'
import { listsOnDayFor, useAppStore, type BookingSearchRow } from '../../../store'
import { ProgressPill, resolveDisplayStatus, StatusChip, useBookingWarnings, WarningTriangle } from '../../../shared'
import { dayWithYear, locationName, longDay, nhiBadge } from '../../../shared/format'
import { DAY_EMPTY, SEARCH_EMPTY, useLookbackBounds } from '../../../shared/schedule'
import { sessionText } from '../../../domain/outOfHours'
import { DateJumpInput } from '../../../shared/ui/DateFields'
import { ClickableRow, GroupRow, RowOpenButton, TableShell, Td, Th } from '../../../shared/table'

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


const RESULT_COLUMNS = ['Date', 'Session', 'Patient', 'NHI', 'Hospital', 'Procedure', 'Progress']

export function WebResultsTable({ upcoming, past, onOpenBooking }: { upcoming: BookingSearchRow[]; past: BookingSearchRow[]; onOpenBooking: (listId: string, bookingId: string) => void }) {
  return (
    <TableShell label="Search results" tableData={{ 'data-shot': 'web-lookback-search' }}>
      <thead>
        <tr>
          {RESULT_COLUMNS.map((h) => <Th key={h}>{h}</Th>)}
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
    </TableShell>
  )
}

function ResultRow({ row, onOpen }: { row: BookingSearchRow; onOpen: (listId: string, bookingId: string) => void }) {
  const warnings = useBookingWarnings(row.bookingId)
  const date = dayWithYear(row.dateISO)
  const open = () => onOpen(row.listId, row.bookingId)
  return (
    <ClickableRow data-booking-id={row.bookingId} onOpen={open}>
      <Td mono>
        <RowOpenButton label={`Open ${row.patientName}'s Booking on ${date} ${sessionText(row.session)}`} onOpen={open}>
          {date}
        </RowOpenButton>
      </Td>
      <Td mono>{sessionText(row.session)}{row.scheduledTime !== undefined ? ` · ${row.scheduledTime}` : ''}</Td>
      <Td>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          {row.patientName}
          <WarningTriangle warnings={warnings} size="sm" />
        </span>
      </Td>
      <Td mono style={{ color: row.nhi === undefined ? neutral.mist : neutral.ink }}>{row.nhi ?? nhiBadge(undefined).text}</Td>
      <Td>{row.hospitalName}</Td>
      <Td nowrap={false}>{row.procedureNames[0] ?? ''}</Td>
      <Td><ProgressPill progress={row.progress} /></Td>
    </ClickableRow>
  )
}

const DAY_COLUMNS = ['Session', 'Time', 'Location', 'Bookings', 'Status', 'Progress']

export function WebDayTable({ anaesthetistId, dateISO, todayISO, onOpenList }: { anaesthetistId: string; dateISO: string; todayISO: string; onOpenList: (listId: string) => void }) {
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const appSettings = useAppStore((s) => s.appSettings)
  const day = useMemo(() => listsOnDayFor({ schedule, masters, appSettings }, anaesthetistId, dateISO, todayISO), [schedule, masters, appSettings, anaesthetistId, dateISO, todayISO])
  return (
    <TableShell label={`Lists on ${longDay(dateISO)}`} tableData={{ 'data-shot': 'web-lookback-day' }}>
      <thead>
        <tr>
          {DAY_COLUMNS.map((h) => <Th key={h}>{h}</Th>)}
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
          const open = () => onOpenList(d.list.id)
          return (
            <ClickableRow key={d.list.id} data-list-id={d.list.id} onOpen={open}>
              <Td mono>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span aria-hidden style={{ width: 3, height: 20, borderRadius: radius.pill, background: c.solid }} />
                  <RowOpenButton label={`Open List ${dayWithYear(dateISO)} ${sessionText(d.list.session)}, ${location}`} onOpen={open}>
                    {sessionText(d.list.session)}
                  </RowOpenButton>
                </span>
              </Td>
              <Td mono>{d.startTime}</Td>
              <Td>{location}</Td>
              <Td mono>{d.bookings.length}</Td>
              <Td><StatusChip status={d.list.kind} /></Td>
              <Td><ProgressPill progress={d.progress} /></Td>
            </ClickableRow>
          )
        })}
      </tbody>
    </TableShell>
  )
}
