import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { RequireEntity } from '../../shell/RequireEntity'
import { isISODate } from '../../shell/routeParams'
import { useAppStore } from '../../store'
import { mondayOf, shiftWeeks } from '../../shared/format'
import {
  AccountsScreen,
  AvailabilityGrid,
  CardDetailView,
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

const ACCOUNTS_SUB_TABS: readonly AccountsSubTab[] = ['overdue', 'payments', 'gst']

export function WebDashboardRoute() {
  const { anaesthetistId, personaName, todayISO, onCover } = useWebOutlet()
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
      onCover={onCover}
    />
  )
}

// ---------------------------------------------------------------------------
// Lists — `/web/lists`, `/web/lists/:listId`, `…/cards/:cardId`
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
  const { actor, todayISO } = useWebOutlet()
  const navigate = useNavigate()
  const exists = useAppStore((s) => s.schedule.lists[listId] !== undefined)

  return (
    <RequireEntity exists={exists}>
      <ListDetailView
        listId={listId}
        actor={actor}
        todayISO={todayISO}
        onBack={() => navigate('/web/lists')}
        onOpenCard={(cardId) => navigate(`/web/lists/${listId}/cards/${cardId}`)}
      />
    </RequireEntity>
  )
}

export function WebCardDetailRoute() {
  const { listId = '', cardId = '' } = useParams()
  const { actor, todayISO } = useWebOutlet()
  const navigate = useNavigate()
  const exists = useAppStore((s) => s.schedule.cards[cardId] !== undefined)
  const backToList = () => navigate(`/web/lists/${listId}`)

  return (
    <RequireEntity exists={exists}>
      <CardDetailView cardId={cardId} actor={actor} todayISO={todayISO} onBack={backToList} onCopied={backToList} />
    </RequireEntity>
  )
}

// ---------------------------------------------------------------------------
// Availability — `/web/availability`
// ---------------------------------------------------------------------------

export function WebAvailabilityRoute() {
  const { anaesthetistId, personaName, todayISO, onCover } = useWebOutlet()
  return (
    <AvailabilityGrid
      anaesthetistId={anaesthetistId}
      personaName={personaName}
      todayISO={todayISO}
      onCover={onCover}
    />
  )
}

// ---------------------------------------------------------------------------
// Accounts — `/web/accounts/:subTab` (overdue | payments | gst)
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
