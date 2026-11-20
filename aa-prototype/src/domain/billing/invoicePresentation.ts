/**
 * How a receivable invoice is presented (catch-up Phase 22; US-04.2.8,
 * US-08.4.1, US-08.4.2, US-08.4.5, US-09.1.4, US-05.2.7). The one place for:
 *
 *  - GST: every price is held GST exclusive and GST is worked out at the foot
 *    of the invoice (US-05.2.7, Confirmed). A constant, never a stored
 *    setting, so a later treatment is a one-place change;
 *  - the layout: the holder's when the invoice goes to the party the Contract
 *    bills and the Contract bills its holder, the patient's when it bills the
 *    payer (our reading, A31); an added split party by its class;
 *  - what each layout prints on its lines (the invoice description, a
 *    discount as its own line, the BTM breakdown and cross-match fields on the
 *    holder's layout only);
 *  - the supplier (the anaesthetist, with their GST number) and AA as agent,
 *    and the buyer-created tax invoice wording on the ACCPAY. PROVISIONAL
 *    until AA's accountant answers OQ-29: the wording and the document's name
 *    live only here;
 *  - the delivery stamp the run puts on each invoice, from 21's one delivery
 *    rule (`invoiceDeliveryFor`).
 *
 * AA fee invoices (Phase 16) are AA's own invoices in AA's name: none of this
 * applies to them.
 */

import type {
  Anaesthetist,
  BuyerCreatedTaxInvoice,
  Contract,
  ContractId,
  CounterpartyRef,
  Invoice,
  InvoiceAgent,
  InvoiceCrossMatch,
  InvoiceDelivery,
  InvoiceLineBtm,
  InvoiceSupplier,
  IsoDate,
  ProcedureId,
} from '../types'
import { hhmm } from '../dateText'
import type { FeeResult } from './fee'
import { formatMoney, roundToCents } from './money'
import { isPersonParty, type DeliveryPlan } from './whoIsBilled'

// ---------------------------------------------------------------------------
// GST (US-05.2.7)
// ---------------------------------------------------------------------------

/** The NZ standard GST rate, added at the foot of every invoice. */
export const GST_RATE = 0.15

/** The one sentence every invoice prints under its totals. */
export const GST_TREATMENT_CAPTION = 'Prices are held GST exclusive. GST is added at the foot of the invoice.'

/** GST at the foot of an invoice whose lines total `subtotal` (ex GST). */
export function gstOn(subtotal: number): number {
  return roundToCents(subtotal * GST_RATE)
}

// ---------------------------------------------------------------------------
// Supplier and agent (US-08.4.5; provisional, OQ-29)
// ---------------------------------------------------------------------------

/** AA as agent. The GST number is synthetic (the demo's own). */
export const AA_AGENT: InvoiceAgent = { name: 'Anaesthesia Associates Limited', gstNumber: '102345678' }

/** The buyer-created tax invoice's name. IRD has renamed it and the new name is not known (OQ-29): this is the only place it lives. */
export const BCTI_DOCUMENT_NAME = 'Buyer-created tax invoice'

/** The provisional pill every surface showing the agency wording carries. */
export const OQ29_PILL = 'Provisional (OQ-29)'

/** The one caption beside that pill. */
export const OQ29_CAPTION =
  "Supplier, agent and buyer-created wording are provisional until AA's accountant confirms the GST agency treatment and IRD's current name for this document."

/** The pill on a posted invoice (D70's default, OQ-122 open). */
export const OQ122_PILL = 'Provisional (OQ-122)'

/** What the invoice prints when the anaesthetist's GST number is not held. */
export const GST_NUMBER_NOT_HELD = 'GST number not held'

/** The refusal for a typed GST number that is not 8 or 9 digits. */
export const GST_NUMBER_INVALID = 'Enter a GST number of 8 or 9 digits.'

/** Digits only: spaces and hyphens stripped. */
export function normaliseGstNumber(value: string): string {
  return value.replace(/[\s-]/g, '')
}

/** 8 or 9 digits once spaces and hyphens are stripped. Format only, no IRD check digit. */
export function isValidGstNumber(value: string): boolean {
  return /^\d{8,9}$/.test(normaliseGstNumber(value))
}

