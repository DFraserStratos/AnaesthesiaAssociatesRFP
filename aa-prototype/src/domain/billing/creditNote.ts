/**
 * Credit notes, the payable's reversal and the Xero correction (catch-up
 * Phase 39; FT-08.6, US-08.6.2, US-08.6.4, US-08.6.5, DM-24, DM-25). Pure
 * (convention 9): the one place a credit's maths lives, exact to the cent.
 *
 * No constant or flag: OQ-77 parts 1 and 2 are answered and live as plain
 * code. The reversal always reverses the payable (US-08.6.5 "Payable
 * reversed"), and `splitTotalCheck` always applies to a split. A credit is
 * always for the whole invoice (OQ-97, D31): there is no amount input, so no
 * part credit can be stated.
 *
 * Labelled readings (drift check step 3; logged for the owner):
 *  - The equal total is the split's rule (OQ-77 part 1). A credit note, and a
 *    credit in full and rebill, take whatever replacements the correction
 *    needs: `splitTotalCheck` is never applied to them.
 *  - "Equal" is measured ex GST: each component is priced by 38b's
 *    `priceFreeFormInvoice` under the original's GST treatment, and the
 *    components' subtotals must equal the credited subtotal to the cent. GST
 *    is rounded per invoice, so the totals including GST may differ by at most
 *    a cent per component: `gstRounding` shows it, and it is accepted.
 *  - A credit to another party credits the original receivable in full whoever
 *    the party is; in the Xero sim the ACCRECCREDIT is allocated against the
 *    original ACCREC either way.
 */

import type { CreditNoteLine, FreeFormLine, GstTreatment, Invoice, InvoiceLine, ReversalPlan, XeroAccPay, XeroAccRec } from '../types'
import { formatMoney, toCents } from './money'
import { priceFreeFormInvoice } from './additionalInvoice'

/** Every invoice today holds its prices ex GST and adds GST at the foot (US-05.2.7). */
export const DEFAULT_GST_TREATMENT: GstTreatment = 'exclusiveAtFoot'

/** The prefix on each mirrored line. */
export const CREDIT_LINE_PREFIX = 'Credit: '

// ---------------------------------------------------------------------------
// The credit note's lines
// ---------------------------------------------------------------------------

export interface CreditInFull {
  lines: CreditNoteLine[]
  subtotal: number
  gst: number
  total: number
  gstTreatment: GstTreatment
}

/**
 * The credit note for `invoice` (AC "Credit in full"): its lines mirror the
 * original's exactly (each description prefixed "Credit:", the same amount and
 * quantity, in the order given), and its subtotal, GST and total are the
 * original's, under the original's GST treatment. Full even when one line was
 * wrong. Amounts are stored positive; the document says "Credit".
 */
export function creditInFull(
  invoice: Pick<Invoice, 'subtotal' | 'gst' | 'total'>,
  lines: readonly Pick<InvoiceLine, 'description' | 'amount' | 'quantity'>[],
  gstTreatment: GstTreatment = DEFAULT_GST_TREATMENT,
): CreditInFull {
  return {
    lines: lines.map((l) => ({ description: `${CREDIT_LINE_PREFIX}${l.description}`, ...(l.quantity !== undefined ? { quantity: l.quantity } : {}), amount: l.amount })),
    subtotal: invoice.subtotal,
    gst: invoice.gst,
    total: invoice.total,
    gstTreatment,
  }
}

// ---------------------------------------------------------------------------
// The reversal
// ---------------------------------------------------------------------------

/** The original's legs at issue time (36's leg fields). */
export interface ReversalInput {
  /** The invoice total (the receivable's amount). */
  total: number
  /** Received from the payer. */
  received: number
  /** Released to the payable. */
  released: number
  /** Paid out to the anaesthetist. */
  disbursed: number
}

/**
 * What a credit reverses (US-08.6.2, US-08.6.5, OQ-77 part 2, OQ-42): the
 * receivable credited in full; a negative invoice for the whole payable (the
 * gross amount, Phase 16), its undisbursed part offset against the payable and
 * what was already paid out left to net in the anaesthetist's next payment run;
 * the release less what was paid out cancelled, so the payables run skips it;
 * and what the payer paid held for them (a refund happens outside the system).
 * There is no branch that leaves the payable.
 */
