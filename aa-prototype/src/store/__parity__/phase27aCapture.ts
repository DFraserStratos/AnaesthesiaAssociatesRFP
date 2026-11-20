/**
 * Catch-up Phase 27a parity capture (work item 1): the money figures the AA
 * Holding account and its transfer must not move, as the build stood before
 * the phase, written once into `phase-27a-baseline.json` by
 * `phase27aParity.test.ts`. Never run with `-u`.
 *
 * - the payables due per anaesthetist on a fresh store;
 * - Dr Souter's seeded fee history (May, June) and every active anaesthetist's
 *   July fee preview, fresh and after S3 Beat 3 (both Mon 20 Lists authorised,
 *   AA-2026-0005 paid in full);
 * - S4 Beat 5: Hemi Walker's clean-sibling invoice on the billing-failure List,
 *   paid half then in full, each followed by a payables run;
 * - the prepayment pair's shape field for field (US-09.1.3): the seeded INV0001
 *   and Riley's, raised live by Approve and send;
 * - the payables due once Nair's Fri 24 PM List is authorised (the transfer
 *   moves this one on purpose).
 *
 * S3 Beats 2 and 3's invoices are pinned by Phase 25's fixture. Imported only by tests.
 */

import { type BoundAppStore } from '../appStore'
import { wireBillingRun } from '../billingRun'
import { authoriseList, submitList } from '../lifecycle'
import { completeAnswered } from '../../test/completeAnswered'
import { approveAllPrepayments } from '../../test/approvePrepayments'
import { receivePayment } from '../paymentActions'
import { runThisWeeksCycle } from '../payablesActions'
import { stageBillingFailure } from '../demoStaging'
import { aaFeeInvoicesFor, aaFeeRunPreview, bookingsForList } from '../selectors'
import { ANAE, SEED_LIST_IDS, SEED_MARKERS } from '../../domain/seed'
import { projectedListId } from '../../domain/slots'
import { roundToCents, toCents } from '../../domain/billing/money'
import type { Actor } from '../mutate'
import type { AppState } from '../appStore'
import { isBookingPair, payeeAnaesthetistOf } from '../../domain/billing/ledger'
import type { BookingLedgerPair } from '../../domain/types'
import { oldCaseStatus } from './phase25Capture'
import { storeWithoutPhase40 } from './phase40Declared'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr M. Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }

export interface FeeRow27a {
  anaesthetistId: string
  bctiCount: number
  subtotal: number
  total: number
}

export interface PairShape27a {
  invoiceNumber: string
  counterparty: string
  total: number
  accRec: Record<string, unknown> | null
  accPay: Record<string, unknown> | null
  caseStatus: string | null
  caseMoney: { received: number; authorised: number; disbursed: number } | null
}

export interface RunRow27a {
  disbursedCount: number
  totalDisbursed: number
}

export interface Phase27aCapture {
  payablesDue: { anaesthetistId: string; total: number }[]
  souterFeeHistory: { monthISO: string; bctiCount: number; subtotal: number; total: number; status: string }[]
  julyFresh: FeeRow27a[]
  julyAfterS3: FeeRow27a[]
  beat5: { invoiceNumber: string; half: RunRow27a; full: RunRow27a; disbursed: number }
  seededPair: PairShape27a[]
  livePair: PairShape27a[]
  nairAuthorisedDue: { anaesthetistId: string; total: number }[]
}

/** What the payables run would pay now, per anaesthetist: every payable it pays (authorised less disbursed). */
export function payablesDueByAnaesthetist(state: AppState): { anaesthetistId: string; total: number }[] {
  const due = new Map<string, number>()
  for (const p of Object.values(state.xero.accPays)) {
    if (p.payeeAccount !== undefined) continue
    const inc = toCents(p.amountAuthorised - p.amountDisbursed)
    if (inc > 0) due.set(p.anaesthetistId, (due.get(p.anaesthetistId) ?? 0) + inc)
  }
  // The transferred payables (27a): absent from the build the baseline was written from.
  // Catch-up Phase 36: a transfer is a `LedgerTransfer`, its anaesthetist payable the `in` leg.
  for (const t of Object.values(state.billing.transfers)) {
    const to = payeeAnaesthetistOf(t.in)
    const inc = toCents(t.in.releasedAmount - t.in.disbursedAmount)
    if (to !== undefined && inc > 0) due.set(to, (due.get(to) ?? 0) + inc)
  }
  return [...due.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([anaesthetistId, cents]) => ({ anaesthetistId, total: cents / 100 }))
}