/** `NN-NNN-NNN` or `NNN-NNN-NNN`; anything else is returned as typed. */
export function formatGstNumber(value: string): string {
  const digits = normaliseGstNumber(value)
  if (!/^\d{8,9}$/.test(digits)) return value
  const head = digits.length === 8 ? 2 : 3
  return `${digits.slice(0, head)}-${digits.slice(head, head + 3)}-${digits.slice(head + 3)}`
}

/** The supplier snapshot taken at the run: the GST number only when held. */
export function supplierFor(anaesthetist: Pick<Anaesthetist, 'registrationNumber' | 'name' | 'gstNumber'>): InvoiceSupplier {
  const gst = anaesthetist.gstNumber !== undefined && anaesthetist.gstNumber.trim() !== '' ? normaliseGstNumber(anaesthetist.gstNumber) : undefined
  return { anaesthetistId: anaesthetist.registrationNumber, name: anaesthetist.name, ...(gst !== undefined ? { gstNumber: gst } : {}) }
}

/** "GST number 12-345-678", or "GST number not held". */
export function supplierGstText(supplier: Pick<InvoiceSupplier, 'gstNumber'>): string {
  return supplier.gstNumber !== undefined ? `GST number ${formatGstNumber(supplier.gstNumber)}` : GST_NUMBER_NOT_HELD
}

/** The agent block's sentence on the invoice. */
export function agentStatement(supplierName: string, agent: InvoiceAgent = AA_AGENT): string {
  return `Issued by ${agent.name} as agent for ${supplierName}. AA GST number ${formatGstNumber(agent.gstNumber)}.`
}

/**
 * The ACCPAY's buyer-created tax invoice (US-09.1.4): one per receivable
 * invoice, the same value. No patient name or NHI (OQ-30): it names only the
 * supplier, the agent and the receivable's number.
 */
export function buyerCreatedTaxInvoiceFor(
  invoice: Pick<Invoice, 'invoiceNumber' | 'supplier' | 'agent'>,
  supplierFallback: InvoiceSupplier,
): BuyerCreatedTaxInvoice {
  const supplier = invoice.supplier ?? supplierFallback
  const agent = invoice.agent ?? AA_AGENT
  const supplierGst = supplier.gstNumber !== undefined ? `, GST ${formatGstNumber(supplier.gstNumber)}` : ''
  return {
    kind: 'buyerCreated',
    documentName: BCTI_DOCUMENT_NAME,
    wording: `${BCTI_DOCUMENT_NAME}. Raised by ${agent.name}, GST ${formatGstNumber(agent.gstNumber)}, as agent, on behalf of the supplier ${supplier.name}${supplierGst}, for services invoiced on ${invoice.invoiceNumber}.`,
    supplierName: supplier.name,
    ...(supplier.gstNumber !== undefined ? { supplierGstNumber: supplier.gstNumber } : {}),
    agentName: agent.name,
    agentGstNumber: agent.gstNumber,
    relatesToInvoiceNumber: invoice.invoiceNumber,
    provisional: true,
  }
}

// ---------------------------------------------------------------------------
// Layout (US-04.2.8, US-08.4.1)
// ---------------------------------------------------------------------------

export type InvoiceLayout = 'contractHolder' | 'patient'

/**
 * The invoice's layout. For the party the Contract bills: the holder's when
 * the Contract bills its holder, the patient's when it bills the payer (our
 * reading, A31; nothing stored on the Contract). For any other party (an
 * added split share) the recipient's class: a person gets the patient's
 * layout, an organisation the holder's (logged reading).
 */
export function invoiceLayoutFor(
  contract: Pick<Contract, 'billsTo'> | undefined,
  party: CounterpartyRef,
  isContractParty: boolean,
): InvoiceLayout {
  if (isContractParty && contract !== undefined) return contract.billsTo === 'holder' ? 'contractHolder' : 'patient'
  return isPersonParty(party) ? 'patient' : 'contractHolder'
}

/** The layout's name in tables ("Holder's layout", "Patient's layout"). */
export function layoutLabel(layout: InvoiceLayout): string {
  return layout === 'contractHolder' ? "Holder's layout" : "Patient's layout"
}

/** The layout's short name in a narrow column ("Holder", "Patient"). */
export function layoutShortLabel(layout: InvoiceLayout): string {
  return layout === 'contractHolder' ? 'Holder' : 'Patient'
}

