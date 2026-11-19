/**
 * Disbursement detected from Xero (catch-up Phase 37; US-09.2.4, FT-10.2,
 * RV-40; OQ-111 answered, D53): the bill is paid in Xero, and only then does
 * the engine record the disbursement, by webhook, poll or the queue, once.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList } from './lifecycle'
import { wireBillingRun } from './billingRun'
import { receivePayment } from './paymentActions'
import { runPayables } from './payablesActions'
import { runReconciliationPoll } from './reconciliationPoll'
import { recordDisbursement } from './disbursementDetection'
import { payBillsInXero, XERO_PAYABLES_ACTOR } from './xeroSimActions'
import { setXeroOutage, wireXeroQueue } from './xeroQueue'
import { advanceClockMinutes } from './clockActions'
import { anaesthetistsOutOfBalanceOf, ledgerPositionOf, pairsForList } from './ledgerSelectors'
import { DEMO_TRIGGER_ACTOR, OFFICE_ACTOR } from './demoActors'
import { ANAE } from '../domain/seed'
import { projectedListId } from '../domain/slots'
import { roundToCents, toCents } from '../domain/billing/money'
import { isBookingPair } from '../domain/billing/ledger'
import type { BookingLedgerPair } from '../domain/types'

const AM20 = projectedListId(ANAE.souter, '2026-07-20', 'AM')

const unwires: (() => void)[] = []
afterEach(() => {
  while (unwires.length > 0) unwires.pop()!()
})

function paidIn(fraction = 1): { api: BoundAppStore; pair: BookingLedgerPair; accPayId: string } {
  const api = createAppStore()
  unwires.push(wireBillingRun(api), wireXeroQueue(api))
  expect(authoriseList(api, OFFICE_ACTOR, AM20).ok).toBe(true)
  const pair = pairsForList(api.getState(), AM20).find((p) => p.payable !== undefined && p.receivable.xeroAccRecId !== undefined)!
  const amount = roundToCents(pair.receivable.amount * fraction)
  expect(receivePayment(api, { accRecId: pair.receivable.xeroAccRecId!, amount, idempotencyKey: `PAY-${fraction}`, source: 'webhook' }).ok).toBe(true)
  return { api, pair, accPayId: pair.payable!.xeroAccPayId! }
}

function legOf(api: BoundAppStore, pairId: string) {
  const p = api.getState().billing.ledger[pairId]!
  return isBookingPair(p) ? p.payable! : undefined
}

function conserved(api: BoundAppStore): void {
  for (const p of Object.values(api.getState().billing.ledger)) {
    if (!isBookingPair(p) || p.payable === undefined) continue
    expect(toCents(p.payable.disbursedAmount), p.id).toBeLessThanOrEqual(toCents(p.payable.releasedAmount))
    expect(toCents(p.payable.releasedAmount), p.id).toBeLessThanOrEqual(toCents(p.receivable.receivedAmount))
    expect(toCents(p.receivable.receivedAmount), p.id).toBeLessThanOrEqual(toCents(p.receivable.amount))
  }
  expect(ledgerPositionOf(api.getState()).imbalance).toBe(0)
  expect(anaesthetistsOutOfBalanceOf(api.getState())).toEqual([])
}

describe('detecting a bill paid in Xero (work item 8)', () => {
  it('the webhook delivered: Xero pays, the engine records it once', () => {
    const { api, pair, accPayId } = paidIn()
    const out = payBillsInXero(api, XERO_PAYABLES_ACTOR, [{ accPayId }], { webhook: 'deliver' })
    expect(out.ok && out.value.recordedCount).toBe(1)
    expect(legOf(api, pair.id)!.disbursedAmount).toBe(pair.receivable.amount)
    expect(legOf(api, pair.id)!.paidOutAtISO).toBeDefined()
    const lds = Object.values(api.getState().billing.disbursements).filter((d) => d.pairId === pair.id)
    expect(lds).toHaveLength(1)
    expect(lds[0]).toMatchObject({ detectedBy: 'webhook', idempotencyKey: expect.stringMatching(/^BILLPAY-/), xeroDisbursementId: expect.any(String) })
    expect(api.getState().xero.accPays[accPayId]!.status).toBe('paid')
    conserved(api)
  })

  it('the webhook missed: Xero shows paid, the engine shows released until the poll, which records it once at the payment date', () => {
    const { api, pair, accPayId } = paidIn()
    payBillsInXero(api, XERO_PAYABLES_ACTOR, [{ accPayId }], { webhook: 'missed' })
    expect(api.getState().xero.accPays[accPayId]!.status).toBe('paid')
    expect(legOf(api, pair.id)!.disbursedAmount).toBe(0)
    expect(legOf(api, pair.id)!.releasedAmount).toBe(pair.receivable.amount)
    const bill = Object.values(api.getState().xero.disbursements).find((d) => d.accPayId === accPayId)!
    advanceTo(api, 90)
    expect(runReconciliationPoll(api)).toMatchObject({ disbursements: 1 })
    const ld = Object.values(api.getState().billing.disbursements).find((d) => d.pairId === pair.id)!
    expect(ld).toMatchObject({ detectedBy: 'poll', atISO: bill.atISO })
    // A second poll and a replayed webhook are no-ops.
    expect(runReconciliationPoll(api).disbursements).toBe(0)
    expect(recordDisbursement(api, { accPayId, xeroDisbursementId: bill.id, amount: bill.amount, atISO: bill.atISO, idempotencyKey: bill.idempotencyKey, detectedBy: 'webhook', payablesRunId: bill.payablesRunId })).toMatchObject({ ok: true, value: { applied: false } })
    expect(Object.values(api.getState().billing.disbursements).filter((d) => d.pairId === pair.id)).toHaveLength(1)
    conserved(api)
  })

  it('part then balance: each payment disburses exactly its increment and never more than released', () => {
    const { api, pair, accPayId } = paidIn(0.5)
    const half = roundToCents(pair.receivable.amount * 0.5)
    payBillsInXero(api, XERO_PAYABLES_ACTOR, [{ accPayId }], { webhook: 'deliver' })
    expect(legOf(api, pair.id)!.disbursedAmount).toBe(half)
    // Nothing more authorised: a second run pays nothing.
    expect(payBillsInXero(api, XERO_PAYABLES_ACTOR, [{ accPayId }], { webhook: 'deliver' })).toMatchObject({ ok: true, value: { paid: [] } })
    receivePayment(api, { accRecId: pair.receivable.xeroAccRecId!, amount: roundToCents(pair.receivable.amount - half), idempotencyKey: 'PAY-REST', source: 'webhook' })
    payBillsInXero(api, XERO_PAYABLES_ACTOR, [{ accPayId }], { webhook: 'deliver' })
    expect(legOf(api, pair.id)!.disbursedAmount).toBe(pair.receivable.amount)
    // An amount above what is released is refused.
    expect(recordDisbursement(api, { accPayId, xeroDisbursementId: 'DSBX', amount: 1, atISO: '2026-07-21T09:00:00', idempotencyKey: 'BILLPAY-X', detectedBy: 'webhook', payablesRunId: 'PRX' })).toMatchObject({ ok: false, code: 'aboveReleased' })
    conserved(api)
  })

  it('an outage queues the disbursement sync; the restore records it once', () => {
    const { api, pair, accPayId } = paidIn()
    setXeroOutage(api, DEMO_TRIGGER_ACTOR, true)
    const out = payBillsInXero(api, XERO_PAYABLES_ACTOR, [{ accPayId }], { webhook: 'deliver' })
    expect(out.ok && out.value.paid[0]!.queued).toBe(true)
    expect(legOf(api, pair.id)!.disbursedAmount).toBe(0)
    setXeroOutage(api, DEMO_TRIGGER_ACTOR, false)
    expect(Object.values(api.getState().billing.disbursements).filter((d) => d.pairId === pair.id)).toHaveLength(1)
    expect(legOf(api, pair.id)!.disbursedAmount).toBe(pair.receivable.amount)
    conserved(api)
  })

  it('"Run payables in Xero" pays every released leg in Xero and records each; the AA Holding account is never paid', () => {
    const { api } = paidIn()
    const holdingAccPay = Object.values(api.getState().xero.accPays).find((p) => p.payeeAccount === 'aaHoldingAccount')!
    const out = runPayables(api, OFFICE_ACTOR)
    expect(out.ok && out.value.billsPaid).toBeGreaterThan(0)
    expect(out.ok && out.value.disbursedCount).toBe(out.ok ? out.value.billsPaid : -1)
    expect(Object.values(api.getState().xero.disbursements).some((d) => d.accPayId === holdingAccPay.id)).toBe(false)
    expect(payBillsInXero(api, XERO_PAYABLES_ACTOR, [{ accPayId: holdingAccPay.id }], { webhook: 'deliver' })).toMatchObject({ ok: true, value: { paid: [] } })
    conserved(api)
  })
})

/** Move the clock on (the poll then runs by hand), so the detection is later than the bill payment. */
function advanceTo(api: BoundAppStore, minutes: number): void {
  advanceClockMinutes(api, minutes)
}
