/**
 * The anaesthetist's main view on the phone (catch-up Phase 38a; US-07.4.2,
 * US-07.4.1, US-07.2.1, US-15.0.2). It starts at today: the scroller opens with
 * the Today heading at its top, upcoming work below, and every earlier List of
 * hers not yet authorised (that holds a Booking) above it, reached by scrolling
 * back. Submitted Lists show less prominently and stay editable. A List leaves
 * when the office authorises it (`hasLeftMainView`), never on the billing stamp;
 * it is then found by search. Week and Month bound only the forward part.
 *
 * Above the chips sit the search field and the calendar button (US-03.1.6,
 * US-03.1.7): typing two or more characters shows the results in place of the
 * sections; picking a day shows that date's Lists under a teal day chip. Both
 * are view state in the URL (`?q=`, `?day=`), written with replace by the route;
 * the date sheet's open state stays local to the route, which renders it above
 * the slide stack. Search and the day view are exclusive.
 */

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { ChevronUp } from 'lucide-react'
import { neutral } from '../../../theme/tokens'
import { FilterPills } from '../../../shared/ui/FilterPills'
import { TextAction } from '../../../shared/ui/TextAction'
import { useBookingsMovedToMe, useMovedToMe } from '../../../shared/flows'
import type { AssignedList, Booking, DisplayKey, Session } from '../../../domain/types'
import { sessionRank } from '../../../domain/outOfHours'
import { hasLeftMainView, listProgress } from '../../../domain/listProgress'
import { isAssignedList } from '../../../domain/draftLists'
import { mainViewFor, timesForList, useAppStore, useToday, type SlotView } from '../../../store'
import { ListRow, MobileHeader, type ListRowRight } from '../components'
import { listRowModel } from './listRowModel'
import { dayHeading, drSurname } from '../../../shared/format'
import { DockSpacer } from '../../../shared/ui/DockSpacer'
import { resolveDisplayStatus } from '../../../shared'
import { LookbackDayView, LookbackResults, LookbackSearchRow } from './ListsLookback'
import { DayChip } from '../../../shared/ui/DayChip'
import { searchCountLine, useBookingSearch } from '../../../shared/schedule'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Eyebrow } from '../../../shared/ui/Eyebrow'

type Filter = 'week' | 'month' | 'todo' | 'done'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'todo', label: 'To-Do' },
  { value: 'done', label: 'Done' },
]

const EMPTY_FORWARD: Record<Filter, string> = {
  week: 'No Lists from today in this window.',
  month: 'No Lists from today in this window.',
  todo: 'Nothing left to finish.',
  done: 'No submitted Lists waiting for the office.',
}

interface Row {
  /** The session (Slot id), or the List id for a List outside the horizon. */
  key: string
  slotId?: string
  listId?: string
  dateISO: string
  /** Its session: rows sort AM, PM, then out-of-hours (`sessionRank`). */
  sessionOrder: Session
  statusKey: DisplayKey
  variant: 'default' | 'open' | 'closed'
  session?: string
  time?: string
  title: string
  subtitle?: string
  right: ListRowRight
  onClick?: () => void
  /** A submitted List: less prominent, still editable. */
  quiet?: boolean
}

interface Section {
  date: string
  rows: Row[]
}

interface ForwardListsScreenProps {
  anaesthetistId: string
  personaName: string
  initials: string
  onOpenList: (listId: string) => void
  /** The search text (`?q=`). */
  query?: string
  /** The picked day (`?day=`), or null for the main view. */
  dayISO?: string | null
  onQueryChange?: (query: string) => void
  onDayChange?: (dayISO: string | null) => void
  onOpenBooking?: (listId: string, bookingId: string) => void
  /** Open the date sheet (the route renders it above the slide stack and the tab bar). */
  onOpenCalendar?: () => void
}

function groupByDate(rows: Row[]): Section[] {
  const byDate = new Map<string, Row[]>()
  for (const r of rows) {
    const arr = byDate.get(r.dateISO)
    if (arr === undefined) byDate.set(r.dateISO, [r])
    else arr.push(r)
  }
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, dayRows]) => ({ date, rows: dayRows.sort((a, b) => sessionRank(a.sessionOrder) - sessionRank(b.sessionOrder)) }))
}

