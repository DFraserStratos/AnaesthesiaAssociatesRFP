/**
 * The Xero side of the simulation (catch-up Phase 37): what happens inside
 * Xero, done by AA staff or by Xero itself, which the Billing Engine only
 * learns of afterwards. Each is audited with a Xero actor, source demo.
 *
 *  - `payBillsInXero`: Xero's payables run pays authorised bills (OQ-111
 *    answered, D53: payments to anaesthetists are made in Xero). It writes the
 *    Xero bill payment and the ACCPAY only; the engine records the
 *    disbursement when the bill-paid webhook arrives (`recordDisbursement`), or
 *    at the next poll when the webhook is missed, or from the queue during an
 *    outage.
 *  - `voidAccRecInXero`, `amendAccRecInXero`: AA staff change an invoice
 *    directly in Xero; the engine sees it only at the next reconciliation poll
 *    (EP-09's divergence case).
 *
 * Bulk remittance (US-10.2.4) also lands here in session 2; this module and
 * the Xero simulator are the only importers of `domain/xeroSim`.
 */

import type { Disbursement, PayablesRunLine, XeroAccPay, XeroBankLine, XeroBatchPayment, XeroCreditAllocation, XeroRemittance } from '../domain/types'
import { roundToCents, toCents } from '../domain/billing/money'
import { matchRemittanceLines } from '../domain/xeroSim/remittance'
import { resolveRemittance, ST_GEORGES_REMITTANCE, type RemittanceFixture } from '../domain/xeroSim/remittanceFixtures'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { recordDisbursement, recordOffset } from './disbursementDetection'
import { accPayOfLine, PAYMENT_CYCLE_COPY, runStaleness } from './paymentCycleActions'
import { cycleLabel } from '../domain/billing/paymentCycle'
import { deliverPaymentWebhook, xeroBalanceOf } from './paymentActions'
import { enqueueXeroWork, XERO_OUTAGE_ERROR, xeroAvailable } from './xeroGate'
import { pairsByAccPayIndex } from './indexes'

/** Xero's payables run (simulated): AA staff pay the authorised bills in Xero. */
export const XERO_PAYABLES_ACTOR: Actor = { who: 'Xero payables run (simulated)', role: 'office', source: 'demo' }
/** AA staff working directly in Xero (simulated). */
export const XERO_STAFF_ACTOR: Actor = { who: 'AA staff in Xero (simulated)', role: 'office', source: 'demo' }

/** One bill Xero can pay: a pair's ACCPAY, or a transferred prepayment's payable (27a: posted by its journal, no ACCPAY of its own). */
export type XeroBill = { accPayId: string } | { transferId: string }

export interface BillPaid {
  bill: XeroBill
  xeroDisbursementId: string
  amount: number
  idempotencyKey: string
  /** The engine recorded it straight away (webhook delivered, Xero answering). */
  recorded: boolean
  /** The webhook's sync waits in the Xero sync queue (outage). */
  queued: boolean
}

/** One ACCPAYCREDIT allocation a run made against a bill (catch-up Phase 39a). */
export interface CreditAllocated {
  xeroAllocationId: string
  accPayId: string
  negativeInvoiceId: string
  amount: number
  idempotencyKey: string
  recorded: boolean
  queued: boolean
}

export interface PayBillsResult {
  payablesRunId?: string
  paid: BillPaid[]
  totalPaid: number
  /** How many of the paid bills the engine recorded now. */
  recordedCount: number
  totalRecorded: number
  /** Credit allocations Xero made (netting) and their total (catch-up Phase 39a). */
  allocations: CreditAllocated[]
  totalAllocated: number
  /** One per anaesthetist paid cash in this call. */
  batchPaymentIds: string[]
  /** Lines Xero could not pay (not in Xero yet, a transfer's journal waiting, a voided or credited bill). */
  skipped: number
}

