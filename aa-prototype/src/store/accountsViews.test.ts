/**
 * The anaesthetist's money views (catch-up Phase 38; US-12.2.1, US-12.2.2,
 * US-12.2.3 with US-08.3.5): the financial position, the flat Outstanding list
 * of unpaid payables and the monthly GST report, all read from the ledger.
 * Owed to you equals the Outstanding total to the cent, before and after a
 * payment and a payables run; a receipt adds no GST row, a payout adds one.
 * (Was `dashboard.test.ts`: the seeded Productivity and Leave figures and the
 * ageing buckets are gone.) Isolated, non-persisted stores.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { OUTSTANDING_STAGE_LABEL, openAccRecs, outstandingPayableRowsFor, outstandingTotalFor, paymentHistoryFor } from './selectors'
import { anaesthetistLedgerPosition, gstReportFor, gstReportMonthsFor, incomeReceiptsFor } from './ledgerSelectors'
import { authoriseList, submitList } from './lifecycle'
import { runBillingForList, wireBillingRun } from './billingRun'
import { handoffListPairs } from './xeroHandoff'
import { authoriseAsSimulatedOffice } from './officeStandIn'
import { receivePayment } from './paymentActions'
import { approveAndPayPairForDemo } from './payablesActions'
import { recordAaFeePayment, runMonthlyFeeInvoices } from './aaFeeActions'
import { seedMonthOfBctis } from './demoBctiSeed'
import { DEMO_TRIGGER_ACTOR } from './demoActors'
import { ANAE, SEED_LIST_IDS } from '../domain/seed'
import { projectedListId } from '../domain/slots'
import { toCents } from '../domain/billing/money'
import type { Actor } from './mutate'

const SOUTER: string = ANAE.souter
const TODAY = '2026-11-24'
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function views(api: BoundAppStore) {
  const s = api.getState()
  return { billing: s.billing, schedule: s.schedule, masters: s.masters }
}

function owed(api: BoundAppStore, id = SOUTER) {
  return anaesthetistLedgerPosition(api.getState(), id)
}

function outstandingTotal(api: BoundAppStore, id = SOUTER) {
  return outstandingTotalFor(outstandingPayableRowsFor(views(api), id))
}

function expectOwedEqualsOutstanding(api: BoundAppStore, id = SOUTER) {
  const p = owed(api, id)
  expect(toCents(p.owedToThem)).toBe(toCents(outstandingTotal(api, id)))
  expect(toCents(p.owedToThem)).toBe(toCents(p.awaitingCollection) + toCents(p.dueNow))
}

/** S3: authorise both Mon 20 Lists (the wired billing run raises and hands off their invoices). */
function s3(api: BoundAppStore) {
  expect(authoriseList(api, OFFICE, projectedListId(SOUTER, '2026-11-23', 'AM')).ok).toBe(true)
  expect(authoriseList(api, OFFICE, projectedListId(SOUTER, '2026-11-23', 'PM')).ok).toBe(true)
}

function nibAccRec(api: BoundAppStore) {
  const c = openAccRecs(api.getState()).find((x) => x.invoiceNumber === 'AA-2026-0005')
  if (c === undefined) throw new Error('AA-2026-0005 is not open')
  return c
}

function nibPairId(api: BoundAppStore): string {
  const pair = Object.values(api.getState().billing.ledger).find((p) => p.receivable.number === 'AA-2026-0005')
  if (pair === undefined) throw new Error('no AA-2026-0005 pair')
  return pair.id
}

