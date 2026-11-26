/**
 * The Xero tab's pure view (US-13.3.2): groups in order, Needs action holds
 * the waiting hand-offs, the pills narrow, search and the anaesthetist filter
 * cover both kinds, paging is by row and the count line reads right.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from '../../../../store/appStore'
import { authoriseList } from '../../../../store/lifecycle'
import { wireBillingRun } from '../../../../store/billingRun'
import { setXeroOutage, wireXeroQueue } from '../../../../store/xeroQueue'
import { runReconciliationPoll } from '../../../../store/reconciliationPoll'
import { voidAccRecInXero, XERO_STAFF_ACTOR } from '../../../../store/xeroSimActions'
import { pairsForList } from '../../../../store/ledgerSelectors'
import { invoiceAddresseeName } from '../../../../store/selectors'
import { DEMO_TRIGGER_ACTOR, OFFICE_ACTOR } from '../../../../store/demoActors'
import { isBookingPair } from '../../../../domain/billing/ledger'
import type { BookingLedgerPair, XeroDivergence, XeroQueueItem } from '../../../../domain/types'
import { ANAE } from '../../../../domain/seed'
import { projectedListId } from '../../../../domain/slots'
import { XERO_PAGE_SIZE, xeroCountLine, xeroParamsFrom, xeroTabRows, type XeroTabParams, type XeroTabState } from './xeroTabRows'

const TODAY = '2026-11-24'
const P = (over: Partial<XeroTabParams> = {}): XeroTabParams => ({ q: '', show: 'needs-action', page: 1, ...over })

const base = createAppStore().getState()

/** Seeded Booking pairs with an invoice and an anaesthetist, two anaesthetists apart. */
const pairs = Object.values(base.billing.ledger).filter(
  (p): p is BookingLedgerPair & { anaesthetistId: string } => isBookingPair(p) && p.anaesthetistId !== undefined && base.billing.invoices[p.invoiceId] !== undefined,
)
const pA = pairs[0]!
const pB = pairs.find((p) => p.anaesthetistId !== pA.anaesthetistId)!

function qi(id: string, pairId: string | undefined, status: XeroQueueItem['status'], attempts = 1, over: Partial<XeroQueueItem> = {}): XeroQueueItem {
  return {
    id,
    kind: 'handoff',
    idempotencyKey: `HANDOFF-${pairId ?? id}`,
    target: pairId !== undefined ? { pairId } : {},
    enqueuedAtISO: '2026-11-24T08:00:00',
    attempts,
    nextAttemptAtISO: '2026-11-24T08:30:00',
    lastError: 'Xero did not answer',
    status,
    ...(status === 'sent' ? { sentAtISO: '2026-11-24T09:00:00' } : {}),
    ...over,
  }
}

function dv(id: string, pair: BookingLedgerPair): XeroDivergence {
  return {
    id,
    kind: 'voidedInXero',
    accRecId: `ACC-${pair.id}`,
    pairId: pair.id,
    invoiceId: pair.invoiceId,
    xeroShows: { status: 'voided', total: 0 },
    engineHolds: { amount: 100, outstanding: 100 },
    detectedAtISO: '2026-11-24T08:00:00',
    status: 'open',
  }
}

/** The seed with these queue items and divergences instead of its own. */
function withItems(queue: XeroQueueItem[], divergences: XeroDivergence[] = []): XeroTabState {
  return {
    ...base,
    billing: {
      ...base.billing,
      xeroQueue: Object.fromEntries(queue.map((q) => [q.id, q])),
      xeroDivergences: Object.fromEntries(divergences.map((d) => [d.id, d])),
    },
  }
}

