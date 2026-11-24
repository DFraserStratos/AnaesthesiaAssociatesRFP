/**
 * The Xero outage, the gate and the durable sync queue (catch-up Phase 37;
 * EP-09): authorising is never blocked, every call queues with backoff on the
 * demo clock, alerts after five attempts, and a restore drains in order with no
 * duplicate pair, contact, receipt or disbursement.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList } from './lifecycle'
import { wireBillingRun } from './billingRun'
import { advanceClockDays, advanceClockMinutes, resetDemo } from './clockActions'
import { processXeroQueue, retryXeroItemNow, setXeroOutage, wireXeroQueue } from './xeroQueue'
import { deliverPaymentWebhook } from './paymentActions'
import { runReconciliationPoll } from './reconciliationPoll'
import { armHandoffFault } from './demoSettingsActions'
import { handoffListPairs } from './xeroHandoff'
import { handoffQueuedFor, ledgerPositionOf, openXeroQueueItems, pairsForList, xeroQueueView, billingAttentionCount } from './ledgerSelectors'
import { openBillingExceptions } from './ledgerSelectors'
import { DEMO_TRIGGER_ACTOR, OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { XERO_FAULT_ERROR, XERO_OUTAGE_ERROR } from './xeroGate'
import { ANAE } from '../domain/seed'
import { projectedListId } from '../domain/slots'
import { roundToCents } from '../domain/billing/money'

const AM20 = projectedListId(ANAE.souter, '2026-11-23', 'AM')
const PM20 = projectedListId(ANAE.souter, '2026-11-23', 'PM')

const unwires: (() => void)[] = []
afterEach(() => {
  while (unwires.length > 0) unwires.pop()!()
})

function store(): BoundAppStore {
  const api = createAppStore()
  unwires.push(wireBillingRun(api), wireXeroQueue(api))
  return api
}

function authorise(api: BoundAppStore, ...listIds: string[]): void {
  for (const id of listIds) expect(authoriseList(api, OFFICE_ACTOR, id).ok).toBe(true)
}

function mon20Pairs(api: BoundAppStore) {
  return [...pairsForList(api.getState(), AM20), ...pairsForList(api.getState(), PM20)]
}

describe('the outage and the queue (work items 6 and 7)', () => {
  it('authorising during an outage bills and queues one hand-off per ledger pair; no Xero pair exists', () => {
    const api = store()
    const accRecsBefore = Object.keys(api.getState().xero.accRecs).length
    expect(setXeroOutage(api, DEMO_TRIGGER_ACTOR, true).ok).toBe(true)
    authorise(api, AM20, PM20)
    const pairs = mon20Pairs(api)
    expect(pairs.length).toBeGreaterThan(0)
    expect(openBillingExceptions(api.getState())).toEqual([])
    expect(api.getState().schedule.lists[AM20]!.billedAtISO).toBeDefined()
    expect(Object.keys(api.getState().xero.accRecs)).toHaveLength(accRecsBefore)
    const queued = openXeroQueueItems(api.getState())
    expect(queued.filter((q) => q.kind === 'handoff').map((q) => q.target.pairId).sort()).toEqual(pairs.map((p) => p.id).sort())
    expect(queued.every((q) => q.attempts === 1 && q.lastError === XERO_OUTAGE_ERROR && q.nextAttemptAtISO === '2026-11-24T08:02:00')).toBe(true)
    // A pair merely waiting does not raise the nav badge.
    expect(billingAttentionCount(api.getState())).toBe(0)
  })

  it('each clock change makes one attempt per due item and backs off 2, 4, 8 minutes', () => {
    const api = store()
    setXeroOutage(api, DEMO_TRIGGER_ACTOR, true)
    authorise(api, AM20)
    const id = openXeroQueueItems(api.getState())[0]!.id
    advanceClockMinutes(api, 15)
    expect(api.getState().billing.xeroQueue[id]).toMatchObject({ attempts: 2, nextAttemptAtISO: '2026-11-24T08:19:00', status: 'waiting' })
    advanceClockMinutes(api, 15)
    expect(api.getState().billing.xeroQueue[id]).toMatchObject({ attempts: 3, nextAttemptAtISO: '2026-11-24T08:38:00' })
    // A seven-day jump is one more attempt, not a burst.
    advanceClockDays(api, 7)
    expect(api.getState().billing.xeroQueue[id]!.attempts).toBe(4)
  })

  it('nothing due: no mutation and no audit', () => {
    const api = store()
    setXeroOutage(api, DEMO_TRIGGER_ACTOR, true)
    authorise(api, AM20)
    const audit = api.getState().audit.length
    const billing = api.getState().billing
    advanceClockMinutes(api, 1)
    expect(api.getState().audit).toHaveLength(audit)
    expect(api.getState().billing).toBe(billing)
  })

  it('five failures alert once and raise the nav badge', () => {
    const api = store()
    setXeroOutage(api, DEMO_TRIGGER_ACTOR, true)
    authorise(api, AM20)
    const items = openXeroQueueItems(api.getState())
    for (let i = 0; i < 6; i += 1) advanceClockMinutes(api, 60)
    const after = items.map((q) => api.getState().billing.xeroQueue[q.id]!)
    expect(after.every((q) => q.status === 'alerted' && q.attempts >= 5)).toBe(true)
    expect(api.getState().audit.filter((a) => a.action === 'xero.retryAlert')).toHaveLength(items.length)
    expect(billingAttentionCount(api.getState())).toBe(items.length)
    expect(xeroQueueView(api.getState()).open.every((r) => r.status === 'Alert raised')).toBe(true)
  })

  it('restore drains in id order: one Xero pair per ledger pair, the payer contact once, and a second restore or a retry changes nothing', () => {
    const api = store()
    setXeroOutage(api, DEMO_TRIGGER_ACTOR, true)
    authorise(api, AM20, PM20)
    advanceClockMinutes(api, 15)
    const ids = openXeroQueueItems(api.getState()).map((q) => q.id)
    const out = setXeroOutage(api, DEMO_TRIGGER_ACTOR, false)
    expect(out.ok && out.value.sent).toBe(ids.length)
    const sentOrder = api.getState().audit.filter((a) => a.action === 'xero.queueSent').map((a) => a.entityId)
    expect(sentOrder).toEqual(ids)
    const s = api.getState()
    for (const p of mon20Pairs(api)) {
      expect(p.receivable.xeroAccRecId, p.id).toBeDefined()
      expect(Object.values(s.xero.accRecs).filter((r) => r.reference === p.id), p.id).toHaveLength(1)
    }
    const numbers = Object.values(s.xero.contacts).map((c) => c.contactNumber)
    expect(new Set(numbers).size).toBe(numbers.length)
    const xeroBefore = JSON.stringify(s.xero)
    expect(setXeroOutage(api, DEMO_TRIGGER_ACTOR, false).ok).toBe(false)
    expect(retryXeroItemNow(api, OFFICE_ACTOR, ids[0]!).ok).toBe(false)
    expect(processXeroQueue(api, { force: true })).toEqual({ attempted: 0, sent: 0, failed: 0 })
    expect(JSON.stringify(api.getState().xero)).toBe(xeroBefore)
  })

  it('the armed fault fails once; the pair appears on the next due tick with no manual step', () => {
    const api = store()
    armHandoffFault(api, OFFICE_ACTOR)
    authorise(api, AM20)
    const item = openXeroQueueItems(api.getState())[0]!
    expect(item).toMatchObject({ kind: 'handoff', attempts: 1, lastError: XERO_FAULT_ERROR })
    expect(openXeroQueueItems(api.getState())).toHaveLength(1)
    expect(api.getState().settings.failNextHandoff).toBe(false)
    advanceClockMinutes(api, 15)
    expect(api.getState().billing.xeroQueue[item.id]!.status).toBe('sent')
    expect(api.getState().billing.ledger[item.target.pairId!]!.receivable.xeroAccRecId).toBeDefined()
  })

  it('a half payment during the outage: one Xero payment, no receipt; restore records exactly one and authorises the ACCPAY for it', () => {
    const api = store()
    authorise(api, AM20)
    const pair = mon20Pairs(api).find((p) => p.payable !== undefined)!
    const accRecId = pair.receivable.xeroAccRecId!
    setXeroOutage(api, DEMO_TRIGGER_ACTOR, true)
    const half = roundToCents(pair.receivable.amount / 2)
    const out = deliverPaymentWebhook(api, { accRecId, amount: half, idempotencyKey: 'OUTAGE-HALF' })
    expect(out).toMatchObject({ ok: true, value: { applied: false, queued: true } })
    expect(Object.values(api.getState().xero.payments).filter((p) => p.idempotencyKey === 'OUTAGE-HALF')).toHaveLength(1)
    expect(Object.values(api.getState().billing.receipts).filter((r) => r.idempotencyKey === 'OUTAGE-HALF')).toHaveLength(0)
    expect(api.getState().billing.ledger[pair.id]!.receivable.receivedAmount).toBe(0)
    // A replay during the outage queues nothing new.
    deliverPaymentWebhook(api, { accRecId, amount: half, idempotencyKey: 'OUTAGE-HALF' })
    expect(openXeroQueueItems(api.getState()).filter((q) => q.kind === 'paymentSync')).toHaveLength(1)
    setXeroOutage(api, DEMO_TRIGGER_ACTOR, false)
    const s = api.getState()
    expect(Object.values(s.billing.receipts).filter((r) => r.idempotencyKey === 'OUTAGE-HALF')).toHaveLength(1)
    const after = s.billing.ledger[pair.id]!
    expect(after.kind !== 'aaFee' && after.payable?.releasedAmount).toBe(half)
    expect(s.xero.accPays[pair.payable!.xeroAccPayId!]!.amountAuthorised).toBe(half)
    expect(Object.values(s.xero.payments).filter((p) => p.idempotencyKey === 'OUTAGE-HALF')).toHaveLength(1)
    expect(ledgerPositionOf(s).imbalance).toBe(0)
  })

  it('the poll catching the payment first, then the queue draining, is still one receipt', () => {
    const api = store()
    authorise(api, AM20)
    const pair = mon20Pairs(api).find((p) => p.payable !== undefined)!
    setXeroOutage(api, DEMO_TRIGGER_ACTOR, true)
    expect(runReconciliationPoll(api).queued).toBe(true)
    deliverPaymentWebhook(api, { accRecId: pair.receivable.xeroAccRecId!, amount: 100, idempotencyKey: 'POLL-FIRST' })
    setXeroOutage(api, DEMO_TRIGGER_ACTOR, false)
    const receipts = Object.values(api.getState().billing.receipts).filter((r) => r.idempotencyKey === 'POLL-FIRST')
    expect(receipts).toHaveLength(1)
    expect(receipts[0]!.source).toBe('poll')
  })

  it('the archive job skips during an outage, with no mutation', async () => {
    const { runArchiveJob, ARCHIVE_SKIPPED_OUTAGE } = await import('./archiveActions')
    const api = store()
    setXeroOutage(api, DEMO_TRIGGER_ACTOR, true)
    const audit = api.getState().audit.length
    expect(runArchiveJob(api)).toMatchObject({ ok: true, value: { count: 0, skippedReason: ARCHIVE_SKIPPED_OUTAGE } })
    expect(api.getState().audit).toHaveLength(audit)
  })

  it('guards: only the demo switches Xero, only the office retries', () => {
    const api = store()
    expect(setXeroOutage(api, SOUTER_ACTOR, true).ok).toBe(false)
    setXeroOutage(api, DEMO_TRIGGER_ACTOR, true)
    expect(setXeroOutage(api, DEMO_TRIGGER_ACTOR, true).ok).toBe(false)
    authorise(api, AM20)
    const id = openXeroQueueItems(api.getState())[0]!.id
    expect(retryXeroItemNow(api, SOUTER_ACTOR, id).ok).toBe(false)
    // Retry now during the outage is one more failed attempt.
    expect(retryXeroItemNow(api, OFFICE_ACTOR, id)).toMatchObject({ ok: true, value: { failed: 1 } })
    expect(api.getState().billing.xeroQueue[id]!.attempts).toBe(2)
  })

  it('a reset clears the outage and the queue', () => {
    const api = store()
    setXeroOutage(api, DEMO_TRIGGER_ACTOR, true)
    authorise(api, AM20)
    resetDemo(api)
    expect(api.getState().settings.xeroOutage).toBeUndefined()
    expect(api.getState().billing.xeroQueue).toEqual({})
    expect(api.getState().billing.xeroDivergences).toEqual({})
  })

  it('is deterministic', () => {
    const run = () => {
      const api = store()
      setXeroOutage(api, DEMO_TRIGGER_ACTOR, true)
      authorise(api, AM20, PM20)
      advanceClockMinutes(api, 45)
      setXeroOutage(api, DEMO_TRIGGER_ACTOR, false)
      return JSON.stringify([api.getState().billing.xeroQueue, api.getState().xero.accRecs])
    }
    expect(run()).toBe(run())
  })

  it('a pair already queued is not queued twice by a second hand-off call', () => {
    const api = store()
    setXeroOutage(api, DEMO_TRIGGER_ACTOR, true)
    authorise(api, AM20)
    const pair = mon20Pairs(api)[0]!
    const before = Object.keys(api.getState().billing.xeroQueue).length
    expect(handoffQueuedFor(api.getState(), pair.id)).toBeDefined()
    // Re-emitting the run's hand-offs (as a retried Booking would) adds no item.
    handoffListPairs(api, AM20)
    expect(Object.keys(api.getState().billing.xeroQueue)).toHaveLength(before)
  })
})
