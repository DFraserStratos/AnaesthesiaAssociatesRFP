/**
 * The Invoices tab's list (build plan Phase 62; US-08.4.7, US-06.3.1): pure, over 59's invoice
 * model (`domain/billing/invoiceState.ts`), which alone says each row's kind, state, owing, age and
 * search keys. `allInvoiceRows` derives every row once per state; `invoiceList` filters and orders
 * them for one choice of filter, kind, anaesthetist and search, before the screen pages them. No
 * React, no store hook.
 */

import type { AppState } from '../../../store/appStore'
import { pairByInvoice } from '../../../store/indexes'
import { invoiceAddresseeName, isBackdropCreditNote, isBackdropInvoice } from '../../../store/selectors'
import { pendingPrepayments } from '../../../store/prepaymentSelectors'
import { toCents } from '../../../domain/billing/money'
import { sessionText } from '../../../domain/outOfHours'
import { shortDay } from '../../../domain/dateText'
import {
  filterInvoiceRows,
  invoiceCounts,
  invoiceRows,
  type InvoiceCounts,
  type InvoiceFilter,
  type InvoiceRow,
  type InvoiceRowKind,
} from '../../../domain/billing/invoiceState'

/** The tab's filters, as the URL's `show` names them (Unpaid is where the tab opens). */
export type InvoiceShow = 'unpaid' | 'partPaid' | 'paid' | 'approval' | 'all'

export const INVOICE_SHOWS: readonly InvoiceShow[] = ['unpaid', 'partPaid', 'paid', 'approval', 'all']

export const INVOICE_SHOW_LABEL: Record<InvoiceShow, string> = {
  unpaid: 'Unpaid',
  partPaid: 'Part paid',
  paid: 'Paid',
  approval: 'Awaiting approval',
  all: 'All',
}

export const INVOICE_KINDS: readonly InvoiceRowKind[] = ['invoice', 'prepayment', 'creditNote']

export const INVOICE_KIND_LABEL: Record<InvoiceRowKind, string> = {
  invoice: 'Invoice',
  prepayment: 'Prepayment',
  creditNote: 'Credit note',
}

/**
 * The filter from the URL: `show` when it names one, else `view=approval` (the link shape 58's
 * redirects and in-app links keep) opens Awaiting approval, else Unpaid.
 */
export function parseInvoiceShow(show: string | null, view: string | null): InvoiceShow {
  if (show !== null && (INVOICE_SHOWS as readonly string[]).includes(show)) return show as InvoiceShow
  if (view === 'approval') return 'approval'
  return 'unpaid'
}

export function parseInvoiceKind(kind: string | null): InvoiceRowKind | undefined {
  return kind !== null && (INVOICE_KINDS as readonly string[]).includes(kind) ? (kind as InvoiceRowKind) : undefined
}

const SHOW_FILTER: Record<InvoiceShow, InvoiceFilter> = {
  unpaid: 'unpaid',
  partPaid: 'partPaid',
  paid: 'paid',
  approval: 'awaitingApproval',
  all: 'all',
}

/** A pending prepayment's row id in 59's model, from the store's `PendingPrepaymentRow`. */
export function pendingRowId(bookingId: string, payerKey: string): string {
  return `pending:${bookingId}:${payerKey}`
}

/** What the list reads from the app state. */
export type InvoiceListState = Pick<AppState, 'billing' | 'schedule' | 'masters'>

/**
 * Every row of the tab, derived once per state: every invoice, prepayment invoice and credit note
 * AA raises on a payer (the seeded backdrop left out, as the Billing tab does; AA fee invoices are
 * their own records and never come in), and every prepayment awaiting approval.
 */
export function allInvoiceRows(state: InvoiceListState, todayISO: string): InvoiceRow[] {
  return invoiceRows({
    invoices: Object.values(state.billing.invoices).filter((i) => !isBackdropInvoice(i)),
    creditNotes: Object.values(state.billing.creditNotes).filter((c) => !isBackdropCreditNote(c)),
    pairByInvoice: pairByInvoice(state.billing.ledger),
    bookings: state.schedule.bookings,
    lists: state.schedule.lists,
    patients: state.masters.patients,
    anaesthetists: state.masters.anaesthetists,
    payerName: (doc) => invoiceAddresseeName(state, doc),
    pendingPrepayments: pendingPrepayments(state),
    todayISO,
  })
}

