/**
 * The prepayment transfer (catch-up Phase 27a; US-06.5.1, US-09.1.3, FT-06.5,
 * DM-21; D38, D72). Step two of a prepayment: once the List is authorised, each
 * prepayment invoice's money moves from the AA Holding account to the
 * anaesthetist who did the List, automatically and with no office step, by a
 * transfer (a `LedgerTransfer`, catch-up Phase 36: two payable legs): an accounting move, not an invoice, an ACCREC, a
 * `PaymentIn` or a receipt, so no GST moves and the payer is never invoiced
 * twice. Mirrored to Xero by `postTransferJournal`.
 *
 * The rules are `domain/billing/prepayHolding.ts`; this file feeds them from
 * the store. Its one caller is `wireBillingRun`'s `listAuthorised`
 * subscription, the one place the trigger lives (OQ-125, provisional). A moved
 * Booking needs nothing here: the transfer pays whoever did the List (the payee
 * locked at authorise), and no payee is ever repointed.
 */

import type { BookingLedgerPair } from '../domain/types'
import { transferFor } from '../domain/billing/prepayHolding'
import { isBookingPair, newPrepayTransfer, transferOfPair } from '../domain/billing/ledger'
import { refKey } from '../domain/billing/procedurePayer'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { bookingsForList } from './selectors'
import { postTransferJournal } from './xeroHandoff'

const TRANSFER_ACTOR: Actor = { who: 'Prepayment transfer', role: 'system', source: 'system' }

interface Planned {
  collectPairId: string
  invoiceId: string
  bookingId: string
  listId: string
  payerKey: string
  to: string
}

/** The transfers a List's authorisation writes: one per sent, non-cancelled prepayment pair not yet transferred. */
export function transfersDueForList(state: Pick<AppState, 'schedule' | 'billing' | 'xero'>, listId: string): Planned[] {
  const list = state.schedule.lists[listId]
  if (list === undefined || list.state !== 'AUTHORISED') return []
  const out: Planned[] = []
  for (const booking of bookingsForList(state, listId)) {
    for (const pair of Object.values(state.billing.ledger)) {
      if (!isBookingPair(pair) || pair.bookingId !== booking.id || pair.kind !== 'prePayment') continue
      const invoice = state.billing.invoices[pair.invoiceId]
      const accRec = pair.receivable.xeroAccRecId !== undefined ? state.xero.accRecs[pair.receivable.xeroAccRecId] : undefined
      const result = transferFor({
        collectPair: pair,
        invoice,
        voided: accRec?.status === 'voided',
        bookingCancelled: booking.cancellation !== undefined,
        alreadyTransferred: transferOfPair(state.billing.transfers, pair.id) !== undefined,
        // Whoever did the List: the payee locked at authorise (catch-up Phase 25), else the List's anaesthetist.
        payeeAnaesthetistId: state.billing.locks[booking.id]?.payee.anaesthetistId ?? list.anaesthetistId,
      })
      if ('to' in result && invoice !== undefined) {
        out.push({ collectPairId: pair.id, invoiceId: invoice.id, bookingId: booking.id, listId, payerKey: refKey(invoice.counterparty), to: result.to })
      }
    }
  }
  return out.sort((a, b) => a.invoiceId.localeCompare(b.invoiceId, undefined, { numeric: true }))
}

/**
 * Write the transfers for an authorised List as ledger transfers (two payable
 * legs each, `newPrepayTransfer`; catch-up Phase 36), then post each one's Xero
 * journal. One mutate, audited as the system (`prepayment.transfer`, with the
 * amount and payee); idempotent per prepayment pair; never throws (a journal
 * fault is recorded on the transfer for the Billing monitor's retry).
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
      const pair = s.billing.ledger[d.collectPairId] as BookingLedgerPair | undefined
      if (pair === undefined) continue
      const id = allocateId(counters, 'prepayTransfer')
      const made = newPrepayTransfer({ id: id.id, collectPair: pair, listId: d.listId, payerKey: d.payerKey, payeeAnaesthetistId: d.to, atISO, transfers })
      // Idempotent against a racing commit: one transfer per prepayment pair.
      if (!made.ok) continue
      counters = id.counters
      transfers[id.id] = made.transfer
      transferIds.push(id.id)
      metas.push({
        entityType: 'booking',
        entityId: d.bookingId,
        action: 'prepayment.transfer',
        after: {
          transferId: id.id,
          invoiceNumber: s.billing.invoices[d.invoiceId]?.invoiceNumber,
          amount: made.transfer.in.amount,
          heldAmount: made.transfer.out.amount,
          released: made.transfer.in.releasedAmount,
          payee: s.masters.anaesthetists[d.to]?.name ?? d.to,
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
