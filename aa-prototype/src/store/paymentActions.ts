/**
 * Payment detection (Phase 10; WI3, X4) — the RFP's webhook + daily
 * reconciliation poll, both writing through ONE handler keyed by the payment
 * idempotency key (RFP: "both paths write through the same handler, keyed by
 * InvoiceID, so a duplicate webhook or a poll re-detecting an already-processed
 * payment is a no-op").
 *
 * On a payment against an ACCREC (money into the AA account):
 *   - append a `PaymentIn` (unless Xero already recorded it — the missed-webhook
 *     case the poll catches), bump `XeroAccRec.amountReceived` + status;
 *   - authorise the paired `XeroAccPay` for EXACTLY the cumulative amount
 *     received (`payableReleasedFor`, US-10.2.1), flipping it DRAFT → AUTHORISED;
 *   - stamp the ACCREC's `paidAtISO` once, with the payment that completes it
 *     (webhook or poll; a replay never moves it). The BCTI count reads it;
 *   - mirror the money onto the BillingCase (received/authorised, paidInAt, a
 *     derived status label), so a fully-paid PRE-PAYMENT case reads `paid` and
 *     the `prepaymentUnpaid` warning (catch-up Phase 15a) goes;
 *   - append a `BillingReceipt` (the GST-report source + the idempotency
 *     key-set), GST = gross × 0.15 / 1.15.
 *
 * All automated money events audit `source:'system'` (convention 7). The
 * anaesthetist ACCPAY equals the ACCREC (FT-10.3): AA's own fee is a separate
 * monthly invoice, never deducted from a payable (catch-up Phase 16).
 */

import type { BillingCase, PaymentIn, XeroAccPay, XeroAccRec } from '../domain/types'
import { roundToCents, toCents } from '../domain/billing/money'
import { payableReleasedFor } from '../domain/billing/payableRelease'
import { transferOfCase, transferReleasedFor } from '../domain/billing/prepayHolding'
import { GST_RATE } from '../domain/billing/invoicePresentation'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'
import { payeeIdForCase } from './selectors'

/** GST component of a GST-inclusive amount received (3/23 of the gross). */
export function gstComponentOf(gross: number): number {
  return roundToCents((gross * GST_RATE) / (1 + GST_RATE))
}

/** The system actors for the two detection paths (both audit source=system). */
const PAYMENT_ACTOR: Record<'webhook' | 'poll', Actor> = {
  webhook: { who: 'Xero webhook', role: 'system', source: 'system' },
  poll: { who: 'Reconciliation poll', role: 'system', source: 'system' },
}

export interface ReceivePaymentInput {
  accRecId: string
  /** Gross amount received (GST-inclusive), before clamping to the balance due. */
  amount: number
  idempotencyKey: string
  source: 'webhook' | 'poll'
  /**
   * The instant Xero received the money. Omit for a live webhook (uses the
   * clock); the reconciliation poll passes the missed payment's OWN date so a
   * reconciled receipt lands in the correct GST period, not the detection day.
   */
  atISO?: string
}


/**
 * Detect a payment on an ACCREC. Idempotent by `idempotencyKey` (the receipts
 * ledger); a replay or a poll re-detect is a no-op. Returns `applied:false`
 * when nothing changed (duplicate key, or the ACCREC is already fully paid).
 */
