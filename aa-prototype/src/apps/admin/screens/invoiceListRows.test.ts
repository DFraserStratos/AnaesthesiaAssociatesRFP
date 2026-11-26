import { describe, expect, it } from 'vitest'
import type { AaFeeLedgerPair, BookingLedgerPair, CreditNote, Invoice, LedgerPair } from '../../../domain/types'
import { invoiceRows, type InvoiceRow, type InvoiceStateInput, type PendingPrepaymentInput } from '../../../domain/billing/invoiceState'
import { isAaFeePair } from '../../../domain/billing/ledger'
import { sessionText } from '../../../domain/outOfHours'
import { freshAppState } from '../../../store/appStore'
import {
  allInvoiceRows,
  invoiceRowFor,
  bookingDayLine,
  invoiceList,
  invoiceListSummary,
  invoiceStateLabel,
  parseInvoiceKind,
  parseInvoiceShow,
  pendingRowId,
} from './invoiceListRows'

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

function mkPair(invoice: Invoice, received = 0, overrides: Partial<BookingLedgerPair> = {}): BookingLedgerPair {
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
      B4: { listId: 'L3', patientId: 'P2' },
    },
    lists: {
      L1: { dateISO: '2026-11-18', session: 'AM', anaesthetistId: 'A1' },
      L2: { dateISO: '2026-11-30', session: 'PM', anaesthetistId: 'A2' },
      L3: { dateISO: '2026-11-27', session: 'AM', anaesthetistId: 'A1' },
    },
    patients: { P1: { name: 'Aroha Ngata' }, P2: { name: 'Ben Carter' } },
    anaesthetists: { A1: { name: 'Dr Melanie Souter' }, A2: { name: 'Dr James Wu' } },
    payerName: (doc) => (doc.counterparty.kind === 'party' ? 'Southern Cross' : doc.counterparty.id === 'P2' ? 'Ben Carter' : 'Aroha Ngata'),
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

const PENDING_SOONER: PendingPrepaymentInput = {
  bookingId: 'B4',
  listId: 'L3',
  dateISO: '2026-11-27',
  anaesthetistId: 'A1',
  patientName: 'Ben Carter',
  payerKey: 'party:SX',
  payerName: 'Southern Cross',
  amount: 400,
  ready: false,
}

const ids = (rows: readonly InvoiceRow[]) => rows.map((r) => r.id)
const unpaid = parseInvoiceShow(null, null)

/** A small book: unpaid at 40 and 10 days, part paid, two paid, a credited invoice with its note, two pending prepayments. */
function book() {
  const old = mkInvoice('INV1', { raisedAtISO: '2026-10-15T09:00:00' })
  const recent = mkInvoice('INV2', { bookingId: 'B2', counterparty: { kind: 'party', id: 'SX' }, raisedAtISO: '2026-11-14T09:00:00' })
  const part = mkInvoice('INV3', { raisedAtISO: '2026-11-01T09:00:00' })
  const paidOld = mkInvoice('INV4', { bookingId: 'B3', raisedAtISO: '2026-09-01T09:00:00' })
  const paidNew = mkInvoice('INV5', { raisedAtISO: '2026-11-10T09:00:00' })
  const credited = mkInvoice('INV6', { bookingId: 'B2', counterparty: { kind: 'patient', id: 'P2' }, raisedAtISO: '2026-10-01T09:00:00' })
  const prepaid = mkInvoice('INV7', { kind: 'prePayment', raisedAtISO: '2026-11-05T09:00:00' })
  const cn = mkCreditNote('CRN1', credited)
  const invoices = [old, recent, part, paidOld, paidNew, credited, prepaid]
  const pairs: LedgerPair[] = [mkPair(old), mkPair(recent), mkPair(part, 400), mkPair(paidOld, 1000), mkPair(paidNew, 1000), mkPair(credited), mkPair(prepaid)]
  const rows = invoiceRows(mkInput({ invoices, pairs, creditNotes: [cn], pending: [PENDING, PENDING_SOONER] }))
  return { rows }
}

