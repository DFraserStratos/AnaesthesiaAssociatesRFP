/**
 * Demo staging bodies the harness bar's triggers call (catch-up Phase 25).
 * Badged demo-only; each acts through the product's own store actions.
 */

import { armHandoffFault } from './demoSettingsActions'
import { authoriseBlockersFor, authoriseList, incompleteBookingsOn, submitList } from './lifecycle'
import { OFFICE_ACTOR } from './demoActors'
import { ok, refuse, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'
import { SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'

/** The trigger's refusal once the List is billed. */
export const BILLING_FAILURE_ALREADY = 'Already triggered'

/**
 * The S4 billing failure, re-based on a cause that survives the lock (catch-up
 * Phase 25): the engine prices only from what was locked at authorise, so no
 * Contract edit can break a run. What can still fail is outside the lock: the
 * Xero hand-off. On Dr Ropata's Thu 16 Jul List it submits the List if it is
 * ACTIVE, arms the hand-off fault for Losa Tuilagi's Booking alone, then
 * authorises as the office. Her Booking is held back at the hand-off, Hemi
 * Walker's bills and hands off, and the List is not failed (OQ-05); the
 * monitor's "Resolve & retry" hands hers off once. No Contract changes.
 */
export function stageBillingFailure(api: AppStoreApi): Outcome<{ listId: string; bookingId: string }> {
  const listId = SEED_LIST_IDS.billingFailure
  const list = api.getState().schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'The billing-failure List is not present in this seed.')
  if (list.billedAtISO !== undefined || list.state === 'AUTHORISED') return refuse('alreadyTriggered', BILLING_FAILURE_ALREADY)
  const bookingId = SEED_MARKERS['billingFailureBooking']?.entityId
  if (bookingId === undefined || api.getState().schedule.bookings[bookingId] === undefined) return refuse('notFound', "Losa Tuilagi's Booking is not present in this seed.")
  if (list.state === 'ACTIVE') {
    const submitted = submitList(api, OFFICE_ACTOR, listId)
    if (!submitted.ok) return submitted
  }
  // Arm only when authorise will go through, so a refused authorise never leaves the fault armed.
  const blocker = authoriseBlockersFor(api.getState(), listId)[0]
  if (blocker !== undefined) return refuse(blocker.code, blocker.message)
  if (incompleteBookingsOn(api.getState(), listId).length > 0) return refuse('bookingsNotCompleted', 'A Booking on this List is not complete.')
  armHandoffFault(api, OFFICE_ACTOR, { bookingId })
  const authorised = authoriseList(api, OFFICE_ACTOR, listId)
  if (!authorised.ok) return authorised
  return ok({ listId, bookingId })
}
