/**
 * Payment detection tests (Phase 10; WI3, X4).
 *
 * Webhook idempotency (replay is a no-op; two distinct partials both apply),
 * partial pro-rata authorisation of the ACCPAY, webhook-then-poll double
 * delivery causing no double effect, receipts (GST) as the idempotency
 * key-set, and a pre-payment webhook clearing the Phase-09 completion gate
 * without an override.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, completeCard, submitList } from './lifecycle'
import { runBillingForList, handoffListCases } from './billingRun'
import { raisePreProcedureInvoice } from './prepaymentActions'
import { receivePayment, gstComponentOf } from './paymentActions'
import { runReconciliationPoll } from './reconciliationPoll'
import { casesForList, casesForCard, prepaymentStatusFor } from './selectors'
import { roundToCents, toCents } from '../domain/billing/money'
import type { Actor } from './mutate'
import { SEED_MARKERS } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }

function store(): BoundAppStore {
  return createAppStore()
}
function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}
function listOf(api: BoundAppStore, cardId: string): string {
  const card = api.getState().schedule.cards[cardId]
  if (card === undefined) throw new Error(`missing card ${cardId}`)
  return card.listId
}
/** Bill + hand off the single-invoice COS list, returning its case + ACCREC. */
function billCosAndHandoff(api: BoundAppStore): { caseId: string; accRecId: string; amountDue: number } {
  const listId = listOf(api, marker('cosAccContractCard'))
  expect(submitList(api, OFFICE, listId).ok).toBe(true)
  expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
  expect(runBillingForList(api, listId).ok).toBe(true)
  handoffListCases(api, listId)
  const c = casesForList(api.getState(), listId).find((x) => x.status !== 'failed')!
  const accRec = api.getState().xero.accRecs[c.accRecId!]!
  return { caseId: c.id, accRecId: c.accRecId!, amountDue: accRec.amountDue }
}

describe('webhook payment detection', () => {
  it('a full payment marks the ACCREC paid, authorises the ACCPAY, and mirrors the case', () => {
    const api = store()
    const { caseId, accRecId, amountDue } = billCosAndHandoff(api)
    const res = receivePayment(api, { accRecId, amount: amountDue, idempotencyKey: 'K-full', source: 'webhook' })
    expect(res).toMatchObject({ ok: true, value: { applied: true } })

    const s = api.getState()
    const accRec = s.xero.accRecs[accRecId]!
    expect(accRec.amountReceived).toBe(amountDue)
    expect(accRec.status).toBe('paid')
    const c = s.billing.cases[caseId]!
    const accPay = s.xero.accPays[c.accPayId!]!
    expect(accPay.amountAuthorised).toBe(amountDue)
    expect(accPay.status).toBe('authorised')
    expect(c.receivedAmount).toBe(amountDue)
    expect(c.authorisedAmount).toBe(amountDue)
    expect(c.status).toBe('paid')
    expect(c.paidInAtISO).toBeDefined()
    // One receipt for THIS case (the seed ships historical receipts too), GST = 3/23 of the gross.
    const receipts = Object.values(s.billing.receipts).filter((r) => r.caseId === caseId)
    expect(receipts).toHaveLength(1)
    expect(receipts[0]!.grossAmount).toBe(amountDue)
    expect(receipts[0]!.gstAmount).toBe(gstComponentOf(amountDue))
  })

  it('is idempotent — replaying the same key is a no-op', () => {
    const api = store()
    const { accRecId, amountDue } = billCosAndHandoff(api)
    expect(receivePayment(api, { accRecId, amount: amountDue, idempotencyKey: 'K1', source: 'webhook' }).ok).toBe(true)
    const receivedAfterFirst = api.getState().xero.accRecs[accRecId]!.amountReceived
    const receiptsAfterFirst = Object.keys(api.getState().billing.receipts).length

    const replay = receivePayment(api, { accRecId, amount: amountDue, idempotencyKey: 'K1', source: 'webhook' })
    expect(replay).toMatchObject({ ok: true, value: { applied: false } })
    expect(api.getState().xero.accRecs[accRecId]!.amountReceived).toBe(receivedAfterFirst)
    expect(Object.keys(api.getState().billing.receipts).length).toBe(receiptsAfterFirst)
  })

  it('two distinct partials both apply and accumulate; the ACCPAY authorises pro-rata', () => {
    const api = store()
    const { caseId, accRecId, amountDue } = billCosAndHandoff(api)
    const p1 = roundToCents(amountDue * 0.4)
    const p2 = roundToCents(amountDue - p1)

    expect(receivePayment(api, { accRecId, amount: p1, idempotencyKey: 'P1', source: 'webhook' }).ok).toBe(true)
    let c = api.getState().billing.cases[caseId]!
    expect(c.receivedAmount).toBe(p1)
    expect(c.authorisedAmount).toBe(p1) // pro-rata == received (accPay total == accRec due)
    expect(c.status).toBe('partPaid')
    expect(api.getState().xero.accRecs[accRecId]!.status).toBe('awaitingPayment')

    expect(receivePayment(api, { accRecId, amount: p2, idempotencyKey: 'P2', source: 'webhook' }).ok).toBe(true)
    c = api.getState().billing.cases[caseId]!
    expect(c.receivedAmount).toBe(amountDue)
    expect(c.status).toBe('paid')
    expect(Object.values(api.getState().billing.receipts).filter((r) => r.caseId === caseId)).toHaveLength(2)
  })
})

