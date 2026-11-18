/**
 * Catch-up Phase 27's declared parity differences (the prepayment lifecycle),
 * set aside by the earlier phases' parity suites, whose fixtures never change.
 * One reason covers every one of them: the prepaid amount is the Procedure's
 * price when invoiced; payable to the AA Holding account; prepaid Procedures
 * left off, Phase 27. Exactly:
 *  - Nair's rhinoplasty (BK0038, P0041) is on Dr Souter's prepaid Rhinoplasty
 *    Contract at $1,200 (was 20's $238.50 demo Contract), so its fee is $1,200;
 *    her seeded prepayment INV0001 (BC0001) is $1,200 ex GST, $1,380 with GST,
 *    one line holding the Procedure's invoice description, and its payable
 *    (XPB0) credits the AA Holding account, authorised and not disbursed;
 *  - Riley's prepayment (BK0034, P0036) is the Procedure's $1,200 in full
 *    (was an $800 deposit), its line the Procedure's invoice description, and
 *    its payable the AA Holding account's;
 *  - Nair's final invoice leaves P0041 off (no fee line, no deduction line).
 * `phase27Parity.test.ts` pins the new figures. Imported only by tests.
 */

import { SEED_MARKERS, SEED_PREPAID_BOOKING_ID } from '../../domain/seed'

export const PHASE_27_REASON = "prepaid amount is the Procedure's price when invoiced; payable to the AA Holding account; prepaid Procedures left off, Phase 27"

/** Riley (Souter Fri 24 Jul AM) and her rhinoplasty. */
export const PHASE_27_RILEY_BOOKING = SEED_MARKERS['prepaymentBooking']!.entityId
export const PHASE_27_RILEY_PROCEDURE = 'P0036'
/** Nair (Souter Fri 24 Jul PM), her prepaid rhinoplasty and her hospital-funded septoplasty. */
export const PHASE_27_NAIR_BOOKING = SEED_PREPAID_BOOKING_ID
export const PHASE_27_NAIR_PREPAID_PROCEDURE = 'P0041'
export const PHASE_27_NAIR_SEPTOPLASTY = 'P0040'
/** Nair's seeded prepayment: its invoice, case and the pair's ids. */
export const PHASE_27_NAIR_INVOICE = 'INV0001'
export const PHASE_27_NAIR_CASE = 'BC0001'

/** The Bookings whose prepayment figures moved (Riley and Nair). */
export const PHASE_27_BOOKINGS: ReadonlySet<string> = new Set([PHASE_27_RILEY_BOOKING, PHASE_27_NAIR_BOOKING])

/** Nair's rhinoplasty's Contract now, and before (Phase 20's demo Contract, an unused master now). */
export const PHASE_27_NAIR_CONTRACT = 'CT-SOUTER-RHINO'
export const PHASE_27_NAIR_CONTRACT_BEFORE = 'CT-SOUTER-RHINO-COS'

/** Nair's rhinoplasty's fee now and as Phase 20 left it (same units, the price moves). */
export const PHASE_27_NAIR_FEE = { procedureId: PHASE_27_NAIR_PREPAID_PROCEDURE, total: 1200, billableUnits: 9, lines: [{ basis: 'fixed', amount: 1200 }] }
export const PHASE_27_NAIR_FEE_BEFORE = { procedureId: PHASE_27_NAIR_PREPAID_PROCEDURE, total: 238.5, billableUnits: 9, lines: [{ basis: 'fixed', amount: 238.5 }] }

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** A Phase 20 Procedure row's Contract mapped back to Phase 20's form, only for Nair's declared move. */
export function contractBefore27(procedureId: string, contract: string): string {
  return procedureId === PHASE_27_NAIR_PREPAID_PROCEDURE && contract === PHASE_27_NAIR_CONTRACT ? PHASE_27_NAIR_CONTRACT_BEFORE : contract
}

/** A Phase 24 price row (total and computed price, no lines) mapped back, only for Nair's rhinoplasty at exactly $1,200. */
export function nairPriceBefore27<R extends { procedureId: string; total: number; computed?: number | null }>(row: R): R {
  if (row.procedureId !== PHASE_27_NAIR_PREPAID_PROCEDURE || row.total !== PHASE_27_NAIR_FEE.total) return row
  if (row.computed !== undefined && row.computed !== null && row.computed !== PHASE_27_NAIR_FEE.total) return row
  return { ...row, total: PHASE_27_NAIR_FEE_BEFORE.total, ...(row.computed !== undefined && row.computed !== null ? { computed: PHASE_27_NAIR_FEE_BEFORE.total } : {}) }
}

/** Nair's Booking total ex GST: Forte's $212.00 septoplasty plus her rhinoplasty, now $1,200 (was $238.50). */
export const PHASE_27_NAIR_BOOKING_TOTAL = 1412
export const PHASE_27_NAIR_BOOKING_TOTAL_BEFORE = 450.5

/** A Booking total row mapped back, only for Nair's Booking at exactly its declared total. */
export function nairBookingTotalBefore27<R extends { bookingId: string; total: number }>(row: R): R {
  return row.bookingId === PHASE_27_NAIR_BOOKING && row.total === PHASE_27_NAIR_BOOKING_TOTAL ? { ...row, total: PHASE_27_NAIR_BOOKING_TOTAL_BEFORE } : row
}

/** Nair's seeded INV0001 total with GST, now and before ($238.50 ex GST then; $1,200 now). */
export const PHASE_27_NAIR_INVOICE_TOTAL = 1380
export const PHASE_27_NAIR_INVOICE_TOTAL_BEFORE = 274.28

