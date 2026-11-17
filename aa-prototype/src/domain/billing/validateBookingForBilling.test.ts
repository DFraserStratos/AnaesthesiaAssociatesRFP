import { describe, expect, it } from 'vitest'
import { DEFAULT_RVG_TIME_RULE } from './timeUnits'
import { RVG_MODIFIER_MASTER, mkClaim } from './fixtures'
import {
  billingReferenceMissing,
  validateBookingForBilling,
  type BookingBillingContext,
} from './validateBookingForBilling'
import {
  BASE_RANGE_5_9,
  BASE_SINGLE_10,
  HANDOVER_1030,
  mkAnaesthetist,
  mkBooking,
  mkContract,
  mkParty,
  mkProcedure,
  START_0800,
} from './fixtures'
import type { BillingLine, FeeSplit, Procedure, SplitShareBasis } from '../types'
import { splitDoesNotFitMessage } from './splitShare'
import { HOLDER_MISSING_MESSAGE } from './whoIsBilled'

/** The hospital's plain RVG Contract, billing its holder (catch-up Phase 20: every Procedure carries one Contract). */
const PLAIN_RVG = mkContract({ id: 'con-plain', name: 'Test hospital RVG' })
/** AA's No contract · RVG, billing the payer. */
const NO_CONTRACT = mkContract({ id: 'con-ncr', aaCode: 'AA-RVG', name: 'No contract · RVG', holderId: 'party-aa', billsTo: 'payer', systemRole: 'noContractRvg' })
/** A fixed price in force on the List's date. */
const FIXED_IN_FORCE = mkContract({ id: 'con-fix-now', name: 'Fixed item', pricing: { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 400 }] } })
/** No contract · Fixed price, the Patient › Standard open-price fallback. */
const OPEN_FALLBACK = mkContract({ id: 'con-open', name: 'No contract · Fixed price', holderId: 'party-aa', billsTo: 'payer', pricing: { kind: 'open' }, systemRole: 'openPriceFallback' })
/** An anaesthetist's prepaid price list item, billing the payer. */
const PREPAID = mkContract({ id: 'con-pre', name: 'Prepaid item', holderId: 'party-anaes', billsTo: 'payer', prepaid: true, pricing: { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 1200 }] } })
const CONTRACTS = Object.fromEntries([PLAIN_RVG, NO_CONTRACT, FIXED_IN_FORCE, OPEN_FALLBACK, PREPAID].map((c) => [c.id, c]))

function mkCtx(overrides: Partial<BookingBillingContext> = {}): BookingBillingContext {
  return {
    anaesthetist: mkAnaesthetist({ unitValue: 30 }),
    rvgGroups: { [BASE_SINGLE_10.id]: BASE_SINGLE_10, [BASE_RANGE_5_9.id]: BASE_RANGE_5_9 },
    contracts: CONTRACTS,
    parties: {
      'party-hosp-1': mkParty(),
      'party-ins': mkParty({ id: 'party-ins', kind: 'insurer', name: 'Southern Health', codePrefix: 'SHI', hospitalId: undefined, billingIdentity: { kind: 'insurer', id: 'ins-direct' } }),
      'party-aa': mkParty({ id: 'party-aa', kind: 'aa', name: 'AA', codePrefix: 'AA', hospitalId: undefined }),
      'party-anaes': mkParty({ id: 'party-anaes', kind: 'anaesthetist', name: 'Dr Test', codePrefix: 'DRT', hospitalId: undefined }),
    },
    billingLines: [],
    listDateISO: '2026-07-21',
    timeRule: DEFAULT_RVG_TIME_RULE,
    patientDobISO: undefined,
    modifiers: RVG_MODIFIER_MASTER,
    ...overrides,
  }
}

/** A fully billable RVG procedure on the hospital's plain RVG Contract. */
function validProcedure(overrides: Partial<Procedure> = {}): Procedure {
  return mkProcedure({
    governingContractId: PLAIN_RVG.id,
    rvgGroupId: 'RG-T-GA10',
    anaestheticStartISO: START_0800,
    handoverISO: HANDOVER_1030,
    // An ASA III claim with its explanation (catch-up Phase 19b): 2 units as printed.
    modifierClaims: [mkClaim('AS3', 'ASA III on pre-op review')],
    ...overrides,
  })
}

const booking = mkBooking()

function fieldsOf(failures: { field: string }[]): string[] {
  return failures.map((f) => f.field)
}