/** One of each: failing on A, waiting on B, retrying on A, a divergence on B, a sent one on A. */
const mixed = withItems(
  [qi('XQ0001', pA.id, 'waiting', 1), qi('XQ0002', pB.id, 'alerted', 5), qi('XQ0003', pA.id, 'alerted', 5, { kind: 'paymentSync', idempotencyKey: 'PAY-1' }), qi('XQ0004', pB.id, 'waiting', 3, { kind: 'correction', idempotencyKey: 'C-1' }), qi('XQ0005', pA.id, 'sent', 2, { kind: 'offsetSync', idempotencyKey: 'OFF-1' })],
  [dv('XD0001', pB)],
)

const nameOf = (id: string) => base.masters.anaesthetists[id as keyof typeof base.masters.anaesthetists]!.name
const keysOf = (v: ReturnType<typeof xeroTabRows>) => v.groups.map((g) => g.key)
const idsOf = (v: ReturnType<typeof xeroTabRows>) => v.groups.flatMap((g) => [...g.queue.map((r) => r.item.id), ...g.divergences.map((d) => d.id)])

describe('xeroParamsFrom', () => {
  it('defaults to Needs action, page 1', () => {
    expect(xeroParamsFrom(new URLSearchParams())).toEqual({ q: '', show: 'needs-action', page: 1 })
    expect(xeroParamsFrom(new URLSearchParams('show=bogus&page=-2')).show).toBe('needs-action')
    expect(xeroParamsFrom(new URLSearchParams('page=two')).page).toBe(1)
    expect(xeroParamsFrom(new URLSearchParams('page=1.5')).page).toBe(1)
  })
  it('reads every param', () => {
    expect(xeroParamsFrom(new URLSearchParams('show=sent&q=%20aa-2026%20&anaesthetist=A1&page=3'))).toEqual({ q: 'aa-2026', show: 'sent', anaesthetistId: 'A1', page: 3 })
  })
})

describe('xeroTabRows: groups and pills', () => {
  it('opens on Needs action: failing, then waiting and retrying, then changed in Xero, every queue kind listed', () => {
    const v = xeroTabRows(mixed, P(), TODAY)
    expect(keysOf(v)).toEqual(['failing', 'waiting', 'changed'])
    expect(v.groups.map((g) => g.title)).toEqual(['Hand-offs failing', 'Hand-offs waiting', 'Changed directly in Xero'])
    expect(v.groups.map((g) => g.count)).toEqual([2, 2, 1])
    expect(idsOf(v)).toEqual(['XQ0002', 'XQ0003', 'XQ0001', 'XQ0004', 'XD0001'])
    expect(v.sent.map((r) => r.item.id)).toEqual(['XQ0005'])
    expect(v.counts).toEqual({ failing: 2, waiting: 2, changed: 1, sent: 1, sentToday: 1 })
    expect(v.total).toBe(5)
  })

  it('Needs action holds a waiting hand-off alone, and drops empty groups', () => {
    const v = xeroTabRows(withItems([qi('XQ0001', pA.id, 'waiting')]), P(), TODAY)
    expect(keysOf(v)).toEqual(['waiting'])
    expect(v.countLine).toBe('1 needs action: 1 hand-off waiting')
  })

  it('Waiting narrows to the waiting and retrying hand-offs', () => {
    const v = xeroTabRows(mixed, P({ show: 'waiting' }), TODAY)
    expect(keysOf(v)).toEqual(['waiting'])
    expect(idsOf(v)).toEqual(['XQ0001', 'XQ0004'])
    expect(v.total).toBe(2)
    expect(v.counts.failing).toBe(2)
  })

  it('Sent after waiting shows no groups, only the sent rows', () => {
    const v = xeroTabRows(mixed, P({ show: 'sent' }), TODAY)
    expect(v.groups).toEqual([])
    expect(v.sent.map((r) => r.item.id)).toEqual(['XQ0005'])
    expect(v.total).toBe(1)
    expect(xeroTabRows(mixed, P({ show: 'sent' }), '2026-11-25').counts.sentToday).toBe(0)
  })

  it('All shows the three groups, an empty one included', () => {
    expect(keysOf(xeroTabRows(mixed, P({ show: 'all' }), TODAY))).toEqual(['failing', 'waiting', 'changed'])
    const onlyFlag = xeroTabRows(withItems([], [dv('XD0001', pA)]), P({ show: 'all' }), TODAY)
    expect(onlyFlag.groups.map((g) => [g.key, g.count])).toEqual([['failing', 0], ['waiting', 0], ['changed', 1]])
    expect(keysOf(xeroTabRows(withItems([], [dv('XD0001', pA)]), P(), TODAY))).toEqual(['changed'])
  })

  it('a poll row with no pair still lists', () => {
    const v = xeroTabRows(withItems([qi('XQ0009', undefined, 'alerted', 5, { kind: 'poll', idempotencyKey: 'POLL-1' })]), P(), TODAY)
    expect(idsOf(v)).toEqual(['XQ0009'])
    expect(v.facts.get('XQ0009')).toEqual({ payer: '' })
  })
})

