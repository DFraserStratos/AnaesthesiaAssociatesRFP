import { useState } from 'react'
import { pageParam } from './components/Pager'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { neutral, radius, elevation } from '../../theme/tokens'
import { TextAction } from '../../shared/ui'
import { RequireEntity } from '../../shell/RequireEntity'
import { isISODate } from '../../shell/routeParams'
import { listInSlot, patientByNhi, useAppStore, useToday, type Actor, type NotificationTarget } from '../../store'
import { DayNav } from './components/DayNav'
import { AvailabilityFinderSheet } from './flows/AvailabilityFinderSheet'
import { DayGrid } from './components/DayGrid'
import { RightRail } from './components/RightRail'
import { AdminBookingDetail } from './screens/AdminBookingDetail'
import { AuditViewer } from './screens/AuditViewer'
import { MasterData } from './screens/masters/MasterData'
import { IntakeSection } from './screens/intake/IntakeSection'
import { ArrivalPage } from './screens/intake/ArrivalPage'
import { InboxView } from './screens/intake/InboxView'
import { SourcesView } from './screens/intake/SourcesView'
import { inboxRedirectFromLegacyParams, intakePathFromLegacy } from './screens/intake/intakePaths'
import { arrivalKeyForRow } from '../../store/intakeSelectors'
import { mastersRedirect } from './mastersRedirect'
import { awaitingApprovalPath, creditNotePath, financePath, financePathFromLegacy, invoicePath } from './screens/finances/financePaths'
import { ContractsSection } from './screens/contracts/ContractsSection'
import { ContractPage } from './screens/contracts/ContractPage'
import { NewContractPage } from './screens/contracts/new/NewContractPage'
import { ReplaceContractPage } from './screens/contracts/ReplaceContractPage'
import { PartiesTab } from './screens/contracts/PartiesTab'
import { PartyPage } from './screens/contracts/PartyPage'
import { FundingTagsTab } from './screens/contracts/FundingTagsTab'
import { AnaesthetistsTab } from './screens/people/AnaesthetistsTab'
import { SurgeonsTab } from './screens/people/SurgeonsTab'
import { SpecialtiesTab } from './screens/people/SpecialtiesTab'
import { SpecialtyPage } from './screens/people/SpecialtyPage'
import { anaesthetistRecordPath, surgeonProfilePath } from './peoplePaths'
import { contractPath } from './contractsPaths'
import { patientPath } from '../../shared/patients'
import { SurgeonProfile } from './screens/SurgeonProfile'
import { AnaesthetistPage } from './screens/AnaesthetistPage'
import { NotificationsScreen } from './screens/NotificationsScreen'
import { ReviewScreen } from './screens/ReviewScreen'
import { listsPath, listsPathFromLegacy, reviewPath, toAuthoriseReturn } from './screens/lists/listsPaths'
import { PatientsScreen } from './screens/patients/PatientsScreen'
import { PatientRecord } from './screens/patients/PatientRecord'
import { useAdminOutlet, type AdminOutletContext } from './outlet'
import { dayWithYear } from '../../shared/format'

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
    // A new day starts on the first page of anaesthetists (catch-up Phase 43).
    const kept = new URLSearchParams(params)
    kept.delete('page')
    const query = kept.toString()
    navigate(`/admin/day/${next}${query === '' ? '' : `?${query}`}`)
  }

  return (
    <>
      <DayNav
        selectedDateISO={dateISO}
        {...(beyondHorizon ? { summary: 'No sessions: this day is past the schedule horizon' } : {})}
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
      {/* The grid and the rail fill the rest of the window (minimum 360px): the grid's ruler and
          footer stay put while its rows scroll, and the rail scrolls on its own. */}
      <div style={{ flex: 1, minHeight: 360, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
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
            {...(ctx.onOpenOutOfHours !== undefined ? { onOpenOutOfHours: ctx.onOpenOutOfHours } : {})}
            page={pageParam(params.get('page'))}
            onPage={(p) => {
              // The page is a view preference, like the sort: replace, so Back is not a pager.
              const next = new URLSearchParams(params)
              if (p <= 1) next.delete('page')
              else next.set('page', String(p))
              setParams(next, { replace: true })
            }}
            rowMode={params.get('rows') === 'all' ? 'scroll' : 'pages'}
            onRowMode={(mode) => {
              // Pages or one scrolling list (`?rows=all`): a view preference, kept from day to day like the sort.
              const next = new URLSearchParams(params)
              next.delete('page')
              if (mode === 'scroll') next.set('rows', 'all')
              else next.delete('rows')
              setParams(next, { replace: true })
            }}
          />
        )}
        {/* The negative margin gives the cards' shadows room inside the scroll box without moving the rail. */}
        <div data-day-rail-scroll style={{ alignSelf: 'stretch', flex: 'none', overflowY: 'auto', margin: '-4px -6px', padding: '4px 6px' }}>
        <RightRail
          monthDateISO={dateISO}
          selectedDateISO={dateISO}
          todayISO={ctx.todayISO}
          onNavigateDate={goToDay}
          notes={ctx.notes}
          onAddNote={ctx.onAddNote}
          shellScrollbarWidth={ctx.shellScrollbarWidth}
          todoRows={ctx.todoRows}
          actor={ctx.actor}
          onOpenBooking={(d, bookingId) => navigate(`/admin/day/${d}/bookings/${bookingId}`)}
          onOpenConflicts={() => navigate(listsPath('conflicts'))}
          onOpenInvoices={() => navigate(awaitingApprovalPath())}
          onOpenNotification={(target) => openNotificationTarget(target, ctx, (d, bookingId) => navigate(`/admin/day/${d}/bookings/${bookingId}`))}
          onSeeAllNotifications={() => navigate('/admin/notifications')}
          onShowResolvedNotifications={() => navigate('/admin/notifications?resolved=1')}
          onOpenList={ctx.onOpenList}
        />
        </div>
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
              : invoicePath(returnInvoice.id),
          )
        }
        backLabel={
          returnInvoice === undefined
            ? 'Day view'
            : `Invoice ${returnInvoice.invoiceNumber}`
        }
        officeLinks={{
          onOpenInvoices: () => navigate(awaitingApprovalPath()),
          onOpenInvoice: (invoiceId) => navigate(invoicePath(invoiceId)),
          onOpenCreditNote: (creditNoteId) => navigate(creditNotePath(creditNoteId)),
        }}
      />
    </RequireEntity>
  )
}