describe('reconciliation poll (safety net)', () => {
  it('catches the seeded missed webhook and dates the receipt at the payment date (not detection day)', () => {
    const api = store()
    // The seeded missed webhook: a Xero PaymentIn with no mirroring receipt.
    const mirrored = new Set(Object.values(api.getState().billing.receipts).map((r) => r.idempotencyKey))
    const missed = Object.values(api.getState().xero.payments).find((p) => !mirrored.has(p.idempotencyKey))
    expect(missed).toBeDefined()
    const accRecId = missed!.accRecId
    expect(api.getState().xero.accRecs[accRecId]!.amountReceived).toBe(0) // not yet mirrored

    const applied = runReconciliationPoll(api)
    expect(applied).toBeGreaterThanOrEqual(1)

    const accRec = api.getState().xero.accRecs[accRecId]!
    expect(accRec.amountReceived).toBe(accRec.amountDue)
    expect(accRec.status).toBe('paid')
    // The receipt lands in the payment's own period, not the poll/clock day.
    const receipt = Object.values(api.getState().billing.receipts).find((r) => r.idempotencyKey === missed!.idempotencyKey)!
    expect(receipt.atISO).toBe(missed!.atISO)
    expect(receipt.source).toBe('poll')

    // A second poll is a no-op (now mirrored).
    expect(runReconciliationPoll(api)).toBe(0)
  })

  it('webhook then poll causes no double effect on the paid ACCREC (idempotent by key)', () => {
    const api = store()
    const { caseId, accRecId, amountDue } = billCosAndHandoff(api)
    expect(receivePayment(api, { accRecId, amount: amountDue, idempotencyKey: 'WH', source: 'webhook' }).ok).toBe(true)
    const receivedBefore = api.getState().xero.accRecs[accRecId]!.amountReceived
    const caseReceiptsBefore = Object.values(api.getState().billing.receipts).filter((r) => r.caseId === caseId).length

    // The poll may catch OTHER seeded missed webhooks, but never re-applies this
    // already-mirrored payment (its receipt key is present).
    runReconciliationPoll(api)
    expect(api.getState().xero.accRecs[accRecId]!.amountReceived).toBe(receivedBefore)
    expect(Object.values(api.getState().billing.receipts).filter((r) => r.caseId === caseId).length).toBe(caseReceiptsBefore)
  })
})

describe('pre-payment webhook clears the completion gate (closes Phase 09 deferral)', () => {
  it('paying the split pre-payment pre-invoice clears the gate without an override', () => {
    const api = store()
    const riley = marker('prepaymentCard')
    expect(prepaymentStatusFor(api.getState(), riley)).toBe('required')

    // Office raises the pre-invoice → handoff → ACCREC to the patient.
    expect(raisePreProcedureInvoice(api, OFFICE, riley).ok).toBe(true)
    expect(prepaymentStatusFor(api.getState(), riley)).toBe('outstanding')
    const preCase = casesForCard(api.getState(), riley)[0]!
    const accRec = api.getState().xero.accRecs[preCase.accRecId!]!

    // Webhook pays it in full → case 'paid' → gate clears.
    expect(receivePayment(api, { accRecId: accRec.id, amount: accRec.amountDue, idempotencyKey: 'PRE', source: 'webhook' }).ok).toBe(true)
    expect(prepaymentStatusFor(api.getState(), riley)).toBe('paid')

    // The card now completes with no override (its only blocker was the gate).
    expect(api.getState().schedule.cards[riley]!.prepaymentOverride).toBeUndefined()
    const done = completeCard(api, SOUTER, riley)
    expect(done.ok).toBe(true)
    expect(toCents(accRec.amountDue)).toBeGreaterThan(0)
  })
})
