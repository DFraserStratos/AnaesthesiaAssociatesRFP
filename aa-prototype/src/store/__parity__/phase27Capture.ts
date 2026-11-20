/**
 * Catch-up Phase 27 parity capture (work item 1): the prepayment figures, as
 * the build stood before the phase, written once into
 * `phase-27-baseline.json` by `phase27Parity.test.ts`. Never run with `-u`.
 *
 * - every seeded Booking's prepayment status and its open prepayment warnings;
 * - Dr Souter's Fri 24 PM run (Nair, the mixed Booking): every invoice raised;
 * - the payables due per anaesthetist on a fresh store;
 * - the pair shape of a prepayment invoice: the seeded INV0001 and one raised
 *   live for Riley (ACCREC and DRAFT ACCPAY fields, the link between them).
 *
 * The S3, S5 and S4 billing-failure invoices are pinned by Phase 25's fixture
 * (`phase-25-invoices.json`), which this phase must not move. Imported only by tests.
 */

import { type BoundAppStore } from '../appStore'
import { authoriseList, submitList } from '../lifecycle'
import { completeAnswered } from '../../test/completeAnswered'
import { runBillingForList } from '../billingRun'
import { bookingsForList } from '../selectors'
import { warningsForBooking } from '../warnings'
import { SEED_LIST_IDS, SEED_MARKERS } from '../../domain/seed'
import type { Actor } from '../mutate'
import type { AppState } from '../appStore'
import { isBookingPair } from '../../domain/billing/ledger'
import type { BookingLedgerPair } from '../../domain/types'
import { oldCaseStatus } from './phase25Capture'
import { storeWithoutPhase40 } from './phase40Declared'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

export interface PairRow27 {
  invoiceNumber: string
  counterparty: string
  subtotal: number
  gst: number
  total: number
  lines: { procedureId: string | null; description: string; amount: number }[]
  accRec: { contact: string; contactType: string; invoiceNumber: string; reference: string; amountDue: number; amountReceived: number; status: string } | null
  accPay: { contact: string; contactType: string; invoiceNumber: string; reference: string; linked: boolean; anaesthetistId: string; amountPayable: number; amountAuthorised: number; amountDisbursed: number; status: string; taxInvoice: boolean } | null
  caseStatus: string | null
}

export interface Phase27Capture {
  statuses: { bookingId: string; status: string; warnings: string[] }[]
  nairRun: { ok: boolean; invoices: { invoiceNumber: string; counterparty: string; lines: { procedureId: string | null; description: string; amount: number }[]; subtotal: number; gst: number; total: number }[] }
  payablesDue: { anaesthetistId: string; total: number }[]
  seededPair: PairRow27[]
  livePair: PairRow27[]
}

function pairRows(state: AppState, bookingId: string): PairRow27[] {
  return Object.values(state.billing.invoices)
    .filter((i) => i.bookingId === bookingId && i.kind === 'prePayment')
    .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))
    .map((i) => {
      // Catch-up Phase 36: the invoice's ledger pair (was its billing case); its Xero ids are on the legs.
      const c = Object.values(state.billing.ledger).find((x): x is BookingLedgerPair => isBookingPair(x) && x.invoiceId === i.id)
      const rec = c?.receivable.xeroAccRecId !== undefined ? state.xero.accRecs[c.receivable.xeroAccRecId] : undefined
      const pay = c?.payable?.xeroAccPayId !== undefined ? state.xero.accPays[c.payable.xeroAccPayId] : undefined
      const contact = (id: string) => state.xero.contacts[id]
      return {
        invoiceNumber: i.invoiceNumber,
        counterparty: `${i.counterparty.kind}:${i.counterparty.id}`,
        subtotal: i.subtotal,
        gst: i.gst,
        total: i.total,
        lines: Object.values(state.billing.invoiceLines)
          .filter((l) => l.invoiceId === i.id)
          .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
          .map((l) => ({ procedureId: l.procedureId ?? null, description: l.description, amount: l.amount })),
        accRec: rec === undefined ? null : { contact: contact(rec.contactId)?.name ?? rec.contactId, contactType: contact(rec.contactId)?.type ?? '', invoiceNumber: rec.invoiceNumber, reference: rec.reference, amountDue: rec.amountDue, amountReceived: rec.amountReceived, status: rec.status },
        accPay:
          pay === undefined
            ? null
            : {
                contact: contact(pay.contactId)?.name ?? pay.contactId,
                contactType: contact(pay.contactId)?.type ?? '',
                invoiceNumber: pay.invoiceNumber,
                reference: pay.reference,
                linked: pay.accRecId === rec?.id,
                anaesthetistId: pay.anaesthetistId,
                amountPayable: pay.amountPayable,
                amountAuthorised: pay.amountAuthorised,
                amountDisbursed: pay.amountDisbursed,
                status: pay.status,
                taxInvoice: pay.taxInvoice !== undefined,
              },
        caseStatus: c !== undefined ? oldCaseStatus(c) : null,
      }
    })
}