describe('invoiceList: search (US-08.4.7)', () => {
  const { rows } = book()
  const find = (q: string) => ids(invoiceList(rows, { show: 'all', q }))

  it('finds an invoice by its number', () => {
    expect(find('AA-2026-0002')).toEqual(['INV2'])
  })

  it('finds an invoice by its payable number', () => {
    expect(find('AA-2026-0002-P')).toEqual(['INV2'])
    expect(find('  aa-2026-0002-p ')).toEqual(['INV2'])
  })

  it('finds an invoice by its case reference', () => {
    expect(find('CASE-0003')).toEqual(['INV3'])
  })

  it("a patient's name lists both of their invoices", () => {
    const a = mkInvoice('INV1')
    const b = mkInvoice('INV2', { bookingId: 'B3' })
    const c = mkInvoice('INV3', { bookingId: 'B2', counterparty: { kind: 'party', id: 'SX' } })
    const small = invoiceRows(mkInput({ invoices: [a, b, c] }))
    expect(ids(invoiceList(small, { show: 'all', q: 'Aroha' })).sort()).toEqual(['INV1', 'INV2'])
  })

  it('finds an invoice by its payer', () => {
    expect(find('southern cross')).toEqual(['INV2'])
  })

  it('finds invoices by their anaesthetist', () => {
    expect(find('James Wu').sort()).toEqual(['CRN1', 'INV2', 'INV4', 'INV6'])
  })
})

describe('invoiceList: Unpaid and Part paid (US-08.4.7)', () => {
  const { rows } = book()

  it('opens on Unpaid: unpaid and part paid, oldest first, paid left out', () => {
    expect(unpaid).toBe('unpaid')
    expect(ids(invoiceList(rows, { show: unpaid }))).toEqual(['INV1', 'INV3', 'INV7', 'INV2'])
  })

  it('Part paid lists only part paid invoices', () => {
    expect(ids(invoiceList(rows, { show: 'partPaid' }))).toEqual(['INV3'])
  })
})

describe('invoiceStateLabel (US-08.4.7)', () => {
  it('$1,000 with $400 received is part paid, owing $600, neutral', () => {
    const inv = mkInvoice('INV1')
    const [row] = invoiceRows(mkInput({ invoices: [inv], pairs: [mkPair(inv, 400)] }))
    expect(row).toMatchObject({ state: 'partPaid', owing: 600 })
    expect(invoiceStateLabel(row!)).toEqual({ text: 'Part paid', tone: 'neutral' })
  })

  const unpaidRaised = (raisedAtISO: string) => {
    const inv = mkInvoice('INV1', { raisedAtISO })
    return invoiceRows(mkInput({ invoices: [inv], pairs: [mkPair(inv)] }))[0]!
  }

  it('40 days unpaid is a warning', () => {
    expect(invoiceStateLabel(unpaidRaised('2026-10-15T09:00:00'))).toEqual({ text: 'Unpaid · 40 days', tone: 'warning' })
  })

  it('29 days unpaid is neutral; 30 is a warning', () => {
    expect(invoiceStateLabel(unpaidRaised('2026-10-26T09:00:00'))).toEqual({ text: 'Unpaid · 29 days', tone: 'neutral' })
    expect(invoiceStateLabel(unpaidRaised('2026-10-25T09:00:00'))).toEqual({ text: 'Unpaid · 30 days', tone: 'warning' })
  })

  it('raised today reads Unpaid; one day reads 1 day', () => {
    expect(invoiceStateLabel(unpaidRaised('2026-11-24T09:00:00'))).toEqual({ text: 'Unpaid', tone: 'neutral' })
    expect(invoiceStateLabel(unpaidRaised('2026-11-23T09:00:00'))).toEqual({ text: 'Unpaid · 1 day', tone: 'neutral' })
  })

  it('paid is success; a credit note and a pending prepayment have none', () => {
    const { rows } = book()
    expect(invoiceStateLabel(rows.find((r) => r.id === 'INV5')!)).toEqual({ text: 'Paid', tone: 'success' })
    expect(invoiceStateLabel(rows.find((r) => r.id === 'CRN1')!)).toBeNull()
    expect(invoiceStateLabel(rows.find((r) => r.id === pendingRowId('B2', 'patient'))!)).toBeNull()
  })
})

