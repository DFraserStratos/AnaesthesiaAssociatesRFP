import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { RequireEntity } from '../../shell/RequireEntity'
import { isISODate } from '../../shell/routeParams'
import { useAppStore, useToday } from '../../store'
import { DayNav } from './components/DayNav'
import { DayGrid } from './components/DayGrid'
import { RightRail } from './components/RightRail'
import { AdminCardDetail } from './screens/AdminCardDetail'
import { AuditViewer } from './screens/AuditViewer'
import { BillingMonitorScreen } from './screens/BillingMonitorScreen'
import { IntegrationMonitorScreen } from './screens/IntegrationMonitorScreen'
import { InvoicesScreen } from './screens/InvoicesScreen'
import { MasterData } from './screens/MasterData'
import { ReviewQueue } from './screens/ReviewQueue'
import { ReviewScreen } from './screens/ReviewScreen'
import { useAdminOutlet } from './outlet'

/**
 * The admin app's route elements — one thin wrapper per screen that reads the
 * layout's outlet context, turns URL params into props, and turns the screens'
 * existing callbacks into `navigate()` calls. The URL map lives in `router.tsx`.
 */

// ---------------------------------------------------------------------------
// `/admin` → today's day view
// ---------------------------------------------------------------------------

export function AdminIndexRedirect() {
  const todayISO = useToday()
  return <Navigate to={`day/${todayISO}`} replace />
}

// ---------------------------------------------------------------------------
// Day view — `/admin/day/:dateISO` (?sort=az)
// ---------------------------------------------------------------------------

export function AdminDayRoute() {
  const { dateISO } = useParams()
  const ctx = useAdminOutlet()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  // A junk date would throw out of `format(parseISO(...))`, so it never reaches
  // the grid — fall back to the demo clock's today.
  if (!isISODate(dateISO)) return <Navigate to={`/admin/day/${ctx.todayISO}`} replace />

  function setSort(mode: 'roster' | 'az') {
    // Row order is a view preference: replace, so Back is not a sort toggle.
    setParams(mode === 'az' ? { sort: 'az' } : {}, { replace: true })
  }

  /** Moving day is a navigation step, but it keeps the chosen row order. */
  function goToDay(next: string) {
    const query = params.toString()
    navigate(`/admin/day/${next}${query === '' ? '' : `?${query}`}`)
  }

  return (
    <>
      <DayNav
        selectedDateISO={dateISO}
        summary={ctx.summary}
        sortMode={ctx.sortMode}
        onSort={setSort}
        onNavigateDate={goToDay}
        todayISO={ctx.todayISO}
      />
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <DayGrid
          anaesthetists={ctx.anaesthetists}
          listsByAnaesthetist={ctx.listsByAnaesthetist}
          masters={ctx.masters}
          activeCardCounts={ctx.activeCardCounts}
          prepaymentFlags={ctx.prepaymentFlags}
          onSelectList={ctx.onSelectList}
        />
        <RightRail
          monthDateISO={dateISO}
          selectedDateISO={dateISO}
          todayISO={ctx.todayISO}
          onNavigateDate={goToDay}
          notes={ctx.notes}
          onAddNote={ctx.onAddNote}
          reviewRows={ctx.reviewRows}
          shellScrollbarWidth={ctx.shellScrollbarWidth}
          onReviewList={(listId) => navigate(`/admin/review/${listId}`)}
        />
      </div>
    </>
  )
}

export function AdminCardDetailRoute() {
  const { dateISO = '', cardId = '' } = useParams()
  const { actor, todayISO } = useAdminOutlet()
  const navigate = useNavigate()
  const exists = useAppStore((s) => s.schedule.cards[cardId] !== undefined)

  return (
    <RequireEntity exists={exists}>
      <AdminCardDetail
        cardId={cardId}
        actor={actor}
        todayISO={todayISO}
        onBack={() => navigate(`/admin/day/${dateISO}`)}
      />
    </RequireEntity>
  )
}

// ---------------------------------------------------------------------------
// Review queue — `/admin/review`, `/admin/review/:listId`
// ---------------------------------------------------------------------------

export function AdminReviewQueueRoute() {
  const navigate = useNavigate()
  return (
    <ReviewQueue
      onOpen={(listId) => navigate(`/admin/review/${listId}`)}
      onViewInvoices={() => navigate('/admin/invoices')}
    />
  )
}

export function AdminReviewRoute() {
  const { listId = '' } = useParams()
  const { actor } = useAdminOutlet()
  const navigate = useNavigate()
  const exists = useAppStore((s) => s.schedule.lists[listId] !== undefined)

  return (
    <RequireEntity exists={exists}>
      <ReviewScreen
        listId={listId}
        actor={actor}
        onBack={() => navigate('/admin/review')}
        onOpen={(next) => navigate(`/admin/review/${next}`)}
        onViewInvoices={() => navigate('/admin/invoices')}
      />
    </RequireEntity>
  )
}

// ---------------------------------------------------------------------------
// Invoices — `/admin/invoices`, `/admin/invoices/:invoiceId`
// ---------------------------------------------------------------------------

export function AdminInvoicesRoute() {
  const { invoiceId } = useParams()
  const { actor } = useAdminOutlet()
  const navigate = useNavigate()
  const exists = useAppStore((s) => invoiceId === undefined || s.billing.invoices[invoiceId] !== undefined)

  return (
    <RequireEntity exists={exists}>
      <InvoicesScreen
        actor={actor}
        selectedInvoiceId={invoiceId ?? null}
        onSelect={(next) => navigate(next === null ? '/admin/invoices' : `/admin/invoices/${next}`)}
      />
    </RequireEntity>
  )
}

// ---------------------------------------------------------------------------
// The single-screen sections
// ---------------------------------------------------------------------------

export function AdminBillingRoute() {
  const { actor } = useAdminOutlet()
  return <BillingMonitorScreen actor={actor} />
}

export function AdminIntegrationsRoute() {
  const { actor } = useAdminOutlet()
  return <IntegrationMonitorScreen actor={actor} />
}

export function AdminMastersRoute() {
  const { actor, todayISO } = useAdminOutlet()
  return <MasterData actor={actor} todayISO={todayISO} />
}

export function AdminAuditRoute() {
  return <AuditViewer />
}