describe('Outstanding: one row per unpaid payable, oldest first, no ageing (US-12.2.1, D8)', () => {
  it("lists Dr Souter's seeded unpaid payables oldest first, each its own invoice, each with its Booking", () => {
    const api = createAppStore()
    const rows = outstandingPayableRowsFor(views(api), SOUTER)
    expect(rows.length).toBeGreaterThan(0)
    const keys = rows.map((r) => `${r.raisedAtISO.slice(0, 10)} ${r.invoiceNumber}`)
    expect(keys).toEqual([...keys].sort())
    expect(new Set(rows.map((r) => r.invoiceId)).size).toBe(rows.length)
    for (const r of rows) {
      expect(api.getState().schedule.bookings[r.bookingId], r.invoiceNumber).toBeDefined()
      expect(api.getState().schedule.bookings[r.bookingId]?.listId).toBe(r.listId)
      expect(Object.values(OUTSTANDING_STAGE_LABEL)).toContain(OUTSTANDING_STAGE_LABEL[r.stage])
      expect(r).not.toHaveProperty('bucket')
      expect(r).not.toHaveProperty('agingDays')
    }
  })

  it('never lists a held prepayment (the AA Holding account holds it) or an AA fee invoice', () => {
    const api = createAppStore()
    seedMonthOfBctis(api, DEMO_TRIGGER_ACTOR, SOUTER)
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-11' })
    const rows = outstandingPayableRowsFor(views(api), SOUTER)
    expect(rows.some((r) => r.held)).toBe(false)
    expect(rows.some((r) => r.invoiceNumber.startsWith('AA-FEE'))).toBe(false)
    expectOwedEqualsOutstanding(api)
  })

  it('shows a freshly billed invoice the same day (catch-up Phase 38a: no next-day rule)', () => {
    const api = createAppStore()
    const before = outstandingPayableRowsFor(views(api), SOUTER).length
    const listId = SEED_LIST_IDS.souterAm21
    expect(submitList(api, OFFICE, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    expect(runBillingForList(api, listId).ok).toBe(true)
    handoffListPairs(api, listId)
    expect(api.getState().clock.todayISO).toBe(TODAY)
    expect(outstandingPayableRowsFor(views(api), SOUTER).length).toBeGreaterThan(before)
    expectOwedEqualsOutstanding(api)
  })

  it('the office stand-in (PWA "Office authorises this List") lands its invoices at once', () => {
    const api = createAppStore()
    const before = outstandingPayableRowsFor(views(api), SOUTER).length
    expect(authoriseAsSimulatedOffice(api, SEED_LIST_IDS.souterMon20Pm).ok).toBe(true)
    expect(outstandingPayableRowsFor(views(api), SOUTER).length).toBeGreaterThan(before)
    expectOwedEqualsOutstanding(api)
  })
})

describe('S3: a payment keeps the row, the payout removes it; the GST report moves only on the payout', () => {
  it('walks AA-2026-0005 through payment and payables, keeping every figure in step', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    try {
      s3(api)
      expectOwedEqualsOutstanding(api)
      const row = () => outstandingPayableRowsFor(views(api), SOUTER).find((r) => r.invoiceNumber === 'AA-2026-0005')
      expect(row()).toMatchObject({ stage: 'awaitingPayment', outstandingToYou: 152.38 })
      const p0 = owed(api)
      const gst0 = gstReportFor(api.getState(), SOUTER, '2026-11', TODAY)

      // The billable party pays in full: Collected rises, the row stays (paid in, due to you), no GST row.
      const accRec = nibAccRec(api)
      expect(receivePayment(api, { accRecId: accRec.accRecId, amount: accRec.remaining, idempotencyKey: 'T-NIB', source: 'webhook' }).ok).toBe(true)
      const p1 = owed(api)
      expect(toCents(p1.collected) - toCents(p0.collected)).toBe(15238)
      expect(row()).toMatchObject({ stage: 'dueToYou', outstandingToYou: 152.38 })
      expect(OUTSTANDING_STAGE_LABEL[row()!.stage]).toBe('Paid in, due to you')
      const gst1 = gstReportFor(api.getState(), SOUTER, '2026-11', TODAY)
      expect(gst1.rows).toEqual(gst0.rows)
      expect(toCents(gst1.notYetPaid ?? 0) - toCents(gst0.notYetPaid ?? 0)).toBe(15238)
      expectOwedEqualsOutstanding(api)

      // AA pays her in Xero: the row leaves Outstanding, Paid out rises, and one GST row is dated today.
      expect(approveAndPayPairForDemo(api, OFFICE, nibPairId(api)).ok).toBe(true)
      const p2 = owed(api)
      expect(toCents(p2.paidOut) - toCents(p1.paidOut)).toBe(15238)
      expect(row()).toBeUndefined()
      const gst2 = gstReportFor(api.getState(), SOUTER, '2026-11', TODAY)
      const added = gst2.rows.filter((r) => !gst1.rows.some((x) => x.disbursementId === r.disbursementId))
      expect(added).toHaveLength(1)
      const invoice = Object.values(api.getState().billing.invoices).find((i) => i.invoiceNumber === 'AA-2026-0005')!
      expect(added[0]).toMatchObject({ invoiceNumber: 'AA-2026-0005', paidToYou: 152.38, gst: invoice.gst, partyLabel: expect.any(String) })
      expect(added[0]!.paidOnISO.slice(0, 10)).toBe(TODAY)
      expectOwedEqualsOutstanding(api)
    } finally {
      unwire()
    }
  })

  it('a half payout leaves half outstanding, and the two GST parts sum to the invoice GST', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    try {
      s3(api)
      const accRec = nibAccRec(api)
      receivePayment(api, { accRecId: accRec.accRecId, amount: 76.19, idempotencyKey: 'T-HALF', source: 'webhook' })
      const row = () => outstandingPayableRowsFor(views(api), SOUTER).find((r) => r.invoiceNumber === 'AA-2026-0005')
      expect(row()).toMatchObject({ stage: 'partPaidIn', outstandingToYou: 152.38 })
      expect(approveAndPayPairForDemo(api, OFFICE, nibPairId(api)).ok).toBe(true)
      expect(row()).toMatchObject({ outstandingToYou: 76.19 })
      expectOwedEqualsOutstanding(api)
      receivePayment(api, { accRecId: accRec.accRecId, amount: 76.19, idempotencyKey: 'T-REST', source: 'webhook' })
      expect(approveAndPayPairForDemo(api, OFFICE, nibPairId(api)).ok).toBe(true)
      expect(row()).toBeUndefined()
      const parts = gstReportFor(api.getState(), SOUTER, '2026-11', TODAY).rows.filter((r) => r.invoiceNumber === 'AA-2026-0005')
      expect(parts).toHaveLength(2)
      const invoice = Object.values(api.getState().billing.invoices).find((i) => i.invoiceNumber === 'AA-2026-0005')!
      expect(parts.reduce((c, r) => c + toCents(r.gst), 0)).toBe(toCents(invoice.gst))
      expectOwedEqualsOutstanding(api)
    } finally {
      unwire()
    }
  })

  it("another anaesthetist's figures do not move", () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    try {
      const before = owed(api, ANAE.morrison)
      s3(api)
      const accRec = nibAccRec(api)
      receivePayment(api, { accRecId: accRec.accRecId, amount: accRec.remaining, idempotencyKey: 'T-NIB', source: 'webhook' })
      expect(approveAndPayPairForDemo(api, OFFICE, nibPairId(api)).ok).toBe(true)
      expect(owed(api, ANAE.morrison)).toEqual(before)
    } finally {
      unwire()
    }
  })
})

