/**
 * The authorisation-review FLAGS helper — pure unit tests for the four
 * RFP-grounded flags (a: not completed, b: missing hospital reference, c: ACC
 * on the billable-party route, d: manual B/T/M override with its delta) plus a
 * seeded integration check against the real calculator (Chen's overridden T on
 * the design-day PM list). The mockup's duration-outlier flag is deliberately
 * NOT built (Decisions log 2026-07-23) and has no test.
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_RVG_TIME_RULE } from '../../domain/billing/timeUnits'
import { reviewFlagsForBooking, reviewFlagsForList } from './reviewFlags'
import type { Booking, Procedure } from '../../domain/types'
import { type BtmBreakdown, type FeeResult } from '../../domain/billing/fee'
import { bookingsForList, createAppStore, proceduresForBooking } from '../../store'
import { procedureFee } from '../../shared/capture/feeContext'
import { SEED_MARKERS } from '../../domain/seed'
import { assigned } from '../../test/lists'
import { RVG_MODIFIER_MASTER, mkContract, mkParty } from '../../domain/billing/fixtures'

/** No patient and the RVG master: no age modifier (catch-up Phase 19b). */
const NO_MODS = { modifiers: RVG_MODIFIER_MASTER }

/** The Contracts and holders the reference check reads (catch-up Phase 20). */
const HOSPITAL_RVG = mkContract({ id: 'con-hosp' })
const INSURER_RVG = mkContract({ id: 'con-ins', holderId: 'party-ins' })
const NO_CONTRACT = mkContract({ id: 'con-ncr', holderId: 'party-aa', billsTo: 'payer', systemRole: 'noContractRvg' })
const PREPAID = mkContract({ id: 'con-pre', holderId: 'party-aa', billsTo: 'payer', prepaid: true, pricing: { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 500 }] } })
const M = {
  contracts: Object.fromEntries([HOSPITAL_RVG, INSURER_RVG, NO_CONTRACT, PREPAID].map((c) => [c.id, c])),
  parties: Object.fromEntries(
    [mkParty(), mkParty({ id: 'party-ins', kind: 'insurer', name: 'Insurer', codePrefix: 'INS', hospitalId: undefined }), mkParty({ id: 'party-aa', kind: 'aa', name: 'AA', codePrefix: 'AA', hospitalId: undefined })].map((p) => [p.id, p]),
  ),
  /** The patient, reachable by email, so the payer-contact flag stays out of the other cases. */
  patient: { name: 'Test Patient', email: 'test.patient@example.net' },
}

const ZERO_BTM: BtmBreakdown = {
  base: { units: 0, source: 'seeded' },
  time: { units: 0, source: 'seeded' },
  modifiers: { units: 0, source: 'seeded' },
  baseSource: 'none',
  baseOutsideGuide: false,
  modifierItems: [],
  totalUnits: 0,
}

function stubFee(btm: BtmBreakdown = ZERO_BTM): FeeResult {
  return { btm, billableUnits: btm.totalUnits, chargeBasis: 'rvg', unitRate: 30, lines: [], subtotal: 0, override: null, total: 0, needsPrice: false }
}

function proc(over: Partial<Procedure> = {}): Procedure {
  return { id: 'P1', bookingId: 'BK1', procedureText: null, invoiceDescription: null, isAdditional: false, modifierClaims: [], removedModifierIds: [], ...over }
}

function booking(over: Partial<Booking> = {}): Booking {
  return { id: 'BK1', completed: true, payer: { kind: 'patient' }, ...over } as unknown as Booking
}

