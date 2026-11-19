/**
 * Seeded historical ledger + Xero rows (Phase 10; Decision 1 seed-money).
 *
 * The anaesthetist money views (the Outstanding list, payments and, since
 * catch-up Phase 38, the monthly GST report of payouts) go LIVE over the Billing Engine's ledger in Phase 10. To have them
 * populated on load for Dr Souter, we seed a set of PAST accounts as a full,
 * coherent graph: a billed List + completed Booking + Procedure, an Invoice + line,
 * a ledger pair carrying the money (received / authorised / disbursed + dates),
 * and the Xero side (payer + payee contacts, ACCREC, ACCPAY, payments,
 * disbursements) + the contact-id cache.
 *
 * Live runtime rows are strictly ADDITIVE and kept disjoint by fresh ids, so
 * Outstanding / GST never double-count. The 8 unpaid
 * accounts (converted from the Phase-05 seeded outstanding rows) spread across
 * several months of invoice dates; a few PAID and paid-out accounts feed the GST report; one account is a
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

import { slotIdFor } from '../slots'
import type {
  Anaesthetist,
  BookingLedgerPair,
  LedgerDisbursement,
  LedgerReceipt,
  Booking,
  ContractHolderOrganisation,
  CounterpartyRef,
  Disbursement,
  Hospital,
  Invoice,
  InvoiceLine,
  List,
  Party,
  Patient,
  PaymentIn,
  Procedure,
  Surgeon,
  XeroAccPay,
  XeroAccRec,
  XeroContact,
} from '../types'
import { roundToCents } from '../billing/money'
import { AA_AGENT, GST_RATE, buyerCreatedTaxInvoiceFor, deliveryStampFor, supplierFor } from '../billing/invoicePresentation'
import { invoiceDeliveryFor } from '../billing/whoIsBilled'
import { xeroIndividualContactName } from '../xeroContact'
import { ANAE, HOSP, ORG, SURG } from './cast'
import { rvgGroupIdForLegacyCode } from './rvgGroups'
import { CONTRACT, PLAIN_RVG_CONTRACT_BY_HOSPITAL } from './contracts'
import { BP, genericPatientIds, HANA_PARK_PAYER, PAT } from './patients'
import { seedText } from './procedureText'
import { originForNewList } from '../lists/listOrigin'

/** The masters buildHistory needs (structural — avoids a circular import of SeedMasters). */
export interface HistoryMasters {
  anaesthetists: Record<string, Anaesthetist>
  hospitals: Record<string, Hospital>
  surgeons: Record<string, Surgeon>
  organisations: Record<string, ContractHolderOrganisation>
  /** For each invoice's delivery stamp (catch-up Phase 22); absent: the invoice carries none. */
  parties?: Record<string, Party>
  patients?: Record<string, Patient>
}

type PaidState = 'unpaid' | 'paid' | 'missedWebhook'

export interface HistoryAccount {
  key: string
  patientId: string
  counterparty: CounterpartyRef
  surgeonId: string
  /** Present for a hospital-route account (the List's hospital). */
  hospitalId?: string
  /**
   * Where the List was held when the account is not hospital-routed (catch-up
   * Phase 31: every List has a hospital). Read only for the List, never for
   * routing or pricing.
   */
  listHospitalId?: string
  description: string
  /** A legacy five-digit code, written to the Procedure as its RVG group (`LEGACY_CODE_TO_RVG_GROUP`). */
  legacyCode?: string
  /** Service date (the past List date). */
  serviceISO: string
  /** When the ACCREC was raised (the invoice date). */
  raisedISO: string
  /** Invoice total, GST-inclusive. */
  total: number
  /**
   * The archived account's ACC marker, as the old system recorded it. Kept as
   * history (catch-up Phase 18a): these Procedures predate Contracts and carry
   * none, so the marker rides on the history case (`archivedAccRelated`) and
   * every live case reads ACC from its Contract's funding tag.
   */
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
  /** The Booking's scheduled time on its List (the browsable history; catch-up Phase 38a). */
  scheduledTime?: string
}

