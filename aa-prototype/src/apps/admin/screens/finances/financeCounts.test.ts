/**
 * The Finances section's numbers (build plan Phase 58; D109, US-13.3.3): each
 * tab counts what needs doing there, the badge sums the billing part and the
 * failed ledger checks, and an alerted hand-off counts once.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from '../../../../store/appStore'
import { authoriseList } from '../../../../store/lifecycle'
import { retryBillingException, runBillingForList, wireBillingRun } from '../../../../store/billingRun'
import { wireXeroQueue, setXeroOutage } from '../../../../store/xeroQueue'
import { advanceClockMinutes } from '../../../../store/clockActions'
import { recordUnmatchedReceipt } from '../../../../store/paymentActions'
import { approvePrepayment } from '../../../../store/prepaymentActions'
import { pendingPrepayments, prepaymentStatusFor } from '../../../../store/prepaymentSelectors'
import { billingMonitorView } from '../../../../store/billingMonitorView'
import { billingAttentionCount, ledgerAttentionCount, openBillingExceptions, openXeroDivergences, openXeroQueueItems } from '../../../../store/ledgerSelectors'
import { OFFICE_ACTOR } from '../../../../store/demoActors'
import { ANAE, SEED_LIST_IDS, SEED_MARKERS } from '../../../../domain/seed'
import { projectedListId } from '../../../../domain/slots'
import { badgeBillingPart, billingTabCount, financeBadge, financeTabCounts, invoicesTabCount, ledgerTabCount, xeroTabCount } from './financeCounts'

const unwires: (() => void)[] = []
afterEach(() => {
  while (unwires.length > 0) unwires.pop()!()
})

const LIST = SEED_LIST_IDS.billingFailure
const LOSA = () => SEED_MARKERS['billingFailureBooking']!.entityId
const RILEY = () => SEED_MARKERS['prepaymentBooking']!.entityId

/** Two receipts that match no invoice: two failed ledger checks. */
function holdTwoReceipts(api: BoundAppStore): void {
  for (const n of [1, 2]) {
    expect(recordUnmatchedReceipt(api, { amount: 120, reference: `Bank deposit · ${n}`, idempotencyKey: `FINANCE-COUNTS-${n}`, source: 'webhook' }).ok).toBe(true)
  }
}

describe('financeBadge (US-13.3.3)', () => {
  it("one billing problem and two failed ledger checks read 3; once the problem is resolved it reads 2", () => {
    const api = createAppStore()
    expect(financeBadge(api.getState())).toBe(0)
    // A Booking with no lock fails the run: one open billing exception.
    expect(authoriseList(api, OFFICE_ACTOR, LIST).ok).toBe(true)
    const lock = api.getState().billing.locks[LOSA()]!
    const { [LOSA()]: _dropped, ...rest } = api.getState().billing.locks
    api.setState({ billing: { ...api.getState().billing, locks: rest } })
    expect(runBillingForList(api, LIST).ok).toBe(true)
    holdTwoReceipts(api)

    expect(badgeBillingPart(api.getState())).toBe(1)
    expect(ledgerTabCount(api.getState())).toBe(2)
    expect(financeBadge(api.getState())).toBe(3)

    // The record returns and the retry bills it.
    api.setState({ billing: { ...api.getState().billing, locks: { ...api.getState().billing.locks, [LOSA()]: lock } } })
    const exceptionId = openBillingExceptions(api.getState())[0]!.id
    expect(retryBillingException(api, OFFICE_ACTOR, exceptionId).ok).toBe(true)
    expect(financeBadge(api.getState())).toBe(2)
  })

  it('a Booking stuck at Xero (an alerted hand-off) counts once, not twice', () => {
    const api = createAppStore()
    unwires.push(wireBillingRun(api), wireXeroQueue(api))
    expect(setXeroOutage(api, OFFICE_ACTOR, true).ok).toBe(true)
    expect(authoriseList(api, OFFICE_ACTOR, projectedListId(ANAE.souter, '2026-11-23', 'AM')).ok).toBe(true)
    for (let i = 0; i < 6; i += 1) advanceClockMinutes(api, 60)
    const state = api.getState()
    const alerted = openXeroQueueItems(state).filter((q) => q.status === 'alerted').length
    expect(alerted).toBeGreaterThan(0)
    expect(xeroTabCount(state)).toBe(alerted)
    expect(badgeBillingPart(state)).toBe(alerted)
    expect(ledgerTabCount(state)).toBe(0)
    // The Xero tab shows it too, but the badge never adds it a second time.
    expect(financeBadge(state)).toBe(alerted)
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

  it('has no payments or aa-fees key', () => {
    const counts = financeTabCounts(createAppStore().getState())
    expect(Object.keys(counts).sort()).toEqual(['billing', 'invoices', 'ledger', 'xero'])
    expect(counts).not.toHaveProperty('payments')
    expect(counts).not.toHaveProperty('aa-fees')
  })

  it('takes the slices the section passes', () => {
    const { billing, schedule, masters, appSettings, clock } = createAppStore().getState()
    expect(financeTabCounts({ billing, schedule, masters, appSettings, clock })).toEqual(financeTabCounts({ billing, schedule, masters }))
  })

  it('on the fresh seed each count equals its selector', () => {
    const state = createAppStore().getState()
    expect(billingTabCount(state)).toBe(billingMonitorView(state).totals.withProblems)
    expect(invoicesTabCount(state)).toBe(pendingPrepayments(state).length)
    expect(ledgerTabCount(state)).toBe(ledgerAttentionCount(state))
    expect(xeroTabCount(state)).toBe(openXeroQueueItems(state).filter((q) => q.status === 'alerted').length + openXeroDivergences(state).length)
    expect(badgeBillingPart(state)).toBe(billingAttentionCount(state))
    expect(financeBadge(state)).toBe(billingAttentionCount(state) + ledgerAttentionCount(state))
    expect(financeTabCounts(state)).toEqual({
      billing: billingTabCount(state),
      invoices: invoicesTabCount(state),
      ledger: ledgerTabCount(state),
      xero: xeroTabCount(state),
    })
  })
})
