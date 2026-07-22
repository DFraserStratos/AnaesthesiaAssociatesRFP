import { List, LayoutGrid, CircleDollarSign, MoreHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PhoneFrame } from '../../shell/PhoneFrame'
import { Placeholder } from '../Placeholder'
import { neutral, brand, accent } from '../../theme/tokens'

interface Tab {
  label: string
  icon: LucideIcon
}

/** Bottom tab bar per `Mobile App.dc.html` (Lists · Availability · Balances · More). */
const TABS: readonly Tab[] = [
  { label: 'Lists', icon: List },
  { label: 'Availability', icon: LayoutGrid },
  { label: 'Balances', icon: CircleDollarSign },
  { label: 'More', icon: MoreHorizontal },
]

function BottomTabBar() {
  return (
    <div
      style={{
        flex: 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        padding: '10px 8px 26px',
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(14px)',
        borderTop: `1px solid ${neutral.line}`,
      }}
    >
      {TABS.map((tab, i) => {
        const activeTab = i === 0
        const Icon = tab.icon
        return (
          <div
            key={tab.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '4px 0',
              color: activeTab ? accent.base : neutral.mist,
            }}
          >
            <Icon size={22} strokeWidth={2} aria-hidden />
            <span style={{ fontSize: 11, fontWeight: 600 }}>{tab.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Anaesthetist mobile app — the shell only. Renders inside the phone frame with
 * the bottom tab bar and a greeting header matching `Mobile App.dc.html`. The
 * schedule, list cards and BTM capture arrive in Phases 03 to 04.
 */
export function MobileApp() {
  return (
    <PhoneFrame>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: neutral.bg,
          color: neutral.ink,
        }}
      >
        <div style={{ flex: 1, overflow: 'auto', padding: '64px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: neutral.mist,
                  textTransform: 'uppercase',
                }}
              >
                Tuesday 21 July
              </div>
              <div style={{ fontSize: 26, lineHeight: '32px', fontWeight: 700, letterSpacing: '-0.015em', marginTop: 2 }}>
                Kia ora, Dr Souter
              </div>
            </div>
            <span
              aria-hidden
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: brand.tint,
                color: brand.base,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                fontWeight: 700,
                flex: 'none',
              }}
            >
              MS
            </span>
          </div>

          <div style={{ marginTop: 20 }}>
            <Placeholder title="Forward lists" phase="Phase 03" compact>
              Your schedule of forward lists, the list card stack and the BTM capture flow are built
              in Phases 03 to 04. This screen is the shell only.
            </Placeholder>
          </div>
        </div>

        <BottomTabBar />
      </div>
    </PhoneFrame>
  )
}
