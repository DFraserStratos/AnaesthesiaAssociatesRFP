/**
 * AA's monthly fee maths (catch-up Phase 16; US-10.3.1, US-10.3.3). The fee is
 * the fixed items plus the per-BCTI charge times the BCTIs counted for the
 * month, all held excluding GST; GST is worked out once, at the foot of the fee
 * invoice (US-05.2.7). Pure (convention 9).
 */

import type { AaFeeInvoice, AaFeeInvoiceLine, AaFeeSettings, XeroAccRec } from '../types'
import { roundToCents, toCents } from './money'
import { GST_RATE } from './invoiceBuild'
import type { BctiRecord } from './bcti'

export interface AaFeeBreakdown {
  lines: AaFeeInvoiceLine[]
  /** Fixed items plus per-BCTI charge times count, excluding GST. */
  subtotal: number
  gst: number
  total: number
}

/**
 * The fee for `bctiCount` BCTIs at `settings`. `bctiLineLabel` names the
 * per-BCTI line (for example "BCTIs paid in July 2026").
 */
export function aaFeeFor(settings: AaFeeSettings, bctiCount: number, bctiLineLabel = 'BCTIs'): AaFeeBreakdown {
  const lines: AaFeeInvoiceLine[] = settings.fixedItems.map((item) => ({ description: item.description, amount: item.amount }))
  const perBcti = roundToCents(settings.perBctiCharge * bctiCount)
  lines.push({ description: `${bctiLineLabel}: ${bctiCount} x $${settings.perBctiCharge.toFixed(2)}`, amount: perBcti })
  const subtotal = roundToCents(aaFeeFixedTotal(settings) + settings.perBctiCharge * bctiCount)
  const gst = roundToCents(subtotal * GST_RATE)
  return { lines, subtotal, gst, total: roundToCents(subtotal + gst) }
}

/** The fixed items' total, excluding GST. */
export function aaFeeFixedTotal(settings: AaFeeSettings): number {
  return roundToCents(settings.fixedItems.reduce((sum, item) => sum + item.amount, 0))
}

function isCentAmount(n: number): boolean {
  return Number.isFinite(n) && n >= 0 && Math.abs(toCents(n) - n * 100) < 1e-6
}

/** Why `settings` cannot be saved, or null. */
export function validateAaFeeSettings(settings: AaFeeSettings): string | null {
  for (const [index, item] of settings.fixedItems.entries()) {
    if (item.description.trim() === '') return `Fixed item ${index + 1} needs a description.`
    if (!isCentAmount(item.amount)) return `"${item.description.trim()}" needs an amount of zero or more, to the cent.`
  }
  if (!isCentAmount(settings.perBctiCharge)) return 'The charge per BCTI needs an amount of zero or more, to the cent.'
  return null
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

/** "July 2026" for `2026-07`. */
export function aaFeeMonthLabel(monthISO: string): string {
  const month = Number(monthISO.slice(5, 7))
  return `${MONTH_NAMES[month - 1] ?? monthISO} ${monthISO.slice(0, 4)}`
}

/** The per-BCTI line's label for a month: "BCTIs paid in July 2026". */
export function aaFeeBctiLineLabel(monthISO: string): string {
  return `BCTIs paid in ${aaFeeMonthLabel(monthISO)}`
}

export interface AaFeeInvoiceDraft {
  /** The fee invoice id, its number and its ACCREC id, already allocated. */
  id: string
  invoiceNumber: string
  accRecId: string
  anaesthetistId: string
  /** The anaesthetist's existing Xero contact. */
  contactId: string
  monthISO: string
  settings: AaFeeSettings
  /** The BCTIs `bctisFor` counted for this anaesthetist and month. */
  counted: readonly BctiRecord[]
  raisedAtISO: string
  raisedBy: AaFeeInvoice['raisedBy']
  /** Seed only: a fee invoice already paid in full on this date. */
  paidAtISO?: string
}

/**
 * Build one AA fee invoice and its `kind:'aaFee'` ACCREC (no ACCPAY): the
 * settings and counted BCTIs snapshotted, the fee from `aaFeeFor`. The one
 * shape for an invoice from AA to an anaesthetist, used by the monthly run
 * (`raiseAnaesthetistInvoiceInto`) and the seeded fee history.
 */
export function buildAaFeeInvoice(draft: AaFeeInvoiceDraft): { invoice: AaFeeInvoice; accRec: XeroAccRec } {
  const fee = aaFeeFor(draft.settings, draft.counted.length, aaFeeBctiLineLabel(draft.monthISO))
  const paid = draft.paidAtISO !== undefined
  const invoice: AaFeeInvoice = {
    id: draft.id,
    invoiceNumber: draft.invoiceNumber,
    reference: draft.id,
    anaesthetistId: draft.anaesthetistId,
    monthISO: draft.monthISO,
    settings: { fixedItems: draft.settings.fixedItems.map((item) => ({ ...item })), perBctiCharge: draft.settings.perBctiCharge },
    lines: fee.lines,
    bctis: draft.counted.map((r) => ({
      accPayId: r.accPayId,
      billNumber: r.billNumber,
      receivableInvoiceNumber: r.receivableInvoiceNumber,
      issuedAtISO: r.issuedAtISO,
      ...(r.receivablePaidAtISO !== undefined ? { receivablePaidAtISO: r.receivablePaidAtISO } : {}),
    })),
    bctiCount: draft.counted.length,
    subtotal: fee.subtotal,
    gst: fee.gst,
    total: fee.total,
    raisedAtISO: draft.raisedAtISO,
    raisedBy: draft.raisedBy,
    accRecId: draft.accRecId,
    amountReceived: paid ? fee.total : 0,
    ...(paid ? { paidAtISO: draft.paidAtISO } : {}),
  }
  const accRec: XeroAccRec = {
    id: draft.accRecId,
    kind: 'aaFee',
    invoiceId: invoice.id,
    contactId: draft.contactId,
    invoiceNumber: invoice.invoiceNumber,
    reference: invoice.reference,
    issuedAtISO: draft.raisedAtISO,
    amountDue: invoice.total,
    amountReceived: invoice.amountReceived,
    ...(paid ? { paidAtISO: draft.paidAtISO } : {}),
    status: paid ? 'paid' : 'awaitingPayment',
  }
  return { invoice, accRec }
}
