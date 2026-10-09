import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useMatch, useNavigate, useSearchParams } from 'react-router-dom'
import { neutral } from '../../theme/tokens'
import { SurfaceProvider } from '../../shared'
import {
  addDayNote,
  billingAttentionCount,
  integrationAttentionCount,
  isOpenSlotView,
  openWarnings,
  rosterForDate,
  scheduleHorizon,
  slotViewsForDate,
  type SlotView,
  useAppStore,
  warningSummaryByList,
  useToday,
  OFFICE_ACTOR,
} from '../../store'
import { isISODate } from '../../shell/routeParams'
import { SideNav, type NavSection } from './components/SideNav'
import { type SortMode } from './components/DayNav'
import { SlotDrawer } from './components/SlotDrawer'
import type { AdminOutletContext } from './outlet'
import { surnameOf } from './util'
import { ADMIN_PAGE_HORIZONTAL_PADDING } from './layout'

/** The office persona actor, built once (Decisions log 2026-07-21). */

/** Which side-nav section the current URL is in (`/admin` itself is the day view). */
function sectionForPath(pathname: string): NavSection {
  const head = pathname.replace(/^\/admin\/?/, '').split('/')[0]
  switch (head) {
    case 'review':
    case 'invoices':
    case 'billing':
    case 'integrations':
    case 'masters':
    case 'audit':
      return head
    default:
      return 'day'
  }
}

export function AdminApp() {
  const todayISO = useToday()
  return (
    <SurfaceProvider variant="web">
      <AdminShell todayISO={todayISO} />
    </SurfaceProvider>
  )
}

/**
 * The Admin Web App's LAYOUT: the dark side nav with its badge counts, the
 * day-scoped derivations every day-view child needs, and the session drawer. The
 * screens are router sub-routes (`/admin/day/:dateISO`, `/admin/review/:listId`,
 * `/admin/invoices/:invoiceId` …) so a refresh, the back button and a shared URL
 * all land on the same screen (Decisions log 2026-07-27). `?sort=az` carries the
 * day grid's row order — a view preference, not a navigation step.
 */