export function reversalPlan(input: ReversalInput): ReversalPlan {
  const total = toCents(input.total)
  const received = toCents(input.received)
  const released = toCents(input.released)
  const disbursed = toCents(input.disbursed)
  return {
    receivableCredited: total / 100,
    negativeInvoiceTotal: total / 100,
    offsetAgainstPayable: (total - disbursed) / 100,
    releaseCancelled: (released - disbursed) / 100,
    heldForPayer: received / 100,
    recoveryDue: disbursed / 100,
  }
}

// ---------------------------------------------------------------------------
// The split's equal total (OQ-77 part 1, US-08.6.4 "Same total")
// ---------------------------------------------------------------------------

export type SplitTotalCheck =
  | { ok: true; leftToAllocate: number; gstRounding: number; sum: number }
  | { ok: false; code: 'splitTotalMismatch'; message: string; leftToAllocate: number; gstRounding: number; sum: number }

/** One component's subtotal and total including GST, or zeros when it does not price (an empty card). */
function componentFigures(lines: readonly FreeFormLine[], gstTreatment: GstTreatment): { subtotal: number; total: number } {
  const priced = priceFreeFormInvoice(lines, { gstTreatment })
  return priced.kind === 'priced' ? { subtotal: priced.subtotal, total: priced.total } : { subtotal: 0, total: 0 }
}

/**
 * For a split: the components' ex-GST subtotals (each priced as its own
 * invoice) must equal the credited invoice's ex-GST subtotal, to the cent.
 * `leftToAllocate` is what is still to place (negative when over);
 * `gstRounding` is the components' totals including GST less the credited
 * total, from GST rounded per invoice (at most a cent per component; accepted).
 * An empty component counts as nothing.
 */
export function splitTotalCheck(
  credited: Pick<Invoice, 'subtotal' | 'total'>,
  components: readonly (readonly FreeFormLine[])[],
  gstTreatment: GstTreatment = DEFAULT_GST_TREATMENT,
): SplitTotalCheck {
  let subCents = 0
  let totalCents = 0
  for (const lines of components) {
    const f = componentFigures(lines, gstTreatment)
    subCents += toCents(f.subtotal)
    totalCents += toCents(f.total)
  }
  const leftCents = toCents(credited.subtotal) - subCents
  const leftToAllocate = leftCents / 100
  const sum = subCents / 100
  const gstRounding = leftCents === 0 ? (totalCents - toCents(credited.total)) / 100 : 0
  if (leftCents === 0) return { ok: true, leftToAllocate, gstRounding, sum }
  return {
    ok: false,
    code: 'splitTotalMismatch',
    message: `The new invoices must add up to the credited ${formatMoney(credited.subtotal)} before GST. They come to ${formatMoney(sum)}.`,
    leftToAllocate,
    gstRounding,
    sum,
  }
}

// ---------------------------------------------------------------------------
// The Xero correction (US-08.6.2 "Both sides move")
// ---------------------------------------------------------------------------

export type AccPayCorrection =
  | { action: 'none' }
  /** A draft ACCPAY with nothing authorised: voided. */
  | { action: 'void' }
  /** An authorised or paid ACCPAY: an ACCPAYCREDIT for the total, allocated against what is still unpaid. */
  | { action: 'credit'; creditNoteNumber: string; total: number; allocated: number; unallocated: number }

export interface XeroCorrectionPlan {
  /** The ACCRECCREDIT; absent when the original never reached Xero (nothing to reverse). */
  accRec?: { creditNoteNumber: string; total: number; allocated: number; unallocated: number }
  accPay: AccPayCorrection
}

/**
 * How Xero mirrors a credit (US-08.6.2): an ACCRECCREDIT for the total,
 * allocated against what the ACCREC still has open (the rest unallocated,
 * matching `heldForPayer`), the ACCREC then `credited`; a draft ACCPAY with
 * nothing authorised `voided`; an authorised or paid ACCPAY an ACCPAYCREDIT
 * numbered `${creditNoteNumber}-P` for the total, allocated against what is
 * still unpaid (the rest unallocated, matching `recoveryDue`), the ACCPAY then
 * `credited`. Numbers and amounts only: no NHI, patient name or other personal
 * information (OQ-30).
 */
