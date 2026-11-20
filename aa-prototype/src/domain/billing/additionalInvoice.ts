/**
 * Free-form pricing for an additional invoice (catch-up Phase 38b; D10,
 * OQ-45: "Desc, Qnt, $"; OQ-72: "Desc" is a description, so no discount
 * line). Each line is quantity x unit amount, rounded to the cent; prices are
 * held ex GST and GST goes at the foot (US-05.2.7), as on every invoice.
 *
 * Free form means free form: this module imports no fee, Contract, line,
 * resolver, precedence, unit, modifier or RVG module (pinned by a test).
 */

import type { FreeFormLine } from '../types'
import { roundToCents, toCents } from './money'
import { gstOn } from './invoicePresentation'

export interface PricedFreeFormLine extends FreeFormLine {
  amount: number
}

export type FreeFormPricing =
  | { kind: 'priced'; lines: PricedFreeFormLine[]; subtotal: number; gst: number; total: number }
  | { kind: 'refused'; code: string; message: string; lineIndex?: number; field?: 'description' | 'quantity' | 'unitAmount' }

/**
 * Price free-form lines. `gstTreatment` is the original invoice's (every
 * invoice today is `exclusiveAtFoot`: GST at 15% on the subtotal).
 */
export function priceFreeFormInvoice(
  lines: readonly FreeFormLine[],
  opts: { gstTreatment?: 'exclusiveAtFoot' } = {},
): FreeFormPricing {
  void opts
  if (lines.length === 0) return { kind: 'refused', code: 'noLines', message: 'Add at least one line.' }
  const priced: PricedFreeFormLine[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (line.description.trim() === '') {
      return { kind: 'refused', code: 'descriptionMissing', message: 'Each line needs a description.', lineIndex: i, field: 'description' }
    }
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
      return { kind: 'refused', code: 'quantityInvalid', message: 'Each quantity must be more than zero.', lineIndex: i, field: 'quantity' }
    }
    if (!Number.isFinite(line.unitAmount) || line.unitAmount <= 0) {
      return { kind: 'refused', code: 'amountInvalid', message: 'Each amount must be more than zero.', lineIndex: i, field: 'unitAmount' }
    }
    const amount = lineAmount(line.quantity, line.unitAmount)
    if (toCents(amount) <= 0) {
      return { kind: 'refused', code: 'lineZero', message: 'Each line must come to at least one cent.', lineIndex: i, field: 'quantity' }
    }
    priced.push({ description: line.description.trim(), quantity: line.quantity, unitAmount: line.unitAmount, amount })
  }
  const subtotal = toCents(priced.reduce((sum, l) => sum + toCents(l.amount), 0) / 100) / 100
  if (toCents(subtotal) <= 0) return { kind: 'refused', code: 'zeroTotal', message: 'The invoice total must be more than zero.' }
  const gst = gstOn(subtotal)
  return { kind: 'priced', lines: priced, subtotal, gst, total: roundToCents(subtotal + gst) }
}

/**
 * A line's amount: quantity x unit amount, to the cent, half up. Worked in cents
 * with the float noise trimmed first, so 0.25 x $8.54 ($2.135) is $2.14, not $2.13.
 */
export function lineAmount(quantity: number, unitAmount: number): number {
  return Math.round(Number((quantity * unitAmount * 100).toFixed(6))) / 100
}

/** The total ex GST of an event's lines, or 0 when they do not price (for lists and totals). */
export function freeFormSubtotal(lines: readonly FreeFormLine[]): number {
  const priced = priceFreeFormInvoice(lines)
  return priced.kind === 'priced' ? priced.subtotal : 0
}