export function ForwardListsScreen({
  anaesthetistId,
  personaName,
  initials,
  onOpenList,
  query = '',
  dayISO = null,
  onQueryChange = () => undefined,
  onDayChange = () => undefined,
  onOpenBooking = () => undefined,
  onOpenCalendar = () => undefined,
}: ForwardListsScreenProps) {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const slotsRecord = useAppStore((s) => s.schedule.slots)
  const appSettings = useAppStore((s) => s.appSettings)
  const slotStatuses = useAppStore((s) => s.masters.slotStatuses)
  const movedToMeList = useMovedToMe(anaesthetistId)
  // A List made for a single Booking a colleague handed her (Phase 32a) is new to her too.
  const bookingsMovedToMe = useBookingsMovedToMe(anaesthetistId)
  const movedToMeIds = useMemo(() => new Set([...movedToMeList.map((n) => n.listId), ...bookingsMovedToMe.map((m) => m.listId)]), [movedToMeList, bookingsMovedToMe])
  const bookingsRecord = useAppStore((s) => s.schedule.bookings)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const specialties = useAppStore((s) => s.masters.specialties)
  const todayISO = useToday()
  const [filter, setFilter] = useState<Filter>('week')

  const scrollerRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLDivElement>(null)
  const results = useBookingSearch(anaesthetistId, query, todayISO)
  const searching = results.query.kind === 'nhi' || results.query.kind === 'name'
  const mode: 'main' | 'day' | 'search' = searching ? 'search' : dayISO !== null ? 'day' : 'main'
  const shown = results.upcoming.length + results.past.length

  // Greet by surname ("Kia ora, Dr Souter") — the same short form as the web
  // dashboard, single-sourced in `drSurname`.
  const greetingName = drSurname(personaName)

  const { earlier, forward } = useMemo(() => {
    const bookingsByList = new Map<string, Booking[]>()
    for (const c of Object.values(bookingsRecord)) {
      if (c.cancellation !== undefined) continue
      const arr = bookingsByList.get(c.listId)
      if (arr === undefined) bookingsByList.set(c.listId, [c])
      else arr.push(c)
    }
    const activeBookings = (listId: string): Booking[] => bookingsByList.get(listId) ?? []
    const progressOf = (l: AssignedList) => listProgress(l, activeBookings(l.id), todayISO)

    const slotState = { schedule: { slots: slotsRecord, lists: listsRecord, bookings: bookingsRecord }, appSettings, masters: { slotStatuses } }
    const forwardTo = format(addDays(parseISO(todayISO), filter === 'month' ? 31 : 7), 'yyyy-MM-dd')
    const view = mainViewFor(slotState, anaesthetistId, todayISO, forwardTo)

    /**
     * A session's row, from the one Slot view every app reads (catch-up Phase
     * 28): a List shows as a booked row in place of the status, so an office
     * assignment or a phone booking never reads Free here.
     */
    function viewRow(v: SlotView): Row | null {
      if (v.list !== undefined) return hasLeftMainView(v.list) ? null : listRow(v.list)
      const base = { key: v.slot.id, slotId: v.slot.id, dateISO: v.slot.dateISO, sessionOrder: v.slot.session, statusKey: v.displayKey }
      const status = resolveDisplayStatus(v.slot.status, slotStatuses)
      // A day off (any closed status): its own row, labelled from the status master.
      if (!v.open) {
        return {
          ...base,
          variant: 'closed',
          // Its label, then its note (Public hospital, then "CPH"; catch-up Phase 32d), as every view: never List detail.
          title: status.longLabel,
          ...(v.slot.note !== undefined ? { subtitle: v.slot.note } : {}),
          right: { kind: 'chip', statusKey: v.slot.status, label: status.label },
        }
      }
      // An open session: status only (the office fills it; catch-up Phase 32
      // retired the cover marker: an anaesthetist moves her own Lists instead).
      return {
        ...base,
        variant: 'open',
        session: v.slot.session,
        ...(v.times.overridden ? { time: v.times.startTime } : {}),
        title: `${status.label} session`,
        subtitle: 'Open for bookings',
        right: { kind: 'chip', statusKey: v.slot.status, label: status.label },
      }
    }

    function listRow(l: AssignedList): Row {
      const model = listRowModel(l, activeBookings(l.id), progressOf(l), { hospitals, surgeons, specialties })
      return {
        key: l.id,
        slotId: l.slotId,
        listId: l.id,
        dateISO: l.dateISO,
        sessionOrder: l.session,
        statusKey: l.kind,
        variant: 'default',
        session: l.session,
        time: timesForList(slotState, l).startTime,
        ...model,
        onClick: () => onOpenList(l.id),
      }
    }

    // To-Do: a Booking still to complete, on an ACTIVE List or reopened on a
    // submitted one; Done: submitted with every Booking complete (US-07.2.1).
    // Authorised Lists appear under no chip (they have left the main view).
    const inChip = (l: AssignedList): boolean => {
      if (filter === 'todo') return (l.state === 'ACTIVE' || l.state === 'SUBMITTED') && activeBookings(l.id).some((c) => !c.completed)
      if (filter === 'done') return progressOf(l) === 'submitted'
      return true
    }

    const earlierRows = view.earlier.filter(inChip).map(listRow)
    let forwardRows: Row[]
    if (filter === 'todo' || filter === 'done') {
      // Lists from today on, in any date (no window), less any that have left.
      forwardRows = Object.values(listsRecord)
        .filter((l): l is AssignedList => isAssignedList(l) && l.anaesthetistId === anaesthetistId && l.dateISO >= todayISO && !hasLeftMainView(l))
        .filter(inChip)
        .map(listRow)
    } else {
      forwardRows = view.upcoming.map(viewRow).filter((r): r is Row => r !== null)
    }
    return { earlier: groupByDate(earlierRows), forward: groupByDate(forwardRows) }
  }, [listsRecord, slotsRecord, appSettings, slotStatuses, bookingsRecord, hospitals, surgeons, todayISO, filter, anaesthetistId, onOpenList])

  const earlierCount = earlier.reduce((n, s) => n + s.rows.length, 0)
  const todaySection = forward[0]?.date === todayISO ? forward[0] : undefined
  const laterSections = todaySection !== undefined ? forward.slice(1) : forward

  // Open at Today: on first mount and when a chip changes, put the Today heading
  // at the top of the scroller. A pop back from List or Booking detail keeps the
  // scroll, since the slide stack keeps this layer mounted.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    if (scroller === null) return
    if (mode !== 'main') {
      scroller.scrollTop = 0
      return
    }
    const anchor = todayRef.current
    if (anchor === null) return
    scroller.scrollTop = Math.max(0, anchor.offsetTop - 2)
  }, [filter, mode, dayISO])

  function showEarlier() {
    const scroller = scrollerRef.current
    if (scroller === null) return
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (typeof scroller.scrollTo === 'function') scroller.scrollTo({ top: 0, behavior: reduce === true ? 'auto' : 'smooth' })
    else scroller.scrollTop = 0
  }

  function renderRows(rows: Row[]) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r) => (
          <ListRow
            key={r.key}
            statusKey={r.statusKey}
            session={r.session}
            time={r.time}
            title={r.title}
            subtitle={r.subtitle}
            right={r.right}
            variant={r.variant}
            onClick={r.onClick}
            quiet={r.quiet === true}
            {...(r.slotId !== undefined ? { slotId: r.slotId } : {})}
            {...(r.listId !== undefined ? { listId: r.listId } : {})}
            {...(r.listId !== undefined && movedToMeIds.has(r.listId) ? { badge: 'New' } : {})}
          />
        ))}
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Host inset + 10px: a 26px large title needs air below the status bar.
          See the inset contract in `theme/global.css`. */}
      <div data-testid="mobile-lists-header" style={{ padding: 'calc(var(--aa-inset-top, 54px) + 10px) 20px 0', flex: 'none' }}>
        <MobileHeader eyebrow={dayHeading(todayISO, todayISO)} title={`Kia ora, ${greetingName}`} initials={initials} />
        <div style={{ marginTop: 14 }}>
          <LookbackSearchRow
            query={query}
            onQueryChange={onQueryChange}
            onOpenCalendar={onOpenCalendar}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 38, padding: '12px 20px 10px', flex: 'none' }}>
        {mode === 'search' && shown > 0 && (
          <div role="status" data-testid="mobile-lists-search-count" style={{ fontSize: 13, fontWeight: 600, color: neutral.slate }}>
            {searchCountLine(results.total, shown, query)}
          </div>
        )}
        {mode === 'day' && dayISO !== null && <DayChip dateISO={dayISO} onClose={() => onDayChange(null)} size="touch" testId="mobile-lists-day-chip" />}
        {mode === 'main' && <FilterPills value={filter} options={FILTERS} onSelect={setFilter} ariaLabel="Show Lists" size="lg" />}
      </div>

      {/* Scroll clearance for the tab bar, which itself tracks the inset 1:1,
          so the optical gap above the bar stays a constant 32px. It is a
          `DockSpacer` at the tail rather than padding here, because trailing
          padding contributes no scrollable extent on WebKit. */}
      <div ref={scrollerRef} data-testid="mobile-lists-scroll" style={{ flex: 1, overflow: 'auto', padding: '0 20px 0', position: 'relative' }}>
        {mode === 'search' && (
          <>
            <LookbackResults upcoming={results.upcoming} past={results.past} onOpenBooking={onOpenBooking} />
            <DockSpacer height="calc(var(--aa-inset-bottom, 34px) + 82px)" />
          </>
        )}
        {mode === 'day' && dayISO !== null && (
          <>
            <LookbackDayView anaesthetistId={anaesthetistId} dateISO={dayISO} todayISO={todayISO} onOpenList={onOpenList} />
            <DockSpacer height="calc(var(--aa-inset-bottom, 34px) + 82px)" />
          </>
        )}
        {mode === 'main' && earlierCount > 0 && (
          <section aria-label="Earlier Lists not yet authorised" data-shot="mobile-main-view-earlier-group">
            <div style={{ fontSize: 13, fontWeight: 600, color: neutral.slate, margin: '16px 0 0' }}>Earlier, not yet authorised</div>
            {earlier.map((section) => (
              <div key={section.date}>
                <DayHeading>{dayHeading(section.date, todayISO)}</DayHeading>
                {renderRows(section.rows)}
              </div>
            ))}
            <div aria-hidden style={{ height: 1, background: neutral.line, margin: '20px 0 0' }} />
          </section>
        )}

        {/* The forward part fills at least the scroller, so Today can sit at its top. */}
        {mode === 'main' && (
        <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
          <div ref={todayRef} data-testid="mobile-lists-today">
            <DayHeading>{dayHeading(todayISO, todayISO)}</DayHeading>
          </div>
          {earlierCount > 0 && (
            <TextAction
              size="lg"
              shot="mobile-main-view-earlier"
              onClick={showEarlier}
              style={{ alignSelf: 'flex-start', gap: 4, margin: '-10px 0 0', fontSize: 13 }}
            >
              <ChevronUp size={16} strokeWidth={2.4} aria-hidden />
              {earlierCount} earlier {earlierCount === 1 ? 'List' : 'Lists'} not yet authorised
            </TextAction>
          )}
          {todaySection !== undefined && renderRows(todaySection.rows)}
          {/* To-Do and Done count earlier Lists too: empty only when both parts are. */}
          {forward.length === 0 && (filter === 'week' || filter === 'month' || earlierCount === 0) && (
            <EmptyState variant="centred">{EMPTY_FORWARD[filter]}</EmptyState>
          )}
          {laterSections.map((section) => (
            <div key={section.date}>
              <DayHeading>{dayHeading(section.date, todayISO)}</DayHeading>
              {renderRows(section.rows)}
            </div>
          ))}
          {/* No column gap on this scroller, so the full clearance goes here. */}
          <DockSpacer height="calc(var(--aa-inset-bottom, 34px) + 82px)" />
        </div>
        )}
      </div>
    </div>
  )
}

/** The design's day heading: the shared micro-caps `Eyebrow` in mist. */
function DayHeading({ children }: { children: string }) {
  return (
    <Eyebrow style={{ margin: '18px 0 8px' }}>{children}</Eyebrow>
  )
}
