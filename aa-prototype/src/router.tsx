import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './shell/AppShell'
import { MobileApp } from './apps/mobile/MobileApp'
import { WebApp } from './apps/web/WebApp'
import { AdminApp } from './apps/admin/AdminApp'
import {
  WebAccountsRoute,
  WebAvailabilityRoute,
  WebCardDetailRoute,
  WebDashboardRoute,
  WebListDetailRoute,
  WebListsRoute,
} from './apps/web/routes'
import {
  MobileAvailabilityRoute,
  MobileBalancesRoute,
  MobileListsRoute,
  MobileMoreRoute,
} from './apps/mobile/routes'
import {
  AdminAuditRoute,
  AdminBillingRoute,
  AdminCardDetailRoute,
  AdminDayRoute,
  AdminIndexRedirect,
  AdminIntegrationsRoute,
  AdminInvoicesRoute,
  AdminMastersRoute,
  AdminReviewQueueRoute,
  AdminReviewRoute,
} from './apps/admin/routes'
import { DemoControlPanel } from './apps/demo/DemoControlPanel'
import { DemoXero } from './apps/demo/DemoXero'
import { DemoIntegrations } from './apps/demo/DemoIntegrations'
import { DemoData } from './apps/demo/DemoData'
import { useAppStore } from './store'
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
 * overlays — cover sheets, the add-card flow, the admin list drawer — stay
 * local state, because a sheet in the URL makes Back close the sheet.
 *
 * `:listId` / `:cardId` / `:invoiceId` are nested one segment deep under the
 * collection they belong to so `RequireEntity`'s route-relative `..` fallback
 * lands on that collection.
 */
export function AppRouter() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<RootRedirect />} />

          {/* ── Anaesthetist Web App ───────────────────────────── */}
          <Route path="web" element={<WebApp />}>
            <Route index element={<WebDashboardRoute />} />
            <Route path="lists">
              <Route index element={<WebListsRoute />} />
              <Route path=":listId">
                <Route index element={<WebListDetailRoute />} />
                <Route path="cards/:cardId" element={<WebCardDetailRoute />} />
              </Route>
            </Route>
            <Route path="availability" element={<WebAvailabilityRoute />} />
            <Route path="accounts">
              <Route index element={<Navigate to="overdue" replace />} />
              <Route path=":subTab" element={<WebAccountsRoute />} />
            </Route>
            <Route path="*" element={<Navigate to="/web" replace />} />
          </Route>

          {/* ── Admin Web App ──────────────────────────────────── */}
          <Route path="admin" element={<AdminApp />}>
            <Route index element={<AdminIndexRedirect />} />
            <Route path="day/:dateISO">
              <Route index element={<AdminDayRoute />} />
              <Route path="cards/:cardId" element={<AdminCardDetailRoute />} />
            </Route>
            <Route path="review">
              <Route index element={<AdminReviewQueueRoute />} />
              <Route path=":listId" element={<AdminReviewRoute />} />
            </Route>
            <Route path="invoices">
              <Route index element={<AdminInvoicesRoute />} />
              <Route path=":invoiceId" element={<AdminInvoicesRoute />} />
            </Route>
            <Route path="billing" element={<AdminBillingRoute />} />
            <Route path="integrations" element={<AdminIntegrationsRoute />} />
            <Route path="masters" element={<AdminMastersRoute />} />
            <Route path="audit" element={<AdminAuditRoute />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>

          {/* ── Anaesthetist Mobile App ────────────────────────── */}
          <Route path="mobile" element={<MobileApp />}>
            <Route index element={<Navigate to="lists" replace />} />
            {/* One splat route, not sibling routes per layer: the slide stack
                keeps every layer mounted so push AND pop animate. */}
            <Route path="lists/*" element={<MobileListsRoute />} />
            <Route path="availability" element={<MobileAvailabilityRoute />} />
            <Route path="balances" element={<MobileBalancesRoute />} />
            <Route path="more" element={<MobileMoreRoute />} />
            <Route path="*" element={<Navigate to="/mobile" replace />} />
          </Route>

          <Route path="demo/control" element={<DemoControlPanel />} />
          <Route path="demo/xero" element={<DemoXero />} />
          <Route path="demo/integrations" element={<DemoIntegrations />} />
          <Route path="demo/data" element={<DemoData />} />
          <Route path="*" element={<RootRedirect />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
