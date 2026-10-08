/**
 * The authorisation-review FLAGS helper — pure unit tests for the four
 * RFP-grounded flags (a: not completed, b: missing hospital reference, c: ACC
 * on the billable-party route, d: manual B/T/M override with its delta) plus a
 * seeded integration check against the real calculator (Chen's overridden T on
 * the design-day PM list). The mockup's duration-outlier flag is deliberately
 * NOT built (Decisions log 2026-07-23) and has no test.
 */

import { describe, expect, it } from 'vitest'
import { reviewFlagsForBooking, reviewFlagsForList } from './reviewFlags'
import type { Booking, Procedure } from '../../domain/types'
import { type BtmBreakdown, type FeeResult } from '../../domain/billing/fee'
import { bookingsForList, createAppStore, proceduresForBooking } from '../../store'
import { procedureFee } from '../../shared/capture/feeContext'
import { SEED_MARKERS } from '../../domain/seed'

const ZERO_BTM: BtmBreakdown = {
  base: { units: 0, source: 'seeded' },
  time: { units: 0, source: 'seeded' },
  modifiers: { units: 0, source: 'seeded' },
  refusedModifiers: [],
  totalUnits: 0,
}

function stubFee(btm: BtmBreakdown = ZERO_BTM): FeeResult {
  return { btm, billableUnits: btm.totalUnits, chargeBasis: 'rvg', unitRate: 30, lines: [], subtotal: 0, override: null, total: 0 }
}

function proc(over: Partial<Procedure> = {}): Procedure {
  return { id: 'P1', bookingId: 'BK1', description: 'Test op', accRelated: false, isAdditional: false, selectedModifierCodes: [], ...over }
}

function booking(over: Partial<Booking> = {}): Booking {
  return { id: 'BK1', completed: true, ...over } as unknown as Booking
}

describe('reviewFlags (pure)', () => {
  it('(a) flags a booking not marked completed', () => {
    const flags = reviewFlagsForBooking({ booking: booking({ completed: false }), procedures: [] })
    expect(flags.some((f) => f.text === 'Not marked completed' && f.tone === 'neutral')).toBe(true)
  })

  it('(b) flags a missing billing reference on the hospital route only', () => {
    const hospitalNoRef = reviewFlagsForBooking({ booking: booking(), procedures: [{ procedure: proc({ billingRoute: 'hospital' }), fee: stubFee() }] })
    expect(hospitalNoRef.some((f) => f.text === 'No billing reference')).toBe(true)

    const hospitalWithRef = reviewFlagsForBooking({ booking: booking(), procedures: [{ procedure: proc({ billingRoute: 'hospital', billingReference: 'REF-1' }), fee: stubFee() }] })
    expect(hospitalWithRef.some((f) => f.text === 'No billing reference')).toBe(false)

    const insurerRoute = reviewFlagsForBooking({ booking: booking(), procedures: [{ procedure: proc({ billingRoute: 'insurer' }), fee: stubFee() }] })
    expect(insurerRoute.some((f) => f.text === 'No billing reference')).toBe(false)
  })

  it('(c) raises an amber ACC advisory only on the billable-party route', () => {
    const bp = reviewFlagsForBooking({ booking: booking(), procedures: [{ procedure: proc({ accRelated: true, billingRoute: 'billableParty' }), fee: stubFee() }] })
    expect(bp.find((f) => f.text === 'ACC should not bill the patient directly')?.tone).toBe('warn')

    const hospitalAcc = reviewFlagsForBooking({ booking: booking(), procedures: [{ procedure: proc({ accRelated: true, billingRoute: 'hospital', billingReference: 'R' }), fee: stubFee() }] })
    expect(hospitalAcc.some((f) => f.text.startsWith('ACC'))).toBe(false)
  })

  it('(d) flags a manual override with its signed delta vs the natural computation', () => {
    // proc() carries no times/codes, so the natural B/T/M is all zero.
    const overriddenTime: BtmBreakdown = { ...ZERO_BTM, time: { units: 5, source: 'overridden' }, totalUnits: 5 }
    const flags = reviewFlagsForBooking({ booking: booking(), procedures: [{ procedure: proc(), fee: stubFee(overriddenTime) }] })
    expect(flags).toEqual([{ tone: 'neutral', text: 'T adjusted +5 manually', bookingId: 'BK1', procedureId: 'P1' }])
  })

  it('(d) an override landing on the natural value reads "set manually"', () => {
    const overriddenBase: BtmBreakdown = { ...ZERO_BTM, base: { units: 0, source: 'overridden' } }
    const flags = reviewFlagsForBooking({ booking: booking(), procedures: [{ procedure: proc(), fee: stubFee(overriddenBase) }] })
    expect(flags.some((f) => f.text === 'B set manually')).toBe(true)
  })

  it('(e) raises no prepayment flag: an unpaid prepayment is a warning, shown by the triangle (Phase 15a)', () => {
    const proc0 = proc({ billingRoute: 'billableParty', patientPaymentCategory: 'selfFundedPrepayment', prepaymentDetail: { type: 'full' } })
    const flags = reviewFlagsForBooking({ booking: booking(), procedures: [{ procedure: proc0, fee: stubFee(ZERO_BTM) }] })
    expect(flags.some((f) => /pre-?payment/i.test(f.text))).toBe(false)
  })

  it('yields no flags for a cancelled booking', () => {
    const cancelled = booking({
      completed: false,
      cancellation: { reason: 'Postponed', by: 'Kirsty W.', role: 'office', source: 'office', atISO: '2026-07-21T09:00:00' },
    })
    expect(reviewFlagsForBooking({ booking: cancelled, procedures: [] })).toEqual([])
  })

  it('reviewFlagsForList totals flags across bookings and excludes cancelled ones', () => {
    const bookings = [
      { booking: booking({ id: 'BK1', completed: false }), procedures: [] },
      { booking: booking({ id: 'BK2', completed: false, cancellation: { reason: 'x', by: 'y', role: 'office' as const, source: 'office' as const, atISO: '2026-07-21T09:00:00' } }), procedures: [] },
    ]
    expect(reviewFlagsForList(bookings).length).toBe(1)
  })
})

describe('reviewFlags over seeded data (real calculator)', () => {
  it('surfaces Chen\'s seeded manual T override on the design-day PM list', () => {
    const api = createAppStore()
    const marker = SEED_MARKERS.designDayPmList
    if (marker === undefined) throw new Error('missing designDayPmList marker')
    const listId = marker.entityId
    const s = api.getState()
    const list = s.schedule.lists[listId]
    if (list === undefined) throw new Error('no design-day PM list')

    const bookings = bookingsForList(s, listId).map((c) => ({
      booking: c,
      procedures: proceduresForBooking(s, c.id).map((p, i) => {
        const view = procedureFee({ procedure: p, list, ordinal: i + 1, masters: s.masters, billingLines: s.schedule.billingLines })
        return { procedure: p, fee: view.fee, baseCode: view.baseCode }
      }),
    }))
    const flags = reviewFlagsForList(bookings)
    expect(flags.some((f) => /^T (adjusted|set)/.test(f.text))).toBe(true)
  })
})
