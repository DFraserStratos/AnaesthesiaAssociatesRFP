/**
 * A void or amendment made directly in Xero, flagged at the next poll
 * (catch-up Phase 37; EP-09, US-09.2.2): invisible until the poll, flagged
 * once, resolved by the office with a note, and no money moves.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList } from './lifecycle'
import { wireBillingRun } from './billingRun'
import { deliverPaymentWebhook, receivePayment } from './paymentActions'
import { runReconciliationPoll } from './reconciliationPoll'
import { resolveXeroDivergence } from './xeroDivergenceActions'
import { amendAccRecInXero, voidAccRecInXero, voidInXeroRefusal, XERO_DEMO_AMENDMENT, XERO_STAFF_ACTOR } from './xeroSimActions'
import { billingAttentionCount, openXeroDivergences, pairsForList } from './ledgerSelectors'
import { billingMonitor, openAccRecs } from './selectors'
import { OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { ANAE } from '../domain/seed'
import { projectedListId } from '../domain/slots'
import { roundToCents } from '../domain/billing/money'

const AM20 = projectedListId(ANAE.souter, '2026-07-20', 'AM')

const unwires: (() => void)[] = []
afterEach(() => {
  while (unwires.length > 0) unwires.pop()!()
})

function authorised(): { api: BoundAppStore; first: string; second: string } {
  const api = createAppStore()
  unwires.push(wireBillingRun(api))
  expect(authoriseList(api, OFFICE_ACTOR, AM20).ok).toBe(true)
  const recs = pairsForList(api.getState(), AM20).filter((p) => p.payable !== undefined && p.receivable.xeroAccRecId !== undefined).map((p) => p.receivable.xeroAccRecId!)
  expect(recs.length).toBeGreaterThanOrEqual(2)
  return { api, first: recs[0]!, second: recs[1]! }
}

describe('changes made directly in Xero (work item 9)', () => {
  it('a void is invisible until the poll, flagged once, and the payment pickers drop it', () => {
    const { api, first } = authorised()
    expect(voidAccRecInXero(api, XERO_STAFF_ACTOR, first).ok).toBe(true)
    expect(openXeroDivergences(api.getState())).toEqual([])
    expect(billingAttentionCount(api.getState())).toBe(0)
    expect(runReconciliationPoll(api).divergences).toBe(1)
    const [flag] = openXeroDivergences(api.getState())
    expect(flag).toMatchObject({ kind: 'voidedInXero', accRecId: first, status: 'open' })
    expect(runReconciliationPoll(api).divergences).toBe(0)
    expect(openXeroDivergences(api.getState())).toHaveLength(1)
    expect(billingAttentionCount(api.getState())).toBe(1)
    expect(openAccRecs(api.getState()).some((c) => c.accRecId === first)).toBe(false)
    expect(receivePayment(api, { accRecId: first, amount: 1, idempotencyKey: 'V1', source: 'webhook' })).toMatchObject({ ok: false, code: 'voidedInXero' })
    expect(deliverPaymentWebhook(api, { accRecId: first, amount: 1, idempotencyKey: 'V2' })).toMatchObject({ ok: false, code: 'voidedInXero' })
    // The monitor's row reads it.
    const row = billingMonitor(api.getState()).find((r) => r.listId === AM20)!
    expect(row.xeroFlaggedCount).toBe(1)
    expect(row.stages.find((s) => s.key === 'xero')!.state).toBe('failed')
  })

  it('Xero refuses to void an invoice with a payment applied', () => {
    const { api, first } = authorised()
    receivePayment(api, { accRecId: first, amount: 10, idempotencyKey: 'P1', source: 'webhook' })
    expect(voidInXeroRefusal(api.getState(), first)).toMatch(/payments applied/)
    expect(voidAccRecInXero(api, XERO_STAFF_ACTOR, first).ok).toBe(false)
  })

  it('an amendment is flagged once; a full payment of what Xero shows leaves the ledger open by exactly the difference', () => {
    const { api, second } = authorised()
    const pair = pairsForList(api.getState(), AM20).find((p) => p.receivable.xeroAccRecId === second)!
    const issued = pair.receivable.amount
    expect(amendAccRecInXero(api, XERO_STAFF_ACTOR, second)).toMatchObject({ ok: true, value: { total: roundToCents(issued - XERO_DEMO_AMENDMENT) } })
    expect(amendAccRecInXero(api, XERO_STAFF_ACTOR, second)).toMatchObject({ ok: false, message: 'Already amended in Xero' })
    expect(api.getState().billing.ledger[pair.id]!.receivable.amount).toBe(issued)
    expect(runReconciliationPoll(api).divergences).toBe(1)
    expect(openXeroDivergences(api.getState())[0]).toMatchObject({ kind: 'amendedInXero', xeroShows: { total: roundToCents(issued - XERO_DEMO_AMENDMENT) }, engineHolds: { amount: issued } })
    const remaining = openAccRecs(api.getState()).find((c) => c.accRecId === second)!.remaining
    expect(remaining).toBe(roundToCents(issued - XERO_DEMO_AMENDMENT))
    receivePayment(api, { accRecId: second, amount: remaining, idempotencyKey: 'FULL', source: 'webhook' })
    const leg = api.getState().billing.ledger[pair.id]!.receivable
    expect(roundToCents(leg.amount - leg.receivedAmount)).toBe(XERO_DEMO_AMENDMENT)
    expect(runReconciliationPoll(api).divergences).toBe(0)
  })

  it('resolving records the outcome with a note, office only, and changes no amount', () => {
    const { api, first } = authorised()
    voidAccRecInXero(api, XERO_STAFF_ACTOR, first)
    runReconciliationPoll(api)
    const flag = openXeroDivergences(api.getState())[0]!
    const ledger = api.getState().billing.ledger
    expect(resolveXeroDivergence(api, SOUTER_ACTOR, flag.id, { outcome: 'noAction', note: 'x' }).ok).toBe(false)
    expect(resolveXeroDivergence(api, OFFICE_ACTOR, flag.id, { outcome: 'noAction', note: '  ' })).toMatchObject({ ok: false, code: 'noteRequired' })
    expect(resolveXeroDivergence(api, OFFICE_ACTOR, flag.id, { outcome: 'reissueInXero', note: 'Re-issued in Xero by Kirsty' }).ok).toBe(true)
    expect(api.getState().billing.xeroDivergences[flag.id]).toMatchObject({ status: 'resolved', resolution: { outcome: 'reissueInXero', note: 'Re-issued in Xero by Kirsty' } })
    expect(api.getState().billing.ledger).toBe(ledger)
    expect(openXeroDivergences(api.getState())).toEqual([])
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'xero.divergenceResolved', role: 'office' })
  })
})
