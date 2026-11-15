import { useMemo, useState } from 'react'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { listsOnDayFor, useAppStore } from '@proto/store'
import { useBookingWarnings, WarningTriangle } from '@proto/shared'
import { DAY_EMPTY, SEARCH_EMPTY, useBookingSearch, useLookbackBounds } from '@proto/shared/schedule'
import { dayWithYear, locationName, nhiBadge } from '@proto/shared/format'
import { sessionText } from '@proto/domain/outOfHours'
import { SearchField as SharedSearchField } from '../../shared/searchField'
import { cn } from '@/lib/utils'
import { DayPicker } from './GoToDate'
import { coreFeatures, DataTable, Panel, ProgressBadge, Said, StatusBadge, StatusBar, toneFor, Wide, type ListProgress, type OpenMode } from './shared'

interface Fx {
  anaesthetistId: string
  todayISO: string
  searchSeed: string
  pastDayISO?: string
}

/* ------------------------------------------------------------------ */
/* WebResultsTable                                                     */
/* ------------------------------------------------------------------ */

interface ResultRow {
  bookingId: string
  listId: string
  patientName: string
  nhi?: string
  dateISO: string
  session: string
  scheduledTime?: string
  hospitalName: string
  procedureNames: string[]
  progress: ListProgress
  group: 'Upcoming' | 'Past'
}

const resultHelper = createColumnHelper<typeof coreFeatures, ResultRow>()

/** The patient cell reads its own warnings (a hook per row), as ResultRow does today. */
function PatientCell({ row }: { row: ResultRow }) {
  const warnings = useBookingWarnings(row.bookingId)
  return (
    <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:font-semibold">
      {row.patientName}
      <WarningTriangle warnings={warnings} size="sm" />
    </span>
  )
}

const resultColumns = resultHelper.columns([
  resultHelper.accessor('dateISO', { id: 'date', header: 'Date', cell: (i) => dayWithYear(i.getValue()) }),
  resultHelper.accessor('session', { header: 'Session', cell: ({ row }) => `${sessionText(row.original.session)}${row.original.scheduledTime !== undefined ? ` · ${row.original.scheduledTime}` : ''}` }),
  resultHelper.accessor('patientName', { id: 'patient', header: 'Patient', cell: ({ row }) => <PatientCell row={row.original} /> }),
  resultHelper.accessor('nhi', {
    header: 'NHI',
    cell: (i) => <span className={cn(i.getValue() === undefined && 'tw:text-mist')}>{i.getValue() ?? (nhiBadge(undefined) as { text: string }).text}</span>,
  }),
  resultHelper.accessor('hospitalName', { id: 'hospital', header: 'Hospital' }),
  resultHelper.accessor((r) => r.procedureNames[0] ?? '', { id: 'procedure', header: 'Procedure', cell: (i) => <span className="tw:whitespace-normal">{i.getValue()}</span> }),
  resultHelper.accessor('progress', { header: 'Progress', cell: (i) => <ProgressBadge progress={i.getValue()} /> }),
])

/** The search field: the shared search box (WebSearchField's wide pill). */
function SearchField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <SharedSearchField size="wide" value={value} onChange={onChange} label="Search your Bookings" placeholder="Search patient name or NHI" clearLabel="Clear the search field" />
}

