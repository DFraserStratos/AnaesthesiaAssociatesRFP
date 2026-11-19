import { useBookingStore } from './draft'
import type { CSSProperties } from 'react'
import { Lock } from 'lucide-react'
import { neutral } from '../../theme/tokens'
import { LOCK_BADGE_TEXT, lockStampText, lockViewFor } from '../../domain/billing/lock'
import { Pill } from '../ui'

/**
 * "Contract locked at authorise" (catch-up Phase 25; US-04.3.5): the neutral
 * pill with the lock glyph on a Booking whose List is AUTHORISED, on all three
 * apps (the Billing card, the office's billing setup). Neutral tint, never a
 * seventh status colour (Admin Review's lock treatment). Who locked it and when
 * shows on hover, or as a detail line beside it (`detail`, the web and Admin
 * detail views). Nothing before authorise.
 */
export function LockBadge({ bookingId, detail = false, style }: { bookingId: string; detail?: boolean; style?: CSSProperties }) {
  const lock = useBookingStore((s) => s.billing.locks[bookingId])
  if (lock === undefined || lock.state !== 'locked') return null
  const stamp = lockStampText(lockViewFor(lock))
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', ...style }}>
      <Pill tone="neutral" leading={<Lock size={11} strokeWidth={2.25} aria-hidden />} title={stamp} shot="booking-lock-badge">
        {LOCK_BADGE_TEXT}
      </Pill>
      {detail && <span data-shot="booking-lock-stamp" style={{ fontSize: 12, color: neutral.slate }}>{stamp}</span>}
    </span>
  )
}
