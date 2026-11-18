/**
 * Catch-up Phase 25 parity capture (work item 1): the invoices the billing run
 * raises when the S3 Lists (Dr Souter's Mon 20 Jul AM and PM), the S5 List
 * (Dr Whitaker's Fri 17 Jul) and the S4 billing-failure List (Dr Ropata's
 * Thu 16 Jul) are authorised from a fresh seed: party, addressee, supplier,
 * layout, delivery, every line, subtotal, GST and total, and each case's
 * status or failure.
 *
 * Written once, from the engine as Phase 24 left it, into
 * `phase-25-invoices.json` by `phase25Parity.test.ts` (`toMatchFileSnapshot`),
 * BEFORE the lock moved where the numbers come from. Never run with `-u`.
 * Imported only by tests.
 */

import { createAppStore, type BoundAppStore } from '../appStore'
import { authoriseList } from '../lifecycle'
import { runBillingForList } from '../billingRun'
import { bookingsForList } from '../selectors'
import { SEED_LIST_IDS } from '../../domain/seed'
import type { Actor } from '../mutate'
import { isBookingPair, pairStatusLabel } from '../../domain/billing/ledger'
import { toCents } from '../../domain/billing/money'
import type { BookingLedgerPair } from '../../domain/types'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

/** The Lists the fixture authorises, in this order. */
export const PHASE_25_LISTS = [
  SEED_LIST_IDS.souterMon20Am,
  SEED_LIST_IDS.souterMon20Pm,
  SEED_LIST_IDS.whitakerFri17,
  SEED_LIST_IDS.billingFailure,
] as const

export interface InvoiceRow25 {
  invoiceNumber: string
  bookingId: string
  counterparty: string
  billedTo: unknown
  supplier: unknown
  layout: string
  delivery: unknown
  holderReference: string | null
  crossMatch: unknown
  split: unknown
  noCharge: boolean
  procedureIds: string[]
  lines: { procedureId: string | null; kind: string | null; description: string; units: number | null; amount: number; btm: unknown }[]
  subtotal: number
  gst: number
  total: number
}

export interface CaseRow25 {
  bookingId: string
  status: string
  invoiceNumber: string | null
  failure: string | null
}

export interface Phase25Capture {
  lists: { listId: string; ok: boolean; message: string | null; bookings: string[] }[]
  invoices: InvoiceRow25[]
  cases: CaseRow25[]
}

/**
 * Authorise the four Lists in a fresh store, then run each (the run invoked
 * directly) and read back what was raised. `afterAuthorise` runs between the
 * two (the lock's immunity test edits every master there).
 */
export function capturePhase25(afterAuthorise?: (api: BoundAppStore) => void): Phase25Capture {
  const api = createAppStore()
  const lists: Phase25Capture['lists'] = []
  const outcomes = PHASE_25_LISTS.map((listId) => ({ listId, outcome: authoriseList(api, OFFICE, listId) }))
  afterAuthorise?.(api)
  for (const { listId, outcome } of outcomes) {
    if (outcome.ok) runBillingForList(api, listId)
    lists.push({
      listId,
      ok: outcome.ok,
      message: outcome.ok ? null : outcome.message,
      bookings: bookingsForList(api.getState(), listId).map((b) => b.id),
    })
  }
  const state = api.getState()
  const bookingIds = new Set(lists.flatMap((l) => l.bookings))
  const invoices = Object.values(state.billing.invoices)
    .filter((i) => bookingIds.has(i.bookingId) && i.kind === 'standard')
    .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))
  const lines = Object.values(state.billing.invoiceLines).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
  const delivery = (d: (typeof invoices)[number]['delivery']) =>
    d === undefined ? null : d.status === 'sent' ? { status: d.status, method: d.method, to: d.sends[0]?.to ?? null } : d.status === 'toPost' ? { status: d.status, address: d.address } : { status: d.status }
  return {
    lists,
    invoices: invoices.map((i) => ({
      invoiceNumber: i.invoiceNumber,
      bookingId: i.bookingId,
      counterparty: `${i.counterparty.kind}:${i.counterparty.id}`,
      billedTo: i.billedTo ?? null,
      supplier: i.supplier ?? null,
      layout: i.layout,
      delivery: delivery(i.delivery),
      holderReference: i.holderReference ?? null,
      crossMatch: i.crossMatch ?? null,
      split: i.split ?? null,
      noCharge: i.noCharge === true,
      procedureIds: i.procedureIds ?? [],
      lines: lines
        .filter((l) => l.invoiceId === i.id)
        .map((l) => ({ procedureId: l.procedureId ?? null, kind: l.kind ?? null, description: l.description, units: l.units ?? null, amount: l.amount, btm: l.btm ?? null })),
      subtotal: i.subtotal,
      gst: i.gst,
      total: i.total,
    })),
    // Catch-up Phase 36: the Booking's ledger pairs, plus an open billing exception
    // as the old 'failed' case (no invoice), re-expressed as the old case rows.
    cases: [
      ...Object.values(state.billing.ledger)
        .filter((p): p is BookingLedgerPair => isBookingPair(p) && bookingIds.has(p.bookingId))
        .map((p): CaseRow25 => ({ bookingId: p.bookingId, status: oldCaseStatus(p), invoiceNumber: state.billing.invoices[p.invoiceId]?.invoiceNumber ?? null, failure: null })),
      ...Object.values(state.billing.exceptions)
        .filter((x) => bookingIds.has(x.bookingId) && x.resolvedAtISO === undefined)
        .map((x): CaseRow25 => ({ bookingId: x.bookingId, status: 'failed', invoiceNumber: null, failure: `${x.code}: ${x.message}` })),
    ].sort((a, b) => a.bookingId.localeCompare(b.bookingId) || (a.invoiceNumber ?? '').localeCompare(b.invoiceNumber ?? '')),
  }
}

/** The status the pre-Phase 36 billing case would have stored for this pair (a hand-off fault left it 'invoiced'; a part pay-out kept its paid status). */
export function oldCaseStatus(p: BookingLedgerPair): string {
  const s = pairStatusLabel(p)
  if (s === 'handoffFailed') return 'invoiced'
  if (s === 'partPaidOut') return toCents(p.receivable.receivedAmount) >= toCents(p.receivable.amount) ? 'paid' : 'partPaid'
  return s
}
