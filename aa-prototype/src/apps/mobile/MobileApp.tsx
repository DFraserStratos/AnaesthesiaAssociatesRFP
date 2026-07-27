import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { List as ListIcon, LayoutGrid, CircleDollarSign, MoreHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PhoneFrame } from '../../shell/PhoneFrame'
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
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        padding: '10px 8px 26px',
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
 */
export function MobileApp() {
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
    }),
    [actor, anaesthetistId, persona],
  )

  // The List and Card layers are full-bleed (the mockup): the tab bar only shows
  // at the base of the Lists stack and on the other three tabs.
  const showTabBar = listsStackLocation(pathname).depth === 0

  return (
    <SurfaceProvider variant="mobile">
      <PhoneFrame>
      {/* Transparent root: the PhoneFrame AtmosphereLayer shows through for
          Availability / Balances / More and the Lists base (Phase 13). */}
      <div style={{ height: '100%', position: 'relative', overflow: 'hidden', background: 'transparent', color: neutral.ink }}>
        <Outlet context={context} />

        {showTabBar && (
          <BottomTabBar active={mobileTabForPath(pathname)} onSelect={(tab) => navigate(MOBILE_TAB_PATH[tab])} />
        )}
      </div>
      </PhoneFrame>
    </SurfaceProvider>
  )
}
