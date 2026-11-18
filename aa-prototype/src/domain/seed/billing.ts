/**
 * Seed billing slice (Phase 09; pure, no store import so domain purity holds).
 *
 * The pristine seed ships ONE paid pre-payment slice: the mixed + full
 * pre-payment Booking's full pre-invoice, materialised as an
 * `Invoice{kind:'prePayment'}` + line + a paid `prePayment` ledger pair so the
 * payment-cleared gate demos NOW (Phase 10's webhook flips a case to paid live;
 * this seeds one). `freshAppState()` composes this and `resetDomainState()`
 * restores it through the same seam.
 *
 * Ids are formatted to MIRROR `store/mutate.ts`'s ID_FORMATS for the four
 * billing counter kinds (invoice / invoiceLine / billingCase / invoiceNumber),
 * and the returned counters are bumped past what this slice consumes so the
 * first runtime billing run continues the sequence with no collision. Billing
 * and Xero records deliberately receive no simulated runtime audit entries;
 * their linked schedule Bookings receive rich history centrally in `seed/audit.ts`.
 */

import { AA_AGENT, buyerCreatedTaxInvoiceFor, deliveryStampFor, supplierFor } from '../billing/invoicePresentation'
import { invoiceDeliveryFor } from '../billing/whoIsBilled'
import type {
  AaFeeInvoice,
  LedgerDisbursement,
  LedgerPair,
  LedgerReceipt,
  Disbursement,
  Invoice,
  InvoiceLine,
  PaymentIn,
  XeroAccPay,
  XeroAccRec,
  XeroContact,
  XeroJournal,
} from '../types'
import { buildInvoicesForBooking, type InvoiceBuildContext } from '../billing/invoiceBuild'
import { AA_HOLDING_ACCOUNT, prepaymentGroupsFor, prepaymentInvoiceDraftFor } from '../billing/prepayment'
import { bookingFeesFor } from '../billing/validateBookingForBilling'
import { xeroIndividualContactName } from '../xeroContact'
import { billingHospitalId } from '../listPairing'
import { buildHistory } from './history'
import { buildSeedAaFeeHistory } from './aaFee'
import { anaesthetistPayee, applyReceipt, HOLDING_PAYEE, newBookingPair } from '../billing/ledger'
import type { SeedState } from './index'

/** The seeded Xero slice (shape matches the store's XeroSlice; typed here with domain types for purity). */
export interface SeedXeroSlice {
  contacts: Record<string, XeroContact>
  accRecs: Record<string, XeroAccRec>
  accPays: Record<string, XeroAccPay>
  payments: Record<string, PaymentIn>
  disbursements: Record<string, Disbursement>
  journals: Record<string, XeroJournal>
}

export function emptySeedXeroSlice(): SeedXeroSlice {
  return { contacts: {}, accRecs: {}, accPays: {}, payments: {}, disbursements: {}, journals: {} }
}

export interface SeedBillingSlice {
  invoices: Record<string, Invoice>
  invoiceLines: Record<string, InvoiceLine>
  /** The seeded ledger (catch-up Phase 36): the history, the paid prepayment, the range beat's invoice and the AA fee pairs. In balance. */
  ledger: Record<string, LedgerPair>
  /** Append-only money in (Phase 10's receipts, now ledger entries). */
  receipts: Record<string, LedgerReceipt>
  /** Money out to the anaesthetist, as ledger entries. */
  disbursements: Record<string, LedgerDisbursement>
  /** Seeded Xero mirror (empty in the pre-payment slice; Step 6 seeds history). */
  xero: SeedXeroSlice
  /** PMS-side ContactID cache (empty in the pre-payment slice; Step 6 seeds history). */
  contactIdCache: Record<string, string>
  /** Dr Souter's seeded AA fee invoices (catch-up Phase 16). */
  aaFeeInvoices: Record<string, AaFeeInvoice>
  /** seed.counters bumped past the ids this slice consumed. */
  counters: Record<string, number>
}

/** Fixed pre-day instant the seeded prepayment invoice was approved, sent and paid (never the clock). */
const SEED_PREPAYMENT_RAISED_ISO = '2026-07-14T09:00:00'
/** Who approved the seeded prepayment invoice (catch-up Phase 27). */
const SEED_PREPAYMENT_APPROVER = 'Kirsty W.'
/** The AA Holding account's seeded Xero contact (catch-up Phase 27). */
const HOLDING_CONTACT_ID = 'XCHOLD'