/** What Xero would pay on a bill now: an ACCPAY's authorised less paid less credit allocated; a transfer's released less what Xero has paid on it (once its journal is posted). Never the AA Holding account. */
export function xeroBillPayable(state: Pick<AppState, 'xero' | 'billing'>, bill: XeroBill): number {
  if ('accPayId' in bill) {
    const pay = state.xero.accPays[bill.accPayId]
    if (pay === undefined || pay.payeeAccount === 'aaHoldingAccount') return 0
    // A voided or credited bill (catch-up Phase 39) is never paid, nor one whose ledger payable a credit reversed.
    if (pay.status === 'voided' || pay.status === 'credited') return 0
    if ((pairsByAccPayIndex(state.billing.ledger).get(bill.accPayId) ?? []).some((p) => p.kind !== 'aaFee' && p.payable?.reversedAmount !== undefined)) return 0
    return Math.max(0, roundToCents(pay.amountAuthorised - pay.amountDisbursed - (pay.amountCreditAllocated ?? 0)))
  }
  const t = state.billing.transfers[bill.transferId]
  if (t === undefined || t.xeroJournalId === undefined) return 0
  const paid = Object.values(state.xero.disbursements).filter((d) => d.transferId === bill.transferId).reduce((n, d) => n + toCents(d.amount), 0)
  return Math.max(0, toCents(t.in.releasedAmount) - paid) / 100
}

function billOfLine(state: Pick<AppState, 'billing'>, line: PayablesRunLine): XeroBill | undefined {
  if (line.kind === 'transfer') return { transferId: line.pairId }
  const accPayId = accPayOfLine(state, line)
  return accPayId !== undefined ? { accPayId } : undefined
}

interface PlannedLine {
  line: PayablesRunLine
  bill: XeroBill
  allocations: { negativeInvoiceId: string; accPayCreditId: string; amount: number }[]
  cash: number
}

/**
 * The accountant pays a scheduled run in Xero (US-10.2.7's Tuesday schedule;
 * US-10.2.5; OQ-111 answered, D53: Xero's payables run, never the app). Xero
 * side only, in one mutate: per anaesthetist, each netting allocation as an
 * ACCPAYCREDIT allocated against its bill, each bill's cash remainder as a
 * bill payment (`BILLPAY-`), and one batch payment for the net. Held lines
 * are untouched; a line already sent is never sent twice. Then the webhook:
 * `deliver` with Xero answering records each allocation (`recordOffset`) and
 * each bill payment (`recordDisbursement`); during an outage they queue;
 * `missed` leaves them for the poll.
 *
 * THE GATE (US-10.2.6): only a run that is scheduled (or already paying) is
 * paid, and only its unheld lines. `onlyPairIds` pays a subset (the Xero
 * pair's single payout), refused `useRun` when one of them carries a netting.
 */
