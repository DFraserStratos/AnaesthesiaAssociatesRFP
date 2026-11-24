/**
 * Catch-up Phase 36 parity (work item 1). `__parity__/phase-36-baseline.json`
 * was written once from the build as it stood BEFORE the internal ledger
 * (the billing case the record, every money view reading it) and is never
 * rewritten (never `-u`). Every figure a presenter shows must read the same
 * once the ledger is the system of record: the seed's anaesthetist views,
 * payables due, prepayment statuses, the AA Holding account, the AA fee
 * invoices and previews, the BCTI records and counts, the Billing monitor and
 * the payment picker, and six scripted flows step by step (S3, S4 Beats 3 and
 * 5, the prepayment with its transfer and the switch off, the seeded paid
 * prepayment, 16's fee run with Dr Rutherford's $700.00 ex GST, and 27's
 * re-check and a move). Keyed on invoice numbers and Booking ids, never case ids.
 */

import baselineJson from './__parity__/phase-36-baseline.json'
import { describe, expect, it } from 'vitest'
import { capturePhase36, type Phase36Capture } from './__parity__/phase36Capture'
import { DECLARED_36, withoutDeclared36, withoutRetired38 } from './__parity__/phase36Declared'

// Read without the views catch-up Phase 38 retired (ageing, receipts-based GST activity).
const BASELINE = withoutRetired38(baselineJson as unknown) as Phase36Capture
const raw = capturePhase36()
/** The capture with the one declared move taken out: everything else must match the baseline exactly. */
const captured = withoutDeclared36(raw)

describe(`Phase 36 parity: declared (${DECLARED_36.reason})`, () => {
  it("Dr Souter's views gain AA-2026-S2401 ($3,565.00 outstanding, current); it is in no baseline", () => {
    const row = raw.seed.anaesthetists[DECLARED_36.anaesthetistId]!.rows.find((r) => r.invoiceNumber === DECLARED_36.invoiceNumber)
    expect(row).toEqual({ invoiceNumber: DECLARED_36.invoiceNumber, total: 3565, received: 0, disbursed: 0, outstanding: 3565, held: false })
    expect(JSON.stringify(BASELINE.seed.anaesthetists)).not.toContain(DECLARED_36.invoiceNumber)
  })
  it('its BCTI record counts only by issue (July +1); every paid-only count is unchanged', () => {
    expect(raw.seed.bctis.records.some((r) => r.billNumber === DECLARED_36.billNumber && r.receivablePaidAtISO === null)).toBe(true)
    const month = (c: typeof raw.seed.bctis.counts) => c[DECLARED_36.anaesthetistId]![DECLARED_36.issuedMonth]!
    expect(month(raw.seed.bctis.counts).paidOnly).toBe(month(BASELINE.seed.bctis.counts).paidOnly)
    expect(month(raw.seed.bctis.counts).byIssue).toBe(month(BASELINE.seed.bctis.counts).byIssue + 1)
  })
})

describe('Phase 36 parity: the seed reads the same from the ledger', () => {
  it("every anaesthetist's outstanding rows and payment history (ageing and GST activity retired by catch-up Phase 38)", () => {
    expect(captured.seed.anaesthetists).toEqual(BASELINE.seed.anaesthetists)
  })
  it('payables due, the AA Holding account and every prepayment status', () => {
    expect(captured.seed.due).toEqual(BASELINE.seed.due)
    expect(captured.seed.dueBy).toEqual(BASELINE.seed.dueBy)
    expect(captured.seed.holding).toEqual(BASELINE.seed.holding)
    expect(captured.seed.prepayment).toEqual(BASELINE.seed.prepayment)
  })
  it('the AA fee invoices, their statuses and the May to July previews', () => {
    expect(captured.seed.feeInvoices).toEqual(BASELINE.seed.feeInvoices)
    expect(captured.seed.feeStatuses).toEqual(BASELINE.seed.feeStatuses)
    expect(captured.seed.feePreviews).toEqual(BASELINE.seed.feePreviews)
  })
  it('the BCTI records and counts, paid only and by issue', () => {
    expect(captured.seed.bctis).toEqual(BASELINE.seed.bctis)
  })
  it('the Billing monitor, the payment picker and every invoice', () => {
    expect(captured.seed.monitor).toEqual(BASELINE.seed.monitor)
    expect(captured.seed.picker).toEqual(BASELINE.seed.picker)
    expect(captured.seed.invoices).toEqual(BASELINE.seed.invoices)
  })
})

describe('Phase 36 parity: the scripted flows, step by step', () => {
  it('S3: Mon 23 authorised, the nib invoice paid half, run, rest, run', () => {
    expect(captured.s3).toEqual(BASELINE.s3)
  })
  it('S4 Beat 3: the billing failure and its retry', () => {
    // Catch-up Phase 37's declared move: a hand-off waiting in the Xero sync queue reads "partial" (warning, retried by
    // the queue), where Phase 36's fault read "failed". Everything else in the beat, the retry included, is unchanged.
    const baselineStaged = JSON.parse(JSON.stringify(BASELINE.s4Beat3).replaceAll('"xero:failed"', '"xero:partial"')) as typeof BASELINE.s4Beat3
    expect(JSON.stringify(BASELINE.s4Beat3)).toContain('"xero:failed"')
    expect(captured.s4Beat3).toEqual(baselineStaged)
  })
  it('S4 Beat 5: Hemi Walker half, run, rest, run', () => {
    expect(captured.s4Beat5).toEqual(BASELINE.s4Beat5)
  })
  it('the prepayment: added, approved, paid half and in full, its List authorised and the transfer paid', () => {
    expect(captured.prepayment).toEqual(BASELINE.prepayment)
    expect(captured.approvalOff).toEqual(BASELINE.approvalOff)
  })
  it('the seeded paid prepayment is held until its List is authorised, then paid to Dr Souter', () => {
    expect(captured.seededPaidPrepayment).toEqual(BASELINE.seededPaidPrepayment)
  })
  it("16's fee run: Dr Rutherford's July fee is $700.00 ex GST, then paid", () => {
    expect(captured.feeRun).toEqual(BASELINE.feeRun)
    expect(captured.feeRun.preview?.find((r) => r.bctiCount === 40)?.subtotal).toBe(700)
  })
  it("27's re-check and a move change no pair, amount or payee", () => {
    // Declared (catch-up Phase 41, D67): a Contract changed off prepaid after sending is now credited in full, so the
    // `changed` step moves by design; prepaymentCancellation.test.ts pins it. Everything else is compared as it was.
    const { changed: _now, ...recheck } = captured.recheck
    const { changed: _then, ...baseline } = BASELINE.recheck
    expect(recheck).toEqual(baseline)
    expect(captured.recheck.changed.status.status).toBe('none')
    expect(captured.s4RunOnly).toEqual(BASELINE.s4RunOnly)
  })
})