/** One invoice's row (its state, owing and age), for its own page: 59's model over that invoice and its credit notes alone. */
export function invoiceRowFor(state: InvoiceListState, invoiceId: string, todayISO: string): InvoiceRow | undefined {
  const invoice = state.billing.invoices[invoiceId]
  if (invoice === undefined) return undefined
  return invoiceRows({
    invoices: [invoice],
    creditNotes: Object.values(state.billing.creditNotes).filter((c) => c.originalInvoiceId === invoiceId),
    pairByInvoice: pairByInvoice(state.billing.ledger),
    bookings: state.schedule.bookings,
    lists: state.schedule.lists,
    patients: state.masters.patients,
    anaesthetists: state.masters.anaesthetists,
    payerName: (doc) => invoiceAddresseeName(state, doc),
    pendingPrepayments: [],
    todayISO,
  }).find((r) => r.id === invoiceId)
}

export interface InvoiceListQuery {
  show: InvoiceShow
  kind?: InvoiceRowKind
  anaesthetistId?: string
  q?: string
}

/** One age band of the rail's "Unpaid by age". */
export interface InvoiceAgeBand {
  key: 'under30' | 'from30to60' | 'over60'
  label: string
  count: number
  owing: number
}

/** The figures the toolbar and the rail show: the whole book, whatever the filters. */
export interface InvoiceListSummary {
  counts: InvoiceCounts
  ageBands: InvoiceAgeBand[]
}

const isOwing = (row: InvoiceRow) => row.kind !== 'creditNote' && (row.state === 'unpaid' || row.state === 'partPaid')

/** Raised order, oldest first (the id breaks a tie, numbers in order). */
function oldestFirst(a: InvoiceRow, b: InvoiceRow): number {
  return (a.raisedISO ?? '').localeCompare(b.raisedISO ?? '') || a.id.localeCompare(b.id, 'en', { numeric: true })
}

/** Still owing first, oldest first; then the paid, newest first. */
function owingThenNewestPaid(a: InvoiceRow, b: InvoiceRow): number {
  const ao = isOwing(a)
  const bo = isOwing(b)
  if (ao !== bo) return ao ? -1 : 1
  return ao ? oldestFirst(a, b) : -oldestFirst(a, b)
}

/** Prepayments awaiting approval: the soonest Booking first. */
function soonestBooking(a: InvoiceRow, b: InvoiceRow): number {
  return (a.bookingDateISO ?? '').localeCompare(b.bookingDateISO ?? '') || a.id.localeCompare(b.id, 'en', { numeric: true })
}

/**
 * The rows for one choice, in order, ready to page (US-08.4.7):
 * - Unpaid (unpaid and part paid) and Part paid: oldest first. Paid and All: still owing first,
 *   oldest first, then paid newest first. Awaiting approval: the prepayments waiting, soonest
 *   Booking first, under the anaesthetist filter and the search (kind does not apply).
 * - With no kind chosen, a credit note rides directly above the invoice it credits, under every
 *   state filter, and is a row of its own (the pager counts it). A search that finds a credit note
 *   brings its invoice. A credit note whose invoice the list leaves out (the seeded history) lists
 *   in All only, at the top.
 * - With a kind chosen, only that kind lists, in the same order; credit notes follow their
 *   invoice's state.
 * Prepayments awaiting approval are not invoices yet: they list under Awaiting approval only.
 */
