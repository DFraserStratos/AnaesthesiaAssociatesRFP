/**
 * Small pills on the Design Language's tint and on-tint pairs: neutral for
 * labels such as a Party's kind, a Contract's tags or an RVG group's anatomy
 * heading, success for an Active Contract. Never crimson, and never the teal
 * action tint, so no pill reads as a button. (Moved here from Admin's
 * MasterPills in catch-up Phase 19 so the shared capture picker can use it.)
 */

import type { CSSProperties, ReactNode } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'

const PILL: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '1px 8px',
  borderRadius: radius.pill,
  fontSize: 11.5,
  fontWeight: 600,
  lineHeight: '18px',
  whiteSpace: 'nowrap',
}

export type PillTone = 'neutral' | 'success' | 'warning'

const TONES: Record<PillTone, { background: string; color: string }> = {
  neutral: { background: neutral.sunken, color: neutral.slate },
  success: { background: semantic.success.tint, color: semantic.success.onTint },
  /** Something to check, never a block (catch-up Phase 21: a payer with no contact, a child payer). */
  warning: { background: semantic.warning.tint, color: semantic.warning.onTint },
}

export function Pill({ tone = 'neutral', children, shot, size = 'default' }: { tone?: PillTone; children: ReactNode; shot?: string; size?: 'default' | 'small' }) {
  const small = size === 'small' ? { fontSize: 11, lineHeight: '16px', padding: '0 7px' } : {}
  return (
    <span data-shot={shot} style={{ ...PILL, ...small, ...TONES[tone] }}>
      {children}
    </span>
  )
}
