/**
 * The Finances read models at full scale (Phase 59). This is the one place that wires the store's
 * indexes into `billingStatus.ts` and `invoiceState.ts`: the models themselves never import the store.
 * The generated problem Lists are exactly the ones the full-scale builder marks (as the Billing
 * monitor's "Problems only" test pins them), the invoice rows match the invoices with the backdrop
 * left out, and one pass of each model holds a loose wall-clock bound.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { freshAppState, type AppState } from './appStore'
import { bookingsByList, pairByInvoice, pairsByBooking } from './indexes'
import { invoiceAddresseeName, isBackdropCreditNote, isBackdropInvoice } from './selectors'
import { pendingPrepayments } from './prepaymentSelectors'
import { isBackdropList } from '../domain/conflicts'
import { buildFullScaleDataset, type FullScaleDataset } from '../domain/seed/fullScale'
import { listBillingStatuses, problemListCount, xeroItemsOnLists, type BillingStatusInput, type ListBillingStatus } from '../domain/billing/billingStatus'
import { invoiceRows, type InvoiceRow, type InvoiceStateInput } from '../domain/billing/invoiceState'

const TODAY = '2026-11-24'
let pristine: AppState
let full: FullScaleDataset<AppState>
let state: AppState

function billingInput(s: AppState): BillingStatusInput {
  return {
    lists: s.schedule.lists,
    bookingsByList: bookingsByList(s.schedule.bookings),
    invoices: s.billing.invoices,
    ledger: s.billing.ledger,
    pairsByBooking: pairsByBooking(s.billing.ledger),
    transfers: s.billing.transfers,
    exceptions: s.billing.exceptions,
    xeroQueue: s.billing.xeroQueue,
    xeroDivergences: s.billing.xeroDivergences,
    patients: s.masters.patients,
    anaesthetists: s.masters.anaesthetists,
    hospitals: s.masters.hospitals,
  }
}

function invoiceInput(s: AppState): InvoiceStateInput {
  return {
    invoices: Object.values(s.billing.invoices).filter((i) => !isBackdropInvoice(i)),
    creditNotes: Object.values(s.billing.creditNotes).filter((c) => !isBackdropCreditNote(c)),
    pairByInvoice: pairByInvoice(s.billing.ledger),
    bookings: s.schedule.bookings,
    lists: s.schedule.lists,
    patients: s.masters.patients,
    anaesthetists: s.masters.anaesthetists,
    payerName: (doc) => invoiceAddresseeName(s, doc),
    pendingPrepayments: pendingPrepayments(s),
    todayISO: TODAY,
  }
}

beforeAll(() => {
  pristine = freshAppState()
  full = buildFullScaleDataset(freshAppState(), { todayISO: TODAY })
  state = full.state
}, 120_000)

describe('the Finances read models at full scale', () => {
  let lists: ListBillingStatus[]
  let rows: InvoiceRow[]
  let billingMs = 0
  let invoiceMs = 0

  beforeAll(() => {
    const input = billingInput(state)
    let startedAt = performance.now()
    lists = listBillingStatuses(input)
    billingMs = performance.now() - startedAt
    const invoices = invoiceInput(state)
    startedAt = performance.now()
    rows = invoiceRows(invoices)
    invoiceMs = performance.now() - startedAt
  }, 120_000)

  it('the generated problem Lists are exactly the ones the builder marks (US-13.3.1)', () => {
    const generated = lists.filter((l) => l.hasProblem && pristine.schedule.lists[l.listId] === undefined).map((l) => l.listId)
    expect(generated.sort()).toEqual([...full.problemListIds].sort())
    expect(full.problemListIds.length).toBeGreaterThan(0)
    expect(problemListCount(lists)).toBe(lists.filter((l) => l.hasProblem).length)
  })

  it('every authorised, non-backdrop List has a status, and each generated problem List shows its failed Booking', () => {
    const authorised = Object.values(state.schedule.lists).filter((l) => l.state === 'AUTHORISED' && !isBackdropList(l))
    expect(lists).toHaveLength(authorised.length)
    const byId = new Map(lists.map((l) => [l.listId, l]))
    for (const id of full.problemListIds) {
      const list = byId.get(id)
      expect(list?.bucket).toBe('problems')
      expect(list?.bookings.some((b) => b.problem?.kind === 'billingException' && b.problem.fix === 'retry')).toBe(true)
    }
  })

  it('every open Xero item on an authorised List ties to a List that has a problem (D109)', () => {
    const { byList } = xeroItemsOnLists(billingInput(state))
    const problem = new Set(lists.filter((l) => l.hasProblem).map((l) => l.listId))
    for (const listId of byList.keys()) expect(problem.has(listId)).toBe(true)
  })

  it('one invoice row per invoice and credit note with the backdrop left out, plus the prepayments awaiting approval (US-08.4.7)', () => {
    const input = invoiceInput(state)
    expect(rows).toHaveLength(input.invoices.length + input.creditNotes.length + input.pendingPrepayments.length)
    const aaFee = new Set(Object.values(state.billing.aaFeeInvoices).map((f) => f.invoiceNumber))
    expect(rows.some((r) => r.number !== undefined && aaFee.has(r.number))).toBe(false)
    expect(rows.every((r) => r.owing >= 0)).toBe(true)
  })

  it('one pass of each model holds a loose wall-clock bound', () => {
    expect(billingMs).toBeLessThan(5_000)
    expect(invoiceMs).toBeLessThan(5_000)
  })
})