/** A Contract's layout and delivery as the Master data table reads them (US-04.2.8): derived, never stored. */
export function contractInvoicingSummary(
  contract: Pick<Contract, 'billsTo'>,
  holder: { deliveryMethod?: 'email' | 'post' } | undefined,
): { layout: string; delivery: string } {
  if (contract.billsTo === 'payer') return { layout: layoutLabel('patient'), delivery: "Payer's email or post" }
  const delivery = holder?.deliveryMethod === 'post' ? 'Post' : holder?.deliveryMethod === 'email' ? 'Email' : 'Not set'
  return { layout: layoutLabel('contractHolder'), delivery }
}

// ---------------------------------------------------------------------------
// Lines (US-08.4.1)
// ---------------------------------------------------------------------------

export interface InvoiceLineView {
  procedureId?: ProcedureId
  kind: 'fee' | 'discount' | 'adjustment'
  description: string
  units?: number
  amount: number
  btm?: InvoiceLineBtm
  /** A prepayment line's Contract when raised (catch-up Phase 27). */
  contractId?: ContractId
  /** A free-form line's quantity and unit amount (catch-up Phase 38b). */
  quantity?: number
  unitAmount?: number
}

export interface LineViewOptions {
  procedureId: ProcedureId
  /** The Procedure's invoice description (20a's, read, never re-derived); null falls back to the fee's own text. */
  wording: string | null
}

/**
 * The holder layout's BTM breakdown for a fee result at a unit value: the units
 * charged under the multi-procedure rule (catch-up Phase 23), so base on the
 * primary only and the Procedure's own share of the Booking's modifiers.
 */
export function btmOf(fee: Pick<FeeResult, 'btm' | 'billableUnits' | 'allocation'>, unitValue: number): InvoiceLineBtm {
  const { allocation } = fee
  return {
    base: fee.btm.base.units,
    time: fee.btm.time.units,
    modifiers: allocation.modifierShare,
    units: fee.billableUnits,
    unitValue,
    // Only an additional line names its role (absent reads as primary), so a single-Procedure line is as before.
    ...(allocation.role === 'additional' ? { role: 'additional' as const } : {}),
    ...(allocation.splitAcross > 1 ? { modifiersOf: allocation.bookingModifierUnits } : {}),
  }
}

/**
 * The holder layout's breakdown line: "Base 4 + Time 4 + Modifiers 0 = 8 units
 * at $26.50", "Modifiers 3 of 7" when the Booking's modifiers split, and on an
 * additional procedure "Additional procedure: Time 2 + Modifiers 2 of 7 = 4
 * units at $26.50", or "Additional procedure: Time 2 units at $26.50" with no
 * share. A line issued before catch-up Phase 23 (no `role`) reads as it did.
 */
export function btmBreakdownText(btm: InvoiceLineBtm): string {
  const at = formatMoney(btm.unitValue)
  const m = `Modifiers ${btm.modifiers}${btm.modifiersOf !== undefined ? ` of ${btm.modifiersOf}` : ''}`
  if (btm.role === 'additional') {
    return btm.modifiers > 0 ? `Additional procedure: Time ${btm.time} + ${m} = ${btm.units} units at ${at}` : `Additional procedure: Time ${btm.units} units at ${at}`
  }
  const sum = btm.base + btm.time + btm.modifiers
  return btm.units === sum ? `Base ${btm.base} + Time ${btm.time} + ${m} = ${sum} units at ${at}` : `Additional procedure: Time ${btm.units} units at ${at}`
}

/**
 * What one Procedure's fee prints, by layout: a fee line worded by the invoice
 * description (the first; captured extra lines keep their own text), the
 * Contract's discount as its own negative line (catch-up Phase 24, US-05.4.3),
 * and on the holder's layout the BTM breakdown on the RVG fee line. A typed or
 * held price is one fee line at the price. The lines always total `fee.total`.
 */
