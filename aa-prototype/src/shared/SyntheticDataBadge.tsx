/**
 * "Synthetic data only" (catch-up Phase 43; US-15.0.6, non-production
 * environments): an environment marker in every shell. Neutral, never crimson,
 * teal or the demo warning tint: it states a property of the environment, it
 * marks no simulated control. A shared `Pill`: `onInk` on the dark harness bar
 * and admin side nav, `onLight` (the neutral outline) on the web nav and the
 * mobile More card.
 */

import { ShieldCheck } from 'lucide-react'
import { Pill } from './ui/Pill'

export const SYNTHETIC_DATA_LABEL = 'Synthetic data only'
export const SYNTHETIC_DATA_TOOLTIP = 'Every patient, NHI, List and figure here is synthetic. Environments other than production hold synthetic data only.'

export function SyntheticDataBadge({ tone }: { tone: 'onInk' | 'onLight' }) {
  return (
    <Pill
      variant={tone === 'onInk' ? 'onInk' : 'outline'}
      tone="neutral"
      size="sm"
      shot="synthetic-data-badge"
      title={SYNTHETIC_DATA_TOOLTIP}
      ariaLabel={SYNTHETIC_DATA_LABEL}
      leading={<ShieldCheck size={12} aria-hidden />}
      style={{ flex: 'none' }}
    >
      {SYNTHETIC_DATA_LABEL}
    </Pill>
  )
}
