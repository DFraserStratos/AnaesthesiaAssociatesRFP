/**
 * The anaesthetist's monthly GST report (catch-up Phase 38; US-12.2.2, DM-29,
 * RV-33, FT-12.2): the payments AA passed to the anaesthetist in one calendar
 * month, each with its GST component, on a cash basis. It reads the ledger's
 * disbursement entries only (never receipts, never Xero): a receipt alone adds
 * no row, and an invoice paid out in parts falls into each month it is paid in.
 * There is no GST period (US-12.1.2 Retired): the window is a calendar month.
 *
 * One row per payment. Each row's GST is its share of the invoice's OWN stored
 * GST (prices are held ex GST and GST is worked out once at the invoice foot,
 * US-05.2.7), by cumulative amount paid, so the parts of an invoice paid across
 * months sum to its GST to the cent and the payment that completes it takes the
 * remainder. Never a flat 3/23. If the BCTI grain flips (OQ-29, OQ-47), the
 * row grain here is the one place to change.
 *
 * A payment counts when the payable it pays belongs to the anaesthetist, not by
 * a list of pair kinds: a procedure pair's own payable, or a prepayment's
 * transfer leg (27a). Pairs later phases add (additional, rebill and event
 * invoices) count with no change here; an AA fee pair has no payable, so the
 * fee never appears and never nets against a payment (FT-10.3).
 */
import { addMonths, format, parseISO } from 'date-fns'
import type {
  AnaesthetistId,
  Invoice,
  LedgerDisbursement,
  LedgerPair,
  LedgerTransfer,
  PayableLeg,
} from '../types'
import { isBookingPair, payeeAnaesthetistOf } from './ledger'
import { toCents } from './money'
import { aaFeeMonthLabel } from './aaFee'

export interface GstReportInput {
  pairs: Readonly<Record<string, LedgerPair>>
  transfers: Readonly<Record<string, LedgerTransfer>>
  invoices: Readonly<Record<string, Invoice>>
  disbursements: Readonly<Record<string, LedgerDisbursement>> | readonly LedgerDisbursement[]
  anaesthetistId: AnaesthetistId
  /** The calendar month, `2026-07`. */
  monthISO: string
}

export interface GstReportRow {
  disbursementId: string
  /** The ledger pair the invoice belongs to (a prepayment's own pair when its transfer paid it). */
  pairId: string
  invoiceId: string
  invoiceNumber: string
  /** The payable paid: the pair's `-P` number, or the transfer's leg number for a prepayment. */
  payableNumber: string
  paidOnISO: string
  /** The payment, GST inclusive. */
  paidToYou: number
  /** Its share of the invoice's own GST. */
  gst: number
  paidExGst: number
}

export interface GstReportTotals {
  paidToYou: number
  gst: number
  paidExGst: number
}

export interface GstReport {
  monthISO: string
  rows: GstReportRow[]
  totals: GstReportTotals
}

/** The payable a disbursement pays, with its invoice, when that payable is this anaesthetist's. */
interface PaidPayable {
  pairId: string
  leg: PayableLeg
  invoice: Invoice
}

function paidPayableOf(input: Pick<GstReportInput, 'pairs' | 'transfers' | 'invoices'>, sourceId: string, anaesthetistId: AnaesthetistId): PaidPayable | undefined {
  const pair = input.pairs[sourceId]
  if (pair !== undefined) {
    if (!isBookingPair(pair) || pair.payable === undefined || payeeAnaesthetistOf(pair.payable) !== anaesthetistId) return undefined
    const invoice = input.invoices[pair.invoiceId]
    return invoice === undefined ? undefined : { pairId: pair.id, leg: pair.payable, invoice }
  }
  const transfer = input.transfers[sourceId]
  if (transfer === undefined || payeeAnaesthetistOf(transfer.in) !== anaesthetistId) return undefined
  const invoice = input.invoices[transfer.invoiceId]
  return invoice === undefined ? undefined : { pairId: transfer.collectPairId, leg: transfer.in, invoice }
}

function listOf(disbursements: GstReportInput['disbursements']): readonly LedgerDisbursement[] {
  return Array.isArray(disbursements) ? disbursements : Object.values(disbursements)
}

function byDateThenId(a: LedgerDisbursement, b: LedgerDisbursement): number {
  return a.atISO.localeCompare(b.atISO) || a.id.localeCompare(b.id)
}

/** The month of an ISO date or date-time, `2026-07`. */
function monthOf(iso: string): string {
  return iso.slice(0, 7)
}