export function payRunInXero(api: AppStoreApi, actor: Actor, runId: string, opts: { webhook: 'deliver' | 'missed'; onlyPairIds?: readonly string[] }): Outcome<PayBillsResult> {
  const state = api.getState()
  const run = state.billing.payablesRuns[runId]
  if (run === undefined) return refuse('notFound', PAYMENT_CYCLE_COPY.notFound)
  if (run.status !== 'scheduled' && run.status !== 'paying') return refuse('notApproved', PAYMENT_CYCLE_COPY.notApproved)
  if (run.status === 'scheduled') {
    const stale = runStaleness(state, run)
    if (stale !== null) return refuse('runStale', stale)
  }
  const only = opts.onlyPairIds !== undefined ? new Set(opts.onlyPairIds) : undefined
  const lines = run.lines.filter((l) => l.heldOut === undefined && (only === undefined || only.has(l.pairId)))
  if (only !== undefined && lines.some((l) => run.nettings.some((n) => n.allocations.some((a) => a.pairId === l.pairId)))) return refuse('useRun', PAYMENT_CYCLE_COPY.useRun)

  // Plan, per line: the credit to allocate and the cash to pay, net of what this run already sent to Xero.
  const planned: PlannedLine[] = []
  const result: PayBillsResult = { payablesRunId: runId, paid: [], totalPaid: 0, recordedCount: 0, totalRecorded: 0, allocations: [], totalAllocated: 0, batchPaymentIds: [], skipped: 0 }
  const creditLeft = new Map<string, number>()
  for (const line of lines) {
    const bill = billOfLine(state, line)
    if (bill === undefined) {
      result.skipped += 1
      continue
    }
    const accPayId = 'accPayId' in bill ? bill.accPayId : undefined
    const allocations: PlannedLine['allocations'] = []
    let nettedCents = 0
    for (const n of run.nettings) {
      for (const a of n.allocations) {
        if (a.pairId !== line.pairId) continue
        nettedCents += toCents(a.amount)
        const neg = state.billing.negativeInvoices[n.negativeInvoiceId]
        const credit = neg?.accPayCreditNoteId !== undefined ? state.xero.creditNotes[neg.accPayCreditNoteId] : undefined
        if (credit === undefined || accPayId === undefined) continue
        const already = Object.values(state.xero.creditAllocations)
          .filter((x) => x.payablesRunId === runId && x.accPayId === accPayId && x.accPayCreditId === credit.id)
          .reduce((s, x) => s + toCents(x.amount), 0)
        const want = toCents(a.amount) - already
        const left = creditLeft.get(credit.id) ?? toCents(credit.total) - toCents(credit.allocated)
        const take = Math.max(0, Math.min(want, left))
        creditLeft.set(credit.id, left - take)
        if (take > 0) allocations.push({ negativeInvoiceId: n.negativeInvoiceId, accPayCreditId: credit.id, amount: take / 100 })
      }
    }
    const sentCash = Object.values(state.xero.disbursements)
      .filter((d) => d.payablesRunId === runId && (('accPayId' in bill && d.accPayId === bill.accPayId) || ('transferId' in bill && d.transferId === bill.transferId)))
      .reduce((s, d) => s + toCents(d.amount), 0)
    const cash = Math.max(0, toCents(line.amount) - nettedCents - sentCash)
    const need = cash + allocations.reduce((s, a) => s + toCents(a.amount), 0)
    if (need === 0) continue
    if (need > toCents(xeroBillPayable(state, bill))) {
      result.skipped += 1
      continue
    }
    planned.push({ line, bill, allocations, cash: cash / 100 })
  }
  if (planned.length === 0) return ok(result)

  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    let counters = s.counters
    const atISO = clockISO(s.clock)
    const accPays = { ...s.xero.accPays }
    const disbursements = { ...s.xero.disbursements }
    const creditAllocations = { ...s.xero.creditAllocations }
    const creditNotes = { ...s.xero.creditNotes }
    const batchPayments = { ...s.xero.batchPayments }
    const byAnaesthetist = new Map<string, { contactId: string; ids: string[]; cents: number }>()
    for (const p of planned) {
      const accPayId = 'accPayId' in p.bill ? p.bill.accPayId : undefined
      for (const a of p.allocations) {
        if (accPayId === undefined) continue
        const xca = allocateId(counters, 'creditAllocation')
        counters = xca.counters
        creditAllocations[xca.id] = { id: xca.id, accPayCreditId: a.accPayCreditId, accPayId, amount: a.amount, atISO, idempotencyKey: `CNALLOC-${xca.id}`, payablesRunId: runId } satisfies XeroCreditAllocation
        const credit = creditNotes[a.accPayCreditId]!
        creditNotes[a.accPayCreditId] = { ...credit, allocated: roundToCents(credit.allocated + a.amount) }
        const pay = accPays[accPayId]!
        const allocatedTotal = roundToCents((pay.amountCreditAllocated ?? 0) + a.amount)
        accPays[accPayId] = { ...pay, amountCreditAllocated: allocatedTotal, status: toCents(pay.amountDisbursed) + toCents(allocatedTotal) >= toCents(pay.amountPayable) ? 'paid' : pay.status }
        metas.push({ entityType: 'xeroAccPay', entityId: accPayId, action: 'xero.creditAllocated', after: { creditNote: credit.creditNoteNumber, amount: a.amount, payablesRunId: runId, allocationId: xca.id } })
        result.allocations.push({ xeroAllocationId: xca.id, accPayId, negativeInvoiceId: a.negativeInvoiceId, amount: a.amount, idempotencyKey: `CNALLOC-${xca.id}`, recorded: false, queued: false })
        result.totalAllocated = roundToCents(result.totalAllocated + a.amount)
      }
      if (toCents(p.cash) === 0) continue
      const dsb = allocateId(counters, 'disbursement')
      counters = dsb.counters
      const idempotencyKey = `BILLPAY-${dsb.id}`
      disbursements[dsb.id] = { id: dsb.id, ...p.bill, amount: p.cash, atISO, payablesRunId: runId, idempotencyKey } satisfies Disbursement
      if (accPayId !== undefined) {
        const pay = accPays[accPayId]!
        const paidTotal = roundToCents(pay.amountDisbursed + p.cash)
        accPays[accPayId] = { ...pay, amountDisbursed: paidTotal, status: toCents(paidTotal) + toCents(pay.amountCreditAllocated ?? 0) >= toCents(pay.amountPayable) ? 'paid' : 'authorised' } satisfies XeroAccPay
        metas.push({ entityType: 'xeroAccPay', entityId: accPayId, action: 'xero.disbursed', after: { increment: p.cash, cumulative: paidTotal, payablesRunId: runId, billPaymentId: dsb.id } })
      } else if ('transferId' in p.bill) {
        metas.push({ entityType: 'ledgerPair', entityId: s.billing.transfers[p.bill.transferId]?.collectPairId ?? p.bill.transferId, action: 'xero.disbursed', after: { transferId: p.bill.transferId, increment: p.cash, payablesRunId: runId, billPaymentId: dsb.id } })
      }
      result.paid.push({ bill: p.bill, xeroDisbursementId: dsb.id, amount: p.cash, idempotencyKey, recorded: false, queued: false })
      result.totalPaid = roundToCents(result.totalPaid + p.cash)
      const contactId = accPayId !== undefined ? accPays[accPayId]!.contactId : `anaesthetist:${p.line.anaesthetistId}`
      const batch = byAnaesthetist.get(p.line.anaesthetistId) ?? { contactId, ids: [], cents: 0 }
      batch.ids.push(dsb.id)
      batch.cents += toCents(p.cash)
      byAnaesthetist.set(p.line.anaesthetistId, batch)
    }
    for (const [anaesthetistId, b] of [...byAnaesthetist.entries()].sort((x, y) => x[0].localeCompare(y[0]))) {
      const xbp = allocateId(counters, 'batchPayment')
      counters = xbp.counters
      batchPayments[xbp.id] = { id: xbp.id, contactId: b.contactId, anaesthetistId, payablesRunId: runId, cycleId: run.cycleId, total: b.cents / 100, atISO, billPaymentIds: b.ids } satisfies XeroBatchPayment
      for (const id of b.ids) disbursements[id] = { ...disbursements[id]!, batchPaymentId: xbp.id }
      result.batchPaymentIds.push(xbp.id)
      metas.push({ entityType: 'payablesRun', entityId: runId, action: 'xero.batchPaid', after: { batchPaymentId: xbp.id, week: cycleLabel(run), anaesthetistId, total: b.cents / 100, bills: b.ids.length } })
    }
    const runNow = s.billing.payablesRuns[runId]!
    let payablesRuns = s.billing.payablesRuns
    if (runNow.status === 'scheduled') {
      payablesRuns = { ...payablesRuns, [runId]: { ...runNow, status: 'paying', sentToXeroAtISO: atISO } }
      metas.push({ entityType: 'payablesRun', entityId: runId, action: 'payables.runSentToXero', before: { status: 'scheduled' }, after: { status: 'paying', week: cycleLabel(run) } })
    }
    return { xero: { ...s.xero, accPays, disbursements, creditAllocations, creditNotes, batchPayments }, billing: { ...s.billing, payablesRuns }, counters }
  })

  if (opts.webhook === 'missed') return ok(result)
  // The engine learns of each allocation, then each bill payment (either order settles the same).
  for (const a of result.allocations) {
    const x = api.getState().xero.creditAllocations[a.xeroAllocationId]!
    if (!xeroAvailable(api.getState())) {
      a.queued = enqueueXeroWork(api, { kind: 'offsetSync', idempotencyKey: a.idempotencyKey, target: { accPayId: x.accPayId, xeroAllocationId: x.id }, lastError: XERO_OUTAGE_ERROR }).ok
      continue
    }
    const recorded = recordOffset(api, { accPayId: x.accPayId, accPayCreditId: x.accPayCreditId, xeroAllocationId: x.id, amount: x.amount, atISO: x.atISO, idempotencyKey: x.idempotencyKey, detectedBy: 'webhook', payablesRunId: runId })
    a.recorded = recorded.ok && recorded.value.applied
  }
  for (const p of result.paid) {
    const target = { ...p.bill, xeroDisbursementId: p.xeroDisbursementId }
    if (!xeroAvailable(api.getState())) {
      const queued = enqueueXeroWork(api, { kind: 'disbursementSync', idempotencyKey: p.idempotencyKey, target, lastError: XERO_OUTAGE_ERROR })
      p.queued = queued.ok
      continue
    }
    const recorded = recordDisbursement(api, { ...p.bill, xeroDisbursementId: p.xeroDisbursementId, amount: p.amount, atISO: api.getState().xero.disbursements[p.xeroDisbursementId]!.atISO, idempotencyKey: p.idempotencyKey, detectedBy: 'webhook', payablesRunId: runId })
    if (recorded.ok && recorded.value.applied) {
      p.recorded = true
      result.recordedCount += 1
      result.totalRecorded = roundToCents(result.totalRecorded + p.amount)
    }
  }
  return ok(result)
}

