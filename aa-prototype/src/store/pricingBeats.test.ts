/**
 * Catch-up Phase 24 session 2's beats in the store (work items 9, 11 and 12;
 * US-05.2.8, US-03.5.1, US-05.4.3): the backdated range trigger, the no-charge
 * invoice, no difference invoice on a held prepaid price, and the discount as
 * its own invoice line.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, completeBooking, editProcedure, submitList } from './lifecycle'
import { handoffListCases, runBillingForList } from './billingRun'
import { addBackdatedRangeDemo, backdatedRangeAdded } from './demoBackdatedRange'
import { addPriceRange } from './contractActions'
import { confirmNoModifiers } from './modifierActions'
import { bctiRecords, billingContextForBooking, bookingsForList, proceduresForBooking } from './selectors'
import { OFFICE_ACTOR } from './demoActors'
import { bookingFeeView } from './__parity__/phase24Fees'
import { buildInvoicesForBooking } from '../domain/billing/invoiceBuild'
import { anaesthetistMayTypePrice } from '../domain/billing/procedurePrice'
import { listHospitalFor } from '../domain/listPairing'
import { MERIVALE_FACE_LIFT_BOOKING_ID, SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'
import type { AssignedList } from '../domain/types'

const marker = (key: string) => SEED_MARKERS[key]!.entityId

function totalOf(api: BoundAppStore, bookingId: string): number {
  const s = api.getState()
  const booking = s.schedule.bookings[bookingId]!
  return bookingFeeView(s, s.schedule.lists[booking.listId] as AssignedList, booking).total
}

describe("the backdated range trigger on Merivale's Face lift (item 12; US-05.2.8)", () => {
  it('re-prices only the unedited Face lift Bookings; the typed, the AUTHORISED and the prepaid stay put; once only', () => {
    const api = createAppStore()
    const unedited = [MERIVALE_FACE_LIFT_BOOKING_ID, marker('movableFixedBooking')]
    const held = { typed: marker('rangeTypedBooking'), authorised: marker('rangeAuthorisedBooking'), prepaid: marker('rangePrepaidBooking') }
    const before = Object.fromEntries([...unedited, ...Object.values(held)].map((id) => [id, totalOf(api, id)]))
    expect(unedited.map((id) => before[id])).toEqual([3100, 3100])
    expect(before[held.typed]).toBe(2950)
    expect(before[held.authorised]).toBe(3100)
    expect(backdatedRangeAdded(api.getState())).toBe(false)

    expect(addBackdatedRangeDemo(api).ok).toBe(true)
    expect(unedited.map((id) => totalOf(api, id))).toEqual([3300, 3300])
    for (const id of Object.values(held)) expect(totalOf(api, id), id).toBe(before[id])
    expect(addBackdatedRangeDemo(api)).toMatchObject({ ok: false, code: 'alreadyAdded' })
  })
})

describe('the seed honours the gates (item 11)', () => {
  it("no seeded typed price an anaesthetist entered sits where her gate refuses it", () => {
    const api = createAppStore()
    const s = api.getState()
    const byAnaesthetist = s.audit.filter((a) => a.action === 'procedure.price' && a.role === 'anaesthetist')
    expect(byAnaesthetist.length).toBeGreaterThan(0)
    for (const entry of byAnaesthetist) {
      const p = s.schedule.procedures[entry.entityId]!
      const contract = p.governingContractId !== undefined ? s.masters.contracts[p.governingContractId] : undefined
      expect(anaesthetistMayTypePrice(contract).may, p.id).toBe(true)
    }
  })
})

describe('a $0 price raises a no-charge invoice (item 9; US-03.5.1)', () => {
  it('authorising the no-charge List raises a $0.00 "No charge" invoice, its receivable $0.00 and paid, no payable and no BCTI', () => {
    const api = createAppStore()
    const listId = SEED_LIST_IDS.multiProcedure
    const bookingId = marker('noChargeBooking')
    const bctisBefore = bctiRecords(api.getState()).length
    expect(authoriseList(api, OFFICE_ACTOR, listId).ok).toBe(true)
    const run = runBillingForList(api, listId)
    expect(run.ok).toBe(true)
    handoffListCases(api, listId)
    const s = api.getState()
    const invoices = Object.values(s.billing.invoices).filter((i) => i.bookingId === bookingId)
    expect(invoices).toHaveLength(1)
    expect(invoices[0]).toMatchObject({ noCharge: true, subtotal: 0, gst: 0, total: 0, kind: 'standard' })
    // Units recorded: the line keeps its RVG units for reference (US-03.5.2).
    const lines = Object.values(s.billing.invoiceLines).filter((l) => l.invoiceId === invoices[0]!.id)
    expect(lines.map((l) => [l.kind, l.amount])).toEqual([['fee', 0]])
    expect(lines[0]!.units).toBeGreaterThan(0)
    const theCase = Object.values(s.billing.cases).find((c) => c.invoiceId === invoices[0]!.id)!
    expect(theCase.accPayId).toBeUndefined()
    expect(s.xero.accRecs[theCase.accRecId!]).toMatchObject({ amountDue: 0, status: 'paid' })
    // Nothing owed: the case reads paid, stamped, and nothing is disbursed.
    expect(theCase).toMatchObject({ status: 'paid' })
    expect(theCase.paidInAtISO).toBeDefined()
    expect(theCase.disbursedAtISO).toBeUndefined()
    // The three-procedure Booking on the same List still bills and pairs as before.
    const other = Object.values(s.billing.invoices).filter((i) => i.bookingId === marker('multiProcedureBooking'))
    expect(other.length).toBeGreaterThan(0)
    expect(bctiRecords(s).length).toBe(bctisBefore + other.length)
  })

  it('a group of only prepaid Procedures netted to $0 still raises none (left off the final invoice, D57)', () => {
    const api = createAppStore()
    const bookingId = marker('rangePrepaidBooking')
    const s = api.getState()
    const booking = s.schedule.bookings[bookingId]!
    const list = s.schedule.lists[booking.listId]!
    const ctx = billingContextForBooking(s, booking)!
    const prePaid = Object.fromEntries(
      Object.values(s.billing.invoiceLines)
        .filter((l) => s.billing.invoices[l.invoiceId]?.kind === 'prePayment' && l.procedureId !== undefined)
        .map((l) => [l.procedureId!, { amount: l.amount, counterparty: s.billing.invoices[l.invoiceId]!.counterparty }]),
    )
    const built = buildInvoicesForBooking(booking, proceduresForBooking(s, bookingId), { ...ctx, listDateISO: list.dateISO, patientId: booking.patientId, ...listHospitalFor(list, s.masters.hospitals), prePaidByProcedure: prePaid })
    expect(built.kind).toBe('invoices')
    if (built.kind !== 'invoices') return
    expect(built.invoices.some((i) => i.noCharge === true)).toBe(false)
  })
})

describe('no difference invoice ever (US-05.2.8)', () => {
  it('a prepaid Procedure whose prepayment is raised keeps its price when a range arrives; its final run bills no balance or credit for it', () => {
    const api = createAppStore()
    const bookingId = marker('rangePrepaidBooking')
    const prepaid = proceduresForBooking(api.getState(), bookingId).find((p) => p.governingContractId === 'CT-SOUTER-RHINO-COS')!
    const before = totalOf(api, bookingId)
    expect(addPriceRange(api, OFFICE_ACTOR, 'CT-SOUTER-RHINO-COS', { startISO: '2026-07-01', price: 5000 }).ok).toBe(true)
    expect(totalOf(api, bookingId)).toBe(before)
    const listId = api.getState().schedule.bookings[bookingId]!.listId
    for (const b of bookingsForList(api.getState(), listId)) {
      if (!b.completed && b.cancellation === undefined) {
        for (const p of proceduresForBooking(api.getState(), b.id)) confirmNoModifiers(api, OFFICE_ACTOR, p.id)
        expect(completeBooking(api, OFFICE_ACTOR, b.id).ok, b.id).toBe(true)
      }
    }
    expect(submitList(api, OFFICE_ACTOR, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE_ACTOR, listId).ok).toBe(true)
    expect(runBillingForList(api, listId).ok).toBe(true)
    const s = api.getState()
    const lines = Object.values(s.billing.invoiceLines).filter((l) => l.procedureId === prepaid.id && s.billing.invoices[l.invoiceId]?.kind === 'standard')
    // Its fee and the prepayment deduction net to $0: nothing more is billed, nothing credited.
    expect(lines.reduce((sum, l) => sum + l.amount, 0)).toBeCloseTo(0, 2)
  })
})

describe("the Contract's discount, its own invoice line (item 9; US-05.4.3)", () => {
  it('a captured discount Booking prints the fee at the gross, then "Discount 10%", reconciling to the cent', () => {
    const api = createAppStore()
    const bookingId = marker('discountBooking')
    const p = proceduresForBooking(api.getState(), bookingId)[0]!
    expect(editProcedure(api, OFFICE_ACTOR, p.id, { anaestheticStartISO: '2026-07-27T11:20:00', handoverISO: '2026-07-27T13:05:00' }).ok).toBe(true)
    const s = api.getState()
    const booking = s.schedule.bookings[bookingId]!
    const list = s.schedule.lists[booking.listId]!
    const ctx = billingContextForBooking(s, booking)!
    const built = buildInvoicesForBooking(booking, proceduresForBooking(s, bookingId), { ...ctx, listDateISO: list.dateISO, patientId: booking.patientId, ...listHospitalFor(list, s.masters.hospitals) })
    if (built.kind !== 'invoices') throw new Error(built.message)
    const [fee, discount] = built.invoices[0]!.lines
    // Base 6 + T 7 (105 minutes) = 13 units at Dr Souter's $26.50 = $344.50; 10% = $34.45; $310.05.
    expect(fee).toMatchObject({ kind: 'fee', amount: 344.5, units: 13 })
    expect(discount).toMatchObject({ kind: 'discount', description: 'Discount 10%', amount: -34.45 })
    expect(built.invoices[0]!.subtotal).toBe(310.05)
  })
})
