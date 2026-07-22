import type { CSSProperties } from 'react'
import { FlaskConical } from 'lucide-react'
import { semantic } from '../theme/tokens'

interface DemoBadgeProps {
  /** Override the label (default "Demo simulation"). */
  label?: string
  style?: CSSProperties
}

/**
 * The "demo simulation" badge (PROGRESS convention 13). Marks demo-only
 * surfaces — the Xero sim, integration simulator, control panel and the billing
 * monitor's simulation triggers — so a demo audience never mistakes them for
 * proposed product UI. Uses the semantic warning tint (attention, not error).
 */
export function DemoBadge({ label = 'Demo simulation', style }: DemoBadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: semantic.warning.tint,
        color: semantic.warning.onTint,
        border: `1px solid ${semantic.warning.solid}33`,
        borderRadius: 999,
        padding: '4px 10px',
        fontSize: 11,
        lineHeight: '14px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        ...style,
      }}
    >
      <FlaskConical size={13} strokeWidth={2} aria-hidden />
      {label}
    </span>
  )
}
