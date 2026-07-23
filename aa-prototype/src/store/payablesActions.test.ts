/**
 * Payables run & disbursement tests (Phase 10; WI4, X5).
 *
 * The load-bearing accounting proof: partial → authorise pro-rata → run
 * disburses that slice → second partial → authorised rises → the next run pays
 * ONLY the increment (never double-pays); the total disbursed equals the
 * pro-rata share, and the case flips to `disbursed` only when fully paid out.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, submitList } from './lifecycle'
import { runBillingForList, handoffListCases } from './billingRun'
import { receivePayment } from './paymentActions'
import { runPayables, payablesDue, type PayablesRunResult } from './payablesActions'
import { casesForList } from './selectors'
import { roundToCents, toCents } from '../domain/billing/money'
import type { Actor } from './mutate'
import { SEED_MARKERS } from '../domain/seed'

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
function billCos(api: BoundAppStore): { caseId: string; accRecId: string; accPayId: string; amountDue: number } {
  const card = api.getState().schedule.cards[marker('cosAccContractCard')]!
  const listId = card.listId
  expect(submitList(api, OFFICE, listId).ok).toBe(true)
  expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
  expect(runBillingForList(api, listId).ok).toBe(true)
  handoffListCases(api, listId)
  const c = casesForList(api.getState(), listId).find((x) => x.status !== 'failed')!
  const accRec = api.getState().xero.accRecs[c.accRecId!]!
  return { caseId: c.id, accRecId: c.accRecId!, accPayId: c.accPayId!, amountDue: accRec.amountDue }
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
    const { caseId, accRecId, accPayId, amountDue } = billCos(api)
    const p1 = roundToCents(amountDue * 0.4)
    const p2 = roundToCents(amountDue - p1)

    // Partial 1 → authorise pro-rata → run disburses that slice.
    expect(receivePayment(api, { accRecId, amount: p1, idempotencyKey: 'A', source: 'webhook' }).ok).toBe(true)
    expect(payablesDue(api.getState()).total).toBe(p1)
    const run1 = runPayables(api, OFFICE)
    expect(run1).toMatchObject({ ok: true, value: { disbursedCount: 1, totalDisbursed: p1 } })
    let accPay = api.getState().xero.accPays[accPayId]!
    let c = api.getState().billing.cases[caseId]!
    expect(accPay.amountDisbursed).toBe(p1)
    expect(accPay.status).toBe('authorised') // not fully paid out yet
    expect(c.disbursedAmount).toBe(p1)
    expect(c.status).toBe('partPaid')
    expect(c.disbursedAtISO).toBeUndefined()
    // Nothing new to pay until more is authorised.
    expect(payablesDue(api.getState()).total).toBe(0)
    expect(pay(api).disbursedCount).toBe(0)

    // Partial 2 → authorised rises → next run pays ONLY the increment.
    expect(receivePayment(api, { accRecId, amount: p2, idempotencyKey: 'B', source: 'webhook' }).ok).toBe(true)
    expect(payablesDue(api.getState()).total).toBe(p2)
    const run2 = runPayables(api, OFFICE)
    expect(run2).toMatchObject({ ok: true, value: { disbursedCount: 1, totalDisbursed: p2 } })

    accPay = api.getState().xero.accPays[accPayId]!
    c = api.getState().billing.cases[caseId]!
    expect(accPay.amountDisbursed).toBe(amountDue)
    expect(accPay.status).toBe('paid')
    expect(c.disbursedAmount).toBe(amountDue)
    expect(c.status).toBe('disbursed')
    expect(c.disbursedAtISO).toBeDefined()

    // Total disbursed across the two runs equals the full payable, exactly once.
    const disbursements = Object.values(api.getState().xero.disbursements).filter((d) => d.accPayId === accPayId)
    expect(disbursements).toHaveLength(2)
    const totalDisbursed = disbursements.reduce((sum, d) => sum + d.amount, 0)
    expect(toCents(totalDisbursed)).toBe(toCents(amountDue))

    // A run after full disbursement is a no-op.
    expect(pay(api).disbursedCount).toBe(0)
  })

  it('a fully-paid ACCREC disburses in full in one run', () => {
    const api = store()
    const { caseId, accRecId, accPayId, amountDue } = billCos(api)
    expect(receivePayment(api, { accRecId, amount: amountDue, idempotencyKey: 'FULL', source: 'webhook' }).ok).toBe(true)
    expect(pay(api).totalDisbursed).toBe(amountDue)
    expect(api.getState().xero.accPays[accPayId]!.status).toBe('paid')
    expect(api.getState().billing.cases[caseId]!.status).toBe('disbursed')
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
