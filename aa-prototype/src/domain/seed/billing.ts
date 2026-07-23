/**
 * Seed billing slice (Phase 09; pure, no store import so domain purity holds).
 *
 * The pristine seed ships ONE paid pre-payment slice: the mixed + full
 * pre-payment Card's full pre-invoice, materialised as an
 * `Invoice{kind:'prePayment'}` + line + a `BillingCase{status:'paid'}` so the
 * payment-cleared gate demos NOW (Phase 10's webhook flips a case to paid live;
 * this seeds one). `freshAppState()` composes this and `resetDomainState()`
 * restores it through the same seam.
 *
 * Ids are formatted to MIRROR `store/mutate.ts`'s ID_FORMATS for the four
 * billing counter kinds (invoice / invoiceLine / billingCase / invoiceNumber),
 * and the returned counters are bumped past what this slice consumes so the
 * first runtime billing run continues the sequence with no collision. There is
 * deliberately NO seed audit entry (seeding is initial state, not a mutation).
 */

import type {
  BillingCase,
  BillingReceipt,
  Disbursement,
  Invoice,
  InvoiceLine,
  PaymentIn,
  XeroAccPay,
  XeroAccRec,
  XeroContact,
} from '../types'
import { buildPrePaymentInvoiceForCard, type InvoiceBuildContext } from '../billing/invoiceBuild'
import { buildHistory } from './history'
import type { SeedState } from './index'

/** The seeded Xero slice (shape matches the store's XeroSlice; typed here with domain types for purity). */
export interface SeedXeroSlice {
  contacts: Record<string, XeroContact>
  accRecs: Record<string, XeroAccRec>
  accPays: Record<string, XeroAccPay>
  payments: Record<string, PaymentIn>
  disbursements: Record<string, Disbursement>
}

export function emptySeedXeroSlice(): SeedXeroSlice {
  return { contacts: {}, accRecs: {}, accPays: {}, payments: {}, disbursements: {} }
}

export interface SeedBillingSlice {
  invoices: Record<string, Invoice>
  invoiceLines: Record<string, InvoiceLine>
  cases: Record<string, BillingCase>
  /** Append-only receipts ledger (Phase 10) — empty in the pre-payment slice; Step 6 seeds history. */
  receipts: Record<string, BillingReceipt>
  /** Seeded Xero mirror (empty in the pre-payment slice; Step 6 seeds history). */
  xero: SeedXeroSlice
  /** PMS-side ContactID cache (empty in the pre-payment slice; Step 6 seeds history). */
  contactIdCache: Record<string, string>
  /** seed.counters bumped past the ids this slice consumed. */
  counters: Record<string, number>
}

/** Fixed pre-day instant the seeded pre-invoice was "raised" (never the clock). */
const SEED_PREPAYMENT_RAISED_ISO = '2026-07-14T09:00:00'
/** When the seeded pre-payment was disbursed (a payables run a couple of days later). */
const SEED_PREPAYMENT_DISBURSED_ISO = '2026-07-16T09:00:00'

/** Mirrors store/mutate.ts ID_FORMATS for the billing kinds (kept in step). */
const FORMATS: Record<string, { prefix: string; pad: number }> = {
  invoice: { prefix: 'INV', pad: 4 },
  invoiceLine: { prefix: 'IL', pad: 4 },
  billingCase: { prefix: 'BC', pad: 4 },
  invoiceNumber: { prefix: 'AA-2026-', pad: 4 },
}

