/**
 * Test helper (catch-up Phase 21a): mark a Booking complete the way the live
 * capture does now, answering each Procedure's modifiers step with "None
 * apply" first (S1 Beat 3's one extra tap). The answer is idempotent, so a
 * Procedure already answered or carrying a claim is unchanged.
 */
import { completeBooking, confirmNoModifiers, type Actor } from '../store'
import type { AppStoreApi } from '../store/appStore'

export function completeAnswered(api: AppStoreApi, actor: Actor, bookingId: string) {
  for (const p of Object.values(api.getState().schedule.procedures)) {
    if (p.bookingId === bookingId && p.modifierClaims.length === 0) confirmNoModifiers(api, actor, p.id)
  }
  return completeBooking(api, actor, bookingId)
}
