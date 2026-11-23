import { Avatar, Logo } from '../../../shared'
import { SyntheticDataBadge } from '../../../shared/SyntheticDataBadge'
import { brand, neutral } from '../../../theme/tokens'
import { TextAction } from '../../../shared/ui'

export type WebTab = 'dashboard' | 'lists' | 'availability' | 'accounts'

const TABS: { key: WebTab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'lists', label: 'Lists' },
  { key: 'availability', label: 'Availability' },
  { key: 'accounts', label: 'Accounts' },
]

interface WebNavProps {
  /** The active tab, or null on the profile page (no tab is underlined there). */
  tab: WebTab | null
  onTab: (tab: WebTab) => void
  personaName: string
  initials: string
  /** The profile page is showing (catch-up Phase 26): the persona block takes the underline. */
  profileActive: boolean
  onProfile: () => void
  /** Opens the support panel (catch-up Phase 43b; US-15.0.8). The nav shows Help only when given. */
  onHelp?: () => void
}

/**
 * The web app's white top-nav (Web Dashboard / Web Availability mockups): the
 * AA wordmark (the `Logo` image — identity, per CLAUDE.md's "use the Logo
 * component, not re-typeset text" rule and the 2026-07-22 Decisions entry), the
 * four nav tabs with the crimson active underline (now clickable), and the
 * persona name + crimson-tint MS avatar. Crimson is identity only. The persona
 * block is the button to the anaesthetist's own profile (catch-up Phase 26),
 * underlined in crimson while it shows, so the four tabs stay as designed.
 */
export function WebNav({ tab, onTab, personaName, initials, profileActive, onProfile, onHelp }: WebNavProps) {
  return (
    <div style={{ background: neutral.surface, borderBottom: `1px solid ${neutral.line}` }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', gap: 32 }}>
        <Logo height={24} />

        <nav aria-label="Main" style={{ display: 'flex', gap: 4, height: '100%', alignItems: 'stretch', flex: 1 }}>
          {TABS.map((t) => {
            const active = t.key === tab
            return (
              <button
                key={t.key}
                type="button"
                className="aa-ctl"
                aria-current={active ? 'page' : undefined}
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

        {/* Catch-up Phase 43b (US-15.0.8): Help, the support line, before the persona. */}
        {onHelp !== undefined && (
          <TextAction onClick={onHelp} shot="nav-help">
            Help
          </TextAction>
        )}

        {/* Catch-up Phase 43 (US-15.0.6): an environment marker before the persona, neutral. */}
        <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: -12 }}><SyntheticDataBadge tone="onLight" /></span>

        <button
          type="button"
          className="aa-ctl"
          aria-current={profileActive ? 'page' : undefined}
          aria-label={`Your profile, ${personaName}`}
          data-shot="web-profile-link"
          onClick={onProfile}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            height: '100%',
            padding: '0 4px',
            border: 'none',
            background: 'none',
            fontFamily: 'inherit',
            cursor: 'pointer',
            boxShadow: profileActive ? `inset 0 -3px 0 ${brand.base}` : 'none',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: profileActive ? neutral.ink : neutral.slate }}>{personaName}</span>
          <Avatar initials={initials} size={36} variant="tint" />
        </button>
      </div>
    </div>
  )
}
