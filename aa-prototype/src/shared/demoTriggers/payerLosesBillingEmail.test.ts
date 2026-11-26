/**
 * "Payer loses billing email" (build plan Phase 60, item 9; D116): staged on a
 * fresh store wired as the app is, the Booking fails whole at the run, sits in
 * the Billing tab's Problems with no invoice, and Fix the payer then Retry
 * bills it and resolves the failure. The trigger then reads Already triggered.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAppStore, type AppState, type BoundAppStore } from '../../store/appStore'
import { wireBillingRun } from '../../store/billingRun'
import { fixBookingPayer } from '../../store/billingFix'
import { OFFICE_ACTOR } from '../../store/demoActors'
import { bookingsByList, pairsByBooking } from '../../store/indexes'
import { listBillingStatuses, PAYER_NO_ADDRESS_CODE, type BillingStatusInput } from '../../domain/billing/billingStatus'
import {
  PAYER_CONTACT_CLEARED_ACTION,
  PAYER_LOSES_BILLING_EMAIL,
  PAYER_LOSES_BILLING_EMAIL_ALREADY,
  PAYER_LOSES_BILLING_EMAIL_DONE,
  payerLosesBillingEmailDisabledReason,
  payerLosesBillingEmailTarget,
  stagePayerLosesBillingEmail,
} from './payerLosesBillingEmail'

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

const invoicesFor = (s: AppState, bookingId: string) => Object.values(s.billing.invoices).filter((i) => i.bookingId === bookingId)

let api: BoundAppStore
let unwire: () => void
beforeEach(() => {
  api = createAppStore()
  unwire = wireBillingRun(api)
})
afterEach(() => unwire())

describe('Payer loses billing email (Phase 60, D116)', () => {
  it('names the entry the join registers', () => {
    expect(PAYER_LOSES_BILLING_EMAIL.id).toBe('payer-loses-billing-email')
    expect(PAYER_LOSES_BILLING_EMAIL.label).toBe('Payer loses billing email')
    expect(PAYER_LOSES_BILLING_EMAIL.indexPath()).toBe('/admin/finances/billing')
  })

  it('picks a Booking about to be billed whose payer can be reached, and can run', () => {
    const state = api.getState()
    const target = payerLosesBillingEmailTarget(state)
    // The seed has no authorised, unbilled List and every SUBMITTED one is scripted, so a finished ACTIVE List's patient-billed Booking.
    expect(target).toEqual({ listId: 'L-46822-2026-11-23-AM', bookingId: 'BK0070', payer: { kind: 'patient', patientId: 'PT0062' } })
    const list = state.schedule.lists[target!.listId]!
    expect(list.billedAtISO).toBeUndefined()
    expect(list.state).toBe('ACTIVE')
    expect(list.dateISO < state.clock.todayISO).toBe(true)
    expect(state.schedule.bookings[target!.bookingId]?.listId).toBe(target!.listId)
    expect(payerLosesBillingEmailDisabledReason(state)).toBeUndefined()
  })

  it('fails the Booking whole into Problems; Fix the payer then Retry bills it', () => {
    const target = payerLosesBillingEmailTarget(api.getState())!
    const staged = stagePayerLosesBillingEmail(api)
    expect(staged).toEqual({ ok: true, message: PAYER_LOSES_BILLING_EMAIL_DONE })

    let s = api.getState()
    expect(s.schedule.lists[target.listId]?.billedAtISO).toBeDefined()
    expect(s.audit.some((e) => e.action === PAYER_CONTACT_CLEARED_ACTION && e.who === 'Demo actions')).toBe(true)
    const exception = Object.values(s.billing.exceptions).find((x) => x.bookingId === target.bookingId && x.resolvedAtISO === undefined)
    expect(exception?.code).toBe(PAYER_NO_ADDRESS_CODE)
    expect(invoicesFor(s, target.bookingId)).toEqual([])

    const listStatus = listBillingStatuses(billingInput(s)).find((l) => l.listId === target.listId)
    expect(listStatus?.hasProblem).toBe(true)
    expect(listStatus?.bookings.find((b) => b.bookingId === target.bookingId)?.bucket).toBe('problems')
    expect(payerLosesBillingEmailDisabledReason(s)).toBe(PAYER_LOSES_BILLING_EMAIL_ALREADY)

    const fixed = fixBookingPayer(api, OFFICE_ACTOR, exception!.id, { email: 'billing.fixed@example.co.nz' })
    expect(fixed.ok).toBe(true)
    s = api.getState()
    expect(s.billing.exceptions[exception!.id]?.resolvedAtISO).toBeDefined()
    const raised = invoicesFor(s, target.bookingId)
    expect(raised.length).toBeGreaterThan(0)
    for (const invoice of raised) {
      expect(invoice.delivery).toMatchObject({ method: 'email', status: 'sent' })
      const delivery = invoice.delivery
      if (delivery?.method === 'email' && delivery.status === 'sent') expect(delivery.sends.at(-1)?.to).toBe('billing.fixed@example.co.nz')
    }
    const after = listBillingStatuses(billingInput(s)).find((l) => l.listId === target.listId)
    expect(after?.bookings.find((b) => b.bookingId === target.bookingId)?.bucket).not.toBe('problems')

    expect(payerLosesBillingEmailDisabledReason(s)).toBe(PAYER_LOSES_BILLING_EMAIL_ALREADY)
    expect(stagePayerLosesBillingEmail(api).ok).toBe(false)
  })

  it('stages the same Booking from the same seed (deterministic)', () => {
    const other = createAppStore()
    expect(payerLosesBillingEmailTarget(other.getState())).toEqual(payerLosesBillingEmailTarget(api.getState()))
  })
})