/**
 * Xero pays these bills, each only as an unheld line of the scheduled run
 * named (37's helper, kept for the Xero pair's single payout): the gate
 * refuses `notApproved` for a bill that is not such a line.
 */
export function payBillsInXero(api: AppStoreApi, actor: Actor, bills: readonly XeroBill[], opts: { webhook: 'deliver' | 'missed'; runId: string }): Outcome<PayBillsResult> {
  const state = api.getState()
  const run = state.billing.payablesRuns[opts.runId]
  if (run === undefined) return refuse('notApproved', PAYMENT_CYCLE_COPY.notApproved)
  const pairIds: string[] = []
  for (const bill of bills) {
    const line = run.lines.find((l) => l.heldOut === undefined && (('transferId' in bill && l.pairId === bill.transferId) || ('accPayId' in bill && accPayOfLine(state, l) === bill.accPayId)))
    if (line === undefined) return refuse('notApproved', PAYMENT_CYCLE_COPY.notApproved)
    pairIds.push(line.pairId)
  }
  return payRunInXero(api, actor, opts.runId, { webhook: opts.webhook, onlyPairIds: pairIds })
}

/** Why an ACCREC cannot be voided in Xero, or null. Xero's own rule: no void with payments applied. */
export function voidInXeroRefusal(state: Pick<AppState, 'xero'>, accRecId: string | undefined): string | null {
  const rec = accRecId !== undefined ? state.xero.accRecs[accRecId] : undefined
  if (rec === undefined) return 'No invoice in Xero'
  if (rec.status === 'voided') return 'Already voided in Xero'
  if (rec.status === 'credited') return 'Credited in full by the engine'
  if (rec.kind === 'aaFee') return 'Fee invoices are outside this check'
  if (toCents(rec.amountReceived) > 0 || Object.values(state.xero.payments).some((p) => p.accRecId === rec.id)) return 'Xero cannot void an invoice with payments applied; remove the payment in Xero first'
  return null
}

