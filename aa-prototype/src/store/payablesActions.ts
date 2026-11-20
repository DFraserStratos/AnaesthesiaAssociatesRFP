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
 * `payablesDue` is the figure of what is due (the Ledger, the tiles, the
 * positions). What a weekly run may take is `runLegsFromLedger`
 * (`paymentCycleActions.ts`): the same legs, less anything an unsettled run
 * already holds.
 *
 * Since catch-up Phase 37 (US-09.2.4, FT-10.2, RV-40; OQ-111 answered, D53)
 * the payment is made in Xero, never here, and since catch-up Phase 39a only
 * through an approved, scheduled payment run: `runPayables` is the accountant
 * paying the oldest scheduled run in Xero (`payRunInXero`), and the engine
 * records each payment only when Xero reports it (`recordDisbursement`,
 * `recordOffset`). No code in this module writes a payable leg.
 */

import type { AnaesthetistId, PayableLeg, PayablesRun } from '../domain/types'
import { toCents } from '../domain/billing/money'
import { dueOn, isBookingPair, isHoldingLeg, payeeAnaesthetistOf } from '../domain/billing/ledger'
import { HOLDING_SYSTEM_ONLY } from '../domain/billing/prepayHolding'
import { ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { payRunInXero, XERO_PAYABLES_ACTOR, type PayBillsResult } from './xeroSimActions'
import {
  approveWeekBctis,
  closeWeek,
  openCycleDraft,
  PAYMENT_CYCLE_COPY,
  scheduledLineFor,
  sendPaymentSchedule,
  stagePairRun,
  weekRunInProgress,
  xeroSentOn,
} from './paymentCycleActions'

type CycleReadState = Pick<AppState, 'billing' | 'xero' | 'masters' | 'schedule' | 'clock' | 'appSettings'>

export interface PayablesRunResult {
  /** The payment run Xero paid. */
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
  /** Negatives netted against the bills (credit allocated in Xero) and how many allocations (catch-up Phase 39a). */
  netted: number
  nettedCount: number
  /** Syncs waiting in the Xero sync queue (outage). */
  queued: number
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
  /** Only these pairs and transfers. */
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

function resultOf(runId: string, v: PayBillsResult, paidIds: string[]): PayablesRunResult {
  return {
    payablesRunId: runId,
    billsPaid: v.paid.length,
    totalPaid: v.totalPaid,
    disbursedCount: v.recordedCount,
    totalDisbursed: v.totalRecorded,
    paidIds,
    skippedNotInXero: v.skipped,
    netted: v.totalAllocated,
    nettedCount: v.allocations.length,
    queued: v.paid.filter((p) => p.queued).length + v.allocations.filter((a) => a.queued).length,
  }
}

/** The oldest run with lines Xero has still to pay: scheduled, or paying with something unsent. */
export function nextRunToPay(state: Pick<AppState, 'billing' | 'xero'>): PayablesRun | undefined {
  return Object.values(state.billing.payablesRuns)
    .filter((r) => r.status === 'scheduled' || (r.status === 'paying' && r.lines.some((l) => l.heldOut === undefined && toCents(l.amount) > toCents(xeroSentOn(state, r, l)))))
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))[0]
}

/**
 * "Run payables in Xero" (the Billing monitor's badged simulated-Xero button:
 * the accountant paying the schedule): Xero pays the oldest scheduled run,
 * netting included, and the engine records each payment when Xero reports
 * it. Nothing else is paid: a released payable not on an approved, scheduled
 * run waits (the gate, US-10.2.6). A Xero-side action audited with the Xero
 * actor; the caller's actor is not the payer.
 */
export function runPayables(api: AppStoreApi, _actor: Actor, opts: { webhook?: 'deliver' | 'missed' } = {}): Outcome<PayablesRunResult> {
  const run = nextRunToPay(api.getState())
  if (run === undefined) return refuse('nothingScheduled', PAYMENT_CYCLE_COPY.nothingScheduled)
  const paid = payRunInXero(api, XERO_PAYABLES_ACTOR, run.id, { webhook: opts.webhook ?? 'deliver' })
  if (!paid.ok) return paid
  return ok(resultOf(run.id, paid.value, run.lines.filter((l) => l.heldOut === undefined).map((l) => l.pairId)))
}

/** Why one payable cannot be paid on its own now, or null (the Xero pair's single payout). */
export function disbursePayableRefusal(state: Pick<AppState, 'billing' | 'xero'>, pairId: string): { code: string; message: string } | null {
  const pair = state.billing.ledger[pairId]
  const transfer = state.billing.transfers[pairId]
  if (pair === undefined && transfer === undefined) return { code: 'notFound', message: 'Payable not found.' }
  if (pair !== undefined && (!isBookingPair(pair) || pair.payable === undefined)) return { code: 'noPayable', message: 'This invoice has no payable.' }
  if (pair !== undefined && isBookingPair(pair) && pair.payable !== undefined && isHoldingLeg(pair.payable)) return { code: 'holdingSystemOnly', message: HOLDING_SYSTEM_ONLY }
  const on = scheduledLineFor(state, pairId)
  if (on === undefined) return { code: 'notApproved', message: PAYMENT_CYCLE_COPY.notApproved }
  if (on.run.nettings.some((n) => n.allocations.some((a) => a.pairId === pairId))) return { code: 'useRun', message: PAYMENT_CYCLE_COPY.useRun }
  return null
}

