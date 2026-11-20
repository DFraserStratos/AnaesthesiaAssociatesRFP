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
  AdminBillingPage,
  AdminLedgerRoute,
  AdminAnaesthetistLedgerRoute,
  AdminAaFeesRoute,
  AdminAaFeeSettingsRoute,
  AdminBookingDetailRoute,
  AdminDayRoute,
  AdminIndexRedirect,
  AdminIntakeRoute,
  AdminIntakeRedirect,
  AdminPdfListsRoute,
  AdminDataQualityRoute,
  AdminValidatorsRoute,
  AdminInvoicesRoute,
  AdminCreditNoteRoute,
  AdminPaymentRunRoute,
  AdminRemittanceRoute,
  AdminMastersRoute,
  AdminMatchingRoute,
  AdminSurgeonProfileRoute,
  AdminAnaesthetistRecordRoute,
  AdminReviewQueueRoute,
  AdminConflictsRoute,
  AdminDraftListsRoute,
  AdminNotificationsRoute,
  AdminReviewRoute,
} from './apps/admin/routes'
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
 * lands on that collection. The Master data pages (`surgeons/:surgeonId`,
 * `anaesthetists/:anaesthetistId`) are each ONE child route of `masters`, so
 * an unknown id falls back to `/admin/masters`.
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
            {/* Admin Intake (catch-up Phase 34): matching, the rooms' PDF lists, data quality and the validators. */}
            <Route path="intake" element={<AdminIntakeRoute />}>
              <Route index element={<Navigate to="matching" replace />} />
              <Route path="matching" element={<AdminMatchingRoute />} />
              <Route path="pdfs" element={<AdminPdfListsRoute />} />
              <Route path="quality" element={<AdminDataQualityRoute />} />
              <Route path="validators" element={<AdminValidatorsRoute />} />
            </Route>
            <Route path="matching" element={<AdminIntakeRedirect />} />
            <Route path="conflicts" element={<AdminConflictsRoute />} />
            <Route path="draft-lists" element={<AdminDraftListsRoute />} />
            <Route path="notifications" element={<AdminNotificationsRoute />} />
            <Route path="review">
              <Route index element={<AdminReviewQueueRoute />} />
              <Route path=":listId" element={<AdminReviewRoute />} />
            </Route>
            <Route path="invoices">
              <Route index element={<AdminInvoicesRoute />} />
              <Route path=":invoiceId" element={<AdminInvoicesRoute />} />
            </Route>
            {/* A credit note's document (catch-up Phase 39), under Invoices in the side nav. */}
            <Route path="credit-notes/:creditNoteId" element={<AdminCreditNoteRoute />} />
            <Route path="billing">
              <Route index element={<AdminBillingPage />} />
              <Route path="aa-fees" element={<AdminAaFeesRoute />} />
              <Route path="aa-fees/settings" element={<AdminAaFeeSettingsRoute />} />
              {/* A payment run and its remittance advices (catch-up Phase 39a). */}
              <Route path="payment-runs/:runId" element={<AdminPaymentRunRoute />} />
              <Route path="payment-runs/:runId/remittance/:anaesthetistId" element={<AdminRemittanceRoute />} />
            </Route>
            <Route path="ledger">
              <Route index element={<AdminLedgerRoute />} />
              <Route path="anaesthetists/:anaesthetistId" element={<AdminAnaesthetistLedgerRoute />} />
            </Route>
            <Route path="integrations" element={<AdminIntakeRedirect />} />
            <Route path="masters">
              <Route index element={<AdminMastersRoute />} />
              <Route path="surgeons/:surgeonId" element={<AdminSurgeonProfileRoute />} />
              <Route path="anaesthetists/:anaesthetistId" element={<AdminAnaesthetistRecordRoute />} />
            </Route>
            <Route path="audit" element={<AdminAuditRoute />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>

          {/* ── Anaesthetist Mobile App ────────────────────────── */}
          {/* The simulated device is the prototype's host; the PWA target
              mounts the same app inside `MobileViewport` instead. */}
          <Route path="mobile" element={<MobileApp host={PhoneFrame} />}>
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
          {/* UI component catalogue (docs/ui-library-research): URL only, not in the app switcher. */}
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
