/**
 * The pairing and tier pills (catch-up Phase 17). Admin only. Tiers are plain
 * neutral pills; a preferred pairing is a calm teal-tint pill (information,
 * not an action); a not-preferred pairing is attention in the warning family
 * (the outline style of 15a's strength pill), never error red, never crimson.
 * Every word comes from the one label set.
 */

import type { CSSProperties } from 'react'
import { PAIRING_LABELS, tierLabel } from '../../../../domain/pairingPreferences'
import type { PriorityTier } from '../../../../domain/types'
import { accent, neutral, radius, semantic } from '../../../../theme/tokens'

const PILL: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '1px 8px',
  borderRadius: radius.pill,
  fontSize: 11,
  fontWeight: 600,
  lineHeight: '16px',
  whiteSpace: 'nowrap',
}

export function TierPill({ tier }: { tier: PriorityTier }) {
  return (
    <span data-tier={tier} style={{ ...PILL, background: neutral.sunken, color: neutral.slate }}>
      {tierLabel(tier)}
    </span>
  )
}

/** With a `count`, the pill reads "2 Preferred" (the Surgeons table's counts). */
function counted(count: number | undefined, label: string): string {
  return count === undefined ? label : `${count} ${label}`
}

export function PreferredPill({ count }: { count?: number } = {}) {
  return <span style={{ ...PILL, background: accent.tint, color: accent.pressed }}>{counted(count, PAIRING_LABELS.kind.PREFERRED)}</span>
}

export function NotPreferredPill({ count }: { count?: number } = {}) {
  return (
    <span style={{ ...PILL, background: neutral.surface, color: semantic.warning.onTint, border: `1px solid ${semantic.warning.solid}` }}>
      {counted(count, PAIRING_LABELS.kind.NOT_PREFERRED)}
    </span>
  )
}
