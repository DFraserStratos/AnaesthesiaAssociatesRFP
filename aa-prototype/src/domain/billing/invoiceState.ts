/**
 * The Finances section's Invoices tab, as a pure read model (US-08.4.7 find
 * any invoice; US-06.3.1 approving prepayments): one row per invoice,
 * prepayment invoice and credit note AA raises on a payer, plus each
 * prepayment awaiting approval, with what is still owed, its paid state and
 * its age. Callers pass the state slices, Maps, a payer-name function and the
 * demo clock's `todayISO`; nothing here reads the store.
 */

import { daysBetween } from '../dateDays'
import type { Booking, CreditNote, Invoice, InvoiceDelivery, LedgerPair, List, Session } from '../types'
import { isAaFeePair, isBookingPair } from './ledger'
import { formatMoney, toCents } from './money'

/** What a row is (US-08.4.7): `invoice` covers standard and additional invoices. */
export type InvoiceRowKind = 'invoice' | 'prepayment' | 'creditNote'

/** Where a row stands (US-08.4.7, US-06.3.1). */
export type InvoiceRowState = 'unpaid' | 'partPaid' | 'paid' | 'awaitingApproval'

/** A prepayment awaiting approval (US-06.3.1): structurally a subset of the store's `PendingPrepaymentRow`. */
export interface PendingPrepaymentInput {
  bookingId: string
  listId: string
  dateISO: string
  anaesthetistId?: string
  patientName: string
  payerKey: string
  payerName: string
  amount: number | null
  ready: boolean
}

/** One row of the Invoices tab (US-08.4.7). */
export interface InvoiceRow {
  /** The invoice id, the credit note id, or `pending:${bookingId}:${payerKey}`. */
  id: string
  /** The invoice or credit note number; absent while awaiting approval. */
  number?: string
  kind: InvoiceRowKind
  /** An additional invoice (kind `invoice`). */
  additional: boolean
  payerName: string
  patientId?: string
  patientName: string
  bookingId: string
  listId?: string
  bookingDateISO?: string
  session?: Session
  anaesthetistId?: string
  anaesthetistName?: string
  /** An invoice's `raisedAtISO` (else its pair's `createdAtISO`); a credit note's `issuedAtISO`. */
  raisedISO?: string
  total: number
  /** Never below 0. */
  owing: number
  state: InvoiceRowState
  /** Unpaid or part paid only: whole days from `raisedISO` to today. */
  ageDays?: number
  /** An invoice with a credit note against it. */
  credited: boolean
  /** A credit note's original invoice. */
  originalInvoiceId?: string
  payableNumber?: string
  caseReference?: string
  delivery?: InvoiceDelivery
  /** Lower-cased search text: numbers, payable number, case reference, patient, payer and anaesthetist, one per line. */
  keys: string
}

/** What `invoiceRows` reads (US-08.4.7). */
export interface InvoiceStateInput {
  /** Without the backdrop invoices (the store's `isBackdropInvoice`); AA fee invoices are a different type and never come in. */
  invoices: readonly Invoice[]
  /** Without the backdrop credit notes. */
  creditNotes: readonly CreditNote[]
  /** The store's `pairByInvoice(billing.ledger)`; may hold AA fee pairs. */
  pairByInvoice: ReadonlyMap<string, LedgerPair>
  bookings: Readonly<Record<string, Pick<Booking, 'listId' | 'patientId'>>>
  lists: Readonly<Record<string, Pick<List, 'dateISO' | 'session' | 'anaesthetistId'>>>
  patients: Readonly<Record<string, { name: string }>>
  anaesthetists: Readonly<Record<string, { name: string }>>
  /** The store's `invoiceAddresseeName`, bound by the caller. */
  payerName: (doc: Invoice | CreditNote) => string
  pendingPrepayments: readonly PendingPrepaymentInput[]
  todayISO: string
}

/** What a Booking places on a row: its List, day, session, anaesthetist and patient. */
interface BookingPlace {
  listId?: string
  bookingDateISO?: string
  session?: Session
  anaesthetistId?: string
  anaesthetistName?: string
  patientId?: string
  patientName: string
}

function placeOf(input: InvoiceStateInput, bookingId: string): BookingPlace {
  const booking = input.bookings[bookingId]
  if (booking === undefined) return { patientName: '' }
  const list = input.lists[booking.listId]
  const anaesthetistId = list?.anaesthetistId
  const anaesthetistName = anaesthetistId !== undefined ? input.anaesthetists[anaesthetistId]?.name : undefined
  return {
    listId: booking.listId,
    ...(list !== undefined ? { bookingDateISO: list.dateISO, session: list.session } : {}),
    ...(anaesthetistId !== undefined ? { anaesthetistId } : {}),
    ...(anaesthetistName !== undefined ? { anaesthetistName } : {}),
    patientId: booking.patientId,
    patientName: input.patients[booking.patientId]?.name ?? '',
  }
}

