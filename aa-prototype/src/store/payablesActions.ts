/**
 * Payables (Phase 10; WI4, X5): what the ledger owes anaesthetists and has
 * released, the second of the RFP's two separately tracked money states.
 *
 * Since catch-up Phase 36 it is computed from the LEDGER's payable legs
 * (US-08.3.2, US-10.1.2), never from `state.xero`: each anaesthetist payable
 * on a Booking pair and each transfer's `in` leg to the anaesthetist who did
 * the List is due what it has released less what it has paid out. A payable
 * to the AA Holding account is never due and never paid: money leaves the
 * account only by a transfer or a refund the system raises (27a). AA's own fee
 * is never netted (16): an `aaFee` pair has no payable.
 *
 * `payablesDue` is the ONE source of what is due: the Billing monitor's
 * read-only list and Phase 39a's weekly run read it, with no second copy.
 *
 * Since catch-up Phase 37 (US-09.2.4, FT-10.2, RV-40; OQ-111 answered, D53)
 * the payment is made in Xero, never here: `runPayables` is the simulated Xero
 * payables run over the legs due (`payBillsInXero`, Xero side), and the
 * engine records each disbursement only when Xero reports the bill paid
 * (`recordDisbursement`). No code in this module writes a payable leg.
 */

import type { AnaesthetistId, PayableLeg } from '../domain/types'
import { toCents } from '../domain/billing/money'
import { dueOn, isBookingPair, isHoldingLeg, payeeAnaesthetistOf } from '../domain/billing/ledger'
import { HOLDING_SYSTEM_ONLY } from '../domain/billing/prepayHolding'
import { ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { payBillsInXero, XERO_PAYABLES_ACTOR, type XeroBill } from './xeroSimActions'

export interface PayablesRunResult {
  /** The Xero payables run, when any bill was paid. */
  payablesRunId?: string
  /** Bills Xero paid. */
  billsPaid: number
  totalPaid: number
  /** Disbursements the engine recorded from the bill-paid webhooks (fewer during an outage: those queue). */
  disbursedCount: number
  totalDisbursed: number
  /** The pairs and transfers whose bills Xero paid. */
  paidIds: string[]
  /** Legs released but with no Xero bill to pay (not handed off yet, or a transfer whose journal waits); skipped and counted. */
  skippedNotInXero: number
}

export interface PayablesDueRow {
  anaesthetistId: AnaesthetistId
  count: number
  /** Signed: Phase 39a's negative legs net here. */
  total: number
}

export interface PayablesDue {
  count: number
  total: number
  /** Per stamped payee, roster-agnostic, by id. Never a row for the AA Holding account. */
  byAnaesthetist: PayablesDueRow[]
}

export interface PayablesFilter {
  /** One anaesthetist's legs only. */
  anaesthetistId?: AnaesthetistId
  /** Only these pairs and transfers (Phase 39a holds anomalies out of a cycle with this). */
  only?: readonly string[]
}

/** One payable leg with something released and not yet paid out: its owner (a pair or transfer) and the leg. */
export interface DueLeg {
  id: string
  kind: 'pair' | 'transfer'
  anaesthetistId: AnaesthetistId
  leg: PayableLeg
}

/** Every anaesthetist payable leg in the ledger: Booking pairs' and transfers' `in` legs, never the AA Holding account's. */
function legsOf(state: Pick<AppState, 'billing'>, filter: PayablesFilter = {}): DueLeg[] {
  const only = filter.only !== undefined ? new Set(filter.only) : undefined
  const legs: DueLeg[] = []
  for (const pair of Object.values(state.billing.ledger)) {
    if (!isBookingPair(pair) || pair.payable === undefined || isHoldingLeg(pair.payable)) continue
    const anaesthetistId = payeeAnaesthetistOf(pair.payable)!
    legs.push({ id: pair.id, kind: 'pair', anaesthetistId, leg: pair.payable })
  }
  for (const t of Object.values(state.billing.transfers)) {
    const anaesthetistId = payeeAnaesthetistOf(t.in)
    if (anaesthetistId !== undefined) legs.push({ id: t.id, kind: 'transfer', anaesthetistId, leg: t.in })
  }
  return legs
    .filter((l) => (filter.anaesthetistId === undefined || l.anaesthetistId === filter.anaesthetistId) && (only === undefined || only.has(l.id)))
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** The legs authorised and awaiting Xero's payables run (released, not yet paid out), in id order: the monitor's read-only list. */
export function payableLegsDue(state: Pick<AppState, 'billing'>, filter: PayablesFilter = {}): DueLeg[] {
  return legsOf(state, filter).filter((l) => toCents(dueOn(l.leg)) > 0)
}

/** The payables due right now, from the ledger alone: count, total and per payee. */
export function payablesDue(state: Pick<AppState, 'billing'>, filter: PayablesFilter = {}): PayablesDue {
  let count = 0
  let cents = 0
  const by = new Map<string, { count: number; cents: number }>()
  for (const l of legsOf(state, filter)) {
    const due = toCents(dueOn(l.leg))
    if (due === 0) continue
    // Signed: a negative leg (Phase 39a) nets against the payee's positive ones; only positive legs count as payables to pay.
    if (due > 0) count += 1
    cents += due
    const row = by.get(l.anaesthetistId) ?? { count: 0, cents: 0 }
    if (due > 0) row.count += 1
    row.cents += due
    by.set(l.anaesthetistId, row)
  }
  return {
    count,
    total: cents / 100,
    byAnaesthetist: [...by.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([anaesthetistId, r]) => ({ anaesthetistId, count: r.count, total: r.cents / 100 })),
  }
}

/** The Xero bill behind a due leg: its pair's ACCPAY, or the transfer itself; none when not in Xero yet. */
function billFor(l: DueLeg): XeroBill | undefined {
  if (l.kind === 'transfer') return { transferId: l.id }
  return l.leg.xeroAccPayId !== undefined ? { accPayId: l.leg.xeroAccPayId } : undefined
}

/** Run Xero's payables run (simulated) over the given due legs, the bill-paid webhook delivered. */
function payInXero(api: AppStoreApi, legs: readonly DueLeg[]): Outcome<PayablesRunResult> {
  const result: PayablesRunResult = { billsPaid: 0, totalPaid: 0, disbursedCount: 0, totalDisbursed: 0, paidIds: [], skippedNotInXero: 0 }
  const bills: XeroBill[] = []
  const idOfBill = new Map<string, string>()
  for (const l of legs) {
    const bill = billFor(l)
    if (bill === undefined) {
      result.skippedNotInXero += 1
      continue
    }
    bills.push(bill)
    idOfBill.set('accPayId' in bill ? bill.accPayId : bill.transferId, l.id)
  }
  if (bills.length === 0) return ok(result)
  const paid = payBillsInXero(api, XERO_PAYABLES_ACTOR, bills, { webhook: 'deliver' })
  if (!paid.ok) return paid
  const v = paid.value
  // A transfer whose journal still waits for Xero has no bill Xero can pay yet.
  result.skippedNotInXero += bills.length - v.paid.length
  return ok({
    ...result,
    ...(v.payablesRunId !== undefined ? { payablesRunId: v.payablesRunId } : {}),
    billsPaid: v.paid.length,
    totalPaid: v.totalPaid,
    disbursedCount: v.recordedCount,
    totalDisbursed: v.totalRecorded,
    paidIds: v.paid.map((p) => idOfBill.get('accPayId' in p.bill ? p.bill.accPayId : p.bill.transferId)!),
  })
}

/**
 * "Run payables in Xero" (the Billing monitor's badged simulated-Xero button,
 * and the PWA's office stand-in): Xero's payables run pays every bill due, or
 * one anaesthetist's, or a chosen subset, and the engine records each
 * disbursement from the bill-paid webhook. A Xero-side action audited with the
 * Xero actor, so no office-only guard; the caller's actor is not the payer.
 */
export function runPayables(api: AppStoreApi, _actor: Actor, filter: PayablesFilter = {}): Outcome<PayablesRunResult> {
  return payInXero(api, payableLegsDue(api.getState(), filter))
}

/**
 * Pay one pair's (or transfer's) payable in Xero: the Xero simulation's
 * in-page shortcut. A payable to the AA Holding account is refused: money
 * leaves the account only by a transfer or refund the system raises (catch-up
 * Phase 27a; US-06.5.1, D38, D53).
 */
export function disbursePayable(api: AppStoreApi, _actor: Actor, pairId: string): Outcome<PayablesRunResult> {
  const state = api.getState()
  const pair = state.billing.ledger[pairId]
  const transfer = state.billing.transfers[pairId]
  if (pair === undefined && transfer === undefined) return refuse('notFound', 'Payable not found.')
  if (pair !== undefined && (!isBookingPair(pair) || pair.payable === undefined)) return refuse('noPayable', 'This invoice has no payable.')
  if (pair !== undefined && isBookingPair(pair) && pair.payable !== undefined && isHoldingLeg(pair.payable)) return refuse('holdingSystemOnly', HOLDING_SYSTEM_ONLY)
  return payInXero(api, payableLegsDue(state, { only: [pairId] }))
}
