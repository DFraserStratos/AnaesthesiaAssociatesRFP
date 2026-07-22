import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './shell/AppShell'
import { MobileApp } from './apps/mobile/MobileApp'
import { WebApp } from './apps/web/WebApp'
import { AdminApp } from './apps/admin/AdminApp'
import { DemoControlPanel } from './apps/demo/DemoControlPanel'
import { DemoXero } from './apps/demo/DemoXero'
import { DemoIntegrations } from './apps/demo/DemoIntegrations'
import { useShellStore } from './store/shellStore'
import { APP_CONFIG } from './shell/appConfig'

/** Redirect the bare route (and unknown routes) to the last-selected app. */
function RootRedirect() {
  const currentApp = useShellStore((s) => s.currentApp)
  return <Navigate to={APP_CONFIG[currentApp].path} replace />
}

export function AppRouter() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<RootRedirect />} />
          <Route path="mobile" element={<MobileApp />} />
          <Route path="web" element={<WebApp />} />
          <Route path="admin" element={<AdminApp />} />
          <Route path="demo/control" element={<DemoControlPanel />} />
          <Route path="demo/xero" element={<DemoXero />} />
          <Route path="demo/integrations" element={<DemoIntegrations />} />
          <Route path="*" element={<RootRedirect />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
