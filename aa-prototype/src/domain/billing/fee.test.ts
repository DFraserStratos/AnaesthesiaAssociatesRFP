import { describe, expect, it } from 'vitest'
import { feeFor, resolveBtm, splitBillingUnits } from './fee'
import {
  BASE_RANGE_5_9,
  BASE_SINGLE_10,
  HANDOVER_1030,
  mkAnaesthetist,
  mkContract,
  mkProcedure,
  START_0800,
} from './fixtures'
import type { BillingLine } from '../types'
import { DEFAULT_RVG_TIME_RULE as R } from './timeUnits'

/** The fee context every case shares: the List's date and the seeded time rule. */
const ON = { dateISO: '2026-07-21', timeRule: R }

const anaesthetist = mkAnaesthetist({ unitValue: 30 })

/** Base 10 + AS3 + 2h30m: B=10, T=11, M=3 → 24 units. */
const spotCheckProcedure = mkProcedure({
  rvgGroupId: 'RG-T-GA10',
  asaClass: 'AS3',
  anaestheticStartISO: START_0800,
  handoverISO: HANDOVER_1030,
})

describe('resolveBtm', () => {
  it('computes seeded B/T/M from the captured inputs', () => {
    const btm = resolveBtm(spotCheckProcedure, BASE_SINGLE_10, R)
    expect(btm.base).toEqual({ units: 10, source: 'seeded' })
    expect(btm.time).toEqual({ units: 11, source: 'seeded' })
    expect(btm.modifiers).toEqual({ units: 3, source: 'seeded' })
    expect(btm.totalUnits).toBe(24)
  })

  it('an overridden captured value beats the seeded computation', () => {
    const p = mkProcedure({
      ...spotCheckProcedure,
      timeUnitsCaptured: { units: 9, source: 'overridden' },
      baseUnitsCaptured: { units: 12, source: 'overridden' },
    })
    const btm = resolveBtm(p, BASE_SINGLE_10, R)
    expect(btm.time).toEqual({ units: 9, source: 'overridden' })
    expect(btm.base).toEqual({ units: 12, source: 'overridden' })
    expect(btm.totalUnits).toBe(12 + 9 + 3)
  })

  it('a range base code uses the selected value', () => {
    const p = mkProcedure({ rvgGroupId: 'RG-T-NR59', baseUnitsSelected: 7 })
    expect(resolveBtm(p, BASE_RANGE_5_9, R).base.units).toBe(7)
  })

  it('a ranged group with no chosen value starts at its starting figure (D35; catch-up Phase 19)', () => {
    const p = mkProcedure({ rvgGroupId: 'RG-T-NR59' })
    const btm = resolveBtm(p, BASE_RANGE_5_9, R)
    expect(btm.base.units).toBe(5)
    expect(btm.baseSource).toBe('rvgGroup')
    expect(btm.baseOutsideGuide).toBe(false)
  })

  it('accepts any chosen value and marks one outside the guide (D3)', () => {
    const btm = resolveBtm(mkProcedure({ rvgGroupId: 'RG-T-NR59', baseUnitsSelected: 12 }), BASE_RANGE_5_9, R)
    expect(btm.base.units).toBe(12)
    expect(btm.baseSource).toBe('chosen')
    expect(btm.baseOutsideGuide).toBe(true)
    expect(btm.baseGuide).toEqual({ figure: 5, range: { min: 5, max: 9 } })
  })

  it("adds the RVG group's modifier units (0 by default) to M", () => {
    const p = mkProcedure({ rvgGroupId: BASE_SINGLE_10.id, asaClass: undefined, selectedModifierCodes: [] })
    expect(resolveBtm(p, BASE_SINGLE_10, R).modifiers.units).toBe(0)
    expect(resolveBtm(p, { ...BASE_SINGLE_10, modifierUnits: 2 }, R).modifiers.units).toBe(2)
  })

  it('with no RVG code: base 0, source none', () => {
    const btm = resolveBtm(mkProcedure({ rvgGroupId: undefined }), undefined, R)
    expect(btm.base.units).toBe(0)
    expect(btm.baseSource).toBe('none')
  })

  it('does not double-count an ASA class repeated in the chip selection', () => {
    const p = mkProcedure({ ...spotCheckProcedure, selectedModifierCodes: ['AS3'] })
    expect(resolveBtm(p, BASE_SINGLE_10, R).modifiers.units).toBe(3)
  })

  it('resolves a stale AS chip against the captured ASA class to one value', () => {
    // Band rule backstop (Decisions log 2026-07-27): the chip selection is
    // seen first, so AS4 wins the ASA band and the appended AS3 is refused.
    const p = mkProcedure({ ...spotCheckProcedure, selectedModifierCodes: ['AS4'] })
    const btm = resolveBtm(p, BASE_SINGLE_10, R)
    expect(btm.modifiers.units).toBe(4) // not 7
    expect(btm.refusedModifiers.map((r) => r.code)).toEqual(['AS3'])
  })
})

