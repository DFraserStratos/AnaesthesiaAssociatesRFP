import { useState } from 'react'
import { pageParam } from './components/Pager'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { neutral, radius, elevation } from '../../theme/tokens'
import { TextAction } from '../../shared/ui'
import { RequireEntity } from '../../shell/RequireEntity'
import { PaymentRunScreen, RemittanceAdviceScreen } from './screens/PaymentRunScreen'
import { isISODate } from '../../shell/routeParams'
import { listInSlot, patientByNhi, useAppStore, useToday, type NotificationTarget } from '../../store'
import { DayNav } from './components/DayNav'
import { AvailabilityFinderSheet } from './flows/AvailabilityFinderSheet'
import { DayGrid } from './components/DayGrid'
import { RightRail } from './components/RightRail'
import { AdminBookingDetail } from './screens/AdminBookingDetail'
import { AuditViewer } from './screens/AuditViewer'
import { BillingMonitorScreen } from './screens/BillingMonitorScreen'
import { LedgerScreen } from './screens/LedgerScreen'
import { AaFeesScreen } from './screens/AaFeesScreen'
import { IntakeScreen } from './screens/IntakeScreen'
import { PdfListsTab } from './intake/PdfListsTab'
import { DataQualityTab } from './intake/DataQualityTab'
import { ValidatorsTab } from './intake/ValidatorsTab'
import { WaitingNhiTab } from './intake/WaitingNhiTab'
import { InvoicesScreen } from './screens/InvoicesScreen'
import { AdminPage } from './components/AdminPage'
import { CreditNoteDocument } from './screens/InvoiceDocument'
import { MasterData } from './screens/masters/MasterData'
import { mastersRedirect } from './mastersRedirect'
import { ContractsSection } from './screens/contracts/ContractsSection'
import { ContractPage } from './screens/contracts/ContractPage'
import { NewContractPage } from './screens/contracts/new/NewContractPage'
import { PartiesTab } from './screens/contracts/PartiesTab'
import { PartyPage } from './screens/contracts/PartyPage'
import { FundingTagsTab } from './screens/contracts/FundingTagsTab'
import { AnaesthetistsTab } from './screens/people/AnaesthetistsTab'
import { SurgeonsTab } from './screens/people/SurgeonsTab'
import { SpecialtiesTab } from './screens/people/SpecialtiesTab'
import { anaesthetistRecordPath, surgeonProfilePath } from './peoplePaths'
import { patientPath } from '../../shared/patients'
import { SurgeonProfile } from './screens/SurgeonProfile'
import { AnaesthetistPage } from './screens/AnaesthetistPage'
import { ReviewQueue } from './screens/ReviewQueue'
import { ConflictsScreen } from './screens/ConflictsScreen'
import { DraftListsScreen } from './screens/DraftListsScreen'
import { NotificationsScreen } from './screens/NotificationsScreen'
import { MatchingScreen } from './screens/MatchingScreen'
import { ReviewScreen } from './screens/ReviewScreen'
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
          onOpenConflicts={() => navigate('/admin/conflicts')}
          onOpenInvoices={() => navigate('/admin/invoices?view=approval')}
          onOpenNotification={(target) => openNotificationTarget(target, ctx, (d, bookingId) => navigate(`/admin/day/${d}/bookings/${bookingId}`))}
          onSeeAllNotifications={() => navigate('/admin/notifications')}
          onShowResolvedNotifications={() => navigate('/admin/notifications?resolved=1')}
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
              : `/admin/invoices/${returnInvoice.id}`,
          )
        }
        backLabel={
          returnInvoice === undefined
            ? 'Day view'
            : `Invoice ${returnInvoice.invoiceNumber}`
        }
        officeLinks={{
          onOpenInvoices: () => navigate('/admin/invoices?view=approval'),
          onOpenInvoice: (invoiceId) => navigate(`/admin/invoices/${invoiceId}`),
          onOpenCreditNote: (creditNoteId) => navigate(`/admin/credit-notes/${creditNoteId}`),
        }}
      />
    </RequireEntity>
  )
}

// ---------------------------------------------------------------------------
// Review queue — `/admin/review`, `/admin/review/:listId`
// ---------------------------------------------------------------------------

export function AdminReviewQueueRoute() {
  const navigate = useNavigate()
  const { actor } = useAdminOutlet()
  return (
    <ReviewQueue
      actor={actor}
      onOpen={(listId) => navigate(`/admin/review/${listId}`)}
      onViewInvoices={() => navigate('/admin/invoices')}
    />
  )
}