// ---------------------------------------------------------------------------
// Lists (US-13.1.3): the four tabs render from their own files in
// `screens/lists/`, mounted directly by `router.tsx`. A submitted List's review
// page sits under To authorise: `/admin/lists/to-authorise/:listId`. The old
// Draft Lists, Conflicts and Review queue addresses redirect here, with
// replace, keeping the query and router state.
// ---------------------------------------------------------------------------

export function ListsLegacyRedirect() {
  const { pathname, search, state } = useLocation()
  return <Navigate to={listsPathFromLegacy(pathname, search)} replace state={state} />
}

/** Router state "Open in Review" passes from Finances' Billing tab: where to return, with its search. */
export interface BillingMonitorReturnState {
  from: 'billing'
  search: string
}

export function billingMonitorReturn(state: unknown): BillingMonitorReturnState | null {
  if (typeof state !== 'object' || state === null) return null
  const s = state as Partial<BillingMonitorReturnState>
  return s.from === 'billing' ? { from: 'billing', search: typeof s.search === 'string' ? s.search : '' } : null
}

export function AdminReviewRoute() {
  const { listId = '' } = useParams()
  const { actor } = useAdminOutlet()
  const navigate = useNavigate()
  const exists = useAppStore((s) => s.schedule.lists[listId] !== undefined)
  // Opened from Billing's "Open in Review" (catch-up Phase 37): back returns to the Billing tab with its filters,
  // and Previous and Next carry the router state so it still does.
  const location = useLocation()
  const from = billingMonitorReturn(location.state)
  // Opened from To authorise: back returns to the tab with its filters (search, date, Needs a look, page).
  const tab = toAuthoriseReturn(location.state)

  return (
    <RequireEntity exists={exists}>
      <ReviewScreen
        listId={listId}
        actor={actor}
        backToBillingMonitor={from !== null}
        onBack={() => navigate(from !== null ? financePath('billing') + from.search : listsPath('to-authorise') + (tab?.search ?? ''))}
        onOpen={(next) => navigate(reviewPath(next), { state: location.state })}
        onViewInvoices={() => navigate(financePath('invoices', { list: listId, show: 'all' }))}
        onOpenBooking={(dateISO, bookingId) => navigate(`/admin/day/${dateISO}/bookings/${bookingId}`)}
      />
    </RequireEntity>
  )
}