const HOSP_STG: CounterpartyRef = { kind: 'hospital', id: HOSP.stg }
const HOSP_SX: CounterpartyRef = { kind: 'hospital', id: HOSP.sx }
const HOSP_CPH: CounterpartyRef = { kind: 'hospital', id: HOSP.cph }
const ORG_COS: CounterpartyRef = { kind: 'organisation', id: ORG.cos }

/** A generic patient by fixed index (no RNG; the pool is deterministic). */
function generic(index: number): string {
  const id = genericPatientIds()[index]
  if (id === undefined) throw new Error(`no generic patient at ${index}`)
  return id
}

/** One paid account on a shared List (the browsable history). */
function lookback(
  key: string,
  listDate: string,
  session: 'AM' | 'PM',
  scheduledTime: string,
  patientId: string,
  where: { counterparty: CounterpartyRef; surgeonId: string; hospitalId?: string; listHospitalId?: string },
  description: string,
  legacyCode: string | undefined,
  total: number,
  accRelated: boolean,
  money: { raised: string; paid: string; disbursed: string },
): HistoryAccount {
  return {
    key,
    patientId,
    ...where,
    description,
    ...(legacyCode !== undefined ? { legacyCode } : {}),
    serviceISO: listDate,
    raisedISO: `${money.raised}T09:00:00`,
    total,
    accRelated,
    paidState: 'paid',
    paidAtISO: `${money.paid}T10:00:00`,
    disbursedAtISO: `${money.disbursed}T09:00:00`,
    listKey: `${listDate}-${session}`,
    session,
    scheduledTime,
  }
}

const STG_LIM = { counterparty: HOSP_STG, surgeonId: SURG.lim, hospitalId: HOSP.stg }
const STG_HALE = { counterparty: HOSP_STG, surgeonId: SURG.hale, hospitalId: HOSP.stg }
const STG_DOYLE = { counterparty: HOSP_STG, surgeonId: SURG.doyle, hospitalId: HOSP.stg }
const SX_PATEL = { counterparty: HOSP_SX, surgeonId: SURG.patel, hospitalId: HOSP.sx }
const CPH_OKAFOR = { counterparty: HOSP_CPH, surgeonId: SURG.okafor, hospitalId: HOSP.cph }
const ACC_HALE = { counterparty: ORG_COS, surgeonId: SURG.hale, listHospitalId: HOSP.stg }

/**
 * The browsable history (catch-up Phase 38a): twelve Lists, 29 Bookings, Monday
 * 12 January to Friday 27 March 2026, all paid and disbursed before 1 April.
 * The pinned List is Fri 13 March AM at St George's (`SEED_LOOKBACK`), with
 * Sarah Mitchell's earlier Booking on it.
 */
