import { describe, expect, it } from 'vitest'
import type { AaFeeLedgerPair, BookingLedgerPair, Invoice, LedgerDisbursement, LedgerPair, LedgerTransfer } from '../types'
import { gstMonthLabel, gstReportCsv, gstReportFileName, gstReportFrom, gstReportMonths } from './gstReport'

const ME = 'A1'
const OTHER = 'A2'

function invoice(id: string, number: string, total: number, gst: number): Invoice {
  return { id, invoiceNumber: number, caseReference: id, bookingId: 'BK1', counterparty: { kind: 'patient', id: 'P1' }, layout: 'patient', kind: 'standard', subtotal: total - gst, gst, total, raisedAtISO: '2026-07-01T09:00:00' } as Invoice
}

function pair(id: string, invoiceId: string, number: string, amount: number, payee: string | 'holding' = ME, kind: 'procedure' | 'prePayment' = 'procedure'): BookingLedgerPair {
  return {
    id,
    kind,
    invoiceId,
    bookingId: 'BK1',
    listId: 'L1',
    ...(payee === 'holding' ? {} : { anaesthetistId: payee }),
    patientId: 'P1',
    procedureIds: [],
    procedureShares: [],
    createdAtISO: '2026-07-01T09:00:00',
    receivable: { number, counterparty: { kind: 'patient', id: 'P1' }, amount, receivedAmount: amount },
    payable: {
      number: `${number}-P`,
      payee: payee === 'holding' ? { kind: 'holding' } : { kind: 'anaesthetist', anaesthetistId: payee },
      amount,
      releasedAmount: amount,
      disbursedAmount: 0,
      issuedAtISO: '2026-07-01T09:00:00',
    },
  } as BookingLedgerPair
}

function paid(id: string, pairId: string, amount: number, atISO: string, anaesthetistId = ME): LedgerDisbursement {
  return { id, pairId, anaesthetistId, amount, atISO, payablesRunId: 'RUN', idempotencyKey: `BILLPAY-${id}`, detectedBy: 'webhook' }
}

const INV1 = invoice('INV1', 'AA-2026-0005', 152.38, 19.88)
const PAIR1 = pair('BC1', 'INV1', 'AA-2026-0005', 152.38)

function report(over: { pairs?: LedgerPair[]; invoices?: Invoice[]; disbursements: LedgerDisbursement[]; transfers?: LedgerTransfer[]; monthISO?: string; anaesthetistId?: string }) {
  return gstReportFrom({
    pairs: Object.fromEntries((over.pairs ?? [PAIR1]).map((p) => [p.id, p])),
    invoices: Object.fromEntries((over.invoices ?? [INV1]).map((i) => [i.id, i])),
    transfers: Object.fromEntries((over.transfers ?? []).map((t) => [t.id, t])),
    disbursements: over.disbursements,
    anaesthetistId: over.anaesthetistId ?? ME,
    monthISO: over.monthISO ?? '2026-07',
  })
}

