/**
 * Seeded historical billing-mirror + Xero rows (Phase 10; Decision 1 seed-money).
 *
 * The anaesthetist money views (outstanding balances, receivables aging, GST
 * activity) go LIVE over the Billing Engine's mirror in Phase 10. To have them
 * populated on load for Dr Souter, we seed a set of PAST accounts as a full,
 * coherent graph: a billed List + completed Card + Procedure, an Invoice + line,
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
 * untouched. Deterministic; no seed audit (seeding is state, not mutation).
 */

import type {
  Anaesthetist,
  BillingCase,
  BillingReceipt,
  Card,
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
import { ANAE, HOSP, ORG, SURG } from './cast'
import { BP, PAT } from './patients'

/** The masters buildHistory needs (structural — avoids a circular import of SeedMasters). */
export interface HistoryMasters {
  anaesthetists: Record<string, Anaesthetist>
  hospitals: Record<string, Hospital>
  surgeons: Record<string, Surgeon>
  organisations: Record<string, ContractHolderOrganisation>
  patients: Record<string, { name: string }>
  billableParties: Record<string, { name: string }>
}

type PaidState = 'unpaid' | 'paid' | 'missedWebhook'

interface HistoryAccount {
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
  /** paid only: when received (GST-report date) + when disbursed. */
  paidAtISO?: string
  disbursedAtISO?: string
  /** Archive this (patient) contact in the seed (archived-then-returning). */
  archivedContact?: boolean
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
  { key: 'oa02', patientId: PAT.marsh, counterparty: HOSP_SX, surgeonId: SURG.patel, hospitalId: HOSP.sx, description: 'Laparoscopic cholecystectomy', rvgBaseCode: '20941', serviceISO: '2026-06-24', raisedISO: '2026-06-24T09:00:00', total: 1240.0, accRelated: false, paidState: 'missedWebhook' },
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
  cards: Record<string, Card>
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
    lists: {}, cards: {}, procedures: {}, invoices: {}, invoiceLines: {}, cases: {},
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

  const payerName = (cp: CounterpartyRef): string => {
    switch (cp.kind) {
      case 'hospital': return masters.hospitals[cp.id]?.name ?? cp.id
      case 'organisation': return masters.organisations[cp.id]?.name ?? cp.id
      case 'patient': return masters.patients[cp.id]?.name ?? cp.id
      case 'billableParty': return masters.billableParties[cp.id]?.name ?? cp.id
      default: return cp.id
    }
  }
  const payerType = (cp: CounterpartyRef): XeroContact['type'] =>
    cp.kind === 'patient' ? 'patient' : cp.kind === 'billableParty' ? 'billableParty' : 'organisation'
  // The RFP billing routes: patient/billableParty payers → the Billable Party
  // route; every organisational holder (hospital/insurer/surgeon/organisation) →
  // the contract-holder route (the RFP names it 'hospital').
  const isPatientRoute = (cp: CounterpartyRef): boolean => cp.kind === 'patient' || cp.kind === 'billableParty'

  const dsbRunId = 'PR-HIST-01'
  let seq = 0
  for (const acc of ACCOUNTS) {
    seq += 1
    const n = pad(seq)
    const subtotal = roundToCents(acc.total / (1 + GST_RATE))
    const gst = roundToCents(acc.total - subtotal)

    // --- schedule: List + Card + Procedure ---
    const listId = `L-HIST-${n}`
    const cardId = `HC${n}`
    const procId = `HP${n}`
    const list: List = {
      id: listId,
      dateISO: acc.serviceISO,
      anaesthetistId,
      session: 'AM',
      state: 'AUTHORISED',
      statusKey: 'private',
      conflicts: [],
      billedAtISO: acc.raisedISO,
      notes: 'Historical billed list (Phase 10 seed).',
    }
    if (acc.hospitalId !== undefined) list.hospitalId = acc.hospitalId
    list.surgeonId = acc.surgeonId
    build.lists[listId] = list

    build.cards[cardId] = {
      id: cardId,
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
      cardId,
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
    const invoiceId = `HINV${n}`
    const caseId = `HBC${n}`
    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber: `AA-2026-H${n}`,
      caseReference: caseId,
      cardId,
      counterparty: acc.counterparty,
      layout: isPatientRoute(acc.counterparty) ? 'patient' : 'contractHolder',
      kind: 'standard',
      subtotal,
      gst,
      total: acc.total,
      raisedAtISO: acc.raisedISO,
    }
    build.invoices[invoiceId] = invoice
    build.invoiceLines[`HIL${n}`] = { id: `HIL${n}`, invoiceId, procedureId: procId, description: acc.description, amount: subtotal }

    // --- Xero: contacts + ACCREC + ACCPAY ---
    const payerContactId = resolveContact(acc.counterparty.kind, acc.counterparty.id, payerName(acc.counterparty), payerType(acc.counterparty), acc.archivedContact === true)
    const accRecId = `XRH${n}`
    const accPayId = `XPH${n}`
    const paid = acc.paidState === 'paid'
    const received = paid ? acc.total : 0
    const disbursed = paid ? acc.total : 0

    build.accRecs[accRecId] = {
      id: accRecId,
      invoiceId,
      contactId: payerContactId,
      amountDue: acc.total,
      amountReceived: received,
      status: paid ? 'paid' : 'awaitingPayment',
    }
    build.accPays[accPayId] = {
      id: accPayId,
      accRecId,
      contactId: payeeContactId,
      amountAuthorised: paid ? acc.total : 0,
      amountDisbursed: disbursed,
      status: paid ? 'paid' : 'draft',
    }

    const theCase: BillingCase = {
      id: caseId,
      cardId,
      invoiceId,
      accRecId,
      accPayId,
      status: paid ? 'disbursed' : 'handedOff',
      receivedAmount: received,
      authorisedAmount: paid ? acc.total : 0,
      disbursedAmount: disbursed,
    }
    if (paid && acc.paidAtISO !== undefined) theCase.paidInAtISO = acc.paidAtISO
    if (paid && acc.disbursedAtISO !== undefined) theCase.disbursedAtISO = acc.disbursedAtISO
    build.cases[caseId] = theCase

    // --- payments / receipts / disbursements ---
    if (paid && acc.paidAtISO !== undefined) {
      const key = `HIST-PAY-${acc.key}`
      build.payments[`PMTH${n}`] = { id: `PMTH${n}`, accRecId, amount: acc.total, atISO: acc.paidAtISO, idempotencyKey: key, source: 'webhook' }
      build.receipts[`RCTH${n}`] = {
        id: `RCTH${n}`,
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
        build.disbursements[`DSBH${n}`] = { id: `DSBH${n}`, accPayId, amount: acc.total, atISO: acc.disbursedAtISO, payablesRunId: dsbRunId }
      }
    } else if (acc.paidState === 'missedWebhook') {
      // An unmirrored PaymentIn: Xero recorded it but no receipt exists, so the
      // ACCREC still reads unpaid until the reconciliation poll catches it.
      const key = `HIST-MISSED-${acc.key}`
      build.payments[`PMTH${n}`] = { id: `PMTH${n}`, accRecId, amount: acc.total, atISO: acc.raisedISO, idempotencyKey: key, source: 'webhook' }
    }
  }

  return build
}
