import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { accent, neutral } from '../../theme/tokens'
import { RequireEntity } from '../../shell/RequireEntity'
import { isISODate } from '../../shell/routeParams'
import { listInSlot, useAppStore, useToday, type NotificationTarget } from '../../store'
import { DayNav } from './components/DayNav'
import { AvailabilityFinderSheet } from './flows/AvailabilityFinderSheet'
import { DayGrid } from './components/DayGrid'
import { RightRail } from './components/RightRail'
import { AdminBookingDetail } from './screens/AdminBookingDetail'
import { AuditViewer } from './screens/AuditViewer'
import { BillingMonitorScreen } from './screens/BillingMonitorScreen'
import { AaFeesScreen } from './screens/AaFeesScreen'
import { IntegrationMonitorScreen } from './screens/IntegrationMonitorScreen'
import { InvoicesScreen } from './screens/InvoicesScreen'
import { MasterData } from './screens/masters/MasterData'
import { SurgeonProfile } from './screens/SurgeonProfile'
import { AnaesthetistRecord } from './screens/AnaesthetistRecord'
import { ReviewQueue } from './screens/ReviewQueue'
import { ConflictsScreen } from './screens/ConflictsScreen'
import { DraftListsScreen } from './screens/DraftListsScreen'
import { NotificationsScreen } from './screens/NotificationsScreen'
import { ReviewScreen } from './screens/ReviewScreen'
import { useAdminOutlet, type AdminOutletContext } from './outlet'

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
  const [finderOpen, setFinderOpen] = useState(false)
  // Find available starts on the session of the empty session open in the drawer, else AM.
  const selectedEmpty = useAppStore((s) =>
    ctx.selectedSlotId !== null && listInSlot(s, ctx.selectedSlotId) === undefined ? s.schedule.slots[ctx.selectedSlotId] : undefined,
  )
  const finderSession = selectedEmpty?.session ?? 'AM'

  // A junk date would throw out of `format(parseISO(...))`, so it never reaches
  // the grid — fall back to the demo clock's today.
  if (!isISODate(dateISO)) return <Navigate to={`/admin/day/${ctx.todayISO}`} replace />

  function setSort(mode: 'roster' | 'az') {
    // Row order is a view preference: replace, so Back is not a sort toggle.
    setParams(mode === 'az' ? { sort: 'az' } : {}, { replace: true })
  }

  // A day past the schedule horizon (reached by +4w or a URL) has no sessions
  // yet: say so plainly instead of drawing an empty grid (FT-01.1).
  const beyondHorizon = dateISO > ctx.horizonEndISO

  /** Moving day is a navigation step, but it keeps the chosen row order. */
  function goToDay(next: string) {
    const query = params.toString()
    navigate(`/admin/day/${next}${query === '' ? '' : `?${query}`}`)
  }

  return (
    <>
      <DayNav
        selectedDateISO={dateISO}
        summary={beyondHorizon ? 'No sessions: this day is past the schedule horizon' : ctx.summary}
        sortMode={ctx.sortMode}
        onSort={setSort}
        onNavigateDate={goToDay}
        todayISO={ctx.todayISO}
        maxDateISO={ctx.horizonEndISO}
        {...(beyondHorizon ? {} : { onFindAvailable: () => setFinderOpen(true) })}
      />
      <AvailabilityFinderSheet
        open={finderOpen}
        dateISO={dateISO}
        initialSession={finderSession}
        onClose={() => setFinderOpen(false)}
        onPick={(slotId, surgeonId) => {
          setFinderOpen(false)
          ctx.onAssignFromFinder(slotId, surgeonId)
        }}
      />
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {beyondHorizon ? (
          <BeyondHorizon endISO={ctx.horizonEndISO} onGoToEnd={() => goToDay(ctx.horizonEndISO)} />
        ) : (
          <DayGrid
            anaesthetists={ctx.anaesthetists}
            viewsByAnaesthetist={ctx.viewsByAnaesthetist}
            masters={ctx.masters}
            warningFlags={ctx.warningFlags}
            onSelectSlot={ctx.onSelectSlot}
            draftLists={ctx.dayDraftLists}
            bookingCounts={ctx.bookingCounts}
            onOpenDraftList={ctx.onOpenDraftList}
          />
        )}
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
          todoRows={ctx.todoRows}
          actor={ctx.actor}
          onOpenBooking={(d, bookingId) => navigate(`/admin/day/${d}/bookings/${bookingId}`)}
          onOpenConflicts={() => navigate('/admin/conflicts')}
          onOpenDraftList={ctx.onOpenDraftList}
          onSeeAllDraftLists={() => navigate('/admin/draft-lists')}
          onOpenNotification={(target) => openNotificationTarget(target, ctx)}
          onSeeAllNotifications={() => navigate('/admin/notifications')}
        />
      </div>
    </>
  )
}

