/**
 * The Finances section's numbers (build plan Phases 58 and 60; D109, US-13.3.3):
 * each tab counts what needs doing there; the Billing tab counts the Lists with
 * a billing problem; Payments the events on Procedures awaiting approval; the
 * badge sums those Lists, the Xero items under no problem List, the failed
 * ledger checks and the events awaiting approval, so a Booking stuck at Xero
 * counts once.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from '../../../../store/appStore'
import { authoriseList } from '../../../../store/lifecycle'
import { retryBillingException, runBillingForList, wireBillingRun } from '../../../../store/billingRun'
import { wireXeroQueue, setXeroOutage } from '../../../../store/xeroQueue'
import { advanceClockMinutes } from '../../../../store/clockActions'
import { handoffListPairs } from '../../../../store/xeroHandoff'
import { recordUnmatchedReceipt } from '../../../../store/paymentActions'
import { approvePrepayment } from '../../../../store/prepaymentActions'
import { pendingPrepayments, prepaymentStatusFor } from '../../../../store/prepaymentSelectors'
import { ledgerAttentionCount, openBillingExceptions, openXeroDivergences, openXeroQueueItems, pairsForList } from '../../../../store/ledgerSelectors'
import { OFFICE_ACTOR } from '../../../../store/demoActors'
import { reviewRowsAwaiting, submitCredit } from '../../../../store/creditActions'
import { ANAE, SEED_LIST_IDS, SEED_MARKERS } from '../../../../domain/seed'
import { projectedListId } from '../../../../domain/slots'
import { listBillingStatuses, problemListCount, xeroItemsOnLists } from '../../../../domain/billing/billingStatus'
import type { XeroDivergence, XeroQueueItem } from '../../../../domain/types'
import type { BookingLock } from '../../../../domain/billing/lock'
import {
  badgeBillingPart,
  billingStatusInput,
  billingStatusesFor,
  billingTabCount,
  financeBadge,
  financeTabCounts,
  invoicesTabCount,
  ledgerTabCount,
  paymentsTabCount,
  xeroTabCount,
} from './financeCounts'

const unwires: (() => void)[] = []
afterEach(() => {
  while (unwires.length > 0) unwires.pop()!()
})

const LIST = SEED_LIST_IDS.billingFailure
const SOUTER_AM23 = projectedListId(ANAE.souter, '2026-11-23', 'AM')
const LOSA = () => SEED_MARKERS['billingFailureBooking']!.entityId
const RILEY = () => SEED_MARKERS['prepaymentBooking']!.entityId

/** Drop the events awaiting approval (the seed's one), so the badge counts only billing and ledger. */
function noEventsWaiting(api: BoundAppStore): BoundAppStore {
  const waiting = new Set(reviewRowsAwaiting(api.getState()).flatMap((r) => [r.event.id, ...r.replacements.map((e) => e.id)]))
  const schedule = api.getState().schedule
  api.setState({ schedule: { ...schedule, procedureEvents: Object.fromEntries(Object.entries(schedule.procedureEvents).filter(([id]) => !waiting.has(id))) } })
  expect(paymentsTabCount(api.getState())).toBe(0)
  return api
}

/** A credit of the seeded AA-2026-H03 with one new invoice: one event awaiting approval. */
function raiseCredit(api: BoundAppStore): void {
  const out = submitCredit(api, OFFICE_ACTOR, {
    invoiceId: 'HINV03',
    reason: 'Wrong amount',
    cause: 'correction',
    replacements: [{ occurredOnISO: api.getState().clock.todayISO, party: { sameAs: true }, lines: [{ description: 'Corrected fee', quantity: 1, unitAmount: 200 }] }],
  })
  if (!out.ok) throw new Error(out.message)
}

/** Two receipts that match no invoice: two failed ledger checks. */
function holdTwoReceipts(api: BoundAppStore): void {
  for (const n of [1, 2]) {
    expect(recordUnmatchedReceipt(api, { amount: 120, reference: `Bank deposit · ${n}`, idempotencyKey: `FINANCE-COUNTS-${n}`, source: 'webhook' }).ok).toBe(true)
  }
}