const LOOKBACK_ACCOUNTS: readonly HistoryAccount[] = [
  // Mon 12 Jan PM · St George's · Ms G. Lim
  lookback('hb01', '2026-01-12', 'PM', '13:15', generic(40), STG_LIM, 'Excision of skin lesion, flap repair', undefined, 720.0, false, { raised: '2026-01-13', paid: '2026-01-27', disbursed: '2026-01-29' }),
  lookback('hb02', '2026-01-12', 'PM', '14:30', generic(41), STG_LIM, 'Carpal tunnel release', undefined, 455.0, false, { raised: '2026-01-13', paid: '2026-01-27', disbursed: '2026-01-29' }),
  // Tue 20 Jan AM · St George's · Mr T. Hale
  lookback('hb03', '2026-01-20', 'AM', '07:45', PAT.tane, STG_HALE, 'Knee arthroscopy', '49558', 845.0, false, { raised: '2026-01-21', paid: '2026-02-04', disbursed: '2026-02-06' }),
  lookback('hb04', '2026-01-20', 'AM', '09:00', generic(42), STG_HALE, 'Shoulder arthroscopy', '47516', 690.0, false, { raised: '2026-01-21', paid: '2026-02-04', disbursed: '2026-02-06' }),
  lookback('hb05', '2026-01-20', 'AM', '10:30', generic(43), STG_HALE, 'Hip hemiarthroplasty', '47519', 1180.0, false, { raised: '2026-01-21', paid: '2026-02-04', disbursed: '2026-02-06' }),
  // Thu 29 Jan AM · Christchurch Public · Mr C. Okafor
  lookback('hb06', '2026-01-29', 'AM', '08:00', generic(44), CPH_OKAFOR, 'Laparoscopic cholecystectomy', '20941', 1150.0, false, { raised: '2026-01-30', paid: '2026-02-13', disbursed: '2026-02-17' }),
  lookback('hb07', '2026-01-29', 'AM', '10:00', generic(45), CPH_OKAFOR, 'Appendicectomy, laparoscopic', '20950', 610.0, false, { raised: '2026-01-30', paid: '2026-02-13', disbursed: '2026-02-17' }),
  // Tue 3 Feb PM · Southern Cross · Ms K. Patel
  lookback('hb08', '2026-02-03', 'PM', '13:15', generic(46), SX_PATEL, 'Laparoscopic cholecystectomy', '20941', 1240.0, false, { raised: '2026-02-04', paid: '2026-02-18', disbursed: '2026-02-20' }),
  lookback('hb09', '2026-02-03', 'PM', '14:45', generic(47), SX_PATEL, 'Inguinal hernia repair', undefined, 680.0, false, { raised: '2026-02-04', paid: '2026-02-18', disbursed: '2026-02-20' }),
  lookback('hb10', '2026-02-03', 'PM', '16:00', generic(48), SX_PATEL, 'Knee arthroscopy', '49558', 520.0, false, { raised: '2026-02-04', paid: '2026-02-18', disbursed: '2026-02-20' }),
  // Mon 9 Feb PM · St George's · Ms G. Lim
  lookback('hb11', '2026-02-09', 'PM', '13:15', generic(49), STG_LIM, 'Breast reduction', undefined, 1420.0, false, { raised: '2026-02-10', paid: '2026-02-24', disbursed: '2026-02-26' }),
  lookback('hb12', '2026-02-09', 'PM', '15:30', generic(50), STG_LIM, 'Excision of skin lesion, flap repair', undefined, 480.0, false, { raised: '2026-02-10', paid: '2026-02-24', disbursed: '2026-02-26' }),
  // Tue 17 Feb AM · St George's · Mr T. Hale (one ACC account)
  lookback('hb13', '2026-02-17', 'AM', '07:45', generic(51), ACC_HALE, 'ACC knee reconstruction', '49558', 980.0, true, { raised: '2026-02-18', paid: '2026-03-04', disbursed: '2026-03-06' }),
  lookback('hb14', '2026-02-17', 'AM', '09:30', generic(52), STG_HALE, 'Shoulder arthroscopy', '47516', 690.0, false, { raised: '2026-02-18', paid: '2026-03-04', disbursed: '2026-03-06' }),
  lookback('hb15', '2026-02-17', 'AM', '11:00', generic(53), STG_HALE, 'Knee arthroscopy', '49558', 845.0, false, { raised: '2026-02-18', paid: '2026-03-04', disbursed: '2026-03-06' }),
  // Thu 26 Feb AM · Christchurch Public · Mr C. Okafor
  lookback('hb16', '2026-02-26', 'AM', '08:00', generic(54), CPH_OKAFOR, 'Appendicectomy, laparoscopic', '20950', 610.0, false, { raised: '2026-02-27', paid: '2026-03-12', disbursed: '2026-03-16' }),
  lookback('hb17', '2026-02-26', 'AM', '09:45', generic(55), CPH_OKAFOR, 'Cystoscopy', '50120', 480.0, false, { raised: '2026-02-27', paid: '2026-03-12', disbursed: '2026-03-16' }),
  // Tue 3 Mar PM · Southern Cross · Ms K. Patel
  lookback('hb18', '2026-03-03', 'PM', '13:15', PAT.bennett, SX_PATEL, 'Inguinal hernia repair', undefined, 680.0, false, { raised: '2026-03-04', paid: '2026-03-17', disbursed: '2026-03-19' }),
  lookback('hb19', '2026-03-03', 'PM', '14:30', generic(56), SX_PATEL, 'Laparoscopic cholecystectomy', '20941', 1150.0, false, { raised: '2026-03-04', paid: '2026-03-17', disbursed: '2026-03-19' }),
  lookback('hb20', '2026-03-03', 'PM', '16:00', generic(57), SX_PATEL, 'Knee arthroscopy', '49558', 520.0, false, { raised: '2026-03-04', paid: '2026-03-17', disbursed: '2026-03-19' }),
  // Tue 10 Mar AM · St George's · Mr T. Hale
  lookback('hb21', '2026-03-10', 'AM', '07:45', generic(58), STG_HALE, 'Hip hemiarthroplasty', '47519', 1180.0, false, { raised: '2026-03-11', paid: '2026-03-24', disbursed: '2026-03-26' }),
  lookback('hb22', '2026-03-10', 'AM', '10:00', generic(59), STG_HALE, 'Knee arthroscopy', '49558', 845.0, false, { raised: '2026-03-11', paid: '2026-03-24', disbursed: '2026-03-26' }),
  // Fri 13 Mar AM · St George's · Mr P. Doyle (the pinned List, SEED_LOOKBACK)
  lookback('hb23', '2026-03-13', 'AM', '08:00', PAT.mitchell, STG_DOYLE, 'Laparoscopic cholecystectomy', '20941', 1240.0, false, { raised: '2026-03-14', paid: '2026-03-25', disbursed: '2026-03-27' }),
  lookback('hb24', '2026-03-13', 'AM', '09:30', generic(60), STG_DOYLE, 'Inguinal hernia repair', undefined, 680.0, false, { raised: '2026-03-14', paid: '2026-03-25', disbursed: '2026-03-27' }),
  lookback('hb25', '2026-03-13', 'AM', '11:00', generic(61), STG_DOYLE, 'Appendicectomy, laparoscopic', '20950', 610.0, false, { raised: '2026-03-14', paid: '2026-03-25', disbursed: '2026-03-27' }),
  // Tue 24 Mar PM · Southern Cross · Ms K. Patel
  lookback('hb26', '2026-03-24', 'PM', '13:15', generic(62), SX_PATEL, 'Laparoscopic cholecystectomy', '20941', 1150.0, false, { raised: '2026-03-25', paid: '2026-03-30', disbursed: '2026-03-31' }),
  lookback('hb27', '2026-03-24', 'PM', '15:00', generic(63), SX_PATEL, 'Knee arthroscopy', '49558', 520.0, false, { raised: '2026-03-25', paid: '2026-03-30', disbursed: '2026-03-31' }),
  // Fri 27 Mar AM · St George's · Mr P. Doyle
  lookback('hb28', '2026-03-27', 'AM', '08:00', generic(64), STG_DOYLE, 'Inguinal hernia repair', undefined, 680.0, false, { raised: '2026-03-27', paid: '2026-03-30', disbursed: '2026-03-31' }),
  lookback('hb29', '2026-03-27', 'AM', '09:30', generic(65), STG_DOYLE, 'Appendicectomy, laparoscopic', '20950', 610.0, false, { raised: '2026-03-27', paid: '2026-03-30', disbursed: '2026-03-31' }),
]