describe('gstReportFrom (catch-up Phase 38; US-12.2.2, cash basis)', () => {
  it('has no row without a payment: a receipt alone adds nothing', () => {
    expect(report({ disbursements: [] }).rows).toEqual([])
  })

  it('adds one row on the payout date with the invoice\'s own GST', () => {
    const r = report({ disbursements: [paid('D1', 'BC1', 152.38, '2026-07-21T15:00:00')] })
    expect(r.rows).toHaveLength(1)
    expect(r.rows[0]).toMatchObject({ invoiceNumber: 'AA-2026-0005', payableNumber: 'AA-2026-0005-P', paidOnISO: '2026-07-21T15:00:00', paidToYou: 152.38, gst: 19.88, paidExGst: 132.5 })
    expect(r.totals).toEqual({ paidToYou: 152.38, gst: 19.88, paidExGst: 132.5 })
  })

  it('splits a payable paid across two months; the GST parts sum to the invoice GST to the cent', () => {
    const inv = invoice('INV2', 'AA-2026-0100', 100.01, 13.05)
    const p = pair('BC2', 'INV2', 'AA-2026-0100', 100.01)
    const ds = [paid('D1', 'BC2', 33.33, '2026-07-31T23:00:00'), paid('D2', 'BC2', 66.68, '2026-08-01T08:00:00')]
    const july = report({ pairs: [p], invoices: [inv], disbursements: ds, monthISO: '2026-07' })
    const august = report({ pairs: [p], invoices: [inv], disbursements: ds, monthISO: '2026-08' })
    expect(july.rows).toHaveLength(1)
    expect(august.rows).toHaveLength(1)
    expect(Math.round((july.totals.gst + august.totals.gst) * 100)).toBe(1305)
    expect(Math.round((july.totals.paidToYou + august.totals.paidToYou) * 100)).toBe(10001)
    // The completing payment takes the remainder.
    expect(july.rows[0]?.gst).toBe(4.35)
    expect(august.rows[0]?.gst).toBe(8.7)
  })

  it('reads the stored GST, never 3/23: a zero-GST invoice shows zero GST', () => {
    const inv = invoice('INV3', 'AA-2026-0200', 500, 0)
    const p = pair('BC3', 'INV3', 'AA-2026-0200', 500)
    const r = report({ pairs: [p], invoices: [inv], disbursements: [paid('D1', 'BC3', 500, '2026-07-10T10:00:00')] })
    expect(r.rows[0]).toMatchObject({ gst: 0, paidExGst: 500 })
  })

  it('ignores an AA fee pair and another anaesthetist\'s payout', () => {
    const fee: AaFeeLedgerPair = { id: 'BC9', kind: 'aaFee', aaFeeInvoiceId: 'FEE1', anaesthetistId: ME, createdAtISO: '2026-07-01T09:00:00', receivable: { number: 'AAF-1', counterparty: { kind: 'anaesthetist', id: ME }, amount: 115, receivedAmount: 115 } }
    const theirs = pair('BC4', 'INV1', 'AA-2026-0005', 152.38, OTHER)
    const r = report({
      pairs: [PAIR1, fee, theirs],
      disbursements: [paid('D1', 'BC9', 115, '2026-07-10T10:00:00'), paid('D2', 'BC4', 152.38, '2026-07-10T10:00:00', OTHER)],
    })
    expect(r.rows).toEqual([])
  })

  it('counts a prepayment through its transfer leg, never while the AA Holding account holds it', () => {
    const inv = invoice('INV5', 'AA-2026-0300', 1380, 180)
    const held = pair('BC5', 'INV5', 'AA-2026-0300', 1380, 'holding', 'prePayment')
    const transfer = {
      id: 'TR1', kind: 'prepayTransfer', collectPairId: 'BC5', invoiceId: 'INV5', bookingId: 'BK1', listId: 'L1', patientId: 'P1', createdAtISO: '2026-07-21T10:00:00', out: { amount: 1380 },
      in: { number: 'TR1', payee: { kind: 'anaesthetist', anaesthetistId: ME }, amount: 1380, releasedAmount: 1380, disbursedAmount: 0, issuedAtISO: '2026-07-21T10:00:00' },
    } as LedgerTransfer
    const r = report({ pairs: [held], invoices: [inv], transfers: [transfer], disbursements: [paid('D1', 'TR1', 1380, '2026-07-22T10:00:00')] })
    expect(r.rows).toHaveLength(1)
    expect(r.rows[0]).toMatchObject({ pairId: 'BC5', invoiceNumber: 'AA-2026-0300', paidToYou: 1380, gst: 180 })
  })

  it('sorts by date paid, then invoice number; a zero payment adds no row', () => {
    const inv = invoice('INV6', 'AA-2026-0001', 115, 15)
    const p = pair('BC6', 'INV6', 'AA-2026-0001', 115)
    const r = report({
      pairs: [PAIR1, p],
      invoices: [INV1, inv],
      disbursements: [paid('D1', 'BC1', 152.38, '2026-07-21T09:00:00'), paid('D2', 'BC6', 115, '2026-07-21T15:00:00'), paid('D3', 'BC6', 0, '2026-07-02T15:00:00')],
    })
    expect(r.rows.map((x) => x.invoiceNumber)).toEqual(['AA-2026-0001', 'AA-2026-0005'])
  })

  it('puts a leap-year February payment in February', () => {
    const r = report({ disbursements: [paid('D1', 'BC1', 152.38, '2028-02-29T10:00:00')], monthISO: '2028-02' })
    expect(r.rows).toHaveLength(1)
    expect(report({ disbursements: [paid('D1', 'BC1', 152.38, '2028-02-29T10:00:00')], monthISO: '2028-03' }).rows).toEqual([])
  })
})

describe('gstReportMonths', () => {
  it('runs from the earliest payment to the demo month, newest first, across a year end', () => {
    const ds = [paid('D1', 'BC1', 1, '2025-11-03T10:00:00'), paid('D2', 'BC1', 1, '2026-01-20T10:00:00'), paid('D3', 'BC1', 1, '2024-01-01T10:00:00', OTHER)]
    expect(gstReportMonths(ds, ME, '2026-02-14')).toEqual(['2026-02', '2026-01', '2025-12', '2025-11'])
  })

  it('always holds the current month, even with no payments', () => {
    expect(gstReportMonths([], ME, '2026-07-21')).toEqual(['2026-07'])
  })
})

describe('gstReportCsv and the file name', () => {
  it('writes a header, one row per payment and a totals row, in plain decimals with no dashes in headings', () => {
    const r = report({ disbursements: [paid('D1', 'BC1', 152.38, '2026-07-21T15:00:00')] })
    const csv = gstReportCsv({ ...r, rows: r.rows.map((row) => ({ ...row, partyLabel: 'Southern Cross, "Health"' })) })
    const lines = csv.trimEnd().split('\n')
    expect(lines).toEqual([
      'Date paid,Invoice,Billable party,Paid to you (incl GST),GST component,Paid ex GST',
      '2026-07-21,AA-2026-0005,"Southern Cross, ""Health""",152.38,19.88,132.50',
      'Month total July 2026,,,152.38,19.88,132.50',
    ])
    expect(lines[0]).not.toMatch(/[–—-]/)
  })

  it('names the file by month, and labels the month', () => {
    expect(gstReportFileName('2026-07')).toBe('gst-report-2026-07.csv')
    expect(gstMonthLabel('2026-06')).toBe('June 2026')
  })
})
