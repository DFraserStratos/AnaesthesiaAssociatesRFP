/**
 * Every user-facing Draft List word (catch-up Phase 31; OQ-64 answered, D14),
 * in one module so the three apps cannot drift and the "no slot in app copy"
 * check has one place to look. "Draft List" is the thing, "Unassigned" its
 * flag (the only meaning that word has in the app), and "DRAFT" its state chip,
 * read from the one state label home (`LIST_STATE_LABELS`). Never "a List being
 * prepared". Pairing and tier words stay in Phase 17's `PAIRING_LABELS` and
 * `TIER_LABELS` (`domain/pairingPreferences.ts`).
 */

import { LIST_STATE_LABELS } from '../domain/types'
import type { DraftOrigin, RequestSource } from '../domain/types'

export const DRAFT_LIST = 'Draft List'
export const DRAFT_LISTS = 'Draft Lists'
/** The flag on every Draft List surface (US-01.6.2 "flagged as unassigned wherever it appears"). */
export const UNASSIGNED = 'Unassigned'
/** The state chip, from the one state label home. */
export const DRAFT_STATE = LIST_STATE_LABELS.DRAFT

/** Where a Draft List came from, as the page's Origin column and the drawer print it. */
export const ORIGIN_LABELS: Record<DraftOrigin, string> = {
  request: 'Request',
  recurringClash: 'Recurring booking, anaesthetist unavailable',
  movedToOffice: 'Moved to the office',
  unavailableReturn: 'Returned: anaesthetist unavailable',
  hospitalRow: 'Hospital row',
}

/** The short origin used before a detail ("Recurring booking · Dr Beaumont unavailable"). */
export const ORIGIN_SHORT_LABELS: Record<DraftOrigin, string> = {
  request: 'Request',
  recurringClash: 'Recurring booking',
  movedToOffice: 'Moved to the office',
  unavailableReturn: 'Returned: anaesthetist unavailable',
  hospitalRow: 'Hospital row',
}

/** How a request reached the office. */
export const SOURCE_LABELS: Record<RequestSource, string> = {
  phone: 'Phone',
  email: 'Email',
  pdf: 'PDF',
  other: 'Other',
}

/** "booking" / "bookings", for a count shown on its own figure. */
export function bookingNoun(n: number): string {
  return n === 1 ? 'booking' : 'bookings'
}

/** "1 booking" / "2 bookings": the count beside a Draft List. */
export function bookingCountLabel(n: number): string {
  return `${n} ${bookingNoun(n)}`
}

/** "Dr Beaumont unavailable": the detail after a recurring clash's origin. */
export function unavailableDetail(who: string): string {
  return `${who} unavailable`
}

/** "1 Draft List" / "3 Draft Lists". */
export function draftListCount(n: number): string {
  return `${n} ${n === 1 ? DRAFT_LIST : DRAFT_LISTS}`
}
