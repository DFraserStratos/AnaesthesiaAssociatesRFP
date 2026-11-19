import type { CSSProperties } from 'react'
import { FlaskConical, Telescope } from 'lucide-react'
import { neutral, semantic, radius } from '../theme/tokens'

interface DemoBadgeProps {
  /** Override the label (default "Demo simulation"). */
  label?: string
  /**
   * `demo` (default): the amber demo-only badge. `future`: neutral sunken and
   * slate, for tooling the catalogue marks Future scope (catch-up Phase 14).
   */
  tone?: 'demo' | 'future'
  /**
   * `badge` (default): the short uppercase pill. `notice`: a sentence-length
   * demo note in the same tint, in sentence case and wrapping (Seed load and
   * the go-live load, catch-up Phase 42).
   */
  variant?: 'badge' | 'notice'
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
export function DemoBadge({ label, tone = 'demo', variant = 'badge', style }: DemoBadgeProps) {
  const future = tone === 'future'
  const notice = variant === 'notice'
  const Icon = future ? Telescope : FlaskConical
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: notice ? 'flex-start' : 'center',
        gap: notice ? 8 : 6,
        background: future ? neutral.sunken : semantic.warning.tint,
        color: future ? neutral.slate : semantic.warning.onTint,
        border: future ? `1px solid ${neutral.lineStrong}` : `1px solid ${semantic.warning.solid}33`,
        borderRadius: notice ? radius.sm : radius.pill,
        padding: notice ? '7px 12px' : '4px 10px',
        fontSize: notice ? 12.5 : 11,
        lineHeight: notice ? '18px' : '14px',
        fontWeight: notice ? 500 : 600,
        letterSpacing: notice ? 0 : '0.06em',
        textTransform: notice ? 'none' : 'uppercase',
        whiteSpace: notice ? 'normal' : 'nowrap',
        ...style,
      }}
    >
      <Icon size={13} strokeWidth={2} aria-hidden style={notice ? { flex: 'none', marginTop: 2.5 } : undefined} />
      {label ?? (future ? 'Future scope' : 'Demo simulation')}
    </span>
  )
}