function proceduresOf(seed: SeedState, cardId: string) {
  return Object.values(seed.schedule.procedures)
    .filter((p) => p.cardId === cardId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

function contextFor(seed: SeedState, cardId: string): InvoiceBuildContext | undefined {
  const card = seed.schedule.cards[cardId]
  if (card === undefined) return undefined
  const list = seed.schedule.lists[card.listId]
  if (list === undefined) return undefined
  const anaesthetist = seed.masters.anaesthetists[list.anaesthetistId]
  if (anaesthetist === undefined) return undefined
  const ctx: InvoiceBuildContext = {
    anaesthetist,
    rvgCodes: seed.masters.rvgCodes,
    contracts: seed.masters.contracts,
    contractPrices: Object.values(seed.masters.contractPrices),
    insurers: seed.masters.insurers,
    billableParties: seed.masters.billableParties,
    billingLines: Object.values(seed.schedule.billingLines),
    listDateISO: list.dateISO,
    patientId: card.patientId,
  }
  if (list.surgeonId !== undefined) ctx.surgeonId = list.surgeonId
  if (list.hospitalId !== undefined) ctx.listHospitalId = list.hospitalId
  return ctx
}

/** Idempotency key for the seeded pre-payment receipt (BC0001). */
const SEED_PREPAYMENT_KEY = 'SEED-PREPAY-BC0001'

/**
 * Build the seeded billing slice: the seeded historical mirror + Xero rows
 * (Phase 10; buildHistory) composed with the ONE PAID pre-payment case (the
 * mixed + full pre-payment exemplar), which gets its own Xero pair + receipt so
 * it reads consistently in the Xero sim and the GST report. Returns just the
 * history when the card has no patient-funded pre-payment procedure.
 */
export function buildSeedBillingSlice(seed: SeedState, prepaidCardId: string): SeedBillingSlice {
  const history = buildHistory({
    anaesthetists: seed.masters.anaesthetists,
    hospitals: seed.masters.hospitals,
    surgeons: seed.masters.surgeons,
    organisations: seed.masters.organisations,
    patients: seed.masters.patients,
    billableParties: seed.masters.billableParties,
  })

  const invoices: Record<string, Invoice> = { ...history.invoices }
  const invoiceLines: Record<string, InvoiceLine> = { ...history.invoiceLines }
  const cases: Record<string, BillingCase> = { ...history.cases }
  const receipts: Record<string, BillingReceipt> = { ...history.receipts }
  const contacts: Record<string, XeroContact> = { ...history.contacts }
  const accRecs: Record<string, XeroAccRec> = { ...history.accRecs }
  const accPays: Record<string, XeroAccPay> = { ...history.accPays }
  const payments: Record<string, PaymentIn> = { ...history.payments }
  const disbursements: Record<string, Disbursement> = { ...history.disbursements }
  const contactIdCache: Record<string, string> = { ...history.contactIdCache }

  const finishAndReturn = (bumps: Record<string, number> = {}): SeedBillingSlice => ({
    invoices,
    invoiceLines,
    cases,
    receipts,
    xero: { contacts, accRecs, accPays, payments, disbursements },
    contactIdCache,
    counters: { ...seed.counters, ...bumps },
  })

  const card = seed.schedule.cards[prepaidCardId]
  const ctx = contextFor(seed, prepaidCardId)
  if (card === undefined || ctx === undefined) return finishAndReturn()
  const built = buildPrePaymentInvoiceForCard(card, proceduresOf(seed, prepaidCardId), ctx)
  if (built.kind !== 'invoices' || built.invoices.length === 0) return finishAndReturn()

  const anaesthetistId = seed.schedule.lists[card.listId]?.anaesthetistId
  const payeeContactId = anaesthetistId !== undefined ? contactIdCache[`anaesthetist:${anaesthetistId}`] : undefined
  const cpName = (cp: { kind: string; id: string }): string => {
    if (cp.kind === 'patient') return seed.masters.patients[cp.id]?.name ?? cp.id
    if (cp.kind === 'billableParty') return seed.masters.billableParties[cp.id]?.name ?? cp.id
    return cp.id
  }
  const cpType = (kind: string): XeroContact['type'] => (kind === 'billableParty' ? 'billableParty' : 'patient')

  const n = { invoice: 0, invoiceLine: 0, billingCase: 0, invoiceNumber: 0 }
  const next = (kind: keyof typeof n): string => {
    n[kind] += 1
    const f = FORMATS[kind]!
    return `${f.prefix}${String(n[kind]).padStart(f.pad, '0')}`
  }

  built.invoices.forEach((draft, index) => {
    const caseId = next('billingCase')
    const invoiceId = next('invoice')
    const invoiceNumber = next('invoiceNumber')
    invoices[invoiceId] = {
      id: invoiceId,
      invoiceNumber,
      caseReference: caseId,
      cardId: prepaidCardId,
      counterparty: draft.counterparty,
      layout: draft.layout,
      kind: 'prePayment',
      subtotal: draft.subtotal,
      gst: draft.gst,
      total: draft.total,
      raisedAtISO: SEED_PREPAYMENT_RAISED_ISO,
    }
    for (const line of draft.lines) {
      const lineId = next('invoiceLine')
      const stored: InvoiceLine = { id: lineId, invoiceId, description: line.description, amount: line.amount }
      if (line.procedureId !== undefined) stored.procedureId = line.procedureId
      if (line.units !== undefined) stored.units = line.units
      invoiceLines[lineId] = stored
    }

    // Seeded PAID pre-payment: fully received + authorised, NOT yet disbursed.
    // Give it a Xero pair + receipt so it reads consistently (D-pre-invoice-pair).
    const cp = draft.counterparty
    const payerKey = `${cp.kind}:${cp.id}`
    let payerContactId = contactIdCache[payerKey]
    if (payerContactId === undefined) {
      payerContactId = `XCB${index}`
      contacts[payerContactId] = { contactId: payerContactId, contactNumber: cp.id, name: cpName(cp), type: cpType(cp.kind), archived: false }
      contactIdCache[payerKey] = payerContactId
    }
    const accRecId = `XRB${index}`
    const accPayId = `XPB${index}`
    accRecs[accRecId] = { id: accRecId, invoiceId, contactId: payerContactId, amountDue: draft.total, amountReceived: draft.total, status: 'paid' }
    if (payeeContactId !== undefined) {
      // Received Jul 14, disbursed Jul 16 (both before today) so a fresh store
      // starts with nothing pending — the demo creates the first payable live.
      accPays[accPayId] = { id: accPayId, accRecId, contactId: payeeContactId, amountAuthorised: draft.total, amountDisbursed: draft.total, status: 'paid' }
      disbursements[`DSBB${index}`] = { id: `DSBB${index}`, accPayId, amount: draft.total, atISO: SEED_PREPAYMENT_DISBURSED_ISO, payablesRunId: 'PR-SEED-01' }
    }
    payments[`PMTB${index}`] = { id: `PMTB${index}`, accRecId, amount: draft.total, atISO: SEED_PREPAYMENT_RAISED_ISO, idempotencyKey: `${SEED_PREPAYMENT_KEY}-${index}`, source: 'webhook' }
    if (anaesthetistId !== undefined) {
      receipts[`RCTB${index}`] = {
        id: `RCTB${index}`,
        caseId,
        anaesthetistId,
        accRecId,
        grossAmount: draft.total,
        gstAmount: draft.gst,
        atISO: SEED_PREPAYMENT_RAISED_ISO,
        idempotencyKey: `${SEED_PREPAYMENT_KEY}-${index}`,
        source: 'webhook',
      }
    }
    cases[caseId] = {
      id: caseId,
      cardId: prepaidCardId,
      invoiceId,
      accRecId,
      ...(payeeContactId !== undefined ? { accPayId } : {}),
      status: payeeContactId !== undefined ? 'disbursed' : 'paid',
      receivedAmount: draft.total,
      authorisedAmount: draft.total,
      disbursedAmount: payeeContactId !== undefined ? draft.total : 0,
      paidInAtISO: SEED_PREPAYMENT_RAISED_ISO,
      ...(payeeContactId !== undefined ? { disbursedAtISO: SEED_PREPAYMENT_DISBURSED_ISO } : {}),
    }
  })

  return finishAndReturn({
    billingCase: n.billingCase + 1,
    invoice: n.invoice + 1,
    invoiceLine: n.invoiceLine + 1,
    invoiceNumber: n.invoiceNumber + 1,
  })
}