describe('the financial position (US-12.2.3 with US-08.3.5)', () => {
  it('Collected is the income receipts; Paid out is the disbursements and the GST report summed over every month', () => {
    const api = createAppStore()
    const p = owed(api)
    // Less a prepayment the AA Holding account still holds (Nair's $1,380.00, 27a): in no one's position until its transfer.
    const s = api.getState()
    const held = (pairId: string) => s.billing.ledger[pairId]?.kind === 'prePayment' && !Object.values(s.billing.transfers).some((t) => t.collectPairId === pairId)
    const receipts = incomeReceiptsFor(s, SOUTER).filter((r) => !held(r.pairId)).reduce((c, r) => c + toCents(r.grossAmount), 0)
    expect(toCents(p.collected)).toBe(receipts)
    const disbursed = Object.values(api.getState().billing.disbursements).filter((d) => d.anaesthetistId === SOUTER).reduce((c, d) => c + toCents(d.amount), 0)
    expect(toCents(p.paidOut)).toBe(disbursed)
    const months = gstReportMonthsFor(api.getState(), SOUTER, TODAY)
    const reported = months.reduce((c, m) => c + toCents(gstReportFor(api.getState(), SOUTER, m, TODAY).totals.paidToYou), 0)
    expect(reported).toBe(disbursed)
    expectOwedEqualsOutstanding(api)
  })

  it('an AA fee payment moves no figure and adds no GST row', () => {
    const api = createAppStore()
    seedMonthOfBctis(api, DEMO_TRIGGER_ACTOR, ANAE.rutherford)
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-11' })
    const before = { ...owed(api, ANAE.rutherford), theyOweAa: 0 }
    const gstBefore = gstReportFor(api.getState(), ANAE.rutherford, '2026-11', TODAY)
    const fee = Object.values(api.getState().billing.aaFeeInvoices).find((f) => f.anaesthetistId === ANAE.rutherford && f.monthISO === '2026-11')!
    expect(recordAaFeePayment(api, { aaFeeInvoiceId: fee.id, idempotencyKey: 'FEE' }).ok).toBe(true)
    expect({ ...owed(api, ANAE.rutherford), theyOweAa: 0 }).toEqual(before)
    expect(gstReportFor(api.getState(), ANAE.rutherford, '2026-11', TODAY)).toEqual(gstBefore)
    expectOwedEqualsOutstanding(api, ANAE.rutherford)
  })

  it('is deterministic across two fresh stores', () => {
    const a = createAppStore()
    const b = createAppStore()
    expect(owed(a)).toEqual(owed(b))
    expect(outstandingPayableRowsFor(views(a), SOUTER)).toEqual(outstandingPayableRowsFor(views(b), SOUTER))
    expect(gstReportFor(a.getState(), SOUTER, '2026-10', TODAY)).toEqual(gstReportFor(b.getState(), SOUTER, '2026-10', TODAY))
  })
})