/** The pinned history List the look-back tests, shots and the demo guide use. */
export const LOOKBACK_LIST_ID = 'L-HIST-2026-03-13-AM'
export const LOOKBACK_DATE_ISO = '2026-03-13'

/**
 * Souter's historical accounts. Dates all fall BEFORE the canvas horizon start
 * (today − 14d = 2026-07-07), so the seeded Lists never collide with generated
 * canvas Lists. Dates are relative to DEMO_TODAY 2026-07-21.
 */
const ACCOUNTS: readonly HistoryAccount[] = [
  // --- 8 outstanding (unpaid), oldest to newest invoice dates ---
  { key: 'oa01', patientId: PAT.tane, counterparty: HOSP_STG, surgeonId: SURG.hale, hospitalId: HOSP.stg, description: 'Knee arthroscopy', legacyCode: '49558', serviceISO: '2026-06-26', raisedISO: '2026-06-26T09:00:00', total: 845.0, accRelated: false, paidState: 'unpaid' },
  { key: 'oa02', patientId: PAT.marsh, counterparty: HOSP_SX, surgeonId: SURG.patel, hospitalId: HOSP.sx, description: 'Laparoscopic cholecystectomy', legacyCode: '20941', serviceISO: '2026-06-24', raisedISO: '2026-06-24T09:00:00', total: 1240.0, accRelated: false, paidState: 'missedWebhook', paidAtISO: '2026-07-20T10:00:00' },
  { key: 'oa03', patientId: PAT.chen, counterparty: HOSP_STG, surgeonId: SURG.hale, hospitalId: HOSP.stg, description: 'Hip hemiarthroplasty', legacyCode: '47519', serviceISO: '2026-06-22', raisedISO: '2026-06-22T09:00:00', total: 520.5, accRelated: false, paidState: 'unpaid' },
  { key: 'oa04', patientId: PAT.prentice, counterparty: HOSP_STG, surgeonId: SURG.doyle, hospitalId: HOSP.stg, description: 'ACC knee reconstruction', legacyCode: '49558', serviceISO: '2026-06-04', raisedISO: '2026-06-04T09:00:00', total: 980.0, accRelated: true, paidState: 'unpaid' },
  { key: 'oa05', patientId: PAT.holt, counterparty: HOSP_CPH, surgeonId: SURG.tan, hospitalId: HOSP.cph, description: 'Cystoscopy', legacyCode: '50120', serviceISO: '2026-05-27', raisedISO: '2026-05-27T09:00:00', total: 1410.0, accRelated: false, paidState: 'unpaid' },
  { key: 'oa06', patientId: PAT.foster, counterparty: ORG_COS, surgeonId: SURG.okafor, listHospitalId: HOSP.sx, description: 'ACC orthopaedic repair', legacyCode: '47516', serviceISO: '2026-05-06', raisedISO: '2026-05-06T09:00:00', total: 1930.0, accRelated: true, paidState: 'unpaid' },
  { key: 'oa07', patientId: PAT.mitchell, counterparty: HOSP_STG, surgeonId: SURG.hale, hospitalId: HOSP.stg, description: 'Appendicectomy, laparoscopic', legacyCode: '20950', serviceISO: '2026-04-14', raisedISO: '2026-04-14T09:00:00', total: 610.0, accRelated: false, paidState: 'unpaid' },
  { key: 'oa08', patientId: PAT.walker, counterparty: HOSP_SX, surgeonId: SURG.patel, hospitalId: HOSP.sx, description: 'Knee arthroscopy', legacyCode: '49558', serviceISO: '2026-03-18', raisedISO: '2026-03-18T09:00:00', total: 250.0, accRelated: false, paidState: 'unpaid' },
  // --- paid accounts (feed the GST report; fully received + disbursed) ---
  { key: 'pa01', patientId: PAT.bennett, counterparty: HOSP_STG, surgeonId: SURG.hale, hospitalId: HOSP.stg, description: 'Shoulder arthroscopy', legacyCode: '47516', serviceISO: '2026-06-30', raisedISO: '2026-07-01T09:00:00', total: 690.0, accRelated: false, paidState: 'paid', paidAtISO: '2026-07-12T10:00:00', disbursedAtISO: '2026-07-15T09:00:00' },
  { key: 'pa02', patientId: PAT.webb, counterparty: HOSP_SX, surgeonId: SURG.patel, hospitalId: HOSP.sx, description: 'Laparoscopic cholecystectomy', legacyCode: '20941', serviceISO: '2026-06-28', raisedISO: '2026-06-29T09:00:00', total: 1150.0, accRelated: false, paidState: 'paid', paidAtISO: '2026-07-06T11:00:00', disbursedAtISO: '2026-07-09T09:00:00' },
  { key: 'pa03', patientId: PAT.mills, counterparty: HOSP_CPH, surgeonId: SURG.tan, hospitalId: HOSP.cph, description: 'Cystoscopy', legacyCode: '50120', serviceISO: '2026-06-15', raisedISO: '2026-06-16T09:00:00', total: 480.0, accRelated: false, paidState: 'paid', paidAtISO: '2026-06-22T10:00:00', disbursedAtISO: '2026-06-25T09:00:00' },
  // Self-funded patient (Riley) paid account; her patient contact is seeded
  // ARCHIVED so her live Fri-24 pre-payment episode unarchives it on handoff.
  { key: 'pa04', patientId: PAT.riley, counterparty: { kind: 'patient', id: PAT.riley }, surgeonId: SURG.lim, listHospitalId: HOSP.forte, description: 'Cosmetic procedure, self funded', serviceISO: '2026-05-10', raisedISO: '2026-05-11T09:00:00', total: 900.0, accRelated: false, paidState: 'paid', paidAtISO: '2026-05-18T10:00:00', disbursedAtISO: '2026-05-20T09:00:00', archivedContact: true },
  // Billable-party (guardian) paid account — a non-patient individual contact
  // that the nightly archive job can retire (the billableParty-eligible path).
  { key: 'pa05', patientId: PAT.park, counterparty: { kind: 'payer', id: BP.guardian }, surgeonId: SURG.reid, listHospitalId: HOSP.ces, description: 'Paediatric strabismus, guardian funded', serviceISO: '2026-05-08', raisedISO: '2026-05-09T09:00:00', total: 540.0, accRelated: false, paidState: 'paid', paidAtISO: '2026-05-14T10:00:00', disbursedAtISO: '2026-05-16T09:00:00' },
  // --- Browsable history, January to March 2026 (catch-up Phase 38a) ---
  // Twelve multi-Booking Lists Dr Souter can find by search or by date, at her
  // usual hospitals with their surgeons, appended so every existing id, invoice
  // number, amount and date above is unchanged. Every account is paid, received
  // and disbursed before 1 April 2026, so no outstanding figure, Awaiting
  // collection, Balances, S3 or S4 number moves. No two backdrop Lists share a
  // date and session (Wed 18 Mar AM is L-HIST-08). Hand-written: no RNG draw.
  ...LOOKBACK_ACCOUNTS,
] as const