/** What an invoice still owes and where it stands. */
interface Standing {
  owing: number
  state: InvoiceRowState
}

/**
 * The owing rule restated from `patientPosition` (ledger.ts): amount less
 * received less credited, never below 0, and a credited invoice owes nothing.
 * With no Booking pair the invoice total is owed. A no-charge invoice is paid.
 */
function standingOf(invoice: Invoice, pair: LedgerPair | undefined, credited: boolean): Standing {
  if (credited || invoice.noCharge === true) return { owing: 0, state: 'paid' }
  const r = pair !== undefined && isBookingPair(pair) ? pair.receivable : undefined
  const owingCents = r !== undefined ? toCents(r.amount) - toCents(r.receivedAmount) - toCents(r.creditedAmount ?? 0) : toCents(invoice.total)
  if (owingCents <= 0) return { owing: 0, state: 'paid' }
  const state: InvoiceRowState = r !== undefined && toCents(r.receivedAmount) > 0 ? 'partPaid' : 'unpaid'
  return { owing: owingCents / 100, state }
}

function keysOf(parts: readonly (string | undefined)[]): string {
  return parts.filter((p): p is string => p !== undefined && p !== '').join('\n').toLowerCase()
}

function ageOf(state: InvoiceRowState, raisedISO: string | undefined, todayISO: string): { ageDays?: number } {
  if ((state !== 'unpaid' && state !== 'partPaid') || raisedISO === undefined) return {}
  return { ageDays: daysBetween(raisedISO, todayISO) }
}

/** One row per invoice, prepayment invoice and credit note AA raises on a payer, plus prepayments awaiting approval (US-08.4.7). */
export function invoiceRows(input: InvoiceStateInput): InvoiceRow[] {
  const creditedIds = new Set<string>()
  for (const cn of input.creditNotes) creditedIds.add(cn.originalInvoiceId)

  const rows: InvoiceRow[] = []
  const invoiceById = new Map<string, { invoice: Invoice; standing: Standing }>()

  for (const invoice of input.invoices) {
    const pair = input.pairByInvoice.get(invoice.id)
    if (pair !== undefined && isAaFeePair(pair)) continue
    const bookingPair = pair !== undefined && isBookingPair(pair) ? pair : undefined
    const credited = bookingPair?.credit !== undefined || creditedIds.has(invoice.id)
    const standing = standingOf(invoice, pair, credited)
    invoiceById.set(invoice.id, { invoice, standing })
    const place = placeOf(input, invoice.bookingId)
    const payerName = input.payerName(invoice)
    const raisedISO = invoice.raisedAtISO ?? bookingPair?.createdAtISO
    const payableNumber = bookingPair?.payable?.number
    rows.push({
      id: invoice.id,
      number: invoice.invoiceNumber,
      kind: invoice.kind === 'prePayment' ? 'prepayment' : 'invoice',
      additional: invoice.kind === 'additional',
      payerName,
      ...place,
      bookingId: invoice.bookingId,
      ...(raisedISO !== undefined ? { raisedISO } : {}),
      total: invoice.total,
      owing: standing.owing,
      state: standing.state,
      ...ageOf(standing.state, raisedISO, input.todayISO),
      credited,
      ...(payableNumber !== undefined ? { payableNumber } : {}),
      caseReference: invoice.caseReference,
      ...(invoice.delivery !== undefined ? { delivery: invoice.delivery } : {}),
      keys: keysOf([invoice.invoiceNumber, payableNumber, invoice.caseReference, place.patientName, payerName, place.anaesthetistName]),
    })
  }

  for (const cn of input.creditNotes) {
    const original = invoiceById.get(cn.originalInvoiceId)
    // The original's number: from the invoice, else from its pair (a backdrop original the caller left out).
    const originalPair = original === undefined ? input.pairByInvoice.get(cn.originalInvoiceId) : undefined
    const originalNumber = original?.invoice.invoiceNumber ?? originalPair?.receivable.number
    const place = placeOf(input, cn.bookingId)
    const payerName = input.payerName(cn)
    rows.push({
      id: cn.id,
      number: cn.creditNoteNumber,
      kind: 'creditNote',
      additional: false,
      payerName,
      ...place,
      bookingId: cn.bookingId,
      raisedISO: cn.issuedAtISO,
      total: cn.total,
      owing: 0,
      // It follows its invoice; a missing original reads as paid (a credited invoice owes nothing).
      state: original?.standing.state ?? 'paid',
      credited: false,
      originalInvoiceId: cn.originalInvoiceId,
      delivery: cn.delivery,
      keys: keysOf([cn.creditNoteNumber, originalNumber, place.patientName, payerName, place.anaesthetistName]),
    })
  }

  for (const p of input.pendingPrepayments) {
    const booking = input.bookings[p.bookingId]
    const list = input.lists[p.listId]
    const anaesthetistName = p.anaesthetistId !== undefined ? input.anaesthetists[p.anaesthetistId]?.name : undefined
    const total = p.amount ?? 0
    rows.push({
      id: `pending:${p.bookingId}:${p.payerKey}`,
      kind: 'prepayment',
      additional: false,
      payerName: p.payerName,
      ...(booking !== undefined ? { patientId: booking.patientId } : {}),
      patientName: p.patientName,
      bookingId: p.bookingId,
      listId: p.listId,
      bookingDateISO: p.dateISO,
      ...(list !== undefined ? { session: list.session } : {}),
      ...(p.anaesthetistId !== undefined ? { anaesthetistId: p.anaesthetistId } : {}),
      ...(anaesthetistName !== undefined ? { anaesthetistName } : {}),
      total,
      owing: total,
      state: 'awaitingApproval',
      credited: false,
      keys: keysOf([p.patientName, p.payerName, anaesthetistName]),
    })
  }

  return rows.sort(
    (a, b) =>
      (b.raisedISO ?? b.bookingDateISO ?? '').localeCompare(a.raisedISO ?? a.bookingDateISO ?? '') ||
      b.id.localeCompare(a.id, 'en', { numeric: true }),
  )
}

