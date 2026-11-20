import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { RequireEntity } from '../../shell/RequireEntity'
import { isISODate } from '../../shell/routeParams'
import { useAppStore } from '../../store'
import { isAssignedList } from '../../domain/draftLists'
import { mondayOf, shiftWeeks } from '../../shared/format'
import { useOwnBookingInView } from '../../shared/flows'
import {
  AccountsScreen,
  AvailabilityGrid,
  MyAvailabilityCalendar,
  BookingDetailView,
  DashboardScreen,
  ListDetailView,
  ListsScreen,
  ProfileScreen,
  type AccountsSubTab,
} from './screens'
import { ACCOUNTS_SUB_TABS } from './screens/AccountsScreen'
import { useWebOutlet } from './outlet'

/**
 * The web app's route elements — one thin wrapper per screen that reads the
 * layout's outlet context, turns URL params into props, and turns the screens'
 * existing callbacks into `navigate()` calls. The screens themselves are
 * unchanged; the URL map lives in `router.tsx`.
 */

// ---------------------------------------------------------------------------
// Dashboard — `/web` (?week=<ISO>)
// ---------------------------------------------------------------------------

export function WebDashboardRoute() {
  const { anaesthetistId, personaName, todayISO } = useWebOutlet()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  // The week strip's position is a VIEW PREFERENCE carried as an explicit
  // Monday anchor (`?week=2026-07-20`) rather than an offset, so a shared URL
  // does not depend on where the demo clock happens to be. Stepping replaces
  // the entry: Back leaves the dashboard instead of unwinding week steps.
  const currentWeek = mondayOf(todayISO)
  const weekParam = params.get('week')
  const weekAnchorISO = isISODate(weekParam) ? mondayOf(weekParam) : currentWeek

  function stepWeek(weeks: number) {
    const next = shiftWeeks(weekAnchorISO, weeks)
    setParams(next === currentWeek ? {} : { week: next }, { replace: true })
  }

  return (
    <DashboardScreen
      anaesthetistId={anaesthetistId}
      personaName={personaName}
      todayISO={todayISO}
      weekAnchorISO={weekAnchorISO}
      onPrevWeek={() => stepWeek(-1)}
      onNextWeek={() => stepWeek(1)}
      onOpenList={(listId) => navigate(`/web/lists/${listId}`)}
      onViewOutstanding={() => navigate('/web/accounts/outstanding')}
      onViewPayments={() => navigate('/web/accounts/payments')}
      onOpenAvailability={() => navigate('/web/availability')}
    />
  )
}

// ---------------------------------------------------------------------------
// Lists — `/web/lists`, `/web/lists/:listId`, `…/bookings/:bookingId`
// ---------------------------------------------------------------------------

/**
 * Where a drill-in came from (catch-up Phase 38a): the Lists page passes its
 * own URL (with `?q=` or `?day=`) as location state, so Back from List and
 * Booking detail returns to the same results or day. A refresh or a deep link
 * has no state and falls back to the plain parent.
 */
interface LookbackState {
  from?: string
  /** On Booking detail: where its List detail came from, handed back on the way up. */
  listFrom?: string
}

function lookbackState(state: unknown): LookbackState {
  if (typeof state !== 'object' || state === null) return {}
  const s = state as Record<string, unknown>
  return {
    ...(typeof s['from'] === 'string' && s['from'].startsWith('/web/') ? { from: s['from'] } : {}),
    ...(typeof s['listFrom'] === 'string' && s['listFrom'].startsWith('/web/') ? { listFrom: s['listFrom'] } : {}),
  }
}

export function WebListsRoute() {
  const { anaesthetistId, todayISO } = useWebOutlet()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const [params, setParams] = useSearchParams()
  // `?q=` (search) and `?day=` (a picked date) are view state, written with
  // replace (the 2026-07-27 ruling); a junk `?day=` falls back to the main view.
  const query = params.get('q') ?? ''
  const rawDay = params.get('day')
  const dayISO = isISODate(rawDay) ? rawDay : null
  const here = `${pathname}${search}`
  return (
    <ListsScreen
      anaesthetistId={anaesthetistId}
      todayISO={todayISO}
      query={query}
      dayISO={dayISO}
      // Search and the date are exclusive: each replaces the other.
      onQueryChange={(q) => setParams(q === '' ? {} : { q }, { replace: true })}
      onDayChange={(d) => setParams(d === null ? {} : { day: d }, { replace: true })}
      onOpenList={(listId) => navigate(`/web/lists/${listId}`, { state: { from: here } })}
      onOpenBooking={(listId, bookingId) => navigate(`/web/lists/${listId}/bookings/${bookingId}`, { state: { from: here } })}
    />
  )
}