// ---------------------------------------------------------------------------
// Finances (build plan Phase 58; D107, D108): the tabs and records render from
// their own files in `screens/finances/`, mounted directly by `router.tsx`. The
// old Invoices, credit note, Billing monitor, payment run and Ledger addresses
// redirect here, with replace, keeping the query and router state.
// ---------------------------------------------------------------------------

export function FinanceLegacyRedirect() {
  const { pathname, search, state } = useLocation()
  return <Navigate to={financePathFromLegacy(pathname, search)} replace state={state} />
}

// ---------------------------------------------------------------------------
// The single-screen sections
// ---------------------------------------------------------------------------

/**
 * A notification opens its List in the Day drawer, or its Draft List's drawer
 * (catch-up Phase 32); a single Booking moved opens the Booking's detail on
 * its day (catch-up Phase 32a).
 */
function openNotificationTarget(
  target: NotificationTarget,
  ctx: Pick<AdminOutletContext, 'onOpenList' | 'onOpenDraftList'>,
  openBooking: (dateISO: string, bookingId: string) => void,
) {
  if (target.kind === 'list') ctx.onOpenList(target.listId)
  else if (target.kind === 'draftList') ctx.onOpenDraftList(target.listId)
  else if (target.kind === 'booking') openBooking(target.dateISO, target.bookingId)
}

/**
 * Admin Intake (build plan Phase 68; D117): the section (`screens/intake/IntakeSection.tsx`) over its two routed
 * views, Arrivals (`/admin/intake`) and Sources (`/admin/intake/sources`).
 */
export function AdminIntakeRoute() {
  const { actor } = useAdminOutlet()
  return <IntakeSection actor={actor} />
}

/**
 * Arrivals (27 Nov 2026 rebuild): the inbox, its query in the URL. An old address (`?item=`, `?filter=`) redirects
 * with replace to the opened arrival or the inbox query it now means.
 */
export function AdminArrivalsRoute() {
  const { actor } = useAdminOutlet()
  const [params] = useSearchParams()
  const legacy = inboxRedirectFromLegacyParams(params)
  if (legacy !== undefined) return <Navigate to={legacy} replace />
  return <InboxView actor={actor} />
}

/** One arrival opened on its own page (27 Nov 2026 rebuild; O1), outside Intake's tabs; the inbox's query in the URL. */
export function AdminArrivalRoute() {
  const { actor } = useAdminOutlet()
  return <ArrivalPage actor={actor} />
}

/** Sources (D117; DM-14): where arrivals come from, inbound only. */
export function AdminSourcesRoute() {
  return <SourcesView />
}

/**
 * The old Intake addresses (Matching, Waiting for NHI, PDF lists, Data quality, Validators, `/admin/matching`,
 * `/admin/integrations`) redirect with replace (D117), so Back never bounces here. A link's `{ selectRowId }` router
 * state lands as that row's arrival selected; the state is carried on.
 */
export function IntakeLegacyRedirect() {
  const { pathname, state } = useLocation()
  const selectRowId = (state as { selectRowId?: unknown } | null)?.selectRowId
  const item = useAppStore((s) => (typeof selectRowId === 'string' ? arrivalKeyForRow(s, selectRowId) : undefined))
  return <Navigate to={intakePathFromLegacy(pathname, item)} replace state={state} />
}