/** One calendar month's payments to the anaesthetist, with the GST component of each. */
export function gstReportFrom(input: GstReportInput): GstReport {
  // Every payment of each payable, in order, so a later part's GST is the remainder of the earlier ones.
  const bySource = new Map<string, LedgerDisbursement[]>()
  for (const d of listOf(input.disbursements)) {
    if (d.anaesthetistId !== input.anaesthetistId) continue
    const list = bySource.get(d.pairId) ?? []
    list.push(d)
    bySource.set(d.pairId, list)
  }

  const rows: GstReportRow[] = []
  for (const [sourceId, payments] of bySource) {
    const paid = paidPayableOf(input, sourceId, input.anaesthetistId)
    if (paid === undefined) continue
    const amountCents = toCents(paid.leg.amount)
    if (amountCents <= 0) continue
    const gstCents = toCents(paid.invoice.gst)
    let cumulativeCents = 0
    let gstSoFarCents = 0
    for (const d of [...payments].sort(byDateThenId)) {
      const paidCents = toCents(d.amount)
      if (paidCents <= 0) continue
      cumulativeCents += paidCents
      const gstToHere = Math.round((gstCents * Math.min(cumulativeCents, amountCents)) / amountCents)
      const rowGstCents = gstToHere - gstSoFarCents
      gstSoFarCents = gstToHere
      if (monthOf(d.atISO) !== input.monthISO) continue
      rows.push({
        disbursementId: d.id,
        pairId: paid.pairId,
        invoiceId: paid.invoice.id,
        invoiceNumber: paid.invoice.invoiceNumber,
        payableNumber: paid.leg.number,
        paidOnISO: d.atISO,
        paidToYou: paidCents / 100,
        gst: rowGstCents / 100,
        paidExGst: (paidCents - rowGstCents) / 100,
      })
    }
  }
  rows.sort((a, b) => a.paidOnISO.slice(0, 10).localeCompare(b.paidOnISO.slice(0, 10)) || a.invoiceNumber.localeCompare(b.invoiceNumber) || a.disbursementId.localeCompare(b.disbursementId))
  return { monthISO: input.monthISO, rows, totals: gstReportTotals(rows) }
}

/** The three totals, summed in cents. */
export function gstReportTotals(rows: readonly Pick<GstReportRow, 'paidToYou' | 'gst' | 'paidExGst'>[]): GstReportTotals {
  let paid = 0
  let gst = 0
  let ex = 0
  for (const r of rows) {
    paid += toCents(r.paidToYou)
    gst += toCents(r.gst)
    ex += toCents(r.paidExGst)
  }
  return { paidToYou: paid / 100, gst: gst / 100, paidExGst: ex / 100 }
}

/**
 * The months the picker offers, newest first: from the month of the
 * anaesthetist's earliest payment to the demo clock's month, always including
 * the current month even with no rows. `todayISO` comes from the demo clock.
 */
export function gstReportMonths(
  disbursements: GstReportInput['disbursements'],
  anaesthetistId: AnaesthetistId,
  todayISO: string,
): string[] {
  const current = monthOf(todayISO)
  let earliest = current
  for (const d of listOf(disbursements)) {
    if (d.anaesthetistId === anaesthetistId && monthOf(d.atISO) < earliest) earliest = monthOf(d.atISO)
  }
  const months: string[] = []
  for (let m = parseISO(`${current}-01`); format(m, 'yyyy-MM') >= earliest; m = addMonths(m, -1)) {
    months.push(format(m, 'yyyy-MM'))
  }
  return months
}

/** "July 2026": the one month label, shared with the AA fee invoices (16). */
export const gstMonthLabel = aaFeeMonthLabel

/** The download's file name: `gst-report-2026-07.csv`. */
export function gstReportFileName(monthISO: string): string {
  return `gst-report-${monthISO}.csv`
}

/** A report row as the download writes it: the payment plus the party it was billed to. */
export type GstReportCsvRow = GstReportRow & { partyLabel?: string }

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function plainDecimal(amount: number): string {
  return (toCents(amount) / 100).toFixed(2)
}

/**
 * The download's content: the screen's columns, a header row, one row per
 * payment and a totals row, amounts as plain decimals. No dashes in any heading.
 */
export function gstReportCsv(report: { monthISO: string; rows: readonly GstReportCsvRow[]; totals: GstReportTotals }): string {
  const lines = [
    ['Date paid', 'Invoice', 'Billable party', 'Paid to you (incl GST)', 'GST component', 'Paid ex GST'],
    ...report.rows.map((r) => [
      r.paidOnISO.slice(0, 10),
      r.invoiceNumber,
      r.partyLabel ?? '',
      plainDecimal(r.paidToYou),
      plainDecimal(r.gst),
      plainDecimal(r.paidExGst),
    ]),
    [`Month total ${gstMonthLabel(report.monthISO)}`, '', '', plainDecimal(report.totals.paidToYou), plainDecimal(report.totals.gst), plainDecimal(report.totals.paidExGst)],
  ]
  return `${lines.map((cells) => cells.map(csvCell).join(',')).join('\n')}\n`
}