export function WebListDetailRoute() {
  const { listId = '' } = useParams()
  const { actor, todayISO, anaesthetistId } = useWebOutlet()
  const navigate = useNavigate()
  const { state } = useLocation()
  const { from } = lookbackState(state)
  // A Draft List is office only (OQ-86): not found here. Nor is a List she has
  // moved on (catch-up Phase 32): it is the office's or a colleague's now.
  const exists = useAppStore((s) => {
    const l = s.schedule.lists[listId]
    return isAssignedList(l) && l.anaesthetistId === anaesthetistId
  })

  return (
    <RequireEntity exists={exists}>
      <ListDetailView
        listId={listId}
        actor={actor}
        todayISO={todayISO}
        onBack={() => navigate(from ?? '/web/lists')}
        onOpenBooking={(bookingId) =>
          navigate(`/web/lists/${listId}/bookings/${bookingId}`, {
            state: { from: `/web/lists/${listId}`, ...(from !== undefined ? { listFrom: from } : {}) },
          })
        }
      />
    </RequireEntity>
  )
}

export function WebBookingDetailRoute() {
  const { listId = '', bookingId = '' } = useParams()
  const { actor, todayISO, anaesthetistId } = useWebOutlet()
  const navigate = useNavigate()
  const { state } = useLocation()
  const { from, listFrom } = lookbackState(state)
  // Her own Bookings only (catch-up Phase 38a): a Booking on a colleague's List
  // or a Draft List is not found here, as with List detail; one she has just
  // moved to a colleague stays until she leaves its done step (Phase 32a).
  const exists = useOwnBookingInView(bookingId, anaesthetistId)
  const back = () =>
    from !== undefined
      ? navigate(from, listFrom !== undefined ? { state: { from: listFrom } } : undefined)
      : navigate(`/web/lists/${listId}`)

  return (
    <RequireEntity exists={exists}>
      <BookingDetailView key={bookingId} bookingId={bookingId} actor={actor} todayISO={todayISO} onBack={back} />
    </RequireEntity>
  )
}

// ---------------------------------------------------------------------------
// Availability — `/web/availability`
// ---------------------------------------------------------------------------

export function WebAvailabilityRoute() {
  const { anaesthetistId, todayISO } = useWebOutlet()
  const [params] = useSearchParams()
  const date = params.get('date')
  return (
    <AvailabilityGrid
      key={date ?? ''}
      anaesthetistId={anaesthetistId}
      todayISO={todayISO}
      {...(isISODate(date) ? { initialDateISO: date } : {})}
    />
  )
}

/** My availability (catch-up Phase 29): `/web/availability/mine`, `?date=` opens a day. */
export function WebMyAvailabilityRoute() {
  const { actor, anaesthetistId } = useWebOutlet()
  const [params] = useSearchParams()
  const date = params.get('date') ?? undefined
  return <MyAvailabilityCalendar key={date ?? 'none'} actor={actor} anaesthetistId={anaesthetistId} {...(date !== undefined ? { initialDateISO: date } : {})} />
}

// ---------------------------------------------------------------------------
// Profile — `/web/profile` (catch-up Phase 26), from the persona block in the nav
// ---------------------------------------------------------------------------

export function WebProfileRoute() {
  const { anaesthetistId, actor } = useWebOutlet()
  return <ProfileScreen anaesthetistId={anaesthetistId} actor={actor} />
}

// ---------------------------------------------------------------------------
// Accounts — `/web/accounts/:subTab` (outstanding | payments | remittances | gst | fees);
// the old `/web/accounts/overdue` redirects to Outstanding (catch-up Phase 38)
// ---------------------------------------------------------------------------

/** `/web/accounts/overdue` (before catch-up Phase 38): Outstanding, keeping any `?invoice=`. */
export function WebAccountsOverdueRedirect() {
  const { search } = useLocation()
  return <Navigate to={{ pathname: '/web/accounts/outstanding', search }} replace />
}

export function WebAccountsRoute() {
  const { subTab } = useParams()
  const { anaesthetistId } = useWebOutlet()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const valid = ACCOUNTS_SUB_TABS.includes(subTab as AccountsSubTab)
  const focusInvoiceNumber = params.get('invoice') ?? undefined
  const focusRunId = params.get('run') ?? undefined

  return (
    <RequireEntity exists={valid}>
      <AccountsScreen
        anaesthetistId={anaesthetistId}
        subTab={subTab as AccountsSubTab}
        onSubTab={(next) => navigate(`/web/accounts/${next}`)}
        onOpenBooking={(listId, bookingId) => navigate(`/web/lists/${listId}/bookings/${bookingId}`)}
        {...(focusInvoiceNumber !== undefined ? { focusInvoiceNumber } : {})}
        {...(focusRunId !== undefined ? { focusRunId } : {})}
      />
    </RequireEntity>
  )
}
