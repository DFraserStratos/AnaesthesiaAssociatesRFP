/**
 * The review-flag list (catch-up Phase 21a; US-07.2.2, US-04.3.11, A41, A49):
 * each rule, the order, several on one Booking, none on a cancelled Booking,
 * and D81's default (a Disabled Contract raises none; OQ-135 open). Phase 07's
 * kept flags (not completed, the B/T/M override note) and 21's payer contact
 * are ported from the old `apps/admin/reviewFlags.test.ts`.
 */
import { describe, expect, it } from 'vitest'
import { soleAllocation } from './multiProcedure'
import type { Booking, Procedure } from '../types'
import { DEFAULT_RVG_TIME_RULE } from './timeUnits'
import type { BtmBreakdown, FeeResult } from './fee'
import { RVG_MODIFIER_MASTER, mkContract, mkParty, mkProcedure } from './fixtures'
import { REVIEW_FLAG_RULES, reviewFlagsForBooking, reviewFlagsForList, type ReviewBookingInput, type ReviewProcedureInput } from './reviewFlags'
import type { RailMasters } from './contractRail'

const HOSPITAL = mkParty()
const AA = mkParty({ id: 'party-aa', kind: 'aa', name: 'AA', codePrefix: 'AA', hospitalId: undefined })
const RVG = mkContract({ id: 'con-rvg' })
const DISABLED = mkContract({ id: 'con-off', status: 'disabled' })
const OPEN = mkContract({ id: 'con-open', holderId: 'party-aa', billsTo: 'payer', pricing: { kind: 'open' } })
const FIXED_LATER = mkContract({ id: 'con-later', pricing: { kind: 'fixed', ranges: [{ startISO: '2026-09-01', price: 3100 }] } })
const SURGEON_LINKED = mkContract({ id: 'con-sur', holderId: 'party-aa', linkedSurgeonIds: ['sur-a'], pricing: { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 900 }] } })
const NO_CONTRACT_RVG = mkContract({ id: 'con-ncr', holderId: 'party-aa', billsTo: 'payer', systemRole: 'noContractRvg' })

