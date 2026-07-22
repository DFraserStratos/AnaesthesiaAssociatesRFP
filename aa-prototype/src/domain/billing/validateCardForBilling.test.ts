import { describe, expect, it } from 'vitest'
import { validateCardForBilling, type CardBillingContext } from './validateCardForBilling'
import {
  BASE_RANGE_5_9,
  BASE_SINGLE_10,
  HANDOVER_1030,
  mkAnaesthetist,
  mkBillableParty,
  mkCard,
  mkContract,
  mkInsurer,
  mkProcedure,
  START_0800,
} from './fixtures'
import type { BillingLine, Procedure } from '../types'

function mkCtx(overrides: Partial<CardBillingContext> = {}): CardBillingContext {
  return {
    anaesthetist: mkAnaesthetist({ unitValue: 30 }),
    rvgCodes: { GA10: BASE_SINGLE_10, NR59: BASE_RANGE_5_9 },
    contracts: {},
    contractPrices: [],
    insurers: {
      'ins-direct': mkInsurer({ id: 'ins-direct' }),
      'ins-nodirect': mkInsurer({ id: 'ins-nodirect', name: 'ClaimsBack Health', acceptsDirectClaims: false }),
    },
    billableParties: { 'bp-1': mkBillableParty() },
    billingLines: [],
    ...overrides,
  }
}

/** A fully billable RVG procedure on the contract-holder route. */
function validProcedure(overrides: Partial<Procedure> = {}): Procedure {
  return mkProcedure({
    rvgBaseCode: 'GA10',
    anaestheticStartISO: START_0800,
    handoverISO: HANDOVER_1030,
    asaClass: 'AS3',
    ...overrides,
  })
}

const card = mkCard()

function fieldsOf(failures: { field: string }[]): string[] {
  return failures.map((f) => f.field)
}

describe('validateCardForBilling — happy paths', () => {
  it('a complete RVG procedure passes', () => {
    expect(validateCardForBilling(card, [validProcedure()], mkCtx())).toEqual([])
  })

  it('BillableParty route with a patient present and NO override record PASSES (patient is the default payer)', () => {
    const p = validProcedure({
      billingRoute: 'billableParty',
      patientPaymentCategory: 'selfFundedPostProcedure',
    })
    expect(validateCardForBilling(card, [p], mkCtx())).toEqual([])
  })

  it('a cancelled Card is excluded from validation entirely', () => {
    const cancelled = mkCard({
      cancellation: {
        reason: 'Patient unwell',
        by: 'Kirsty W.',
        role: 'office',
        source: 'office',
        atISO: '2026-07-21T09:00:00',
      },
    })
    // Deliberately broken procedure — still no failures because the Card is cancelled.
    const broken = mkProcedure({ billingRoute: undefined })
    expect(validateCardForBilling(cancelled, [broken], mkCtx())).toEqual([])
  })
})

describe('validateCardForBilling — required data', () => {
  it('fails a missing billing route', () => {
    const p = validProcedure({ billingRoute: undefined })
    const failures = validateCardForBilling(card, [p], mkCtx())
    expect(fieldsOf(failures)).toContain('billingRoute')
  })

  it('fails when there is no base code and no non-RVG billing line', () => {
    const p = mkProcedure()
    const failures = validateCardForBilling(card, [p], mkCtx())
    expect(fieldsOf(failures)).toContain('rvgBaseCode')
  })

  it('passes with no base code when a non-RVG line exists', () => {
    const line: BillingLine = {
      id: 'bl-1',
      procedureId: 'proc-1',
      chargeBasis: 'fixed',
      amount: 150,
      description: 'Consult',
    }
    const failures = validateCardForBilling(card, [mkProcedure()], mkCtx({ billingLines: [line] }))
    expect(failures).toEqual([])
  })

  it('fails missing start/handover times on the RVG path', () => {
    const p = validProcedure({ anaestheticStartISO: undefined, handoverISO: undefined })
    const failures = validateCardForBilling(card, [p], mkCtx())
    expect(fieldsOf(failures)).toEqual(
      expect.arrayContaining(['anaestheticStartISO', 'handoverISO']),
    )
  })

  it('fails times out of order', () => {
    const p = validProcedure({ anaestheticStartISO: HANDOVER_1030, handoverISO: START_0800 })
    const failures = validateCardForBilling(card, [p], mkCtx())
    expect(failures.some((f) => f.field === 'handoverISO' && /after/.test(f.message))).toBe(true)
  })

  it('fails a range base code with a missing or out-of-range selection', () => {
    const missing = validProcedure({ rvgBaseCode: 'NR59' })
    expect(fieldsOf(validateCardForBilling(card, [missing], mkCtx()))).toContain('baseUnitsSelected')

    const outOfRange = validProcedure({ rvgBaseCode: 'NR59', baseUnitsSelected: 12 })
    expect(fieldsOf(validateCardForBilling(card, [outOfRange], mkCtx()))).toContain('baseUnitsSelected')

    const inRange = validProcedure({ rvgBaseCode: 'NR59', baseUnitsSelected: 7 })
    expect(validateCardForBilling(card, [inRange], mkCtx())).toEqual([])
  })
})