export function receivePayment(api: AppStoreApi, input: ReceivePaymentInput): Outcome<{ applied: boolean }> {
  const state = api.getState()
  const accRec = state.xero.accRecs[input.accRecId]
  if (accRec === undefined) return refuse('notFound', 'ACCREC not found.')
  // AA's own fee invoice is paid through recordAaFeePayment, never as a
  // procedure receipt: no payable, no GST receipt (catch-up Phase 16).
  if (accRec.kind === 'aaFee') {
    return refuse('aaFeeInvoice', 'This is an AA fee invoice; record its payment as a fee payment.')
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return refuse('invalidAmount', 'The payment amount must be positive.')
  }
  // Idempotency: a receipt with this key means the payment is already processed.
  if (Object.values(state.billing.receipts).some((r) => r.idempotencyKey === input.idempotencyKey)) {
    return ok({ applied: false })
  }
  const theCase = Object.values(state.billing.cases).find((c) => c.accRecId === input.accRecId)
  if (theCase === undefined) return refuse('noCase', 'No billing case links this ACCREC.')
  const anaesthetistId = payeeIdForCase(state, theCase)
  // A prepayment's money goes to the AA Holding account (catch-up Phase 27a), so it needs no anaesthetist:
  // a List moved to the office (a Draft List) still takes its payer's payment.
  if (anaesthetistId === undefined && theCase.prepayLeg !== 'collect') return refuse('noAnaesthetist', 'Could not resolve the anaesthetist for this ACCREC.')

  // Clamp the applied amount to the outstanding balance (a normal ACCREC cannot
  // over-receive); an already fully-paid ACCREC is a no-op.
  const added = Math.min(input.amount, roundToCents(accRec.amountDue - accRec.amountReceived))
  if (toCents(added) <= 0) return ok({ applied: false })

  const newReceived = roundToCents(accRec.amountReceived + added)
  const accPay = theCase.accPayId !== undefined ? state.xero.accPays[theCase.accPayId] : undefined
  const accPayTotal = accPay?.amountPayable ?? accRec.amountDue
  const priorAuthorised = accPay?.amountAuthorised ?? 0
  const authorisedCumulative = payableReleasedFor(newReceived, accPayTotal)
  const fullyPaid = toCents(newReceived) >= toCents(accRec.amountDue)

  const gross = added
  const gst = gstComponentOf(gross)
  const alreadyHasPaymentIn = Object.values(state.xero.payments).some((p) => p.idempotencyKey === input.idempotencyKey)

  const metas: MutationMeta[] = []
  mutate(api, PAYMENT_ACTOR[input.source], metas, (s) => {
    let counters = s.counters
    // The receipt/PaymentIn/paid-in date is the money's actual receipt instant
    // (input.atISO for a poll-reconciled miss), else the live clock.
    const atISO = input.atISO ?? clockISO(s.clock)
    const payments = { ...s.xero.payments }
    const accRecs = { ...s.xero.accRecs }
    const accPays = { ...s.xero.accPays }
    const cases = { ...s.billing.cases }
    const receipts = { ...s.billing.receipts }
    let transfers = s.billing.transfers

    // 1) PaymentIn — append unless Xero already holds it (missed-webhook poll).
    if (!alreadyHasPaymentIn) {
      const pmt = allocateId(counters, 'paymentIn')
      counters = pmt.counters
      const payment: PaymentIn = {
        id: pmt.id,
        accRecId: input.accRecId,
        amount: gross,
        atISO,
        idempotencyKey: input.idempotencyKey,
        source: input.source,
      }
      payments[pmt.id] = payment
    }

    // 2) ACCREC — bump received + status.
    const recNow = s.xero.accRecs[input.accRecId] ?? accRec
    accRecs[input.accRecId] = {
      ...recNow,
      amountReceived: roundToCents(recNow.amountReceived + added),
      status: fullyPaid ? 'paid' : 'awaitingPayment',
      // Set once, by the completing payment (the BCTI count's paid month).
      ...(fullyPaid && recNow.paidAtISO === undefined ? { paidAtISO: atISO } : {}),
    } satisfies XeroAccRec

    // 3) ACCPAY — authorise exactly the amount received (cumulative), flip DRAFT → AUTHORISED.
    if (theCase.accPayId !== undefined) {
      const payNow = s.xero.accPays[theCase.accPayId]
      if (payNow !== undefined) {
        accPays[theCase.accPayId] = {
          ...payNow,
          amountAuthorised: authorisedCumulative,
          status: authorisedCumulative > 0 && payNow.status === 'draft' ? 'authorised' : payNow.status,
        } satisfies XeroAccPay
      }
    }

    // 4) BillingCase mirror.
    const caseNow = s.billing.cases[theCase.id]
    if (caseNow !== undefined) {
      const next: BillingCase = {
        ...caseNow,
        receivedAmount: newReceived,
        authorisedAmount: authorisedCumulative,
        status: fullyPaid ? 'paid' : 'partPaid',
      }
      if (fullyPaid && next.paidInAtISO === undefined) next.paidInAtISO = atISO
      cases[theCase.id] = next
    }

    // 4b) A prepayment already transferred (catch-up Phase 27a): money arriving now goes straight to the
    // anaesthetist's payable, released exactly as received and never more; the AA Holding account's balance
    // does not move.
    const transfer = theCase.prepayLeg === 'collect' ? transferOfCase(s.billing.transfers, theCase.id) : undefined
    if (transfer !== undefined) {
      const released = transferReleasedFor(newReceived, transfer)
      transfers = { ...s.billing.transfers, [transfer.id]: { ...transfer, released } }
      metas.push({ entityType: 'billingCase', entityId: theCase.id, action: 'prepayment.transferReleased', after: { transferId: transfer.id, released, increment: roundToCents(released - transfer.released) } })
    }

    // 5) Receipt — GST-report row + idempotency key.
    const rct = allocateId(counters, 'receipt')
    counters = rct.counters
    receipts[rct.id] = {
      id: rct.id,
      caseId: theCase.id,
      ...(anaesthetistId !== undefined ? { anaesthetistId } : {}),
      accRecId: input.accRecId,
      grossAmount: gross,
      gstAmount: gst,
      atISO,
      idempotencyKey: input.idempotencyKey,
      source: input.source,
    }

    metas.push({
      entityType: 'xeroAccRec',
      entityId: input.accRecId,
      action: 'xero.paymentReceived',
      after: { amount: gross, cumulative: newReceived, fullyPaid, source: input.source, idempotencyKey: input.idempotencyKey },
    })
    if (theCase.accPayId !== undefined) {
      metas.push({
        entityType: 'xeroAccPay',
        entityId: theCase.accPayId,
        action: 'xero.accpayAuthorised',
        after: { authorisedCumulative, increment: roundToCents(authorisedCumulative - priorAuthorised) },
      })
    }

    return {
      xero: { ...s.xero, payments, accRecs, accPays },
      billing: { ...s.billing, cases, receipts, transfers },
      counters,
    }
  })

  return ok({ applied: true })
}
