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
 *   - authorise the paired `XeroAccPay` PRO-RATA (cumulative-rounded), flipping
 *     it DRAFT → AUTHORISED ("partial payments pass through proportionally");
 *   - mirror the money onto the BillingCase (received/authorised, paidInAt, a
 *     derived status label), so a fully-paid PRE-PAYMENT case reads `paid` and
 *     `prepaymentStatusFor` clears the Phase-09 completion gate;
 *   - append a `BillingReceipt` (the GST-report source + the idempotency
 *     key-set), GST = gross × 0.15 / 1.15.
 *
 * All automated money events audit `source:'system'` (convention 7). The
 * anaesthetist ACCPAY payable equals the ACCREC collection total in the
 * prototype (D-payee-amount: "undiscounted" = before AA's fee, which is out of
 * RFP scope) — the pro-rata `× accPayTotal` scaling is kept so the accounting
 * stays correct if a future build sets a distinct undiscounted payable.
 */

import type { BillingCase, PaymentIn, XeroAccPay, XeroAccRec } from '../domain/types'
import { roundToCents, toCents } from '../domain/billing/money'
import { GST_RATE } from '../domain/billing/invoiceBuild'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

/** GST component of a GST-inclusive amount received (3/23 of the gross). */
export function gstComponentOf(gross: number): number {
  return roundToCents((gross * GST_RATE) / (1 + GST_RATE))
}

/**
 * Cumulative-rounded pro-rata authorisation (D-money-state): the fraction of
 * the ACCREC received, applied to the ACCPAY total. Guards a $0 ACCREC and
 * clamps the ratio at 1.
 */
export function proRataAuthorised(received: number, amountDue: number, accPayTotal: number): number {
  if (toCents(amountDue) === 0) return 0
  const ratio = Math.min(received / amountDue, 1)
  return roundToCents(ratio * accPayTotal)
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

function anaesthetistIdForCase(state: Pick<AppState, 'schedule'>, theCase: BillingCase): string | undefined {
  const card = state.schedule.cards[theCase.cardId]
  const list = card !== undefined ? state.schedule.lists[card.listId] : undefined
  return list?.anaesthetistId
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
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return refuse('invalidAmount', 'The payment amount must be positive.')
  }
  // Idempotency: a receipt with this key means the payment is already processed.
  if (Object.values(state.billing.receipts).some((r) => r.idempotencyKey === input.idempotencyKey)) {
    return ok({ applied: false })
  }
  const theCase = Object.values(state.billing.cases).find((c) => c.accRecId === input.accRecId)
  if (theCase === undefined) return refuse('noCase', 'No billing case links this ACCREC.')
  const anaesthetistId = anaesthetistIdForCase(state, theCase)
  if (anaesthetistId === undefined) return refuse('noAnaesthetist', 'Could not resolve the anaesthetist for this ACCREC.')

  // Clamp the applied amount to the outstanding balance (a normal ACCREC cannot
  // over-receive); an already fully-paid ACCREC is a no-op.
  const added = Math.min(input.amount, roundToCents(accRec.amountDue - accRec.amountReceived))
  if (toCents(added) <= 0) return ok({ applied: false })

  const newReceived = roundToCents(accRec.amountReceived + added)
  const accPay = theCase.accPayId !== undefined ? state.xero.accPays[theCase.accPayId] : undefined
  const accPayTotal = accRec.amountDue // D-payee-amount: undiscounted payable == collection total
  const priorAuthorised = accPay?.amountAuthorised ?? 0
  const authorisedCumulative = proRataAuthorised(newReceived, accRec.amountDue, accPayTotal)
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
    } satisfies XeroAccRec

    // 3) ACCPAY — pro-rata authorise (cumulative), flip DRAFT → AUTHORISED.
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

    // 5) Receipt — GST-report row + idempotency key.
    const rct = allocateId(counters, 'receipt')
    counters = rct.counters
    receipts[rct.id] = {
      id: rct.id,
      caseId: theCase.id,
      anaesthetistId,
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
      billing: { ...s.billing, cases, receipts },
      counters,
    }
  })

  return ok({ applied: true })
}
