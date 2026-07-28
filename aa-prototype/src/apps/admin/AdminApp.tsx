import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useMatch, useNavigate, useSearchParams } from 'react-router-dom'
import { neutral } from '../../theme/tokens'
import { SurfaceProvider } from '../../shared'
import type { List } from '../../domain/types'
import {
  addDayNote,
  billingAttentionCount,
  integrationAttentionCount,
  prepaymentStatusFor,
  useAppStore,
  useToday,
  type Actor,
} from '../../store'
import { isISODate } from '../../shell/routeParams'
import { ANAESTHETISTS } from '../../domain/seed'
import { SideNav, type NavSection } from './components/SideNav'
import { type SortMode } from './components/DayNav'
import { ListDrawer } from './components/ListDrawer'
import type { AdminOutletContext } from './outlet'
import { isBooked, surnameOf } from './util'
import { ADMIN_PAGE_HORIZONTAL_PADDING } from './layout'

/** The office persona actor, built once (Decisions log 2026-07-21). */
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

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
 * day-scoped derivations every day-view child needs, and the List drawer. The
 * screens are router sub-routes (`/admin/day/:dateISO`, `/admin/review/:listId`,
 * `/admin/invoices/:invoiceId` …) so a refresh, the back button and a shared URL
 * all land on the same screen (Decisions log 2026-07-27). `?sort=az` carries the
 * day grid's row order — a view preference, not a navigation step.
 */
function AdminShell({ todayISO }: { todayISO: string }) {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const cardsRecord = useAppStore((s) => s.schedule.cards)
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const integrations = useAppStore((s) => s.integrations)
  const dayNotesRecord = useAppStore((s) => s.dayNotes)

  const navigate = useNavigate()
  const { pathname, state: navigationState } = useLocation()
  const [params] = useSearchParams()
  const [drawerListId, setDrawerListId] = useState<string | null>(null)
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
  // existing drawer, without encoding the overlay in the URL.
  useEffect(() => {
    const openListId =
      typeof navigationState === 'object' &&
      navigationState !== null &&
      'openListId' in navigationState &&
      typeof navigationState.openListId === 'string'
        ? navigationState.openListId
        : null
    setDrawerListId(openListId)
  }, [pathname, navigationState])

  // Roster order = the canonical cast order (matches the Tue-21 mockup 1:1).
  // NB: Object.values(record) would sort by registration number (numeric-like
  // keys enumerate ascending), so we drive roster order from the cast array.
  const anaesthetists = useMemo(() => {
    const all = ANAESTHETISTS.map((a) => masters.anaesthetists[a.registrationNumber]).filter(
      (a): a is NonNullable<typeof a> => a !== undefined,
    )
    if (sortMode === 'az') return [...all].sort((a, b) => surnameOf(a.name).localeCompare(surnameOf(b.name)))
    return all
  }, [masters.anaesthetists, sortMode])

  const dayLists = useMemo(() => Object.values(listsRecord).filter((l) => l.dateISO === selectedDate), [listsRecord, selectedDate])

  const listsByAnaesthetist = useMemo(() => {
    const map: Record<string, List[]> = {}
    for (const l of dayLists) (map[l.anaesthetistId] ??= []).push(l)
    return map
  }, [dayLists])

  const activeCardCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of Object.values(cardsRecord)) {
      if (c.cancellation === undefined) counts[c.listId] = (counts[c.listId] ?? 0) + 1
    }
    return counts
  }, [cardsRecord])

  const summary = useMemo(() => {
    // A Free list booked via phone-advice (cards or an assigned hospital) counts
    // as a session, not free, matching the grid's derived display.
    const effectivelyBooked = (l: List) =>
      isBooked(l.statusKey) || (l.statusKey === 'free' && ((activeCardCounts[l.id] ?? 0) > 0 || l.hospitalId !== undefined))
    const anaes = new Set(dayLists.map((l) => l.anaesthetistId)).size
    const sessions = dayLists.filter(effectivelyBooked).length
    const free = dayLists.filter((l) => l.statusKey === 'free' && !effectivelyBooked(l)).length
    const submitted = dayLists.filter((l) => l.state === 'SUBMITTED').length
    return `${anaes} anaesthetists · ${sessions} sessions · ${free} free · ${submitted} submitted`
  }, [dayLists, activeCardCounts])

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
        const count = Object.values(cardsRecord).filter((c) => c.listId === l.id && c.cancellation === undefined).length
        return {
          listId: l.id,
          title: `${anae !== undefined ? surnameOf(anae.name) : l.anaesthetistId} · ${hospital} ${l.session}`,
          sub: `${count} card${count === 1 ? '' : 's'} · submitted`,
        }
      }),
    [reviewLists, masters, cardsRecord],
  )

  // Billing exceptions across the pipeline (the billing-monitor nav badge):
  // billing-run failures + Xero handoff faults (Phase 10).
  const exceptionCount = useMemo(() => billingAttentionCount({ billing }), [billing])
  const integrationCount = useMemo(() => integrationAttentionCount({ integrations }), [integrations])

  // Lists on the selected day holding a card whose pre-payment is flagged — a
  // day-grid indicator (Phase 09). Outstanding (required/invoiced-unpaid) wins
  // over an overridden gate on the same list; both surface so an override is
  // never invisible at a glance.
  const prepaymentFlags = useMemo(() => {
    const map = new Map<string, 'outstanding' | 'overridden'>()
    for (const card of Object.values(cardsRecord)) {
      const list = listsRecord[card.listId]
      if (list === undefined || list.dateISO !== selectedDate) continue
      const status = prepaymentStatusFor({ schedule, billing }, card.id)
      if (status === 'required' || status === 'outstanding') map.set(list.id, 'outstanding')
      else if (status === 'overridden' && !map.has(list.id)) map.set(list.id, 'overridden')
    }
    return map
  }, [cardsRecord, listsRecord, selectedDate, schedule, billing])

  const notes = dayNotesRecord[selectedDate] ?? []

  const context: AdminOutletContext = {
    actor: OFFICE,
    todayISO,
    selectedDate,
    sortMode,
    anaesthetists,
    listsByAnaesthetist,
    masters,
    activeCardCounts,
    prepaymentFlags,
    summary,
    notes,
    reviewRows,
    shellScrollbarWidth,
    onSelectList: setDrawerListId,
    onAddNote: (text, flagged) => addDayNote(useAppStore, OFFICE, selectedDate, text, flagged),
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

      {drawerListId !== null && (
        <ListDrawer
          listId={drawerListId}
          actor={OFFICE}
          onClose={() => setDrawerListId(null)}
          onOpenCard={(cardId) => navigate(`/admin/day/${selectedDate}/cards/${cardId}`)}
        />
      )}
    </div>
  )
}
