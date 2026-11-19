/**
 * The price function (catch-up Phase 24; US-05.2.8, FT-05.2, US-04.2.2): one
 * test per rung and per kind, W1 to W12 of the phase doc, at an anaesthetist's
 * unit value of $30.00. W13 (parity) is `store/procedurePriceParity.test.ts`.
 */

import { describe, expect, it } from 'vitest'
import {
  anaesthetistMayTypePrice,
  officeMayChangePrice,
  priceFor,
  procedureNeedsPrice,
  PREPAID_PRICE_RAISED_MESSAGE,
  type PriceInput,
} from './procedurePrice'
import { bookingFeeFor, type ProcedureFeeContext } from './bookingFee'
import { prepaidAmountFor } from './prepayment'
import { BASE_SINGLE_10, mkAnaesthetist, mkContract, mkProcedure, RVG_MODIFIER_MASTER } from './fixtures'
import { DEFAULT_RVG_TIME_RULE } from './timeUnits'
import type { Contract, ContractPricing, Procedure } from '../types'

const UV = 30
const rvg = (pricing: ContractPricing = { kind: 'rvgAnaesthetistRate' }) => ({ pricing })
const base = (over: Partial<PriceInput> = {}): PriceInput => ({ contract: rvg(), dateISO: '2026-07-21', enteredPrice: undefined, units: 12, unitValue: UV, ...over })
const FIXED: ContractPricing = { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 500 }, { startISO: '2026-12-01', price: 550 }] }

describe('priceFor: the kinds (computed)', () => {
  it("W1 RVG at the anaesthetist's rate: 12 units x $30.00 = $360.00", () => {
    expect(priceFor(base())).toEqual({
      status: 'priced',
      price: 360,
      heldBy: null,
      computed: { kind: 'rvgAnaesthetistRate', units: 12, rate: 30, gross: 360, discountAmount: 0, total: 360 },
      computedTotal: 360,
    })
  })

  it("W2 RVG at the Contract's rate $26.50: 12 units = $318.00, the anaesthetist's $30.00 ignored", () => {
    expect(priceFor(base({ contract: rvg({ kind: 'rvgContractRate', unitRate: 26.5 }) }))).toMatchObject({ price: 318, computed: { rate: 26.5, gross: 318 } })
  })

  it("W3 RVG less the Contract's discount: 10% on a gross of $1,000.00 is $100.00, so $900.00", () => {
    const r = priceFor(base({ contract: rvg({ kind: 'rvgDiscount', discountPct: 10 }), units: 100, unitValue: 10 }))
    expect(r).toMatchObject({ status: 'priced', price: 900, computed: { gross: 1000, discountPercent: 10, discountAmount: 100, total: 900 } })
  })

  it('W4 a fixed price is the range in force on the procedure date; before the first range it needs a price', () => {
    expect(priceFor(base({ contract: { pricing: FIXED }, dateISO: '2026-12-10' }))).toMatchObject({ price: 550, computed: { kind: 'fixed', rangeStartISO: '2026-12-01' } })
    expect(priceFor(base({ contract: { pricing: FIXED }, dateISO: '2025-12-31' }))).toEqual({ status: 'needsPrice', reason: 'noRangeInForce' })
  })

  it('W5 an open price is the amount typed; with none it needs a price', () => {
    expect(priceFor(base({ contract: rvg({ kind: 'open' }), enteredPrice: 650 }))).toEqual({ status: 'priced', price: 650, heldBy: 'typed' })
    expect(priceFor(base({ contract: rvg({ kind: 'open' }) }))).toEqual({ status: 'needsPrice', reason: 'openPrice' })
  })

  it("a Procedure with no Contract yet prices at the anaesthetist's unit value, as No contract · RVG does", () => {
    expect(priceFor(base({ contract: undefined }))).toMatchObject({ price: 360, heldBy: null })
  })

  it('prices whatever is recorded so far: 0 units is $0.00, never a refusal', () => {
    expect(priceFor(base({ units: 0 }))).toMatchObject({ status: 'priced', price: 0 })
  })
})

