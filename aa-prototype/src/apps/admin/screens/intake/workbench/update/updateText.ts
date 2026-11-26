/**
 * The update and cancellation benches' words (build plan Phase 69; US-02.1.2, US-02.1.3). Display only: every rule
 * lives in the store (`store/intakeApply.ts`) and the read models. The quick reject reasons moved here with the old
 * Matching panel's words (`matching/matchingText.ts`, deleted).
 */

import type { IncomingBookingFields, ListState } from '../../../../../../domain/types'
import { plural } from '../../../../../../shared/format'

/** Quick reject reasons, offered as chips beside the reason field. */
export const QUICK_REJECT_REASONS = ['Not an AA booking', 'Duplicate of another row', 'Wrong hospital or date'] as const

/** The insurer as the hospital sent it: "nib · Approval 1234567". */
export function insurerText(fields: Pick<IncomingBookingFields, 'insurer'>): string | null {
  const i = fields.insurer
  if (i === undefined) return null
  return i.approvalNumber !== undefined ? `${i.text} · Approval ${i.approvalNumber}` : i.text
}

/** The held List's state in words, as the bench's List line reads it. */
export function listStateLine(state: ListState): string {
  switch (state) {
    case 'DRAFT':
      return 'Draft, no anaesthetist yet'
    case 'ACTIVE':
      return 'Active, open to changes until it is authorised'
    case 'SUBMITTED':
      return 'Submitted, open to changes until it is authorised'
    case 'AUTHORISED':
      return 'Authorised and locked'
  }
}

/** The footer's count: "4 changes on 3 Bookings". */
export function changeCountText(changes: number, bookings: number): string {
  return `${plural(changes, 'change')} on ${plural(bookings, 'Booking')}`
}

/** The Apply button: "Apply 4 changes", or "Apply" when nothing is counted. */
export function applyLabel(changes: number): string {
  return changes === 0 ? 'Apply' : `Apply ${plural(changes, 'change')}`
}
