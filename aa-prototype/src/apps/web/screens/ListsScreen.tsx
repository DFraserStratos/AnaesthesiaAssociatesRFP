import { useMemo, useState } from 'react'
import { locationName, shortDay } from '../../../shared/format'
import { addDays, format, parseISO } from 'date-fns'
import { accent, neutral, radius } from '../../../theme/tokens'
import type { AssignedList, Booking, DisplayKey } from '../../../domain/types'
import type { EffectiveSlotTimes } from '../../../domain/slots'
import { hasLeftMainView, listProgress, type ListProgress } from '../../../domain/listProgress'
import { mainViewFor, timesForList, useAppStore, type SlotView } from '../../../store'
import { emptySessionLine, ProgressPill, resolveDisplayStatus, StatusChip, StatusLegend } from '../../../shared'
import { Panel } from '../components'
import { searchCountLine, useBookingSearch, useFieldText } from '../../../shared/schedule'
import { NameSearchBox } from '../../../shared/ui/NameSearchBox'
import { FilterDateInput } from '../../../shared/ui/DateFields'
import { WebDayChip, WebDayTable, WebGoToDate, WebResultsTable } from './ListsLookback'
import { sessionText } from '../../../domain/outOfHours'
import { surgeonSpecialtyLabel } from '../../../domain/specialties'

interface ListsScreenProps {
  anaesthetistId: string
  todayISO: string
  onOpenList: (listId: string) => void
  /** The search text (`?q=`). */
  query?: string
  /** The picked date (`?day=`), or null for the main view. */
  dayISO?: string | null
  onQueryChange?: (query: string) => void
  onDayChange?: (dayISO: string | null) => void
  onOpenBooking?: (listId: string, bookingId: string) => void
}

interface Row {
  key: string
  slotId?: string
  dateISO: string
  session: string
  times: EffectiveSlotTimes
  displayKey: DisplayKey
  list?: AssignedList
  progress?: ListProgress
  description: string
}

const COLUMNS = 7

/**
 * The anaesthetist's Lists table, their main view on the web (W2; catch-up
 * Phase 38a, US-07.4.2, US-03.1.4). It opens with an "Earlier, not yet
 * authorised" group (every earlier List of theirs not yet authorised that holds
 * a Booking, oldest first, at any distance back) and then the sessions from
 * today to the To bound (default today +4 weeks), from the same Slot views every
 * app reads (catch-up Phase 28). A List leaves at AUTHORISED (`hasLeftMainView`);
 * search finds it afterwards. The Progress column reads `LIST_PROGRESS_LABEL`;
 * a submitted List is quieter and still editable.
 *
 * Search (`?q=`, two or more characters) shows the anaesthetist's matching
 * Bookings in place of the table, Upcoming then Past; "Go to date" (`?day=`)
 * shows that date's Lists under a date chip (US-03.1.6, US-03.1.7). The two are
 * exclusive; both live in the URL so Back from detail returns to them.
 */