describe('priceFor: the ladder', () => {
  it('W6 a typed $450.00 on No contract · RVG holds the price, the computed $360.00 kept beside it', () => {
    expect(priceFor(base({ enteredPrice: 450 }))).toMatchObject({ status: 'priced', price: 450, heldBy: 'typed', computed: { total: 360 } })
  })

  it('W7 a typed $0.00 is a price (a no-charge invoice), the units untouched', () => {
    expect(priceFor(base({ enteredPrice: 0 }))).toMatchObject({ status: 'priced', price: 0, heldBy: 'typed', computed: { units: 12, total: 360 } })
  })

  it('W8 a prepaid amount raised at $500.00 holds against a later $550 range', () => {
    const later: ContractPricing = { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 550 }] }
    expect(priceFor(base({ contract: { pricing: later }, held: { prepaid: 500 } }))).toMatchObject({ price: 500, heldBy: 'prepaid', computed: { total: 550 } })
  })

  it('W9 an AUTHORISED price stands when a new range arrives, ahead of every other rung', () => {
    const r = priceFor(base({ contract: { pricing: FIXED }, dateISO: '2026-12-10', enteredPrice: 400, held: { authorised: 500, prepaid: 480 } }))
    expect(r).toMatchObject({ price: 500, heldBy: 'authorised', computed: { total: 550 } })
    // Even with nothing the kind can work out, a held price is a price.
    expect(priceFor(base({ contract: rvg({ kind: 'open' }), held: { authorised: 300 } }))).toMatchObject({ status: 'priced', price: 300 })
  })

  it('W10 a rate edit from $26.50 to $28.00 reaches the unheld Procedure only', () => {
    const at = (unitRate: number, over: Partial<PriceInput> = {}) => priceFor(base({ contract: rvg({ kind: 'rvgContractRate', unitRate }), ...over }))
    expect([at(26.5), at(28)].map((r) => (r.status === 'priced' ? r.price : null))).toEqual([318, 336])
    for (const held of [{ enteredPrice: 300 }, { held: { prepaid: 318 } }, { held: { authorised: 318 } }]) {
      expect(at(28, held), JSON.stringify(held)).toMatchObject({ price: at(26.5, held).status === 'priced' ? (at(26.5, held) as { price: number }).price : -1 })
    }
  })

  it('W11 each figure rounded to cents once: 11 units at $30.30 less 12.5% is $333.30, $41.66 and $291.64', () => {
    const r = priceFor(base({ contract: rvg({ kind: 'rvgDiscount', discountPct: 12.5 }), units: 11, unitValue: 30.3 }))
    expect(r).toMatchObject({ price: 291.64, computed: { gross: 333.3, discountAmount: 41.66, total: 291.64 } })
  })

  it('the computed total is the kind\'s own figure; a typed or held amount is the whole price', () => {
    expect(priceFor(base())).toMatchObject({ price: 360, computedTotal: 360 })
    expect(priceFor(base({ enteredPrice: 440 }))).toMatchObject({ price: 440, heldBy: 'typed', computedTotal: 360, computed: { total: 360 } })
    expect(priceFor(base({ held: { authorised: 440 } }))).toMatchObject({ price: 440, computedTotal: 360 })
  })

  it('procedureNeedsPrice: no typed price and nothing the kind works out', () => {
    const fixed = mkContract({ pricing: FIXED })
    expect(procedureNeedsPrice(fixed, '2025-06-01', {})).toBe(true)
    expect(procedureNeedsPrice(fixed, '2025-06-01', { enteredPrice: 0 })).toBe(false)
    expect(procedureNeedsPrice(mkContract({ pricing: { kind: 'open' } }), '2026-07-21', {})).toBe(true)
    expect(procedureNeedsPrice(mkContract(), '2020-01-01', {})).toBe(false)
    // The ladder's order holds: a held price is a price even with no range in force.
    expect(procedureNeedsPrice(fixed, '2025-06-01', {}, { prepaid: 2800 })).toBe(false)
    expect(procedureNeedsPrice(fixed, '2025-06-01', {}, { authorised: 2800 })).toBe(false)
  })
})

describe('W12 under the multi-procedure rule a discount changes only its own Procedure', () => {
  const t = (hhmm: string) => `2026-07-21T${hhmm}:00`
  const A = mkProcedure({ id: 'P-A', isPrimary: true, rvgGroupId: BASE_SINGLE_10.id, anaestheticStartISO: t('08:00'), handoverISO: t('09:00') })
  const B = mkProcedure({ id: 'P-B', isPrimary: false, rvgGroupId: BASE_SINGLE_10.id, anaestheticStartISO: t('09:00'), handoverISO: t('09:30') })
  const ctx = (contracts: Record<string, Contract>) => (p: Procedure): ProcedureFeeContext => ({
    anaesthetist: mkAnaesthetist({ unitValue: UV }),
    dateISO: '2026-07-21',
    timeRule: DEFAULT_RVG_TIME_RULE,
    patientDobISO: undefined,
    modifiers: RVG_MODIFIER_MASTER,
    rvgGroup: BASE_SINGLE_10,
    ...(contracts[p.id] !== undefined ? { contract: contracts[p.id] } : {}),
  })
  it("B on a 10% discount Contract: B's price falls by 10%, A's and the allocation do not move", () => {
    const plain = bookingFeeFor([A, B], ctx({}))
    const discounted = bookingFeeFor([A, B], ctx({ 'P-B': mkContract({ pricing: { kind: 'rvgDiscount', discountPct: 10 } }) }))
    if (plain.kind !== 'ok' || discounted.kind !== 'ok') throw new Error('structural')
    expect(discounted.fees['P-A']!.total).toBe(plain.fees['P-A']!.total)
    expect(discounted.allocations).toEqual(plain.allocations)
    const gross = plain.fees['P-B']!.total
    expect(discounted.fees['P-B']!.total).toBe(Math.round(gross * 90) / 100)
  })
})