/** The shared notification pool (catch-up Phase 32; US-13.8.1, US-13.8.3) — `/admin/notifications` (`?page=`, `?resolved=1`). */
export function AdminNotificationsRoute() {
  const ctx = useAdminOutlet()
  const navigate = useNavigate()
  return <NotificationsScreen actor={ctx.actor} onOpen={(target) => openNotificationTarget(target, ctx, (d, bookingId) => navigate(`/admin/day/${d}/bookings/${bookingId}`))} />
}

export function AdminMastersRoute() {
  const { actor } = useAdminOutlet()
  const [params] = useSearchParams()
  const masters = useAppStore((s) => s.masters)
  // Old links to views that moved out of Master data (D93): a replace, so Back never bounces here.
  const moved = mastersRedirect(params, masters)
  if (moved !== null) return <Navigate to={moved} replace />
  return <MasterData actor={actor} />
}

// ---------------------------------------------------------------------------
// Contracts (build plan Phase 45; D92) — `/admin/contracts` (the list),
// `/admin/contracts/new` (the create panel over the list until 46; one element) and
// `/admin/contracts/:contractId` (a Contract's page, keyed by its id, with Replace from a date at `.../replace`; an
// unknown id falls back to the list).
// ---------------------------------------------------------------------------

/** The list. New contract is its own page since build plan Phase 46. */
export function AdminContractsRoute() {
  return <ContractsSection />
}

/** New contract (build plan Phase 46): `?holder=` that names a Party fills the holder; anything else is ignored. */
export function AdminNewContractRoute() {
  const { actor } = useAdminOutlet()
  const [params] = useSearchParams()
  const holderParam = params.get('holder') ?? ''
  const holder = useAppStore((s) => (s.masters.parties[holderParam] !== undefined ? holderParam : ''))
  return <NewContractPage key={holder} actor={actor} {...(holder !== '' ? { initialHolderId: holder } : {})} />
}

/** The Parties tab (build plan Phase 48). */
export function AdminPartiesRoute() {
  const { actor } = useAdminOutlet()
  return <PartiesTab actor={actor} />
}

/** A Party's page (build plan Phase 48); an unknown id falls back to the Parties tab. */
export function AdminPartyRoute() {
  const { partyId = '' } = useParams()
  const { actor } = useAdminOutlet()
  const exists = useAppStore((s) => s.masters.parties[partyId] !== undefined)
  return (
    <RequireEntity exists={exists}>
      <PartyPage key={partyId} partyId={partyId} actor={actor} />
    </RequireEntity>
  )
}

/** The Funding tags tab (build plan Phase 48). */
export function AdminFundingTagsRoute() {
  const { actor } = useAdminOutlet()
  return <FundingTagsTab actor={actor} />
}

export function AdminContractRoute() {
  const { contractId = '' } = useParams()
  const { actor } = useAdminOutlet()
  const exists = useAppStore((s) => s.masters.contracts[contractId] !== undefined)
  return (
    <RequireEntity exists={exists}>
      <ContractPage key={contractId} contractId={contractId} actor={actor} />
    </RequireEntity>
  )
}

/**
 * Replace from a date (build plan Phase 49; US-04.1.8): `/admin/contracts/:contractId/replace`. Only an
 * Active, non-system Contract is replaced; any other goes back to its page, as an unknown id falls back
 * to the list.
 */
export function AdminReplaceContractRoute() {
  const { contractId = '' } = useParams()
  const { actor } = useAdminOutlet()
  const exists = useAppStore((s) => s.masters.contracts[contractId] !== undefined)
  return (
    <RequireEntity exists={exists}>
      <ReplaceContractGate key={contractId} contractId={contractId} actor={actor} />
    </RequireEntity>
  )
}

function ReplaceContractGate({ contractId, actor }: { contractId: string; actor: Actor }) {
  const contract = useAppStore((s) => s.masters.contracts[contractId])!
  // Read once: saving with "Disable now" disables this Contract on the way to the new one's page.
  const [replaceable] = useState(() => contract.status === 'active' && contract.systemRole === undefined)
  return replaceable ? <ReplaceContractPage contract={contract} actor={actor} /> : <Navigate to={contractPath(contractId)} replace />
}

