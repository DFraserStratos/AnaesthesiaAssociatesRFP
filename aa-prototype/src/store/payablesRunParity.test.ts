/**
 * "Run payables in Xero" pays exactly the same, however it commits (build plan
 * Phase 66: the practice-scale freeze). Each case drives a staged week on the
 * core seed to paid through `runPayables` and pins a fingerprint of everything
 * the run wrote: the result, the cash paid per anaesthetist, the batch
 * payments, the audit rows' action codes and counts, and the records the run
 * added or changed (Xero bill payments, credit allocations, ACCPAYs, credit
 * notes, ledger disbursements, payable legs, the negative invoice, the run,
 * the sync queue, the counters). The literals were recorded from the
 * one-commit-per-webhook code before the change.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { createAppStore, type AppState, type BoundAppStore } from './appStore'
import { wireBillingRun } from './billingRun'
import { setXeroOutage, wireXeroQueue } from './xeroQueue'
import { stagePaymentWeek } from './paymentWeekDemo'
import { approveWeekBctis, closeWeek, sendPaymentSchedule } from './paymentCycleActions'
import { runPayables } from './payablesActions'
import { DEMO_TRIGGER_ACTOR, OFFICE_ACTOR } from './demoActors'
import { toCents } from '../domain/billing/money'

const unwires: (() => void)[] = []
afterEach(() => {
  while (unwires.length > 0) unwires.pop()!()
})

/** A short, stable hash of a JSON value (djb2 over its string). */
function hashOf(value: unknown): string {
  const text = JSON.stringify(value)
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0
  return `${h.toString(16)}:${text.length}`
}

/** The records of a map that are new or changed since `before`, in id order. */
function changed<T>(before: Readonly<Record<string, T>>, after: Readonly<Record<string, T>>): T[] {
  return Object.keys(after)
    .filter((id) => before[id] !== after[id])
    .sort()
    .map((id) => after[id]!)
}

function stagedToSend(choice: 'bctis' | 'withCredit'): { api: BoundAppStore; runId: string } {
  const api = createAppStore()
  unwires.push(wireBillingRun(api), wireXeroQueue(api))
  const staged = stagePaymentWeek(api, DEMO_TRIGGER_ACTOR, choice)
  expect(staged.ok, staged.ok ? '' : staged.message).toBe(true)
  const closed = closeWeek(api, OFFICE_ACTOR)
  expect(closed.ok, closed.ok ? '' : closed.message).toBe(true)
  const runId = closed.ok ? closed.value.runId : ''
  expect(approveWeekBctis(api, OFFICE_ACTOR, runId).ok).toBe(true)
  expect(sendPaymentSchedule(api, OFFICE_ACTOR, runId).ok).toBe(true)
  return { api, runId }
}

function fingerprint(before: AppState, after: AppState, runId: string, value: unknown) {
  const added = after.audit.slice(before.audit.length)
  const actions: Record<string, number> = {}
  for (const a of added) actions[a.action] = (actions[a.action] ?? 0) + 1
  const ledgerDisbursements = changed(before.billing.disbursements, after.billing.disbursements)
  const paidByAnaesthetist: Record<string, number> = {}
  for (const d of ledgerDisbursements) paidByAnaesthetist[d.anaesthetistId] = (paidByAnaesthetist[d.anaesthetistId] ?? 0) + toCents(d.amount)
  const batches = changed(before.xero.batchPayments, after.xero.batchPayments).map((b) => ({ id: b.id, anaesthetistId: b.anaesthetistId, contactId: b.contactId, total: b.total, bills: b.billPaymentIds.length }))
  return {
    value,
    runStatus: after.billing.payablesRuns[runId]!.status,
    paidCentsByAnaesthetist: paidByAnaesthetist,
    batches,
    auditActions: actions,
    auditCount: added.length,
    hashes: {
      audit: hashOf(added),
      xeroDisbursements: hashOf(changed(before.xero.disbursements, after.xero.disbursements)),
      creditAllocations: hashOf(changed(before.xero.creditAllocations, after.xero.creditAllocations)),
      creditNotes: hashOf(changed(before.xero.creditNotes, after.xero.creditNotes)),
      accPays: hashOf(changed(before.xero.accPays, after.xero.accPays)),
      batchPayments: hashOf(changed(before.xero.batchPayments, after.xero.batchPayments)),
      ledgerDisbursements: hashOf(ledgerDisbursements),
      ledger: hashOf(changed(before.billing.ledger, after.billing.ledger)),
      transfers: hashOf(changed(before.billing.transfers, after.billing.transfers)),
      negativeInvoices: hashOf(changed(before.billing.negativeInvoices, after.billing.negativeInvoices)),
      payablesRuns: hashOf(changed(before.billing.payablesRuns, after.billing.payablesRuns)),
      xeroQueue: hashOf(changed(before.billing.xeroQueue, after.billing.xeroQueue)),
      counters: hashOf(after.counters),
    },
  }
}

