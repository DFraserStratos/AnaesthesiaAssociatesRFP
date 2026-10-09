/**
 * The soft not-preferred warning (catch-up Phase 17; US-01.3.5 "Warned",
 * US-13.6.3 "Warns admin, never blocks"). An assignment-time callout in the
 * warning tint, the same family as the List drawer's "Needs attention" box and
 * 15a's mild warnings, but not a Warning record: nothing is registered in the
 * warning routine, the to-do list or the notification pool. It names the
 * pairing and the side, shows each recorded reason, and says the office can
 * still go ahead.
 */

import { TriangleAlert } from 'lucide-react'
import type { NotPreferredWarning as Warning } from '../../../../domain/pairingPreferences'
import { radius, semantic } from '../../../../theme/tokens'

export function NotPreferredWarning({ warning, shot = 'pairing-warning' }: { warning: Warning | null; shot?: string }) {
  if (warning === null) return null
  const reasons = warning.entries.map((e) => e.reason).filter((r): r is string => r !== undefined && r !== '')
  return (
    <div
      role="status"
      data-shot={shot}
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        background: semantic.warning.tint,
        color: semantic.warning.onTint,
        borderRadius: radius.card,
        padding: '12px 14px',
        fontSize: 13,
        lineHeight: '18px',
      }}
    >
      <TriangleAlert size={16} aria-hidden style={{ flexShrink: 0, marginTop: 1, color: semantic.warning.solid }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <strong style={{ fontWeight: 600 }}>{warning.message}</strong>
        {reasons.map((r, i) => (
          <span key={i}>Reason: {r}</span>
        ))}
        <span>You can still go ahead. Only the office sees this, and going ahead is noted in the history.</span>
      </div>
    </div>
  )
}