describe('reviewFlags (pure)', () => {
  it('(a) flags a booking not marked completed', () => {
    const flags = reviewFlagsForBooking({ timeRule: DEFAULT_RVG_TIME_RULE, modifierInputs: NO_MODS, ...M, booking: booking({ completed: false }), procedures: [] })
    expect(flags.some((f) => f.text === 'Not marked completed' && f.tone === 'neutral')).toBe(true)
  })

  it('(b) flags a missing billing reference only where the Contract bills a hospital or surgeon holder', () => {
    const hospitalNoRef = reviewFlagsForBooking({ timeRule: DEFAULT_RVG_TIME_RULE, modifierInputs: NO_MODS, ...M, booking: booking(), procedures: [{ procedure: proc({ governingContractId: 'con-hosp' }), fee: stubFee() }] })
    expect(hospitalNoRef.some((f) => f.text === 'No billing reference')).toBe(true)

    const hospitalWithRef = reviewFlagsForBooking({ timeRule: DEFAULT_RVG_TIME_RULE, modifierInputs: NO_MODS, ...M, booking: booking(), procedures: [{ procedure: proc({ governingContractId: 'con-hosp', billingReference: 'REF-1' }), fee: stubFee() }] })
    expect(hospitalWithRef.some((f) => f.text === 'No billing reference')).toBe(false)

    const insurerHeld = reviewFlagsForBooking({ timeRule: DEFAULT_RVG_TIME_RULE, modifierInputs: NO_MODS, ...M, booking: booking(), procedures: [{ procedure: proc({ governingContractId: 'con-ins' }), fee: stubFee() }] })
    expect(insurerHeld.some((f) => f.text === 'No billing reference')).toBe(false)
  })

  it('(c) raises no ACC flag on any Contract (catch-up Phase 18, RV-37), whatever the text says', () => {
    const bp = reviewFlagsForBooking({ timeRule: DEFAULT_RVG_TIME_RULE, modifierInputs: NO_MODS, ...M, booking: booking(), procedures: [{ procedure: proc({ procedureText: { text: 'ACL reconstruction, ACC claim', source: 'surgeonPdf', receivedAtISO: '2026-07-14T09:00:00' }, governingContractId: 'con-ncr' }), fee: stubFee() }] })
    expect(bp.some((f) => f.text.startsWith('ACC'))).toBe(false)

    const hospitalAcc = reviewFlagsForBooking({ timeRule: DEFAULT_RVG_TIME_RULE, modifierInputs: NO_MODS, ...M, booking: booking(), procedures: [{ procedure: proc({ procedureText: { text: 'ACL reconstruction, ACC claim', source: 'surgeonPdf', receivedAtISO: '2026-07-14T09:00:00' }, governingContractId: 'con-hosp', billingReference: 'R' }), fee: stubFee() }] })
    expect(hospitalAcc.some((f) => f.text.startsWith('ACC'))).toBe(false)
  })

  it('(d) flags a manual override with its signed delta vs the natural computation', () => {
    // proc() carries no times/codes, so the natural B/T/M is all zero.
    const overriddenTime: BtmBreakdown = { ...ZERO_BTM, time: { units: 5, source: 'overridden' }, totalUnits: 5 }
    const flags = reviewFlagsForBooking({ timeRule: DEFAULT_RVG_TIME_RULE, modifierInputs: NO_MODS, ...M, booking: booking(), procedures: [{ procedure: proc(), fee: stubFee(overriddenTime) }] })
    expect(flags).toEqual([{ tone: 'neutral', text: 'T adjusted +5 manually', bookingId: 'BK1', procedureId: 'P1' }])
  })

  it('(d) an override landing on the natural value reads "set manually"', () => {
    const overriddenBase: BtmBreakdown = { ...ZERO_BTM, base: { units: 0, source: 'overridden' } }
    const flags = reviewFlagsForBooking({ timeRule: DEFAULT_RVG_TIME_RULE, modifierInputs: NO_MODS, ...M, booking: booking(), procedures: [{ procedure: proc(), fee: stubFee(overriddenBase) }] })
    expect(flags.some((f) => f.text === 'B set manually')).toBe(true)
  })

  it('(e) raises no prepayment flag: an unpaid prepayment is a warning, shown by the triangle (Phase 15a)', () => {
    const proc0 = proc({ governingContractId: 'con-pre', prepaymentDetail: { type: 'full' } })
    const flags = reviewFlagsForBooking({ timeRule: DEFAULT_RVG_TIME_RULE, modifierInputs: NO_MODS, ...M, booking: booking(), procedures: [{ procedure: proc0, fee: stubFee(ZERO_BTM) }] })
    expect(flags.some((f) => /pre-?payment/i.test(f.text))).toBe(false)
  })

  it('(f) flags a billed payer with neither an email nor a postal address, and only then (US-11.2.3, catch-up Phase 21)', () => {
    const onPayer = [{ procedure: proc({ governingContractId: 'con-ncr' }), fee: stubFee() }]
    const flagged = reviewFlagsForBooking({ timeRule: DEFAULT_RVG_TIME_RULE, modifierInputs: NO_MODS, ...M, patient: { name: 'No Contact' }, booking: booking(), procedures: onPayer })
    expect(flagged).toContainEqual({ tone: 'neutral', text: 'Email or postal address needed', bookingId: booking().id, shot: 'review-payer-contact' })
    // A postal address alone clears it (D70's default).
    const posted = { name: 'Trust', postalAddress: { line1: 'PO Box 13245', city: 'Christchurch', postcode: '8141' } }
    expect(reviewFlagsForBooking({ timeRule: DEFAULT_RVG_TIME_RULE, modifierInputs: NO_MODS, ...M, patient: posted, booking: booking(), procedures: onPayer }).some((f) => f.shot === 'review-payer-contact')).toBe(false)
    // A holder-billed Procedure asks for none.
    const held = [{ procedure: proc({ governingContractId: 'con-hosp', billingReference: 'R' }), fee: stubFee() }]
    expect(reviewFlagsForBooking({ timeRule: DEFAULT_RVG_TIME_RULE, modifierInputs: NO_MODS, ...M, patient: { name: 'No Contact' }, booking: booking(), procedures: held }).some((f) => f.shot === 'review-payer-contact')).toBe(false)
  })

  it('yields no flags for a cancelled booking', () => {
    const cancelled = booking({
      completed: false,
      cancellation: { reason: 'Postponed', by: 'Kirsty W.', role: 'office', source: 'office', atISO: '2026-07-21T09:00:00' },
    })
    expect(reviewFlagsForBooking({ timeRule: DEFAULT_RVG_TIME_RULE, modifierInputs: NO_MODS, ...M, booking: cancelled, procedures: [] })).toEqual([])
  })

  it('reviewFlagsForList totals flags across bookings and excludes cancelled ones', () => {
    const bookings = [
      { timeRule: DEFAULT_RVG_TIME_RULE, modifierInputs: NO_MODS, ...M, booking: booking({ id: 'BK1', completed: false }), procedures: [] },
      { timeRule: DEFAULT_RVG_TIME_RULE, modifierInputs: NO_MODS, ...M, booking: booking({ id: 'BK2', completed: false, cancellation: { reason: 'x', by: 'y', role: 'office' as const, source: 'office' as const, atISO: '2026-07-21T09:00:00' } }), procedures: [] },
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
    const list = assigned(s.schedule.lists[listId], 'design-day PM list')

    const bookings = bookingsForList(s, listId).map((c) => ({
      booking: c,
      contracts: s.masters.contracts,
      parties: s.masters.parties,
      timeRule: s.masters.rvgTimeRule,
      modifierInputs: { patientDobISO: s.masters.patients[c.patientId]?.dobISO, procedureDateISO: list.dateISO, modifiers: s.masters.modifiers },
      procedures: proceduresForBooking(s, c.id).map((p) => {
        const view = procedureFee({ procedure: p, list, masters: s.masters, billingLines: s.schedule.billingLines, patientId: c.patientId })
        return { procedure: p, fee: view.fee, rvgGroup: view.rvgGroup }
      }),
    }))
    const flags = reviewFlagsForList(bookings)
    expect(flags.some((f) => /^T (adjusted|set)/.test(f.text))).toBe(true)
  })
})