/** An invoice's ledger pair (catch-up Phase 36; was its billing case). */
function pairOfInvoice(state: AppState, invoiceId: string): BookingLedgerPair | undefined {
  return Object.values(state.billing.ledger).find((x): x is BookingLedgerPair => isBookingPair(x) && x.invoiceId === invoiceId)
}

function julyPreview(state: AppState): FeeRow27a[] {
  return aaFeeRunPreview(state, '2026-07').map((r) => ({ anaesthetistId: r.anaesthetistId, bctiCount: r.bctiCount, subtotal: r.subtotal, total: r.total }))
}

function pairShapes(state: AppState, bookingId: string): PairShape27a[] {
  return Object.values(state.billing.invoices)
    .filter((i) => i.bookingId === bookingId && i.kind === 'prePayment')
    .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))
    .map((i) => {
      // Catch-up Phase 36: the invoice's ledger pair (was its billing case); its Xero ids are on the legs.
      const c = pairOfInvoice(state, i.id)
      const rec = c?.receivable.xeroAccRecId !== undefined ? state.xero.accRecs[c.receivable.xeroAccRecId] : undefined
      const pay = c?.payable?.xeroAccPayId !== undefined ? state.xero.accPays[c.payable.xeroAccPayId] : undefined
      const contact = (id: string) => state.xero.contacts[id]
      return {
        invoiceNumber: i.invoiceNumber,
        counterparty: `${i.counterparty.kind}:${i.counterparty.id}`,
        total: i.total,
        accRec:
          rec === undefined
            ? null
            : {
                kind: rec.kind,
                contactType: contact(rec.contactId)?.type ?? '',
                contactNumber: contact(rec.contactId)?.contactNumber ?? '',
                invoiceNumber: rec.invoiceNumber,
                reference: rec.reference,
                amountDue: rec.amountDue,
                amountReceived: rec.amountReceived,
                status: rec.status,
                paid: rec.paidAtISO !== undefined,
              },
        accPay:
          pay === undefined
            ? null
            : {
                contact: contact(pay.contactId)?.name ?? pay.contactId,
                contactType: contact(pay.contactId)?.type ?? '',
                contactNumber: contact(pay.contactId)?.contactNumber ?? '',
                invoiceNumber: pay.invoiceNumber,
                reference: pay.reference,
                linked: pay.accRecId === rec?.id,
                anaesthetistId: pay.anaesthetistId,
                amountPayable: pay.amountPayable,
                amountAuthorised: pay.amountAuthorised,
                amountDisbursed: pay.amountDisbursed,
                status: pay.status,
                payeeAccount: pay.payeeAccount ?? null,
                taxInvoice: pay.taxInvoice?.relatesToInvoiceNumber ?? null,
              },
        caseStatus: c !== undefined ? oldCaseStatus(c) : null,
        caseMoney: c === undefined ? null : { received: c.receivable.receivedAmount, authorised: c.payable?.releasedAmount ?? 0, disbursed: c.payable?.disbursedAmount ?? 0 },
      }
    })
}

function withWiredRun<T>(api: BoundAppStore, run: () => T): T {
  const unwire = wireBillingRun(api)
  try {
    return run()
  } finally {
    unwire()
  }
}

function runRow(api: BoundAppStore): RunRow27a {
  // (catch-up Phase 39a: the office's weekly cycle; nothing due is a refusal now, which paid nothing before too.)
  const out = runThisWeeksCycle(api, OFFICE)
  if (!out.ok && out.code === 'nothingDue') return { disbursedCount: 0, totalDisbursed: 0 }
  return out.ok ? { disbursedCount: out.value.disbursedCount, totalDisbursed: out.value.totalDisbursed } : { disbursedCount: -1, totalDisbursed: -1 }
}

