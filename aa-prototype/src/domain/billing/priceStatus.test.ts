import { describe, expect, it } from 'vitest'
import { DEFAULT_RVG_TIME_RULE } from './timeUnits'
import { BASE_SINGLE_10, HANDOVER_1030, RVG_MODIFIER_MASTER, START_0800, mkAnaesthetist, mkContract, mkProcedure } from './fixtures'
import { computedPriceFor, priceStatusFor } from './priceStatus'
import { type FeeContext } from './fee'
import { soleAllocation } from './multiProcedure'
import { soleProcedureFee as feeFor } from './bookingFee'

const FIXED = mkContract({ id: 'fx', pricing: { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 400 }, { startISO: '2026-09-01', price: 450 }] } })
const LATER = mkContract({ id: 'later', pricing: { kind: 'fixed', ranges: [{ startISO: '2026-09-01', price: 3100 }] } })
const OPEN = mkContract({ id: 'open', pricing: { kind: 'open' } })
const RVG = mkContract({ id: 'rvg' })

const feeCtx: FeeContext = {
  anaesthetist: mkAnaesthetist({ unitValue: 30 }),
  dateISO: '2026-07-21',
  timeRule: DEFAULT_RVG_TIME_RULE,
  patientDobISO: undefined,
  modifiers: RVG_MODIFIER_MASTER,
  nonRvgLines: [],
  rvgGroup: BASE_SINGLE_10,
  allocation: soleAllocation(true, 0),
}

describe('the price status, one selector (catch-up Phase 21a; US-05.2.8, AR-58 5.7, A48)', () => {
  it('RVG kinds are priced; a fixed price reads the range in force on the List\'s date', () => {
    expect(priceStatusFor(mkProcedure(), RVG, '2026-07-21')).toEqual({ status: 'priced' })
    expect(priceStatusFor(mkProcedure(), FIXED, '2026-07-21')).toEqual({ status: 'priced' })
    expect(priceStatusFor(mkProcedure(), LATER, '2026-07-21')).toEqual({ status: 'needsPrice', reason: 'noRangeInForce' })
  })

  it('a range added later, or a moved date inside it, prices it', () => {
    expect(priceStatusFor(mkProcedure(), LATER, '2026-09-01')).toEqual({ status: 'priced' })
  })

  it('an open price needs a price until one is typed; the office\'s fixed fee is a typed price', () => {
    expect(priceStatusFor(mkProcedure(), OPEN, '2026-07-21')).toEqual({ status: 'needsPrice', reason: 'openPrice' })
    expect(priceStatusFor(mkProcedure({ enteredPrice: 900 }), OPEN, '2026-07-21')).toEqual({ status: 'priced' })
    expect(priceStatusFor(mkProcedure({ priceOverride: { kind: 'fixedFee', amount: 2000, reason: 'Office' } }), LATER, '2026-07-21')).toEqual({ status: 'priced' })
  })

  it('no Contract has no price status (the Contract condition reports it)', () => {
    expect(priceStatusFor(mkProcedure(), undefined, '2026-07-21')).toBeUndefined()
  })
})

describe('computedPriceFor: the price with nothing typed, for the review flag', () => {
  it('the range price on a fixed price, following the date', () => {
    expect(computedPriceFor(mkProcedure(), FIXED, feeCtx)).toBe(400)
    expect(computedPriceFor(mkProcedure(), FIXED, { ...feeCtx, dateISO: '2026-09-15' })).toBe(450)
    expect(computedPriceFor(mkProcedure(), LATER, feeCtx)).toBeUndefined()
  })

  it("the fee engine's own figure on an RVG kind, ignoring a typed override", () => {
    const p = mkProcedure({ rvgGroupId: BASE_SINGLE_10.id, anaestheticStartISO: START_0800, handoverISO: HANDOVER_1030 })
    const engine = feeFor(p, { ...feeCtx, contract: RVG }).total
    expect(computedPriceFor({ ...p, priceOverride: { kind: 'fixedFee', amount: 1, reason: 'Mine' } }, RVG, feeCtx)).toBe(engine)
  })

  it('none on an open price or with no Contract', () => {
    expect(computedPriceFor(mkProcedure({ enteredPrice: 900 }), OPEN, feeCtx)).toBeUndefined()
    expect(computedPriceFor(mkProcedure(), undefined, feeCtx)).toBeUndefined()
  })
})