/** AA staff void an invoice directly in Xero (EP-09): Xero side only; the engine learns at the next poll. */
export function voidAccRecInXero(api: AppStoreApi, actor: Actor, accRecId: string): Outcome<{ invoiceNumber: string }> {
  const state = api.getState()
  const refusal = voidInXeroRefusal(state, accRecId)
  if (refusal !== null) return refuse('voidRefused', refusal)
  const rec = state.xero.accRecs[accRecId]!
  mutate(api, actor, { entityType: 'xeroAccRec', entityId: accRecId, action: 'xero.voidedInXero', before: { status: rec.status }, after: { status: 'voided', invoiceNumber: rec.invoiceNumber } }, (s) => {
    const now = s.xero.accRecs[accRecId]!
    return { xero: { ...s.xero, accRecs: { ...s.xero.accRecs, [accRecId]: { ...now, status: 'voided', voidedAtISO: clockISO(s.clock) } } } }
  })
  return ok({ invoiceNumber: rec.invoiceNumber })
}

/** The demo amendment: AA staff lower an invoice's total in Xero by this much (one fixed demo edit). */
export const XERO_DEMO_AMENDMENT = 20

/** Why an ACCREC cannot take the demo amendment in Xero, or null. */
export function amendInXeroRefusal(state: Pick<AppState, 'xero'>, accRecId: string | undefined): string | null {
  const rec = accRecId !== undefined ? state.xero.accRecs[accRecId] : undefined
  if (rec === undefined) return 'No invoice in Xero'
  if (rec.status === 'voided') return 'Voided in Xero'
  if (rec.status === 'credited') return 'Credited in full by the engine'
  if (rec.kind === 'aaFee') return 'Fee invoices are outside this check'
  if (rec.amendedAtISO !== undefined) return 'Already amended in Xero'
  if (toCents(rec.amountReceived) > 0 || Object.values(state.xero.payments).some((p) => p.accRecId === rec.id)) return 'A payment is applied in Xero'
  if (toCents(rec.amountDue) <= toCents(XERO_DEMO_AMENDMENT)) return 'The total would reach zero'
  return null
}