describe('xeroTabRows: search and the anaesthetist filter', () => {
  it('matches an invoice number on both kinds', () => {
    const number = base.billing.invoices[pB.invoiceId]!.invoiceNumber
    const v = xeroTabRows(mixed, P({ q: number.toLowerCase() }), TODAY)
    expect(idsOf(v)).toEqual(expect.arrayContaining(['XQ0002', 'XQ0004', 'XD0001']))
    expect(idsOf(v)).not.toContain('XQ0001')
  })

  it('matches the payable number', () => {
    const payable = pA.payable?.number
    expect(payable).toBeDefined()
    expect(idsOf(xeroTabRows(mixed, P({ q: payable! }), TODAY))).toEqual(expect.arrayContaining(['XQ0001', 'XQ0003']))
  })

  it('matches the payer, named as the divergence panel names it', () => {
    const payer = invoiceAddresseeName({ masters: base.masters }, base.billing.invoices[pB.invoiceId]!)
    const v = xeroTabRows(mixed, P({ q: payer.toUpperCase() }), TODAY)
    expect(idsOf(v)).toEqual(expect.arrayContaining(['XQ0002', 'XD0001']))
    expect(v.facts.get('XD0001')!.payer).toBe(payer)
  })

  it('matches the anaesthetist', () => {
    const v = xeroTabRows(mixed, P({ q: nameOf(pB.anaesthetistId) }), TODAY)
    expect(idsOf(v)).toEqual(expect.arrayContaining(['XQ0002', 'XQ0004', 'XD0001']))
    expect(idsOf(v)).not.toContain('XQ0001')
  })

  it('the anaesthetist filter applies to hand-offs, divergences and the sent rows', () => {
    const b = xeroTabRows(mixed, P({ anaesthetistId: pB.anaesthetistId, show: 'all' }), TODAY)
    expect(idsOf(b)).toEqual(['XQ0002', 'XQ0004', 'XD0001'])
    expect(b.sent).toEqual([])
    expect(b.facts.get('XD0001')!.anaesthetistId).toBe(pB.anaesthetistId)
    const a = xeroTabRows(mixed, P({ anaesthetistId: pA.anaesthetistId, show: 'all' }), TODAY)
    expect(idsOf(a)).toEqual(['XQ0003', 'XQ0001'])
    expect(a.groups.map((g) => g.count)).toEqual([1, 1, 0])
    expect(a.sent.map((r) => r.item.id)).toEqual(['XQ0005'])
  })
})

