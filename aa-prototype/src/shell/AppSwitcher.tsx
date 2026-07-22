import { useState } from 'react'
import {
  Smartphone,
  Monitor,
  Building2,
  Receipt,
  Cable,
  SlidersHorizontal,
  ChevronDown,
  Check,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { APP_CONFIG, APP_ORDER, type AppId } from './appConfig'
import { neutral, accent, semantic, radius, elevation } from '../theme/tokens'

const ICONS: Record<AppId, LucideIcon> = {
  mobile: Smartphone,
  web: Monitor,
  admin: Building2,
  'demo-xero': Receipt,
  'demo-integrations': Cable,
  'demo-control': SlidersHorizontal,
}

interface AppSwitcherProps {
  activeApp: AppId
  onSelect: (app: AppId) => void
}

/**
 * The app-switcher dropdown (top-right of the harness bar). Lists the three
 * apps, then a divider, then the demo-only surfaces. Selecting one routes to it
 * and sets the active persona; the choice is persisted so a refresh returns to
 * the same app (persistence lives in the shell store).
 */
export function AppSwitcher({ activeApp, onSelect }: AppSwitcherProps) {
  const [open, setOpen] = useState(false)
  const active = APP_CONFIG[activeApp]

  function choose(id: AppId) {
    setOpen(false)
    if (id !== activeApp) onSelect(id)
  }

  const apps = APP_ORDER.filter((id) => APP_CONFIG[id].group === 'apps')
  const demos = APP_ORDER.filter((id) => APP_CONFIG[id].group === 'demo')

  function renderItem(id: AppId) {
    const cfg = APP_CONFIG[id]
    const Icon = ICONS[id]
    const isActive = id === activeApp
    return (
      <button
        key={id}
        type="button"
        onClick={() => choose(id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          textAlign: 'left',
          border: 'none',
          background: isActive ? accent.tint : 'transparent',
          color: isActive ? accent.pressed : neutral.ink,
          borderRadius: radius.ctl,
          padding: '9px 10px',
          font: 'inherit',
          fontSize: 14,
          fontWeight: isActive ? 600 : 500,
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = neutral.sunken
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent'
        }}
      >
        <Icon size={17} strokeWidth={2} style={{ flex: 'none', color: isActive ? accent.base : neutral.mist }} />
        <span style={{ flex: 1 }}>{cfg.label}</span>
        {isActive && <Check size={16} strokeWidth={2.5} style={{ flex: 'none', color: accent.base }} />}
      </button>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 34,
          padding: '0 12px',
          borderRadius: radius.ctl,
          border: '1px solid rgba(255,255,255,0.22)',
          background: 'rgba(255,255,255,0.08)',
          color: '#FFFFFF',
          font: 'inherit',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {(() => {
          const Icon = ICONS[activeApp]
          return <Icon size={15} strokeWidth={2} aria-hidden />
        })()}
        <span>{active.label}</span>
        <ChevronDown
          size={15}
          strokeWidth={2.5}
          aria-hidden
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}
        />
      </button>

      {open && (
        <>
          {/* click-away backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
          />
          <div
            role="menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              zIndex: 100,
              width: 300,
              background: neutral.surface,
              border: `1px solid ${neutral.line}`,
              borderRadius: radius.panel,
              boxShadow: elevation.e3,
              padding: 8,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: neutral.mist,
                padding: '6px 10px 4px',
              }}
            >
              Apps
            </div>
            {apps.map(renderItem)}

            <div style={{ borderTop: `1px solid ${neutral.line}`, margin: '8px 4px' }} />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: semantic.warning.onTint,
                padding: '2px 10px 6px',
              }}
            >
              Demo surfaces
            </div>
            {demos.map(renderItem)}
          </div>
        </>
      )}
    </div>
  )
}