describe('splitBillingUnits', () => {
  it('an additional procedure yields time units only', () => {
    const p = mkProcedure({ ...spotCheckProcedure, isAdditional: true })
    const btm = resolveBtm(p, BASE_SINGLE_10, R)
    expect(splitBillingUnits(p, btm)).toBe(11)
    expect(splitBillingUnits(spotCheckProcedure, resolveBtm(spotCheckProcedure, BASE_SINGLE_10, R))).toBe(24)
  })
})

describe('feeFor — contract types', () => {
  it('PAPER SPOT-CHECK: 2h30m at $30/unit, base 10 + AS3 = (10 + 11 + 3) x 30 = $720', () => {
    const fee = feeFor(spotCheckProcedure, { ...ON, anaesthetist, rvgGroup: BASE_SINGLE_10 })
    expect(fee.billableUnits).toBe(24)
    expect(fee.unitRate).toBe(30)
    expect(fee.subtotal).toBe(720)
    expect(fee.total).toBe(720)
    expect(fee.chargeBasis).toBe('rvg')
  })

  it("RVG at the anaesthetist's rate: units x the anaesthetist unit value", () => {
    const contract = mkContract({ pricing: { kind: 'rvgAnaesthetistRate' } })
    const fee = feeFor(spotCheckProcedure, { ...ON, anaesthetist, contract, rvgGroup: BASE_SINGLE_10 })
    expect(fee.total).toBe(24 * 30)
  })

  it("RVG at the Contract's rate: units x the Contract's rate", () => {
    const contract = mkContract({ pricing: { kind: 'rvgContractRate', unitRate: 25 } })
    const fee = feeFor(spotCheckProcedure, { ...ON, anaesthetist, contract, rvgGroup: BASE_SINGLE_10 })
    expect(fee.unitRate).toBe(25)
    expect(fee.total).toBe(24 * 25)
  })

  it('RVG less a discount: units x the discounted unit value', () => {
    const contract = mkContract({ pricing: { kind: 'rvgDiscount', discountPct: 10 } })
    const fee = feeFor(spotCheckProcedure, { ...ON, anaesthetist, contract, rvgGroup: BASE_SINGLE_10 })
    expect(fee.unitRate).toBe(27)
    expect(fee.total).toBe(24 * 27)
  })

})

