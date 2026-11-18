/**
 * The prepayment transfer (catch-up Phase 27a; US-06.5.1, US-09.1.3, FT-06.5,
 * DM-21; D38, D72). Step two of a prepayment: once the List is authorised, each
 * prepayment invoice's money moves from the AA Holding account to the
 * anaesthetist who did the List, automatically and with no office step, by a
 * transfer (`PrepayTransfer`): an accounting move, not an invoice, an ACCREC, a
 * `PaymentIn` or a receipt, so no GST moves and the payer is never invoiced
 * twice. Mirrored to Xero by `postTransferJournal`.
 *
 * The rules are `domain/billing/prepayHolding.ts`; this file feeds them from
 * the store. Its one caller is `wireBillingRun`'s `listAuthorised`
 * subscription, the one place the trigger lives (OQ-125, provisional). A moved
 * Booking needs nothing here: the transfer pays whoever did the List (the payee
 * locked at authorise), and no payee is ever repointed.
 */

import type { PrepayTransfer } from '../domain/types'
import { transferFor, transferOfCase, type TransferPlan } from '../domain/billing/prepayHolding'
import { refKey } from '../domain/billing/procedurePayer'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { bookingsForList } from './selectors'
import { postTransferJournal } from './xeroHandoff'

const TRANSFER_ACTOR: Actor = { who: 'Prepayment transfer', role: 'system', source: 'system' }

interface Planned {
  collectCaseId: string
  invoiceId: string
  bookingId: string
  payerKey: string
  plan: TransferPlan
}

/** The transfers a List's authorisation writes: one per sent, non-cancelled prepayment invoice not yet transferred. */
export function transfersDueForList(state: Pick<AppState, 'schedule' | 'billing' | 'xero'>, listId: string): Planned[] {
  const list = state.schedule.lists[listId]
  if (list === undefined || list.state !== 'AUTHORISED') return []
  const out: Planned[] = []
  for (const booking of bookingsForList(state, listId)) {
    for (const c of Object.values(state.billing.cases)) {
      if (c.bookingId !== booking.id || c.prepayLeg !== 'collect' || c.invoiceId === undefined) continue
      const invoice = state.billing.invoices[c.invoiceId]
      const accRec = c.accRecId !== undefined ? state.xero.accRecs[c.accRecId] : undefined
      const result = transferFor({
        collectCase: c,
        invoice,
        voided: accRec?.status === 'voided',
        bookingCancelled: booking.cancellation !== undefined,
        alreadyTransferred: transferOfCase(state.billing.transfers, c.id) !== undefined,
        // Whoever did the List: the payee locked at authorise (catch-up Phase 25), else the List's anaesthetist.
        payeeAnaesthetistId: state.billing.locks[booking.id]?.payee.anaesthetistId ?? list.anaesthetistId,
      })
      if ('plan' in result && invoice !== undefined) {
        out.push({ collectCaseId: c.id, invoiceId: invoice.id, bookingId: booking.id, payerKey: refKey(invoice.counterparty), plan: result.plan })
      }
    }
  }
  return out.sort((a, b) => a.invoiceId.localeCompare(b.invoiceId, undefined, { numeric: true }))
}

/**
 * Write the transfers for an authorised List, then post each one's Xero
 * journal. One mutate, audited as the system (`prepayment.transfer`, with the
 * amount and payee); idempotent per collect case; never throws (a journal fault
 * is recorded on the transfer for the Billing monitor's retry).
 */
export function settlePrepaymentsForList(api: AppStoreApi, listId: string): Outcome<{ transferIds: string[] }> {
  const list = api.getState().schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  if (list.state !== 'AUTHORISED') return refuse('listNotAuthorised', 'A prepayment moves to the anaesthetist only once the List is authorised.')
  const due = transfersDueForList(api.getState(), listId)
  if (due.length === 0) return ok({ transferIds: [] })

  const transferIds: string[] = []
  const metas: MutationMeta[] = []
  mutate(api, TRANSFER_ACTOR, metas, (s) => {
    let counters = s.counters
    const transfers = { ...s.billing.transfers }
    const atISO = clockISO(s.clock)
    for (const d of due) {
      // Idempotent against a racing commit: one transfer per collect case.
      if (transferOfCase(transfers, d.collectCaseId) !== undefined) continue
      const id = allocateId(counters, 'prepayTransfer')
      counters = id.counters
      transfers[id.id] = {
        id: id.id,
        collectCaseId: d.collectCaseId,
        invoiceId: d.invoiceId,
        bookingId: d.bookingId,
        payerKey: d.payerKey,
        atISO,
        amount: d.plan.amount,
        heldAmount: d.plan.heldAmount,
        from: 'aaHoldingAccount',
        toAnaesthetistId: d.plan.toAnaesthetistId,
        released: d.plan.released,
        disbursed: 0,
      } satisfies PrepayTransfer
      transferIds.push(id.id)
      metas.push({
        entityType: 'booking',
        entityId: d.bookingId,
        action: 'prepayment.transfer',
        after: {
          transferId: id.id,
          invoiceNumber: s.billing.invoices[d.invoiceId]?.invoiceNumber,
          amount: d.plan.amount,
          heldAmount: d.plan.heldAmount,
          released: d.plan.released,
          payee: s.masters.anaesthetists[d.plan.toAnaesthetistId]?.name ?? d.plan.toAnaesthetistId,
        },
        stampBookingId: null,
      })
    }
    if (transferIds.length === 0) {
      metas.push({ entityType: 'list', entityId: listId, action: 'prepayment.transferNoop' })
      return {}
    }
    return { billing: { ...s.billing, transfers }, counters }
  })
  for (const id of transferIds) postTransferJournal(api, id)
  return ok({ transferIds })
}
