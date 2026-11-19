/**
 * The office's actions on the internal ledger (catch-up Phase 36; US-08.3.4,
 * US-13.2.1): clearing a receipt that matched no invoice. Allocating it to an
 * invoice applies it through the one receipt path (`applyReceiptInto`), dated
 * the receipt's own day so its GST lands in the right period; refunding it
 * records that the money went back. Either returns the ledger to balance.
 * Product office actions, unbadged; only the office may resolve one.
 */

import { roundToCents, toCents } from '../domain/billing/money'
import { isBookingPair } from '../domain/billing/ledger'
import { clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { applyReceiptInto } from './paymentActions'

export const OVER_ALLOCATION = "This receipt is more than the invoice's balance. Choose another invoice or mark it refunded."

/** The office's choice of invoices for a held receipt: Booking receivables whose balance covers it. */
export function allocationRefusal(state: Pick<AppState, 'billing'>, unmatchedId: string, pairId: string): { code: string; message: string } | null {
  const u = state.billing.unmatchedReceipts[unmatchedId]
  if (u === undefined) return { code: 'notFound', message: 'Unmatched receipt not found.' }
  if (u.status !== 'held') return { code: 'notHeld', message: 'This receipt is already allocated or refunded.' }
  const pair = state.billing.ledger[pairId]
  if (pair === undefined) return { code: 'notFound', message: 'Invoice not found in the ledger.' }
  const balance = roundToCents(pair.receivable.amount - pair.receivable.receivedAmount)
  if (!isBookingPair(pair) || toCents(balance) <= 0) return { code: 'notReceivable', message: 'Choose an invoice with a balance still owed.' }
  // A credited invoice owes nothing (catch-up Phase 39).
  if (pair.credit !== undefined) return { code: 'invoiceCredited', message: 'This invoice was credited. Choose the new invoice.' }
  // The payment is recorded in Xero too (a PaymentIn on its ACCREC): an invoice not yet there cannot take it.
  if (pair.receivable.xeroAccRecId === undefined) return { code: 'notInXero', message: 'This invoice is not in Xero yet. Choose another invoice, or resolve its handoff first.' }
  if (toCents(u.amount) > toCents(balance)) return { code: 'overAllocation', message: OVER_ALLOCATION }
  return null
}

/**
 * Allocate a held receipt to a Booking invoice (office only). Refuses
 * `notHeld`, `notReceivable` (an AA fee or a fully paid invoice) and
 * `overAllocation`. Applies it with key `ALLOC-<id>` and source `allocation`,
 * mirrors a `PaymentIn` on that invoice's ACCREC, and marks it allocated.
 */
export function allocateUnmatchedReceipt(api: AppStoreApi, actor: Actor, unmatchedId: string, pairId: string): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can allocate a receipt.')
  const refusal = allocationRefusal(api.getState(), unmatchedId, pairId)
  if (refusal !== null) return refuse(refusal.code, refusal.message)
  const u = api.getState().billing.unmatchedReceipts[unmatchedId]!
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const out = applyReceiptInto(s, s.counters, { pairId, amount: u.amount, idempotencyKey: `ALLOC-${u.id}`, source: 'allocation', atISO: u.atISO }, metas)
    if (out === null) {
      metas.push({ entityType: 'unmatchedReceipt', entityId: u.id, action: 'ledger.allocationNoop' })
      return {}
    }
    const resolved = { ...u, status: 'allocated' as const, allocatedToPairId: pairId, resolvedAtISO: clockISO(s.clock), resolvedBy: actor.who }
    metas.push({ entityType: 'unmatchedReceipt', entityId: u.id, action: 'ledger.unmatchedAllocated', after: { amount: u.amount, pairId, invoiceNumber: s.billing.ledger[pairId]?.receivable.number } })
    return {
      ...out.patch,
      billing: { ...out.patch.billing, unmatchedReceipts: { ...out.patch.billing.unmatchedReceipts, [u.id]: resolved } },
      counters: out.counters,
    }
  })
  return ok(undefined)
}

/** Mark a held receipt refunded (office only, a note required): the money went back, not to an anaesthetist. */
export function markUnmatchedRefunded(api: AppStoreApi, actor: Actor, unmatchedId: string, note: string): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can refund a receipt.')
  const u = api.getState().billing.unmatchedReceipts[unmatchedId]
  if (u === undefined) return refuse('notFound', 'Unmatched receipt not found.')
  if (u.status !== 'held') return refuse('notHeld', 'This receipt is already allocated or refunded.')
  const text = note.trim()
  if (text === '') return refuse('noteRequired', 'Add a note saying how it was refunded.')
  mutate(api, actor, { entityType: 'unmatchedReceipt', entityId: u.id, action: 'ledger.unmatchedRefunded', after: { amount: u.amount, note: text } }, (s) => ({
    billing: { ...s.billing, unmatchedReceipts: { ...s.billing.unmatchedReceipts, [u.id]: { ...u, status: 'refunded', note: text, resolvedAtISO: clockISO(s.clock), resolvedBy: actor.who } } },
  }))
  return ok(undefined)
}
