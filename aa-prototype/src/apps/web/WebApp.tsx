import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAnaesthetistPersona } from '../../shell/anaesthetistUser'
import { neutral } from '../../theme/tokens'
import { signInRefusal, useAppStore, useToday, type Actor } from '../../store'
import { SurfaceProvider } from '../../shared'
import { EmptyState } from '../../shared/ui'
import { MoveListPromptProvider } from '../../shared/flows/MoveListPrompt'
import { SupportSidePanel } from '../../shared/support'
import { WebNav, type WebTab } from './components'
import type { WebOutletContext } from './outlet'

/** Nav-tab ↔ route mapping (the URL is the source of truth for the active tab). */
const TAB_PATH: Record<WebTab, string> = {
  dashboard: '/web',
  lists: '/web/lists',
  availability: '/web/availability',
  accounts: '/web/accounts',
}

function tabForPath(pathname: string): WebTab | null {
  if (pathname.startsWith('/web/profile')) return null
  if (pathname.startsWith('/web/lists')) return 'lists'
  if (pathname.startsWith('/web/availability')) return 'availability'
  if (pathname.startsWith('/web/accounts')) return 'accounts'
  return 'dashboard'
}

/**
 * Anaesthetist Web App (Phase 05) — the desktop twin of the mobile app for
 * Dr Souter. This is the app's LAYOUT: the top nav, the max-width container and
 * the persona actor; the screens themselves are router sub-routes
 * (`/web`, `/web/lists/:listId/bookings/:bookingId`, `/web/accounts/:subTab` …) so a
 * refresh, the back button and a shared URL all land on the same screen
 * (Decisions log 2026-07-27, reversing the 2026-07-23 app-owned-nav ruling).
 * Wrapped in `<SurfaceProvider variant="web">` so every shared flow / capture
 * sheet / booking body renders as a centred dialog. Every read is view-scoped to
 * Souter (A8); there are no authorise controls anywhere.
 */
export function WebApp() {
  // Dr Souter, or the anaesthetist the harness bar's "Signed in as" chose.
  const persona = useAnaesthetistPersona()
  const anaesthetistId = persona.anaesthetistId ?? '34821'
  const actor: Actor = useMemo(
    () => ({ who: persona.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId }),
    [persona, anaesthetistId],
  )
  const todayISO = useToday()
  const noLongerActive = useAppStore((s) => signInRefusal(s, anaesthetistId))
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // The support panel (catch-up Phase 43b): Help in the top nav opens it over any screen.
  const [helpOpen, setHelpOpen] = useState(false)

  const context: WebOutletContext = useMemo(
    () => ({ anaesthetistId, personaName: persona.name, actor, todayISO }),
    [anaesthetistId, persona.name, actor, todayISO],
  )

  return (
    <SurfaceProvider variant="web">
      <div style={{ minHeight: '100%', minWidth: 1240, background: neutral.bg, color: neutral.ink }}>
        <WebNav
          tab={tabForPath(pathname)}
          onTab={(next) => navigate(TAB_PATH[next])}
          personaName={persona.name}
          initials={persona.initials}
          profileActive={pathname.startsWith('/web/profile')}
          onProfile={() => navigate('/web/profile')}
          onHelp={() => setHelpOpen(true)}
        />
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '28px 32px 48px' }}>
          {noLongerActive !== null ? (
            // Phase 52 (DM-07): the web app has no sign-in, so an inactive persona sees this page in place of the screens.
            <EmptyState variant="card" title="You are no longer active with AA" shot="web-no-longer-active" style={{ maxWidth: 560 }}>
              Your last day has passed, so your Lists, Bookings and balances are no longer shown here. The AA office sends
              remittances for earlier work by email. If this is wrong, contact the office.
            </EmptyState>
          ) : (
            <MoveListPromptProvider actor={actor}>
              <Outlet context={context} />
            </MoveListPromptProvider>
          )}
        </div>
      </div>
      <SupportSidePanel open={helpOpen} onClose={() => setHelpOpen(false)} actor={actor} app="web" />
    </SurfaceProvider>
  )
}
