/**
 * Catch-up Phase 39a review fixes, each pinned: re-close keeps anomaly ids and
 * holds in step; office flag ids never collide; a held line is never paid in
 * its week by a demo payout; a rolled line's receipt is checked again; a credit
 * waits while Xero is paying its payable; crediting a bill already netted
 * leaves Xero's credit note matching the ledger; a netted bill is paid only
 * with its run; a negative larger than the positives settles them by netting
 * alone and nets the rest next week.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { wireBillingRun } from './billingRun'
import { wireXeroQueue } from './xeroQueue'
import { approveAndPayPairForDemo, disbursePayable, runPayables } from './payablesActions'
import { approveWeekBctis, closeWeek, holdOutOfRun, recloseWeek, releaseHold, sendPaymentSchedule } from './paymentCycleActions'
import { stageBankMismatch, stagePaymentWeek } from './paymentWeekDemo'
import { creditRefusalFor, submitCredit } from './creditActions'
import { approveProcedureEvent, runEventInvoicing } from './procedureEventActions'
import { ledgerPositionOf } from './ledgerSelectors'
import { DEMO_TRIGGER_ACTOR, OFFICE_ACTOR } from './demoActors'
import { roundToCents, toCents } from '../domain/billing/money'
import { isBookingPair } from '../domain/billing/ledger'

const unwires: (() => void)[] = []
afterEach(() => {
  while (unwires.length > 0) unwires.pop()!()
})

function staged(choice: 'bctis' | 'withCredit'): BoundAppStore {
  const api = createAppStore()
  unwires.push(wireBillingRun(api), wireXeroQueue(api))
  const out = stagePaymentWeek(api, DEMO_TRIGGER_ACTOR, choice)
  expect(out.ok, out.ok ? '' : out.message).toBe(true)
  return api
}

function closed(api: BoundAppStore): string {
  const out = closeWeek(api, OFFICE_ACTOR)
  expect(out.ok, out.ok ? '' : out.message).toBe(true)
  return out.ok ? out.value.runId : ''
}

function payRun(api: BoundAppStore, runId: string, webhook: 'deliver' | 'missed' = 'deliver') {
  expect(approveWeekBctis(api, OFFICE_ACTOR, runId).ok).toBe(true)
  expect(sendPaymentSchedule(api, OFFICE_ACTOR, runId).ok).toBe(true)
  return runPayables(api, OFFICE_ACTOR, { webhook })
}

const OFFICE = { role: 'office' as const }

describe('re-close and holds', () => {
  it('a re-close re-points held lines to the new run\'s anomaly; returning one opens it again and approval waits', () => {
    const api = staged('bctis')
    stageBankMismatch(api, DEMO_TRIGGER_ACTOR)
    const first = closed(api)
    const anomaly = api.getState().billing.payablesRuns[first]!.anomalies[0]!
    holdOutOfRun(api, OFFICE_ACTOR, first, { anomalyId: anomaly.id })
    const re = recloseWeek(api, OFFICE_ACTOR, first)
    const fresh = api.getState().billing.payablesRuns[re.ok ? re.value.runId : '']!
    const freshAnomaly = fresh.anomalies.find((a) => a.kind === 'receiptNotOnBank')!
    expect(freshAnomaly.status).toBe('heldOut')
    const heldLine = fresh.lines.find((l) => l.heldOut !== undefined)!
    expect(heldLine.heldOut!.anomalyId).toBe(freshAnomaly.id)
    expect(releaseHold(api, OFFICE_ACTOR, fresh.id, heldLine.pairId).ok).toBe(true)
    expect(api.getState().billing.payablesRuns[fresh.id]!.anomalies.find((a) => a.id === freshAnomaly.id)!.status).toBe('open')
    expect(approveWeekBctis(api, OFFICE_ACTOR, fresh.id)).toMatchObject({ ok: false, code: 'anomaliesOpen' })
  })

  it('office flag ids are never reused after a flag is removed', () => {
    const api = staged('bctis')
    const runId = closed(api)
    const [a, b, c] = api.getState().billing.payablesRuns[runId]!.lines
    holdOutOfRun(api, OFFICE_ACTOR, runId, { pairId: a!.pairId, reason: 'One' })
    holdOutOfRun(api, OFFICE_ACTOR, runId, { pairId: b!.pairId, reason: 'Two' })
    releaseHold(api, OFFICE_ACTOR, runId, a!.pairId)
    holdOutOfRun(api, OFFICE_ACTOR, runId, { pairId: c!.pairId, reason: 'Three' })
    const ids = api.getState().billing.payablesRuns[runId]!.anomalies.map((x) => x.id)
    expect(new Set(ids).size).toBe(ids.length)
    // Returning B returns B, nothing else.
    releaseHold(api, OFFICE_ACTOR, runId, b!.pairId)
    const lines = api.getState().billing.payablesRuns[runId]!.lines
    expect(lines.find((l) => l.pairId === b!.pairId)!.heldOut).toBeUndefined()
    expect(lines.find((l) => l.pairId === c!.pairId)!.heldOut).toBeDefined()
  })

  it('a held line is never paid in its week by a demo payout', () => {
    const api = staged('bctis')
    const runId = closed(api)
    const line = api.getState().billing.payablesRuns[runId]!.lines[0]!
    holdOutOfRun(api, OFFICE_ACTOR, runId, { pairId: line.pairId, reason: 'Payer queried it' })
    expect(approveAndPayPairForDemo(api, OFFICE_ACTOR, line.pairId)).toMatchObject({ ok: false, code: 'heldOut' })
  })

  it("a rolled line's receipt is checked again at the next close", () => {
    const api = staged('bctis')
    stageBankMismatch(api, DEMO_TRIGGER_ACTOR)
    const first = closed(api)
    const anomaly = api.getState().billing.payablesRuns[first]!.anomalies[0]!
    holdOutOfRun(api, OFFICE_ACTOR, first, { anomalyId: anomaly.id })
    payRun(api, first)
    const next = closed(api)
    const again = api.getState().billing.payablesRuns[next]!.anomalies
    expect(again).toEqual([expect.objectContaining({ kind: 'receiptNotOnBank', pairIds: anomaly.pairIds })])
  })
})

describe('credits beside a payment run', () => {
  it("a credit waits while a paying run has yet to send its payable to Xero (it would strand the run); a payment Xero made is 39's own wait", () => {
    const api = staged('bctis')
    const runId = closed(api)
    expect(approveWeekBctis(api, OFFICE_ACTOR, runId).ok).toBe(true)
    expect(sendPaymentSchedule(api, OFFICE_ACTOR, runId).ok).toBe(true)
    const [first, second] = api.getState().billing.payablesRuns[runId]!.lines
    // One bill paid on its own: the run is paying, the rest not yet sent to Xero.
    expect(disbursePayable(api, OFFICE_ACTOR, first!.pairId).ok).toBe(true)
    const invoiceOf = (pairId: string) => {
      const pair = api.getState().billing.ledger[pairId]!
      return isBookingPair(pair) ? pair.invoiceId : ''
    }
    expect(creditRefusalFor(api.getState(), OFFICE, invoiceOf(second!.pairId))).toMatchObject({ code: 'inPaymentRun', message: "Being paid in Week 30's payment run. Credit it once the run is paid." })
    // The bill Xero has paid is not this wait.
    expect(creditRefusalFor(api.getState(), OFFICE, invoiceOf(first!.pairId))?.code).not.toBe('inPaymentRun')
  })

  it("crediting a bill already settled partly by netting leaves Xero's credit note matching what is to net, and the ledger in balance", () => {
    const api = staged('withCredit')
    const runId = closed(api)
    payRun(api, runId)
    // PPBC01 was settled $365.70 by netting and $54.30 in cash: credit it in full.
    const sub = submitCredit(api, OFFICE_ACTOR, { invoiceId: 'PPINV01', reason: 'Wrong payer', cause: 'correction', replacements: [] })
    expect(sub.ok, sub.ok ? '' : sub.message).toBe(true)
    approveProcedureEvent(api, OFFICE_ACTOR, sub.ok ? sub.value.creditEventId : '')
    const run = runEventInvoicing(api, OFFICE_ACTOR)
    expect(run.ok).toBe(true)
    const note = api.getState().billing.creditNotes[run.ok ? run.value.creditNoteIds[0]! : '']!
    const negative = api.getState().billing.negativeInvoices[note.negativeInvoiceId!]!
    expect(negative).toMatchObject({ recoveryDue: 420, status: 'toNet' })
    const xeroCredit = api.getState().xero.creditNotes[note.xero!.accPayCreditNoteId!]!
    expect(roundToCents(xeroCredit.total - xeroCredit.allocated)).toBe(negative.recoveryDue)
    expect(ledgerPositionOf(api.getState()).imbalance).toBe(0)
  })
})

describe('netting', () => {
  it('a bill with a negative netted against it is paid only with its run', () => {
    const api = staged('withCredit')
    const runId = closed(api)
    expect(approveWeekBctis(api, OFFICE_ACTOR, runId).ok).toBe(true)
    expect(sendPaymentSchedule(api, OFFICE_ACTOR, runId).ok).toBe(true)
    const netted = api.getState().billing.payablesRuns[runId]!.nettings[0]!.allocations[0]!.pairId
    expect(disbursePayable(api, OFFICE_ACTOR, netted)).toMatchObject({ ok: false, code: 'useRun' })
  })

  it('a negative larger than the positives settles them by netting alone (no cash, no batch payment), and the rest nets next week', () => {
    const api = staged('withCredit')
    const runId = closed(api)
    const lines = api.getState().billing.payablesRuns[runId]!.lines
    // Keep only the smallest line ($152.38) in the run: the $365.70 negative is larger.
    const smallest = [...lines].sort((a, b) => a.amount - b.amount)[0]!
    for (const l of lines) if (l.pairId !== smallest.pairId) holdOutOfRun(api, OFFICE_ACTOR, runId, { pairId: l.pairId, reason: 'Later' })
    const t = api.getState().billing.payablesRuns[runId]!.byAnaesthetist[0]!
    expect([t.positives, t.netted, t.net, t.remainingToNet]).toEqual([152.38, 152.38, 0, 213.32])
    const paid = payRun(api, runId)
    expect(paid).toMatchObject({ ok: true, value: { billsPaid: 0, netted: 152.38 } })
    expect(Object.values(api.getState().xero.batchPayments).filter((b) => b.payablesRunId === runId)).toEqual([])
    expect(api.getState().billing.payablesRuns[runId]!.status).toBe('paid')
    // Set aside the seed's own credit, Heather Sinclair's (`HS` ids, catch-up Phase 40, D24).
    const neg = Object.values(api.getState().billing.negativeInvoices).find((n) => !n.id.startsWith('HS'))!
    expect(neg.status).toBe('toNet')
    // Next week: the held lines roll and the rest of the negative nets against them.
    const next = closed(api)
    expect(api.getState().billing.payablesRuns[next]!.nettings[0]).toMatchObject({ negativeInvoiceId: neg.id, amount: 213.32 })
    payRun(api, next)
    expect(api.getState().billing.negativeInvoices[neg.id]!.status).toBe('netted')
    expect(ledgerPositionOf(api.getState()).imbalance).toBe(0)
    expect(Object.values(api.getState().billing.ledger).every((p) => !isBookingPair(p) || p.payable === undefined || toCents(p.payable.disbursedAmount + (p.payable.offsetAmount ?? 0)) <= toCents(p.payable.releasedAmount))).toBe(true)
  })
})

