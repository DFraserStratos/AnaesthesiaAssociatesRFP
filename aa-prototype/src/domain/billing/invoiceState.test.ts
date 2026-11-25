import { describe, expect, it } from 'vitest'
import type { AaFeeLedgerPair, BookingLedgerPair, CreditNote, Invoice, LedgerPair } from '../types'
import {
  filterInvoiceRows,
  invoiceCountLine,
  invoiceCounts,
  invoiceRows,
  OPENING_INVOICE_FILTER,
  type InvoiceStateInput,
  type PendingPrepaymentInput,
} from './invoiceState'

const TODAY = '2026-11-24'

function mkInvoice(id: string, overrides: Partial<Invoice> = {}): Invoice {
  const n = id.replace(/\D/g, '').padStart(4, '0')
  return {
    id,
    invoiceNumber: `AA-2026-${n}`,
    caseReference: `CASE-${n}`,
    bookingId: 'B1',
    counterparty: { kind: 'patient', id: 'P1' },
    layout: 'patient',
    kind: 'standard',
    subtotal: 0,
    gst: 0,
    total: 1000,
    raisedAtISO: '2026-11-20T09:00:00',
    ...overrides,
  }
}

function mkPair(invoice: Invoice, overrides: Partial<BookingLedgerPair> = {}, received = 0): BookingLedgerPair {
  return {
    id: `PAIR-${invoice.id}`,
    kind: invoice.kind === 'prePayment' ? 'prePayment' : 'procedure',
    invoiceId: invoice.id,
    bookingId: invoice.bookingId,
    listId: 'L1',
    anaesthetistId: 'A1',
    patientId: 'P1',
    procedureIds: [],
    procedureShares: [],
    createdAtISO: '2026-11-19T09:00:00',
    receivable: { number: invoice.invoiceNumber, counterparty: invoice.counterparty, amount: invoice.total, receivedAmount: received },
    payable: { number: `${invoice.invoiceNumber}-P`, payee: { kind: 'anaesthetist', anaesthetistId: 'A1' }, amount: invoice.total, releasedAmount: 0, disbursedAmount: 0, issuedAtISO: '2026-11-19T09:00:00' },
    ...overrides,
  }
}

function mkCreditNote(id: string, original: Invoice, overrides: Partial<CreditNote> = {}): CreditNote {
  return {
    id,
    creditNoteNumber: `CN-2026-${id.replace(/\D/g, '').padStart(4, '0')}`,
    originalInvoiceId: original.id,
    pairId: `PAIR-${original.id}`,
    creditEventId: 'EV1',
    bookingId: original.bookingId,
    procedureIds: [],
    counterparty: original.counterparty,
    gstTreatment: 'exclusiveAtFoot',
    lines: [],
    subtotal: 0,
    gst: 0,
    total: original.total,
    reason: 'Wrong payer',
    cause: 'correction',
    replacementInvoiceIds: [],
    issuedAtISO: '2026-11-22T10:00:00',
    issuedBy: { who: 'Office', role: 'office' },
    delivery: { method: 'email', status: 'noAddress' },
    reversal: { receivableCredited: original.total, negativeInvoiceTotal: original.total, offsetAgainstPayable: original.total, releaseCancelled: 0, heldForPayer: 0, recoveryDue: 0 },
    ...overrides,
  }
}

function mkInput(parts: { invoices?: Invoice[]; pairs?: LedgerPair[]; creditNotes?: CreditNote[]; pending?: PendingPrepaymentInput[] } = {}): InvoiceStateInput {
  const pairByInvoice = new Map<string, LedgerPair>()
  for (const p of parts.pairs ?? []) pairByInvoice.set(p.kind === 'aaFee' ? p.aaFeeInvoiceId : p.invoiceId, p)
  return {
    invoices: parts.invoices ?? [],
    creditNotes: parts.creditNotes ?? [],
    pairByInvoice,
    bookings: {
      B1: { listId: 'L1', patientId: 'P1' },
      B2: { listId: 'L2', patientId: 'P2' },
      B3: { listId: 'L2', patientId: 'P1' },
    },
    lists: {
      L1: { dateISO: '2026-11-18', session: 'AM', anaesthetistId: 'A1' },
      L2: { dateISO: '2026-11-30', session: 'PM', anaesthetistId: 'A2' },
    },
    patients: { P1: { name: 'Aroha Ngata' }, P2: { name: 'Ben Carter' } },
    anaesthetists: { A1: { name: 'Dr Melanie Souter' }, A2: { name: 'Dr James Wu' } },
    payerName: (doc) => (doc.counterparty.kind === 'party' ? 'Southern Cross' : 'Aroha Ngata'),
    pendingPrepayments: parts.pending ?? [],
    todayISO: TODAY,
  }
}