export function capturePhase27a(): Phase27aCapture {
  const fresh = storeWithoutPhase40()
  const s0 = fresh.getState()

  const souterFeeHistory = aaFeeInvoicesFor(s0, ANAE.souter)
    .map((f) => ({ monthISO: f.monthISO, bctiCount: f.bctiCount, subtotal: f.subtotal, total: f.total, status: f.status }))
    .sort((a, b) => a.monthISO.localeCompare(b.monthISO))

  // S3 Beats 2 and 3: both Mon 20 Lists authorised, then AA-2026-0005 paid in full.
  const s3 = storeWithoutPhase40()
  withWiredRun(s3, () => {
    authoriseList(s3, OFFICE, projectedListId(ANAE.souter, '2026-07-20', 'AM'))
    authoriseList(s3, OFFICE, projectedListId(ANAE.souter, '2026-07-20', 'PM'))
  })
  const nib = Object.values(s3.getState().billing.invoices).find((i) => i.invoiceNumber === 'AA-2026-0005')
  const nibCase = nib !== undefined ? pairOfInvoice(s3.getState(), nib.id) : undefined
  if (nibCase?.receivable.xeroAccRecId !== undefined) {
    receivePayment(s3, { accRecId: nibCase.receivable.xeroAccRecId, amount: nib!.total, idempotencyKey: 'PARITY-27A-S3', source: 'webhook' })
  }

  // S4 Beat 5: the billing failure staged, then Hemi Walker's clean-sibling invoice paid half, run, full, run.
  const s4 = storeWithoutPhase40()
  withWiredRun(s4, () => stageBillingFailure(s4))
  const losa = SEED_MARKERS['billingFailureBooking']!.entityId
  const hemiBooking = bookingsForList(s4.getState(), SEED_LIST_IDS.billingFailure).find((b) => b.id !== losa && b.cancellation === undefined)!
  const hemiInvoice = Object.values(s4.getState().billing.invoices).find((i) => i.bookingId === hemiBooking.id)!
  const hemiCase = () => pairOfInvoice(s4.getState(), hemiInvoice.id)!
  const half = roundToCents(hemiInvoice.total / 2)
  receivePayment(s4, { accRecId: hemiCase().receivable.xeroAccRecId!, amount: half, idempotencyKey: 'PARITY-27A-HALF', source: 'webhook' })
  const halfRun = runRow(s4)
  receivePayment(s4, { accRecId: hemiCase().receivable.xeroAccRecId!, amount: roundToCents(hemiInvoice.total - half), idempotencyKey: 'PARITY-27A-REST', source: 'webhook' })
  const fullRun = runRow(s4)

  // Riley's prepayment raised live by Approve and send.
  const live = storeWithoutPhase40()
  const riley = SEED_MARKERS.prepaymentBooking!.entityId
  approveAllPrepayments(live, riley)

  // Nair's Fri 24 PM List completed, submitted and authorised (the wired run).
  const nair = storeWithoutPhase40()
  const listId = SEED_LIST_IDS.prepaymentPaidList
  for (const b of bookingsForList(nair.getState(), listId)) completeAnswered(nair, SOUTER, b.id)
  submitList(nair, SOUTER, listId)
  withWiredRun(nair, () => authoriseList(nair, OFFICE, listId))

  return {
    payablesDue: payablesDueByAnaesthetist(s0),
    souterFeeHistory,
    julyFresh: julyPreview(s0),
    julyAfterS3: julyPreview(s3.getState()),
    beat5: { invoiceNumber: hemiInvoice.invoiceNumber, half: halfRun, full: fullRun, disbursed: hemiCase().payable?.disbursedAmount ?? 0 },
    seededPair: pairShapes(s0, SEED_MARKERS.prepaymentPaidBooking!.entityId),
    livePair: pairShapes(live.getState(), riley),
    nairAuthorisedDue: payablesDueByAnaesthetist(nair.getState()),
  }
}
