import { createBrowserRouter, createRoutesFromElements, Navigate, Route, RouterProvider } from 'react-router-dom'
import { AppShell } from './shell/AppShell'
import { PhoneFrame } from './shell/PhoneFrame'
import { MobileApp } from './apps/mobile/MobileApp'
import { WebApp } from './apps/web/WebApp'
import { AdminApp } from './apps/admin/AdminApp'
import {
  WebAccountsRoute,
  WebAccountsOverdueRedirect,
  WebAvailabilityRoute,
  WebMyAvailabilityRoute,
  WebBookingDetailRoute,
  WebDashboardRoute,
  WebListDetailRoute,
  WebListsRoute,
  WebProfileRoute,
} from './apps/web/routes'
import {
  MobileAvailabilityRoute,
  MobileBalancesRoute,
  MobileListsRoute,
  MobileMoreRoute,
} from './apps/mobile/routes'
import {
  AdminAuditRoute,
  AdminBookingDetailRoute,
  AdminDayRoute,
  AdminIndexRedirect,
  AdminIntakeRoute,
  AdminArrivalsRoute,
  AdminSourcesRoute,
  IntakeLegacyRedirect,
  AdminMastersRoute,
  AdminContractsRoute,
  AdminContractRoute,
  AdminNewContractRoute,
  AdminPartiesRoute,
  AdminPartyRoute,
  AdminFundingTagsRoute,
  AdminSurgeonProfileRoute,
  AdminSpecialtyPageRoute,
  AdminAnaesthetistRecordRoute,
  AdminReviewQueueRoute,
  AdminConflictsRoute,
  AdminDraftListsRoute,
  AdminNotificationsRoute,
  AdminReviewRoute,
  AdminPatientRecordRoute,
  AdminPeopleAnaesthetistsRoute,
  AdminPeopleSurgeonsRoute,
  AdminPeopleSpecialtiesRoute,
  AdminPeoplePatientsRoute,
  AdminPersonRedirect,
  FinanceLegacyRedirect,
} from './apps/admin/routes'
import { BillingTab } from './apps/admin/screens/finances/BillingTab'
import { InvoicesTab } from './apps/admin/screens/finances/InvoicesTab'
import { PaymentsTab } from './apps/admin/screens/finances/PaymentsTab'
import { LedgerTab } from './apps/admin/screens/finances/LedgerTab'
import { XeroTab } from './apps/admin/screens/finances/XeroTab'
import { AaFeesTab } from './apps/admin/screens/finances/AaFeesTab'
import { InvoicePage } from './apps/admin/screens/finances/InvoicePage'
import { CreditNotePage } from './apps/admin/screens/finances/CreditNotePage'
import { PaymentRunPage } from './apps/admin/screens/finances/PaymentRunPage'
import { RemittancePage } from './apps/admin/screens/finances/RemittancePage'
import { AnaesthetistAccountPage } from './apps/admin/screens/finances/AnaesthetistAccountPage'
import { peoplePath } from './apps/admin/peoplePaths'
import { arrivalsPath } from './apps/admin/screens/intake/intakePaths'
import { DemoControlPanel } from './apps/demo/DemoControlPanel'
import { DemoXero } from './apps/demo/DemoXero'
import { DemoIntegrations } from './apps/demo/DemoIntegrations'
import { FutureScopeMessageLog } from './apps/demo/futureScope/MessageLog'
import { FutureScopeFeedMapping } from './apps/demo/futureScope/FeedMapping'
import { DemoData } from './apps/demo/DemoData'
import { ComponentCatalogue } from './apps/demo/catalogue/ComponentCatalogue'
import { useAppStore } from './store'
import { LegacyBookingRedirect } from './shared/legacy'
import { APP_CONFIG } from './shell/appConfig'

/** Redirect the bare route (and unknown routes) to the last-selected app. */
function RootRedirect() {
  const currentApp = useAppStore((s) => s.shell.currentApp)
  return <Navigate to={APP_CONFIG[currentApp].path} replace />
}