describe('feeFor · a fixed price from its range in force (catch-up Phase 19a)', () => {
  // Ranges from 1 Apr and 1 Jul 2026 (US-04.2.15's own example).
  const fixedPrice = mkContract({
    id: 'con-3',
    pricing: { kind: 'fixed', ranges: [{ startISO: '2026-04-01', price: 650 }, { startISO: '2026-07-01', price: 700 }] },
  })

  it("the List's date picks the range in force; the price is the whole price", () => {
    const june = feeFor(spotCheckProcedure, { ...ON, dateISO: '2026-06-15', anaesthetist, contract: fixedPrice, rvgGroup: BASE_SINGLE_10 })
    expect(june.chargeBasis).toBe('fixed')
    expect(june.unitRate).toBeNull()
    expect(june.lines).toEqual([{ chargeBasis: 'fixed', description: 'Contract price', amount: 650 }])
    expect(june.total).toBe(650)
    expect(june.needsPrice).toBe(false)
    expect(feeFor(spotCheckProcedure, { ...ON, dateISO: '2026-07-01', anaesthetist, contract: fixedPrice, rvgGroup: BASE_SINGLE_10 }).total).toBe(700)
    // BTM is still worked out, for reference only.
    expect(june.btm.totalUnits).toBe(24)
  })

  it('a fixed price is the whole price on an additional Procedure too (no second-procedure rule, RV-07)', () => {
    const p = mkProcedure({ ...spotCheckProcedure, isAdditional: true })
    const fee = feeFor(p, { ...ON, anaesthetist, contract: fixedPrice, rvgGroup: BASE_SINGLE_10 })
    expect(fee.total).toBe(700)
    expect(fee.lines.map((l) => l.chargeBasis)).toEqual(['fixed'])
  })

  it('needs a price before the first range: no line, no amount, never a fall back to RVG', () => {
    const fee = feeFor(spotCheckProcedure, { ...ON, dateISO: '2026-03-31', anaesthetist, contract: fixedPrice, rvgGroup: BASE_SINGLE_10 })
    expect(fee.needsPrice).toBe(true)
    expect(fee.lines).toEqual([])
    expect(fee.chargeBasis).toBe('fixed')
    expect(fee.unitRate).toBeNull()
  })

  it("an office fixed fee is a typed price and clears needs-a-price; an adjustment of nothing does not", () => {
    const typed = mkProcedure({ ...spotCheckProcedure, priceOverride: { kind: 'fixedFee', amount: 600, reason: 'Agreed' } })
    const fee = feeFor(typed, { ...ON, dateISO: '2026-03-31', anaesthetist, contract: fixedPrice, rvgGroup: BASE_SINGLE_10 })
    expect(fee).toMatchObject({ needsPrice: false, total: 600 })
    const nudged = mkProcedure({ ...spotCheckProcedure, priceOverride: { kind: 'dollarAdjustment', amount: 50, reason: 'x' } })
    expect(feeFor(nudged, { ...ON, dateISO: '2026-03-31', anaesthetist, contract: fixedPrice, rvgGroup: BASE_SINGLE_10 }).needsPrice).toBe(true)
  })

  it('a backdated range re-prices an unedited Procedure; an office override holds its own figure', () => {
    const backdated = mkContract({
      ...fixedPrice,
      pricing: { kind: 'fixed', ranges: [...(fixedPrice.pricing.kind === 'fixed' ? fixedPrice.pricing.ranges : []), { startISO: '2026-06-01', price: 680 }] },
    })
    const ctx = { ...ON, dateISO: '2026-06-15', anaesthetist, rvgGroup: BASE_SINGLE_10 }
    expect(feeFor(spotCheckProcedure, { ...ctx, contract: fixedPrice }).total).toBe(650)
    expect(feeFor(spotCheckProcedure, { ...ctx, contract: backdated }).total).toBe(680)
    const edited = mkProcedure({ ...spotCheckProcedure, priceOverride: { kind: 'fixedFee', amount: 640, reason: 'Office price' } })
    expect(feeFor(edited, { ...ctx, contract: backdated }).total).toBe(640)
  })

  it("the rate kinds ignore the date and the anaesthetist's value where the Contract sets the rate", () => {
    const rate = mkContract({ pricing: { kind: 'rvgContractRate', unitRate: 26.5 } })
    const dear = mkAnaesthetist({ unitValue: 42 })
    expect(feeFor(spotCheckProcedure, { ...ON, dateISO: '2020-01-01', anaesthetist: dear, contract: rate, rvgGroup: BASE_SINGLE_10 }).total).toBe(24 * 26.5)
  })

  it('an open price needs a price too: its RVG working is never shown as its price', () => {
    const open = mkContract({ pricing: { kind: 'open' } })
    expect(feeFor(spotCheckProcedure, { ...ON, anaesthetist, contract: open, rvgGroup: BASE_SINGLE_10 }).needsPrice).toBe(true)
  })

  it("Merivale's Facelift plus 1 add on is priced as one, $3,400 ex GST", () => {
    const combo = mkContract({ name: 'Facelift plus 1 add on (eg bleph)', pricing: { kind: 'fixed', ranges: [{ startISO: '2026-06-01', price: 3400 }] } })
    const fee = feeFor(mkProcedure({ rvgGroupId: undefined }), { ...ON, dateISO: '2026-07-29', anaesthetist, contract: combo })
    expect(fee.lines).toEqual([{ chargeBasis: 'fixed', description: 'Contract price', amount: 3400 }])
    expect(fee.total).toBe(3400)
  })
})