describe('validateBookingForBilling is the run\'s pre-flight only (catch-up Phase 21a)', () => {
  it('asks nothing completion asks: no Contract, no RVG code, no times, an unexplained claim and a split prepayment with no deposit all pass here', () => {
    const bare = mkProcedure({ modifierClaims: [mkClaim('AS3', '  ')] })
    expect(validateBookingForBilling(booking, [bare], mkCtx())).toEqual([])
    const noTimes = validProcedure({ anaestheticStartISO: undefined, handoverISO: undefined, rvgGroupId: undefined })
    expect(validateBookingForBilling(booking, [noTimes], mkCtx())).toEqual([])
    const split = mkProcedure({ governingContractId: PREPAID.id, prepaymentDetail: { type: 'split' } })
    expect(validateBookingForBilling(booking, [split], mkCtx())).toEqual([])
  })
})

describe('validateBookingForBilling — happy paths', () => {
  it('a complete RVG procedure passes', () => {
    expect(validateBookingForBilling(booking, [validProcedure()], mkCtx())).toEqual([])
  })

  it('No contract · RVG with a patient present and NO override record PASSES (patient is the default payer)', () => {
    const p = validProcedure({ governingContractId: NO_CONTRACT.id })
    expect(validateBookingForBilling(booking, [p], mkCtx())).toEqual([])
  })

  it('a cancelled Booking is excluded from validation entirely', () => {
    const cancelled = mkBooking({
      cancellation: {
        reason: 'Patient unwell',
        by: 'Kirsty W.',
        role: 'office',
        source: 'office',
        atISO: '2026-07-21T09:00:00',
      },
    })
    // Deliberately broken procedure — still no failures because the Booking is cancelled.
    const broken = mkProcedure()
    expect(validateBookingForBilling(cancelled, [broken], mkCtx())).toEqual([])
  })
})

describe('validateBookingForBilling: a typed price needs no reason (catch-up Phase 24, RV-04)', () => {
  it('a typed price passes the pre-flight, $0 included', () => {
    expect(validateBookingForBilling(booking, [validProcedure({ enteredPrice: 500 })], mkCtx())).toEqual([])
    expect(validateBookingForBilling(booking, [validProcedure({ enteredPrice: 0 })], mkCtx())).toEqual([])
  })
})

describe('validateBookingForBilling: a split that no longer fits the fee (catch-up Phase 22)', () => {
  // The spot-check procedure fee: (10 + 11 + 2) x 30 = $690.
  const split = (insurer: SplitShareBasis, patient: SplitShareBasis): FeeSplit => ({
    shares: [
      { party: { kind: 'insurer', id: 'ins-direct' }, basis: insurer },
      { party: { kind: 'patient', id: booking.patientId }, basis: patient },
    ],
  })

  it('a split that fits the procedure fee passes', () => {
    const p = validProcedure({ split: split({ kind: 'amount', amountExGst: 190 }, { kind: 'rest' }) })
    expect(validateBookingForBilling(booking, [p], mkCtx())).toEqual([])
    const exact = validProcedure({ split: split({ kind: 'amount', amountExGst: 500 }, { kind: 'amount', amountExGst: 190 }) })
    expect(validateBookingForBilling(booking, [exact], mkCtx())).toEqual([])
  })

  it('amounts that no longer total the fee fail on the split field with both figures in the message', () => {
    const p = validProcedure({ split: split({ kind: 'amount', amountExGst: 500 }, { kind: 'amount', amountExGst: 200 }) })
    const failures = validateBookingForBilling(booking, [p], mkCtx())
    expect(failures).toHaveLength(1)
    expect(failures[0]?.procedureId).toBe(p.id)
    expect(failures[0]?.field).toBe('split')
    expect(failures[0]?.message).toContain('$690.00')
    expect(failures[0]?.message).toContain('$700.00')
    expect(failures[0]?.message).toBe(splitDoesNotFitMessage(690, 'The shares come to $700.00 but the fee is $690.00. Make them total the fee, or let one party take the rest.'))
  })

  it('a $ share at or above the fee beside a rest fails on the split field', () => {
    const p = validProcedure({ split: split({ kind: 'amount', amountExGst: 690 }, { kind: 'rest' }) })
    const failures = validateBookingForBilling(booking, [p], mkCtx())
    expect(fieldsOf(failures)).toEqual(['split'])
    expect(failures[0]?.message).toContain('leaves nothing for the rest of the fee of $690.00')
  })

  it('billing lines alone never fail: who pays is the Contract or the split, never a line', () => {
    const lines: BillingLine[] = [{ id: 'bl-a', procedureId: 'proc-1', chargeBasis: 'fixed', amount: 40, description: 'Ancillary flat fee' }]
    const p = validProcedure({ id: 'proc-1' })
    expect(validateBookingForBilling(booking, [p], mkCtx({ billingLines: lines }))).toEqual([])
  })
})

