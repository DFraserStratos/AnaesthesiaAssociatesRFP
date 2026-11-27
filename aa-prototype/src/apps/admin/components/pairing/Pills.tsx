/**
 * The pairing and offer order pills (catch-up Phase 17). Admin only. The offer order is a plain
 * neutral pills; a preferred pairing is the success tint (information, not an
 * action: UI unification question 15 moved it off the teal action tint); a
 * not-preferred pairing is attention in the warning family (the outline of
 * 15a's strength pill), never error red, never crimson. Every word comes from
 * the one label set. One-line wrappers over the shared `Pill` (U3).
 */

import { PAIRING_LABELS, tierLabel } from '../../../../domain/pairingPreferences'
import type { PriorityTier } from '../../../../domain/types'
import { Pill } from '../../../../shared/ui/Pill'

/** The offer order: the full name on its own ("Offer second"), `short` under an "Offer order" column ("Second"). */
export function TierPill({ tier, short = false }: { tier: PriorityTier; short?: boolean }) {
  return <Pill data-tier={tier}>{tierLabel(tier, short ? 'short' : 'full')}</Pill>
}

/** With a `count`, the pill reads "2 Preferred" (the Surgeons table's counts). */
function counted(count: number | undefined, label: string): string {
  return count === undefined ? label : `${count} ${label}`
}

export function PreferredPill({ count }: { count?: number } = {}) {
  return <Pill tone="success">{counted(count, PAIRING_LABELS.kind.PREFERRED)}</Pill>
}

export function NotPreferredPill({ count }: { count?: number } = {}) {
  return (
    <Pill tone="warning" variant="outline">
      {counted(count, PAIRING_LABELS.kind.NOT_PREFERRED)}
    </Pill>
  )
}
