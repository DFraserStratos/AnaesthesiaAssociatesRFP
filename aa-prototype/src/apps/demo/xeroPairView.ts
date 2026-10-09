import { roundToCents } from '../../domain/billing'
import type { InvoiceLine, XeroAccRec, XeroContact } from '../../domain/types'
import type { AppState } from '../../store'

export interface XeroContactView {
  contactId: string
  contactNumber: string
  name: string
  type: XeroContact['type']
  archived: boolean
}

export interface XeroInvoicePairView {
  /** `aaFee`: AA's own monthly fee invoice to an anaesthetist, with no ACCPAY (catch-up Phase 16). */
  kind: 'procedure' | 'aaFee'
  accRec: {
    id: string
    invoiceId: string
    invoiceNumber: string
    /** Xero Reference: the case reference, stored on the record (US-09.1.1). */
    reference: string
    contactId: string
    contact?: XeroContactView
    amountDue: number
    amountReceived: number
    balance: number
    status: 'awaitingPayment' | 'paid' | 'voided'
    raisedAtISO?: string
    subtotal?: number
    gst?: number
    total?: number
    lines: InvoiceLine[]
  }
  accPay?: {
    id: string
    billNumber: string
    reference: string
    contactId: string
    contact?: XeroContactView
    totalPayable: number
    amountAuthorised: number
    amountDisbursed: number
    remainingAuthorised: number
    status: 'draft' | 'authorised' | 'paid'
  }
  engine: {
    caseId?: string
    caseReference?: string
    accPayId?: string
    billingInvoiceId: string
    bookingId?: string
    patientName?: string
    anaesthetistId?: string
    /** For an AA fee pair: the fee invoice behind it. */
    aaFeeInvoiceId?: string
    aaFeeMonthISO?: string
  }
  incomplete: boolean
}

type XeroPairState = Pick<AppState, 'xero' | 'billing' | 'schedule' | 'masters'>

function contactView(contact: XeroContact | undefined): XeroContactView | undefined {
  if (contact === undefined) return undefined
  return {
    contactId: contact.contactId,
    contactNumber: contact.contactNumber,
    name: contact.name,
    type: contact.type,
    archived: contact.archived,
  }
}

/**
 * Read-only presentation join for the simulated Xero surface. Patient context
 * is reduced to a display name and kept under `engine`; no Patient object or
 * NHI can enter the Xero-facing record views.
 */
