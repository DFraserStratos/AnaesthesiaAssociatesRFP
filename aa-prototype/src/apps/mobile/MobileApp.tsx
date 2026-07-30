import { useMemo, type ComponentType, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { List as ListIcon, LayoutGrid, CircleDollarSign, MoreHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { APP_CONFIG } from '../../shell/appConfig'
import { neutral, accent } from '../../theme/tokens'
import { type Actor } from '../../store'
import { SurfaceProvider } from '../../shared'
import { listsStackLocation, mobileTabForPath, MOBILE_TAB_PATH, type MobileTab } from './navigation'
import type { MobileOutletContext } from './outlet'

interface TabDef {
  key: MobileTab
  label: string
  icon: LucideIcon
}

const TABS: readonly TabDef[] = [
  { key: 'lists', label: 'Lists', icon: ListIcon },
  { key: 'availability', label: 'Availability', icon: LayoutGrid },
  { key: 'balances', label: 'Balances', icon: CircleDollarSign },
  { key: 'more', label: 'More', icon: MoreHorizontal },
]

function BottomTabBar({ active, onSelect }: { active: MobileTab; onSelect: (tab: MobileTab) => void }) {
  return (
    <div
      data-testid="mobile-tab-bar"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        paddingTop: 10,
        paddingLeft: 8,
        paddingRight: 8,
        // 26 = 34 - 8: the deliberate overlap that reuses the home indicator's
        // own 8px bottom padding, so the 11px labels sit exactly above the
        // pill rather than a row clear of it. The 10px floor is the bar's own
        // TOP pad, so a zero-inset device (Android gesture nav off, desktop)
        // gets a symmetric box instead of a negative collapse.
        paddingBottom: 'max(calc(var(--aa-inset-bottom, 34px) - 8px), 10px)',
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(14px)',
        borderTop: `1px solid ${neutral.line}`,
      }}
    >
      {TABS.map((tab) => {
        const on = tab.key === active
        const Icon = tab.icon
        return (
          <button
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '4px 0',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: on ? accent.base : neutral.mist,
            }}
          >
            <Icon size={22} strokeWidth={2} aria-hidden />
            <span style={{ fontSize: 11, fontWeight: 600 }}>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * Anaesthetist mobile app (Phase 03). This is the app's LAYOUT: the phone frame,
 * the persona actor and the bottom tab bar; each tab is a router sub-route
 * (`/mobile/lists`, `/mobile/availability`, `/mobile/balances`, `/mobile/more`)
 * so a refresh and the back button both hold their place (Decisions log
 * 2026-07-27).
 *
 * The Lists tab is a SINGLE route hosting the depth-driven slide stack rather
 * than sibling routes per layer — see `navigation.ts` and `routes.tsx`. Every
 * read is view-scoped to Dr Souter's own lists (A8); every write goes through the
 * Phase 02/03 store guards as the Souter actor.
 *
 * `host` is the mounting surface, and it is REQUIRED rather than defaulted to
 * `PhoneFrame`. That is what lets the installable PWA target tree-shake the
 * frame — and through it the 497-line Gradient Lab and the presenter zoom
 * control — out of its bundle entirely. The prototype router passes
 * `PhoneFrame`; the PWA entry passes `MobileViewport`. Whichever it is, the
 * host owes this app two things: a `position: relative` box for the absolutely
 * positioned sheets and docks, and the four `--aa-inset-*` custom properties
 * (see the inset contract in `theme/global.css`).
 */
export function MobileApp({
  host: Host,
  moreExtra,
}: {
  host: ComponentType<{ children: ReactNode }>
  /** Host-supplied presenter controls for the More tab (the PWA's; see `outlet.ts`). */
  moreExtra?: ReactNode
}) {
  const persona = APP_CONFIG.mobile.persona
  const anaesthetistId = persona.anaesthetistId ?? '34821'
  const actor: Actor = useMemo(
    () => ({ who: persona.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId }),
    [persona, anaesthetistId],
  )
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const context: MobileOutletContext = useMemo(
    () => ({
      actor,
      anaesthetistId,
      personaName: persona.name,
      personaRole: persona.role,
      initials: persona.initials,
      moreExtra,
    }),
    [actor, anaesthetistId, persona, moreExtra],
  )

  // The List and Card layers are full-bleed (the mockup): the tab bar only shows
  // at the base of the Lists stack and on the other three tabs.
  const showTabBar = listsStackLocation(pathname).depth === 0

  return (
    <SurfaceProvider variant="mobile">
      <Host>
      {/* Transparent root: the host's AtmosphereLayer shows through for
          Availability / Balances / More and the Lists base (Phase 13). */}
      <div
        data-aa-mobile-product
        style={{ height: '100%', position: 'relative', overflow: 'hidden', background: 'transparent', color: neutral.ink }}
      >
        <Outlet context={context} />

        {showTabBar && (
          <BottomTabBar active={mobileTabForPath(pathname)} onSelect={(tab) => navigate(MOBILE_TAB_PATH[tab])} />
        )}
      </div>
      </Host>
    </SurfaceProvider>
  )
}