/** The Invoices tab's state filters (US-08.4.7). */
export type InvoiceFilter = 'unpaid' | 'partPaid' | 'paid' | 'awaitingApproval' | 'all'

/** The tab opens on what is still owed (US-08.4.7). */
export const OPENING_INVOICE_FILTER: InvoiceFilter = 'unpaid'

/**
 * Whether a row sits under a state filter (US-08.4.7). `unpaid` is every row
 * still owing, part paid included; the others match their state exactly, and
 * `all` takes every row, awaiting approval included. A credit note matches
 * `all` and the state filter its state names, never `unpaid` (it owes nothing).
 */
function matchesFilter(row: InvoiceRow, filter: InvoiceFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'unpaid') return row.kind !== 'creditNote' && (row.state === 'unpaid' || row.state === 'partPaid')
  return row.state === filter
}

/** Narrow the rows by state filter, kind, anaesthetist and search (US-08.4.7). */
export function filterInvoiceRows(
  rows: readonly InvoiceRow[],
  filter: InvoiceFilter,
  options: { kind?: InvoiceRowKind; anaesthetistId?: string; q?: string } = {},
): InvoiceRow[] {
  const q = options.q?.trim().toLowerCase() ?? ''
  return rows.filter(
    (row) =>
      matchesFilter(row, filter) &&
      (options.kind === undefined || row.kind === options.kind) &&
      (options.anaesthetistId === undefined || row.anaesthetistId === options.anaesthetistId) &&
      (q === '' || row.keys.includes(q)),
  )
}

/** The summary line's figures (US-08.4.7, US-06.3.1). */
export interface InvoiceCounts {
  unpaid: number
  owing: number
  toApprove: number
  partPaid: number
  paid: number
  all: number
}

/** The summary line's figures (US-08.4.7). */
export function invoiceCounts(rows: readonly InvoiceRow[]): InvoiceCounts {
  let unpaid = 0
  let owingCents = 0
  let toApprove = 0
  let partPaid = 0
  let paid = 0
  for (const row of rows) {
    if (matchesFilter(row, 'unpaid')) {
      unpaid += 1
      owingCents += toCents(row.owing)
    }
    if (row.state === 'awaitingApproval') toApprove += 1
    if (row.state === 'partPaid') partPaid += 1
    if (row.state === 'paid') paid += 1
  }
  return { unpaid, owing: owingCents / 100, toApprove, partPaid, paid, all: rows.length }
}

/** "340 unpaid · $281,446.20 owing · 4 to approve", without the last part when nothing waits (US-08.4.7, US-06.3.1). */
export function invoiceCountLine(counts: InvoiceCounts): string {
  const line = `${counts.unpaid.toLocaleString('en-NZ')} unpaid · ${formatMoney(counts.owing)} owing`
  return counts.toApprove > 0 ? `${line} · ${counts.toApprove.toLocaleString('en-NZ')} to approve` : line
}