describe('xeroTabRows: paging', () => {
  it('pages by row across the groups in order; groups keep their full count; the page is clamped', () => {
    const queue = Array.from({ length: 60 }, (_, i) => qi(`XQ${String(i + 1).padStart(4, '0')}`, pA.id, i < 30 ? 'alerted' : 'waiting', i < 30 ? 5 : 1))
    const s = withItems(queue, [dv('XD0001', pB)])
    const one = xeroTabRows(s, P(), TODAY)
    expect([one.total, one.pages, one.page]).toEqual([61, 2, 1])
    expect(one.groups.map((g) => [g.key, g.count, g.queue.length + g.divergences.length])).toEqual([['failing', 30, 30], ['waiting', 30, 20]])
    expect(idsOf(one)).toHaveLength(XERO_PAGE_SIZE)
    const two = xeroTabRows(s, P({ page: 9 }), TODAY)
    expect(two.page).toBe(2)
    expect(two.groups.map((g) => [g.key, g.count, g.queue.length + g.divergences.length])).toEqual([['waiting', 30, 10], ['changed', 1, 1]])
    expect(xeroTabRows(s, P(), TODAY, { pageSize: 25 }).pages).toBe(3)
  })

  it('an empty view is one page', () => {
    const v = xeroTabRows(withItems([]), P(), TODAY)
    expect([v.groups, v.total, v.page, v.pages, v.countLine]).toEqual([[], 0, 1, 1, 'Nothing needs action'])
  })
})

describe('the count line', () => {
  it('reads the mock, singular and plural, parts with none left out', () => {
    expect(xeroCountLine({ failing: 2, waiting: 0, changed: 1 })).toBe('3 need action: 2 hand-offs failing, 1 changed in Xero')
    expect(xeroCountLine({ failing: 1, waiting: 2, changed: 0 })).toBe('3 need action: 1 hand-off failing, 2 hand-offs waiting')
    expect(xeroCountLine({ failing: 0, waiting: 0, changed: 2 })).toBe('2 need action: 2 changed in Xero')
    expect(xeroCountLine({ failing: 0, waiting: 0, changed: 0 })).toBe('Nothing needs action')
    expect(xeroTabRows(mixed, P(), TODAY).countLine).toBe('5 need action: 2 hand-offs failing, 2 hand-offs waiting, 1 changed in Xero')
    expect(xeroTabRows(mixed, P(), TODAY).countLine).not.toMatch(/[–—]/)
  })
})

describe('xeroTabRows on the store', () => {
  const unwires: (() => void)[] = []
  afterEach(() => {
    while (unwires.length > 0) unwires.pop()!()
  })
  const AM = projectedListId(ANAE.souter, '2026-11-23', 'AM')

  function store(): BoundAppStore {
    const api = createAppStore()
    unwires.push(wireBillingRun(api), wireXeroQueue(api))
    return api
  }

  it('an outage lists each hand-off as waiting under Souter; a void in Xero lists once polled', () => {
    const api = store()
    expect(setXeroOutage(api, DEMO_TRIGGER_ACTOR, true).ok).toBe(true)
    expect(authoriseList(api, OFFICE_ACTOR, AM).ok).toBe(true)
    const n = pairsForList(api.getState(), AM).length
    const v = xeroTabRows(api.getState(), P({ anaesthetistId: ANAE.souter }), TODAY)
    expect(keysOf(v)).toEqual(['waiting'])
    expect(v.counts.waiting).toBe(n)
    expect(v.countLine).toMatch(/hand-offs? waiting$/)

    const api2 = store()
    expect(authoriseList(api2, OFFICE_ACTOR, AM).ok).toBe(true)
    const rec = pairsForList(api2.getState(), AM).find((p) => p.payable !== undefined && p.receivable.xeroAccRecId !== undefined)!.receivable.xeroAccRecId!
    expect(voidAccRecInXero(api2, XERO_STAFF_ACTOR, rec).ok).toBe(true)
    runReconciliationPoll(api2)
    const w = xeroTabRows(api2.getState(), P({ anaesthetistId: ANAE.souter }), TODAY)
    expect(w.groups.map((g) => [g.key, g.count])).toEqual([['changed', 1]])
    expect(w.countLine).toBe('1 needs action: 1 changed in Xero')
  })
})
