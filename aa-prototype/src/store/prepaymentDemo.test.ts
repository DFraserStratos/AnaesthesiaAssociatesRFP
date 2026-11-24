/**
 * The prepayment demo bodies and the re-check line (catch-up Phase 27;
 * US-06.3.1, US-06.3.2, US-06.3.5): "Add prepaid Booking" one and two payers,
 * with approval on and off; "Move to 2 days before procedure", forward only;
 * the PWA office stand-in approving exactly one payer group; the payment
 * choices on a Booking; and the confirmation line a change of Contract, payer
 * or Procedures shows.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { prepaymentRecheckLine, prepaymentStatusFor } from './prepaymentSelectors'
import { setPrepaymentApprovalRequired } from './prepaymentActions'
import {
  addPrepaidBooking,
  addPrepaidBookingRefusal,
  moveToTwoDaysBefore,
  outstandingPrepaymentBookings,
  prepaymentAccRecChoices,
  prepaymentPaymentRefusal,
  twoDaysBeforeRefusal,
} from './prepaymentDemo'
import { approvePrepaymentAsSimulatedOffice, prepaymentApprovalChoices, prepaymentStandInRefusal } from './officeStandIn'
import { proceduresForBooking } from './selectors'
import { setProcedureContract } from './contractSelectionActions'
import { setProcedurePayer } from './payerActions'
import { removeProcedure } from './bookingActions'
import { warningsForBooking } from './warnings'
import { CONTRACT, SEED_MARKERS, SEED_PREPAID_BOOKING_ID } from '../domain/seed'
import type { Actor } from './mutate'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const RILEY = SEED_MARKERS.prepaymentBooking!.entityId
const NAIR = SEED_PREPAID_BOOKING_ID

describe('Add prepaid Booking (add-prepaid-booking)', () => {
  it('one payer: one group awaiting approval at $1,200.00, then refused as already added', () => {
    const api = createAppStore()
    expect(addPrepaidBookingRefusal(api.getState())).toBeNull()
    const res = addPrepaidBooking(api, 'one-payer')
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const status = prepaymentStatusFor(api.getState(), res.value.bookingId)
    expect(status.groups).toHaveLength(1)
    expect(status.groups[0]!.status).toBe('awaitingApproval')
    expect(status.groups[0]!.amount).toBe(1200)
    expect(status.groups[0]!.ready).toBe(true)
    expect(addPrepaidBookingRefusal(api.getState())).toBe('Already added (Reset to repeat)')
    expect(addPrepaidBooking(api, 'one-payer').ok).toBe(false)
  })

  it('two payers: two groups, each awaiting approval, the patient $1,200.00 and the second payer $900.00', () => {
    const api = createAppStore()
    const res = addPrepaidBooking(api, 'two-payers')
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const groups = prepaymentStatusFor(api.getState(), res.value.bookingId).groups
    expect(groups.map((g) => [g.status, g.amount])).toEqual([
      ['awaitingApproval', 1200],
      ['awaitingApproval', 900],
    ])
    expect(groups[1]!.payerName).toBe('Ian Gray')
    // One warning per payer group (the List is within the mild window).
    expect(warningsForBooking(api.getState(), res.value.bookingId).filter((w) => w.ruleId === 'prepaymentUnpaid')).toHaveLength(2)
  })

  it('approval off: each group is generated and sent at once, never on the strip', () => {
    const api = createAppStore()
    expect(setPrepaymentApprovalRequired(api, OFFICE, false).ok).toBe(true)
    const res = addPrepaidBooking(api, 'two-payers')
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const groups = prepaymentStatusFor(api.getState(), res.value.bookingId).groups
    expect(groups.map((g) => g.status)).toEqual(['unpaid', 'unpaid'])
    expect(new Set(groups.map((g) => g.invoiceId)).size).toBe(2)
    expect(res.value.message).toContain('sent at once')
  })
})

describe('Move to 2 days before procedure (prepayment-two-days-before)', () => {
  it('lists the outstanding prepayments and jumps forward to two days before, strengthening the warning', () => {
    const api = createAppStore()
    const targets = outstandingPrepaymentBookings(api.getState())
    expect(targets.map((t) => t.bookingId)).toContain(RILEY)
    // Nair's is paid: not outstanding.
    expect(targets.map((t) => t.bookingId)).not.toContain(NAIR)
    expect(twoDaysBeforeRefusal(api.getState(), RILEY)).toBeNull()
    const res = moveToTwoDaysBefore(api, RILEY)
    expect(res.ok).toBe(true)
    expect(api.getState().clock.todayISO).toBe('2026-11-25')
    const warning = warningsForBooking(api.getState(), RILEY).find((w) => w.ruleId === 'prepaymentUnpaid')
    expect(warning?.strength).toBe('strong')
    // Never rewinds: a second jump is refused.
    expect(twoDaysBeforeRefusal(api.getState(), RILEY)).toBe('Already 2 days or less before')
    expect(moveToTwoDaysBefore(api, RILEY).ok).toBe(false)
  })

  it('is refused with nothing outstanding', () => {
    const api = createAppStore()
    expect(twoDaysBeforeRefusal(api.getState(), NAIR)).toBe('No outstanding pre-payments')
  })
})

describe('The office stand-in (pwa-office-approves-prepayment)', () => {
  it('approves exactly one payer group; the other stays pending', () => {
    const api = createAppStore()
    const res = addPrepaidBooking(api, 'two-payers')
    if (!res.ok) throw new Error(res.message)
    const choices = prepaymentApprovalChoices(api.getState(), res.value.bookingId)
    expect(choices).toHaveLength(2)
    const second = choices[1]!.id
    const out = approvePrepaymentAsSimulatedOffice(api, res.value.bookingId, second)
    expect(out.ok).toBe(true)
    const groups = prepaymentStatusFor(api.getState(), res.value.bookingId).groups
    expect(groups.filter((g) => g.status === 'awaitingApproval')).toHaveLength(1)
    expect(groups.find((g) => g.payerKey === second)!.status).toBe('unpaid')
    expect(prepaymentStandInRefusal(api.getState(), res.value.bookingId, second)).toBe('Already sent')
  })

  it('is refused on a Booking with no prepayment, and on Nair (already sent)', () => {
    const api = createAppStore()
    expect(prepaymentStandInRefusal(api.getState(), NAIR)).toBe('Already sent')
    const plain = Object.values(api.getState().schedule.bookings).find((b) => prepaymentStatusFor(api.getState(), b.id).groups.length === 0)!
    expect(prepaymentStandInRefusal(api.getState(), plain.id)).toBe('This booking does not need pre-payment')
  })
})

describe('The payment entries on a Booking', () => {
  it('offer only sent prepayment ACCRECs: "Not approved yet" on Riley, Nair\'s INV0001 on Nair', () => {
    const api = createAppStore()
    expect(prepaymentPaymentRefusal(api.getState(), RILEY)).toBe('Not approved yet')
    expect(prepaymentAccRecChoices(api.getState(), RILEY)).toEqual([])
    expect(prepaymentAccRecChoices(api.getState(), NAIR)).toHaveLength(1)
    expect(prepaymentPaymentRefusal(api.getState(), NAIR)).toBeNull()
  })
})

describe('The re-check line (US-06.3.5)', () => {
  it('names the change: now needed, a new payer, no longer needed', () => {
    const api = createAppStore()
    const res = addPrepaidBooking(api, 'two-payers')
    if (!res.ok) throw new Error(res.message)
    const bookingId = res.value.bookingId
    const [rhino, bleph] = proceduresForBooking(api.getState(), bookingId)
    const step = (fn: () => void) => {
      const before = prepaymentStatusFor(api.getState(), bookingId)
      fn()
      return prepaymentRecheckLine(before, prepaymentStatusFor(api.getState(), bookingId))
    }
    // Off prepaid before generation.
    expect(step(() => setProcedureContract(api, OFFICE, rhino!.id, CONTRACT.noContractRvg))).toBe('Pre-payment no longer needed')
    // Back on the prepaid Contract.
    expect(step(() => setProcedureContract(api, OFFICE, rhino!.id, 'CT-SOUTER-RHINO'))).toBe('Pre-payment now needed: awaiting approval')
    // A payer change before raising.
    expect(step(() => setProcedurePayer(api, OFFICE, rhino!.id, { kind: 'other', name: 'Ian Gray', relationship: 'Partner', email: 'ian.gray@example.co.nz' }, []))).toMatch(/^Pre-payment now goes to /)
    // Removing a prepaid Procedure.
    expect(step(() => removeProcedure(api, OFFICE, bleph!.id))).toBe('Pre-payment no longer needed')
    // Nothing changed: no line.
    expect(step(() => undefined)).toBeNull()
  })

  it('after sending: a Contract changed off prepaid is settled as a cancellation (catch-up Phase 41, D67), so no interim line is left', () => {
    const api = createAppStore()
    const nairRhino = proceduresForBooking(api.getState(), NAIR).find((p) => p.governingContractId === 'CT-SOUTER-RHINO')!
    const before = prepaymentStatusFor(api.getState(), NAIR)
    setProcedureContract(api, OFFICE, nairRhino.id, CONTRACT.noContractRvg)
    // Set aside the seed's own credit, Heather Sinclair's (`HS` ids, catch-up Phase 40, D24; Wave 5 join).
    expect(Object.values(api.getState().billing.creditNotes).filter((r) => !r.id.startsWith('HS')).map((c) => c.cause)).toEqual(['prepaidContractChanged'])
    expect(prepaymentRecheckLine(before, prepaymentStatusFor(api.getState(), NAIR))).toBeNull()
  })
})

