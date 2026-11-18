import { isBookingPair, payableReleasedFor, roundToCents, toCents } from '../../domain/billing'
import { isHeldPayable } from '../../domain/billing/prepayHolding'
import type { BookingLedgerPair, BuyerCreatedTaxInvoice, InvoiceLine, LedgerPair, XeroAccPay, XeroAccRec, XeroContact } from '../../domain/types'
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
    /** A payable crediting the AA Holding account (catch-up Phase 27a): never disbursed, so nothing is ready to pay. */
    held: boolean
    status: 'draft' | 'authorised' | 'paid'
    /** The buyer-created tax invoice as stored at handoff (catch-up Phase 22; US-09.1.4), passed through. */
    taxInvoice?: BuyerCreatedTaxInvoice
  }
  /**
   * The ledger pair this Xero record mirrors (catch-up Phase 36; FT-09.1): the
   * system of record, shown beside Xero's figures with a read-only match flag
   * (Phase 37 acts on a difference).
   */
  ledger: {
    pairId?: string
    caseReference?: string
    receivableNumber?: string
    payableNumber?: string
    /** The ledger's money: received on the receivable, released and paid out on the payable. */
    received?: number
    released?: number
    paidOut?: number
    /** Whether Xero's figures match the ledger's; undefined when no pair links the record. */
    matches?: boolean
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
 * is reduced to a display name and kept under `ledger`; no Patient object or
 * NHI can enter the Xero-facing record views.
 */
export function xeroInvoicePairViews(state: XeroPairState): XeroInvoicePairView[] {
  // The ledger pair each ACCREC mirrors (catch-up Phase 36).
  const pairsByAccRecId = new Map(
    Object.values(state.billing.ledger)
      .filter((pair): pair is BookingLedgerPair => pair.kind !== 'aaFee' && pair.receivable.xeroAccRecId !== undefined)
      .map((pair) => [pair.receivable.xeroAccRecId as string, pair]),
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
      const linkedPair = pairsByAccRecId.get(rec.id)
      const invoice = state.billing.invoices[rec.invoiceId]
      const linkedAccPayId = linkedPair?.payable?.xeroAccPayId
      const accPay = linkedAccPayId !== undefined ? state.xero.accPays[linkedAccPayId] : accPaysByAccRecId.get(rec.id)
      const bookingId = linkedPair?.bookingId ?? invoice?.bookingId
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
                remainingAuthorised: isHeldPayable(accPay)
                  ? 0
                  : roundToCents(Math.max(0, accPay.amountAuthorised - accPay.amountDisbursed)),
                held: isHeldPayable(accPay),
                status: accPay.status,
                ...(accPay.taxInvoice !== undefined ? { taxInvoice: accPay.taxInvoice } : {}),
              },
            }
          : {}),
        ledger: {
          ...(linkedPair !== undefined ? { pairId: linkedPair.id } : {}),
          ...(linkedPair !== undefined ? ledgerMoney(linkedPair, rec, accPay) : {}),
          ...(invoice?.caseReference !== undefined
            ? { caseReference: invoice.caseReference }
            : linkedPair !== undefined
              ? { caseReference: linkedPair.id }
              : {}),
          billingInvoiceId: rec.invoiceId,
          ...(linkedAccPayId !== undefined ? { accPayId: linkedAccPayId } : {}),
          ...(bookingId !== undefined ? { bookingId } : {}),
          ...(patientName !== undefined ? { patientName } : {}),
          ...(list?.anaesthetistId !== undefined ? { anaesthetistId: list.anaesthetistId } : {}),
        },
        incomplete:
          linkedPair === undefined ||
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
  const feePair = fee !== undefined ? state.billing.ledger[fee.ledgerPairId] : undefined
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
    ledger: {
      caseReference: rec.reference,
      billingInvoiceId: rec.invoiceId,
      ...(fee !== undefined ? { aaFeeInvoiceId: fee.id, aaFeeMonthISO: fee.monthISO, anaesthetistId: fee.anaesthetistId } : {}),
      ...(feePair !== undefined ? { pairId: feePair.id, ...ledgerMoney(feePair, rec, undefined) } : {}),
    },
    incomplete: fee === undefined || payer === undefined,
  }
}

/** The ledger's own figures for a pair, and whether Xero's mirror matches them (read only). */
function ledgerMoney(pair: LedgerPair, rec: XeroAccRec, accPay: XeroAccPay | undefined): Pick<XeroInvoicePairView['ledger'], 'receivableNumber' | 'payableNumber' | 'received' | 'released' | 'paidOut' | 'matches'> {
  const r = pair.receivable
  const p = isBookingPair(pair) ? pair.payable : undefined
  const recMatches = toCents(rec.amountDue) === toCents(r.amount) && toCents(rec.amountReceived) === toCents(r.receivedAmount)
  // The ACCPAY's authorised amount is the leg's stored released amount. A prepayment's payable to the AA Holding
  // account is the one exception: in the ledger it stops at what it held when transferred (later money releases on
  // the transfer), while Xero's account payable keeps authorising every receipt, so it is checked against that rule.
  const expectedAuthorised = p !== undefined && isBookingPair(pair) && pair.kind === 'prePayment' ? payableReleasedFor(r.receivedAmount, p.amount) : p?.releasedAmount
  const payMatches = accPay === undefined || p === undefined || (toCents(accPay.amountPayable) === toCents(p.amount) && toCents(accPay.amountAuthorised) === toCents(expectedAuthorised ?? 0) && toCents(accPay.amountDisbursed) === toCents(p.disbursedAmount))
  return {
    receivableNumber: r.number,
    ...(p !== undefined ? { payableNumber: p.number, released: p.releasedAmount, paidOut: p.disbursedAmount } : {}),
    received: r.receivedAmount,
    matches: recMatches && payMatches,
  }
}
