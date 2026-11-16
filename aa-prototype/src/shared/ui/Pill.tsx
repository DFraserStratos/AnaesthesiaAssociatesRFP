/**
 * Small pills on the Design Language's tint and on-tint pairs: neutral for
 * labels such as a Party's kind, a Contract's tags or an RVG group's anatomy
 * heading, success for an Active Contract or a preferred pairing, warning for
 * something to check, error for a strong flag. Never crimson, and never the
 * teal action tint, so no pill reads as a button. (Moved here from Admin's
 * MasterPills in catch-up Phase 19 so the shared capture picker can use it.)
 *
 * UI unification U3 (README group U04) made it the one label pill:
 * - `tone` neutral, success, warning or error (the semantic triples only);
 * - `size` sm (`0 7px` 11/16), md (`1px 8px` 11.5/18, the inline size, the
 *   default) or lg (`4px 10px` 11/600, the Admin Review mockup's table and flag
 *   pill; question 16);
 * - `variant` tint (the default) or outline (a white pill ringed in the tone's
 *   solid at full alpha, for a marker such as "Changed" or "Not preferred");
 * - `leading` an icon or dot before the words; `mono` for figures; `title` for
 *   an abbreviated word; `shot` and any `data-*` attribute land on the span.
 * A passive span with no role (question 3). The six status colours are not
 * pill tones: they are `StatusChip`'s job.
 */

import type { CSSProperties, ReactNode } from 'react'
import { fontFamily, neutral, radius, semantic } from '../../theme/tokens'

export type PillTone = 'neutral' | 'success' | 'warning' | 'error'
export type PillSize = 'sm' | 'md' | 'lg'
export type PillVariant = 'tint' | 'outline'

/** Each tone's tint, on-tint text and solid (the outline's ring). Neutral's ring is mist, as a cleared warning's was. */
export const PILL_TONES: Record<PillTone, { tint: string; onTint: string; solid: string }> = {
  neutral: { tint: neutral.sunken, onTint: neutral.slate, solid: neutral.mist },
  success: semantic.success,
  /** Something to check, never a block (catch-up Phase 21: a payer with no contact, a child payer). */
  warning: semantic.warning,
  error: semantic.error,
}

export const PILL_SIZES: Record<PillSize, CSSProperties> = {
  sm: { padding: '0 7px', fontSize: 11, lineHeight: '16px' },
  md: { padding: '1px 8px', fontSize: 11.5, lineHeight: '18px' },
  lg: { padding: '4px 10px', fontSize: 11, lineHeight: '16px' },
}

const BASE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: radius.pill,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

type DataAttributes = { [key: `data-${string}`]: string | number | boolean | undefined }

export type PillProps = {
  tone?: PillTone
  size?: PillSize
  variant?: PillVariant
  leading?: ReactNode
  mono?: boolean
  title?: string
  shot?: string
  /** Layout only (flex, margin, tracking): never a colour, padding or size of its own. */
  style?: CSSProperties
  children: ReactNode
} & DataAttributes

export function Pill({ tone = 'neutral', size = 'md', variant = 'tint', leading, mono = false, title, shot, style, children, ...data }: PillProps) {
  const t = PILL_TONES[tone]
  const look: CSSProperties =
    variant === 'outline'
      ? { background: neutral.surface, color: t.onTint, border: `1px solid ${t.solid}` }
      : { background: t.tint, color: t.onTint }
  const figures: CSSProperties = mono ? { fontFamily: fontFamily.mono, fontVariantNumeric: 'tabular-nums' } : {}
  const gap: CSSProperties = leading === undefined ? {} : { gap: 5 }
  return (
    <span {...data} data-shot={shot} title={title} style={{ ...BASE, ...gap, ...PILL_SIZES[size], ...look, ...figures, ...style }}>
      {leading}
      {children}
    </span>
  )
}