export function invoiceLineViews(layout: InvoiceLayout, fee: FeeResult, options: LineViewOptions): InvoiceLineView[] {
  const views: InvoiceLineView[] = []
  fee.lines.forEach((line, index) => {
    if (line.role === 'discount') {
      views.push({ procedureId: options.procedureId, kind: 'discount', description: line.description, amount: line.amount })
      return
    }
    const description = index === 0 && options.wording !== null && options.wording.trim() !== '' ? options.wording : line.description
    const view: InvoiceLineView = { procedureId: options.procedureId, kind: 'fee', description, amount: line.amount }
    if (line.units !== undefined) view.units = line.units
    if (layout === 'contractHolder' && line.chargeBasis === 'rvg' && line.rate !== undefined) view.btm = btmOf(fee, line.rate)
    views.push(view)
  })
  return views
}

/**
 * The holder layout's cross-match fields (US-08.4.1): the procedure date and
 * the surgeon. The hospital's reference is gone (catch-up Phase 25a, DM-68,
 * D82); whether the Booking's approval number prints here is OQ-142 (open,
 * D88: as built, nothing), and would be one more field in this one place.
 */
export function crossMatchFor(procedureDateISO: IsoDate, surgeonName: string | undefined): InvoiceCrossMatch {
  return {
    procedureDateISO,
    ...(surgeonName !== undefined && surgeonName !== '' ? { surgeon: surgeonName } : {}),
  }
}

// ---------------------------------------------------------------------------
// Delivery (US-08.4.2, FT-08.4; D55, D70)
// ---------------------------------------------------------------------------

/**
 * The stamp the run puts on an invoice from 21's plan (`invoiceDeliveryFor`):
 * emailed now, marked to post, or raised with no address (never a failure).
 */
export function deliveryStampFor(plan: DeliveryPlan, atISO: string, by: string): InvoiceDelivery {
  if (plan.method === 'email') return { method: 'email', status: 'sent', sends: [{ atISO, to: plan.to, by }] }
  if (plan.method === 'post') return { method: 'post', status: 'toPost', address: plan.lines, markedAtISO: atISO }
  return { method: 'email', status: 'noAddress' }
}

export type DeliveryTone = 'success' | 'neutral' | 'warning'

/** The words for an invoice raised with no address (every surface uses them). */
export const NO_INVOICE_ADDRESS = 'No invoice address'

/**
 * The invoice's delivery state in words, with its pill tone: `short` for the
 * Invoices list ("Emailed 08:00"), `text` for the invoice's Delivery card
 * ("Emailed to claims@nib.example at 08:00").
 */
export function invoiceDeliveryLabel(delivery: InvoiceDelivery | undefined): { tone: DeliveryTone; short: string; text: string } {
  if (delivery === undefined) return { tone: 'neutral', short: 'Not sent', text: 'Not sent by the billing run' }
  if (delivery.status === 'sent') {
    const last = delivery.sends[delivery.sends.length - 1]
    if (last === undefined) return { tone: 'success', short: 'Emailed', text: 'Emailed' }
    return { tone: 'success', short: `Emailed ${hhmm(last.atISO)}`, text: `Emailed to ${last.to} at ${hhmm(last.atISO)}` }
  }
  if (delivery.status === 'toPost') return { tone: 'neutral', short: 'To post', text: 'To post' }
  return { tone: 'warning', short: NO_INVOICE_ADDRESS, text: NO_INVOICE_ADDRESS }
}

/** "1 needs an invoice address" or "3 need an invoice address". */
export function needAddressText(count: number): string {
  return `${count} ${count === 1 ? 'needs' : 'need'} an invoice address`
}

/** The delivery counts in one sentence: "3 emailed, 1 to post, 1 needs an invoice address." (the monitor and the Review banner). */
export function deliveryCountsText(emailed: number, toPost: number, noAddress: number): string {
  const parts = [`${emailed} emailed`, `${toPost} to post`]
  if (noAddress > 0) parts.push(needAddressText(noAddress))
  return `${parts.join(', ')}.`
}

/** The authorise banner's line (catch-up Phase 22): "3 invoices raised. 2 emailed, 1 to post." plus any without an address. */
export function runDeliverySummary(invoices: readonly Pick<Invoice, 'delivery'>[]): string {
  const n = invoices.length
  const emailed = invoices.filter((i) => i.delivery?.status === 'sent').length
  const toPost = invoices.filter((i) => i.delivery?.status === 'toPost').length
  const missing = invoices.filter((i) => i.delivery?.status === 'noAddress').length
  return `${n} ${n === 1 ? 'invoice' : 'invoices'} raised. ${deliveryCountsText(emailed, toPost, missing)}`
}
