/**
 * The weekly payment cycle in the store (catch-up Phase 39a; US-10.2.7,
 * US-10.2.6, US-10.2.5): close, the check day's holds, approval and the gate,
 * the schedule, paying it in Xero with netting, the staged one-pair runs, the
 * stale run, idempotency and conservation.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList } from './lifecycle'
import { wireBillingRun } from './billingRun'
import { receivePayment } from './paymentActions'
import { approveAndPayPairForDemo, disbursePayable, runPayables, runThisWeeksCycle } from './payablesActions'
import { payBillsInXero, XERO_PAYABLES_ACTOR } from './xeroSimActions'
import { runReconciliationPoll } from './reconciliationPoll'
import { setXeroOutage, wireXeroQueue } from './xeroQueue'
import { anaesthetistsOutOfBalanceOf, ledgerPositionOf, pairsForList } from './ledgerSelectors'
import { DEMO_TRIGGER_ACTOR, OFFICE_ACTOR, OFFICE_SIMULATION_ACTOR } from './demoActors'
import {
  approveWeekBctis,
  closeWeek,
  holdOutOfRun,
  markAnomalyFixed,
  openCycle,
  openCycleDraft,
  paymentWeekFor,
  PAYMENT_CYCLE_COPY,
  recloseWeek,
  releaseHold,
  sendPaymentSchedule,
  unsettledRuns,
} from './paymentCycleActions'
import { stageBankMismatch, stageBankMismatchRefusal, stagePaymentWeek, stagePaymentWeekRefusal, PAYMENT_WEEK_COPY } from './paymentWeekDemo'
import { anaesthetistLedgerPosition } from './ledgerSelectors'
import { remittanceAdvice } from '../domain/billing/payablesRun'
import { ANAE } from '../domain/seed'
import { projectedListId } from '../domain/slots'
import { roundToCents, toCents } from '../domain/billing/money'
import { isBookingPair, settledOn } from '../domain/billing/ledger'
import type { BookingLedgerPair } from '../domain/types'

const AM20 = projectedListId(ANAE.souter, '2026-11-23', 'AM')
const ANAESTHETIST: typeof OFFICE_ACTOR = { who: 'Dr Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }

const unwires: (() => void)[] = []
afterEach(() => {
  while (unwires.length > 0) unwires.pop()!()
})

function setup(): { api: BoundAppStore; pairs: BookingLedgerPair[] } {
  const api = createAppStore()
  unwires.push(wireBillingRun(api), wireXeroQueue(api))
  expect(authoriseList(api, OFFICE_ACTOR, AM20).ok).toBe(true)
  const pairs = pairsForList(api.getState(), AM20).filter((p) => p.kind === 'procedure' && p.payable !== undefined && p.receivable.xeroAccRecId !== undefined)
  expect(pairs.length).toBeGreaterThanOrEqual(2)
  return { api, pairs }
}

function pay(api: BoundAppStore, pair: BookingLedgerPair, fraction: number, key: string): number {
  const amount = roundToCents(pair.receivable.amount * fraction)
  expect(receivePayment(api, { accRecId: pair.receivable.xeroAccRecId!, amount, idempotencyKey: key, source: 'webhook' }).ok).toBe(true)
  return amount
}

function leg(api: BoundAppStore, pairId: string) {
  const p = api.getState().billing.ledger[pairId]!
  return isBookingPair(p) ? p.payable! : undefined
}

function conserved(api: BoundAppStore): void {
  for (const p of Object.values(api.getState().billing.ledger)) {
    if (!isBookingPair(p) || p.payable === undefined) continue
    expect(toCents(settledOn(p.payable)), p.id).toBeLessThanOrEqual(toCents(p.payable.releasedAmount))
  }
  expect(ledgerPositionOf(api.getState()).imbalance).toBe(0)
  expect(anaesthetistsOutOfBalanceOf(api.getState())).toEqual([])
}

describe('the open week (US-10.2.7)', () => {
  it('opens on Week 48 with nothing waiting on a fresh seed; closing refuses', () => {
    const api = createAppStore()
    expect(openCycle(api.getState()).cycleId).toBe('2026-W48')
    expect(openCycleDraft(api.getState()).lines).toEqual([])
    expect(closeWeek(api, OFFICE_ACTOR)).toMatchObject({ ok: false, code: 'nothingToClose', message: PAYMENT_CYCLE_COPY.nothingToClose })
  })

  it('every step needs the office', () => {
    const { api, pairs } = setup()
    pay(api, pairs[0]!, 1, 'P1')
    expect(closeWeek(api, ANAESTHETIST)).toMatchObject({ ok: false, code: 'officeOnly' })
    const closed = closeWeek(api, OFFICE_ACTOR)
    expect(closed.ok).toBe(true)
    const runId = closed.ok ? closed.value.runId : ''
    expect(approveWeekBctis(api, ANAESTHETIST, runId)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(sendPaymentSchedule(api, ANAESTHETIST, runId)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(holdOutOfRun(api, ANAESTHETIST, runId, { pairId: pairs[0]!.id, reason: 'x' })).toMatchObject({ ok: false, code: 'officeOnly' })
  })
})

describe('close, approve, schedule, pay (the gate, US-10.2.6)', () => {
  it('a released payable is paid only in an approved, scheduled run, and every payment shows its week', () => {
    const { api, pairs } = setup()
    const half = pay(api, pairs[0]!, 0.5, 'HALF')
    // Not yet in an approved run: every payout path refuses.
    expect(disbursePayable(api, OFFICE_ACTOR, pairs[0]!.id)).toMatchObject({ ok: false, code: 'notApproved' })
    expect(runPayables(api, OFFICE_ACTOR)).toMatchObject({ ok: false, code: 'nothingScheduled' })
    expect(payBillsInXero(api, XERO_PAYABLES_ACTOR, [{ accPayId: pairs[0]!.payable!.xeroAccPayId! }], { webhook: 'deliver', runId: 'PR0099' })).toMatchObject({ ok: false, code: 'notApproved' })

    const closed = closeWeek(api, OFFICE_ACTOR)
    expect(closed).toMatchObject({ ok: true, value: { cycleId: '2026-W48', anomalies: 0 } })
    const runId = closed.ok ? closed.value.runId : ''
    const run = api.getState().billing.payablesRuns[runId]!
    expect(run.lines.map((l) => [l.pairId, l.amount])).toEqual([[pairs[0]!.id, half]])
    expect(run.snapshot.imbalance).toBe(0)
    // Out of order: send and pay before approval refuse.
    expect(sendPaymentSchedule(api, OFFICE_ACTOR, runId)).toMatchObject({ ok: false, code: 'notApproved' })
    expect(disbursePayable(api, OFFICE_ACTOR, pairs[0]!.id)).toMatchObject({ ok: false, code: 'notApproved' })
    expect(approveWeekBctis(api, OFFICE_ACTOR, runId).ok).toBe(true)
    expect(runPayables(api, OFFICE_ACTOR)).toMatchObject({ ok: false, code: 'nothingScheduled' })
    expect(sendPaymentSchedule(api, OFFICE_ACTOR, runId).ok).toBe(true)
    // A second press of each step is refused, never doubled.
    expect(approveWeekBctis(api, OFFICE_ACTOR, runId).ok).toBe(false)
    expect(sendPaymentSchedule(api, OFFICE_ACTOR, runId).ok).toBe(false)

    const paid = runPayables(api, OFFICE_ACTOR)
    expect(paid).toMatchObject({ ok: true, value: { payablesRunId: runId, billsPaid: 1, totalPaid: half, disbursedCount: 1 } })
    expect(api.getState().billing.payablesRuns[runId]!.status).toBe('paid')
    expect(leg(api, pairs[0]!.id)!.disbursedAmount).toBe(half)
    const ld = Object.values(api.getState().billing.disbursements).find((d) => d.pairId === pairs[0]!.id)!
    expect(paymentWeekFor(api.getState(), ld.payablesRunId)).toBe('Week 48')
    // Pressing Run again pays nothing more.
    expect(runPayables(api, OFFICE_ACTOR)).toMatchObject({ ok: false, code: 'nothingScheduled' })
    conserved(api)

    // The balance received now waits for Week 31, never Week 30's run.
    pay(api, pairs[0]!, 0.5, 'REST')
    expect(openCycle(api.getState()).cycleId).toBe('2026-W49')
    const out = runThisWeeksCycle(api, OFFICE_ACTOR)
    expect(out).toMatchObject({ ok: true, value: { cycleId: '2026-W49' } })
    expect(leg(api, pairs[0]!.id)!.disbursedAmount).toBe(pairs[0]!.receivable.amount)
    conserved(api)
  })

  it('a payable released after the close is in the next week, and the next week cannot close until this one is sent', () => {
    const { api, pairs } = setup()
    pay(api, pairs[0]!, 1, 'A')
    const closed = closeWeek(api, OFFICE_ACTOR)
    const runId = closed.ok ? closed.value.runId : ''
    pay(api, pairs[1]!, 1, 'B')
    expect(closeWeek(api, OFFICE_ACTOR)).toMatchObject({ ok: false, code: 'previousWeekOpen', message: "Finish Week 48's run first." })
    expect(api.getState().billing.payablesRuns[runId]!.lines.map((l) => l.pairId)).toEqual([pairs[0]!.id])
    approveWeekBctis(api, OFFICE_ACTOR, runId)
    sendPaymentSchedule(api, OFFICE_ACTOR, runId)
    runPayables(api, OFFICE_ACTOR)
    expect(openCycleDraft(api.getState()).lines.map((l) => l.pairId)).toEqual([pairs[1]!.id])
    conserved(api)
  })
})

describe('the check day: holds roll forward (US-10.2.7 second criterion)', () => {
  it('a held line is out of this run, and the next close holds it tagged rolled', () => {
    const { api, pairs } = setup()
    pay(api, pairs[0]!, 1, 'A')
    pay(api, pairs[1]!, 1, 'B')
    const closed = closeWeek(api, OFFICE_ACTOR)
    const runId = closed.ok ? closed.value.runId : ''
    expect(holdOutOfRun(api, OFFICE_ACTOR, runId, { pairId: pairs[1]!.id, reason: '  ' })).toMatchObject({ ok: false, code: 'reasonRequired' })
    expect(holdOutOfRun(api, OFFICE_ACTOR, runId, { pairId: pairs[1]!.id, reason: 'Payer queried it' }).ok).toBe(true)
    let run = api.getState().billing.payablesRuns[runId]!
    expect(run.byAnaesthetist[0]).toMatchObject({ bctiCount: 1, positives: pairs[0]!.receivable.amount })
    // Returned, then held again.
    expect(releaseHold(api, OFFICE_ACTOR, runId, pairs[1]!.id).ok).toBe(true)
    expect(api.getState().billing.payablesRuns[runId]!.byAnaesthetist[0]!.bctiCount).toBe(2)
    holdOutOfRun(api, OFFICE_ACTOR, runId, { pairId: pairs[1]!.id, reason: 'Payer queried it' })
    approveWeekBctis(api, OFFICE_ACTOR, runId)
    sendPaymentSchedule(api, OFFICE_ACTOR, runId)
    runPayables(api, OFFICE_ACTOR)
    expect(leg(api, pairs[1]!.id)!.disbursedAmount).toBe(0)
    run = api.getState().billing.payablesRuns[runId]!
    expect(run.status).toBe('paid')
    const next = openCycleDraft(api.getState())
    expect(next.cycle.cycleId).toBe('2026-W49')
    expect(next.lines).toEqual([expect.objectContaining({ pairId: pairs[1]!.id, rolledFromRunId: runId })])
    conserved(api)
  })

  it('approval refuses while an anomaly is open; held or fixed it goes on', () => {
    const { api, pairs } = setup()
    pay(api, pairs[0]!, 1, 'A')
    // The bank download is missing this receipt.
    const line = Object.values(api.getState().billing.bankLines).find((b) => b.reference === pairs[0]!.receivable.number)!
    api.setState((s) => ({ billing: { ...s.billing, bankLines: { ...s.billing.bankLines, [line.id]: { ...line, removedByDemo: true } } } }))
    const closed = closeWeek(api, OFFICE_ACTOR)
    expect(closed).toMatchObject({ ok: true, value: { anomalies: 1 } })
    const runId = closed.ok ? closed.value.runId : ''
    const anomaly = api.getState().billing.payablesRuns[runId]!.anomalies[0]!
    expect(anomaly).toMatchObject({ kind: 'receiptNotOnBank', pairIds: [pairs[0]!.id], status: 'open' })
    expect(approveWeekBctis(api, OFFICE_ACTOR, runId)).toMatchObject({ ok: false, code: 'anomaliesOpen', message: PAYMENT_CYCLE_COPY.anomaliesOpen })
    expect(runThisWeeksCycle(api, OFFICE_SIMULATION_ACTOR)).toMatchObject({ ok: false, message: 'An anomaly needs the office' })
    expect(markAnomalyFixed(api, OFFICE_ACTOR, runId, anomaly.id).ok).toBe(true)
    expect(approveWeekBctis(api, OFFICE_ACTOR, runId).ok).toBe(true)
  })

  it('holding every line: approval closes the week with nothing to pay, and the next week takes the line rolled (never a dead end)', () => {
    const { api, pairs } = setup()
    pay(api, pairs[0]!, 1, 'A')
    const closed = closeWeek(api, OFFICE_ACTOR)
    const runId = closed.ok ? closed.value.runId : ''
    holdOutOfRun(api, OFFICE_ACTOR, runId, { pairId: pairs[0]!.id, reason: 'Wait' })
    expect(approveWeekBctis(api, OFFICE_ACTOR, runId).ok).toBe(true)
    expect(api.getState().billing.payablesRuns[runId]!.status).toBe('paid')
    expect(leg(api, pairs[0]!.id)!.disbursedAmount).toBe(0)
    const next = closeWeek(api, OFFICE_ACTOR)
    expect(next).toMatchObject({ ok: true, value: { cycleId: '2026-W49' } })
    expect(api.getState().billing.payablesRuns[next.ok ? next.value.runId : '']!.lines).toEqual([expect.objectContaining({ pairId: pairs[0]!.id, rolledFromRunId: runId })])
  })
})

describe('staged one-pair runs (the demo payouts, no back door)', () => {
  it('approves and pays only its pair, in this week, and refuses a pair already in an unsettled run', () => {
    const { api, pairs } = setup()
    pay(api, pairs[0]!, 1, 'A')
    pay(api, pairs[1]!, 1, 'B')
    const out = approveAndPayPairForDemo(api, OFFICE_SIMULATION_ACTOR, pairs[0]!.id)
    expect(out).toMatchObject({ ok: true, value: { cycleId: '2026-W48', billsPaid: 1 } })
    const staged = api.getState().billing.payablesRuns[out.ok ? out.value.payablesRunId! : '']!
    expect(staged).toMatchObject({ kind: 'staged', status: 'paid', approvedBy: { who: OFFICE_SIMULATION_ACTOR.who } })
    expect(leg(api, pairs[1]!.id)!.disbursedAmount).toBe(0)
    // The week's run never takes what the staged run paid.
    expect(openCycleDraft(api.getState()).lines.map((l) => l.pairId)).toEqual([pairs[1]!.id])
    const closed = closeWeek(api, OFFICE_ACTOR)
    expect(approveAndPayPairForDemo(api, OFFICE_SIMULATION_ACTOR, pairs[1]!.id)).toMatchObject({ ok: false, code: 'useRun' })
    expect(closed.ok).toBe(true)
    conserved(api)
  })
})

describe('the stale run', () => {
  it('a new release does not make a run stale; re-close supersedes and keeps the holds', () => {
    const { api, pairs } = setup()
    pay(api, pairs[0]!, 0.5, 'A')
    pay(api, pairs[1]!, 1, 'B')
    const closed = closeWeek(api, OFFICE_ACTOR)
    const runId = closed.ok ? closed.value.runId : ''
    holdOutOfRun(api, OFFICE_ACTOR, runId, { pairId: pairs[1]!.id, reason: 'Check' })
    // More released after the close belongs to next week: the run is not stale.
    pay(api, pairs[0]!, 0.5, 'A2')
    expect(approveWeekBctis(api, OFFICE_ACTOR, runId).ok).toBe(true)
    const re = recloseWeek(api, OFFICE_ACTOR, runId)
    expect(re.ok).toBe(true)
    const fresh = api.getState().billing.payablesRuns[re.ok ? re.value.runId : '']!
    expect(api.getState().billing.payablesRuns[runId]).toMatchObject({ status: 'superseded', supersededBy: fresh.id })
    expect(fresh.cycleId).toBe('2026-W48')
    expect(fresh.lines.find((l) => l.pairId === pairs[1]!.id)?.heldOut?.reason).toBe('Check')
    expect(unsettledRuns(api.getState()).map((r) => r.id)).toEqual([fresh.id])
  })
})

describe('Xero outage and the poll', () => {
  it('an outage queues the syncs; the restore records each once and the run completes', () => {
    const { api, pairs } = setup()
    pay(api, pairs[0]!, 1, 'A')
    const closed = closeWeek(api, OFFICE_ACTOR)
    const runId = closed.ok ? closed.value.runId : ''
    approveWeekBctis(api, OFFICE_ACTOR, runId)
    sendPaymentSchedule(api, OFFICE_ACTOR, runId)
    setXeroOutage(api, DEMO_TRIGGER_ACTOR, true)
    expect(runPayables(api, OFFICE_ACTOR)).toMatchObject({ ok: true, value: { billsPaid: 1, disbursedCount: 0, queued: 1 } })
    expect(api.getState().billing.payablesRuns[runId]!.status).toBe('paying')
    setXeroOutage(api, DEMO_TRIGGER_ACTOR, false)
    expect(api.getState().billing.payablesRuns[runId]!.status).toBe('paid')
    expect(Object.values(api.getState().billing.disbursements).filter((d) => d.pairId === pairs[0]!.id)).toHaveLength(1)
    expect(runReconciliationPoll(api)).toMatchObject({ disbursements: 0, offsets: 0 })
    conserved(api)
  })

  it('a missed webhook leaves the run paying until the poll', () => {
    const { api, pairs } = setup()
    pay(api, pairs[0]!, 1, 'A')
    const closed = closeWeek(api, OFFICE_ACTOR)
    const runId = closed.ok ? closed.value.runId : ''
    approveWeekBctis(api, OFFICE_ACTOR, runId)
    sendPaymentSchedule(api, OFFICE_ACTOR, runId)
    runPayables(api, OFFICE_ACTOR, { webhook: 'missed' })
    expect(api.getState().billing.payablesRuns[runId]!.status).toBe('paying')
    expect(runPayables(api, OFFICE_ACTOR)).toMatchObject({ ok: false, code: 'nothingScheduled' })
    expect(runReconciliationPoll(api).disbursements).toBe(1)
    expect(api.getState().billing.payablesRuns[runId]!.status).toBe('paid')
    // (The poll also lands the seed's missed-webhook payment, a new release for next week.)
    expect(leg(api, pairs[0]!.id)!.disbursedAmount).toBe(pairs[0]!.receivable.amount)
  })
})

describe('US-10.2.5: netting in the weekly run (Stage a payment week)', () => {
  function staged(choice: 'bctis' | 'withCredit') {
    const api = createAppStore()
    unwires.push(wireBillingRun(api), wireXeroQueue(api))
    const out = stagePaymentWeek(api, DEMO_TRIGGER_ACTOR, choice)
    expect(out.ok, out.ok ? '' : out.message).toBe(true)
    return { api, out: out.ok ? out.value : undefined }
  }

  it('19 positives and one negative are paid as one net amount; the negative is netted and the ledger balances', () => {
    const { api, out } = staged('withCredit')
    expect(out).toMatchObject({ released: 19, negative: 365.7 })
    expect(stagePaymentWeekRefusal(api.getState())).toBe(PAYMENT_WEEK_COPY.already)
    // Set aside the seed's own credit, Heather Sinclair's (`HS` ids, catch-up Phase 40, D24).
    const negative = Object.values(api.getState().billing.negativeInvoices).find((n) => !n.id.startsWith('HS'))!
    expect(negative).toMatchObject({ status: 'toNet', recoveryDue: 365.7, anaesthetistId: ANAE.sharma })
    expect(negative.accPayCreditNoteId).toBeDefined()
    // Netted while waiting: the draft nets it already.
    const draft = openCycleDraft(api.getState())
    const sharma = draft.byAnaesthetist.find((t) => t.anaesthetistId === ANAE.sharma)!
    expect(sharma).toMatchObject({ bctiCount: 19, netted: 365.7, remainingToNet: 0 })
    const positives = sharma.positives
    const cashBefore = ledgerPositionOf(api.getState()).disbursed

    const ran = runThisWeeksCycle(api, OFFICE_ACTOR)
    expect(ran).toMatchObject({ ok: true, value: { cycleId: '2026-W48', billsPaid: 19, netted: 365.7 } })
    const runId = ran.ok ? ran.value.payablesRunId! : ''
    const run = api.getState().billing.payablesRuns[runId]!
    expect(run.status).toBe('paid')
    // Cash out equals the net; the negative is netted; Dr Sharma has nothing left to net.
    expect(roundToCents(ledgerPositionOf(api.getState()).disbursed - cashBefore)).toBe(roundToCents(positives - 365.7))
    expect(api.getState().billing.negativeInvoices[negative.id]).toMatchObject({ status: 'netted' })
    expect(anaesthetistLedgerPosition(api.getState(), ANAE.sharma).recoveryDue).toBe(0)
    const batches = Object.values(api.getState().xero.batchPayments).filter((b) => b.payablesRunId === runId)
    expect(batches).toHaveLength(1)
    expect(batches[0]!.total).toBe(roundToCents(positives - 365.7))
    expect(api.getState().xero.creditNotes[negative.accPayCreditNoteId!]!.allocated).toBe(365.7)
    // The remittance advice lists the 19 and the negative netted.
    const advice = remittanceAdvice(run, ANAE.sharma, () => ({ state: 'paid', atISO: 'x' }))!
    expect([advice.lines.length, advice.netted.length, advice.net]).toEqual([19, 1, roundToCents(positives - 365.7)])
    // Replays are no-ops: a second poll records nothing.
    expect(runReconciliationPoll(api)).toMatchObject({ offsets: 0 })
    conserved(api)
  })

  it('crediting a line after the close makes the run stale; re-close drops it', () => {
    const { api } = staged('bctis')
    const closed = closeWeek(api, OFFICE_ACTOR)
    const runId = closed.ok ? closed.value.runId : ''
    const first = api.getState().billing.payablesRuns[runId]!.lines.find((l) => l.anaesthetistId === ANAE.sharma)!
    // The pair is credited by 39 (cut the release back): the run no longer matches.
    api.setState((s) => {
      const p = s.billing.ledger[first.pairId] as BookingLedgerPair
      return { billing: { ...s.billing, ledger: { ...s.billing.ledger, [p.id]: { ...p, payable: { ...p.payable!, reversedAmount: p.payable!.amount, releasedAmount: 0 }, credit: { creditNoteId: 'X', negativeInvoiceId: 'Y', atISO: 'x', heldForPayer: 0, recoveryDue: 0 } } } } }
    })
    expect(approveWeekBctis(api, OFFICE_ACTOR, runId)).toMatchObject({ ok: false, code: 'runStale', message: PAYMENT_CYCLE_COPY.runStale })
    const re = recloseWeek(api, OFFICE_ACTOR, runId)
    const fresh = api.getState().billing.payablesRuns[re.ok ? re.value.runId : '']!
    expect(fresh.lines.filter((l) => l.anaesthetistId === ANAE.sharma)).toHaveLength(18)
  })

  it('Stage a bank mismatch: the close raises one anomaly on one BCTI, which rolls into next week when held', () => {
    const { api } = staged('bctis')
    expect(stageBankMismatchRefusal(api.getState())).toBeNull()
    expect(stageBankMismatch(api, DEMO_TRIGGER_ACTOR).ok).toBe(true)
    const closed = closeWeek(api, OFFICE_ACTOR)
    expect(closed).toMatchObject({ ok: true, value: { anomalies: 1 } })
    const runId = closed.ok ? closed.value.runId : ''
    expect(stageBankMismatchRefusal(api.getState())).toBe(PAYMENT_WEEK_COPY.weekClosed)
    const anomaly = api.getState().billing.payablesRuns[runId]!.anomalies[0]!
    expect(anomaly.kind).toBe('receiptNotOnBank')
    holdOutOfRun(api, OFFICE_ACTOR, runId, { anomalyId: anomaly.id })
    expect(api.getState().billing.payablesRuns[runId]!.byAnaesthetist.find((t) => t.anaesthetistId === ANAE.sharma)!.bctiCount).toBe(18)
    approveWeekBctis(api, OFFICE_ACTOR, runId)
    sendPaymentSchedule(api, OFFICE_ACTOR, runId)
    runPayables(api, OFFICE_ACTOR)
    expect(openCycleDraft(api.getState()).lines.filter((l) => l.rolledFromRunId === runId).map((l) => l.pairId)).toEqual(anomaly.pairIds)
    conserved(api)
  })
})