export function xeroCorrectionPlan(
  accRec: Pick<XeroAccRec, 'amountDue' | 'amountReceived'> | undefined,
  accPay: Pick<XeroAccPay, 'status' | 'amountPayable' | 'amountAuthorised' | 'amountDisbursed' | 'amountCreditAllocated'> | undefined,
  credit: { creditNoteNumber: string; total: number },
): XeroCorrectionPlan {
  const total = toCents(credit.total)
  let rec: XeroCorrectionPlan['accRec']
  if (accRec !== undefined) {
    const open = Math.max(0, toCents(accRec.amountDue) - toCents(accRec.amountReceived))
    const allocated = Math.min(total, open)
    rec = { creditNoteNumber: credit.creditNoteNumber, total: total / 100, allocated: allocated / 100, unallocated: (total - allocated) / 100 }
  }
  let pay: AccPayCorrection = { action: 'none' }
  if (accPay !== undefined) {
    if (accPay.status === 'draft' && toCents(accPay.amountAuthorised) === 0) pay = { action: 'void' }
    else {
      const payTotal = toCents(accPay.amountPayable)
      // Settled already by cash or by a payment run's netting (catch-up Phase 39a): only the rest is still unpaid.
      const unpaid = Math.max(0, payTotal - toCents(accPay.amountDisbursed) - toCents(accPay.amountCreditAllocated ?? 0))
      const allocated = Math.min(payTotal, unpaid)
      pay = { action: 'credit', creditNoteNumber: `${credit.creditNoteNumber}-P`, total: payTotal / 100, allocated: allocated / 100, unallocated: (payTotal - allocated) / 100 }
    }
  }
  return { ...(rec !== undefined ? { accRec: rec } : {}), accPay: pay }
}

// ---------------------------------------------------------------------------
// The rebill from a copy of the original's lines (US-08.6.6, the office's)
// ---------------------------------------------------------------------------

/**
 * A replacement card's starting value: the original's lines as 38b free-form
 * lines and the original's party ("same as", so its invoice email and
 * delivery come with it). Nothing else is copied (no holder references exist,
 * D82). The store's `rebillReplacementFor` adds the card's date.
 */
export interface RebillDraft {
  lines: FreeFormLine[]
  party: { sameAs: true }
}

/**
 * A draft rebill holding a copy of the original's lines (US-08.6.6). Each
 * positive line copies as quantity 1 at `unitAmount` = its stored ex-GST
 * amount, its description unchanged (any units stay in the description), so
 * no per-unit division can lose a cent. A zero line is dropped. A negative
 * line is folded into the positive line it follows ("{desc}, less {its
 * desc}"), so every copied line is positive and 38b's `priceFreeFormInvoice`
 * takes it; a fold that leaves the line at zero or below drops the line with
 * its deduction. When nothing positive remains, or the copied lines no longer
 * add up to the original's subtotal (a deduction larger than the line it
 * follows, or one with no line before it), the draft is one line
 * "Rebill of {original number}" at the original's subtotal, so the draft
 * always prices to the original's total exactly. Pure and deterministic.
 */
export function rebillDraftFrom(
  invoice: Pick<Invoice, 'invoiceNumber' | 'subtotal'>,
  lines: readonly Pick<InvoiceLine, 'description' | 'amount'>[],
): RebillDraft {
  const kept: { description: string; cents: number }[] = []
  for (const line of lines) {
    const cents = toCents(line.amount)
    const description = line.description.trim()
    if (cents === 0) continue
    if (cents > 0) {
      kept.push({ description, cents })
      continue
    }
    const last = kept.at(-1)
    if (last === undefined) continue
    const folded = last.cents + cents
    if (folded <= 0) kept.pop()
    else kept[kept.length - 1] = { description: `${last.description}, less ${description}`, cents: folded }
  }
  const subtotalCents = toCents(invoice.subtotal)
  const sum = kept.reduce((n, l) => n + l.cents, 0)
  if (kept.length === 0 || sum !== subtotalCents || kept.some((l) => l.description === '')) {
    return { lines: subtotalCents > 0 ? [{ description: `Rebill of ${invoice.invoiceNumber}`, quantity: 1, unitAmount: subtotalCents / 100 }] : [], party: { sameAs: true } }
  }
  return { lines: kept.map((l) => ({ description: l.description, quantity: 1, unitAmount: l.cents / 100 })), party: { sameAs: true } }
}
