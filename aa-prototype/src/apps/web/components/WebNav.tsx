import { Logo } from '../../../shared'
import { brand, neutral } from '../../../theme/tokens'

export type WebTab = 'dashboard' | 'lists' | 'availability' | 'accounts'

const TABS: { key: WebTab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'lists', label: 'Lists' },
  { key: 'availability', label: 'Availability' },
  { key: 'accounts', label: 'Accounts' },
]

interface WebNavProps {
  tab: WebTab
  onTab: (tab: WebTab) => void
  personaName: string
  initials: string
}

/**
 * The web app's white top-nav (Web Dashboard / Web Availability mockups): the
 * AA wordmark (the `Logo` image — identity, per CLAUDE.md's "use the Logo
 * component, not re-typeset text" rule and the 2026-07-22 Decisions entry), the
 * four nav tabs with the crimson active underline (now clickable), and the
 * persona name + crimson-tint MS avatar. Crimson is identity only.
 */
export function WebNav({ tab, onTab, personaName, initials }: WebNavProps) {
  return (
    <div style={{ background: neutral.surface, borderBottom: `1px solid ${neutral.line}` }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', gap: 32 }}>
        <Logo height={24} />

        <nav style={{ display: 'flex', gap: 4, height: '100%', alignItems: 'stretch', flex: 1 }}>
          {TABS.map((t) => {
            const active = t.key === tab
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onTab(t.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 14px',
                  border: 'none',
                  background: 'none',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  color: active ? neutral.ink : neutral.slate,
                  boxShadow: active ? `inset 0 -3px 0 ${brand.base}` : 'none',
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: neutral.slate }}>{personaName}</span>
          <span
            aria-hidden
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: brand.tint,
              color: brand.base,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {initials}
          </span>
        </div>
      </div>
    </div>
  )
}
