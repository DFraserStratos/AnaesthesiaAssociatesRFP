import { useEffect } from 'react'
import { SyntheticDataBadge } from '../shared/SyntheticDataBadge'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { APP_CONFIG, appIdForPath, officePersona, PERSONAS, type AppId } from './appConfig'
import { AppSwitcher } from './AppSwitcher'
import { DemoActionsMenu } from './DemoActionsMenu'
import { DemoClockMenu } from './DemoClockMenu'
import { DemoResetButton } from './DemoResetButton'
import { ListsBadgeModeToggle } from './ListsBadgeModeToggle'
import { PersonaChip } from '../shared/PersonaChip'
import { ScaleBanner } from '../shared/scale/ScaleBanner'
import { neutral, radius } from '../theme/tokens'

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
  const currentApp = useAppStore((s) => s.shell.currentApp)
  const setCurrentApp = useAppStore((s) => s.setCurrentApp)

  const routeApp = appIdForPath(location.pathname)
  const activeApp: AppId = routeApp ?? currentApp

  // Keep the store (persona + persisted last-app) in step with the route.
  useEffect(() => {
    if (routeApp && routeApp !== currentApp) setCurrentApp(routeApp)
  }, [routeApp, currentApp, setCurrentApp])

  const officeUser = useAppStore((s) => s.shell.officeUser)
  // The office persona follows Switch office user (catch-up Phase 35).
  const persona = APP_CONFIG[activeApp].persona === PERSONAS.kirsty ? officePersona(officeUser) : APP_CONFIG[activeApp].persona

  function handleSelect(id: AppId) {
    setCurrentApp(id)
    navigate(APP_CONFIG[id].path)
  }

  return (
    // `100dvh`, not `100vh`: `vh` is the LARGE viewport, so in a mobile browser
    // tab the shell is 60 to 100px taller than what is visible and the mobile
    // tab bar sits below the fold. Harmless on desktop; this is the pre-install
    // case, for anyone who opens the framed prototype on a phone.
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Harness bar ─────────────────────────────────────── */}
      <header
        className="aa-harness"
        style={{
          flex: 'none',
          // Lifted above an open dialog's fixed scrim (catch-up Phase 40a) and the support panel's (43b's `underHarness`) by global.css's `.aa-harness` rule, and only then: drawers keep covering it as before.
          position: 'relative',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '0 16px',
          background: neutral.ink,
          color: neutral.surface,
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
              borderRadius: radius.pill,
              padding: '2px 8px',
              flex: 'none',
            }}
          >
            Prototype
          </span>
          {/* Catch-up Phase 43 (US-15.0.6): the environment holds synthetic data only. */}
          <SyntheticDataBadge tone="onInk" />
          {/* The local Requirements Board (requirements-board/). Shown only when the repo-root
              `npm run dev` launched both apps and set VITE_REQUIREMENTS_URL, so a presenter running
              the prototype on its own for a vendor workshop never sees it. Never in a build. */}
          {import.meta.env.DEV && import.meta.env.VITE_REQUIREMENTS_URL && (
            <a
              href={import.meta.env.VITE_REQUIREMENTS_URL}
              target="_blank"
              rel="noreferrer"
              title="Open the Requirements Board (local dev tool)"
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                flex: 'none',
              }}
            >
              Requirements ↗
            </a>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Demo only (OQ-151): how the Admin side nav's Lists badge counts, shown while on the Lists section. */}
          {location.pathname.startsWith('/admin/lists') && <ListsBadgeModeToggle />}
          <PersonaChip persona={persona} size={28} gap={8} />
          <AppSwitcher activeApp={activeApp} onSelect={handleSelect} />
          <DemoActionsMenu />
          <DemoClockMenu />
          <DemoResetButton />
        </div>
      </header>

      {/* The full-scale data's banner (catch-up Phase 43): harness chrome, only while generating or loaded. */}
      <ScaleBanner />

      {/* ── Routed app ──────────────────────────────────────── */}
      {/* The modal scope (U2): an open dialog makes the app inert, never the harness bar. */}
      <main data-aa-modal-scope style={{ flex: 1, minHeight: 0, overflow: 'auto', background: neutral.bg }}>
        <Outlet />
      </main>
    </div>
  )
}
