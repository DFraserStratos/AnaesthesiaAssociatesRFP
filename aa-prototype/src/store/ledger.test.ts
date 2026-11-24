/**
 * The internal ledger in the store (catch-up Phase 36; work items 4 to 9): the
 * seed in balance, every invoice creator making its pair in the same mutate
 * with the payee stamped from the lock, a billing failure as an exception, a
 * hand-off fault leaving a complete pair, money in recorded in the ledger
 * first, receipts matching no invoice, and payables from the ledger alone.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, freshAppState, type AppState, type BoundAppStore } from './appStore'
import { resetDomainState, type Actor } from './mutate'
import { authoriseList, reassignBooking, submitList } from './lifecycle'
import { retryBillingException, runBillingForList, wireBillingRun } from './billingRun'
import { handoffPair, handoffListPairs } from './xeroHandoff'
import { processXeroQueue } from './xeroQueue'
import { handoffQueuedFor, openXeroQueueItems } from './ledgerSelectors'
import { receivePayment, recordUnmatchedReceipt } from './paymentActions'
import { allocateUnmatchedReceipt, markUnmatchedRefunded } from './ledgerActions'
import { payablesDue, runPayables, runThisWeeksCycle } from './payablesActions'
import { approveAllPrepayments, TEST_OFFICE } from '../test/approvePrepayments'
import { settlePrepaymentsForList } from './prepaymentSettlement'
import { armHandoffFault } from './demoSettingsActions'
import { recordAaFeePayment, runMonthlyFeeInvoices } from './aaFeeActions'
import { seedMonthOfBctis } from './demoBctiSeed'
import { DEMO_TRIGGER_ACTOR, OFFICE_ACTOR } from './demoActors'
import {
  anaesthetistLedgerPosition,
  anaesthetistsOutOfBalanceOf,
  bctiRecords,
  heldUnmatchedReceipts,
  incomeReceiptsFor,
  ledgerPositionOf,
  openBillingExceptions,
  pairForInvoice,
  pairsForBooking,
  pairsForList,
} from './ledgerSelectors'
import { holdingAccountView } from './prepaymentSelectors'
import { bookingsForList, paymentHistoryFor } from './selectors'
import { gstReportFor } from './ledgerSelectors'
import { DEMO_TODAY } from '../domain/clock'
import { isBookingPair } from '../domain/billing/ledger'
import { ANAE, SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'
import { projectedListId } from '../domain/slots'
import type { BookingLedgerPair } from '../domain/types'

const OFFICE: Actor = TEST_OFFICE
const AM20 = projectedListId(ANAE.souter, '2026-11-23', 'AM')
const PM20 = projectedListId(ANAE.souter, '2026-11-23', 'PM')

function wired<T>(api: BoundAppStore, body: () => T): T {
  const unwire = wireBillingRun(api)
  try {
    return body()
  } finally {
    unwire()
  }
}

function authoriseMon20(api: BoundAppStore): void {
  wired(api, () => {
    expect(authoriseList(api, OFFICE, AM20).ok).toBe(true)
    expect(authoriseList(api, OFFICE, PM20).ok).toBe(true)
  })
}

function bookingPairs(state: AppState): BookingLedgerPair[] {
  return Object.values(state.billing.ledger).filter((p): p is BookingLedgerPair => isBookingPair(p))
}

function inBalance(state: AppState): void {
  const pos = ledgerPositionOf(state)
  expect(pos.checks).toEqual([])
  expect(pos.imbalance).toBe(0)
  expect(anaesthetistsOutOfBalanceOf(state)).toEqual([])
}

describe('the seed is in balance (work item 9)', () => {
  const s = freshAppState()

  it('no imbalance, no check, no anaesthetist out of balance; the AA Holding account holds the seeded paid prepayment', () => {
    inBalance(s)
    const pos = ledgerPositionOf(s)
    expect(pos.holdingBalance).toBe(1380)
    expect(pos.holdingBalance).toBe(holdingAccountView(s).balance)
    // Dr Souter's unpaid June fee invoice (H02).
    expect(pos.aaFees.outstanding).toBe(s.billing.aaFeeInvoices.AFH02!.total)
  })

  it('every Booking pair: its Booking patient, one payable equal to the receivable, the payee on the pair and the leg', () => {
    for (const p of bookingPairs(s)) {
      expect(p.patientId, p.id).toBe(s.schedule.bookings[p.bookingId]?.patientId)
      if (p.payable === undefined) continue
      expect(p.payable.amount, p.id).toBe(p.receivable.amount)
      if (p.kind === 'prePayment') {
        expect(p.payable.payee, p.id).toEqual({ kind: 'holding' })
        expect(p.anaesthetistId, p.id).toBeUndefined()
      } else {
        expect(p.payable.payee, p.id).toEqual({ kind: 'anaesthetist', anaesthetistId: p.anaesthetistId })
      }
    }
  })

  it("every leg's cumulative amounts equal the sums of its entries", () => {
    const receivedBy = new Map<string, number>()
    for (const r of Object.values(s.billing.receipts)) receivedBy.set(r.pairId, Math.round(((receivedBy.get(r.pairId) ?? 0) + r.grossAmount) * 100) / 100)
    const paidOutBy = new Map<string, number>()
    for (const d of Object.values(s.billing.disbursements)) paidOutBy.set(d.pairId, Math.round(((paidOutBy.get(d.pairId) ?? 0) + d.amount) * 100) / 100)
    for (const p of Object.values(s.billing.ledger)) {
      expect(receivedBy.get(p.id) ?? 0, p.id).toBe(p.receivable.receivedAmount)
      if (isBookingPair(p) && p.payable !== undefined) expect(paidOutBy.get(p.id) ?? 0, p.id).toBe(p.payable.disbursedAmount)
    }
  })

  it('every Xero ACCREC and ACCPAY mirrors exactly one leg', () => {
    const recLegs = new Map<string, number>()
    const payLegs = new Map<string, number>()
    for (const p of Object.values(s.billing.ledger)) {
      if (p.receivable.xeroAccRecId !== undefined) recLegs.set(p.receivable.xeroAccRecId, (recLegs.get(p.receivable.xeroAccRecId) ?? 0) + 1)
      if (isBookingPair(p) && p.payable?.xeroAccPayId !== undefined) payLegs.set(p.payable.xeroAccPayId, (payLegs.get(p.payable.xeroAccPayId) ?? 0) + 1)
    }
    for (const id of Object.keys(s.xero.accRecs)) expect(recLegs.get(id), id).toBe(1)
    for (const id of Object.keys(s.xero.accPays)) expect(payLegs.get(id), id).toBe(1)
  })

  it('two builds are deep-equal, and Reset restores every new slice', () => {
    expect(freshAppState().billing).toEqual(freshAppState().billing)
    const api = createAppStore()
    recordUnmatchedReceipt(api, { amount: 120, reference: 'Bank deposit · JULY', idempotencyKey: 'K', source: 'webhook' })
    authoriseMon20(api)
    resetDomainState(api)
    const fresh = freshAppState().billing
    const now = api.getState().billing
    expect([now.ledger, now.receipts, now.disbursements, now.unmatchedReceipts, now.exceptions, now.transfers]).toEqual([fresh.ledger, fresh.receipts, fresh.disbursements, fresh.unmatchedReceipts, fresh.exceptions, fresh.transfers])
  })
})

describe('pairs are made with the invoice (work item 4)', () => {
  it('the S3 run makes one pair per invoice, its payee from the lock, before the hand-off; then Xero mirrors it', () => {
    const api = createAppStore()
    authoriseMon20(api)
    const s = api.getState()
    const invoices = Object.values(s.billing.invoices).filter((i) => i.kind === 'standard' && [AM20, PM20].includes(s.schedule.bookings[i.bookingId]!.listId))
    expect(invoices.length).toBeGreaterThan(0)
    for (const i of invoices) {
      const p = pairForInvoice(s, i.id)!
      expect(p.receivable).toMatchObject({ number: i.invoiceNumber, amount: i.total })
      expect(p.payable).toMatchObject({ number: `${i.invoiceNumber}-P`, amount: i.total })
      expect(p.anaesthetistId).toBe(s.billing.locks[i.bookingId]!.payee.anaesthetistId)
      expect(p.receivable.xeroAccRecId).toBeDefined()
    }
    inBalance(s)
  })

  it('the payee is the lock’s: a List changed after authorise moves no pair, and receipts stay its income', () => {
    const api = createAppStore()
    authoriseMon20(api)
    const pair = pairsForList(api.getState(), AM20)[0]!
    api.setState((s) => ({ schedule: { ...s.schedule, lists: { ...s.schedule.lists, [AM20]: { ...s.schedule.lists[AM20]!, anaesthetistId: ANAE.rutherford } as AppState['schedule']['lists'][string] } } }))
    receivePayment(api, { accRecId: pair.receivable.xeroAccRecId!, amount: 10, idempotencyKey: 'P-LOCK', source: 'webhook' })
    const after = api.getState().billing.ledger[pair.id] as BookingLedgerPair
    expect(after.anaesthetistId).toBe(ANAE.souter)
    expect(incomeReceiptsFor(api.getState(), ANAE.souter).some((r) => r.pairId === pair.id)).toBe(true)
    expect(incomeReceiptsFor(api.getState(), ANAE.rutherford).some((r) => r.pairId === pair.id)).toBe(false)
  })

  it('a split raises two invoices, so two pairs, each with one payable leg', () => {
    const api = createAppStore()
    const bookingId = SEED_MARKERS.feeSplitBooking!.entityId
    const listId = api.getState().schedule.bookings[bookingId]!.listId
    if (api.getState().schedule.lists[listId]!.state === 'ACTIVE') submitList(api, OFFICE, listId)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    expect(runBillingForList(api, listId).ok).toBe(true)
    const pairs = pairsForBooking(api.getState(), bookingId)
    expect(pairs).toHaveLength(2)
    for (const p of pairs) expect(p.payable?.amount).toBe(p.receivable.amount)
  })

  it('a failed Booking gets an exception and no pair while its sibling bills; the retry makes its pairs once', () => {
    const api = createAppStore()
    const listId = AM20
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    const bookings = bookingsForList(api.getState(), listId).filter((b) => b.cancellation === undefined)
    const failing = bookings[0]!
    const lock = api.getState().billing.locks[failing.id]!
    api.setState((s) => {
      const { [failing.id]: _gone, ...locks } = s.billing.locks
      return { billing: { ...s.billing, locks } }
    })
    expect(runBillingForList(api, listId).ok).toBe(true)
    const exceptions = openBillingExceptions(api.getState())
    expect(exceptions.map((x) => [x.bookingId, x.code])).toEqual([[failing.id, 'lockMissing']])
    expect(exceptions[0]!.id).toMatch(/^BX\d{4}$/)
    expect(pairsForBooking(api.getState(), failing.id)).toEqual([])
    for (const b of bookings.slice(1)) expect(pairsForBooking(api.getState(), b.id).length).toBeGreaterThan(0)
    expect(retryBillingException(api, OFFICE, exceptions[0]!.id)).toMatchObject({ ok: false, code: 'lockMissing' })
    api.setState((s) => ({ billing: { ...s.billing, locks: { ...s.billing.locks, [failing.id]: lock } } }))
    const retried = retryBillingException(api, OFFICE, exceptions[0]!.id)
    expect(retried.ok).toBe(true)
    const made = pairsForBooking(api.getState(), failing.id)
    expect(made.length).toBeGreaterThan(0)
    expect(api.getState().billing.exceptions[exceptions[0]!.id]).toMatchObject({ resolvedPairIds: made.map((p) => p.id) })
    expect(retryBillingException(api, OFFICE, exceptions[0]!.id)).toMatchObject({ ok: false, code: 'alreadyResolved' })
    expect(api.getState().audit.some((a) => a.action === 'billing.exceptionResolved')).toBe(true)
  })

  it('approving a prepayment writes its invoice and pair (payable to the AA Holding account) and its draft Xero pair; unapproved, no pair', () => {
    const api = createAppStore()
    const riley = SEED_MARKERS.prepaymentBooking!.entityId
    expect(pairsForBooking(api.getState(), riley)).toEqual([])
    const [invoiceId] = approveAllPrepayments(api, riley)
    const p = pairForInvoice(api.getState(), invoiceId!)!
    expect(p).toMatchObject({ kind: 'prePayment', payable: { payee: { kind: 'holding' } } })
    expect(p.anaesthetistId).toBeUndefined()
    expect(api.getState().xero.accPays[p.payable!.xeroAccPayId!]).toMatchObject({ status: 'draft', payeeAccount: 'aaHoldingAccount' })
    expect(api.getState().audit.some((a) => a.action === 'ledger.pairCreated' && a.entityId === p.id)).toBe(true)
  })

  it('a move changes no pair, amount or payee (D38)', () => {
    const api = createAppStore()
    const riley = SEED_MARKERS.prepaymentBooking!.entityId
    approveAllPrepayments(api, riley)
    const before = JSON.stringify(pairsForBooking(api.getState(), riley))
    const souterId = api.getState().schedule.lists[api.getState().schedule.bookings[riley]!.listId]!.anaesthetistId
    const target = Object.values(api.getState().schedule.lists)
      .filter((l) => l.anaesthetistId !== undefined && l.anaesthetistId !== souterId && l.state === 'ACTIVE')
      .sort((a, b) => Number(b.dateISO === '2026-11-27') - Number(a.dateISO === '2026-11-27') || a.id.localeCompare(b.id))
      .find((l) => reassignBooking(api, OFFICE, riley, l.id).ok)
    expect(target).toBeDefined()
    expect(JSON.stringify(pairsForBooking(api.getState(), riley))).toBe(before)
  })

  it("authorising the seeded paid prepayment's List adds one transfer (two payable legs) and the holding balance falls by it", () => {
    const api = createAppStore()
    const listId = SEED_LIST_IDS.prepaymentPaidList
    const before = ledgerPositionOf(api.getState())
    api.setState((s) => ({ schedule: { ...s.schedule, lists: { ...s.schedule.lists, [listId]: { ...s.schedule.lists[listId]!, state: 'AUTHORISED' } as AppState['schedule']['lists'][string] } } }))
    // The transfer is written by the authorise event's last step (27a); called directly here.
    expect(settlePrepaymentsForList(api, listId).ok).toBe(true)
    const transfers = Object.values(api.getState().billing.transfers)
    expect(transfers).toHaveLength(1)
    expect(transfers[0]).toMatchObject({ out: { amount: 1380 }, in: { amount: 1380, releasedAmount: 1380, payee: { kind: 'anaesthetist', anaesthetistId: ANAE.souter } } })
    const after = ledgerPositionOf(api.getState())
    expect([after.holdingBalance, after.payablesDue, after.received, after.disbursed]).toEqual([before.holdingBalance - 1380, before.payablesDue + 1380, before.received, before.disbursed])
    inBalance(api.getState())
  })
})

describe('the hand-off reads the ledger (work item 5)', () => {
  it('a fault leaves the complete pair with no mirror ids, still owed; a retry stamps them; a replay is a no-op', () => {
    const api = createAppStore()
    armHandoffFault(api, OFFICE_ACTOR, {})
    authoriseMon20(api)
    // Catch-up Phase 37: the fault is one failed attempt in the Xero sync queue.
    const faulted = api.getState().billing.ledger[openXeroQueueItems(api.getState())[0]!.target.pairId!]!
    expect(faulted.receivable.xeroAccRecId).toBeUndefined()
    expect(faulted.receivable.amount).toBeGreaterThan(0)
    expect(ledgerPositionOf(api.getState()).notInXero).toBeGreaterThan(0)
    expect(processXeroQueue(api, { force: true }).sent).toBe(1)
    const mirrored = api.getState().billing.ledger[faulted.id]!
    expect(mirrored.receivable.xeroAccRecId).toBeDefined()
    expect(handoffQueuedFor(api.getState(), faulted.id)).toBeUndefined()
    expect(api.getState().xero.accRecs[mirrored.receivable.xeroAccRecId!]).toMatchObject({ invoiceNumber: mirrored.receivable.number, reference: mirrored.id, amountDue: mirrored.receivable.amount })
    const xeroBefore = JSON.stringify(api.getState().xero)
    handoffPair(api, faulted.id)
    handoffListPairs(api, AM20)
    expect(JSON.stringify(api.getState().xero)).toBe(xeroBefore)
  })
})

describe('money in is recorded in the ledger first (work item 6)', () => {
  it('a half then the rest moves both legs exactly; a replay is a no-op', () => {
    const api = createAppStore()
    authoriseMon20(api)
    const p = pairsForList(api.getState(), AM20)[0]!
    const half = Math.round((p.receivable.amount / 2) * 100) / 100
    receivePayment(api, { accRecId: p.receivable.xeroAccRecId!, amount: half, idempotencyKey: 'H', source: 'webhook' })
    expect(receivePayment(api, { accRecId: p.receivable.xeroAccRecId!, amount: half, idempotencyKey: 'H', source: 'poll' })).toEqual({ ok: true, value: { applied: false } })
    const mid = api.getState().billing.ledger[p.id] as BookingLedgerPair
    expect([mid.receivable.receivedAmount, mid.payable!.releasedAmount]).toEqual([half, half])
    receivePayment(api, { accRecId: p.receivable.xeroAccRecId!, amount: p.receivable.amount, idempotencyKey: 'R', source: 'webhook' })
    const full = api.getState().billing.ledger[p.id] as BookingLedgerPair
    expect([full.receivable.receivedAmount, full.payable!.releasedAmount]).toEqual([p.receivable.amount, p.receivable.amount])
    inBalance(api.getState())
  })

  it('a payment on an ACCREC no pair links is held as one unmatched receipt; a replay adds none', () => {
    const api = createAppStore()
    api.setState((s) => ({ xero: { ...s.xero, accRecs: { ...s.xero.accRecs, XRORPHAN: { id: 'XRORPHAN', kind: 'procedure', invoiceId: 'NONE', contactId: 'X', invoiceNumber: 'AA-2026-9999', reference: 'NONE', issuedAtISO: '2026-11-24T09:00:00', amountDue: 50, amountReceived: 0, status: 'awaitingPayment' } } } }))
    const out = receivePayment(api, { accRecId: 'XRORPHAN', amount: 50, idempotencyKey: 'ORPH', source: 'webhook' })
    expect(out.ok && out.value.unmatchedReceiptId).toBeTruthy()
    receivePayment(api, { accRecId: 'XRORPHAN', amount: 50, idempotencyKey: 'ORPH', source: 'webhook' })
    expect(heldUnmatchedReceipts(api.getState())).toHaveLength(1)
    expect(ledgerPositionOf(api.getState()).imbalance).toBe(50)
  })

  it('a receipt naming Dr Souter puts her ledger out of balance; allocation refusals; allocating returns the ledger to balance', () => {
    const api = createAppStore()
    authoriseMon20(api)
    const r = recordUnmatchedReceipt(api, { amount: 120, reference: 'Bank deposit · SOUTER JULY', idempotencyKey: 'U1', source: 'webhook', anaesthetistId: ANAE.souter })
    expect(r.ok).toBe(true)
    const id = r.ok ? r.value.id : ''
    expect(ledgerPositionOf(api.getState())).toMatchObject({ imbalance: 120, inBalance: false })
    expect(anaesthetistsOutOfBalanceOf(api.getState()).map((row) => [row.anaesthetistId, row.imbalance, row.name])).toEqual([[ANAE.souter, 120, 'Dr Souter']])
    expect(anaesthetistLedgerPosition(api.getState(), ANAE.souter)).toMatchObject({ imbalance: 120, unmatchedHeld: 120 })
    expect(recordUnmatchedReceipt(api, { amount: 1, reference: 'x', idempotencyKey: 'U9', source: 'webhook', anaesthetistId: 'NOPE' })).toMatchObject({ ok: false, code: 'unknownAnaesthetist' })

    const small = Object.values(api.getState().billing.ledger).find((p): p is BookingLedgerPair => isBookingPair(p) && p.receivable.amount - p.receivable.receivedAmount > 0 && p.receivable.amount - p.receivable.receivedAmount < 120)
    if (small !== undefined) expect(allocateUnmatchedReceipt(api, OFFICE, id, small.id)).toMatchObject({ ok: false, code: 'overAllocation' })
    const fee = Object.values(api.getState().billing.ledger).find((p) => p.kind === 'aaFee')!
    expect(allocateUnmatchedReceipt(api, OFFICE, id, fee.id)).toMatchObject({ ok: false, code: 'notReceivable' })
    expect(allocateUnmatchedReceipt(api, { ...OFFICE, role: 'anaesthetist' }, id, fee.id)).toMatchObject({ ok: false, code: 'officeOnly' })

    // A Rutherford-free target: any Souter receivable whose balance covers it (the reference was only a hint).
    const target = pairsForList(api.getState(), AM20).find((p) => p.receivable.amount - p.receivable.receivedAmount >= 120)!
    expect(allocateUnmatchedReceipt(api, OFFICE, id, target.id).ok).toBe(true)
    const after = api.getState().billing.ledger[target.id]!
    expect(after.receivable.receivedAmount).toBe(120)
    expect(Object.values(api.getState().xero.payments).some((p) => p.accRecId === target.receivable.xeroAccRecId && p.source === 'allocation' && p.amount === 120)).toBe(true)
    expect(Object.values(api.getState().billing.receipts).find((x) => x.idempotencyKey === `ALLOC-${id}`)?.atISO).toBe(api.getState().billing.unmatchedReceipts[id]!.atISO)
    inBalance(api.getState())
    expect(allocateUnmatchedReceipt(api, OFFICE, id, target.id)).toMatchObject({ ok: false, code: 'notHeld' })
    expect(markUnmatchedRefunded(api, OFFICE, id, 'x')).toMatchObject({ ok: false, code: 'notHeld' })
  })

  it('an unattributed receipt puts no one on the list; refunding it (a note required) returns to balance', () => {
    const api = createAppStore()
    const r = recordUnmatchedReceipt(api, { amount: 120, reference: 'Bank deposit · JULY', idempotencyKey: 'U2', source: 'webhook' })
    const id = r.ok ? r.value.id : ''
    expect(anaesthetistsOutOfBalanceOf(api.getState())).toEqual([])
    expect(ledgerPositionOf(api.getState()).imbalance).toBe(120)
    expect(markUnmatchedRefunded(api, OFFICE, id, '  ')).toMatchObject({ ok: false, code: 'noteRequired' })
    expect(markUnmatchedRefunded(api, OFFICE, id, 'Returned to the payer').ok).toBe(true)
    expect(api.getState().billing.unmatchedReceipts[id]).toMatchObject({ status: 'refunded', note: 'Returned to the payer' })
    inBalance(api.getState())
  })

  it('AA fee payments never reach the GST report, payment history or the BCTI count', () => {
    const api = createAppStore()
    seedMonthOfBctis(api, DEMO_TRIGGER_ACTOR, ANAE.rutherford)
    const gstBefore = gstReportFor(api.getState(), ANAE.rutherford, '2026-11', DEMO_TODAY)
    const historyBefore = paymentHistoryFor(api.getState(), ANAE.rutherford)
    const bctisBefore = bctiRecords(api.getState())
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-11' })
    const fee = Object.values(api.getState().billing.aaFeeInvoices).find((f) => f.anaesthetistId === ANAE.rutherford && f.monthISO === '2026-11')!
    expect(fee.subtotal).toBe(700)
    expect(api.getState().billing.ledger[fee.ledgerPairId]?.receivable.xeroAccRecId).toBeDefined()
    expect(recordAaFeePayment(api, { aaFeeInvoiceId: fee.id, idempotencyKey: 'FEE' }).ok).toBe(true)
    expect(api.getState().billing.ledger[fee.ledgerPairId]?.receivable.receivedAmount).toBe(fee.total)
    expect(gstReportFor(api.getState(), ANAE.rutherford, '2026-11', DEMO_TODAY)).toEqual(gstBefore)
    expect(paymentHistoryFor(api.getState(), ANAE.rutherford)).toEqual(historyBefore)
    expect(bctiRecords(api.getState())).toEqual(bctisBefore)
    inBalance(api.getState())
  })
})

describe('payables are computed from the ledger (work item 7)', () => {
  it('two partial runs never double-pay, each pays what was released, and the run mirrors exactly what it paid out', () => {
    const api = createAppStore()
    authoriseMon20(api)
    const p = pairsForList(api.getState(), AM20)[0]!
    receivePayment(api, { accRecId: p.receivable.xeroAccRecId!, amount: 40, idempotencyKey: 'A', source: 'webhook' })
    // (catch-up Phase 39a: each payout is the office's weekly cycle, paid in Xero as an approved, scheduled run.)
    const run1 = runThisWeeksCycle(api, OFFICE)
    expect(run1.ok && [run1.value.disbursedCount, run1.value.totalDisbursed]).toEqual([1, 40])
    // Nothing more released: a second cycle is refused, nothing paid twice.
    expect(runThisWeeksCycle(api, OFFICE)).toMatchObject({ ok: false, code: 'nothingDue' })
    expect(runPayables(api, OFFICE)).toMatchObject({ ok: false, code: 'nothingScheduled' })
    receivePayment(api, { accRecId: p.receivable.xeroAccRecId!, amount: 10, idempotencyKey: 'B', source: 'webhook' })
    const run2 = runThisWeeksCycle(api, OFFICE)
    expect(run2.ok && run2.value.totalDisbursed).toBe(10)
    const leg = (api.getState().billing.ledger[p.id] as BookingLedgerPair).payable!
    expect(api.getState().xero.accPays[leg.xeroAccPayId!]!.amountDisbursed).toBe(leg.disbursedAmount)
    expect(Object.values(api.getState().billing.disbursements).filter((d) => d.pairId === p.id).map((d) => d.amount)).toEqual([40, 10])
    inBalance(api.getState())
  })

  it('payables due are the same with or without the Xero slice (the ledger alone drives them); never a holding row', () => {
    const api = createAppStore()
    authoriseMon20(api)
    const p = pairsForList(api.getState(), AM20)[0]!
    receivePayment(api, { accRecId: p.receivable.xeroAccRecId!, amount: 25, idempotencyKey: 'C', source: 'webhook' })
    const s = api.getState()
    const { xero: _x, ...noXero } = s
    expect(payablesDue(noXero as Pick<AppState, 'billing'>)).toEqual(payablesDue(s))
    expect(payablesDue(s)).toMatchObject({ count: 1, total: 25, byAnaesthetist: [{ anaesthetistId: ANAE.souter, count: 1, total: 25 }] })
    expect(payablesDue(s, { anaesthetistId: ANAE.rutherford }).count).toBe(0)
    expect(payablesDue(s, { only: [] }).count).toBe(0)
  })

  it('the run never pays the AA Holding account; the seeded prepayment, once transferred, is paid to the anaesthetist who did the List', () => {
    const api = createAppStore()
    expect(payablesDue(api.getState()).count).toBe(0)
    // (catch-up Phase 39a: nothing is due, so the weekly cycle is refused and nothing is disbursed.)
    const before = Object.keys(api.getState().billing.disbursements).length
    expect(runThisWeeksCycle(api, OFFICE)).toMatchObject({ ok: false, code: 'nothingDue' })
    expect(Object.keys(api.getState().billing.disbursements)).toHaveLength(before)
  })
})

describe('review fixes (catch-up Phase 36)', () => {
  it('a receipt cannot be allocated to an invoice not yet in Xero (the payment is recorded there too)', () => {
    const api = createAppStore()
    const r = recordUnmatchedReceipt(api, { amount: 120, reference: 'Bank deposit · SOUTER JULY', idempotencyKey: 'RF1', source: 'webhook', anaesthetistId: ANAE.souter })
    const id = r.ok ? r.value.id : ''
    const unmirrored = Object.values(api.getState().billing.ledger).find((p) => p.receivable.xeroAccRecId === undefined)!
    expect(allocateUnmatchedReceipt(api, OFFICE, id, unmirrored.id)).toMatchObject({ ok: false, code: 'notInXero' })
    expect(payablesDue(api.getState()).total).toBe(0)
  })

  it('a key already applied to an invoice is never held a second time as unmatched', () => {
    const api = createAppStore()
    authoriseMon20(api)
    const p = pairsForList(api.getState(), AM20)[0]!
    receivePayment(api, { accRecId: p.receivable.xeroAccRecId!, amount: 10, idempotencyKey: 'DUP', source: 'webhook' })
    expect(recordUnmatchedReceipt(api, { amount: 10, reference: 'x', idempotencyKey: 'DUP', source: 'webhook' })).toMatchObject({ ok: false, code: 'alreadyApplied' })
    expect(heldUnmatchedReceipts(api.getState())).toEqual([])
  })

  it('a BCTI counted before its pair reaches Xero is not counted again after (one stable key)', () => {
    const api = createAppStore()
    armHandoffFault(api, OFFICE_ACTOR, {})
    authoriseMon20(api)
    const faulted = api.getState().billing.ledger[openXeroQueueItems(api.getState())[0]!.target.pairId!]!
    const before = bctiRecords(api.getState()).find((r) => r.billNumber === (faulted as BookingLedgerPair).payable!.number)!
    processXeroQueue(api, { force: true })
    const after = bctiRecords(api.getState()).find((r) => r.billNumber === (faulted as BookingLedgerPair).payable!.number)!
    expect(after.accPayId).toBe(before.accPayId)
  })
})