/**
 * Pay one pair's (or transfer's) payable in Xero, only as an unheld line of a
 * scheduled run (the gate), and refused `useRun` when a negative is netted
 * against that bill (netting applies only in a whole run). A payable to the AA
 * Holding account is refused: money leaves the account only by a transfer or
 * refund the system raises (catch-up Phase 27a; US-06.5.1, D38, D53).
 */
export function disbursePayable(api: AppStoreApi, _actor: Actor, pairId: string, opts: { webhook?: 'deliver' | 'missed' } = {}): Outcome<PayablesRunResult> {
  const state = api.getState()
  const refusal = disbursePayableRefusal(state, pairId)
  if (refusal !== null) return refuse(refusal.code, refusal.message)
  const on = scheduledLineFor(state, pairId)!
  const paid = payRunInXero(api, XERO_PAYABLES_ACTOR, on.run.id, { webhook: opts.webhook ?? 'deliver', onlyPairIds: [pairId] })
  if (!paid.ok) return paid
  return ok(resultOf(on.run.id, paid.value, [pairId]))
}

/**
 * The one-click demo payouts (no back door; catch-up Phase 39a): the office
 * approves a one-line staged run for this pair in the demo clock's week
 * (closed, approved and scheduled in one mutate, as `OFFICE_SIMULATION_ACTOR`
 * by default) and Xero pays it, webhook delivered. Refuses a pair already in
 * an unsettled run (`useRun`), the AA Holding account, and a pair with
 * nothing released and unpaid (`nothingToApprove`).
 */
export function approveAndPayPairForDemo(api: AppStoreApi, actor: Actor, pairId: string, opts: { webhook?: 'deliver' | 'missed' } = {}): Outcome<PayablesRunResult & { cycleId: string }> {
  const pair = api.getState().billing.ledger[pairId]
  if (pair !== undefined && isBookingPair(pair) && pair.payable !== undefined && isHoldingLeg(pair.payable)) return refuse('holdingSystemOnly', HOLDING_SYSTEM_ONLY)
  const staged = stagePairRun(api, actor, pairId)
  if (!staged.ok) return staged
  const paid = payRunInXero(api, XERO_PAYABLES_ACTOR, staged.value.runId, { webhook: opts.webhook ?? 'deliver' })
  if (!paid.ok) return paid
  return ok({ ...resultOf(staged.value.runId, paid.value, [pairId]), cycleId: staged.value.cycleId })
}

export const OFFICE_CYCLE_COPY = {
  nothingDue: 'Nothing due to pay out',
  anomaly: 'An anomaly needs the office',
} as const

/** Why the office's whole weekly cycle cannot run now, or null (the PWA stand-in's disabled state). */
export function officeRunsCycleRefusal(state: CycleReadState): string | null {
  const inProgress = weekRunInProgress(state)
  if (inProgress !== undefined) {
    if (inProgress.status === 'closed' && inProgress.anomalies.some((a) => a.status === 'open')) return OFFICE_CYCLE_COPY.anomaly
    return null
  }
  if (nextRunToPay(state) !== undefined) return null
  return openCycleDraft(state).lines.length > 0 ? null : OFFICE_CYCLE_COPY.nothingDue
}

/**
 * The office runs this week's payment cycle end to end (the PWA stand-in;
 * tests): close the open week (or carry on with the one in progress),
 * approve its BCTIs, send the schedule, then Xero pays it with the webhook
 * delivered. It never holds or fixes an anomaly on the office's behalf.
 */
export function runThisWeeksCycle(api: AppStoreApi, actor: Actor, opts: { webhook?: 'deliver' | 'missed' } = {}): Outcome<PayablesRunResult & { cycleId: string }> {
  const refusal = officeRunsCycleRefusal(api.getState())
  if (refusal !== null) return refuse(refusal === OFFICE_CYCLE_COPY.anomaly ? 'anomaliesOpen' : 'nothingDue', refusal)
  let run = weekRunInProgress(api.getState())
  if (run === undefined && nextRunToPay(api.getState()) === undefined) {
    const closed = closeWeek(api, actor)
    if (!closed.ok) return closed
    run = api.getState().billing.payablesRuns[closed.value.runId]!
    if (run.anomalies.some((a) => a.status === 'open')) return refuse('anomaliesOpen', OFFICE_CYCLE_COPY.anomaly)
  }
  if (run !== undefined && run.status === 'closed') {
    const approved = approveWeekBctis(api, actor, run.id)
    if (!approved.ok) return approved
  }
  if (run !== undefined && api.getState().billing.payablesRuns[run.id]!.status === 'approved') {
    const sent = sendPaymentSchedule(api, actor, run.id)
    if (!sent.ok) return sent
  }
  const target = run ?? nextRunToPay(api.getState())!
  const out = runPayables(api, actor, opts)
  if (!out.ok) return out
  return ok({ ...out.value, cycleId: api.getState().billing.payablesRuns[target.id]?.cycleId ?? '' })
}
