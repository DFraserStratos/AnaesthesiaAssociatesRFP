/**
 * Seeded historical billing-mirror + Xero rows (Phase 10; Decision 1 seed-money).
 *
 * The anaesthetist money views (outstanding balances, receivables aging, GST
 * activity) go LIVE over the Billing Engine's mirror in Phase 10. To have them
 * populated on load for Dr Souter, we seed a set of PAST accounts as a full,
 * coherent graph: a billed List + completed Booking + Procedure, an Invoice + line,
 * a BillingCase carrying the money (received / authorised / disbursed + dates),
 * and the Xero side (payer + payee contacts, ACCREC, ACCPAY, payments,
 * disbursements) + the contact-id cache.
 *
 * Live runtime rows are strictly ADDITIVE and kept disjoint by fresh ids + the
 * next-day visibility rule, so aging / GST never double-count. The 8 unpaid
 * accounts (converted from the Phase-05 seeded outstanding rows) spread across
 * the aging buckets; a few PAID accounts feed the GST report; one account is a
 * MISSED WEBHOOK (an unmirrored PaymentIn the reconciliation poll catches on the
 * next day advance); one repeat patient (Mitchell) carries an unpaid prior
 * balance (the WI2a intake check); and one patient contact (Riley) is seeded
 * ARCHIVED so a live episode unarchives it (archived-then-returning).
 *
 * All ids use an `H`-prefixed namespace disjoint from the runtime counters, so
 * the pre-payment seed (INV0001/BC0001) and the first runtime run (INV0002…) are
 * untouched. Deterministic; the schedule rows receive their demo Booking history
 * centrally in `seed/audit.ts`, while billing and Xero rows remain initial
 * state rather than simulated runtime mutations.
 */

import type {
  Anaesthetist,
  BillingCase,
  BillingReceipt,
  Booking,
  ContractHolderOrganisation,
  CounterpartyRef,
  Disbursement,
  Hospital,
  Invoice,
  InvoiceLine,
  List,
  PaymentIn,
  Procedure,
  Surgeon,
  XeroAccPay,
  XeroAccRec,
  XeroContact,
} from '../types'
import { roundToCents } from '../billing/money'
import { GST_RATE } from '../billing/invoiceBuild'
import { xeroIndividualContactName } from '../xeroContact'
import { ANAE, HOSP, ORG, SURG } from './cast'
import { BP, PAT } from './patients'

/** The masters buildHistory needs (structural — avoids a circular import of SeedMasters). */
export interface HistoryMasters {
  anaesthetists: Record<string, Anaesthetist>
  hospitals: Record<string, Hospital>
  surgeons: Record<string, Surgeon>
  organisations: Record<string, ContractHolderOrganisation>
}

type PaidState = 'unpaid' | 'paid' | 'missedWebhook'

export interface HistoryAccount {
  key: string
  patientId: string
  counterparty: CounterpartyRef
  surgeonId: string
  /** Present for a hospital-route account (the List's hospital). */
  hospitalId?: string
  description: string
  rvgBaseCode?: string
  /** Service date (the past List date). */
  serviceISO: string
  /** When the ACCREC was raised (aging basis). */
  raisedISO: string
  /** Invoice total, GST-inclusive. */
  total: number
  accRelated: boolean
  paidState: PaidState
  /**
   * paid: when received (GST-report date). missedWebhook: when Xero received
   * the payment the webhook missed (the poll backdates the receipt to it).
   */
  paidAtISO?: string
  disbursedAtISO?: string
  /** Archive this (patient) contact in the seed (archived-then-returning). */
  archivedContact?: boolean
  /**
   * Accounts sharing a `listKey` share one billed List (in that `session`);
   * without one, each account gets its own AM List (Dr Souter's history).
   */
  listKey?: string
  session?: 'AM' | 'PM'
}

const HOSP_STG: CounterpartyRef = { kind: 'hospital', id: HOSP.stg }
const HOSP_SX: CounterpartyRef = { kind: 'hospital', id: HOSP.sx }
const HOSP_CPH: CounterpartyRef = { kind: 'hospital', id: HOSP.cph }
const ORG_COS: CounterpartyRef = { kind: 'organisation', id: ORG.cos }

/**
 * Souter's historical accounts. Dates all fall BEFORE the canvas horizon start
 * (today − 14d = 2026-07-07), so the seeded Lists never collide with generated
 * canvas Lists. Aging is relative to DEMO_TODAY 2026-07-21.
 */
