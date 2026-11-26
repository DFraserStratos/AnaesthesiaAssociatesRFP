/**
 * The AA fees tab's list (build plan Phase 67; US-10.3.1, US-10.3.3): pure, over the store's
 * `allAaFeeInvoices` rows (whose paid state it reads, never restates). `aaFeeRows` filters and
 * orders them for one choice of filter, month and search, before the screen pages them, and
 * gives the toolbar's totals and the months for the month select and Earlier runs. No React,
 * no store.
 */

import type { AaFeeInvoiceRow } from '../../../store/selectors'
import { toCents } from '../../../domain/billing/money'

/** The tab's filters, as the URL's `show` names them (Unpaid is where the tab opens). */
export type AaFeeShow = 'unpaid' | 'paid' | 'all'

export const AA_FEE_SHOWS: readonly AaFeeShow[] = ['unpaid', 'paid', 'all']

export const AA_FEE_SHOW_LABEL: Record<AaFeeShow, string> = { unpaid: 'Unpaid', paid: 'Paid', all: 'All' }

export function parseAaFeeShow(value: string | null): AaFeeShow {
  return value !== null && (AA_FEE_SHOWS as readonly string[]).includes(value) ? (value as AaFeeShow) : 'unpaid'
}

/** A `YYYY-MM` month from the URL, or undefined for All months. */
export function parseAaFeeMonth(value: string | null): string | undefined {
  return value !== null && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : undefined
}

export interface AaFeeQuery {
  show: AaFeeShow
  /** `YYYY-MM`; absent for All months. */
  month?: string
  q?: string
}

/** One month that holds fee invoices: the month select's option and an Earlier runs row. */
export interface AaFeeMonth {
  monthISO: string
  invoices: number
  /** Incl GST. */
  total: number
  unpaid: number
}

export interface AaFeeList {
  /** Ordered, ready to page. */
  rows: AaFeeInvoiceRow[]
  /** The whole book's unpaid count and what they owe AA (total less received), whatever the filters. */
  unpaidCount: number
  owed: number
  /** Every month holding fee invoices, newest first. */
  months: AaFeeMonth[]
}

/** Unpaid: the month owed longest first, then by number. */
function oldestMonthFirst(a: AaFeeInvoiceRow, b: AaFeeInvoiceRow): number {
  return a.monthISO.localeCompare(b.monthISO) || a.invoiceNumber.localeCompare(b.invoiceNumber, 'en', { numeric: true })
}

/** Paid: newest month first, then by number. */
function newestMonthFirst(a: AaFeeInvoiceRow, b: AaFeeInvoiceRow): number {
  return b.monthISO.localeCompare(a.monthISO) || a.invoiceNumber.localeCompare(b.invoiceNumber, 'en', { numeric: true })
}

/** Unpaid first (oldest month first), then paid (newest month first). */
function unpaidThenPaid(a: AaFeeInvoiceRow, b: AaFeeInvoiceRow): number {
  if (a.status !== b.status) return a.status === 'unpaid' ? -1 : 1
  return a.status === 'unpaid' ? oldestMonthFirst(a, b) : newestMonthFirst(a, b)
}

const ORDER: Record<AaFeeShow, (a: AaFeeInvoiceRow, b: AaFeeInvoiceRow) => number> = {
  unpaid: oldestMonthFirst,
  paid: newestMonthFirst,
  all: unpaidThenPaid,
}

/**
 * The rows for one choice, in order (US-10.3.1): Unpaid oldest month first; Paid newest month
 * first; All unpaid first, then paid. Search matches the invoice number and the anaesthetist's
 * name (`nameOf`), case-insensitive; the month filter keeps one month. The totals and months are
 * the whole book's.
 */
export function aaFeeRows(invoices: readonly AaFeeInvoiceRow[], query: AaFeeQuery, nameOf: (anaesthetistId: string) => string): AaFeeList {
  const q = query.q?.trim().toLowerCase() ?? ''
  const rows = invoices
    .filter(
      (row) =>
        (query.show === 'all' || row.status === query.show) &&
        (query.month === undefined || row.monthISO === query.month) &&
        (q === '' || row.invoiceNumber.toLowerCase().includes(q) || nameOf(row.anaesthetistId).toLowerCase().includes(q)),
    )
    .sort(ORDER[query.show])

  let unpaidCount = 0
  let owedCents = 0
  const byMonth = new Map<string, { invoices: number; cents: number; unpaid: number }>()
  for (const row of invoices) {
    const m = byMonth.get(row.monthISO) ?? { invoices: 0, cents: 0, unpaid: 0 }
    m.invoices += 1
    m.cents += toCents(row.total)
    if (row.status === 'unpaid') {
      m.unpaid += 1
      unpaidCount += 1
      owedCents += Math.max(0, toCents(row.total) - toCents(row.amountReceived))
    }
    byMonth.set(row.monthISO, m)
  }
  const months = [...byMonth.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([monthISO, m]) => ({ monthISO, invoices: m.invoices, total: m.cents / 100, unpaid: m.unpaid }))

  return { rows, unpaidCount, owed: owedCents / 100, months }
}