// ---------------------------------------------------------------------------
// People (build plan Phase 53; D99) — `/admin/people/<tab>`: Anaesthetists,
// Surgeons, Specialties and Patients, each a routed tab, and the record pages
// under their tabs: `/admin/people/anaesthetists/:anaesthetistId`,
// `/admin/people/surgeons/:surgeonId` and `/admin/people/patients/:nhi`. An
// unknown id falls back to its tab.
// ---------------------------------------------------------------------------

export function AdminPeopleAnaesthetistsRoute() {
  const { actor } = useAdminOutlet()
  return <AnaesthetistsTab actor={actor} />
}

export function AdminPeopleSurgeonsRoute() {
  const { actor } = useAdminOutlet()
  return <SurgeonsTab actor={actor} />
}

export function AdminPeopleSpecialtiesRoute() {
  const { actor } = useAdminOutlet()
  return <SpecialtiesTab actor={actor} />
}

/** A specialty's page (build plan Phase 56): an unknown or removed id lands on the Specialties tab. */
export function AdminSpecialtyPageRoute() {
  const { specialtyId = '' } = useParams()
  const { actor } = useAdminOutlet()
  const exists = useAppStore((s) => s.masters.specialties[specialtyId] !== undefined)
  return (
    <RequireEntity exists={exists}>
      <SpecialtyPage key={specialtyId} specialtyId={specialtyId} actor={actor} />
    </RequireEntity>
  )
}

/** People · Patients (build plan Phase 57): one list with Coming up, Needs follow-up and All. */
export function AdminPeoplePatientsRoute() {
  return <PatientsScreen />
}

/**
 * The old profile and patient links (D100): `/admin/masters/anaesthetists/:id`,
 * `/admin/masters/surgeons/:id` and `/admin/patients/:nhi` land on the record's
 * page under People, a replace so Back never bounces here. An unknown id then
 * falls back to its tab.
 */
export function AdminPersonRedirect({ kind }: { kind: 'anaesthetist' | 'surgeon' | 'patient' }) {
  const params = useParams()
  const { state } = useLocation()
  const to =
    kind === 'anaesthetist'
      ? anaesthetistRecordPath(params['anaesthetistId'] ?? '')
      : kind === 'surgeon'
        ? surgeonProfilePath(params['surgeonId'] ?? '')
        : patientPath(params['nhi'] ?? '')
  return <Navigate to={to} replace state={state} />
}

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
      <AnaesthetistPage key={anaesthetistId} anaesthetistId={anaesthetistId} actor={actor} />
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
        borderRadius: radius.card,
        padding: '40px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'flex-start',
        boxShadow: elevation.e1,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, color: neutral.ink }}>
        Beyond the schedule horizon, which ends {dayWithYear(endISO)}.
      </div>
      <div style={{ fontSize: 13, color: neutral.slate, maxWidth: 560, lineHeight: '19px' }}>
        Sessions are created up to the horizon and roll forward each day. The horizon length is set in Master data, Schedule settings.
      </div>
      <TextAction size="sm" flush onClick={onGoToEnd} style={{ marginTop: 6 }}>
        Go to the last day
      </TextAction>
    </div>
  )
}

// ---------------------------------------------------------------------------
// A patient's page (catch-up Phase 40; under People since build plan Phase 53):
// `/admin/people/patients/:nhi`. The route key is the NHI; an unknown NHI goes
// back to the Patients tab. The old `/admin/patients` links redirect (D100).
// ---------------------------------------------------------------------------

export function AdminPatientRecordRoute() {
  const { nhi = '' } = useParams()
  const { actor } = useAdminOutlet()
  const navigate = useNavigate()
  const key = nhi.replace(/\s+/g, '').toUpperCase()
  const exists = useAppStore((s) => patientByNhi(s, key) !== undefined)
  return (
    <RequireEntity exists={exists}>
      <PatientRecord key={key} nhi={key} actor={actor} onOpenBooking={(d, bookingId) => navigate(`/admin/day/${d}/bookings/${bookingId}`)} />
    </RequireEntity>
  )
}