describe('who the Contract bills (catch-up Phase 21: a holder Party bills as itself; only a missing holder fails)', () => {
  const recordless = mkParty({ id: 'party-group', kind: 'surgeonGroup', name: 'Group', codePrefix: 'GRP', hospitalId: undefined })
  const groupHeld = mkContract({ id: 'con-grp', name: 'Group RVG', holderId: 'party-group' })
  const orphan = mkContract({ id: 'con-orphan', name: 'Orphan RVG', holderId: 'party-gone' })

  it('a holder Party with no older billing identity is billed as itself, so nothing fails', () => {
    const p = validProcedure({ governingContractId: 'con-grp' })
    const ctx = mkCtx({ contracts: { ...CONTRACTS, 'con-grp': groupHeld }, parties: { ...mkCtx().parties, [recordless.id]: recordless } })
    expect(validateBookingForBilling(booking, [p], ctx).find((f) => f.field === 'governingContractId')).toBeUndefined()
  })

  it('a holder-billed Contract whose holder is gone fails with the run sentence', () => {
    const p = validProcedure({ governingContractId: 'con-orphan' })
    const ctx = mkCtx({ contracts: { ...CONTRACTS, 'con-orphan': orphan } })
    expect(validateBookingForBilling(booking, [p], ctx).find((f) => f.field === 'governingContractId')?.message).toBe(HOLDER_MISSING_MESSAGE)
  })

  it('a Contract billing the payer bills the patient, so AA holding it needs no record', () => {
    expect(validateBookingForBilling(booking, [validProcedure({ governingContractId: NO_CONTRACT.id })], mkCtx())).toEqual([])
  })
})

describe('"Needs a price" on a fixed price with no range in force (catch-up Phase 19a)', () => {
  const fixed = mkContract({ id: 'con-fx', name: 'Face lift', pricing: { kind: 'fixed', ranges: [{ startISO: '2026-09-01', price: 3100 }] } })
  const ctxOn = (dateISO: string) => mkCtx({ contracts: { 'con-fx': fixed }, listDateISO: dateISO, listHospitalId: 'hosp-1' })

  it("refuses with the one sentence, dated by the List's date; never priced at RVG instead", () => {
    const p = validProcedure({ governingContractId: 'con-fx' })
    expect(validateBookingForBilling(booking, [p], ctxOn('2026-07-21')).find((f) => f.field === 'governingContractId')?.message).toBe(
      'Needs a price: no price range in force on 21 Jul 2026.',
    )
    expect(validateBookingForBilling(booking, [p], ctxOn('2026-09-01')).filter((f) => f.field === 'governingContractId')).toEqual([])
  })

  it('an additional Procedure needs a price too, and an office fixed fee is a typed price', () => {
    const add = validProcedure({ governingContractId: 'con-fx', isPrimary: false })
    expect(fieldsOf(validateBookingForBilling(booking, [add], ctxOn('2026-07-21')))).toContain('governingContractId')
    const typed = validProcedure({ governingContractId: 'con-fx', enteredPrice: 3000 })
    expect(fieldsOf(validateBookingForBilling(booking, [typed], ctxOn('2026-07-21')))).not.toContain('governingContractId')
  })

  it('an open price is never priced at RVG: with no amount typed no price can be worked out, and a typed one passes', () => {
    const p = validProcedure({ governingContractId: OPEN_FALLBACK.id })
    expect(validateBookingForBilling(booking, [p], mkCtx()).find((f) => f.field === 'enteredPrice')?.message).toBe(
      'Needs a price: No contract · Fixed price has no price of its own.',
    )
    expect(validateBookingForBilling(booking, [{ ...p, enteredPrice: 2000 }], mkCtx())).toEqual([])
  })
})

describe('billingReferenceMissing for a Party billed as itself (catch-up Phase 21 review)', () => {
  it('asks a surgeon group billed as itself for its reference, as COS is asked', () => {
    const group = mkParty({ id: 'party-group', kind: 'surgeonGroup', name: 'Group', codePrefix: 'GRP', hospitalId: undefined })
    const held = mkContract({ id: 'con-grp', name: 'Group RVG', holderId: 'party-group' })
    const p = validProcedure({ governingContractId: 'con-grp' })
    expect(billingReferenceMissing(p, { 'con-grp': held }, { 'party-group': group })).toBe(true)
    expect(billingReferenceMissing({ ...p, billingReference: 'G-1' }, { 'con-grp': held }, { 'party-group': group })).toBe(false)
  })
})