describe('invoiceList: Paid and All (US-08.4.7)', () => {
  const { rows } = book()

  it('Paid: newest first, a credit note directly above the invoice it credits', () => {
    // INV5 (10 Nov), CRN1 over INV6 (1 Oct), INV4 (1 Sep).
    expect(ids(invoiceList(rows, { show: 'paid' }))).toEqual(['INV5', 'CRN1', 'INV6', 'INV4'])
  })

  it('All: owing first oldest first, then paid newest first; paid included; no pending rows', () => {
    const all = invoiceList(rows, { show: 'all' })
    expect(ids(all)).toEqual(['INV1', 'INV3', 'INV7', 'INV2', 'INV5', 'CRN1', 'INV6', 'INV4'])
    // The credit note is a row of its own (the pager counts it).
    expect(all).toHaveLength(8)
    expect(all.some((r) => r.state === 'awaitingApproval')).toBe(false)
  })

  it("a search that hits only the credit note's number brings its invoice", () => {
    expect(ids(invoiceList(rows, { show: 'all', q: 'CN-2026-0001' }))).toEqual(['CRN1', 'INV6'])
    expect(ids(invoiceList(rows, { show: 'paid', q: 'cn-2026-0001' }))).toEqual(['CRN1', 'INV6'])
  })

  it('a credit note whose invoice is not in the rows lists only under All, at the top', () => {
    const missing = mkInvoice('INV9', { raisedAtISO: '2026-08-01T09:00:00' })
    const live = mkInvoice('INV1', { raisedAtISO: '2026-11-20T09:00:00' })
    const paid = mkInvoice('INV2', { raisedAtISO: '2026-11-21T09:00:00' })
    const orphan = mkCreditNote('CRN9', missing, { issuedAtISO: '2026-08-05T09:00:00' })
    const small = invoiceRows(mkInput({ invoices: [live, paid], pairs: [mkPair(live), mkPair(paid, 1000)], creditNotes: [orphan] }))
    expect(ids(invoiceList(small, { show: 'all' }))).toEqual(['CRN9', 'INV1', 'INV2'])
    expect(ids(invoiceList(small, { show: 'paid' }))).toEqual(['INV2'])
    expect(ids(invoiceList(small, { show: 'unpaid' }))).toEqual(['INV1'])
    expect(ids(invoiceList(small, { show: 'all', q: 'cn-2026-0009' }))).toEqual(['CRN9'])
    expect(ids(invoiceList(small, { show: 'all', anaesthetistId: 'A2' }))).toEqual([])
    // With the credit note kind chosen too.
    expect(ids(invoiceList(small, { show: 'all', kind: 'creditNote' }))).toEqual(['CRN9'])
    expect(ids(invoiceList(small, { show: 'paid', kind: 'creditNote' }))).toEqual([])
  })
})