export function AdminBookingDetailRoute() {
  const { dateISO = '', bookingId = '' } = useParams()
  const { actor, todayISO } = useAdminOutlet()
  const navigate = useNavigate()
  const { state: navigationState } = useLocation()
  const exists = useAppStore((s) => s.schedule.bookings[bookingId] !== undefined)
  const fromInvoiceId =
    typeof navigationState === 'object' &&
    navigationState !== null &&
    'fromInvoiceId' in navigationState &&
    typeof navigationState.fromInvoiceId === 'string'
      ? navigationState.fromInvoiceId
      : null
  const returnInvoice = useAppStore((s) => {
    if (fromInvoiceId === null) return undefined
    const invoice = s.billing.invoices[fromInvoiceId]
    return invoice?.bookingId === bookingId ? invoice : undefined
  })

  return (
    <RequireEntity exists={exists}>
      <AdminBookingDetail
        key={bookingId}
        bookingId={bookingId}
        actor={actor}
        todayISO={todayISO}
        onBack={() =>
          navigate(
            returnInvoice === undefined
              ? `/admin/day/${dateISO}`
              : `/admin/invoices/${returnInvoice.id}`,
          )
        }
        backLabel={
          returnInvoice === undefined
            ? 'Day view'
            : `Invoice ${returnInvoice.invoiceNumber}`
        }
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

/** Every conflict across dates (catch-up Phase 30; US-01.5.4). A Draft List's row opens its drawer (catch-up Phase 31). */
export function AdminConflictsRoute() {
  const { actor, onSelectSlot, onOpenDraftList } = useAdminOutlet()
  return <ConflictsScreen actor={actor} onOpenSession={onSelectSlot} onOpenDraftList={onOpenDraftList} />
}

/**
 * Draft Lists, the one place (catch-up Phase 31; US-01.6.2) — `/admin/draft-lists`
 * (`?tab=history`; `?open=<listId>` opens that Draft List's drawer on arrival,
 * read by the layout).
 */
export function AdminDraftListsRoute() {
  const { actor, onOpenDraftList, onOpenList } = useAdminOutlet()
  return <DraftListsScreen actor={actor} onOpenDraftList={onOpenDraftList} onOpenList={onOpenList} />
}

/** A notification opens its List in the Day drawer, or its Draft List's drawer (catch-up Phase 32). */
function openNotificationTarget(target: NotificationTarget, ctx: Pick<AdminOutletContext, 'onOpenList' | 'onOpenDraftList'>) {
  if (target.kind === 'list') ctx.onOpenList(target.listId)
  else if (target.kind === 'draftList') ctx.onOpenDraftList(target.listId)
}

/** The shared notification pool (catch-up Phase 32; US-13.8.1) — `/admin/notifications` (`?page=`). */
export function AdminNotificationsRoute() {
  const ctx = useAdminOutlet()
  return <NotificationsScreen onOpen={(target) => openNotificationTarget(target, ctx)} />
}

export function AdminBillingRoute() {
  const { actor } = useAdminOutlet()
  return <BillingMonitorScreen actor={actor} />
}

/** AA's monthly fee: the fee invoices and the fee settings (catch-up Phase 16). */
export function AdminAaFeesRoute() {
  const { actor } = useAdminOutlet()
  return <AaFeesScreen actor={actor} tab="invoices" />
}

export function AdminAaFeeSettingsRoute() {
  const { actor } = useAdminOutlet()
  return <AaFeesScreen actor={actor} tab="settings" />
}

export function AdminIntegrationsRoute() {
  const { actor } = useAdminOutlet()
  return <IntegrationMonitorScreen actor={actor} />
}

export function AdminMastersRoute() {
  const { actor } = useAdminOutlet()
  return <MasterData actor={actor} />
}

// ---------------------------------------------------------------------------
// Master data pages — `/admin/masters/surgeons/:surgeonId`,
// `/admin/masters/anaesthetists/:anaesthetistId` (catch-up Phase 17). An
// unknown id falls back to `/admin/masters`.
// ---------------------------------------------------------------------------

export function AdminSurgeonProfileRoute() {
  const { surgeonId = '' } = useParams()
  const { actor } = useAdminOutlet()
  const exists = useAppStore((s) => s.masters.surgeons[surgeonId] !== undefined)
  return (
    <RequireEntity exists={exists}>
      <SurgeonProfile key={surgeonId} surgeonId={surgeonId} actor={actor} />
    </RequireEntity>
  )
}

export function AdminAnaesthetistRecordRoute() {
  const { anaesthetistId = '' } = useParams()
  const { actor } = useAdminOutlet()
  const exists = useAppStore((s) => s.masters.anaesthetists[anaesthetistId] !== undefined)
  return (
    <RequireEntity exists={exists}>
      <AnaesthetistRecord key={anaesthetistId} anaesthetistId={anaesthetistId} actor={actor} />
    </RequireEntity>
  )
}

export function AdminAuditRoute() {
  return <AuditViewer />
}

/** The Day view's state for a date past the schedule horizon (catch-up Phase 28; FT-01.1). */
function BeyondHorizon({ endISO, onGoToEnd }: { endISO: string; onGoToEnd: () => void }) {
  return (
    <div
      data-shot="admin-day-beyond-horizon"
      style={{
        flex: 1,
        minWidth: 0,
        background: neutral.surface,
        border: `1px solid ${neutral.line}`,
        borderRadius: 14,
        padding: '40px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'flex-start',
        boxShadow: '0 1px 2px rgba(23,35,32,0.05),0 2px 6px rgba(23,35,32,0.05)',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, color: neutral.ink }}>
        Beyond the schedule horizon, which ends {format(parseISO(endISO), 'EEE d MMM yyyy')}.
      </div>
      <div style={{ fontSize: 13, color: neutral.slate, maxWidth: 560, lineHeight: '19px' }}>
        Sessions are created up to the horizon and roll forward each day. The horizon length is set in Master data, Schedule settings.
      </div>
      <button
        type="button"
        onClick={onGoToEnd}
        style={{ marginTop: 6, border: 0, padding: 0, background: 'transparent', color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
      >
        Go to the last day
      </button>
    </div>
  )
}