export function xeroInvoicePairViews(state: XeroPairState): XeroInvoicePairView[] {
  const casesByAccRecId = new Map(
    Object.values(state.billing.cases)
      .filter((theCase) => theCase.accRecId !== undefined)
      .map((theCase) => [theCase.accRecId as string, theCase]),
  )
  const accPaysByAccRecId = new Map(
    Object.values(state.xero.accPays).map((accPay) => [accPay.accRecId, accPay]),
  )
  const linesByInvoiceId = new Map<string, InvoiceLine[]>()
  for (const line of Object.values(state.billing.invoiceLines).sort((a, b) => a.id.localeCompare(b.id))) {
    const lines = linesByInvoiceId.get(line.invoiceId) ?? []
    lines.push(line)
    linesByInvoiceId.set(line.invoiceId, lines)
  }

  return Object.values(state.xero.accRecs)
    .map((rec): XeroInvoicePairView => {
      if (rec.kind === 'aaFee') return feePairView(state, rec)
      const linkedCase = casesByAccRecId.get(rec.id)
      const invoice = state.billing.invoices[rec.invoiceId]
      const accPay =
        linkedCase?.accPayId !== undefined
          ? state.xero.accPays[linkedCase.accPayId]
          : accPaysByAccRecId.get(rec.id)
      const bookingId = linkedCase?.bookingId ?? invoice?.bookingId
      const booking = bookingId !== undefined ? state.schedule.bookings[bookingId] : undefined
      const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
      const patientName =
        booking !== undefined ? state.masters.patients[booking.patientId]?.name : undefined
      // InvoiceNumber and Reference are stored on the Xero records, not derived.
      const invoiceNumber = rec.invoiceNumber
      const payer = contactView(state.xero.contacts[rec.contactId])
      const payee =
        accPay !== undefined ? contactView(state.xero.contacts[accPay.contactId]) : undefined

      return {
        kind: 'procedure',
        accRec: {
          id: rec.id,
          invoiceId: rec.invoiceId,
          invoiceNumber,
          reference: rec.reference,
          contactId: rec.contactId,
          ...(payer !== undefined ? { contact: payer } : {}),
          amountDue: rec.amountDue,
          amountReceived: rec.amountReceived,
          balance: roundToCents(Math.max(0, rec.amountDue - rec.amountReceived)),
          status: rec.status,
          raisedAtISO: rec.issuedAtISO,
          ...(invoice !== undefined
            ? {
                subtotal: invoice.subtotal,
                gst: invoice.gst,
                total: invoice.total,
              }
            : {}),
          lines: linesByInvoiceId.get(rec.invoiceId) ?? [],
        },
        ...(accPay !== undefined
          ? {
              accPay: {
                id: accPay.id,
                billNumber: accPay.invoiceNumber,
                reference: accPay.reference,
                contactId: accPay.contactId,
                ...(payee !== undefined ? { contact: payee } : {}),
                totalPayable: accPay.amountPayable,
                amountAuthorised: accPay.amountAuthorised,
                amountDisbursed: accPay.amountDisbursed,
                remainingAuthorised: roundToCents(
                  Math.max(0, accPay.amountAuthorised - accPay.amountDisbursed),
                ),
                status: accPay.status,
              },
            }
          : {}),
        engine: {
          ...(linkedCase !== undefined ? { caseId: linkedCase.id } : {}),
          ...(invoice?.caseReference !== undefined
            ? { caseReference: invoice.caseReference }
            : linkedCase !== undefined
              ? { caseReference: linkedCase.id }
              : {}),
          billingInvoiceId: rec.invoiceId,
          ...(linkedCase?.accPayId !== undefined ? { accPayId: linkedCase.accPayId } : {}),
          ...(bookingId !== undefined ? { bookingId } : {}),
          ...(patientName !== undefined ? { patientName } : {}),
          ...(list?.anaesthetistId !== undefined ? { anaesthetistId: list.anaesthetistId } : {}),
        },
        incomplete:
          linkedCase === undefined ||
          accPay === undefined ||
          payer === undefined ||
          payee === undefined ||
          invoice === undefined,
      }
    })
    .sort((a, b) => a.accRec.invoiceNumber.localeCompare(b.accRec.invoiceNumber))
}

/**
 * An AA fee pair: the fee ACCREC against the anaesthetist's contact, its lines
 * from the fee invoice snapshot, and no ACCPAY (AA charging its own fee, not
 * money passing through). No patient is involved.
 */
function feePairView(state: XeroPairState, rec: XeroAccRec): XeroInvoicePairView {
  const fee = state.billing.aaFeeInvoices[rec.invoiceId]
  const payer = contactView(state.xero.contacts[rec.contactId])
  return {
    kind: 'aaFee',
    accRec: {
      id: rec.id,
      invoiceId: rec.invoiceId,
      invoiceNumber: rec.invoiceNumber,
      reference: rec.reference,
      contactId: rec.contactId,
      ...(payer !== undefined ? { contact: payer } : {}),
      amountDue: rec.amountDue,
      amountReceived: rec.amountReceived,
      balance: roundToCents(Math.max(0, rec.amountDue - rec.amountReceived)),
      status: rec.status,
      raisedAtISO: rec.issuedAtISO,
      ...(fee !== undefined ? { subtotal: fee.subtotal, gst: fee.gst, total: fee.total } : {}),
      lines: (fee?.lines ?? []).map((line, i) => ({ id: `${rec.invoiceId}-L${i + 1}`, invoiceId: rec.invoiceId, description: line.description, amount: line.amount })),
    },
    engine: {
      caseReference: rec.reference,
      billingInvoiceId: rec.invoiceId,
      ...(fee !== undefined ? { aaFeeInvoiceId: fee.id, aaFeeMonthISO: fee.monthISO, anaesthetistId: fee.anaesthetistId } : {}),
    },
    incomplete: fee === undefined || payer === undefined,
  }
}