describe('invoiceList: kind and anaesthetist (US-08.4.7)', () => {
  const { rows } = book()

  it('kind prepayment lists only prepayments (never the pending ones)', () => {
    expect(ids(invoiceList(rows, { show: 'all', kind: 'prepayment' }))).toEqual(['INV7'])
    expect(ids(invoiceList(rows, { show: unpaid, kind: 'prepayment' }))).toEqual(['INV7'])
    expect(ids(invoiceList(rows, { show: 'paid', kind: 'prepayment' }))).toEqual([])
  })

  it('kind credit note lists credit notes only', () => {
    expect(ids(invoiceList(rows, { show: 'all', kind: 'creditNote' }))).toEqual(['CRN1'])
    expect(ids(invoiceList(rows, { show: 'paid', kind: 'creditNote' }))).toEqual(['CRN1'])
    expect(ids(invoiceList(rows, { show: unpaid, kind: 'creditNote' }))).toEqual([])
  })

  it('kind invoice leaves prepayments and credit notes out', () => {
    expect(ids(invoiceList(rows, { show: 'all', kind: 'invoice' }))).toEqual(['INV1', 'INV3', 'INV2', 'INV5', 'INV6', 'INV4'])
  })

  it('the anaesthetist filter', () => {
    expect(ids(invoiceList(rows, { show: 'all', anaesthetistId: 'A2' }))).toEqual(['INV2', 'CRN1', 'INV6', 'INV4'])
    expect(ids(invoiceList(rows, { show: unpaid, anaesthetistId: 'A1' }))).toEqual(['INV1', 'INV3', 'INV7'])
  })
})

describe('invoiceList: Awaiting approval (US-06.3.1)', () => {
  const { rows } = book()
  const sooner = pendingRowId('B4', 'party:SX')
  const later = pendingRowId('B2', 'patient')

  it('lists only the pending prepayments, soonest Booking first', () => {
    expect(ids(invoiceList(rows, { show: 'approval' }))).toEqual([sooner, later])
    // Kind does not apply.
    expect(ids(invoiceList(rows, { show: 'approval', kind: 'creditNote' }))).toEqual([sooner, later])
  })

  it('takes the anaesthetist filter and the search', () => {
    expect(ids(invoiceList(rows, { show: 'approval', anaesthetistId: 'A2' }))).toEqual([later])
    expect(ids(invoiceList(rows, { show: 'approval', q: 'southern' }))).toEqual([sooner])
  })

  it('never lists under All or Unpaid', () => {
    for (const show of ['all', 'unpaid', 'partPaid', 'paid'] as const) {
      expect(ids(invoiceList(rows, { show })).filter((id) => id.startsWith('pending:'))).toEqual([])
    }
  })
})

describe('parseInvoiceShow and parseInvoiceKind', () => {
  it('reads the URL', () => {
    expect(parseInvoiceShow('paid', null)).toBe('paid')
    expect(parseInvoiceShow(null, 'approval')).toBe('approval')
    expect(parseInvoiceShow('bogus', null)).toBe('unpaid')
    expect(parseInvoiceShow('paid', 'approval')).toBe('paid')
    expect(parseInvoiceShow(null, null)).toBe('unpaid')
  })

  it('reads the kind, ignoring an unknown one', () => {
    expect(parseInvoiceKind('creditNote')).toBe('creditNote')
    expect(parseInvoiceKind('prepayment')).toBe('prepayment')
    expect(parseInvoiceKind('bogus')).toBeUndefined()
    expect(parseInvoiceKind(null)).toBeUndefined()
  })
})

describe('invoiceListSummary (US-08.4.7, US-06.3.1)', () => {
  it('bands the owing by age, sums in cents and counts what waits for approval', () => {
    const a = mkInvoice('INV1', { total: 0.1, raisedAtISO: '2026-11-20T09:00:00' }) // 4 days
    const b = mkInvoice('INV2', { total: 0.2, raisedAtISO: '2026-10-26T09:00:00' }) // 29 days
    const c = mkInvoice('INV3', { total: 100, raisedAtISO: '2026-10-25T09:00:00' }) // 30 days
    const d = mkInvoice('INV4', { total: 1000, raisedAtISO: '2026-09-25T09:00:00' }) // 60 days, part paid
    const e = mkInvoice('INV5', { total: 50, raisedAtISO: '2026-09-24T09:00:00' }) // 61 days
    const f = mkInvoice('INV6', { total: 70, raisedAtISO: '2026-08-01T09:00:00' }) // paid
    const rows = invoiceRows(
      mkInput({
        invoices: [a, b, c, d, e, f],
        pairs: [mkPair(a), mkPair(b), mkPair(c), mkPair(d, 400), mkPair(e), mkPair(f, 70)],
        pending: [PENDING, PENDING_SOONER],
      }),
    )
    const { counts, ageBands } = invoiceListSummary(rows)
    expect(ageBands).toEqual([
      { key: 'under30', label: 'Under 30 days', count: 2, owing: 0.3 },
      { key: 'from30to60', label: '30 to 60 days', count: 2, owing: 700 },
      { key: 'over60', label: 'Over 60 days', count: 1, owing: 50 },
    ])
    expect(counts).toMatchObject({ unpaid: 5, toApprove: 2, partPaid: 1, paid: 1, all: 8 })
  })
})