function AdminShell({ todayISO }: { todayISO: string }) {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const slotsRecord = useAppStore((s) => s.schedule.slots)
  const bookingsRecord = useAppStore((s) => s.schedule.bookings)
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const appSettings = useAppStore((s) => s.appSettings)
  const clock = useAppStore((s) => s.clock)
  const masters = useAppStore((s) => s.masters)
  const integrations = useAppStore((s) => s.integrations)
  const dayNotesRecord = useAppStore((s) => s.dayNotes)

  const navigate = useNavigate()
  const { pathname, state: navigationState } = useLocation()
  const [params] = useSearchParams()
  const [drawerSlotId, setDrawerSlotId] = useState<string | null>(null)
  // Set when Find available opens a session: the drawer starts on Assign List.
  const [drawerAssign, setDrawerAssign] = useState<{ surgeonId?: string } | undefined>(undefined)
  const [shellScrollbarWidth, setShellScrollbarWidth] = useState(0)
  const shellRef = useRef<HTMLDivElement>(null)

  // The harness scrolls inside <main>. Browsers with classic scrollbars reserve
  // horizontal space there; overlay-scrollbar browsers reserve none. Measuring
  // the actual gutter keeps the in-flow rail aligned with the fixed drawer in
  // both cases.
  useLayoutEffect(() => {
    const main = shellRef.current?.closest('main')
    if (!(main instanceof HTMLElement)) return

    const measure = () => setShellScrollbarWidth(main.offsetWidth - main.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(main)
    return () => observer.disconnect()
  }, [])

  // The day view's day and row order come from the URL. Off a day route (Review,
  // Invoices …) the last-seen pair is remembered so the "Day view" nav item
  // returns to it — the one piece of state the URL cannot carry while it is not
  // showing (it replaces the old `selectedDate` / `sortMode` useState 1:1).
  const dayMatch = useMatch('/admin/day/:dateISO/*')
  const urlDate = dayMatch?.params.dateISO
  const lastDayRef = useRef(todayISO)
  const lastSortRef = useRef<SortMode>('roster')
  const selectedDate = isISODate(urlDate) ? urlDate : lastDayRef.current
  const sortMode: SortMode =
    dayMatch !== null ? (params.get('sort') === 'az' ? 'az' : 'roster') : lastSortRef.current
  useEffect(() => {
    lastDayRef.current = selectedDate
    lastSortRef.current = sortMode
  }, [selectedDate, sortMode])

  // Any route change closes the old drawer. A List link may carry a transient
  // target in navigation state: it opens the matching day first, then the
  // drawer on that List's session, without encoding the overlay in the URL.
  useEffect(() => {
    const openListId =
      typeof navigationState === 'object' &&
      navigationState !== null &&
      'openListId' in navigationState &&
      typeof navigationState.openListId === 'string'
        ? navigationState.openListId
        : null
    setDrawerSlotId(openListId !== null ? (useAppStore.getState().schedule.lists[openListId]?.slotId ?? null) : null)
    setDrawerAssign(undefined)
  }, [pathname, navigationState])

  // The roster is every anaesthetist with a session that day (catch-up Phase
  // 28, US-01.4.2): the seeded cast order first (the Tue-21 mockup 1:1), then
  // anaesthetists added in Master data, from their start date.
  const anaesthetists = useMemo(() => {
    const all = rosterForDate({ schedule: { slots: slotsRecord }, masters }, selectedDate)
    if (sortMode === 'az') return [...all].sort((a, b) => surnameOf(a.name).localeCompare(surnameOf(b.name)))
    return all
  }, [slotsRecord, masters, selectedDate, sortMode])

  // Built from the two schedule records only, so a Booking edit does not rebuild every session view.
  const dayViews = useMemo(
    () => slotViewsForDate({ schedule: { slots: slotsRecord, lists: listsRecord }, appSettings, masters: { slotStatuses: masters.slotStatuses } }, selectedDate),
    [slotsRecord, listsRecord, appSettings, masters.slotStatuses, selectedDate],
  )

  const viewsByAnaesthetist = useMemo(() => {
    const map: Record<string, SlotView[]> = {}
    for (const v of dayViews) (map[v.slot.anaesthetistId] ??= []).push(v)
    return map
  }, [dayViews])

  const horizonEndISO = useMemo(() => scheduleHorizon({ clock, appSettings }).endISO, [clock, appSettings])

  // The header line counts Lists as sessions and open sessions as free, read
  // from the same views the grid paints (no second derivation).
  const summary = useMemo(() => {
    const sessions = dayViews.filter((v) => v.list !== undefined).length
    const free = dayViews.filter(isOpenSlotView).length
    const submitted = dayViews.filter((v) => v.list?.state === 'SUBMITTED').length
    return `${anaesthetists.length} anaesthetists · ${sessions} sessions · ${free} free · ${submitted} submitted`
  }, [dayViews, anaesthetists.length])

  // Derived review queue (all SUBMITTED lists; the badge + awaiting-review rows).
  const reviewLists = useMemo(
    () =>
      Object.values(listsRecord)
        .filter((l) => l.state === 'SUBMITTED')
        .sort((a, b) =>
          a.dateISO === b.dateISO ? a.anaesthetistId.localeCompare(b.anaesthetistId) : a.dateISO.localeCompare(b.dateISO),
        ),
    [listsRecord],
  )
  const reviewRows = useMemo(
    () =>
      reviewLists.map((l) => {
        const anae = masters.anaesthetists[l.anaesthetistId]
        const hospital = l.hospitalId !== undefined ? masters.hospitals[l.hospitalId]?.name : 'Unassigned'
        const count = Object.values(bookingsRecord).filter((c) => c.listId === l.id && c.cancellation === undefined).length
        return {
          listId: l.id,
          title: `${anae !== undefined ? surnameOf(anae.name) : l.anaesthetistId} · ${hospital} ${l.session}`,
          sub: `${count} booking${count === 1 ? '' : 's'} · submitted`,
        }
      }),
    [reviewLists, masters, bookingsRecord],
  )

  // Billing exceptions across the pipeline (the billing-monitor nav badge):
  // billing-run failures + Xero handoff faults (Phase 10).
  const exceptionCount = useMemo(() => billingAttentionCount({ billing }), [billing])
  const integrationCount = useMemo(() => integrationAttentionCount({ integrations }), [integrations])

  // The warning routine, read once for the day view (catch-up Phase 15a): the
  // per-List outline on the selected date and every open warning for the
  // To-do card (all dates).
  const warningState = useMemo(() => ({ schedule, billing, appSettings, clock }), [schedule, billing, appSettings, clock])
  const warningFlags = useMemo(() => warningSummaryByList(warningState, selectedDate), [warningState, selectedDate])
  const todoRows = useMemo(() => openWarnings(warningState), [warningState])

  const notes = dayNotesRecord[selectedDate] ?? []

  const context: AdminOutletContext = {
    actor: OFFICE_ACTOR,
    todayISO,
    selectedDate,
    sortMode,
    anaesthetists,
    viewsByAnaesthetist,
    horizonEndISO,
    masters,
    warningFlags,
    todoRows,
    summary,
    notes,
    reviewRows,
    shellScrollbarWidth,
    onSelectSlot: (slotId) => {
      setDrawerAssign(undefined)
      setDrawerSlotId(slotId)
    },
    selectedSlotId: drawerSlotId,
    onAssignFromFinder: (slotId, surgeonId) => {
      setDrawerAssign(surgeonId !== undefined ? { surgeonId } : {})
      setDrawerSlotId(slotId)
    },
    onAddNote: (text, flagged) => addDayNote(useAppStore, OFFICE_ACTOR, selectedDate, text, flagged),
  }

  const SECTION_PATH: Record<NavSection, string> = {
    day: `/admin/day/${selectedDate}${sortMode === 'az' ? '?sort=az' : ''}`,
    review: '/admin/review',
    invoices: '/admin/invoices',
    billing: '/admin/billing',
    integrations: '/admin/integrations',
    masters: '/admin/masters',
    audit: '/admin/audit',
  }

  return (
    <div ref={shellRef} style={{ display: 'flex', minHeight: '100%', minWidth: 1320, background: neutral.bg, color: neutral.ink }}>
      <SideNav
        active={sectionForPath(pathname)}
        reviewBadge={reviewLists.length}
        billingBadge={exceptionCount}
        integrationBadge={integrationCount}
        onNavigate={(next) => navigate(SECTION_PATH[next])}
      />

      <div style={{ flex: 1, minWidth: 0, padding: `24px ${ADMIN_PAGE_HORIZONTAL_PADDING}px 40px`, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Outlet context={context} />
      </div>

      {drawerSlotId !== null && (
        <SlotDrawer
          key={`${drawerSlotId}:${drawerAssign !== undefined ? 'assign' : 'view'}`}
          slotId={drawerSlotId}
          actor={OFFICE_ACTOR}
          {...(drawerAssign !== undefined ? { initialAssign: drawerAssign } : {})}
          onClose={() => {
            setDrawerSlotId(null)
            setDrawerAssign(undefined)
          }}
          onOpenBooking={(bookingId) => navigate(`/admin/day/${selectedDate}/bookings/${bookingId}`)}
        />
      )}
    </div>
  )
}