const MASTERS: RailMasters = {
  contracts: Object.fromEntries([RVG, DISABLED, OPEN, FIXED_LATER, SURGEON_LINKED, NO_CONTRACT_RVG].map((c) => [c.id, c])),
  parties: { [HOSPITAL.id]: HOSPITAL, [AA.id]: AA },
  fundingTags: {},
  rvgGroups: {},
  surgeons: { 'sur-a': { specialtyIds: [] }, 'sur-b': { specialtyIds: [] } },
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
const fee = (btm: BtmBreakdown = ZERO_BTM): FeeResult => ({ btm, billableUnits: btm.totalUnits, allocation: soleAllocation(true, btm.modifiers.units), chargeBasis: 'rvg', unitRate: 30, lines: [], subtotal: 0, override: null, total: 0, needsPrice: false })
const proc = (over: Partial<Procedure> = {}): Procedure => mkProcedure({ id: 'P1', bookingId: 'BK1', governingContractId: RVG.id, ...over })
const booking = (over: Partial<Booking> = {}): Booking => ({ id: 'BK1', completed: true, ...over }) as unknown as Booking

function input(procedures: ReviewProcedureInput[], over: Partial<ReviewBookingInput> = {}): ReviewBookingInput {
  return {
    booking: booking(),
    procedures,
    rail: { masters: MASTERS, ctx: { listDateISO: '2026-07-21', hospitalId: 'hosp-1', surgeonId: 'sur-a' } },
    patient: { name: 'Test Patient', email: 'test.patient@example.net' },
    timeRule: DEFAULT_RVG_TIME_RULE,
    modifierInputs: { modifiers: RVG_MODIFIER_MASTER },
    ...over,
  }
}
const rules = (i: ReviewBookingInput) => reviewFlagsForBooking(i).map((f) => f.rule)

describe('the review-flag list (catch-up Phase 21a)', () => {
  it('a pristine, completed RVG Procedure raises nothing', () => {
    expect(reviewFlagsForBooking(input([{ procedure: proc(), fee: fee() }]))).toEqual([])
  })

  it("contractChanged: the anaesthetist's pending change, warn, naming who and what it was; none once approved", () => {
    const pending = input([{ procedure: proc(), fee: fee(), contractChange: { status: 'pending', by: 'Dr Souter', wasContractId: OPEN.id, atISO: '2026-07-21T10:00:00' } }])
    expect(reviewFlagsForBooking(pending)).toEqual([
      { tone: 'warn', text: `Changed by Dr Souter: was ${OPEN.name}`, bookingId: 'BK1', procedureId: 'P1', rule: 'contractChanged', shot: 'review-flag' },
    ])
    const approved = input([{ procedure: proc(), fee: fee(), contractChange: { status: 'approved', by: 'Dr Souter', atISO: '2026-07-21T10:00:00' } }])
    expect(rules(approved)).toEqual([])
  })

  it('typedPrice: a typed price on a Contract that is not open price, beside the computed price; none on an open price', () => {
    const office = input([{ procedure: proc({ governingContractId: NO_CONTRACT_RVG.id, priceOverride: { kind: 'fixedFee', amount: 1200, reason: 'Agreed with patient' } }), fee: fee(), computedPrice: 396.18 }])
    expect(reviewFlagsForBooking(office)).toContainEqual(expect.objectContaining({ rule: 'typedPrice', tone: 'neutral', text: 'Price typed: $1,200.00 (computed $396.18)' }))
    const open = input([{ procedure: proc({ governingContractId: OPEN.id, enteredPrice: 650 }), fee: fee() }])
    expect(rules(open)).not.toContain('typedPrice')
    // A percentage adjustment is not a typed price.
    const pct = input([{ procedure: proc({ priceOverride: { kind: 'percentAdjustment', percent: 10, reason: 'Long case' } }), fee: fee() }])
    expect(rules(pct)).not.toContain('typedPrice')
  })

  it('contractNoLongerFits: a Contract linked to another surgeon is flagged; it clears on the original List (derived)', () => {
    const p = { procedure: proc({ governingContractId: SURGEON_LINKED.id }), fee: fee() }
    const moved = input([p], { rail: { masters: MASTERS, ctx: { listDateISO: '2026-07-21', hospitalId: 'hosp-1', surgeonId: 'sur-b' } } })
    expect(reviewFlagsForBooking(moved)).toContainEqual(expect.objectContaining({ rule: 'contractNoLongerFits', tone: 'warn', text: 'Contract not offered on this List' }))
    expect(rules(input([p]))).not.toContain('contractNoLongerFits')
  })

  it('a fixed price with no range on the date reads both "Contract not offered" and "Needs a price"', () => {
    const r = rules(input([{ procedure: proc({ governingContractId: FIXED_LATER.id }), fee: fee() }]))
    expect(r).toEqual(['contractNoLongerFits', 'needsPrice'])
  })

  it('needsPrice: an open price with no amount; a typed amount clears it', () => {
    expect(rules(input([{ procedure: proc({ governingContractId: OPEN.id }), fee: fee() }]))).toEqual(['needsPrice'])
    expect(rules(input([{ procedure: proc({ governingContractId: OPEN.id, enteredPrice: 400 }), fee: fee() }]))).toEqual([])
  })

  it('needsInvoiceDestination: no Contract (kept because US-07.2.2 names it)', () => {
    const p = proc()
    delete p.governingContractId
    expect(reviewFlagsForBooking(input([{ procedure: p, fee: fee() }]))).toEqual([
      { tone: 'warn', text: 'Needs an invoice destination', bookingId: 'BK1', procedureId: 'P1', rule: 'needsInvoiceDestination', shot: 'review-flag' },
    ])
  })

  it('D81 (OQ-135 open): a Procedure on a Disabled Contract bills as normal and raises no flag', () => {
    expect(reviewFlagsForBooking(input([{ procedure: proc({ governingContractId: DISABLED.id }), fee: fee() }]))).toEqual([])
  })

  it('kept from Phase 07: not completed, and the B/T/M override with its signed delta', () => {
    expect(rules(input([], { booking: booking({ completed: false }) }))).toEqual(['notCompleted'])
    const t: BtmBreakdown = { ...ZERO_BTM, time: { units: 5, source: 'overridden' }, totalUnits: 5 }
    expect(reviewFlagsForBooking(input([{ procedure: proc(), fee: fee(t) }])).map((f) => f.text)).toEqual(['T adjusted +5 manually'])
    const b: BtmBreakdown = { ...ZERO_BTM, base: { units: 0, source: 'overridden' } }
    expect(reviewFlagsForBooking(input([{ procedure: proc(), fee: fee(b) }])).map((f) => f.text)).toEqual(['B set manually'])
  })

  it("kept from 21: a billed payer with no contact, under the recipes' hook, on each Procedure billed to its payer (catch-up Phase 22a)", () => {
    const procedure = proc({ governingContractId: NO_CONTRACT_RVG.id })
    const onPayer = input([{ procedure, fee: fee() }], { patient: { name: 'No Contact' } })
    expect(reviewFlagsForBooking(onPayer)).toContainEqual({ tone: 'neutral', text: 'Email or postal address needed', bookingId: 'BK1', procedureId: procedure.id, rule: 'payerContactMissing', shot: 'review-payer-contact' })
  })

  it('gone: "No billing reference" (D82), and no route, ACC or prepayment flag', () => {
    const all = reviewFlagsForBooking(input([{ procedure: proc({ procedureText: { text: 'ACL, ACC claim', source: 'surgeonPdf', receivedAtISO: '2026-07-14T09:00:00' } }), fee: fee() }]))
    expect(all).toEqual([])
    expect(REVIEW_FLAG_RULES.map((r) => r.rule)).toEqual(['contractChanged', 'contractNoLongerFits', 'needsInvoiceDestination', 'needsPrice', 'typedPrice', 'notCompleted', 'payerContactMissing', 'btmOverride'])
  })

  it('several on one Booking come out in rule order; a cancelled Booking yields none; the List sums them', () => {
    const several = input(
      [
        { procedure: proc({ id: 'P1', governingContractId: OPEN.id }), fee: fee(), contractChange: { status: 'pending', by: 'Dr Souter', atISO: '2026-07-21T10:00:00' } },
        { procedure: proc({ id: 'P2', governingContractId: SURGEON_LINKED.id }), fee: fee() },
      ],
      { booking: booking({ completed: false }), rail: { masters: MASTERS, ctx: { listDateISO: '2026-07-21', surgeonId: 'sur-b' } } },
    )
    expect(rules(several)).toEqual(['contractChanged', 'contractNoLongerFits', 'needsPrice', 'notCompleted'])
    const cancelled = { ...several, booking: booking({ cancellation: { reason: 'x', by: 'y', role: 'office', source: 'office', atISO: '2026-07-21T09:00:00' } }) }
    expect(reviewFlagsForBooking(cancelled)).toEqual([])
    expect(reviewFlagsForList([several, cancelled])).toHaveLength(4)
  })
})
