import { roundToCents } from '../../domain/billing'
import type { InvoiceLine, XeroContact } from '../../domain/types'
import type { AppState } from '../../store'

export interface XeroContactView {
  contactId: string
  contactNumber: string
  name: string
  type: XeroContact['type']
  archived: boolean
}

export interface XeroInvoicePairView {
  accRec: {
    id: string
    invoiceId: string
    invoiceNumber: string
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
    cardId?: string
    patientName?: string
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
      const linkedCase = casesByAccRecId.get(rec.id)
      const invoice = state.billing.invoices[rec.invoiceId]
      const accPay =
        linkedCase?.accPayId !== undefined
          ? state.xero.accPays[linkedCase.accPayId]
          : accPaysByAccRecId.get(rec.id)
      const cardId = linkedCase?.cardId ?? invoice?.cardId
      const card = cardId !== undefined ? state.schedule.cards[cardId] : undefined
      const patientName =
        card !== undefined ? state.masters.patients[card.patientId]?.name : undefined
      const invoiceNumber = invoice?.invoiceNumber ?? rec.invoiceId
      const payer = contactView(state.xero.contacts[rec.contactId])
      const payee =
        accPay !== undefined ? contactView(state.xero.contacts[accPay.contactId]) : undefined

      return {
        accRec: {
          id: rec.id,
          invoiceId: rec.invoiceId,
          invoiceNumber,
          contactId: rec.contactId,
          ...(payer !== undefined ? { contact: payer } : {}),
          amountDue: rec.amountDue,
          amountReceived: rec.amountReceived,
          balance: roundToCents(Math.max(0, rec.amountDue - rec.amountReceived)),
          status: rec.status,
          ...(invoice?.raisedAtISO !== undefined ? { raisedAtISO: invoice.raisedAtISO } : {}),
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
                billNumber: `${invoiceNumber}-P`,
                contactId: accPay.contactId,
                ...(payee !== undefined ? { contact: payee } : {}),
                totalPayable: rec.amountDue,
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
          ...(cardId !== undefined ? { cardId } : {}),
          ...(patientName !== undefined ? { patientName } : {}),
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