describe('bookingDayLine', () => {
  it('reads the day and session', () => {
    expect(bookingDayLine({ bookingDateISO: '2026-08-18', session: 'AM' })).toBe('Tue 18 Aug · AM')
  })

  it('reads out-of-hours as its text', () => {
    expect(bookingDayLine({ bookingDateISO: '2026-08-18', session: 'OOH' })).toBe(`Tue 18 Aug · ${sessionText('OOH')}`)
    expect(sessionText('OOH')).not.toBe('OOH')
  })
})

describe('AA fee invoices never list', () => {
  it('an invoice on an AA fee pair is left out', () => {
    const fee = mkInvoice('INV1')
    const other = mkInvoice('INV2')
    const aaFee: AaFeeLedgerPair = {
      id: 'PAIR-FEE',
      kind: 'aaFee',
      aaFeeInvoiceId: 'INV1',
      anaesthetistId: 'A1',
      createdAtISO: '2026-11-01T00:00:00',
      receivable: { number: 'AAF-2026-0001', counterparty: { kind: 'anaesthetist', id: 'A1' }, amount: 100, receivedAmount: 0 },
    }
    expect(isAaFeePair(aaFee)).toBe(true)
    const rows = invoiceRows(mkInput({ invoices: [fee, other], pairs: [aaFee, mkPair(other)] }))
    expect(ids(invoiceList(rows, { show: 'all' }))).toEqual(['INV2'])
  })

  it("on AA's practice, no row is an AA fee invoice", () => {
    const state = freshAppState()
    const rows = allInvoiceRows(state, TODAY)
    expect(rows.length).toBeGreaterThan(0)
    const rowIds = new Set(rows.map((r) => r.id))
    const rowNumbers = new Set(rows.map((r) => r.number).filter((n) => n !== undefined))
    for (const fee of Object.values(state.billing.aaFeeInvoices)) {
      expect(rowIds.has(fee.id)).toBe(false)
      expect(rowNumbers.has(fee.invoiceNumber)).toBe(false)
    }
    for (const pair of Object.values(state.billing.ledger).filter(isAaFeePair)) {
      expect(rowIds.has(pair.aaFeeInvoiceId)).toBe(false)
    }
    // The lists the tab shows hold no AA fee invoice either, and no pending row outside Awaiting approval.
    const all = invoiceList(rows, { show: 'all' })
    expect(all.every((r) => !r.id.startsWith('pending:'))).toBe(true)
    expect(invoiceList(rows, { show: 'approval' }).every((r) => r.state === 'awaitingApproval')).toBe(true)
  })
})

describe('invoiceRowFor: one invoice, as the list reads it', () => {
  it('the seeded aged invoice reads Unpaid · 40 days, the same row the list holds', () => {
    const state = freshAppState()
    const row = invoiceRowFor(state, 'INV-S24-02', TODAY)
    expect(row).toEqual(allInvoiceRows(state, TODAY).find((r) => r.id === 'INV-S24-02'))
    expect(invoiceStateLabel(row!)).toEqual({ text: 'Unpaid · 40 days', tone: 'warning' })
    expect(invoiceRowFor(state, 'nope', TODAY)).toBeUndefined()
  })
})
