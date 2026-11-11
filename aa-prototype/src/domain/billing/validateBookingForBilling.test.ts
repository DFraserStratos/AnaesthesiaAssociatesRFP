import { describe, expect, it } from 'vitest'
import { DEFAULT_RVG_TIME_RULE } from './timeUnits'
import { RVG_MODIFIER_MASTER, mkClaim } from './fixtures'
import {
  ADD_RVG_CODE_FAILURE,
  CONTRACT_GONE_FAILURE,
  NEEDS_DESTINATION_FAILURE,
  TYPE_THE_PRICE_FAILURE,
  validateBookingForBilling,
  type BookingBillingContext,
} from './validateBookingForBilling'
import {
  BASE_RANGE_5_9,
  BASE_SINGLE_10,
  HANDOVER_1030,
  mkAnaesthetist,
  mkBillableParty,
  mkBooking,
  mkContract,
  mkParty,
  mkProcedure,
  START_0800,
} from './fixtures'
import type { BillingLine, Procedure } from '../types'
import { noRouteCounterpartyMessage } from './parties'

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
      'party-ins': mkParty({ id: 'party-ins', kind: 'insurer', name: 'Southern Health', codePrefix: 'SHI', hospitalId: undefined, legacyCounterparty: { kind: 'insurer', id: 'ins-direct' } }),
      'party-aa': mkParty({ id: 'party-aa', kind: 'aa', name: 'AA', codePrefix: 'AA', hospitalId: undefined }),
      'party-anaes': mkParty({ id: 'party-anaes', kind: 'anaesthetist', name: 'Dr Test', codePrefix: 'DRT', hospitalId: undefined }),
    },
    billableParties: { 'bp-1': mkBillableParty() },
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

describe('validateBookingForBilling — required data', () => {
  it('fails a Procedure with no Contract: it needs an invoice destination (US-04.3.4)', () => {
    const p = validProcedure({ governingContractId: undefined })
    expect(validateBookingForBilling(booking, [p], mkCtx())).toContainEqual({ procedureId: p.id, field: 'governingContractId', message: NEEDS_DESTINATION_FAILURE })
  })

  it('fails a Contract that no longer exists', () => {
    const p = validProcedure({ governingContractId: 'con-gone' })
    expect(validateBookingForBilling(booking, [p], mkCtx())).toContainEqual({ procedureId: p.id, field: 'governingContractId', message: CONTRACT_GONE_FAILURE })
  })

  it('requires the RVG code on an RVG kind only; optional on a fixed price (US-03.3.1)', () => {
    const rvg = mkProcedure({ governingContractId: NO_CONTRACT.id })
    expect(validateBookingForBilling(booking, [rvg], mkCtx())).toContainEqual({ procedureId: rvg.id, field: 'rvgGroupId', message: ADD_RVG_CODE_FAILURE })
    const fixed = mkProcedure({ governingContractId: FIXED_IN_FORCE.id })
    expect(validateBookingForBilling(booking, [fixed], mkCtx())).toEqual([])
  })

  it('fails an RVG code that no longer points at a row', () => {
    const p = validProcedure({ rvgGroupId: 'RG-T-GONE' })
    const failures = validateBookingForBilling(booking, [p], mkCtx())
    expect(failures.find((f) => f.field === 'rvgGroupId')?.message).toBe(
      'The RVG code on this Procedure is no longer in the RVG groups. Choose it again.',
    )
  })

  it('passes with no base code when a non-RVG line exists', () => {
    const line: BillingLine = {
      id: 'bl-1',
      procedureId: 'proc-1',
      chargeBasis: 'fixed',
      amount: 150,
      description: 'Consult',
    }
    const failures = validateBookingForBilling(booking, [mkProcedure({ governingContractId: FIXED_IN_FORCE.id })], mkCtx({ billingLines: [line] }))
    expect(failures).toEqual([])
  })

  it('fails missing start/handover times on the RVG path', () => {
    const p = validProcedure({ anaestheticStartISO: undefined, handoverISO: undefined })
    const failures = validateBookingForBilling(booking, [p], mkCtx())
    expect(fieldsOf(failures)).toEqual(
      expect.arrayContaining(['anaestheticStartISO', 'handoverISO']),
    )
  })

  it('fails times out of order', () => {
    const p = validProcedure({ anaestheticStartISO: HANDOVER_1030, handoverISO: START_0800 })
    const failures = validateBookingForBilling(booking, [p], mkCtx())
    expect(failures.some((f) => f.field === 'handoverISO' && /after/.test(f.message))).toBe(true)
  })

  it('accepts any base-unit value on a ranged group (D3, RV-10): nothing unchosen, nothing out of range refused', () => {
    const unchosen = validProcedure({ rvgGroupId: BASE_RANGE_5_9.id })
    expect(validateBookingForBilling(booking, [unchosen], mkCtx())).toEqual([])

    const outside = validProcedure({ rvgGroupId: BASE_RANGE_5_9.id, baseUnitsSelected: 12 })
    expect(validateBookingForBilling(booking, [outside], mkCtx())).toEqual([])

    const typed = validProcedure({ rvgGroupId: BASE_SINGLE_10.id, baseUnitsCaptured: { units: 40, source: 'overridden' } })
    expect(validateBookingForBilling(booking, [typed], mkCtx())).toEqual([])

    const inRange = validProcedure({ rvgGroupId: BASE_RANGE_5_9.id, baseUnitsSelected: 7 })
    expect(validateBookingForBilling(booking, [inRange], mkCtx())).toEqual([])
  })
})