describe('Run payables in Xero pays the same (Phase 66 parity)', () => {
  it('a staged week with a credit to net: 19 bills, one netting, paid in full', () => {
    const { api, runId } = stagedToSend('withCredit')
    const before = api.getState()
    const out = runPayables(api, OFFICE_ACTOR)
    expect(out.ok).toBe(true)
    expect(fingerprint(before, api.getState(), runId, out.ok ? out.value : null)).toMatchInlineSnapshot(`
      {
        "auditActions": {
          "ledger.disbursed": 19,
          "ledger.offsetRecorded": 1,
          "payables.runPaid": 1,
          "payables.runSentToXero": 1,
          "xero.batchPaid": 1,
          "xero.creditAllocated": 1,
          "xero.disbursed": 19,
        },
        "auditCount": 43,
        "batches": [
          {
            "anaesthetistId": "41267",
            "bills": 19,
            "contactId": "XCH08",
            "id": "XBP0001",
            "total": 10472.16,
          },
        ],
        "hashes": {
          "accPays": "15af819b:14095",
          "audit": "37703eaa:12366",
          "batchPayments": "64611479:365",
          "counters": "3c83bc20:575",
          "creditAllocations": "f34f7dcb:170",
          "creditNotes": "6fc81a20:253",
          "ledger": "a5b9a895:14411",
          "ledgerDisbursements": "456863c:4126",
          "negativeInvoices": "44745ca3:455",
          "payablesRuns": "ebab4184:5946",
          "transfers": "5975e3:2",
          "xeroDisbursements": "adaa8162:3195",
          "xeroQueue": "5975e3:2",
        },
        "paidCentsByAnaesthetist": {
          "41267": 1047216,
        },
        "runStatus": "paid",
        "value": {
          "billsPaid": 19,
          "disbursedCount": 19,
          "netted": 365.7,
          "nettedCount": 1,
          "paidIds": [
            "PPBC01",
            "PPBC02",
            "PPBC03",
            "PPBC04",
            "PPBC05",
            "PPBC06",
            "PPBC07",
            "PPBC08",
            "PPBC09",
            "PPBC10",
            "PPBC11",
            "PPBC12",
            "PPBC13",
            "PPBC14",
            "PPBC15",
            "PPBC16",
            "PPBC17",
            "PPBC18",
            "PPBC19",
          ],
          "payablesRunId": "PR0001",
          "queued": 0,
          "skippedNotInXero": 0,
          "totalDisbursed": 10472.16,
          "totalPaid": 10472.16,
        },
      }
    `)
  })

  it('a staged week during a Xero outage: the bills are paid in Xero and their syncs queue', () => {
    const { api, runId } = stagedToSend('bctis')
    expect(setXeroOutage(api, DEMO_TRIGGER_ACTOR, true).ok).toBe(true)
    const before = api.getState()
    const out = runPayables(api, OFFICE_ACTOR)
    expect(out.ok).toBe(true)
    expect(fingerprint(before, api.getState(), runId, out.ok ? out.value : null)).toMatchInlineSnapshot(`
      {
        "auditActions": {
          "payables.runSentToXero": 1,
          "xero.batchPaid": 1,
          "xero.disbursed": 19,
          "xero.queued": 19,
        },
        "auditCount": 40,
        "batches": [
          {
            "anaesthetistId": "41267",
            "bills": 19,
            "contactId": "XCH08",
            "id": "XBP0001",
            "total": 10837.86,
          },
        ],
        "hashes": {
          "accPays": "5c70a0d6:14064",
          "audit": "1d6dd772:12617",
          "batchPayments": "9b7d907d:365",
          "counters": "57161dde:474",
          "creditAllocations": "5975e3:2",
          "creditNotes": "5975e3:2",
          "ledger": "5975e3:2",
          "ledgerDisbursements": "5975e3:2",
          "negativeInvoices": "5975e3:2",
          "payablesRuns": "395a0e0b:5780",
          "transfers": "5975e3:2",
          "xeroDisbursements": "e9c92508:3194",
          "xeroQueue": "b548a230:5777",
        },
        "paidCentsByAnaesthetist": {},
        "runStatus": "paying",
        "value": {
          "billsPaid": 19,
          "disbursedCount": 0,
          "netted": 0,
          "nettedCount": 0,
          "paidIds": [
            "PPBC01",
            "PPBC02",
            "PPBC03",
            "PPBC04",
            "PPBC05",
            "PPBC06",
            "PPBC07",
            "PPBC08",
            "PPBC09",
            "PPBC10",
            "PPBC11",
            "PPBC12",
            "PPBC13",
            "PPBC14",
            "PPBC15",
            "PPBC16",
            "PPBC17",
            "PPBC18",
            "PPBC19",
          ],
          "payablesRunId": "PR0001",
          "queued": 19,
          "skippedNotInXero": 0,
          "totalDisbursed": 0,
          "totalPaid": 10837.86,
        },
      }
    `)
  })

  it('a staged week with the webhook missed: Xero pays, the engine records nothing yet', () => {
    const { api, runId } = stagedToSend('bctis')
    const before = api.getState()
    const out = runPayables(api, OFFICE_ACTOR, { webhook: 'missed' })
    expect(out.ok).toBe(true)
    expect(fingerprint(before, api.getState(), runId, out.ok ? out.value : null)).toMatchInlineSnapshot(`
      {
        "auditActions": {
          "payables.runSentToXero": 1,
          "xero.batchPaid": 1,
          "xero.disbursed": 19,
        },
        "auditCount": 21,
        "batches": [
          {
            "anaesthetistId": "41267",
            "bills": 19,
            "contactId": "XCH08",
            "id": "XBP0001",
            "total": 10837.86,
          },
        ],
        "hashes": {
          "accPays": "5c70a0d6:14064",
          "audit": "5cc9b2e:5948",
          "batchPayments": "9b7d907d:365",
          "counters": "42006dc8:455",
          "creditAllocations": "5975e3:2",
          "creditNotes": "5975e3:2",
          "ledger": "5975e3:2",
          "ledgerDisbursements": "5975e3:2",
          "negativeInvoices": "5975e3:2",
          "payablesRuns": "395a0e0b:5780",
          "transfers": "5975e3:2",
          "xeroDisbursements": "e9c92508:3194",
          "xeroQueue": "5975e3:2",
        },
        "paidCentsByAnaesthetist": {},
        "runStatus": "paying",
        "value": {
          "billsPaid": 19,
          "disbursedCount": 0,
          "netted": 0,
          "nettedCount": 0,
          "paidIds": [
            "PPBC01",
            "PPBC02",
            "PPBC03",
            "PPBC04",
            "PPBC05",
            "PPBC06",
            "PPBC07",
            "PPBC08",
            "PPBC09",
            "PPBC10",
            "PPBC11",
            "PPBC12",
            "PPBC13",
            "PPBC14",
            "PPBC15",
            "PPBC16",
            "PPBC17",
            "PPBC18",
            "PPBC19",
          ],
          "payablesRunId": "PR0001",
          "queued": 0,
          "skippedNotInXero": 0,
          "totalDisbursed": 0,
          "totalPaid": 10837.86,
        },
      }
    `)
  })
})