/** Mirrors store/mutate.ts ID_FORMATS for the billing kinds (kept in step). */
const FORMATS: Record<string, { prefix: string; pad: number }> = {
  invoice: { prefix: 'INV', pad: 4 },
  invoiceLine: { prefix: 'IL', pad: 4 },
  ledgerPair: { prefix: 'BC', pad: 4 },
  invoiceNumber: { prefix: 'AA-2026-', pad: 4 },
}

function proceduresOf(seed: SeedState, bookingId: string) {
  return Object.values(seed.schedule.procedures)
    .filter((p) => p.bookingId === bookingId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

function contextFor(seed: SeedState, bookingId: string): InvoiceBuildContext | undefined {
  const booking = seed.schedule.bookings[bookingId]
  if (booking === undefined) return undefined
  const list = seed.schedule.lists[booking.listId]
  if (list === undefined || list.anaesthetistId === undefined) return undefined
  const anaesthetist = seed.masters.anaesthetists[list.anaesthetistId]
  if (anaesthetist === undefined) return undefined
  const ctx: InvoiceBuildContext = {
    anaesthetist,
    rvgGroups: seed.masters.rvgGroups,
    contracts: seed.masters.contracts,
    parties: seed.masters.parties,
    billingLines: Object.values(seed.schedule.billingLines),
    listDateISO: list.dateISO,
    timeRule: seed.masters.rvgTimeRule,
    patientDobISO: seed.masters.patients[booking.patientId]?.dobISO,
    modifiers: seed.masters.modifiers,
    patientId: booking.patientId,
  }
  // The payer's details as printed (catch-up Phase 25: the run always had them; the seed now does too).
  const patient = seed.masters.patients[booking.patientId]
  if (patient !== undefined) ctx.patient = patient
  // AA rooms is a location, never a Contract holder (catch-up Phase 31).
  const listHospitalId = billingHospitalId(list.hospitalId, seed.masters.hospitals)
  if (listHospitalId !== undefined) ctx.listHospitalId = listHospitalId
  return ctx
}

/** Idempotency key for the seeded pre-payment receipt (BC0001). */
/** The sender the run stamps (the store's `BILLING_RUN_SENDER`; the seed cannot import the store). */
const BILLING_RUN_SENDER_NAME = 'Billing run'

const SEED_PREPAYMENT_KEY = 'SEED-PREPAY-BC0001'

/**
 * Build the seeded billing slice: the seeded historical mirror + Xero rows
 * (Phase 10; buildHistory) composed with the ONE PAID pre-payment case (the
 * mixed + full pre-payment exemplar), which gets its own Xero pair + receipt so
 * it reads consistently in the Xero sim and the GST report. Returns just the
 * history when the booking has no patient-funded pre-payment procedure.
 */
export function buildSeedBillingSlice(seed: SeedState, prepaidBookingId: string, authorisedBookingIds: readonly string[] = []): SeedBillingSlice {
  const history = buildHistory({
    anaesthetists: seed.masters.anaesthetists,
    hospitals: seed.masters.hospitals,
    surgeons: seed.masters.surgeons,
    organisations: seed.masters.organisations,
    parties: seed.masters.parties,
    patients: seed.masters.patients,
  })

  const invoices: Record<string, Invoice> = { ...history.invoices }
  const invoiceLines: Record<string, InvoiceLine> = { ...history.invoiceLines }
  const ledger: Record<string, LedgerPair> = { ...history.ledger }
  const receipts: Record<string, LedgerReceipt> = { ...history.receipts }
  const contacts: Record<string, XeroContact> = { ...history.contacts }
  const accRecs: Record<string, XeroAccRec> = { ...history.accRecs }
  const accPays: Record<string, XeroAccPay> = { ...history.accPays }
  const payments: Record<string, PaymentIn> = { ...history.payments }
  const disbursements: Record<string, Disbursement> = { ...history.disbursements }
  const contactIdCache: Record<string, string> = { ...history.contactIdCache }

  const n = { invoice: 0, invoiceLine: 0, ledgerPair: 0, invoiceNumber: 0 }
  const next = (kind: keyof typeof n): string => {
    n[kind] += 1
    const f = FORMATS[kind]!
    return `${f.prefix}${String(n[kind]).padStart(f.pad, '0')}`
  }

  /**
   * Catch-up Phase 24's range beat: each seeded Booking on an AUTHORISED List
   * gets its standard invoice as the run would build it (lines, BTM and
   * delivery) and its ledger pair (catch-up Phase 36), not yet in Xero (so no
   * paid BCTI). Numbered in
   * its own seed series (`INV-S24-01`, `AA-2026-S2401`), as the history is,
   * so the runtime run's numbers (S3's AA-2026-0002 on) never move.
   */
  let s24 = 0
  const s24Id = (prefix: string) => `${prefix}-S24-${String(s24).padStart(2, '0')}`
  let s24Line = 0
  const invoiceAuthorised = (): void => {
    for (const bookingId of authorisedBookingIds) {
      const booking = seed.schedule.bookings[bookingId]
      const ctx = contextFor(seed, bookingId)
      const list = booking !== undefined ? seed.schedule.lists[booking.listId] : undefined
      if (booking === undefined || ctx === undefined || list === undefined) continue
      const raisedISO = list.billedAtISO ?? `${list.dateISO}T17:00:00`
      const built = buildInvoicesForBooking(booking, proceduresOf(seed, bookingId), ctx)
      if (built.kind !== 'invoices') continue
      const anaesthetist = list.anaesthetistId !== undefined ? seed.masters.anaesthetists[list.anaesthetistId] : undefined
      const supplier = anaesthetist !== undefined ? supplierFor(anaesthetist) : undefined
      const patient = seed.masters.patients[booking.patientId]
      for (const draft of built.invoices) {
        s24 += 1
        const caseId = s24Id('BC')
        const invoiceId = s24Id('INV')
        const invoiceNumber = `AA-2026-S24${String(s24).padStart(2, '0')}`
        invoices[invoiceId] = {
          id: invoiceId,
          invoiceNumber,
          caseReference: caseId,
          bookingId,
          counterparty: draft.counterparty,
          ...(draft.billedTo !== undefined ? { billedTo: draft.billedTo } : {}),
          layout: draft.layout,
          kind: 'standard',
          subtotal: draft.subtotal,
          gst: draft.gst,
          total: draft.total,
          raisedAtISO: raisedISO,
          procedureIds: [...draft.procedureIds],
          ...(supplier !== undefined ? { supplier } : {}),
          agent: AA_AGENT,
          ...(draft.holderReference !== undefined ? { holderReference: draft.holderReference } : {}),
          ...(draft.crossMatch !== undefined ? { crossMatch: draft.crossMatch } : {}),
          delivery: deliveryStampFor(invoiceDeliveryFor(draft.counterparty, proceduresOf(seed, bookingId).filter((p) => draft.procedureIds.includes(p.id)), booking.patientId, patient, seed.masters.parties), raisedISO, BILLING_RUN_SENDER_NAME),
        }
        for (const line of draft.lines) {
          s24Line += 1
          const lineId = `IL-S24-${String(s24Line).padStart(2, '0')}`
          const stored: InvoiceLine = { id: lineId, invoiceId, kind: line.kind, description: line.description, amount: line.amount }
          if (line.procedureId !== undefined) stored.procedureId = line.procedureId
          if (line.units !== undefined) stored.units = line.units
          if (line.btm !== undefined) stored.btm = line.btm
          invoiceLines[lineId] = stored
        }
        if (list.anaesthetistId !== undefined) {
          ledger[caseId] = newBookingPair({
            id: caseId,
            kind: 'procedure',
            invoice: invoices[invoiceId]!,
            lines: draft.lines,
            bookingId,
            listId: list.id,
            payee: anaesthetistPayee(list.anaesthetistId),
            patientId: booking.patientId,
            atISO: raisedISO,
          })
        }
      }
    }
  }

  const finishAndReturn = (): SeedBillingSlice => {
    invoiceAuthorised()
    const bumps: Record<string, number> = n.invoice > 0 ? { ledgerPair: n.ledgerPair + 1, invoice: n.invoice + 1, invoiceLine: n.invoiceLine + 1, invoiceNumber: n.invoiceNumber + 1 } : {}
    // AA's fee history last: it counts every seeded BCTI over the ledger's payable legs (a prepayment's payable is not one since catch-up Phase 27a; it is paid in July, outside May and June anyway).
    const fees = buildSeedAaFeeHistory(ledger, contactIdCache, seed.appSettings.aaFee)
    return {
      invoices,
      invoiceLines,
      ledger: { ...ledger, ...fees.ledger },
      receipts: { ...receipts, ...fees.receipts },
      disbursements: { ...history.ledgerDisbursements },
      xero: {
        contacts,
        accRecs: { ...accRecs, ...fees.accRecs },
        accPays,
        payments: { ...payments, ...fees.payments },
        disbursements,
        journals: {},
      },
      contactIdCache,
      aaFeeInvoices: fees.aaFeeInvoices,
      counters: { ...seed.counters, ...bumps },
    }
  }

  const booking = seed.schedule.bookings[prepaidBookingId]
  const ctx = contextFor(seed, prepaidBookingId)
  if (booking === undefined || ctx === undefined) return finishAndReturn()
  // Nair's rhinoplasty: one payer group, approved by the office a week out (catch-up Phase 27).
  const nairProcedures = proceduresOf(seed, prepaidBookingId)
  const nairPriced = bookingFeesFor(nairProcedures, ctx)
  const nairPatient = seed.masters.patients[booking.patientId]
  const groups = prepaymentGroupsFor({
    booking,
    procedures: nairProcedures,
    contracts: seed.masters.contracts,
    issued: [],
    priceOf: (p) => (nairPriced.kind === 'structural' ? null : (nairPriced.fees[p.id]?.needsPrice ?? true) ? null : nairPriced.fees[p.id]!.total),
    ...(nairPatient !== undefined ? { patient: nairPatient } : {}),
  })
  const drafts = groups.flatMap((g) => {
    const d = prepaymentInvoiceDraftFor(g, nairProcedures, { contracts: seed.masters.contracts, patientId: booking.patientId, ...(nairPatient !== undefined ? { patient: nairPatient } : {}) })
    return d !== null ? [d] : []
  })
  if (drafts.length === 0) return finishAndReturn()

  const anaesthetistId = seed.schedule.lists[booking.listId]?.anaesthetistId
  // No personal information in Xero (US-09.3.1): the neutral label built from the hidden id.
  // Another payer on a Booking keeps the `billableParty` contact namespace its BP id always had (catch-up Phase 21).
  const individual = (kind: string): 'billableParty' | 'patient' => (kind === 'billableParty' || kind === 'payer' ? 'billableParty' : 'patient')
  const cpName = (cp: { kind: string; id: string }): string => xeroIndividualContactName(individual(cp.kind), cp.id)
  const cpType = (kind: string): XeroContact['type'] => individual(kind)

  const anaesthetist = anaesthetistId !== undefined ? seed.masters.anaesthetists[anaesthetistId] : undefined
  const supplier = anaesthetist !== undefined ? supplierFor(anaesthetist) : undefined
  const patient = seed.masters.patients[booking.patientId]

  drafts.forEach((draft, index) => {
    const caseId = next('ledgerPair')
    const invoiceId = next('invoice')
    const invoiceNumber = next('invoiceNumber')
    invoices[invoiceId] = {
      id: invoiceId,
      invoiceNumber,
      caseReference: caseId,
      bookingId: prepaidBookingId,
      counterparty: draft.counterparty,
      ...(draft.billedTo !== undefined ? { billedTo: draft.billedTo } : {}),
      layout: draft.layout,
      kind: 'prePayment',
      subtotal: draft.subtotal,
      gst: draft.gst,
      total: draft.total,
      raisedAtISO: SEED_PREPAYMENT_RAISED_ISO,
      // Catch-up Phase 22: the supplier, AA as agent, the Procedure links and the run's send, as the materialiser stamps them.
      procedureIds: [...draft.procedureIds],
      ...(supplier !== undefined ? { supplier } : {}),
      agent: AA_AGENT,
      delivery: deliveryStampFor(invoiceDeliveryFor(draft.counterparty, proceduresOf(seed, booking.id).filter((p) => draft.procedureIds.includes(p.id)), booking.patientId, patient, seed.masters.parties), SEED_PREPAYMENT_RAISED_ISO, BILLING_RUN_SENDER_NAME),
      approval: { mode: 'approved', by: SEED_PREPAYMENT_APPROVER, role: 'office', atISO: SEED_PREPAYMENT_RAISED_ISO },
    }
    for (const line of draft.lines) {
      const lineId = next('invoiceLine')
      const stored: InvoiceLine = { id: lineId, invoiceId, kind: line.kind, description: line.description, amount: line.amount }
      if (line.procedureId !== undefined) stored.procedureId = line.procedureId
      if (line.units !== undefined) stored.units = line.units
      if (line.contractId !== undefined) stored.contractId = line.contractId
      invoiceLines[lineId] = stored
    }

    // Seeded PAID prepayment: fully received and held in the AA Holding account,
    // nothing disbursed; the List is not yet authorised, so no transfer (catch-up Phase 27a).
    const cp = draft.counterparty
    const payerKey = `${individual(cp.kind)}:${cp.id}`
    let payerContactId = contactIdCache[payerKey]
    if (payerContactId === undefined) {
      payerContactId = `XCB${index}`
      contacts[payerContactId] = { contactId: payerContactId, contactNumber: cp.id, name: cpName(cp), type: cpType(cp.kind), archived: false }
      contactIdCache[payerKey] = payerContactId
    }
    const accRecId = `XRB${index}`
    const accPayId = `XPB${index}`
    // The payable is the gross amount (FT-10.3): it equals the receivable.
    const amountPayable = draft.total
    accRecs[accRecId] = {
      id: accRecId,
      kind: 'procedure',
      invoiceId,
      contactId: payerContactId,
      invoiceNumber,
      reference: caseId,
      issuedAtISO: SEED_PREPAYMENT_RAISED_ISO,
      amountDue: draft.total,
      amountReceived: draft.total,
      paidAtISO: SEED_PREPAYMENT_RAISED_ISO,
      status: 'paid',
    }
    if (anaesthetistId !== undefined) {
      // Received Jul 14: the payable credits the AA Holding account (catch-up
      // Phase 27; FT-06.3, D38), authorised by the receipt and held there, never
      // paid by the payables run (27a's transfer pays whoever does the List).
      if (contacts[HOLDING_CONTACT_ID] === undefined) {
        contacts[HOLDING_CONTACT_ID] = { contactId: HOLDING_CONTACT_ID, contactNumber: AA_HOLDING_ACCOUNT.contactNumber, name: AA_HOLDING_ACCOUNT.name, type: 'organisation', archived: false }
        contactIdCache[AA_HOLDING_ACCOUNT.contactKey] = HOLDING_CONTACT_ID
      }
      accPays[accPayId] = {
        id: accPayId,
        accRecId,
        contactId: HOLDING_CONTACT_ID,
        invoiceNumber: `${invoiceNumber}-P`,
        reference: caseId,
        issuedAtISO: SEED_PREPAYMENT_RAISED_ISO,
        anaesthetistId,
        amountPayable,
        amountAuthorised: amountPayable,
        amountDisbursed: 0,
        status: 'authorised',
        payeeAccount: AA_HOLDING_ACCOUNT.payeeAccount,
        ...(supplier !== undefined ? { taxInvoice: buyerCreatedTaxInvoiceFor({ invoiceNumber, supplier, agent: AA_AGENT }, supplier) } : {}),
      }
    }
    payments[`PMTB${index}`] = { id: `PMTB${index}`, accRecId, amount: draft.total, atISO: SEED_PREPAYMENT_RAISED_ISO, idempotencyKey: `${SEED_PREPAYMENT_KEY}-${index}`, source: 'webhook' }
    if (anaesthetistId !== undefined) {
      receipts[`RCTB${index}`] = {
        id: `RCTB${index}`,
        pairId: caseId,
        pairKind: 'prePayment',
        anaesthetistId,
        accRecId,
        grossAmount: draft.total,
        gstAmount: draft.gst,
        atISO: SEED_PREPAYMENT_RAISED_ISO,
        idempotencyKey: `${SEED_PREPAYMENT_KEY}-${index}`,
        source: 'webhook',
      }
    }
    // The prepayment's ledger pair (catch-up Phase 36): received in full and released to the AA Holding
    // account, held there until the List is authorised (27a's transfer then pays whoever did it).
    const pair = newBookingPair({
      id: caseId,
      kind: 'prePayment',
      invoice: invoices[invoiceId]!,
      lines: draft.lines,
      bookingId: prepaidBookingId,
      listId: booking.listId,
      payee: HOLDING_PAYEE,
      patientId: booking.patientId,
      atISO: SEED_PREPAYMENT_RAISED_ISO,
    })
    const paidPair = applyReceipt(pair, draft.total, SEED_PREPAYMENT_RAISED_ISO).pair
    ledger[caseId] = {
      ...paidPair,
      receivable: { ...paidPair.receivable, xeroAccRecId: accRecId },
      ...(paidPair.payable !== undefined && anaesthetistId !== undefined ? { payable: { ...paidPair.payable, xeroAccPayId: accPayId } } : {}),
    }
  })

  return finishAndReturn()
}