/** An issued-invoice row's total mapped back to the earlier form, only for INV0001 at its declared total. */
export function issuedBefore27<T extends { invoiceId: string; total: number }>(row: T): T {
  return row.invoiceId === PHASE_27_NAIR_INVOICE && row.total === PHASE_27_NAIR_INVOICE_TOTAL ? { ...row, total: PHASE_27_NAIR_INVOICE_TOTAL_BEFORE } : row
}

/** Riley's and Nair's prepayment builds as the earlier fixtures hold them: a deposit, and 20's $238.50 at 9 RVG units. */
const PREPAYMENT_BUILD_BEFORE: Record<string, { subtotal: number; total: number; line: { amount: number; description: string; units?: number } }> = {
  [PHASE_27_RILEY_BOOKING]: { subtotal: 800, total: 920, line: { amount: 800, description: 'Pre-payment deposit' } },
  [PHASE_27_NAIR_BOOKING]: { subtotal: 238.5, total: 274.28, line: { amount: 238.5, description: 'Pre-payment, estimated full fee', units: 9 } },
}
/** Each one's build now: the rhinoplasty's $1,200 in full, its line the Procedure's invoice description. */
export const PHASE_27_PREPAYMENT_BUILD = { subtotal: 1200, total: 1380, line: { amount: 1200, description: 'Rhinoplasty' } }

type BuildInvoice = { subtotal: number; total: number; lines?: { amount: number; description: string; units?: number }[] }
type BuildRow = { bookingId: string; prepayment?: { kind: 'invoices'; invoices: BuildInvoice[] } | { kind: 'exception'; code: string } }

/**
 * A Booking row's prepayment build (Phase 22a's and 23's captures) mapped back
 * to the earlier form, only for Riley and Nair and only when it is exactly
 * Phase 27's declared build: one invoice at $1,200 ($1,380), its one line (if
 * the capture records lines) the rhinoplasty's $1,200.
 */
export function prepaymentBuildBefore27<R extends BuildRow>(row: R): R {
  const was = PREPAYMENT_BUILD_BEFORE[row.bookingId]
  const pre = row.prepayment
  if (was === undefined || pre === undefined || pre.kind !== 'invoices' || pre.invoices.length !== 1) return row
  const [invoice] = pre.invoices
  if (invoice === undefined || invoice.subtotal !== PHASE_27_PREPAYMENT_BUILD.subtotal || invoice.total !== PHASE_27_PREPAYMENT_BUILD.total) return row
  let lines = invoice.lines
  if (lines !== undefined) {
    const [line] = lines
    if (lines.length !== 1 || line === undefined || !sameJson({ amount: line.amount, description: line.description, units: line.units }, { ...PHASE_27_PREPAYMENT_BUILD.line, units: undefined })) return row
    lines = [{ ...line, amount: was.line.amount, description: was.line.description, ...(was.line.units !== undefined ? { units: was.line.units } : {}) }]
  }
  const mapped: BuildInvoice = { ...invoice, subtotal: was.subtotal, total: was.total, ...(lines !== undefined ? { lines } : {}) }
  return { ...row, prepayment: { ...pre, invoices: [mapped] } }
}

/** One prepayment invoice row, as Phase 20's capture (`phase20Capture.ts`) records it. */
const rhinoplastyPrepayment = (counterparty: string) => ({
  kind: 'prePayment',
  counterparty,
  subtotal: 1200,
  gst: 180,
  total: 1380,
  lines: [{ description: 'Rhinoplasty', amount: 1200 }],
})

/**
 * Riley's and Nair's prepayments as Phase 20's capture records them now:
 * each the rhinoplasty's $1,200 in full ($1,380 with GST), its line the
 * Procedure's invoice description; Riley's pair raised live (receivable
 * awaiting payment, payable DRAFT), Nair's seeded (paid, its payable
 * authorised and held on the AA Holding account, not disbursed). The payable
 * still names Dr Souter as the List's anaesthetist; its payee is the AA
 * Holding account, which this capture does not record.
 */
export const PHASE_27_PREPAYMENT_ROWS_20 = [
  {
    bookingId: PHASE_27_RILEY_BOOKING,
    invoices: [rhinoplastyPrepayment('patient:PT0017')],
    accRecs: [{ amountDue: 1380, status: 'awaitingPayment' }],
    accPays: [{ amountPayable: 1380, status: 'draft', anaesthetistId: '34821' }],
  },
  {
    bookingId: PHASE_27_NAIR_BOOKING,
    invoices: [rhinoplastyPrepayment('patient:PT0008')],
    accRecs: [{ amountDue: 1380, status: 'paid' }],
    accPays: [{ amountPayable: 1380, status: 'authorised', anaesthetistId: '34821' }],
  },
]

/**
 * A fee row (`{ procedureId, total, billableUnits, lines }`, with or without
 * B, T and M) mapped back to Phase 20's form, only when it equals Phase 27's
 * declared value exactly. Mutates the row; returns whether it was mapped.
 */
export function mapNairFeeBefore27(row: { procedureId: string; total: number; billableUnits: number; lines: { basis: string; amount: number }[] }): boolean {
  if (row.procedureId !== PHASE_27_NAIR_PREPAID_PROCEDURE) return false
  const { procedureId, total, billableUnits, lines } = row
  if (!sameJson({ procedureId, total, billableUnits, lines }, PHASE_27_NAIR_FEE)) return false
  row.total = PHASE_27_NAIR_FEE_BEFORE.total
  row.lines = PHASE_27_NAIR_FEE_BEFORE.lines.map((l) => ({ ...l }))
  return true
}