describe('the prepaid held amount (catch-up Phase 27)', () => {
  it('prepaidAmountFor: a raised prepayment line holds the price in full, whatever its text; none raised reads the price now', () => {
    expect(prepaidAmountFor({ governingContractId: 'CT-1' }, 900, { contractId: 'CT-1', amount: 500 })).toEqual({ kind: 'priced', contractId: 'CT-1', amount: 500, source: 'invoiced' })
    expect(prepaidAmountFor({ governingContractId: 'CT-1' }, 900)).toEqual({ kind: 'priced', contractId: 'CT-1', amount: 900, source: 'range' })
    expect(prepaidAmountFor({ governingContractId: 'CT-1' }, null)).toEqual({ kind: 'noPrice' })
  })
})

describe('who may change the price (OQ-107, OQ-117, OQ-96, A16, A37)', () => {
  const c = (over: Partial<Contract>) => mkContract({ anaesthetistMayOverridePrice: false, prepaid: false, billsTo: 'payer', ...over })
  it('the anaesthetist: override on an RVG kind whose setting is on, never where it is off', () => {
    for (const pricing of [{ kind: 'rvgAnaesthetistRate' }, { kind: 'rvgContractRate', unitRate: 26.5 }, { kind: 'rvgDiscount', discountPct: 10 }] as ContractPricing[]) {
      expect(anaesthetistMayTypePrice(c({ pricing, anaesthetistMayOverridePrice: true }))).toEqual({ may: true, mode: 'override' })
      expect(anaesthetistMayTypePrice(c({ pricing }))).toEqual({ may: false, reason: 'notAllowed' })
    }
  })
  it('the anaesthetist: never a fixed price, her own price list included, whatever the setting says', () => {
    expect(anaesthetistMayTypePrice(c({ pricing: FIXED, linkedAnaesthetistId: 'A1', anaesthetistMayOverridePrice: true }))).toEqual({ may: false, reason: 'fixed' })
  })
  it('the anaesthetist: never a prepaid Contract (tested though 18 refuses the setting there)', () => {
    expect(anaesthetistMayTypePrice(c({ pricing: FIXED, prepaid: true }))).toEqual({ may: false, reason: 'prepaid' })
    expect(anaesthetistMayTypePrice(c({ pricing: { kind: 'rvgAnaesthetistRate' }, prepaid: true, anaesthetistMayOverridePrice: true }))).toEqual({ may: false, reason: 'prepaid' })
  })
  it('the anaesthetist: the amount on No contract · Fixed price; any other fallback, or no Contract, is the office', () => {
    expect(anaesthetistMayTypePrice(c({ pricing: { kind: 'open' }, systemRole: 'openPriceFallback', billsTo: 'payer' }))).toEqual({ may: true, mode: 'amount' })
    expect(anaesthetistMayTypePrice(c({ pricing: { kind: 'open' }, systemRole: 'openPriceFallback', billsTo: 'holder' }))).toEqual({ may: false, reason: 'office' })
    expect(anaesthetistMayTypePrice(c({ pricing: { kind: 'open' }, systemRole: 'openPriceFallback', prepaid: true }))).toEqual({ may: false, reason: 'prepaid' })
    expect(anaesthetistMayTypePrice(undefined)).toEqual({ may: false, reason: 'office' })
  })
  it('the office: any price, until a prepayment invoice is raised', () => {
    expect(officeMayChangePrice({ prepaymentRaised: false })).toEqual({ may: true })
    expect(officeMayChangePrice({ prepaymentRaised: true })).toEqual({ may: false, message: PREPAID_PRICE_RAISED_MESSAGE })
    expect(PREPAID_PRICE_RAISED_MESSAGE).toBe('This price is on a raised prepayment invoice. Use a credit or an additional invoice.')
  })
})
