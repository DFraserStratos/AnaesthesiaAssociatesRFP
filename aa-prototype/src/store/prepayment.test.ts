/**
 * Pre-payment tests (Phase 09; B7), reworked for catch-up Phase 15a (D5, OQ-57,
 * US-06.3.2 "No block", US-13.7.1 "Never blocks").
 *
 * An unpaid selfFundedPrepayment booking is NOT blocked: it completes, saves,
 * submits and authorises while carrying the strong before-procedure
 * `prepaymentUnpaid` warning. Raising the pre-invoice changes the warning's
 * text; paying it removes the warning. `raisePreProcedureInvoice` is
 * office-only, idempotent, and refused once the List is authorised. The balance
 * run bills the remainder (deposit + balance = the full self funded fee).
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, completeBooking, completionBlockersFor, editBooking, submitList } from './lifecycle'
import { raisePreProcedureInvoice } from './prepaymentActions'
import { runBillingForList } from './billingRun'
import { billingMonitor, bookingsForList, prePaymentInvoicesForBooking, prepaymentStatusFor } from './selectors'
import { warningsForBooking } from './warnings'
import type { Actor } from './mutate'
import { SEED_MARKERS } from '../domain/seed'
import { PREPAYMENT_REQUIRED_TEXT, PREPAYMENT_UNPAID_TEXT } from '../domain/warnings'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }

function store(): BoundAppStore {
  return createAppStore()
}
function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}
function listOf(api: BoundAppStore, bookingId: string): string {
  const booking = api.getState().schedule.bookings[bookingId]
  if (booking === undefined) throw new Error(`missing booking ${bookingId}`)
  return booking.listId
}
/** Complete every other open Booking on the List, so submit is possible. */
function completeSiblings(api: BoundAppStore, actor: Actor, bookingId: string): void {
  for (const b of bookingsForList(api.getState(), listOf(api, bookingId))) {
    if (b.id === bookingId || b.completed || b.cancellation !== undefined) continue
    expect(completeBooking(api, actor, b.id)).toMatchObject({ ok: true })
  }
}
function prepaymentWarnings(api: BoundAppStore, bookingId: string) {
  return warningsForBooking(api.getState(), bookingId).filter((w) => w.ruleId === 'prepaymentUnpaid')
}

describe('an unpaid prepayment never blocks (D5)', () => {
  it('Riley carries the strong before-procedure warning and has no prepayment blocker', () => {
    const api = store()
    const riley = marker('prepaymentBooking')
    expect(prepaymentStatusFor(api.getState(), riley)).toBe('required')
    const blockers = completionBlockersFor(api.getState(), api.getState().schedule.bookings[riley]!)
    expect(blockers).toEqual([])
    expect(prepaymentWarnings(api, riley)).toEqual([
      expect.objectContaining({ kind: 'beforeProcedure', strength: 'strong', text: PREPAYMENT_REQUIRED_TEXT }),
    ])
  })

  it('completes as the anaesthetist, saves an edit, submits and authorises, with the warning still raised', () => {
    const api = store()
    const riley = marker('prepaymentBooking')
    const listId = listOf(api, riley)
    expect(completeBooking(api, SOUTER, riley)).toMatchObject({ ok: true })
    expect(api.getState().schedule.bookings[riley]!.completed).toBe(true)
    expect(prepaymentWarnings(api, riley)).toHaveLength(1)
    // US-13.7.1 "saved": an edit to the warned Booking goes through.
    expect(editBooking(api, SOUTER, riley, { notes: 'Patient aware of the prepayment.' })).toMatchObject({ ok: true })
    completeSiblings(api, SOUTER, riley)
    expect(submitList(api, SOUTER, listId)).toMatchObject({ ok: true })
    expect(authoriseList(api, OFFICE, listId)).toMatchObject({ ok: true })
    expect(prepaymentWarnings(api, riley)).toHaveLength(1)
  })

  it('a seeded PAID pre-invoice raises no warning and completes', () => {
    const api = store()
    const paid = marker('prepaymentPaidBooking')
    expect(prepaymentStatusFor(api.getState(), paid)).toBe('paid')
    expect(prepaymentWarnings(api, paid)).toEqual([])
    expect(completeBooking(api, SOUTER, paid).ok).toBe(true)
  })

  it('a non-prepayment booking raises no prepayment warning', () => {
    const api = store()
    const acc = marker('accRelatedBooking')
    expect(prepaymentStatusFor(api.getState(), acc)).toBe('none')
    expect(prepaymentWarnings(api, acc)).toEqual([])
  })

  it('raising the pre-invoice changes the warning text', () => {
    const api = store()
    const riley = marker('prepaymentBooking')
    expect(raisePreProcedureInvoice(api, OFFICE, riley).ok).toBe(true)
    expect(prepaymentWarnings(api, riley).map((w) => w.text)).toEqual([PREPAYMENT_UNPAID_TEXT])
  })
})

