import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { APP_CONFIG } from '../../shell/appConfig'
import { neutral } from '../../theme/tokens'
import { useToday, type Actor } from '../../store'
import { SurfaceProvider } from '../../shared'
import { RequestCoverSheet } from '../../shared/flows'
import { WebNav, type WebTab } from './components'
import type { WebOutletContext } from './outlet'
import type { CoverTarget } from './types'

/** Nav-tab ↔ route mapping (the URL is the source of truth for the active tab). */
const TAB_PATH: Record<WebTab, string> = {
  dashboard: '/web',
  lists: '/web/lists',
  availability: '/web/availability',
  accounts: '/web/accounts',
}

function tabForPath(pathname: string): WebTab {
  if (pathname.startsWith('/web/lists')) return 'lists'
  if (pathname.startsWith('/web/availability')) return 'availability'
  if (pathname.startsWith('/web/accounts')) return 'accounts'
  return 'dashboard'
}

/**
 * Anaesthetist Web App (Phase 05) — the desktop twin of the mobile app for
 * Dr Souter. This is the app's LAYOUT: the top nav, the max-width container and
 * the persona actor; the screens themselves are router sub-routes
 * (`/web`, `/web/lists/:listId/cards/:cardId`, `/web/accounts/:subTab` …) so a
 * refresh, the back button and a shared URL all land on the same screen
 * (Decisions log 2026-07-27, reversing the 2026-07-23 app-owned-nav ruling).
 * Wrapped in `<SurfaceProvider variant="web">` so every shared flow / capture
 * sheet / card body renders as a centred dialog. Every read is view-scoped to
 * Souter (A8); there are no authorise controls anywhere.
 *
 * The cover dialog stays local state: a sheet in the URL would make Back close
 * the sheet instead of going back a screen.
 */
export function WebApp() {
  const persona = APP_CONFIG.web.persona
  const anaesthetistId = persona.anaesthetistId ?? '34821'
  const actor: Actor = useMemo(
    () => ({ who: persona.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId }),
    [persona, anaesthetistId],
  )
  const todayISO = useToday()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [cover, setCover] = useState<CoverTarget | null>(null)

  const context: WebOutletContext = useMemo(
    () => ({ anaesthetistId, personaName: persona.name, actor, todayISO, onCover: setCover }),
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
        />
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '28px 32px 48px' }}>
          <Outlet context={context} />
        </div>
      </div>

      {cover !== null && (
        <RequestCoverSheet
          open
          listId={cover.listId}
          actor={actor}
          kind={cover.kind}
          personName={cover.personName}
          slotLabel={cover.slotLabel}
          {...(cover.targetAnaesthetistId !== undefined ? { targetAnaesthetistId: cover.targetAnaesthetistId } : {})}
          onClose={() => setCover(null)}
          onSent={() => undefined}
        />
      )}
    </SurfaceProvider>
  )
}
