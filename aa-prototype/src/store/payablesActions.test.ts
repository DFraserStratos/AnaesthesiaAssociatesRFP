/**
 * Payables run & disbursement tests (Phase 10; WI4, X5).
 *
 * The load-bearing accounting proof: partial → authorise exactly the amount
 * received → run disburses it → second partial → authorised rises → the next
 * run pays ONLY the increment (never double-pays); the total disbursed equals
 * the gross payable (catch-up Phase 16), and the case flips to `disbursed` only
 * when fully paid out.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, submitList } from './lifecycle'
import { runBillingForList, wireBillingRun } from './billingRun'
import { handoffListPairs } from './xeroHandoff'
import { receivePayment } from './paymentActions'
import { disbursePayable, runPayables, payablesDue, type PayablesRunResult } from './payablesActions'
import { openAccRecs } from './selectors'
import { pairsForList } from './ledgerSelectors'
import { pairStatusLabel } from '../domain/billing/ledger'
import { roundToCents, toCents } from '../domain/billing/money'
import type { Actor } from './mutate'
import { SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const ANAE_ACTOR: Actor = { who: 'Dr Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }

function store(): BoundAppStore {
  return createAppStore()
}
function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}
function pay(api: BoundAppStore): PayablesRunResult {
  const res = runPayables(api, OFFICE)
  if (!res.ok) throw new Error(`payables refused: ${res.message}`)
  return res.value
}
function billCos(api: BoundAppStore): { pairId: string; accRecId: string; accPayId: string; amountDue: number; amountPayable: number } {
  const booking = api.getState().schedule.bookings[marker('cosAccContractBooking')]!
  const listId = booking.listId
  expect(submitList(api, OFFICE, listId).ok).toBe(true)
  expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
  expect(runBillingForList(api, listId).ok).toBe(true)
  handoffListPairs(api, listId)
  // (catch-up Phase 36: a failed Booking is a BillingException, never a pair, so every pair of the List was raised.)
  const p = pairsForList(api.getState(), listId)[0]!
  const accRecId = p.receivable.xeroAccRecId!
  const accPayId = p.payable!.xeroAccPayId!
  const accRec = api.getState().xero.accRecs[accRecId]!
  const accPay = api.getState().xero.accPays[accPayId]!
  return { pairId: p.id, accRecId, accPayId, amountDue: accRec.amountDue, amountPayable: accPay.amountPayable }
}
function pairOf(api: BoundAppStore, pairId: string) {
  const p = api.getState().billing.ledger[pairId]!
  if (p.kind === 'aaFee') throw new Error('expected a Booking pair')
  return p
}

describe('payables run', () => {
  it('is office-only', () => {
    const api = store()
    expect(runPayables(api, ANAE_ACTOR)).toMatchObject({ ok: false, code: 'officeOnly' })
  })

  it('a run with nothing authorised disburses nothing', () => {
    const api = store()
    const res = runPayables(api, OFFICE)
    expect(res).toMatchObject({ ok: true, value: { disbursedCount: 0, totalDisbursed: 0 } })
  })

  it('successive partials with a run between pay only the increment (no double-pay)', () => {
    const api = store()
    const { pairId, accRecId, accPayId, amountDue, amountPayable } = billCos(api)
    const p1 = roundToCents(amountDue * 0.4)
    const p2 = roundToCents(amountDue - p1)
    // The payable is the gross amount; each run pays exactly what arrived.
    expect(amountPayable).toBe(amountDue)
    const authorised1 = p1
    const authorised2 = p2

    // Partial 1 → authorise exactly p1 → run disburses it.
    expect(receivePayment(api, { accRecId, amount: p1, idempotencyKey: 'A', source: 'webhook' }).ok).toBe(true)
    expect(payablesDue(api.getState()).total).toBe(authorised1)
    const run1 = runPayables(api, OFFICE)
    expect(run1).toMatchObject({ ok: true, value: { disbursedCount: 1, totalDisbursed: authorised1 } })
    let accPay = api.getState().xero.accPays[accPayId]!
    let c = pairOf(api, pairId)
    expect(accPay.amountDisbursed).toBe(authorised1)
    expect(accPay.status).toBe('authorised') // not fully paid out yet
    expect(c.payable!.disbursedAmount).toBe(authorised1)
    // (catch-up Phase 36: the derived label names a part pay-out 'partPaidOut'; the old stored status stayed 'partPaid'.)
    expect(pairStatusLabel(c)).toBe('partPaidOut')
    expect(c.payable!.paidOutAtISO).toBeUndefined()
    // Nothing new to pay until more is authorised.
    expect(payablesDue(api.getState()).total).toBe(0)
    expect(pay(api).disbursedCount).toBe(0)

    // Partial 2 → authorised rises → next run pays ONLY the increment.
    expect(receivePayment(api, { accRecId, amount: p2, idempotencyKey: 'B', source: 'webhook' }).ok).toBe(true)
    expect(payablesDue(api.getState()).total).toBe(authorised2)
    const run2 = runPayables(api, OFFICE)
    expect(run2).toMatchObject({ ok: true, value: { disbursedCount: 1, totalDisbursed: authorised2 } })

    accPay = api.getState().xero.accPays[accPayId]!
    c = pairOf(api, pairId)
    expect(accPay.amountDisbursed).toBe(amountPayable)
    expect(accPay.status).toBe('paid')
    expect(c.payable!.disbursedAmount).toBe(amountPayable)
    expect(pairStatusLabel(c)).toBe('disbursed')
    expect(c.payable!.paidOutAtISO).toBeDefined()

    // Total disbursed across the two runs equals the full payable, exactly once.
    const disbursements = Object.values(api.getState().xero.disbursements).filter((d) => d.accPayId === accPayId)
    expect(disbursements).toHaveLength(2)
    const totalDisbursed = disbursements.reduce((sum, d) => sum + d.amount, 0)
    expect(toCents(totalDisbursed)).toBe(toCents(amountPayable))

    // A run after full disbursement is a no-op.
    expect(pay(api).disbursedCount).toBe(0)
  })

  it('a fully-paid ACCREC disburses in full in one run', () => {
    const api = store()
    const { pairId, accRecId, accPayId, amountDue, amountPayable } = billCos(api)
    expect(receivePayment(api, { accRecId, amount: amountDue, idempotencyKey: 'FULL', source: 'webhook' }).ok).toBe(true)
    expect(pay(api).totalDisbursed).toBe(amountPayable)
    expect(api.getState().xero.accPays[accPayId]!.status).toBe('paid')
    expect(pairStatusLabel(pairOf(api, pairId))).toBe('disbursed')
  })

  it('can disburse one selected payable without paying every authorised invoice', () => {
    const api = store()
    const selected = billCos(api)
    const unwire = wireBillingRun(api)
    expect(authoriseList(api, OFFICE, SEED_LIST_IDS.souterMon20Am).ok).toBe(true)
    unwire()
    const other = openAccRecs(api.getState()).find((candidate) => candidate.accRecId !== selected.accRecId)
    if (other === undefined) throw new Error('expected another open invoice in the seed')

    expect(receivePayment(api, {
      accRecId: selected.accRecId,
      amount: selected.amountDue,
      idempotencyKey: 'SELECTED',
      source: 'webhook',
    }).ok).toBe(true)
    expect(receivePayment(api, {
      accRecId: other.accRecId,
      amount: other.remaining,
      idempotencyKey: 'OTHER',
      source: 'webhook',
    }).ok).toBe(true)

    // (catch-up Phase 36: a payable is chosen by its pair id, and the result names the pairs paid.)
    const result = disbursePayable(api, OFFICE, selected.pairId)
    expect(result).toMatchObject({
      ok: true,
      value: {
        disbursedCount: 1,
        paidIds: [selected.pairId],
      },
    })
    expect(api.getState().xero.accPays[selected.accPayId]!.status).toBe('paid')
    expect(payablesDue(api.getState()).count).toBeGreaterThan(0)
  })

  it('reconstructs one invoice automated trail end-to-end, all source=system (WI5a)', () => {
    const api = store()
    const { accRecId, amountDue } = billCos(api)
    expect(receivePayment(api, { accRecId, amount: amountDue, idempotencyKey: 'TRAIL', source: 'webhook' }).ok).toBe(true)
    expect(pay(api).disbursedCount).toBe(1)

    // The end-to-end automated chain: billing run -> Xero handoff -> webhook ->
    // ACCPAY authorise -> payables disbursement. Every step is source=system.
    const chain = ['invoice.create', 'xero.pairCreated', 'xero.paymentReceived', 'xero.accpayAuthorised', 'xero.disbursed']
    const audit = api.getState().audit
    for (const action of chain) {
      const entries = audit.filter((e) => e.action === action)
      expect(entries.length, `${action} audited`).toBeGreaterThan(0)
      for (const e of entries) expect(e.source, `${action} is system-sourced`).toBe('system')
    }
  })
})