/** Authorise the failure List and bill it with Losa's lock gone: her Booking fails the run. Returns the lock. */
function failLosa(api: BoundAppStore): BookingLock {
  expect(authoriseList(api, OFFICE_ACTOR, LIST).ok).toBe(true)
  const lock = api.getState().billing.locks[LOSA()]!
  const { [LOSA()]: _dropped, ...rest } = api.getState().billing.locks
  api.setState({ billing: { ...api.getState().billing, locks: rest } })
  expect(runBillingForList(api, LIST).ok).toBe(true)
  expect(openBillingExceptions(api.getState())).toHaveLength(1)
  return lock
}

/** Put a Xero sync queue item or divergence straight into the billing slice. */
function addXeroItem(api: BoundAppStore, item: { queue: XeroQueueItem } | { divergence: XeroDivergence }): void {
  const billing = api.getState().billing
  api.setState({
    billing:
      'queue' in item
        ? { ...billing, xeroQueue: { ...billing.xeroQueue, [item.queue.id]: item.queue } }
        : { ...billing, xeroDivergences: { ...billing.xeroDivergences, [item.divergence.id]: item.divergence } },
  })
}

/** An alerted Xero queue item tied to no pair (a poll that kept failing). */
const ALERTED_POLL: XeroQueueItem = {
  id: 'XQ9901',
  kind: 'poll',
  idempotencyKey: 'POLL-2026-11-24',
  target: {},
  enqueuedAtISO: '2026-11-24T08:00:00',
  attempts: 5,
  nextAttemptAtISO: '2026-11-24T14:00:00',
  status: 'alerted',
}

function divergenceOn(id: string, pairId: string, invoiceId: string): XeroDivergence {
  return {
    id,
    kind: 'amendedInXero',
    accRecId: `ACC-${id}`,
    pairId,
    invoiceId,
    xeroShows: { status: 'awaitingPayment', total: 100 },
    engineHolds: { amount: 120, outstanding: 120 },
    detectedAtISO: '2026-11-24T09:00:00',
    status: 'open',
  }
}