describe('validateBookingForBilling — the payer override and an Other price', () => {
  it('fails an unresolvable billable-party override', () => {
    const p = validProcedure({ governingContractId: NO_CONTRACT.id, billablePartyId: 'bp-ghost' })
    expect(fieldsOf(validateBookingForBilling(booking, [p], mkCtx()))).toContain('billablePartyId')
  })

  it('an open-price fallback asks for its amount, and passes once one is typed (US-04.3.9)', () => {
    const none = mkProcedure({ governingContractId: OPEN_FALLBACK.id })
    expect(validateBookingForBilling(booking, [none], mkCtx())).toEqual([{ procedureId: none.id, field: 'enteredPrice', message: TYPE_THE_PRICE_FAILURE }])
    expect(validateBookingForBilling(booking, [{ ...none, enteredPrice: 2000 }], mkCtx())).toEqual([])
  })
})

describe('validateBookingForBilling — pre-payment typing', () => {
  const base = { governingContractId: PREPAID.id } as const

  it('a prepaid Contract with no detail passes: the prepayment is the full fee (INTERIM until Phase 27)', () => {
    const p = validProcedure({ ...base })
    expect(validateBookingForBilling(booking, [p], mkCtx())).toEqual([])
  })

  it('a split pre-payment without a deposit amount fails', () => {
    const p = validProcedure({ ...base, prepaymentDetail: { type: 'split' } })
    expect(fieldsOf(validateBookingForBilling(booking, [p], mkCtx()))).toContain('prepaymentDetail')
  })

  it('full pre-payment, and split with a deposit, pass', () => {
    const full = validProcedure({ ...base, prepaymentDetail: { type: 'full' } })
    const split = validProcedure({ ...base, prepaymentDetail: { type: 'split', depositAmount: 300 } })
    expect(validateBookingForBilling(booking, [full], mkCtx())).toEqual([])
    expect(validateBookingForBilling(booking, [split], mkCtx())).toEqual([])
  })
})

describe('validateBookingForBilling — rate x time gate (Method 3)', () => {
  const rateTimeLine: BillingLine = {
    id: 'bl-rt',
    procedureId: 'proc-1',
    chargeBasis: 'rateTime',
    hours: 2,
    rate: 400,
    amount: 800,
    description: 'Agreed hourly rate',
  }

  it('passes under a contract that permits an individual arrangement', () => {
    const permitting = mkContract({ id: 'con-ia', permitsRateTime: true })
    // An RVG kind carrying the arrangement still records its RVG code (catch-up Phase 20, US-03.3.1).
    const p = validProcedure({ governingContractId: 'con-ia', modifierClaims: [] })
    const ctx = mkCtx({ contracts: { 'con-ia': permitting }, billingLines: [rateTimeLine] })
    expect(validateBookingForBilling(booking, [p], ctx)).toEqual([])
  })

  it('fails under a non-permitting contract, and with no contract at all', () => {
    const nonPermitting = mkContract({ id: 'con-std' })
    const p = mkProcedure({ governingContractId: 'con-std' })
    const ctx = mkCtx({ contracts: { 'con-std': nonPermitting }, billingLines: [rateTimeLine] })
    expect(fieldsOf(validateBookingForBilling(booking, [p], ctx))).toContain('billingLines')

    const orphan = mkProcedure({ governingContractId: 'con-gone' })
    const ctx2 = mkCtx({ billingLines: [rateTimeLine] })
    expect(fieldsOf(validateBookingForBilling(booking, [orphan], ctx2))).toContain('billingLines')
  })
})

describe('validateBookingForBilling — price override reason', () => {
  it('an override with an empty reason fails', () => {
    const p = validProcedure({ priceOverride: { kind: 'fixedFee', amount: 500, reason: '  ' } })
    expect(fieldsOf(validateBookingForBilling(booking, [p], mkCtx()))).toContain('priceOverride')
  })

  it('an override with a reason passes', () => {
    const p = validProcedure({
      priceOverride: { kind: 'dollarAdjustment', amount: -50, reason: 'Agreed discount' },
    })
    expect(validateBookingForBilling(booking, [p], mkCtx())).toEqual([])
  })

  it('an override that drives the fee negative fails (8th review: no negative invoices)', () => {
    const p = validProcedure({
      priceOverride: { kind: 'dollarAdjustment', amount: -10000, reason: 'Stress test' },
    })
    const failures = validateBookingForBilling(booking, [p], mkCtx())
    expect(fieldsOf(failures)).toContain('priceOverride')
    expect(failures.some((f) => f.message.includes('negative'))).toBe(true)
  })
})