const PENDING: PendingPrepaymentInput = {
  bookingId: 'B2',
  listId: 'L2',
  dateISO: '2026-11-30',
  anaesthetistId: 'A2',
  patientName: 'Ben Carter',
  payerKey: 'patient',
  payerName: 'Ben Carter',
  amount: 850,
  ready: true,
}

describe('invoiceRows (US-08.4.7)', () => {
  it('a $1,000 invoice with $400 received is part paid, owing $600', () => {
    const inv = mkInvoice('INV1')
    const [row] = invoiceRows(mkInput({ invoices: [inv], pairs: [mkPair(inv, {}, 400)] }))
    expect(row).toMatchObject({ state: 'partPaid', owing: 600, total: 1000, kind: 'invoice', credited: false })
  })

  it('an invoice raised 40 days ago and unpaid ages 40 days and owes its total', () => {
    const inv = mkInvoice('INV1', { raisedAtISO: '2026-10-15T09:00:00' })
    const [row] = invoiceRows(mkInput({ invoices: [inv], pairs: [mkPair(inv)] }))
    expect(row).toMatchObject({ state: 'unpaid', ageDays: 40, owing: 1000 })
  })

  it('places the row from its Booking and List, and reads the raise date from the pair when the invoice has none', () => {
    const inv = mkInvoice('INV1', { raisedAtISO: undefined })
    const [row] = invoiceRows(mkInput({ invoices: [inv], pairs: [mkPair(inv)] }))
    expect(row).toMatchObject({
      listId: 'L1',
      bookingDateISO: '2026-11-18',
      session: 'AM',
      anaesthetistId: 'A1',
      anaesthetistName: 'Dr Melanie Souter',
      patientId: 'P1',
      patientName: 'Aroha Ngata',
      raisedISO: '2026-11-19T09:00:00',
      payableNumber: 'AA-2026-0001-P',
      caseReference: 'CASE-0001',
    })
  })

  it('an invoice with no pair owes its total', () => {
    const [row] = invoiceRows(mkInput({ invoices: [mkInvoice('INV1', { total: 250 })] }))
    expect(row).toMatchObject({ state: 'unpaid', owing: 250 })
  })

  it('searching the payable number AA-2026-0002-P finds its invoice, in any case', () => {
    const a = mkInvoice('INV1')
    const b = mkInvoice('INV2', { bookingId: 'B2' })
    const rows = invoiceRows(mkInput({ invoices: [a, b], pairs: [mkPair(a), mkPair(b)] }))
    expect(filterInvoiceRows(rows, 'all', { q: 'AA-2026-0002-P' }).map((r) => r.id)).toEqual(['INV2'])
    expect(filterInvoiceRows(rows, 'all', { q: '  aa-2026-0002-p ' }).map((r) => r.id)).toEqual(['INV2'])
  })

  it("searching a patient's name lists both of their invoices", () => {
    const a = mkInvoice('INV1')
    const b = mkInvoice('INV2', { bookingId: 'B3' })
    const c = mkInvoice('INV3', { bookingId: 'B2', counterparty: { kind: 'party', id: 'SX' } })
    const rows = invoiceRows(mkInput({ invoices: [a, b, c] }))
    expect(filterInvoiceRows(rows, 'all', { q: 'aroha' }).map((r) => r.id).sort()).toEqual(['INV1', 'INV2'])
  })

  it('skips an invoice whose pair is an AA fee pair', () => {
    const inv = mkInvoice('INV1')
    const aaFee: AaFeeLedgerPair = {
      id: 'PAIR-FEE',
      kind: 'aaFee',
      aaFeeInvoiceId: 'INV1',
      anaesthetistId: 'A1',
      createdAtISO: '2026-11-01T00:00:00',
      receivable: { number: 'AAF-2026-0001', counterparty: { kind: 'anaesthetist', id: 'A1' }, amount: 100, receivedAmount: 0 },
    }
    expect(invoiceRows(mkInput({ invoices: [inv], pairs: [aaFee] }))).toEqual([])
  })

  it('a credit note follows its invoice, owes nothing, and leaves the credited invoice owing $0', () => {
    const inv = mkInvoice('INV1')
    const pair = mkPair(inv, { credit: { creditNoteId: 'CRN1', atISO: '2026-11-22T10:00:00', heldForPayer: 0, recoveryDue: 0 } })
    pair.receivable.creditedAmount = 1000
    const cn = mkCreditNote('CRN1', inv)
    const rows = invoiceRows(mkInput({ invoices: [inv], pairs: [pair], creditNotes: [cn] }))
    const invoiceRow = rows.find((r) => r.id === 'INV1')
    const creditRow = rows.find((r) => r.id === 'CRN1')
    expect(invoiceRow).toMatchObject({ owing: 0, state: 'paid', credited: true })
    expect(invoiceRow?.ageDays).toBeUndefined()
    expect(creditRow).toMatchObject({
      kind: 'creditNote',
      number: 'CN-2026-0001',
      owing: 0,
      total: 1000,
      state: invoiceRow?.state,
      originalInvoiceId: 'INV1',
      raisedISO: '2026-11-22T10:00:00',
      delivery: { method: 'email', status: 'noAddress' },
    })
    // Its keys carry its own number and its original's.
    expect(filterInvoiceRows(rows, 'all', { q: 'AA-2026-0001' }).map((r) => r.id).sort()).toEqual(['CRN1', 'INV1'])
    expect(filterInvoiceRows(rows, 'all', { q: 'cn-2026-0001' }).map((r) => r.id)).toEqual(['CRN1'])
  })

  it('a credit note in the input marks its invoice credited even before the pair says so', () => {
    const inv = mkInvoice('INV1')
    const rows = invoiceRows(mkInput({ invoices: [inv], pairs: [mkPair(inv)], creditNotes: [mkCreditNote('CRN1', inv)] }))
    expect(rows.find((r) => r.id === 'INV1')).toMatchObject({ credited: true, owing: 0, state: 'paid' })
  })

  it('a credit note whose original is left out reads paid', () => {
    const inv = mkInvoice('INV9')
    const [row] = invoiceRows(mkInput({ creditNotes: [mkCreditNote('CRN1', inv)] }))
    expect(row).toMatchObject({ kind: 'creditNote', state: 'paid', owing: 0 })
  })

  it('a pending prepayment is awaiting approval: found under its filter, not under unpaid', () => {
    const rows = invoiceRows(mkInput({ pending: [PENDING] }))
    const [row] = rows
    expect(row).toMatchObject({
      id: 'pending:B2:patient',
      kind: 'prepayment',
      state: 'awaitingApproval',
      total: 850,
      owing: 850,
      payerName: 'Ben Carter',
      patientName: 'Ben Carter',
      patientId: 'P2',
      bookingDateISO: '2026-11-30',
      session: 'PM',
      anaesthetistName: 'Dr James Wu',
    })
    expect(row?.number).toBeUndefined()
    expect(row?.raisedISO).toBeUndefined()
    expect(row?.ageDays).toBeUndefined()
    expect(filterInvoiceRows(rows, 'awaitingApproval').map((r) => r.id)).toEqual(['pending:B2:patient'])
    expect(filterInvoiceRows(rows, 'unpaid')).toEqual([])
    expect(filterInvoiceRows(rows, 'all')).toHaveLength(1)
  })

  it('a pending prepayment with no amount yet totals $0', () => {
    const [row] = invoiceRows(mkInput({ pending: [{ ...PENDING, amount: null }] }))
    expect(row).toMatchObject({ total: 0, owing: 0, state: 'awaitingApproval' })
  })

  it('opens on unpaid: unpaid and part paid rows, not paid; all lists paid ones too', () => {
    const unpaid = mkInvoice('INV1')
    const part = mkInvoice('INV2')
    const paid = mkInvoice('INV3')
    const rows = invoiceRows(mkInput({ invoices: [unpaid, part, paid], pairs: [mkPair(unpaid), mkPair(part, {}, 400), mkPair(paid, {}, 1000)] }))
    expect(OPENING_INVOICE_FILTER).toBe('unpaid')
    expect(filterInvoiceRows(rows, OPENING_INVOICE_FILTER).map((r) => r.id).sort()).toEqual(['INV1', 'INV2'])
    expect(filterInvoiceRows(rows, 'partPaid').map((r) => r.id)).toEqual(['INV2'])
    expect(filterInvoiceRows(rows, 'paid').map((r) => r.id)).toEqual(['INV3'])
    expect(filterInvoiceRows(rows, 'all').map((r) => r.id).sort()).toEqual(['INV1', 'INV2', 'INV3'])
  })

  it('a $0 no-charge invoice is paid', () => {
    const inv = mkInvoice('INV1', { total: 0, noCharge: true })
    const [row] = invoiceRows(mkInput({ invoices: [inv], pairs: [mkPair(inv, { payable: undefined })] }))
    expect(row).toMatchObject({ state: 'paid', owing: 0, total: 0 })
    expect(row?.ageDays).toBeUndefined()
  })

  it('counts the summary line, with and without prepayments to approve', () => {
    const a = mkInvoice('INV1', { total: 1000 })
    const b = mkInvoice('INV2', { total: 500.1 })
    const c = mkInvoice('INV3', { total: 300 })
    const pairs = [mkPair(a, {}, 400), mkPair(b), mkPair(c, {}, 300)]
    const withPending = invoiceRows(mkInput({ invoices: [a, b, c], pairs, pending: [PENDING] }))
    const counts = invoiceCounts(withPending)
    expect(counts).toEqual({ unpaid: 2, owing: 1100.1, toApprove: 1, partPaid: 1, paid: 1, all: 4 })
    expect(invoiceCountLine(counts)).toBe('2 unpaid · $1,100.10 owing · 1 to approve')
    const without = invoiceCounts(invoiceRows(mkInput({ invoices: [a, b, c], pairs })))
    expect(invoiceCountLine(without)).toBe('2 unpaid · $1,100.10 owing')
    expect(invoiceCountLine({ unpaid: 340, owing: 281446.2, toApprove: 4, partPaid: 0, paid: 0, all: 344 })).toBe('340 unpaid · $281,446.20 owing · 4 to approve')
  })

  it('sorts newest first, then by id, and is deterministic', () => {
    const older = mkInvoice('INV1', { raisedAtISO: '2026-11-01T09:00:00' })
    const newer = mkInvoice('INV2', { raisedAtISO: '2026-11-21T09:00:00' })
    const sameA = mkInvoice('INV9', { raisedAtISO: '2026-11-10T09:00:00' })
    const sameB = mkInvoice('INV10', { raisedAtISO: '2026-11-10T09:00:00' })
    const input = mkInput({ invoices: [older, sameA, newer, sameB], pending: [PENDING] })
    const rows = invoiceRows(input)
    // The pending row sorts by its Booking's day (2026-11-30), ahead of every raise date here.
    expect(rows.map((r) => r.id)).toEqual(['pending:B2:patient', 'INV2', 'INV10', 'INV9', 'INV1'])
    expect(invoiceRows(input)).toEqual(rows)
  })

  it('filters by kind and anaesthetist', () => {
    const standard = mkInvoice('INV1')
    const additional = mkInvoice('INV2', { kind: 'additional', bookingId: 'B2' })
    const prepaid = mkInvoice('INV3', { kind: 'prePayment' })
    const rows = invoiceRows(mkInput({ invoices: [standard, additional, prepaid], pending: [PENDING] }))
    expect(rows.find((r) => r.id === 'INV2')).toMatchObject({ kind: 'invoice', additional: true })
    expect(filterInvoiceRows(rows, 'all', { kind: 'invoice' }).map((r) => r.id).sort()).toEqual(['INV1', 'INV2'])
    expect(filterInvoiceRows(rows, 'all', { kind: 'prepayment' }).map((r) => r.id).sort()).toEqual(['INV3', 'pending:B2:patient'])
    expect(filterInvoiceRows(rows, 'all', { anaesthetistId: 'A2' }).map((r) => r.id).sort()).toEqual(['INV2', 'pending:B2:patient'])
    expect(filterInvoiceRows(rows, 'unpaid', { kind: 'prepayment', anaesthetistId: 'A1' }).map((r) => r.id)).toEqual(['INV3'])
  })
})
