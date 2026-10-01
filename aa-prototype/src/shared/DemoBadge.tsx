import type { CSSProperties } from 'react'
import { FlaskConical, Telescope } from 'lucide-react'
import { neutral, semantic } from '../theme/tokens'

interface DemoBadgeProps {
  /** Override the label (default "Demo simulation"). */
  label?: string
  /**
   * `demo` (default): the amber demo-only badge. `future`: neutral sunken and
   * slate, for tooling the catalogue marks Future scope (catch-up Phase 14).
   */
  tone?: 'demo' | 'future'
  style?: CSSProperties
}

/**
 * The "demo simulation" badge (PROGRESS convention 13). Marks demo-only
 * surfaces — the Xero sim, integration simulator, control panel, the harness
 * bar's Demo actions menu, the PWA's Demo sheet and the billing monitor's
 * simulation triggers — so a demo audience never mistakes them for proposed
 * product UI. Uses the semantic warning tint (attention, not error). The
 * `future` tone marks what is shown but out of the current scope.
 */
export function DemoBadge({ label, tone = 'demo', style }: DemoBadgeProps) {
  const future = tone === 'future'
  const Icon = future ? Telescope : FlaskConical
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: future ? neutral.sunken : semantic.warning.tint,
        color: future ? neutral.slate : semantic.warning.onTint,
        border: future ? `1px solid ${neutral.lineStrong}` : `1px solid ${semantic.warning.solid}33`,
        borderRadius: 999,
        padding: '4px 10px',
        fontSize: 11,
        lineHeight: '14px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <Icon size={13} strokeWidth={2} aria-hidden />
      {label ?? (future ? 'Future scope' : 'Demo simulation')}
    </span>
  )
}