const ACCOUNTS: readonly HistoryAccount[] = [
  // --- 8 outstanding (unpaid) across the aging buckets ---
  { key: 'oa01', patientId: PAT.tane, counterparty: HOSP_STG, surgeonId: SURG.hale, hospitalId: HOSP.stg, description: 'Knee arthroscopy', rvgBaseCode: '49558', serviceISO: '2026-06-26', raisedISO: '2026-06-26T09:00:00', total: 845.0, accRelated: false, paidState: 'unpaid' },
  { key: 'oa02', patientId: PAT.marsh, counterparty: HOSP_SX, surgeonId: SURG.patel, hospitalId: HOSP.sx, description: 'Laparoscopic cholecystectomy', rvgBaseCode: '20941', serviceISO: '2026-06-24', raisedISO: '2026-06-24T09:00:00', total: 1240.0, accRelated: false, paidState: 'missedWebhook', paidAtISO: '2026-07-20T10:00:00' },
  { key: 'oa03', patientId: PAT.chen, counterparty: HOSP_STG, surgeonId: SURG.hale, hospitalId: HOSP.stg, description: 'Hip hemiarthroplasty', rvgBaseCode: '47519', serviceISO: '2026-06-22', raisedISO: '2026-06-22T09:00:00', total: 520.5, accRelated: false, paidState: 'unpaid' },
  { key: 'oa04', patientId: PAT.prentice, counterparty: HOSP_STG, surgeonId: SURG.doyle, hospitalId: HOSP.stg, description: 'ACC knee reconstruction', rvgBaseCode: '49558', serviceISO: '2026-06-04', raisedISO: '2026-06-04T09:00:00', total: 980.0, accRelated: true, paidState: 'unpaid' },
  { key: 'oa05', patientId: PAT.holt, counterparty: HOSP_CPH, surgeonId: SURG.tan, hospitalId: HOSP.cph, description: 'Cystoscopy', rvgBaseCode: '50120', serviceISO: '2026-05-27', raisedISO: '2026-05-27T09:00:00', total: 1410.0, accRelated: false, paidState: 'unpaid' },
  { key: 'oa06', patientId: PAT.foster, counterparty: ORG_COS, surgeonId: SURG.okafor, description: 'ACC orthopaedic repair', rvgBaseCode: '47516', serviceISO: '2026-05-06', raisedISO: '2026-05-06T09:00:00', total: 1930.0, accRelated: true, paidState: 'unpaid' },
  { key: 'oa07', patientId: PAT.mitchell, counterparty: HOSP_STG, surgeonId: SURG.hale, hospitalId: HOSP.stg, description: 'Appendicectomy, laparoscopic', rvgBaseCode: '20950', serviceISO: '2026-04-14', raisedISO: '2026-04-14T09:00:00', total: 610.0, accRelated: false, paidState: 'unpaid' },
  { key: 'oa08', patientId: PAT.walker, counterparty: HOSP_SX, surgeonId: SURG.patel, hospitalId: HOSP.sx, description: 'Knee arthroscopy', rvgBaseCode: '49558', serviceISO: '2026-03-18', raisedISO: '2026-03-18T09:00:00', total: 250.0, accRelated: false, paidState: 'unpaid' },
  // --- paid accounts (feed the GST report; fully received + disbursed) ---
  { key: 'pa01', patientId: PAT.bennett, counterparty: HOSP_STG, surgeonId: SURG.hale, hospitalId: HOSP.stg, description: 'Shoulder arthroscopy', rvgBaseCode: '47516', serviceISO: '2026-06-30', raisedISO: '2026-07-01T09:00:00', total: 690.0, accRelated: false, paidState: 'paid', paidAtISO: '2026-07-12T10:00:00', disbursedAtISO: '2026-07-15T09:00:00' },
  { key: 'pa02', patientId: PAT.webb, counterparty: HOSP_SX, surgeonId: SURG.patel, hospitalId: HOSP.sx, description: 'Laparoscopic cholecystectomy', rvgBaseCode: '20941', serviceISO: '2026-06-28', raisedISO: '2026-06-29T09:00:00', total: 1150.0, accRelated: false, paidState: 'paid', paidAtISO: '2026-07-06T11:00:00', disbursedAtISO: '2026-07-09T09:00:00' },
  { key: 'pa03', patientId: PAT.mills, counterparty: HOSP_CPH, surgeonId: SURG.tan, hospitalId: HOSP.cph, description: 'Cystoscopy', rvgBaseCode: '50120', serviceISO: '2026-06-15', raisedISO: '2026-06-16T09:00:00', total: 480.0, accRelated: false, paidState: 'paid', paidAtISO: '2026-06-22T10:00:00', disbursedAtISO: '2026-06-25T09:00:00' },
  // Self-funded patient (Riley) paid account; her patient contact is seeded
  // ARCHIVED so her live Fri-24 pre-payment episode unarchives it on handoff.
  { key: 'pa04', patientId: PAT.riley, counterparty: { kind: 'patient', id: PAT.riley }, surgeonId: SURG.lim, description: 'Cosmetic procedure, self funded', serviceISO: '2026-05-10', raisedISO: '2026-05-11T09:00:00', total: 900.0, accRelated: false, paidState: 'paid', paidAtISO: '2026-05-18T10:00:00', disbursedAtISO: '2026-05-20T09:00:00', archivedContact: true },
  // Billable-party (guardian) paid account — a non-patient individual contact
  // that the nightly archive job can retire (the billableParty-eligible path).
  { key: 'pa05', patientId: PAT.park, counterparty: { kind: 'billableParty', id: BP.guardian }, surgeonId: SURG.reid, description: 'Paediatric strabismus, guardian funded', serviceISO: '2026-05-08', raisedISO: '2026-05-09T09:00:00', total: 540.0, accRelated: false, paidState: 'paid', paidAtISO: '2026-05-14T10:00:00', disbursedAtISO: '2026-05-16T09:00:00' },
] as const