export interface HistoryBuild {
  lists: Record<string, List>
  bookings: Record<string, Booking>
  procedures: Record<string, Procedure>
  invoices: Record<string, Invoice>
  invoiceLines: Record<string, InvoiceLine>
  /** The seeded ledger pairs (catch-up Phase 36): one per account, in balance. */
  ledger: Record<string, BookingLedgerPair>
  receipts: Record<string, LedgerReceipt>
  /** Money out to the anaesthetist, as ledger entries (each Xero disbursement has its match). */
  ledgerDisbursements: Record<string, LedgerDisbursement>
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
    lists: {}, bookings: {}, procedures: {}, invoices: {}, invoiceLines: {}, ledger: {},
    receipts: {}, ledgerDisbursements: {}, contacts: {}, accRecs: {}, accPays: {}, payments: {}, disbursements: {}, contactIdCache: {},
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
  ledgerDisbursement: (n: string) => string
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
    ledgerDisbursement: (n) => `LD${ns}${n}`,
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
 * Procedure, an Invoice and line, a ledger pair carrying the money, and the
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
      case 'payer':
      case 'billableParty': return xeroIndividualContactName('billableParty', cp.id)
      default: return cp.id
    }
  }
  const payerType = (cp: CounterpartyRef): XeroContact['type'] =>
    cp.kind === 'patient' ? 'patient' : cp.kind === 'billableParty' || cp.kind === 'payer' ? 'billableParty' : 'organisation'
  // The RFP billing routes: patient/billableParty payers → the Billable Party
  // route; every organisational holder (hospital/insurer/surgeon/organisation) →
  // the contract-holder route (the RFP names it 'hospital').
  const isPatientRoute = (cp: CounterpartyRef): boolean => cp.kind === 'patient' || cp.kind === 'payer'
  // A payer on a Booking keeps the Xero contact namespace its `BP####` id always had (catch-up Phase 21).
  const contactKind = (cp: CounterpartyRef): string => (cp.kind === 'payer' ? 'billableParty' : cp.kind)

  const dsbRunId = opts.payablesRunId
  const supplierAnaesthetist = masters.anaesthetists[anaesthetistId]
  const supplier = supplierAnaesthetist !== undefined ? supplierFor(supplierAnaesthetist) : undefined
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
    const session = acc.session ?? 'AM'
    const listHospitalId = acc.hospitalId ?? acc.listHospitalId
    if (listHospitalId === undefined) throw new Error(`history account ${acc.key} needs a hospital for its List`)
    const list: List = {
      id: listId,
      // Backdrop history sits before the schedule horizon: it names its Slot
      // but no Slot record exists (catch-up Phase 28; `isBackdropList`).
      slotId: slotIdFor(anaesthetistId, acc.serviceISO, session),
      dateISO: acc.serviceISO,
      anaesthetistId,
      session,
      state: 'AUTHORISED',
      kind: 'private',
      hospitalId: listHospitalId,
      surgeonId: acc.surgeonId,
      conflicts: [],
      origin: originForNewList({ kind: 'office' }),
      billedAtISO: acc.raisedISO,
      notes: 'Historical billed list.',
    }
    if (build.lists[listId] === undefined) build.lists[listId] = list

    build.bookings[bookingId] = {
      id: bookingId,
      listId,
      patientId: acc.patientId,
      completed: true,
      completedAtISO: acc.raisedISO,
      ...(acc.scheduledTime !== undefined ? { scheduledTime: acc.scheduledTime } : {}),
      lastModifiedBy: 'Billing run',
      lastModifiedAtISO: acc.raisedISO,
    }
    const procedure: Procedure = {
      id: procId,
      bookingId,
      // The Procedure's payer (catch-up Phase 21, on the Procedure since 22a): Hana Park on Grace Park's guardian-funded account, else the patient.
      payer: acc.counterparty.kind === 'payer' && acc.counterparty.id === BP.guardian ? HANA_PARK_PAYER : { kind: 'patient' },
      procedureText: seedText(acc.description),
      invoiceDescription: null,
      // Catch-up Phase 20: the one Contract it was billed under. A patient or
      // guardian bill was No contract · RVG; a holder bill, the List's
      // hospital's plain RVG Contract (what the retired route resolved).
      governingContractId: isPatientRoute(acc.counterparty)
        ? CONTRACT.noContractRvg
        : (PLAIN_RVG_CONTRACT_BY_HOSPITAL[listHospitalId] ?? CONTRACT.stgRvg),
      isPrimary: true,
      modifierClaims: [],
      removedModifierIds: [],
    }
    if (acc.legacyCode !== undefined) procedure.rvgGroupId = rvgGroupIdForLegacyCode(acc.legacyCode)
    build.procedures[procId] = procedure

    // --- billing: Invoice + line + ledger pair ---
    const invoiceId = ids.invoice(n)
    const caseId = ids.billingCase(n)
    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber: ids.invoiceNumber(n),
      caseReference: caseId,
      bookingId,
      counterparty: acc.counterparty,
      ...(acc.counterparty.kind === 'payer' && acc.counterparty.id === BP.guardian ? { billedTo: { name: 'Hana Park', email: 'hana.park@example.net' } } : {}),
      layout: isPatientRoute(acc.counterparty) ? 'patient' : 'contractHolder',
      kind: 'standard',
      subtotal,
      gst,
      total: acc.total,
      raisedAtISO: acc.raisedISO,
      // Catch-up Phase 22: the supplier, AA as agent, the Procedure link, and the run's send stamped at raising.
      procedureIds: [procId],
      ...(supplier !== undefined ? { supplier } : {}),
      agent: AA_AGENT,
    }
    if (masters.parties !== undefined) {
      invoice.delivery = deliveryStampFor(
        invoiceDeliveryFor(acc.counterparty, [build.procedures[procId]!], acc.patientId, masters.patients?.[acc.patientId], masters.parties),
        acc.raisedISO,
        'Billing run',
      )
    }
    build.invoices[invoiceId] = invoice
    build.invoiceLines[ids.invoiceLine(n)] = { id: ids.invoiceLine(n), invoiceId, procedureId: procId, kind: 'fee', description: acc.description, amount: subtotal }

    // --- Xero: contacts + ACCREC + ACCPAY ---
    const payerContactId = opts.resolveContact(contactKind(acc.counterparty), acc.counterparty.id, payerName(acc.counterparty), payerType(acc.counterparty), acc.archivedContact === true)
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
      ...(supplier !== undefined ? { taxInvoice: buyerCreatedTaxInvoiceFor(invoice, supplier) } : {}),
    }

    // The ledger pair (catch-up Phase 36): both legs, the payee stamped, mirrored by the ACCREC and ACCPAY above.
    build.ledger[caseId] = {
      id: caseId,
      kind: 'procedure',
      invoiceId,
      bookingId,
      listId,
      anaesthetistId,
      patientId: acc.patientId,
      procedureIds: [procId],
      procedureShares: [{ procedureId: procId, amountExGst: subtotal }],
      createdAtISO: acc.raisedISO,
      receivable: {
        number: invoice.invoiceNumber,
        counterparty: acc.counterparty,
        amount: acc.total,
        receivedAmount: received,
        ...(paid && acc.paidAtISO !== undefined ? { paidInAtISO: acc.paidAtISO } : {}),
        xeroAccRecId: accRecId,
      },
      payable: {
        number: `${invoice.invoiceNumber}-P`,
        payee: { kind: 'anaesthetist', anaesthetistId },
        amount: amountPayable,
        releasedAmount: paid ? amountPayable : 0,
        disbursedAmount: disbursed,
        issuedAtISO: acc.raisedISO,
        ...(paid && acc.disbursedAtISO !== undefined ? { paidOutAtISO: acc.disbursedAtISO } : {}),
        xeroAccPayId: accPayId,
      },
      ...(acc.accRelated ? { archivedAccRelated: true as const } : {}),
    }

    // --- payments / receipts / disbursements ---
    if (paid && acc.paidAtISO !== undefined) {
      const key = ids.paymentKey(acc.key)
      build.payments[ids.payment(n)] = { id: ids.payment(n), accRecId, amount: acc.total, atISO: acc.paidAtISO, idempotencyKey: key, source: 'webhook' }
      build.receipts[ids.receipt(n)] = {
        id: ids.receipt(n),
        pairId: caseId,
        pairKind: 'procedure',
        anaesthetistId,
        accRecId,
        grossAmount: acc.total,
        gstAmount: gst,
        atISO: acc.paidAtISO,
        idempotencyKey: key,
        source: 'webhook',
      }
      // The bill payment's key (catch-up Phase 37): the ledger already holds it, so replaying it is a no-op.
      const billPayKey = `BILLPAY-${ids.disbursement(n)}`
      if (acc.disbursedAtISO !== undefined) {
        build.disbursements[ids.disbursement(n)] = { id: ids.disbursement(n), accPayId, amount: amountPayable, atISO: acc.disbursedAtISO, payablesRunId: dsbRunId, idempotencyKey: billPayKey }
      }
      // The ledger's record of the payment out (every paid account was paid out in full), learned at a poll before the demo day.
      build.ledgerDisbursements[ids.ledgerDisbursement(n)] = {
        id: ids.ledgerDisbursement(n),
        pairId: caseId,
        anaesthetistId,
        amount: amountPayable,
        atISO: acc.disbursedAtISO ?? acc.paidAtISO,
        payablesRunId: dsbRunId,
        ...(acc.disbursedAtISO !== undefined ? { xeroDisbursementId: ids.disbursement(n) } : {}),
        idempotencyKey: billPayKey,
        detectedBy: 'poll',
      }
    } else if (acc.paidState === 'missedWebhook') {
      // An unmirrored PaymentIn: Xero recorded it but no receipt exists, so the
      // ACCREC still reads unpaid until the reconciliation poll catches it.
      const key = `HIST-MISSED-${acc.key}`
      build.payments[ids.payment(n)] = { id: ids.payment(n), accRecId, amount: acc.total, atISO: acc.paidAtISO ?? acc.raisedISO, idempotencyKey: key, source: 'webhook' }
    }
  }

}
