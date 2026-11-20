/**
 * Catching up a prepayment settlement that could not complete at the time
 * (catch-up Phase 41 review; US-06.5.2, D56, D53):
 *  - a cancelled Booking whose prepayment invoice is still live, because the
 *    cancel's settlement was skipped while Xero held money the ledger had not
 *    recorded yet (`waitingForXero`): settled now, as the system, once the
 *    money is in the ledger;
 *  - a refund not yet in Xero because Xero was unavailable: posted now.
 * Run after the Xero sync queue drains and after a receipt. Idempotent.
 */

import type { AppStoreApi } from './appStore'
import { mutate, clockISO, type MutationMeta } from './mutate'
import { livePrePaymentInvoicesForBooking } from './selectors'
import { settlePrepaymentOnCancel, SETTLEMENT_ACTOR, type SettledInvoice } from './prepaymentCancellation'
import { handoffCorrection, postPrepaymentRefund } from './xeroHandoff'

const SYSTEM = { who: SETTLEMENT_ACTOR.who, role: 'system' as const, source: 'system' as const }

export function settlePendingPrepayments(api: AppStoreApi): void {
  const state = api.getState()
  const pending = Object.values(state.schedule.bookings).filter(
    (b) => b.cancellation !== undefined && livePrePaymentInvoicesForBooking(state, b.id).some((i) => i.approval !== undefined),
  )
  for (const booking of pending) {
    let settled: SettledInvoice[] = []
    const metas: MutationMeta[] = []
    mutate(api, SYSTEM, metas, (s) => {
      const out = settlePrepaymentOnCancel(s, booking.id, clockISO(s.clock), metas)
      settled = out.settled
      if (metas.length === 0) metas.push({ entityType: 'booking', entityId: booking.id, action: 'prepayment.settlementNoop', stampBookingId: null })
      return out.patch ?? {}
    })
    for (const x of settled) {
      if (x.creditNoteId !== undefined) handoffCorrection(api, x.creditNoteId)
      if (x.refundId !== undefined) postPrepaymentRefund(api, x.refundId)
    }
  }
  for (const r of Object.values(api.getState().billing.prepaymentRefunds)) {
    if (r.xeroRefundId === undefined) postPrepaymentRefund(api, r.id)
  }
}
