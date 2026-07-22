import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useShellStore } from '../store/shellStore'
import { APP_CONFIG, appIdForPath, type AppId } from './appConfig'
import { AppSwitcher } from './AppSwitcher'
import { neutral, brand } from '../theme/tokens'

/**
 * The persistent demo harness. A slim top bar carries the product name, the
 * active persona, and the app-switcher; the routed app renders below it. The
 * bar is prototype chrome — each app supplies its own product nav inside.
 *
 * The URL is the source of truth for which app is shown; this shell mirrors it
 * into the store so the persona follows and a refresh returns to the same app.
 */
export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentApp = useShellStore((s) => s.currentApp)
  const setCurrentApp = useShellStore((s) => s.setCurrentApp)

  const routeApp = appIdForPath(location.pathname)
  const activeApp: AppId = routeApp ?? currentApp

  // Keep the store (persona + persisted last-app) in step with the route.
  useEffect(() => {
    if (routeApp && routeApp !== currentApp) setCurrentApp(routeApp)
  }, [routeApp, currentApp, setCurrentApp])

  const persona = APP_CONFIG[activeApp].persona

  function handleSelect(id: AppId) {
    setCurrentApp(id)
    navigate(APP_CONFIG[id].path)
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Harness bar ─────────────────────────────────────── */}
      <header
        style={{
          flex: 'none',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '0 16px',
          background: neutral.ink,
          color: '#FFFFFF',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>AA Booking &amp; Billing</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 999,
              padding: '2px 8px',
              flex: 'none',
            }}
          >
            Prototype
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              aria-hidden
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background: brand.tint,
                color: brand.base,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                flex: 'none',
              }}
            >
              {persona.initials}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{persona.name}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{persona.role}</span>
            </span>
          </div>
          <AppSwitcher activeApp={activeApp} onSelect={handleSelect} />
        </div>
      </header>

      {/* ── Routed app ──────────────────────────────────────── */}
      <main style={{ flex: 1, minHeight: 0, overflow: 'auto', background: neutral.bg }}>
        <Outlet />
      </main>
    </div>
  )
}