export function invoiceList(rows: readonly InvoiceRow[], query: InvoiceListQuery): InvoiceRow[] {
  const { show, kind, anaesthetistId } = query
  const q = query.q?.trim() ?? ''
  const opts = { ...(anaesthetistId !== undefined ? { anaesthetistId } : {}), ...(q !== '' ? { q } : {}) }

  if (show === 'approval') return filterInvoiceRows(rows, 'awaitingApproval', opts).sort(soonestBooking)

  const order = show === 'paid' || show === 'all' ? owingThenNewestPaid : oldestFirst
  const filter = SHOW_FILTER[show]
  const notPending = (r: InvoiceRow) => r.state !== 'awaitingApproval'

  if (kind !== undefined) {
    // A credit note reads its invoice's state (59), so a filter by state finds it with its invoice.
    const matches = filterInvoiceRows(rows, filter === 'unpaid' ? 'all' : filter, { ...opts, kind }).filter(notPending)
    const byState = filter === 'unpaid' ? matches.filter((r) => isOwing(r) || (r.kind === 'creditNote' && (r.state === 'unpaid' || r.state === 'partPaid'))) : matches
    // A credit note whose invoice the list leaves out lists in All only, as with no kind chosen.
    const invoiceIds = kind === 'creditNote' && show !== 'all' ? new Set(rows.filter((r) => r.kind !== 'creditNote').map((r) => r.id)) : undefined
    const kept = invoiceIds === undefined ? byState : byState.filter((r) => r.kind !== 'creditNote' || invoiceIds.has(r.originalInvoiceId ?? ''))
    return kept.sort(order)
  }

  const invoices = new Map<string, InvoiceRow>()
  const creditsByInvoice = new Map<string, InvoiceRow[]>()
  for (const r of rows) {
    if (r.kind === 'creditNote') {
      const id = r.originalInvoiceId ?? ''
      const list = creditsByInvoice.get(id)
      if (list === undefined) creditsByInvoice.set(id, [r])
      else list.push(r)
    } else if (notPending(r)) invoices.set(r.id, r)
  }
  for (const list of creditsByInvoice.values()) list.sort((a, b) => -oldestFirst(a, b))

  // An invoice lists when it meets the filter and the search, or when one of its credit notes meets the search.
  const byState = filterInvoiceRows([...invoices.values()], filter, { ...(anaesthetistId !== undefined ? { anaesthetistId } : {}) })
  const hit = (r: InvoiceRow) => q === '' || r.keys.includes(q.toLowerCase())
  const shown = byState.filter((r) => hit(r) || (creditsByInvoice.get(r.id) ?? []).some(hit)).sort(order)

  const out: InvoiceRow[] = []
  if (show === 'all') {
    // Credit notes of invoices the list leaves out, at the top, under the same filters.
    for (const [id, credits] of creditsByInvoice) {
      if (invoices.has(id)) continue
      for (const cn of credits) if ((anaesthetistId === undefined || cn.anaesthetistId === anaesthetistId) && hit(cn)) out.push(cn)
    }
  }
  for (const invoice of shown) {
    for (const cn of creditsByInvoice.get(invoice.id) ?? []) out.push(cn)
    out.push(invoice)
  }
  return out
}

/** The toolbar's and the rail's figures over every row (US-08.4.7, US-06.3.1): counts, then unpaid by age. */
export function invoiceListSummary(rows: readonly InvoiceRow[]): InvoiceListSummary {
  const bands: InvoiceAgeBand[] = [
    { key: 'under30', label: 'Under 30 days', count: 0, owing: 0 },
    { key: 'from30to60', label: '30 to 60 days', count: 0, owing: 0 },
    { key: 'over60', label: 'Over 60 days', count: 0, owing: 0 },
  ]
  const cents = [0, 0, 0]
  for (const row of rows) {
    if (!isOwing(row)) continue
    const age = row.ageDays ?? 0
    const i = age < 30 ? 0 : age <= 60 ? 1 : 2
    bands[i]!.count += 1
    cents[i]! += toCents(row.owing)
  }
  bands.forEach((b, i) => (b.owing = cents[i]! / 100))
  return { counts: invoiceCounts(rows), ageBands: bands }
}

/** From this many days an unpaid invoice's state reads as a warning (the rail's first band ends here). */
export const UNPAID_WARNING_DAYS = 30

/**
 * A row's State as the column shows it: "Unpaid · 40 days" (just "Unpaid" on the day it was
 * raised), a warning from 30 days; "Part paid" neutral; "Paid" success. A credit note and a
 * prepayment awaiting approval have none.
 */
export function invoiceStateLabel(row: InvoiceRow): { text: string; tone: 'neutral' | 'warning' | 'success' } | null {
  if (row.kind === 'creditNote' || row.state === 'awaitingApproval') return null
  if (row.state === 'paid') return { text: 'Paid', tone: 'success' }
  if (row.state === 'partPaid') return { text: 'Part paid', tone: 'neutral' }
  const days = row.ageDays ?? 0
  return {
    text: days >= 1 ? `Unpaid · ${days} ${days === 1 ? 'day' : 'days'}` : 'Unpaid',
    tone: days >= UNPAID_WARNING_DAYS ? 'warning' : 'neutral',
  }
}

/** The Patient · Booking column's second line: the List's day and session ("Tue 18 Aug · AM"). */
export function bookingDayLine(row: Pick<InvoiceRow, 'bookingDateISO' | 'session'>): string {
  if (row.bookingDateISO === undefined) return '·'
  return row.session !== undefined ? `${shortDay(row.bookingDateISO)} · ${sessionText(row.session)}` : shortDay(row.bookingDateISO)
}
