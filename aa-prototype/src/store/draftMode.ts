/**
 * Draft stores (catch-up Phase 35; DM-35): the Admin Booking detail edits a
 * private, non-persisted copy of the store until the office saves. A store
 * marked here is a draft: derived follow-ons that would raise money or reach
 * the rest of the app (27's prepayment send, the shared app events) are
 * no-ops on it, and `saveBookingChanges` runs them once on the real store.
 */

import type { AppStoreApi } from './appStore'

const DRAFT_STORES = new WeakSet<object>()

/** Mark a store as a Booking draft (the draft provider does this once). */
export function markDraftStore(api: AppStoreApi): void {
  DRAFT_STORES.add(api)
}

/** True for a Booking draft's private store. */
export function isDraftStore(api: AppStoreApi): boolean {
  return DRAFT_STORES.has(api)
}