describe('raisePreProcedureInvoice', () => {
  it('is office-only and idempotent', () => {
    const api = store()
    const riley = marker('prepaymentBooking')
    expect(raisePreProcedureInvoice(api, SOUTER, riley)).toMatchObject({ ok: false, code: 'officeOnly' })
    const first = raisePreProcedureInvoice(api, OFFICE, riley)
    expect(first.ok).toBe(true)
    const invoices = prePaymentInvoicesForBooking(api.getState(), riley)
    expect(invoices).toHaveLength(1)
    expect(invoices[0]!.kind).toBe('prePayment')
    expect(invoices[0]!.subtotal).toBe(800)
    expect(invoices[0]!.total).toBe(920)
    expect(prepaymentStatusFor(api.getState(), riley)).toBe('outstanding')
    expect(raisePreProcedureInvoice(api, OFFICE, riley)).toMatchObject({ ok: false, code: 'alreadyRaised' })
  })

  it('is refused once the List is authorised (would double charge the balance run)', () => {
    const api = store()
    const paid = marker('prepaymentPaidBooking') // its list has no other bookings to block submit
    expect(completeBooking(api, OFFICE, paid).ok).toBe(true)
    const listId = listOf(api, paid)
    expect(submitList(api, OFFICE, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    expect(raisePreProcedureInvoice(api, OFFICE, paid)).toMatchObject({ ok: false, code: 'listBilled' })
  })
})

describe('balance after a deposit (deposit + balance = the full self funded fee)', () => {
  it('raises the $800 deposit, completes while unpaid, then bills the $400 balance with a visible deduction line', () => {
    const api = store()
    const riley = marker('prepaymentBooking')
    const listId = listOf(api, riley)

    expect(raisePreProcedureInvoice(api, OFFICE, riley).ok).toBe(true)
    expect(completeBooking(api, SOUTER, riley).ok).toBe(true)
    completeSiblings(api, SOUTER, riley)
    expect(submitList(api, OFFICE, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    const run = runBillingForList(api, listId)
    expect(run.ok).toBe(true)

    const state = api.getState()
    const balance = Object.values(state.billing.invoices).filter((i) => i.bookingId === riley && i.kind === 'standard')
    expect(balance).toHaveLength(1)
    expect(balance[0]!.subtotal).toBe(400) // 1200 fee less the 800 deposit
    const lines = Object.values(state.billing.invoiceLines).filter((l) => l.invoiceId === balance[0]!.id)
    expect(lines.some((l) => l.description === 'Less pre-payment deposit already invoiced' && l.amount === -800)).toBe(true)
    // deposit (800) + balance (400) = the full $1,200 self funded fee.
    const deposit = prePaymentInvoicesForBooking(state, riley)[0]!
    expect(deposit.subtotal + balance[0]!.subtotal).toBe(1200)
  })
})

describe('the monitor does not conflate the paid pre-invoice with the run', () => {
  it('a billed mixed + full booking reads invoiced (not paid) and its list counts only run invoices', () => {
    const api = store()
    const paid = marker('prepaymentPaidBooking')
    const listId = listOf(api, paid)
    expect(completeBooking(api, OFFICE, paid).ok).toBe(true)
    expect(submitList(api, OFFICE, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    expect(runBillingForList(api, listId).ok).toBe(true)

    const rows = billingMonitor(api.getState())
    const listRow = rows.find((r) => r.listId === listId)
    expect(listRow).toBeDefined()
    // The run produced ONE hospital invoice (the full pre-payment procedure nets to $0);
    // the seeded PAID pre-invoice is NOT counted as run output.
    expect(listRow!.invoiceCount).toBe(1)
    const bookingRow = listRow!.bookingRows.find((c) => c.bookingId === paid)
    expect(bookingRow).toBeDefined()
    // The booking's run status is 'invoiced' (the unpaid hospital invoice), NOT 'paid'
    // (which the seeded deposit case would have masked before the fix).
    expect(bookingRow!.status).toBe('invoiced')
  })
})