export function ListsScreen({
  anaesthetistId,
  todayISO,
  onOpenList,
  query = '',
  dayISO = null,
  onQueryChange = () => undefined,
  onDayChange = () => undefined,
  onOpenBooking = () => undefined,
}: ListsScreenProps) {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const slotsRecord = useAppStore((s) => s.schedule.slots)
  const bookingsRecord = useAppStore((s) => s.schedule.bookings)
  const appSettings = useAppStore((s) => s.appSettings)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const specialties = useAppStore((s) => s.masters.specialties)
  const slotStatuses = useAppStore((s) => s.masters.slotStatuses)

  const [toISO, setToISO] = useState(format(addDays(parseISO(todayISO), 28), 'yyyy-MM-dd'))
  const results = useBookingSearch(anaesthetistId, query, todayISO)
  const [searchText, setSearchText] = useFieldText(query, onQueryChange)
  const mode: 'main' | 'day' | 'search' =
    results.query.kind === 'nhi' || results.query.kind === 'name' ? 'search' : dayISO !== null ? 'day' : 'main'
  const shown = results.upcoming.length + results.past.length

  const { earlier, upcoming } = useMemo(() => {
    const active = new Map<string, Booking[]>()
    for (const b of Object.values(bookingsRecord)) {
      if (b.cancellation !== undefined) continue
      const arr = active.get(b.listId)
      if (arr === undefined) active.set(b.listId, [b])
      else arr.push(b)
    }
    const slotState = { schedule: { slots: slotsRecord, lists: listsRecord, bookings: bookingsRecord }, appSettings, masters: { slotStatuses } }

    function describeList(l: AssignedList): string {
      const location = locationName(l.hospitalId, hospitals)
      if (l.kind === 'preop') return l.notes ?? `Pre-op assessment clinic · ${location}`
      const surgeon = surgeons[l.surgeonId]
      return [location, surgeon?.name, surgeonSpecialtyLabel({ specialties }, surgeon)].filter((p): p is string => p !== undefined && p !== '').join(' · ')
    }
    const progressOf = (l: AssignedList) => listProgress(l, active.get(l.id) ?? [], todayISO)

    const view = mainViewFor(slotState, anaesthetistId, todayISO, toISO === '' ? '9999-12-31' : toISO)
    const earlierRows = view.earlier.map(
      (l): Row => ({
        key: l.id,
        slotId: l.slotId,
        dateISO: l.dateISO,
        session: l.session,
        times: timesForList(slotState, l),
        displayKey: l.kind,
        list: l,
        progress: progressOf(l),
        description: describeList(l),
      }),
    )
    const upcomingRows = view.upcoming.map((v: SlotView): Row => {
      const l = v.list !== undefined && !hasLeftMainView(v.list) ? v.list : undefined
      return {
        key: v.slot.id,
        slotId: v.slot.id,
        dateISO: v.slot.dateISO,
        session: v.slot.session,
        times: v.times,
        displayKey: v.displayKey,
        ...(l !== undefined ? { list: l, progress: progressOf(l) } : {}),
        description: l !== undefined ? describeList(l) : emptySessionLine(v.slot, v.open, slotStatuses),
      }
    })
    return { earlier: earlierRows, upcoming: upcomingRows }
  }, [listsRecord, slotsRecord, bookingsRecord, appSettings, slotStatuses, hospitals, surgeons, anaesthetistId, todayISO, toISO])

  function renderRow(r: Row) {
    const c = resolveDisplayStatus(r.displayKey, slotStatuses).visual
    const showTimes = r.list !== undefined || r.times.overridden
    const quiet = r.progress === 'submitted'
    const dateText = shortDay(r.dateISO)
    const list = r.list
    return (
      <tr
        key={r.key}
        data-slot-id={r.slotId}
        data-list-id={list?.id}
        data-shot={r.session === 'OOH' ? 'out-of-hours-row' : undefined}
        data-quiet={quiet ? 'true' : undefined}
        onClick={list !== undefined ? () => onOpenList(list.id) : undefined}
        style={{
          borderBottom: `1px solid ${neutral.sunken}`,
          cursor: list !== undefined ? 'pointer' : 'default',
          background: r.dateISO === todayISO ? neutral.bg : neutral.surface,
          color: quiet ? neutral.slate : neutral.ink,
        }}
      >
        <Td>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span aria-hidden style={{ width: 3, height: 20, borderRadius: radius.pill, background: c.solid, flex: 'none', opacity: quiet ? 0.45 : 1 }} />
            {list !== undefined ? (
              // The row's keyboard handle: a plain button on the date (the row click stays for the mouse).
              <button
                type="button"
                aria-label={`Open List ${dateText} ${sessionText(r.session)}, ${r.description}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenList(list.id)
                }}
                style={{ border: 'none', background: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' }}
              >
                {dateText}
              </button>
            ) : (
              dateText
            )}
            {r.dateISO === todayISO && <span style={{ fontSize: 11, fontWeight: 600, color: neutral.mist }}>Today</span>}
          </span>
        </Td>
        <Td mono>{sessionText(r.session)}</Td>
        <Td mono>{showTimes ? r.times.startTime : '·'}</Td>
        <Td mono>{showTimes ? r.times.endTime : '·'}</Td>
        <Td>{r.description}</Td>
        <Td><StatusChip status={r.displayKey} /></Td>
        <Td>{r.progress !== undefined ? <ProgressPill progress={r.progress} /> : null}</Td>
      </tr>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 700, letterSpacing: '-0.015em' }}>Lists</h1>
          <div style={{ fontSize: 14, color: neutral.slate, marginTop: 4 }}>Your Lists from today, with any earlier ones not yet authorised. From/To are the actual session times.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* The shared search box on the page (UI unification U4): the 38px pill beside Go to date. */}
          <NameSearchBox
            value={searchText}
            onChange={setSearchText}
            label="Search your Bookings"
            placeholder="Search patient name or NHI"
            size="pill"
            height={38}
            width={280}
            fill="surface"
            testId="web-lists-search"
            clearLabel="Clear the search field"
          />
          <WebGoToDate anaesthetistId={anaesthetistId} dayISO={dayISO} onDayChange={onDayChange} />
          {mode === 'main' && (
            <FilterDateInput label="To" labelPlacement="inline" height={38} value={toISO} min={todayISO} onChange={setToISO} />
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', minHeight: 32 }}>
        {mode === 'main' && <StatusLegend variant="chips" />}
        {mode === 'day' && dayISO !== null && <WebDayChip dateISO={dayISO} onClose={() => onDayChange(null)} />}
        {mode === 'search' && (
          <>
            {shown > 0 && (
              <span role="status" style={{ fontSize: 13, fontWeight: 600, color: neutral.slate }}>
                {searchCountLine(results.total, shown, query)}
              </span>
            )}
            <button
              type="button"
              onClick={() => onQueryChange('')}
              style={{ border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Clear search
            </button>
          </>
        )}
      </div>

      {mode === 'search' && (
        <Panel flush>
          <div style={{ overflowX: 'auto' }}>
            <WebResultsTable upcoming={results.upcoming} past={results.past} onOpenBooking={onOpenBooking} />
          </div>
        </Panel>
      )}
      {mode === 'day' && dayISO !== null && (
        <Panel flush>
          <div style={{ overflowX: 'auto' }}>
            <WebDayTable anaesthetistId={anaesthetistId} dateISO={dayISO} todayISO={todayISO} onOpenList={onOpenList} />
          </div>
        </Panel>
      )}
      {mode === 'main' && (
      <Panel flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${neutral.line}` }}>
                <Th>Date</Th>
                <Th>Session</Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th>Description</Th>
                <Th>Status</Th>
                <Th>Progress</Th>
              </tr>
            </thead>
            {earlier.length > 0 && (
              <tbody data-shot="web-main-view-earlier">
                <GroupRow>Earlier, not yet authorised</GroupRow>
                {earlier.map(renderRow)}
              </tbody>
            )}
            <tbody>
              {earlier.length > 0 && <GroupRow>From today</GroupRow>}
              {upcoming.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS} style={{ padding: '24px 20px', textAlign: 'center', color: neutral.mist }}>
                    No Lists from today in this date range.
                  </td>
                </tr>
              )}
              {upcoming.map(renderRow)}
            </tbody>
          </table>
        </div>
      </Panel>
      )}
    </div>
  )
}

function GroupRow({ children }: { children: React.ReactNode }) {
  return (
    <tr style={{ borderBottom: `1px solid ${neutral.line}`, background: neutral.bg }}>
      <th colSpan={COLUMNS} scope="colgroup" style={{ textAlign: 'left', padding: '10px 20px', fontSize: 13, fontWeight: 600, color: neutral.slate }}>
        {children}
      </th>
    </tr>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  )
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td className={mono === true ? 'mono' : undefined} style={{ padding: '12px 20px', color: 'inherit', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
      {children}
    </td>
  )
}