/**
 * AA staff edit a line in Xero, lowering the invoice's total by the demo
 * amount (EP-09's amendment case): Xero side only. The receivable leg keeps
 * the engine-issued amount, so a payment of what Xero now shows leaves the
 * ledger open by the difference until the office resolves the flag.
 */
export function amendAccRecInXero(api: AppStoreApi, actor: Actor, accRecId: string): Outcome<{ invoiceNumber: string; total: number }> {
  const state = api.getState()
  const refusal = amendInXeroRefusal(state, accRecId)
  if (refusal !== null) return refuse('amendRefused', refusal)
  const rec = state.xero.accRecs[accRecId]!
  const total = roundToCents(rec.amountDue - XERO_DEMO_AMENDMENT)
  mutate(api, actor, { entityType: 'xeroAccRec', entityId: accRecId, action: 'xero.amendedInXero', before: { total: rec.amountDue }, after: { total, invoiceNumber: rec.invoiceNumber } }, (s) => {
    const now = s.xero.accRecs[accRecId]!
    return { xero: { ...s.xero, accRecs: { ...s.xero.accRecs, [accRecId]: { ...now, amountDue: total, amendedAtISO: clockISO(s.clock) } } } }
  })
  return ok({ invoiceNumber: rec.invoiceNumber, total })
}