describe('feeFor — non-RVG billing lines', () => {
  it('a rate x time line computes hours x rate', () => {
    const line: BillingLine = {
      id: 'bl-1',
      procedureId: 'proc-1',
      chargeBasis: 'rateTime',
      hours: 2.5,
      rate: 400,
      amount: 0,
      description: 'Individually arranged hourly rate',
    }
    const p = mkProcedure({ rvgGroupId: undefined })
    const fee = feeFor(p, { ...ON, anaesthetist, nonRvgLines: [line] })
    expect(fee.chargeBasis).toBe('rateTime')
    expect(fee.lines).toHaveLength(1)
    expect(fee.total).toBe(1000)
  })

  it('a fixed ancillary line adds to the RVG subtotal (mixed basis)', () => {
    const line: BillingLine = {
      id: 'bl-2',
      procedureId: 'proc-1',
      chargeBasis: 'fixed',
      amount: 80,
      description: 'Consumables',
    }
    const fee = feeFor(spotCheckProcedure, {
      ...ON,
      anaesthetist,
      rvgGroup: BASE_SINGLE_10,
      nonRvgLines: [line],
    })
    expect(fee.chargeBasis).toBe('mixed')
    expect(fee.subtotal).toBe(720 + 80)
    expect(fee.total).toBe(800)
  })
})

describe('feeFor — typed price overrides', () => {
  it('fixedFee replaces the subtotal', () => {
    const p = mkProcedure({
      ...spotCheckProcedure,
      priceOverride: { kind: 'fixedFee', amount: 650, reason: 'Agreed with patient' },
    })
    const fee = feeFor(p, { ...ON, anaesthetist, rvgGroup: BASE_SINGLE_10 })
    expect(fee.subtotal).toBe(720)
    expect(fee.override).toMatchObject({ before: 720, after: 650 })
    expect(fee.total).toBe(650)
  })

  it('dollarAdjustment shifts the subtotal', () => {
    const p = mkProcedure({
      ...spotCheckProcedure,
      priceOverride: { kind: 'dollarAdjustment', amount: -120, reason: 'Goodwill discount' },
    })
    expect(feeFor(p, { ...ON, anaesthetist, rvgGroup: BASE_SINGLE_10 }).total).toBe(600)
  })

  it('percentAdjustment scales the subtotal', () => {
    const p = mkProcedure({
      ...spotCheckProcedure,
      priceOverride: { kind: 'percentAdjustment', percent: -25, reason: 'Hardship' },
    })
    expect(feeFor(p, { ...ON, anaesthetist, rvgGroup: BASE_SINGLE_10 }).total).toBe(540)
  })

  it('amounts round to cents', () => {
    const p = mkProcedure({
      ...spotCheckProcedure,
      priceOverride: { kind: 'percentAdjustment', percent: -33.333, reason: 'Test' },
    })
    const fee = feeFor(p, { ...ON, anaesthetist, rvgGroup: BASE_SINGLE_10 })
    expect(fee.total).toBe(480)
  })
})