/** Capture the figures. `raise` invoices Riley's prepayment live (the office's raise before 27, Approve and send after). */
export function capturePhase27(raise: (api: BoundAppStore, bookingId: string) => void): Phase27Capture {
  const api = storeWithoutPhase40()
  const s0 = api.getState()

  const statuses = Object.values(s0.schedule.bookings)
    .sort((a, b) => a.id.localeCompare(b.id))
    .flatMap((b) => {
      const warnings = warningsForBooking(s0, b.id).filter((w) => w.ruleId === 'prepaymentUnpaid')
      const hasPrepaid = Object.values(s0.billing.invoices).some((i) => i.bookingId === b.id && i.kind === 'prePayment')
      if (warnings.length === 0 && !hasPrepaid && b.id !== SEED_MARKERS.prepaymentBooking!.entityId) return []
      return [{ bookingId: b.id, status: hasPrepaid ? 'invoiced' : 'none', warnings: warnings.map((w) => `${w.key} ${w.strength}: ${w.text}`) }]
    })

  const due = new Map<string, number>()
  for (const p of Object.values(s0.xero.accPays)) {
    // What the payables run pays (since Phase 27 it never pays the AA Holding account; no such payable existed before).
    if (p.payeeAccount !== undefined) continue
    const inc = Math.round((p.amountAuthorised - p.amountDisbursed) * 100)
    if (inc > 0) due.set(p.anaesthetistId, (due.get(p.anaesthetistId) ?? 0) + inc)
  }
  const payablesDue = [...due.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([anaesthetistId, cents]) => ({ anaesthetistId, total: cents / 100 }))

  const nairBooking = SEED_MARKERS.prepaymentPaidBooking!.entityId
  const seededPair = pairRows(s0, nairBooking)

  // Nair's List: complete, submit, authorise, run.
  const listId = SEED_LIST_IDS.prepaymentPaidList
  const souter: Actor = { who: 'Dr M. Souter', role: 'anaesthetist', source: 'anaesthetist' }
  for (const b of bookingsForList(api.getState(), listId)) completeAnswered(api, souter, b.id)
  submitList(api, souter, listId)
  const authorised = authoriseList(api, OFFICE, listId)
  if (authorised.ok) runBillingForList(api, listId)
  const s1 = api.getState()
  const nairInvoices = Object.values(s1.billing.invoices)
    .filter((i) => i.bookingId === nairBooking && i.kind === 'standard')
    .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))
    .map((i) => ({
      invoiceNumber: i.invoiceNumber,
      counterparty: `${i.counterparty.kind}:${i.counterparty.id}`,
      lines: Object.values(s1.billing.invoiceLines)
        .filter((l) => l.invoiceId === i.id)
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
        .map((l) => ({ procedureId: l.procedureId ?? null, description: l.description, amount: l.amount })),
      subtotal: i.subtotal,
      gst: i.gst,
      total: i.total,
    }))

  const live = storeWithoutPhase40()
  const riley = SEED_MARKERS.prepaymentBooking!.entityId
  raise(live, riley)
  const livePair = pairRows(live.getState(), riley)

  return { statuses, nairRun: { ok: authorised.ok, invoices: nairInvoices }, payablesDue, seededPair, livePair }
}