// ---------------------------------------------------------------------------
// Bulk hospital remittance (US-10.2.4): matched in Xero, never by the engine.
// ---------------------------------------------------------------------------

/** Xero's remittance add-on (simulated): it reads the advice and matches lines in Xero's bank reconciliation. */
export const XERO_REMITTANCE_ACTOR: Actor = { who: 'Xero remittance add-on (simulated)', role: 'system', source: 'demo' }

/** Why the bulk remittance cannot be received now, or null. */
export function bulkRemittanceRefusal(state: Pick<AppState, 'xero'>, fixture: RemittanceFixture = ST_GEORGES_REMITTANCE): string | null {
  if (Object.values(state.xero.remittances).some((r) => r.reference === fixture.reference)) return 'Already received'
  const resolved = resolveRemittance(fixture, state.xero)
  return resolved.ok ? null : resolved.reason
}

export interface BulkRemittanceResult {
  remittanceId: string
  matchedCount: number
  matchedTotal: number
  unmatchedCount: number
  /** Matched payments the engine recorded now (the rest wait in the Xero sync queue). */
  receiptsRecorded: number
  queued: number
}

/**
 * A hospital's bulk remittance lands in Xero (US-10.2.4): one deposit, several
 * lines. Xero's add-on matches each line on its exact InvoiceNumber
 * (`matchRemittanceLines`, Xero side only); each match becomes a Xero payment
 * the engine learns through the ordinary payment webhook (keyed
 * `REMIT-<remittance>-<line>`), or through the queue during an outage. A line
 * the add-on cannot match stays in Xero's bank reconciliation: it never
 * reaches the engine. Once only.
 */
export function receiveBulkRemittance(api: AppStoreApi, fixture: RemittanceFixture = ST_GEORGES_REMITTANCE): Outcome<BulkRemittanceResult> {
  const state = api.getState()
  const refusal = bulkRemittanceRefusal(state, fixture)
  if (refusal !== null) return refuse('remittanceRefused', refusal)
  const resolved = resolveRemittance(fixture, state.xero)
  if (!resolved.ok) return refuse('remittanceRefused', resolved.reason)
  // Each ACCREC at what Xero shows owing less payments it holds that the engine has not recorded yet (an outage's).
  const payerRecs = Object.values(state.xero.accRecs)
    .filter((r) => r.contactId === resolved.value.payerContactId)
    .map((r) => ({ ...r, amountReceived: roundToCents(r.amountDue - xeroBalanceOf(state, r.id)) }))
  const match = matchRemittanceLines(resolved.value.lines, payerRecs)
  const matchedBy = new Map(match.matched.map((m) => [m.lineId, m]))

  let remittanceId = ''
  const toPay: { bankLineId: string; accRecId: string; amount: number }[] = []
  const metas: MutationMeta[] = []
  mutate(api, XERO_REMITTANCE_ACTOR, metas, (s) => {
    let counters = s.counters
    const rmt = allocateId(counters, 'remittance')
    counters = rmt.counters
    remittanceId = rmt.id
    const bankLines = { ...s.xero.bankLines }
    const lineIds: string[] = []
    const unmatchedMetas: MutationMeta[] = []
    for (const line of resolved.value.lines) {
      const bkl = allocateId(counters, 'bankLine')
      counters = bkl.counters
      lineIds.push(bkl.id)
      const m = matchedBy.get(line.lineId)
      bankLines[bkl.id] = {
        id: bkl.id,
        remittanceId: rmt.id,
        quotedReference: line.quotedReference,
        amount: line.amount,
        status: m !== undefined ? 'matchedByAddOn' : 'unmatched',
        ...(m !== undefined ? { accRecId: m.accRecId } : {}),
      } satisfies XeroBankLine
      if (m !== undefined) toPay.push({ bankLineId: bkl.id, accRecId: m.accRecId, amount: m.amount })
      else unmatchedMetas.push({ entityType: 'xeroBankLine', entityId: bkl.id, action: 'xero.bankLineUnmatched', after: { quotedReference: line.quotedReference, amount: line.amount, remittanceId: rmt.id } })
    }
    const remittance: XeroRemittance = { id: rmt.id, payerContactId: resolved.value.payerContactId, receivedAtISO: clockISO(s.clock), reference: fixture.reference, lineIds }
    metas.push({ entityType: 'xeroRemittance', entityId: rmt.id, action: 'xero.remittanceReceived', after: { reference: fixture.reference, lines: lineIds.length, matched: toPay.length } }, ...unmatchedMetas)
    return { xero: { ...s.xero, remittances: { ...s.xero.remittances, [rmt.id]: remittance }, bankLines }, counters }
  })

  const result: BulkRemittanceResult = {
    remittanceId,
    matchedCount: toPay.length,
    matchedTotal: roundToCents(toPay.reduce((n, p) => n + p.amount, 0)),
    unmatchedCount: resolved.value.lines.length - toPay.length,
    receiptsRecorded: 0,
    queued: 0,
  }
  for (const p of toPay) {
    const out = deliverPaymentWebhook(api, { accRecId: p.accRecId, amount: p.amount, idempotencyKey: `REMIT-${remittanceId}-${p.bankLineId}` })
    if (out.ok && out.value.applied) result.receiptsRecorded += 1
    if (out.ok && out.value.queued === true) result.queued += 1
  }
  return ok(result)
}