describe('validateBookingForBilling — two-funder conservation', () => {
  // The spot-check procedure fee: (10 + 11 + 3) x 30 = $720.
  const allocation = (secondAmount: number): BillingLine[] => [
    {
      id: 'bl-a',
      procedureId: 'proc-1',
      chargeBasis: 'rvg',
      amount: 500,
      description: 'Hospital portion',
    },
    {
      id: 'bl-b',
      procedureId: 'proc-1',
      chargeBasis: 'rvg',
      amount: secondAmount,
      description: 'Insurer portion',
      funderOverride: { kind: 'insurer', id: 'ins-direct' },
    },
  ]

  it('an allocation that conserves the procedure fee passes', () => {
    const ctx = mkCtx({ billingLines: allocation(190) })
    expect(validateBookingForBilling(booking, [validProcedure()], ctx)).toEqual([])
  })

  it('a non-conserving allocation fails with the fee in the message', () => {
    const ctx = mkCtx({ billingLines: allocation(200) })
    const failures = validateBookingForBilling(booking, [validProcedure()], ctx)
    expect(failures).toHaveLength(1)
    expect(failures[0]?.field).toBe('billingLines')
    expect(failures[0]?.message).toContain('$690.00')
    expect(failures[0]?.message).toContain('$700.00')
  })
})

describe('who the Contract bills needs a billing record (catch-up Phase 18 review pass; INTERIM until Phase 21)', () => {
  const recordless = mkParty({ id: 'party-group', kind: 'surgeonGroup', name: 'Group', codePrefix: 'GRP', hospitalId: undefined })
  const groupHeld = mkContract({ id: 'con-grp', name: 'Group RVG', holderId: 'party-group' })

  it('a holder-billed Contract whose holder has no billing record fails with the resolver sentence', () => {
    const p = validProcedure({ governingContractId: 'con-grp' })
    const ctx = mkCtx({ contracts: { ...CONTRACTS, 'con-grp': groupHeld }, parties: { ...mkCtx().parties, [recordless.id]: recordless } })
    expect(validateBookingForBilling(booking, [p], ctx).find((f) => f.field === 'governingContractId')?.message).toBe(noRouteCounterpartyMessage('Group RVG'))
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
    const add = validProcedure({ governingContractId: 'con-fx', isAdditional: true })
    expect(fieldsOf(validateBookingForBilling(booking, [add], ctxOn('2026-07-21')))).toContain('governingContractId')
    const typed = validProcedure({ governingContractId: 'con-fx', priceOverride: { kind: 'fixedFee', amount: 3000, reason: 'Office price' } })
    expect(fieldsOf(validateBookingForBilling(booking, [typed], ctxOn('2026-07-21')))).not.toContain('governingContractId')
  })

  it('a fixed price with a reference RVG code asks for no times (no units on a fixed price)', () => {
    const inForce = mkCtx({ contracts: { 'con-fx': fixed }, listDateISO: '2026-09-15', listHospitalId: 'hosp-1' })
    const p = validProcedure({ governingContractId: 'con-fx', anaestheticStartISO: undefined, handoverISO: undefined })
    expect(fieldsOf(validateBookingForBilling(booking, [p], inForce))).not.toContain('anaestheticStartISO')
    // An RVG-priced Procedure still needs them.
    expect(fieldsOf(validateBookingForBilling(booking, [validProcedure({ anaestheticStartISO: undefined })], mkCtx()))).toContain('anaestheticStartISO')
  })

  it('an open price is never priced at RVG: with no amount typed it asks for one (catch-up Phase 20)', () => {
    const p = validProcedure({ governingContractId: OPEN_FALLBACK.id })
    expect(validateBookingForBilling(booking, [p], mkCtx()).find((f) => f.field === 'enteredPrice')?.message).toBe(TYPE_THE_PRICE_FAILURE)
  })
})

describe('the modifier explanation backstop (catch-up Phase 19b; US-03.6.1, finished by Phase 21)', () => {
  it('fails a claim with a blank explanation, anchored to modifierClaims, and passes once it has one', () => {
    const blank = validProcedure({ modifierClaims: [mkClaim('AS3', '  ')] })
    const failures = validateBookingForBilling(booking, [blank], mkCtx())
    expect(failures).toEqual([{ procedureId: 'proc-1', field: 'modifierClaims', message: 'Add a short explanation for AS3, or remove it.' }])
    expect(validateBookingForBilling(booking, [validProcedure()], mkCtx())).toEqual([])
  })

  it('fails a claim missing the units its printed value needs', () => {
    const failures = validateBookingForBilling(booking, [validProcedure({ modifierClaims: [mkClaim('PA3', 'Seen in clinic')] })], mkCtx())
    expect(failures.map((f) => f.message)).toEqual(['Enter the units for PA3 (RVG: 2 + Time, at least 2), or remove it.'])
  })

  it('passes a Procedure with no modifier at all (FT-03.3: none is a valid answer)', () => {
    expect(validateBookingForBilling(booking, [validProcedure({ modifierClaims: [] })], mkCtx())).toEqual([])
  })
})