/**
 * The prototype's URL map. Each of the three apps is a LAYOUT route with the
 * screens nested beneath it, so every screen has a shareable URL that survives
 * a refresh and the browser back button (Decisions log 2026-07-27). The three
 * app roots (`/mobile`, `/web`, `/admin`) stay valid as index routes — the app
 * switcher and every Playwright spec enter through them.
 *
 * Path segments carry NAVIGATION; query params carry VIEW PREFERENCES
 * (`?week=` on the web dashboard, `?sort=` on the admin day view). Transient
 * overlays — cover sheets, the add-booking flow, the admin list drawer — stay
 * local state, because a sheet in the URL makes Back close the sheet.
 *
 * `:listId` / `:bookingId` / `:invoiceId` are nested one segment deep under the
 * collection they belong to so `RequireEntity`'s route-relative `..` fallback
 * lands on that collection. The People record pages (`anaesthetists/:anaesthetistId`,
 * `surgeons/:surgeonId`, `patients/:nhi`) are each nested under their tab, so an
 * unknown id falls back to that tab (build plan Phase 53).
 */
const routeTree = (
        <Route element={<AppShell />}>
          <Route index element={<RootRedirect />} />

          {/* ── Anaesthetist Web App ───────────────────────────── */}
          <Route path="web" element={<WebApp />}>
            <Route index element={<WebDashboardRoute />} />
            <Route path="lists">
              <Route index element={<WebListsRoute />} />
              <Route path=":listId">
                <Route index element={<WebListDetailRoute />} />
                <Route path="bookings/:bookingId" element={<WebBookingDetailRoute />} />
                <Route path="cards/:cardId" element={<LegacyBookingRedirect />} />
              </Route>
            </Route>
            <Route path="availability" element={<WebAvailabilityRoute />} />
            <Route path="availability/mine" element={<WebMyAvailabilityRoute />} />
            <Route path="accounts">
              <Route index element={<Navigate to="outstanding" replace />} />
              {/* The Overdue tab became Outstanding (catch-up Phase 38, D8): old links and guide URLs land there. */}
              <Route path="overdue" element={<WebAccountsOverdueRedirect />} />
              <Route path=":subTab" element={<WebAccountsRoute />} />
            </Route>
            <Route path="profile" element={<WebProfileRoute />} />
            <Route path="*" element={<Navigate to="/web" replace />} />
          </Route>

          {/* ── Admin Web App ──────────────────────────────────── */}
          <Route path="admin" element={<AdminApp />}>
            <Route index element={<AdminIndexRedirect />} />
            <Route path="day/:dateISO">
              <Route index element={<AdminDayRoute />} />
              <Route path="bookings/:bookingId" element={<AdminBookingDetailRoute />} />
              <Route path="cards/:cardId" element={<LegacyBookingRedirect />} />
            </Route>
            {/* Admin Intake (build plan Phase 68; D117): Arrivals and Sources. Every old Intake address redirects with
                replace (`IntakeLegacyRedirect`, `intakePaths.ts`), carrying `selectRowId` as the selected arrival.
                Wave 7 (69 to 72) edits none of this block. */}
            <Route path="intake" element={<AdminIntakeRoute />}>
              <Route index element={<AdminArrivalsRoute />} />
              <Route path="sources" element={<AdminSourcesRoute />} />
            </Route>
            <Route path="intake/matching" element={<IntakeLegacyRedirect />} />
            <Route path="intake/waiting" element={<IntakeLegacyRedirect />} />
            <Route path="intake/pdfs" element={<IntakeLegacyRedirect />} />
            <Route path="intake/quality" element={<IntakeLegacyRedirect />} />
            <Route path="intake/validators" element={<IntakeLegacyRedirect />} />
            <Route path="matching" element={<IntakeLegacyRedirect />} />
            <Route path="conflicts" element={<AdminConflictsRoute />} />
            <Route path="draft-lists" element={<AdminDraftListsRoute />} />
            <Route path="notifications" element={<AdminNotificationsRoute />} />
            <Route path="review">
              <Route index element={<AdminReviewQueueRoute />} />
              <Route path=":listId" element={<AdminReviewRoute />} />
            </Route>
            {/* Finances (build plan Phase 58; D107): six routed tabs opening on Billing, each record nested under its
                tab so an unknown id falls back to the tab. Each element is its own file in `screens/finances/`.
                Fixed order: Wave 5 (60 to 67) edits none of this block. */}
            <Route path="finances">
              <Route index element={<Navigate to="billing" replace />} />
              <Route path="billing" element={<BillingTab />} />
              <Route path="invoices">
                <Route index element={<InvoicesTab />} />
                <Route path="credit-notes/:creditNoteId" element={<CreditNotePage />} />
                <Route path=":invoiceId" element={<InvoicePage />} />
              </Route>
              <Route path="payments">
                <Route index element={<PaymentsTab />} />
                <Route path=":runId" element={<PaymentRunPage />} />
                <Route path=":runId/remittance/:anaesthetistId" element={<RemittancePage />} />
              </Route>
              <Route path="ledger">
                <Route index element={<LedgerTab />} />
                <Route path="anaesthetists/:anaesthetistId" element={<AnaesthetistAccountPage />} />
              </Route>
              <Route path="xero" element={<XeroTab />} />
              <Route path="aa-fees">
                <Route index element={<AaFeesTab view="invoices" />} />
                <Route path="settings" element={<AaFeesTab view="settings" />} />
              </Route>
            </Route>
            {/* The old Invoices, credit note, Billing monitor (AA fees, payment runs) and Ledger links redirect and stay (D108):
                with replace, keeping the query, to their Finances homes (`financePathFromLegacy`). */}
            <Route path="invoices/*" element={<FinanceLegacyRedirect />} />
            <Route path="credit-notes/*" element={<FinanceLegacyRedirect />} />
            <Route path="billing/*" element={<FinanceLegacyRedirect />} />
            <Route path="ledger/*" element={<FinanceLegacyRedirect />} />
            {/* People (build plan Phase 53; D99): four routed tabs, each record nested under its tab so an
                unknown id falls back to the tab. Fixed order: Wave 3 (54 to 57) only adds or swaps its own
                routes here, never reorders the block. */}
            <Route path="people">
              <Route index element={<Navigate to="anaesthetists" replace />} />
              <Route path="anaesthetists">
                <Route index element={<AdminPeopleAnaesthetistsRoute />} />
                <Route path=":anaesthetistId" element={<AdminAnaesthetistRecordRoute />} />
              </Route>
              <Route path="surgeons">
                <Route index element={<AdminPeopleSurgeonsRoute />} />
                <Route path=":surgeonId" element={<AdminSurgeonProfileRoute />} />
              </Route>
              <Route path="specialties">
                <Route index element={<AdminPeopleSpecialtiesRoute />} />
                <Route path=":specialtyId" element={<AdminSpecialtyPageRoute />} />
              </Route>
              <Route path="patients">
                <Route index element={<AdminPeoplePatientsRoute />} />
                <Route path=":nhi" element={<AdminPatientRecordRoute />} />
              </Route>
            </Route>
            {/* The old Patients links (catch-up Phase 40) redirect and stay (D100): Waiting for NHI to Intake (51), the rest to People. Static segments rank above `:nhi`. */}
            <Route path="patients">
              <Route index element={<Navigate to={peoplePath('patients')} replace />} />
              <Route path="waiting" element={<Navigate to={arrivalsPath({ filter: { kind: 'needsNhi' } })} replace />} />
              <Route path="follow-up" element={<Navigate to={peoplePath('patients', { filter: 'follow-up' })} replace />} />
              <Route path=":nhi" element={<AdminPersonRedirect kind="patient" />} />
            </Route>
            {/* Contracts (build plan Phase 45; D92): the list, New contract and a Contract's page by its id. */}
            <Route path="contracts">
              <Route element={<AdminContractsRoute />}>
                <Route index element={null} />
              </Route>
              {/* New contract is its own page (build plan Phase 46), declared before `:contractId`. */}
              <Route path="new" element={<AdminNewContractRoute />} />
              {/* The Parties and Funding tags tabs and a Party's page (build plan Phase 48): static segments rank above `:contractId`. */}
              <Route path="parties">
                <Route index element={<AdminPartiesRoute />} />
                <Route path=":partyId" element={<AdminPartyRoute />} />
              </Route>
              <Route path="tags" element={<AdminFundingTagsRoute />} />
              <Route path=":contractId" element={<AdminContractRoute />} />
            </Route>
            <Route path="integrations" element={<IntakeLegacyRedirect />} />
            <Route path="masters">
              <Route index element={<AdminMastersRoute />} />
              {/* The old profile pages (catch-up Phase 17) moved to People (build plan Phase 53): they redirect and stay (D100). */}
              <Route path="surgeons/:surgeonId" element={<AdminPersonRedirect kind="surgeon" />} />
              <Route path="anaesthetists/:anaesthetistId" element={<AdminPersonRedirect kind="anaesthetist" />} />
            </Route>
            <Route path="audit" element={<AdminAuditRoute />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>

          {/* ── Anaesthetist Mobile App ────────────────────────── */}
          {/* The simulated device is the prototype's host; the PWA target
              mounts the same app inside `MobileViewport` instead. */}
          <Route path="mobile" element={<MobileApp host={PhoneFrame} sessionDefault="signed-in" />}>
            <Route index element={<Navigate to="lists" replace />} />
            {/* One splat route, not sibling routes per layer: the slide stack
                keeps every layer mounted so push AND pop animate. */}
            <Route path="lists/*" element={<MobileListsRoute />} />
            <Route path="availability/*" element={<MobileAvailabilityRoute />} />
            <Route path="balances" element={<MobileBalancesRoute />} />
            <Route path="more" element={<MobileMoreRoute />} />
            <Route path="*" element={<Navigate to="/mobile" replace />} />
          </Route>

          <Route path="demo/control" element={<DemoControlPanel />} />
          <Route path="demo/xero">
            <Route index element={<DemoXero />} />
            <Route path="invoices">
              <Route index element={<DemoXero />} />
              <Route path=":accRecId" element={<DemoXero />} />
            </Route>
            <Route path="bank" element={<DemoXero />} />
          </Route>
          {/* Future scope: HL7 and FHIR (catch-up Phase 34): the simulator, its message log and feed mapping. */}
          <Route path="demo/integrations">
            <Route index element={<DemoIntegrations />} />
            <Route path="log" element={<FutureScopeMessageLog />} />
            <Route path="mapping" element={<FutureScopeFeedMapping />} />
          </Route>
          <Route path="demo/data" element={<DemoData />} />
          {/* UI component catalogue (demo only; docs/archive/ui-unification/): URL only, not in the app switcher. */}
          <Route path="demo/catalogue" element={<Navigate to="/demo/catalogue/admin" replace />} />
          <Route path="demo/catalogue/:app" element={<ComponentCatalogue />} />
          <Route path="*" element={<RootRedirect />} />
        </Route>
)

/**
 * A data router (catch-up Phase 35), so the Admin Booking detail's unsaved
 * changes guard can block navigation (`useBlocker`). Same route tree and
 * URLs as the `BrowserRouter` it replaced. Created once, on first render,
 * never inside a component's render path twice. The PWA keeps its own
 * `BrowserRouter` (pwa/main.tsx): it has no Admin.
 */
let router: ReturnType<typeof createBrowserRouter> | null = null
function appRouter(): ReturnType<typeof createBrowserRouter> {
  router ??= createBrowserRouter(createRoutesFromElements(routeTree), {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  })
  return router
}

export function AppRouter() {
  return <RouterProvider router={appRouter()} future={{ v7_startTransition: true }} />
}