/** Why the office cannot match this bank line to this ACCREC in Xero, or null. */
export function bankLineMatchRefusal(state: Pick<AppState, 'xero' | 'billing'>, bankLineId: string, accRecId: string): string | null {
  const line = state.xero.bankLines[bankLineId]
  if (line === undefined) return 'No such bank line'
  if (line.status !== 'unmatched') return 'This line is already matched'
  const remittance = state.xero.remittances[line.remittanceId]
  const rec = state.xero.accRecs[accRecId]
  if (rec === undefined) return 'Choose an invoice'
  if (remittance !== undefined && rec.contactId !== remittance.payerContactId) return 'That invoice is for a different contact'
  if (rec.status === 'voided') return 'Voided in Xero'
  if (toCents(line.amount) > toCents(xeroBalanceOf(state, accRecId))) return 'The line is more than the invoice balance'
  return null
}

/**
 * The office handles an unmatched line in Xero's bank reconciliation: it
 * matches the line to the payer's invoice, and the payment reaches the engine
 * through the ordinary webhook (once, keyed by the line).
 */
export function matchBankLineInXero(api: AppStoreApi, actor: Actor, bankLineId: string, accRecId: string): Outcome<{ invoiceNumber: string; amount: number; recorded: boolean; queued: boolean }> {
  const state = api.getState()
  const refusal = bankLineMatchRefusal(state, bankLineId, accRecId)
  if (refusal !== null) return refuse('bankLineMatchRefused', refusal)
  const line = state.xero.bankLines[bankLineId]!
  const rec = state.xero.accRecs[accRecId]!
  mutate(api, actor, { entityType: 'xeroBankLine', entityId: bankLineId, action: 'xero.bankLineMatched', before: { status: line.status }, after: { status: 'matchedByOffice', accRecId, invoiceNumber: rec.invoiceNumber, amount: line.amount } }, (s) => ({
    xero: { ...s.xero, bankLines: { ...s.xero.bankLines, [bankLineId]: { ...s.xero.bankLines[bankLineId]!, status: 'matchedByOffice', accRecId } } },
  }))
  const out = deliverPaymentWebhook(api, { accRecId, amount: line.amount, idempotencyKey: `REMIT-${line.remittanceId}-${bankLineId}` })
  return ok({ invoiceNumber: rec.invoiceNumber, amount: line.amount, recorded: out.ok && out.value.applied, queued: out.ok && out.value.queued === true })
}