describe('financeBadge (US-13.3.3; D109)', () => {
  it('one billing problem and two failed ledger checks read 3; once a retry bills the Booking it reads 2', () => {
    const api = noEventsWaiting(createAppStore())
    expect(financeBadge(api.getState())).toBe(0)
    const lock = failLosa(api)
    holdTwoReceipts(api)

    expect(billingTabCount(api.getState())).toBe(1)
    expect(badgeBillingPart(api.getState())).toBe(1)
    expect(ledgerTabCount(api.getState())).toBe(2)
    expect(financeBadge(api.getState())).toBe(3)

    // The record returns and the retry bills it.
    api.setState({ billing: { ...api.getState().billing, locks: { ...api.getState().billing.locks, [LOSA()]: lock } } })
    const exceptionId = openBillingExceptions(api.getState())[0]!.id
    expect(retryBillingException(api, OFFICE_ACTOR, exceptionId).ok).toBe(true)
    expect(billingTabCount(api.getState())).toBe(0)
    expect(financeBadge(api.getState())).toBe(2)
  })

  it('one billing problem and two failed ledger checks read 3; once the failure is marked resolved by hand it reads 2', () => {
    const api = noEventsWaiting(createAppStore())
    failLosa(api)
    holdTwoReceipts(api)
    expect(financeBadge(api.getState())).toBe(3)

    const exception = openBillingExceptions(api.getState())[0]!
    const billing = api.getState().billing
    api.setState({
      billing: {
        ...billing,
        exceptions: {
          ...billing.exceptions,
          [exception.id]: { ...exception, resolvedAtISO: '2026-11-24T10:00:00', resolvedBy: OFFICE_ACTOR.who, resolvedNote: 'Billed by hand in Xero' },
        },
      },
    })
    expect(billingTabCount(api.getState())).toBe(0)
    expect(badgeBillingPart(api.getState())).toBe(0)
    expect(financeBadge(api.getState())).toBe(2)
  })

  it('a Booking stuck at Xero (an alerted hand-off) shows on the Billing and Xero tabs but counts once', () => {
    const api = noEventsWaiting(createAppStore())
    unwires.push(wireBillingRun(api), wireXeroQueue(api))
    expect(setXeroOutage(api, OFFICE_ACTOR, true).ok).toBe(true)
    expect(authoriseList(api, OFFICE_ACTOR, SOUTER_AM23).ok).toBe(true)
    for (let i = 0; i < 6; i += 1) advanceClockMinutes(api, 60)
    const state = api.getState()
    const alerted = openXeroQueueItems(state).filter((q) => q.status === 'alerted').length
    expect(alerted).toBeGreaterThan(0)
    expect(xeroTabCount(state)).toBe(alerted)
    // One problem List, however many of its Bookings are stuck.
    expect(billingStatusesFor(state).find((l) => l.listId === SOUTER_AM23)?.hasProblem).toBe(true)
    expect(billingTabCount(state)).toBe(1)
    expect(badgeBillingPart(state)).toBe(1)
    expect(ledgerTabCount(state)).toBe(0)
    expect(financeBadge(state)).toBe(1)
  })

  it('a List with a failed Booking and another stuck at Xero counts once', () => {
    const api = noEventsWaiting(createAppStore())
    unwires.push(wireXeroQueue(api))
    expect(setXeroOutage(api, OFFICE_ACTOR, true).ok).toBe(true)
    failLosa(api)
    // Losa's siblings billed; their hand-offs meet the outage and raise an alert.
    handoffListPairs(api, LIST)
    for (let i = 0; i < 6; i += 1) advanceClockMinutes(api, 60)
    const state = api.getState()
    const pairIds = new Set(pairsForList(state, LIST).map((p) => p.id))
    expect(openXeroQueueItems(state).some((q) => q.status === 'alerted' && q.target.pairId !== undefined && pairIds.has(q.target.pairId))).toBe(true)
    expect(xeroTabCount(state)).toBeGreaterThan(0)
    expect(billingTabCount(state)).toBe(1)
    expect(badgeBillingPart(state)).toBe(1)
    expect(financeBadge(state)).toBe(1)
  })

  it('a Xero item under no List adds one: an alert tied to no Booking, and a change in Xero on a pair with no Booking', () => {
    const api = noEventsWaiting(createAppStore())
    failLosa(api)
    expect(badgeBillingPart(api.getState())).toBe(1)

    addXeroItem(api, { queue: ALERTED_POLL })
    expect(billingTabCount(api.getState())).toBe(1)
    expect(xeroTabCount(api.getState())).toBe(1)
    expect(badgeBillingPart(api.getState())).toBe(2)

    addXeroItem(api, { divergence: divergenceOn('XD9901', 'NO-SUCH-PAIR', 'NO-SUCH-INVOICE') })
    expect(billingTabCount(api.getState())).toBe(1)
    expect(xeroTabCount(api.getState())).toBe(2)
    expect(badgeBillingPart(api.getState())).toBe(3)
    expect(financeBadge(api.getState())).toBe(3)
  })

  it('a waiting hand-off with no alert, tied to no List, adds nothing (the Xero tab does not count it)', () => {
    const api = noEventsWaiting(createAppStore())
    addXeroItem(api, { queue: { ...ALERTED_POLL, status: 'waiting' } })
    expect(xeroTabCount(api.getState())).toBe(0)
    expect(badgeBillingPart(api.getState())).toBe(0)
  })

  it("a Xero item on a List that reads no problem (a cancelled Booking's pair) still adds one", () => {
    const api = noEventsWaiting(createAppStore())
    unwires.push(wireBillingRun(api))
    expect(authoriseList(api, OFFICE_ACTOR, SOUTER_AM23).ok).toBe(true)
    expect(billingTabCount(api.getState())).toBe(0)
    const pair = pairsForList(api.getState(), SOUTER_AM23)[0]!
    const schedule = api.getState().schedule
    const booking = schedule.bookings[pair.bookingId]!
    api.setState({
      schedule: {
        ...schedule,
        bookings: {
          ...schedule.bookings,
          [booking.id]: { ...booking, cancellation: { reason: 'Test', by: OFFICE_ACTOR.who, role: 'office', source: 'office', atISO: '2026-11-24T09:00:00' } },
        },
      },
    })
    addXeroItem(api, { divergence: divergenceOn('XD9902', pair.id, pair.invoiceId) })
    const state = api.getState()
    expect(billingStatusesFor(state).find((l) => l.listId === SOUTER_AM23)?.hasProblem).toBe(false)
    expect(xeroItemsOnLists(billingStatusInput(state)).byList.get(SOUTER_AM23)).toHaveLength(1)
    expect(billingTabCount(state)).toBe(0)
    expect(badgeBillingPart(state)).toBe(1)
  })
})

