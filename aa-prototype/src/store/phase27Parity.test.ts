/**
 * Catch-up Phase 27 parity (work items 1 and 9). `__parity__/phase-27-baseline.json`
 * was written from the build as it stood before the phase and is never
 * rewritten (never `-u`). The figures that must not move are compared with it
 * as they are; the deliberate changes are declared here, each with its
 * reason: the prepaid amount is the Procedure's price when invoiced; the
 * payable goes to the AA Holding account; prepaid Procedures are left off the
 * final invoice (Phase 27).
 */

import baselineJson from './__parity__/phase-27-baseline.json'
import { describe, expect, it } from 'vitest'
import { capturePhase27, type Phase27Capture } from './__parity__/phase27Capture'
import { approveAllPrepayments } from '../test/approvePrepayments'

const BASELINE = baselineJson as Phase27Capture
const captured = capturePhase27((api, bookingId) => {
  approveAllPrepayments(api, bookingId)
})

describe('Phase 27 prepayment parity', () => {
  it("Nair's run is unchanged: Forte's septoplasty invoice alone, the rhinoplasty left off (it was netted to nothing before)", () => {
    expect(captured.nairRun).toEqual(BASELINE.nairRun)
  })

  it('declared: Riley awaits approval with a mild warning (was a strong "required"); Nair is paid with no warning', () => {
    expect(BASELINE.statuses.map((s) => s.bookingId)).toEqual(['BK0034', 'BK0038'])
    expect(captured.statuses).toEqual([
      { bookingId: 'BK0034', status: 'none', warnings: ['BK0034:prepaymentUnpaid:patient:PT0017 mild: Prepayment of $1,200.00 from Annette Riley is awaiting approval on Invoices and has not been sent.'] },
      { bookingId: 'BK0038', status: 'invoiced', warnings: [] },
    ])
  })

  it('declared: the payables due are unchanged (none); Nair\'s prepayment is held for the AA Holding account, not paid to Dr Souter', () => {
    expect(captured.payablesDue).toEqual(BASELINE.payablesDue)
  })

  it("declared: INV0001 is Nair's rhinoplasty at its Contract's $1,200.00 ex GST, its payable to the AA Holding account, held", () => {
    const [was] = BASELINE.seededPair
    const [now] = captured.seededPair
    expect(now).toMatchObject({ invoiceNumber: was!.invoiceNumber, counterparty: was!.counterparty, subtotal: 1200, gst: 180, total: 1380 })
    expect(now!.accRec).toEqual({ ...was!.accRec, amountDue: 1380, amountReceived: 1380 })
    expect(now!.accPay).toEqual({ ...was!.accPay, contact: 'AA Holding account', amountPayable: 1380, amountAuthorised: 1380, amountDisbursed: 0, status: 'authorised' })
    expect(now!.caseStatus).toBe('paid')
  })

  it("declared: Riley's live prepayment is the $1,200.00 price in full (was an $800 deposit), its DRAFT payable to the AA Holding account; the pair's shape is otherwise the same", () => {
    const [was] = BASELINE.livePair
    const [now] = captured.livePair
    expect(now).toMatchObject({ invoiceNumber: was!.invoiceNumber, counterparty: was!.counterparty, subtotal: 1200, gst: 180, total: 1380 })
    expect(now!.lines).toEqual([{ procedureId: 'P0036', description: 'Rhinoplasty', amount: 1200 }])
    expect(now!.accRec).toEqual({ ...was!.accRec, amountDue: 1380 })
    expect(now!.accPay).toEqual({ ...was!.accPay, contact: 'AA Holding account', amountPayable: 1380 })
    expect(now!.caseStatus).toBe(was!.caseStatus)
  })
})