describe('validateCardForBilling — routes', () => {
  it('fails the Insurer route without an insurer', () => {
    const p = validProcedure({ billingRoute: 'insurer' })
    expect(fieldsOf(validateCardForBilling(card, [p], mkCtx()))).toContain('insurerId')
  })

  it('rejects an insurer that does not accept direct claims', () => {
    const p = validProcedure({ billingRoute: 'insurer', insurerId: 'ins-nodirect' })
    const failures = validateCardForBilling(card, [p], mkCtx())
    expect(failures.some((f) => f.field === 'insurerId' && /direct claims/.test(f.message))).toBe(true)
  })

  it('passes the Insurer route with a direct-claims insurer', () => {
    const p = validProcedure({ billingRoute: 'insurer', insurerId: 'ins-direct' })
    expect(validateCardForBilling(card, [p], mkCtx())).toEqual([])
  })

  it('fails the BillableParty route without a patient payment category', () => {
    const p = validProcedure({ billingRoute: 'billableParty' })
    expect(fieldsOf(validateCardForBilling(card, [p], mkCtx()))).toContain('patientPaymentCategory')
  })

  it('fails an unresolvable billable-party override', () => {
    const p = validProcedure({
      billingRoute: 'billableParty',
      patientPaymentCategory: 'selfFundedPostProcedure',
      billablePartyId: 'bp-ghost',
    })
    expect(fieldsOf(validateCardForBilling(card, [p], mkCtx()))).toContain('billablePartyId')
  })
})

describe('validateCardForBilling — pre-payment typing', () => {
  const base = {
    billingRoute: 'billableParty',
    patientPaymentCategory: 'selfFundedPrepayment',
  } as const

  it('requires a prepayment detail for the self funded pre-payment category', () => {
    const p = validProcedure({ ...base })
    expect(fieldsOf(validateCardForBilling(card, [p], mkCtx()))).toContain('prepaymentDetail')
  })

  it('a split pre-payment without a deposit amount fails', () => {
    const p = validProcedure({ ...base, prepaymentDetail: { type: 'split' } })
    expect(fieldsOf(validateCardForBilling(card, [p], mkCtx()))).toContain('prepaymentDetail')
  })

  it('full pre-payment, and split with a deposit, pass', () => {
    const full = validProcedure({ ...base, prepaymentDetail: { type: 'full' } })
    const split = validProcedure({ ...base, prepaymentDetail: { type: 'split', depositAmount: 300 } })
    expect(validateCardForBilling(card, [full], mkCtx())).toEqual([])
    expect(validateCardForBilling(card, [split], mkCtx())).toEqual([])
  })
})

describe('validateCardForBilling — rate x time gate (Method 3)', () => {
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
    const permitting = mkContract({ id: 'con-ia', permitsIndividualArrangement: true })
    const p = mkProcedure({ governingContractId: 'con-ia' })
    const ctx = mkCtx({ contracts: { 'con-ia': permitting }, billingLines: [rateTimeLine] })
    expect(validateCardForBilling(card, [p], ctx)).toEqual([])
  })

  it('fails under a non-permitting contract, and with no contract at all', () => {
    const nonPermitting = mkContract({ id: 'con-std' })
    const p = mkProcedure({ governingContractId: 'con-std' })
    const ctx = mkCtx({ contracts: { 'con-std': nonPermitting }, billingLines: [rateTimeLine] })
    expect(fieldsOf(validateCardForBilling(card, [p], ctx))).toContain('billingLines')

    const orphan = mkProcedure()
    const ctx2 = mkCtx({ billingLines: [rateTimeLine] })
    expect(fieldsOf(validateCardForBilling(card, [orphan], ctx2))).toContain('billingLines')
  })
})

describe('validateCardForBilling — price override reason', () => {
  it('an override with an empty reason fails', () => {
    const p = validProcedure({ priceOverride: { kind: 'fixedFee', amount: 500, reason: '  ' } })
    expect(fieldsOf(validateCardForBilling(card, [p], mkCtx()))).toContain('priceOverride')
  })

  it('an override with a reason passes', () => {
    const p = validProcedure({
      priceOverride: { kind: 'dollarAdjustment', amount: -50, reason: 'Agreed discount' },
    })
    expect(validateCardForBilling(card, [p], mkCtx())).toEqual([])
  })
})

describe('validateCardForBilling — two-funder conservation', () => {
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
    const ctx = mkCtx({ billingLines: allocation(220) })
    expect(validateCardForBilling(card, [validProcedure()], ctx)).toEqual([])
  })

  it('a non-conserving allocation fails with the fee in the message', () => {
    const ctx = mkCtx({ billingLines: allocation(200) })
    const failures = validateCardForBilling(card, [validProcedure()], ctx)
    expect(failures).toHaveLength(1)
    expect(failures[0]?.field).toBe('billingLines')
    expect(failures[0]?.message).toContain('$720.00')
    expect(failures[0]?.message).toContain('$700.00')
  })
})
