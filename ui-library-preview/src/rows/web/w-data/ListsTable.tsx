import { useMemo, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { mainViewFor, timesForList, useAppStore } from '@proto/store'
import { emptySessionLine, useLegendKeys } from '@proto/shared'
import { locationName } from '@proto/shared/format'
import { hasLeftMainView, listProgress } from '@proto/domain/listProgress'
import { sessionText } from '@proto/domain/outOfHours'
import { surgeonSpecialtyLabel } from '@proto/domain/specialties'
import { useLookbackBounds } from '@proto/shared/schedule'
import { SearchField } from '../../shared/searchField'
import { dayText } from '../../shared/DatePickerTrigger'
import { DayPicker } from './GoToDate'
import { coreFeatures, DataTable, Panel, ProgressBadge, Said, StatusBadge, StatusBar, toneFor, Wide, type ListProgress, type OpenMode } from './shared'

interface Fixtures {
  anaesthetistId: string
  todayISO: string
}

interface ListLike {
  id: string
  kind: string
  slotId?: string
  dateISO: string
  session: string
  hospitalId: string
  surgeonId: string
  notes?: string
  state: string
}

interface Row {
  key: string
  group?: string
  dateISO: string
  session: string
  times: { startTime: string; endTime: string; overridden: boolean }
  displayKey: string
  list?: ListLike
  progress?: ListProgress
  description: string
}

const helper = createColumnHelper<typeof coreFeatures, Row>()

/**
 * The web Lists table on TanStack Table v9 + shadcn Table: the same rows as ListsScreen (an "Earlier, not
 * yet authorised" group, then "From today" to the default To bound of today + 4 weeks), read from the
 * same store selectors. The search, Go to date and To controls are their own rows and are left out.
 */
export function ListsTableReplacement({ openMode = 'button' }: { openMode?: OpenMode }) {
  const f = useWebFixtures() as Fixtures
  const { anaesthetistId, todayISO } = f
  const lists = useAppStore((s: any) => s.schedule.lists)
  const slots = useAppStore((s: any) => s.schedule.slots)
  const bookings = useAppStore((s: any) => s.schedule.bookings)
  const appSettings = useAppStore((s: any) => s.appSettings)
  const hospitals = useAppStore((s: any) => s.masters.hospitals)
  const surgeons = useAppStore((s: any) => s.masters.surgeons)
  const specialties = useAppStore((s: any) => s.masters.specialties)
  const slotStatuses = useAppStore((s: any) => s.masters.slotStatuses)
  const legendKeys = useLegendKeys() as string[]
  const [said, setSaid] = useState<string | null>(null)

  const [toISO, setToISO] = useState(() => format(addDays(parseISO(todayISO), 28), 'yyyy-MM-dd'))
  const bounds = useLookbackBounds(anaesthetistId) as { firstISO: string; lastISO: string }
  const [query, setQuery] = useState('')
  const [goISO, setGoISO] = useState<string | null>(null)

  const data = useMemo(() => {
    const active = new Map<string, { completed: boolean }[]>()
    for (const b of Object.values(bookings) as { listId: string; cancellation?: unknown; completed: boolean }[]) {
      if (b.cancellation !== undefined) continue
      const arr = active.get(b.listId)
      if (arr === undefined) active.set(b.listId, [b])
      else arr.push(b)
    }
    const slotState = { schedule: { slots, lists, bookings }, appSettings, masters: { slotStatuses } }
    const describe = (l: ListLike): string => {
      const location = locationName(l.hospitalId, hospitals) as string
      if (l.kind === 'preop') return l.notes ?? `Pre-op assessment clinic · ${location}`
      const surgeon = surgeons[l.surgeonId]
      return [location, surgeon?.name, surgeonSpecialtyLabel({ specialties }, surgeon)].filter((p) => p !== undefined && p !== '').join(' · ')
    }
    const progressOf = (l: ListLike) => listProgress(l, active.get(l.id) ?? [], todayISO) as ListProgress
    const view = mainViewFor(slotState, anaesthetistId, todayISO, toISO)
    const earlier: Row[] = (view.earlier as ListLike[]).map((l) => ({
      key: l.id,
      group: 'Earlier, not yet authorised',
      dateISO: l.dateISO,
      session: l.session,
      times: timesForList(slotState, l),
      displayKey: l.kind,
      list: l,
      progress: progressOf(l),
      description: describe(l),
    }))
    const hasEarlier = earlier.length > 0
    const upcoming: Row[] = (view.upcoming as { slot: { id: string; dateISO: string; session: string; status: string; note?: string }; times: Row['times']; displayKey: string; list?: ListLike; open: boolean }[]).map((v) => {
      const l = v.list !== undefined && !hasLeftMainView(v.list) ? v.list : undefined
      return {
        key: v.slot.id,
        ...(hasEarlier ? { group: 'From today' } : {}),
        dateISO: v.slot.dateISO,
        session: v.slot.session,
        times: v.times,
        displayKey: v.displayKey,
        ...(l !== undefined ? { list: l, progress: progressOf(l) } : {}),
        description: l !== undefined ? describe(l) : (emptySessionLine(v.slot, v.open, slotStatuses) as string),
      }
    })
    return [...earlier, ...upcoming]
  }, [lists, slots, bookings, appSettings, slotStatuses, hospitals, surgeons, specialties, anaesthetistId, todayISO, toISO])

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('dateISO', {
          id: 'date',
          header: 'Date',
          cell: ({ row }) => {
            const r = row.original
            return (
              <span className="tw:inline-flex tw:items-center tw:gap-2">
                <StatusBar token={toneFor(r.displayKey, slotStatuses).token} quiet={r.progress === 'submitted'} />
                {format(parseISO(r.dateISO), 'EEE d MMM')}
                {r.dateISO === todayISO && <span className="tw:text-[11px] tw:font-semibold tw:text-mist">Today</span>}
              </span>
            )
          },
        }),
        helper.accessor('session', { header: 'Session', cell: (i) => sessionText(i.getValue()) }),
        helper.display({ id: 'from', header: 'From', cell: ({ row }) => (row.original.list !== undefined || row.original.times.overridden ? row.original.times.startTime : '·') }),
        helper.display({ id: 'to', header: 'To', cell: ({ row }) => (row.original.list !== undefined || row.original.times.overridden ? row.original.times.endTime : '·') }),
        helper.accessor('description', { header: 'Description' }),
        helper.accessor('displayKey', { header: 'Status', cell: (i) => <StatusBadge status={i.getValue()} /> }),
        helper.display({ id: 'progress', header: 'Progress', cell: ({ row }) => (row.original.progress !== undefined ? <ProgressBadge progress={row.original.progress} /> : null) }),
      ]),
    [slotStatuses, todayISO],
  )

  const table = useTable({ features: coreFeatures, columns, data, getRowId: (r) => r.key })

  return (
    <Wide width={1180}>
      <div className="tw:flex tw:flex-col tw:gap-4">
        <Said text={said} />
        <div>
          <h1 className="tw:m-0 tw:text-[28px] tw:leading-[34px] tw:font-bold tw:tracking-[-0.015em]">Lists</h1>
          <div className="tw:mt-1 tw:text-sm tw:text-slate">Your Lists from today, with any earlier ones not yet authorised. From/To are the actual session times.</div>
        </div>
        {/* The toolbar: search and Go to date only report here (each is its own row); To narrows the table. */}
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
          <SearchField
            size="wide"
            value={query}
            onChange={(q) => {
              setQuery(q)
              setSaid(q === '' ? null : `Would search for "${q}" (the search results are their own row)`)
            }}
            label="Search your Bookings"
            placeholder="Search patient name or NHI"
            clearLabel="Clear the search field"
          />
          <DayPicker
            label="Go to date"
            valueISO={goISO}
            onChange={(d) => {
              setGoISO(d)
              setSaid(d === null ? null : `Would go to ${dayText(d)} (the day table is its own row)`)
            }}
            firstISO={bounds.firstISO}
            lastISO={bounds.lastISO}
            todayISO={todayISO}
          />
          <DayPicker label="To" valueISO={toISO} onChange={(d) => d !== null && setToISO(d)} firstISO={todayISO} lastISO={bounds.lastISO > toISO ? bounds.lastISO : toISO} todayISO={todayISO} clearable={false} />
        </div>
        <div className="tw:flex tw:min-h-8 tw:flex-wrap tw:items-center tw:gap-2">
          {legendKeys.map((k) => (
            <StatusBadge key={k} status={k} />
          ))}
        </div>
        <Panel flush>
          <DataTable
            table={table}
            mono={['session', 'from', 'to']}
            groupOf={(r) => r.group}
            empty="No Lists from today in this date range."
            openMode={openMode}
            canOpen={(r) => r.list !== undefined}
            onOpen={(r) => setSaid(`Would open List ${r.list?.id ?? ''}`)}
            handle={{ column: 'date', label: (r) => `Open List ${format(parseISO(r.dateISO), 'EEE d MMM')} ${sessionText(r.session)}, ${r.description}` }}
            rowAttrs={(r) => ({ 'data-list-id': r.list?.id, 'data-quiet': r.progress === 'submitted' ? 'true' : undefined })}
            rowClassName={(r) => [r.dateISO === todayISO ? 'tw:bg-[var(--aa-bg)]' : '', r.progress === 'submitted' ? 'tw:text-slate' : ''].join(' ')}
          />
        </Panel>
      </div>
    </Wide>
  )
}
