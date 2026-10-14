import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { RequireEntity } from '../../shell/RequireEntity'
import { isISODate } from '../../shell/routeParams'
import { useAppStore } from '../../store'
import { isAssignedList } from '../../domain/draftLists'
import { mondayOf, shiftWeeks } from '../../shared/format'
import {
  AccountsScreen,
  AvailabilityGrid,
  MyAvailabilityCalendar,
  BookingDetailView,
  DashboardScreen,
  ListDetailView,
  ListsScreen,
  type AccountsSubTab,
} from './screens'
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

const ACCOUNTS_SUB_TABS: readonly AccountsSubTab[] = ['overdue', 'payments', 'gst', 'fees']

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
      onViewOverdue={() => navigate('/web/accounts/overdue')}
      onOpenAvailability={() => navigate('/web/availability')}
    />
  )
}

// ---------------------------------------------------------------------------
// Lists — `/web/lists`, `/web/lists/:listId`, `…/bookings/:bookingId`
// ---------------------------------------------------------------------------

export function WebListsRoute() {
  const { anaesthetistId, todayISO } = useWebOutlet()
  const navigate = useNavigate()
  return (
    <ListsScreen
      anaesthetistId={anaesthetistId}
      todayISO={todayISO}
      onOpenList={(listId) => navigate(`/web/lists/${listId}`)}
    />
  )
}

export function WebListDetailRoute() {
  const { listId = '' } = useParams()
  const { actor, todayISO, anaesthetistId } = useWebOutlet()
  const navigate = useNavigate()
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
        onBack={() => navigate('/web/lists')}
        onOpenBooking={(bookingId) => navigate(`/web/lists/${listId}/bookings/${bookingId}`)}
      />
    </RequireEntity>
  )
}

export function WebBookingDetailRoute() {
  const { listId = '', bookingId = '' } = useParams()
  const { actor, todayISO } = useWebOutlet()
  const navigate = useNavigate()
  const exists = useAppStore((s) => {
    const booking = s.schedule.bookings[bookingId]
    return booking !== undefined && isAssignedList(s.schedule.lists[booking.listId])
  })
  const backToList = () => navigate(`/web/lists/${listId}`)

  return (
    <RequireEntity exists={exists}>
      <BookingDetailView key={bookingId} bookingId={bookingId} actor={actor} todayISO={todayISO} onBack={backToList} />
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
// Accounts — `/web/accounts/:subTab` (overdue | payments | gst | fees)
// ---------------------------------------------------------------------------

export function WebAccountsRoute() {
  const { subTab } = useParams()
  const { anaesthetistId } = useWebOutlet()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const valid = ACCOUNTS_SUB_TABS.includes(subTab as AccountsSubTab)
  const focusInvoiceNumber = params.get('invoice') ?? undefined

  return (
    <RequireEntity exists={valid}>
      <AccountsScreen
        anaesthetistId={anaesthetistId}
        subTab={subTab as AccountsSubTab}
        onSubTab={(next) => navigate(`/web/accounts/${next}`)}
        {...(focusInvoiceNumber !== undefined ? { focusInvoiceNumber } : {})}
      />
    </RequireEntity>
  )
}