/** Search results, Upcoming then Past, on TanStack Table + shadcn Table; the same useBookingSearch as today. */
export function ResultsTableReplacement({ openMode = 'button' }: { openMode?: OpenMode }) {
  const f = useWebFixtures() as Fx
  const [query, setQuery] = useState(f.searchSeed)
  const [said, setSaid] = useState<string | null>(null)
  const results = useBookingSearch(f.anaesthetistId, query, f.todayISO) as { upcoming: Omit<ResultRow, 'group'>[]; past: Omit<ResultRow, 'group'>[] }
  const data = useMemo<ResultRow[]>(
    () => [...results.upcoming.map((r) => ({ ...r, group: 'Upcoming' as const })), ...results.past.map((r) => ({ ...r, group: 'Past' as const }))],
    [results],
  )
  const table = useTable({ features: coreFeatures, columns: resultColumns, data, getRowId: (r) => r.bookingId })
  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      <Said text={said} />
      <SearchField value={query} onChange={setQuery} />
      <Wide width={1000}>
        <Panel flush>
          <DataTable
            table={table}
            mono={['date', 'session', 'nhi']}
            groupOf={(r) => r.group}
            empty={SEARCH_EMPTY}
            openMode={openMode}
            onOpen={(r) => setSaid(`Would open Booking ${r.bookingId}`)}
            handle={{ column: 'date', label: (r) => `Open ${r.patientName}'s Booking on ${dayWithYear(r.dateISO)} ${sessionText(r.session)}` }}
            rowAttrs={(r) => ({ 'data-booking-id': r.bookingId })}
          />
        </Panel>
      </Wide>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* WebDayTable                                                         */
/* ------------------------------------------------------------------ */

interface DayRow {
  list: { id: string; kind: string; session: string; hospitalId: string; surgeonId: string }
  startTime: string
  bookings: unknown[]
  progress: ListProgress
}

const dayHelper = createColumnHelper<typeof coreFeatures, DayRow>()

/** One day's Lists for Go to date, on TanStack Table + shadcn Table; the same listsOnDayFor as today. */
export function DayTableReplacement({ openMode = 'button' }: { openMode?: OpenMode }) {
  const f = useWebFixtures() as Fx
  const bounds = useLookbackBounds(f.anaesthetistId) as { firstISO: string; lastISO: string }
  const schedule = useAppStore((s: any) => s.schedule)
  const masters = useAppStore((s: any) => s.masters)
  const appSettings = useAppStore((s: any) => s.appSettings)
  const [dateISO, setDateISO] = useState(f.pastDayISO ?? f.todayISO)
  const [said, setSaid] = useState<string | null>(null)
  const data = useMemo(
    () => listsOnDayFor({ schedule, masters, appSettings }, f.anaesthetistId, dateISO, f.todayISO) as DayRow[],
    [schedule, masters, appSettings, f.anaesthetistId, dateISO, f.todayISO],
  )
  const locationOf = (r: DayRow) => [locationName(r.list.hospitalId, masters.hospitals), masters.surgeons[r.list.surgeonId]?.name].filter(Boolean).join(' · ')

  const columns = useMemo(
    () =>
      dayHelper.columns([
        dayHelper.accessor((r) => r.list.session, {
          id: 'session',
          header: 'Session',
          cell: ({ row }) => (
            <span className="tw:inline-flex tw:items-center tw:gap-2">
              <StatusBar token={toneFor(row.original.list.kind, masters.slotStatuses).token} />
              {sessionText(row.original.list.session)}
            </span>
          ),
        }),
        dayHelper.accessor('startTime', { id: 'time', header: 'Time' }),
        dayHelper.accessor((r) => locationOf(r), { id: 'location', header: 'Location' }),
        dayHelper.accessor((r) => r.bookings.length, { id: 'bookings', header: 'Bookings' }),
        dayHelper.accessor((r) => r.list.kind, { id: 'status', header: 'Status', cell: (i) => <StatusBadge status={i.getValue()} /> }),
        dayHelper.accessor('progress', { header: 'Progress', cell: (i) => <ProgressBadge progress={i.getValue()} /> }),
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [masters],
  )
  const table = useTable({ features: coreFeatures, columns, data, getRowId: (r) => r.list.id })

  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      <Said text={said} />
      <DayPicker label="Day to show" valueISO={dateISO} onChange={(d) => d !== null && setDateISO(d)} firstISO={bounds.firstISO} lastISO={bounds.lastISO} todayISO={f.todayISO} clearable={false} />
      <Wide width={900}>
        <Panel flush>
          <DataTable
            table={table}
            mono={['session', 'time', 'bookings']}
            empty={DAY_EMPTY}
            openMode={openMode}
            onOpen={(r) => setSaid(`Would open List ${r.list.id}`)}
            handle={{ column: 'session', label: (r) => `Open List ${dayWithYear(dateISO)} ${sessionText(r.list.session)}, ${locationOf(r)}` }}
            rowAttrs={(r) => ({ 'data-list-id': r.list.id })}
          />
        </Panel>
      </Wide>
    </div>
  )
}