describe('the billing status model, shared', () => {
  it('is built once per change of the schedule, billing and masters slices', () => {
    const api = createAppStore()
    const first = billingStatusesFor(api.getState())
    const { billing, schedule, masters } = api.getState()
    expect(billingStatusesFor({ billing, schedule, masters })).toBe(first)
    failLosa(api)
    const after = billingStatusesFor(api.getState())
    expect(after).not.toBe(first)
    expect(problemListCount(after)).toBe(1)
  })

  it('matches the model built from the input directly', () => {
    const api = createAppStore()
    failLosa(api)
    const state = api.getState()
    expect(billingStatusesFor(state)).toEqual(listBillingStatuses(billingStatusInput(state)))
  })
})

describe('the tab counts', () => {
  it('Invoices counts only what awaits approval, not what is unpaid', () => {
    const api = createAppStore()
    expect(invoicesTabCount(api.getState())).toBe(1)
    const payerKey = prepaymentStatusFor(api.getState(), RILEY()).groups[0]!.payerKey
    const out = approvePrepayment(api, OFFICE_ACTOR, RILEY(), payerKey)
    if (!out.ok) throw new Error(out.message)
    // Riley's invoice is now issued and unpaid; the tab no longer counts it.
    const invoice = api.getState().billing.invoices[out.value.invoiceId]!
    expect(invoice.kind).toBe('prePayment')
    expect(prepaymentStatusFor(api.getState(), RILEY()).groups[0]!.status).toBe('unpaid')
    expect(invoicesTabCount(api.getState())).toBe(0)
  })

  it('has no aa-fees key', () => {
    const counts = financeTabCounts(createAppStore().getState())
    expect(Object.keys(counts).sort()).toEqual(['billing', 'invoices', 'ledger', 'payments', 'xero'])
    expect(counts).not.toHaveProperty('aa-fees')
  })

  it('Payments: no number when no event awaits approval (nothing in the payment cycle is ever due)', () => {
    const api = noEventsWaiting(createAppStore())
    expect(paymentsTabCount(api.getState())).toBe(0)
    expect(financeTabCounts(api.getState()).payments).toBe(0)
  })

  it('Payments: two events on Procedures awaiting approval read 2 and add 2 to the Finances badge', () => {
    // The seed's additional invoice and a credit with its new invoice (counted once): two events.
    const api = createAppStore()
    raiseCredit(api)
    expect(paymentsTabCount(api.getState())).toBe(2)
    expect(financeTabCounts(api.getState()).payments).toBe(2)
    const withEvents = financeBadge(api.getState())
    noEventsWaiting(api)
    expect(financeBadge(api.getState())).toBe(withEvents - 2)
  })

  it('takes the slices the section passes', () => {
    const { billing, schedule, masters, appSettings, clock } = createAppStore().getState()
    expect(financeTabCounts({ billing, schedule, masters, appSettings, clock })).toEqual(financeTabCounts({ billing, schedule, masters }))
  })

  it('on the fresh seed each count equals its rule', () => {
    const state = createAppStore().getState()
    const statuses = listBillingStatuses(billingStatusInput(state))
    expect(billingTabCount(state)).toBe(problemListCount(statuses))
    expect(invoicesTabCount(state)).toBe(pendingPrepayments(state).length)
    expect(ledgerTabCount(state)).toBe(ledgerAttentionCount(state))
    expect(xeroTabCount(state)).toBe(openXeroQueueItems(state).filter((q) => q.status === 'alerted').length + openXeroDivergences(state).length)
    // The badge's billing part: problem Lists plus the Xero tab's items under no problem List.
    const problemLists = new Set(statuses.filter((l) => l.hasProblem).map((l) => l.listId))
    const { byList, unattached } = xeroItemsOnLists(billingStatusInput(state))
    const counted = (i: { kind: string; alerted: boolean }) => i.kind === 'divergence' || i.alerted
    const outside = unattached.filter(counted).length + [...byList].filter(([id]) => !problemLists.has(id)).flatMap(([, items]) => items.filter(counted)).length
    expect(badgeBillingPart(state)).toBe(problemLists.size + outside)
    expect(paymentsTabCount(state)).toBe(reviewRowsAwaiting(state).length)
    expect(paymentsTabCount(state)).toBe(1)
    expect(financeBadge(state)).toBe(badgeBillingPart(state) + ledgerAttentionCount(state) + paymentsTabCount(state))
    expect(financeTabCounts(state)).toEqual({
      billing: billingTabCount(state),
      invoices: invoicesTabCount(state),
      payments: paymentsTabCount(state),
      ledger: ledgerTabCount(state),
      xero: xeroTabCount(state),
    })
  })
})
