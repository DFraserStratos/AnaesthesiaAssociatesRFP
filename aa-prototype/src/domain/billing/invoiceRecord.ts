/**
 * The stored invoice and its lines, from a built draft (catch-up Phase 43:
 * lifted out of the store's `materialiseInvoices`, so the billing run, the
 * monitor's retry, the prepayment raise and the full-scale generator store an
 * invoice the same way and cannot drift). Pure; the caller allocates the ids
 * and stamps the delivery.
 */

import type { Invoice, InvoiceApproval, InvoiceLine, InvoiceLineage, InvoiceSupplier } from '../types'
import { AA_AGENT } from './invoicePresentation'
import type { DraftInvoice, DraftInvoiceLine } from './lock'

export interface InvoiceRecordArgs {
  invoiceId: string
  invoiceNumber: string
  /** The invoice's ledger pair (its case reference). */
  caseId: string
  bookingId: string
  kind: Invoice['kind']
  atISO: string
  supplier?: InvoiceSupplier
  /** Every link (a split's other shares, an additional invoice's original). */
  lineage?: readonly InvoiceLineage[]
  eventId?: string
  approval?: InvoiceApproval
}

/** The stored invoice for one draft (no delivery stamp: the caller's send step adds it). */
export function invoiceRecordFromDraft(draft: DraftInvoice, args: InvoiceRecordArgs): Invoice {
  const lineage = args.lineage ?? []
  return {
    id: args.invoiceId,
    invoiceNumber: args.invoiceNumber,
    caseReference: args.caseId,
    bookingId: args.bookingId,
    counterparty: draft.counterparty,
    ...(draft.billedTo !== undefined ? { billedTo: draft.billedTo } : {}),
    layout: draft.layout,
    kind: args.kind,
    ...(args.eventId !== undefined ? { eventId: args.eventId } : {}),
    subtotal: draft.subtotal,
    gst: draft.gst,
    total: draft.total,
    raisedAtISO: args.atISO,
    procedureIds: [...draft.procedureIds],
    ...(args.supplier !== undefined ? { supplier: args.supplier } : {}),
    agent: AA_AGENT,
    ...(draft.split !== undefined ? { split: draft.split } : {}),
    ...(draft.holderReference !== undefined ? { holderReference: draft.holderReference } : {}),
    ...(draft.crossMatch !== undefined ? { crossMatch: draft.crossMatch } : {}),
    ...(lineage.length > 0 ? { lineage: lineage.map((l) => ({ ...l })) } : {}),
    ...(draft.noCharge === true ? { noCharge: true as const } : {}),
    ...(args.approval !== undefined ? { approval: { ...args.approval } } : {}),
  }
}

/** One stored invoice line. */
export function invoiceLineRecord(line: DraftInvoiceLine, lineId: string, invoiceId: string): InvoiceLine {
  const stored: InvoiceLine = { id: lineId, invoiceId, kind: line.kind, description: line.description, amount: line.amount }
  if (line.procedureId !== undefined) stored.procedureId = line.procedureId
  if (line.units !== undefined) stored.units = line.units
  if (line.btm !== undefined) stored.btm = line.btm
  if (line.contractId !== undefined) stored.contractId = line.contractId
  if (line.quantity !== undefined) stored.quantity = line.quantity
  if (line.unitAmount !== undefined) stored.unitAmount = line.unitAmount
  return stored
}