describe('the GST report from the seed (cash basis, by calendar month)', () => {
  it('October 2026 holds the backdrop payouts; the months run from the first payment to July', () => {
    const api = createAppStore()
    const june = gstReportFor(api.getState(), SOUTER, '2026-10', TODAY)
    expect(june.rows.length).toBeGreaterThan(0)
    expect(june.notYetPaid).toBeUndefined()
    expect(june.rows.every((r) => r.paidOnISO.startsWith('2026-10'))).toBe(true)
    const months = gstReportMonthsFor(api.getState(), SOUTER, TODAY)
    expect(months[0]).toBe('2026-11')
    expect(months.at(-1)).toBe('2026-01')
  })
})

describe('payment history', () => {
  it('keeps received invoices visible with what was received, released and paid out', () => {
    const rows = paymentHistoryFor(views(createAppStore()), SOUTER)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((row) => row.grossReceived > 0)).toBe(true)
    // Everything received is released in full (no fee is netted; catch-up Phase 16), except a prepayment the
    // AA Holding account holds until the List is authorised (catch-up Phase 27a): Nair's AA-2026-0001.
    const held = rows.filter((row) => row.status === 'held')
    expect(held.map((row) => [row.invoiceNumber, row.releasedAmount, row.disbursedAmount])).toEqual([['AA-2026-0001', 0, 0]])
    expect(rows.filter((row) => row.status !== 'held').every((row) => toCents(row.releasedAmount) === toCents(row.grossReceived))).toBe(true)
    expect(rows.some((row) => row.status === 'paidOut')).toBe(true)
  })
})