export interface HistoryBuild {
  lists: Record<string, List>
  bookings: Record<string, Booking>
  procedures: Record<string, Procedure>
  invoices: Record<string, Invoice>
  invoiceLines: Record<string, InvoiceLine>
  cases: Record<string, BillingCase>
  receipts: Record<string, BillingReceipt>
  contacts: Record<string, XeroContact>
  accRecs: Record<string, XeroAccRec>
  accPays: Record<string, XeroAccPay>
  payments: Record<string, PaymentIn>
  disbursements: Record<string, Disbursement>
  contactIdCache: Record<string, string>
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Build every historical entity deterministically for Dr Souter. Pure over the
 * masters (used only for display names). Same input → identical output.
 */
export function buildHistory(masters: HistoryMasters): HistoryBuild {
  const anaesthetistId = ANAE.souter
  const souter = masters.anaesthetists[anaesthetistId]
  const build: HistoryBuild = {
    lists: {}, bookings: {}, procedures: {}, invoices: {}, invoiceLines: {}, cases: {},
    receipts: {}, contacts: {}, accRecs: {}, accPays: {}, payments: {}, disbursements: {}, contactIdCache: {},
  }

  let xc = 0
  function resolveContact(kind: string, id: string, name: string, type: XeroContact['type'], archived: boolean): string {
    const key = `${kind}:${id}`
    const cached = build.contactIdCache[key]
    if (cached !== undefined) return cached
    xc += 1
    const contactId = `XCH${pad(xc)}`
    const contactNumber = kind === 'anaesthetist' ? `ANAE-${id}` : id
    build.contacts[contactId] = { contactId, contactNumber, name, type, archived }
    build.contactIdCache[key] = contactId
    return contactId
  }

  // The persistent anaesthetist payee contact (created once, reused by every
  // account and by live runtime handoffs via the cache).
  const payeeContactId = resolveContact('anaesthetist', anaesthetistId, souter?.name ?? 'Dr Melanie Souter', 'organisation', false)

  addHistoryAccounts(build, {
    anaesthetistId,
    accounts: ACCOUNTS,
    ids: HISTORY_IDS,
    masters,
    payeeContactId,
    resolveContact,
    payablesRunId: 'PR-HIST-01',
  })

  return build
}

/** The ids one history namespace mints (Dr Souter's: `H`). */
export interface HistoryIds {
  list: (n: string) => string
  booking: (n: string) => string
  procedure: (n: string) => string
  invoice: (n: string) => string
  invoiceLine: (n: string) => string
  billingCase: (n: string) => string
  invoiceNumber: (n: string) => string
  accRec: (n: string) => string
  accPay: (n: string) => string
  payment: (n: string) => string
  receipt: (n: string) => string
  disbursement: (n: string) => string
  paymentKey: (accountKey: string) => string
}

/** A namespace's ids: `H` gives Dr Souter's `L-HIST-01`, `HBK01`, `AA-2026-H01` and so on. */
export function historyIds(ns: string): HistoryIds {
  return {
    list: (n) => (ns === 'H' ? `L-HIST-${n}` : `L-${ns}-${n}`),
    booking: (n) => `${ns}BK${n}`,
    procedure: (n) => `${ns}P${n}`,
    invoice: (n) => `${ns}INV${n}`,
    invoiceLine: (n) => `${ns}IL${n}`,
    billingCase: (n) => `${ns}BC${n}`,
    invoiceNumber: (n) => `AA-2026-${ns}${n}`,
    accRec: (n) => `XR${ns}${n}`,
    accPay: (n) => `XP${ns}${n}`,
    payment: (n) => `PMT${ns}${n}`,
    receipt: (n) => `RCT${ns}${n}`,
    disbursement: (n) => `DSB${ns}${n}`,
    paymentKey: (accountKey) => (ns === 'H' ? `HIST-PAY-${accountKey}` : `${ns}-PAY-${accountKey}`),
  }
}

const HISTORY_IDS = historyIds('H')

/** Resolves (or creates) a Xero contact and returns its ContactID. */
export type HistoryContactResolver = (
  kind: string,
  id: string,
  name: string,
  type: XeroContact['type'],
  archived: boolean,
) => string

export interface HistoryAccountsOptions {
  anaesthetistId: string
  accounts: readonly HistoryAccount[]
  ids: HistoryIds
  masters: HistoryMasters
  payeeContactId: string
  resolveContact: HistoryContactResolver
  payablesRunId: string
}

/**
 * Add billed accounts to `build` as one coherent graph each: a billed List
 * (shared by accounts with the same `listKey`), a completed Booking and
 * Procedure, an Invoice and line, a BillingCase carrying the money, and the
 * Xero side (payer contact, ACCREC and ACCPAY with their stored identifiers,
 * payments, receipts, disbursements). Dr Souter's history and the "Seed a
 * month of BCTIs" demo action both build through here. Pure and deterministic.
 */
export function addHistoryAccounts(build: HistoryBuild, opts: HistoryAccountsOptions): void {
  const { anaesthetistId, masters, ids } = opts
  const payerName = (cp: CounterpartyRef): string => {
    switch (cp.kind) {
      case 'hospital': return masters.hospitals[cp.id]?.name ?? cp.id
      case 'organisation': return masters.organisations[cp.id]?.name ?? cp.id
      // No personal information in Xero (US-09.3.1): individual contacts carry
      // only the neutral label built from the hidden id.
      case 'patient': return xeroIndividualContactName('patient', cp.id)
      case 'billableParty': return xeroIndividualContactName('billableParty', cp.id)
      default: return cp.id
    }
  }
  const payerType = (cp: CounterpartyRef): XeroContact['type'] =>
    cp.kind === 'patient' ? 'patient' : cp.kind === 'billableParty' ? 'billableParty' : 'organisation'
  // The RFP billing routes: patient/billableParty payers → the Billable Party
  // route; every organisational holder (hospital/insurer/surgeon/organisation) →
  // the contract-holder route (the RFP names it 'hospital').
  const isPatientRoute = (cp: CounterpartyRef): boolean => cp.kind === 'patient' || cp.kind === 'billableParty'

  const dsbRunId = opts.payablesRunId
  let seq = 0
  for (const acc of opts.accounts) {
    seq += 1
    const n = pad(seq)
    const subtotal = roundToCents(acc.total / (1 + GST_RATE))
    const gst = roundToCents(acc.total - subtotal)

    // --- schedule: List + Booking + Procedure ---
    const listId = acc.listKey !== undefined ? ids.list(acc.listKey) : ids.list(n)
    const bookingId = ids.booking(n)
    const procId = ids.procedure(n)
    const list: List = {
      id: listId,
      dateISO: acc.serviceISO,
      anaesthetistId,
      session: acc.session ?? 'AM',
      state: 'AUTHORISED',
      statusKey: 'private',
      conflicts: [],
      billedAtISO: acc.raisedISO,
      notes: 'Historical billed list.',
    }
    if (acc.hospitalId !== undefined) list.hospitalId = acc.hospitalId
    list.surgeonId = acc.surgeonId
    if (build.lists[listId] === undefined) build.lists[listId] = list

    build.bookings[bookingId] = {
      id: bookingId,
      listId,
      patientId: acc.patientId,
      completed: true,
      completedAtISO: acc.raisedISO,
      attachments: [],
      lastModifiedBy: 'Billing run',
      lastModifiedAtISO: acc.raisedISO,
    }
    const procedure: Procedure = {
      id: procId,
      bookingId,
      description: acc.description,
      billingRoute: isPatientRoute(acc.counterparty) ? 'billableParty' : 'hospital',
      accRelated: acc.accRelated,
      isAdditional: false,
      selectedModifierCodes: [],
    }
    if (acc.rvgBaseCode !== undefined) procedure.rvgBaseCode = acc.rvgBaseCode
    if (acc.counterparty.kind === 'billableParty') procedure.billablePartyId = acc.counterparty.id
    if (isPatientRoute(acc.counterparty)) procedure.patientPaymentCategory = 'selfFundedPostProcedure'
    // Historical contract-holder-route procedures carry a billing reference (they
    // are billed + often paid), so they never read as the seeded "missing ref" gaps.
    else procedure.billingReference = `HIST-${acc.key.toUpperCase()}`
    build.procedures[procId] = procedure

    // --- billing mirror: Invoice + line + Case ---
    const invoiceId = ids.invoice(n)
    const caseId = ids.billingCase(n)
    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber: ids.invoiceNumber(n),
      caseReference: caseId,
      bookingId,
      counterparty: acc.counterparty,
      layout: isPatientRoute(acc.counterparty) ? 'patient' : 'contractHolder',
      kind: 'standard',
      subtotal,
      gst,
      total: acc.total,
      raisedAtISO: acc.raisedISO,
    }
    build.invoices[invoiceId] = invoice
    build.invoiceLines[ids.invoiceLine(n)] = { id: ids.invoiceLine(n), invoiceId, procedureId: procId, description: acc.description, amount: subtotal }

    // --- Xero: contacts + ACCREC + ACCPAY ---
    const payerContactId = opts.resolveContact(acc.counterparty.kind, acc.counterparty.id, payerName(acc.counterparty), payerType(acc.counterparty), acc.archivedContact === true)
    const accRecId = ids.accRec(n)
    const accPayId = ids.accPay(n)
    const paid = acc.paidState === 'paid'
    const received = paid ? acc.total : 0
    // The payable is the gross amount (FT-10.3): it equals the receivable.
    const amountPayable = acc.total
    const disbursed = paid ? amountPayable : 0

    const accRec: XeroAccRec = {
      id: accRecId,
      kind: 'procedure',
      invoiceId,
      contactId: payerContactId,
      invoiceNumber: invoice.invoiceNumber,
      reference: invoice.caseReference,
      issuedAtISO: acc.raisedISO,
      amountDue: acc.total,
      amountReceived: received,
      status: paid ? 'paid' : 'awaitingPayment',
    }
    if (paid && acc.paidAtISO !== undefined) accRec.paidAtISO = acc.paidAtISO
    build.accRecs[accRecId] = accRec
    build.accPays[accPayId] = {
      id: accPayId,
      accRecId,
      contactId: opts.payeeContactId,
      invoiceNumber: `${invoice.invoiceNumber}-P`,
      reference: invoice.caseReference,
      issuedAtISO: acc.raisedISO,
      anaesthetistId,
      amountPayable,
      amountAuthorised: paid ? amountPayable : 0,
      amountDisbursed: disbursed,
      status: paid ? 'paid' : 'draft',
    }

    const theCase: BillingCase = {
      id: caseId,
      bookingId,
      invoiceId,
      accRecId,
      accPayId,
      status: paid ? 'disbursed' : 'handedOff',
      receivedAmount: received,
      authorisedAmount: paid ? amountPayable : 0,
      disbursedAmount: disbursed,
    }
    if (paid && acc.paidAtISO !== undefined) theCase.paidInAtISO = acc.paidAtISO
    if (paid && acc.disbursedAtISO !== undefined) theCase.disbursedAtISO = acc.disbursedAtISO
    build.cases[caseId] = theCase

    // --- payments / receipts / disbursements ---
    if (paid && acc.paidAtISO !== undefined) {
      const key = ids.paymentKey(acc.key)
      build.payments[ids.payment(n)] = { id: ids.payment(n), accRecId, amount: acc.total, atISO: acc.paidAtISO, idempotencyKey: key, source: 'webhook' }
      build.receipts[ids.receipt(n)] = {
        id: ids.receipt(n),
        caseId,
        anaesthetistId,
        accRecId,
        grossAmount: acc.total,
        gstAmount: gst,
        atISO: acc.paidAtISO,
        idempotencyKey: key,
        source: 'webhook',
      }
      if (acc.disbursedAtISO !== undefined) {
        build.disbursements[ids.disbursement(n)] = { id: ids.disbursement(n), accPayId, amount: amountPayable, atISO: acc.disbursedAtISO, payablesRunId: dsbRunId }
      }
    } else if (acc.paidState === 'missedWebhook') {
      // An unmirrored PaymentIn: Xero recorded it but no receipt exists, so the
      // ACCREC still reads unpaid until the reconciliation poll catches it.
      const key = `HIST-MISSED-${acc.key}`
      build.payments[ids.payment(n)] = { id: ids.payment(n), accRecId, amount: acc.total, atISO: acc.paidAtISO ?? acc.raisedISO, idempotencyKey: key, source: 'webhook' }
    }
  }

}
