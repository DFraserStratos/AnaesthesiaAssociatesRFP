/**
 * Small pills for Master data (catch-up Phase 18), on the Design Language's
 * tint and on-tint pairs: neutral for labels such as a Party's kind or a
 * Contract's tags, success for an Active Contract. Never crimson, and never
 * the teal action tint, so no pill reads as a button.
 */

import type { CSSProperties, ReactNode } from 'react'
import { neutral, radius, semantic } from '../../../theme/tokens'

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

export type PillTone = 'neutral' | 'success'

const TONES: Record<PillTone, { background: string; color: string }> = {
  neutral: { background: neutral.sunken, color: neutral.slate },
  success: { background: semantic.success.tint, color: semantic.success.onTint },
}

export function Pill({ tone = 'neutral', children, shot }: { tone?: PillTone; children: ReactNode; shot?: string }) {
  return (
    <span data-shot={shot} style={{ ...PILL, ...TONES[tone] }}>
      {children}
    </span>
  )
}