/** Router state "Open in Review" passes from the Billing monitor: where to return, with its search. */
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
  // Opened from the Billing monitor's "Open in Review" (catch-up Phase 37): back returns there with its filters.
  const from = billingMonitorReturn(useLocation().state)

  return (
    <RequireEntity exists={exists}>
      <ReviewScreen
        listId={listId}
        actor={actor}
        backToBillingMonitor={from !== null}
        onBack={() => navigate(from !== null ? `/admin/billing${from.search}` : '/admin/review')}
        onOpen={(next) => navigate(`/admin/review/${next}`)}
        onViewInvoices={() => navigate('/admin/invoices')}
        onOpenBooking={(dateISO, bookingId) => navigate(`/admin/day/${dateISO}/bookings/${bookingId}`)}
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
// A credit note: `/admin/credit-notes/:creditNoteId` (catch-up Phase 39). It
// sits under Invoices: the side nav keeps Invoices active, and its trail leads
// back there. An unknown id is a 404, as an unknown invoice is.
// ---------------------------------------------------------------------------

export function AdminCreditNoteRoute() {
  const { creditNoteId } = useParams()
  const navigate = useNavigate()
  const creditNote = useAppStore((s) => (creditNoteId !== undefined ? s.billing.creditNotes[creditNoteId] : undefined))

  return (
    <RequireEntity exists={creditNote !== undefined}>
      {creditNote !== undefined && (
        <AdminPage mode="document" testId="credit-note-detail-screen" back={{ label: 'Invoices', onClick: () => navigate('/admin/invoices') }}>
          <CreditNoteDocument key={creditNote.id} creditNoteId={creditNote.id} />
        </AdminPage>
      )}
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
 * Admin Intake (catch-up Phase 34) — `/admin/intake/<tab>`: the header and the
 * route strip, its tab page in the outlet.
 */
export function AdminIntakeRoute() {
  return <IntakeScreen />
}

/**
 * `/admin/matching` and `/admin/integrations` before catch-up Phase 34: both
 * land on Intake's Matching tab, keeping any router state (`{ selectRowId }`).
 */
export function AdminIntakeRedirect() {
  const { state } = useLocation()
  return <Navigate to="/admin/intake/matching" replace state={state} />
}

/**
 * Matching (catch-up Phase 33; US-02.1.1 to US-02.1.4) — `/admin/intake/matching`
 * since Phase 34. A link may pass `{ selectRowId }` in router state to open that
 * row (the Admin Booking's "From hospital row").
 */
export function AdminMatchingRoute() {
  const { actor, todayISO } = useAdminOutlet()
  const navigate = useNavigate()
  return <MatchingScreen actor={actor} todayISO={todayISO} onOpenBooking={(d, bookingId) => navigate(`/admin/day/${d}/bookings/${bookingId}`)} />
}

/** The shared notification pool (catch-up Phase 32; US-13.8.1, US-13.8.3) — `/admin/notifications` (`?page=`, `?resolved=1`). */
export function AdminNotificationsRoute() {
  const ctx = useAdminOutlet()
  const navigate = useNavigate()
  return <NotificationsScreen actor={ctx.actor} onOpen={(target) => openNotificationTarget(target, ctx, (d, bookingId) => navigate(`/admin/day/${d}/bookings/${bookingId}`))} />
}

export function AdminBillingPage() {
  const { actor } = useAdminOutlet()
  return <BillingMonitorScreen actor={actor} />
}

/** The internal ledger, whole (catch-up Phase 36; US-13.2.1). */
export function AdminLedgerRoute() {
  const { actor } = useAdminOutlet()
  return <LedgerScreen actor={actor} />
}

/** One anaesthetist's ledger; an unknown anaesthetist goes back to the whole ledger. */
export function AdminAnaesthetistLedgerRoute() {
  const { actor } = useAdminOutlet()
  const { anaesthetistId = '' } = useParams()
  const known = useAppStore((s) => s.masters.anaesthetists[anaesthetistId] !== undefined)
  if (!known) return <Navigate to="/admin/ledger" replace />
  return <LedgerScreen actor={actor} anaesthetistId={anaesthetistId} />
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

/** The rows waiting for an NHI (US-11.1.5; D99) — `/admin/intake/waiting`, beside Matching. */
export function AdminWaitingNhiTabRoute() {
  const { actor, onOpenList } = useAdminOutlet()
  return <WaitingNhiTab actor={actor} onOpenList={onOpenList} />
}

/** The rooms' PDF lists (catch-up Phase 34; FT-02.2, US-02.2.1) — `/admin/intake/pdfs`. */
export function AdminPdfListsRoute() {
  const { actor } = useAdminOutlet()
  return <PdfListsTab actor={actor} />
}

/** Data quality (Phase 11) — `/admin/intake/quality`. */
export function AdminDataQualityRoute() {
  const { actor } = useAdminOutlet()
  return <DataQualityTab actor={actor} />
}

/** The NHI and ethnicity validators (Phase 11; US-11.1.2) — `/admin/intake/validators`. */
export function AdminValidatorsRoute() {
  return <ValidatorsTab />
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
// `/admin/contracts/:contractId` (a Contract's page, keyed by its id; an
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

/** Today's patient Search and Follow-up (`?show=followUp`) until Phase 57 rebuilds the tab. */
export function AdminPeoplePatientsRoute() {
  const { actor } = useAdminOutlet()
  return <PatientsScreen actor={actor} />
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

// ---------------------------------------------------------------------------
// A payment run and its remittance advices (catch-up Phase 39a): under the
// Billing monitor in the side nav. An unknown run, or an anaesthetist not paid
// in it, is a 404.
// ---------------------------------------------------------------------------

export function AdminPaymentRunRoute() {
  const { runId = '' } = useParams()
  const exists = useAppStore((s) => s.billing.payablesRuns[runId] !== undefined)
  return (
    <RequireEntity exists={exists}>
      <PaymentRunScreen key={runId} runId={runId} />
    </RequireEntity>
  )
}

export function AdminRemittanceRoute() {
  const { runId = '', anaesthetistId = '' } = useParams()
  const exists = useAppStore((s) => {
    const run = s.billing.payablesRuns[runId]
    return run !== undefined && run.status !== 'superseded' && run.approvedAtISO !== undefined && run.byAnaesthetist.some((t) => t.anaesthetistId === anaesthetistId)
  })
  return (
    <RequireEntity exists={exists}>
      <RemittanceAdviceScreen key={`${runId}:${anaesthetistId}`} runId={runId} anaesthetistId={anaesthetistId} />
    </RequireEntity>
  )
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
