import { describe, expect, it } from 'vitest'
import { resolveBtm } from './fee'
// A single-Procedure Booking's fee, through the one engine (catch-up Phase 23).
import { bookingFeeFor } from './bookingFee'
import { soleProcedureFee as feeFor } from './fixtures'
import {
  BASE_RANGE_5_9,
  BASE_SINGLE_10,
  HANDOVER_1030,
  mkAnaesthetist,
  mkContract,
  mkClaim,
  mkProcedure,
  NO_PATIENT_MODIFIERS as MI,
  RVG_MODIFIER_MASTER,
  START_0800,
} from './fixtures'
import { DEFAULT_RVG_TIME_RULE as R } from './timeUnits'

/** The fee context every case shares: the List's date, the seeded time rule, no patient DOB and the RVG modifier master. */
const ON = { dateISO: '2026-11-24', timeRule: R, patientDobISO: undefined, modifiers: RVG_MODIFIER_MASTER }

const anaesthetist = mkAnaesthetist({ unitValue: 30 })

/**
 * Base 10 + an AS3 claim + 2h30m: B=10, T=11, M=2 → 23 units. AS3 is 2 units
 * as the RVG prints it (catch-up Phase 19b, RV-22/RV-38; the demo table had 3).
 */
const spotCheckProcedure = mkProcedure({
  rvgGroupId: 'RG-T-GA10',
  modifierClaims: [mkClaim('AS3', 'ASA III on pre-op review')],
  anaestheticStartISO: START_0800,
  handoverISO: HANDOVER_1030,
})

describe('resolveBtm', () => {
  it('computes seeded B/T/M from the captured inputs', () => {
    const btm = resolveBtm(spotCheckProcedure, BASE_SINGLE_10, R, MI)
    expect(btm.base).toEqual({ units: 10, source: 'seeded' })
    expect(btm.time).toEqual({ units: 11, source: 'seeded' })
    expect(btm.modifiers).toEqual({ units: 2, source: 'seeded' })
    expect(btm.totalUnits).toBe(23)
  })

  it('an overridden captured value beats the seeded computation', () => {
    const p = mkProcedure({
      ...spotCheckProcedure,
      timeUnitsCaptured: { units: 9, source: 'overridden' },
      baseUnitsCaptured: { units: 12, source: 'overridden' },
    })
    const btm = resolveBtm(p, BASE_SINGLE_10, R, MI)
    expect(btm.time).toEqual({ units: 9, source: 'overridden' })
    expect(btm.base).toEqual({ units: 12, source: 'overridden' })
    expect(btm.totalUnits).toBe(12 + 9 + 2)
  })

  it('a range base code uses the selected value', () => {
    const p = mkProcedure({ rvgGroupId: 'RG-T-NR59', baseUnitsSelected: 7 })
    expect(resolveBtm(p, BASE_RANGE_5_9, R, MI).base.units).toBe(7)
  })

  it('a ranged group with no chosen value starts at its starting figure (D35; catch-up Phase 19)', () => {
    const p = mkProcedure({ rvgGroupId: 'RG-T-NR59' })
    const btm = resolveBtm(p, BASE_RANGE_5_9, R, MI)
    expect(btm.base.units).toBe(5)
    expect(btm.baseSource).toBe('rvgGroup')
    expect(btm.baseOutsideGuide).toBe(false)
  })

  it('accepts any chosen value and marks one outside the guide (D3)', () => {
    const btm = resolveBtm(mkProcedure({ rvgGroupId: 'RG-T-NR59', baseUnitsSelected: 12 }), BASE_RANGE_5_9, R, MI)
    expect(btm.base.units).toBe(12)
    expect(btm.baseSource).toBe('chosen')
    expect(btm.baseOutsideGuide).toBe(true)
    expect(btm.baseGuide).toEqual({ figure: 5, range: { min: 5, max: 9 } })
  })

  it("adds the RVG group's modifier units (0 by default) to M", () => {
    const p = mkProcedure({ rvgGroupId: BASE_SINGLE_10.id })
    expect(resolveBtm(p, BASE_SINGLE_10, R, MI).modifiers.units).toBe(0)
    expect(resolveBtm(p, { ...BASE_SINGLE_10, modifierUnits: 2 }, R, MI).modifiers.units).toBe(2)
  })

  it('with no RVG code: base 0, source none', () => {
    const btm = resolveBtm(mkProcedure({ rvgGroupId: undefined }), undefined, R, MI)
    expect(btm.base.units).toBe(0)
    expect(btm.baseSource).toBe('none')
  })

  it('M is the starting value plus the itemised claims, with no stacking limit (catch-up Phase 19b)', () => {
    const p = mkProcedure({ rvgGroupId: BASE_SINGLE_10.id, modifierClaims: [mkClaim('OB2'), mkClaim('AS3'), mkClaim('PA2')] })
    const btm = resolveBtm(p, { ...BASE_SINGLE_10, modifierUnits: 1 }, R, MI)
    expect(btm.modifiers.units).toBe(1 + 1 + 2 + 2)
    expect(btm.modifierItems.map((i) => [i.code, i.units, i.origin])).toEqual([
      ['OB2', 1, 'chosen'],
      ['AS3', 2, 'chosen'],
      ['PA2', 2, 'chosen'],
    ])
  })

  it('pre-applies the age modifier from the date of birth on the procedure date (US-03.3.8)', () => {
    const p = mkProcedure({ rvgGroupId: BASE_SINGLE_10.id })
    const btm = resolveBtm(p, BASE_SINGLE_10, R, { ...MI, patientDobISO: '1954-07-18' })
    expect(btm.modifiers.units).toBe(1)
    expect(btm.modifierItems).toMatchObject([{ code: 'A1', origin: 'age', units: 1 }])
  })

  it('the manual M adjustment still wins over the itemised total', () => {
    const p = mkProcedure({ ...spotCheckProcedure, modifierUnitsCaptured: { units: 5, source: 'overridden' } })
    const btm = resolveBtm(p, BASE_SINGLE_10, R, MI)
    expect(btm.modifiers).toEqual({ units: 5, source: 'overridden' })
    expect(btm.modifierItems.map((i) => i.code)).toEqual(['AS3'])
  })
})

describe('resolveBtm on an additional Procedure (catch-up Phase 23)', () => {
  it('base is 0 from the source "additional", whatever its group or stored capture; M is its share, its own claims ignored', () => {
    const p = mkProcedure({ ...spotCheckProcedure, isPrimary: false, baseUnitsCaptured: { units: 12, source: 'overridden' } })
    const btm = resolveBtm(p, BASE_SINGLE_10, R, MI, { role: 'additional', modifierShare: 0 })
    expect(btm.base).toEqual({ units: 0, source: 'seeded' })
    expect(btm.baseSource).toBe('additional')
    expect(btm.time.units).toBe(11)
    expect(btm.modifiers.units).toBe(0)
    expect(btm.modifierItems).toEqual([])
    expect(resolveBtm(p, BASE_SINGLE_10, R, MI, { role: 'additional', modifierShare: 2 }).modifiers.units).toBe(2)
  })

  it("keeps base on an additional Procedure only when baseOn placed it there (baseCharged): OQ-132's answer changes baseOn alone", () => {
    const p = mkProcedure({ ...spotCheckProcedure, isPrimary: false })
    expect(resolveBtm(p, BASE_SINGLE_10, R, MI, { role: 'additional', modifierShare: 0, baseCharged: true }).base.units).toBe(10)
  })
})

describe('feeFor — contract types', () => {
  it('PAPER SPOT-CHECK: 2h30m at $30/unit, base 10 + AS3 = (10 + 11 + 2) x 30 = $690', () => {
    const fee = feeFor(spotCheckProcedure, { ...ON, anaesthetist, rvgGroup: BASE_SINGLE_10 })
    expect(fee.billableUnits).toBe(23)
    expect(fee.unitRate).toBe(30)
    expect(fee.subtotal).toBe(690)
    expect(fee.total).toBe(690)
  })

  it("RVG at the anaesthetist's rate: units x the anaesthetist unit value", () => {
    const contract = mkContract({ pricing: { kind: 'rvgAnaesthetistRate' } })
    const fee = feeFor(spotCheckProcedure, { ...ON, anaesthetist, contract, rvgGroup: BASE_SINGLE_10 })
    expect(fee.total).toBe(23 * 30)
  })

  it("RVG at the Contract's rate: units x the Contract's rate", () => {
    const contract = mkContract({ pricing: { kind: 'rvgContractRate', unitRate: 25 } })
    const fee = feeFor(spotCheckProcedure, { ...ON, anaesthetist, contract, rvgGroup: BASE_SINGLE_10 })
    expect(fee.unitRate).toBe(25)
    expect(fee.total).toBe(23 * 25)
  })

  it("RVG less a discount: units x the anaesthetist's unit value, less the discount as its own line (catch-up Phase 24, US-05.4.3)", () => {
    const contract = mkContract({ pricing: { kind: 'rvgDiscount', discountPct: 10 } })
    const fee = feeFor(spotCheckProcedure, { ...ON, anaesthetist, contract, rvgGroup: BASE_SINGLE_10 })
    expect(fee.unitRate).toBe(30)
    expect(fee.lines.map((l) => [l.amount, l.role ?? 'fee'])).toEqual([[690, 'fee'], [-69, 'discount']])
    expect(fee.lines[1]!.description).toBe('Discount 10%')
    expect(fee.total).toBe(621)
  })

})

describe('feeFor · a fixed price from its range in force (catch-up Phase 19a)', () => {
  // Ranges from 1 Apr and 1 Jul 2026 (US-04.2.15's own example).
  const fixedPrice = mkContract({
    id: 'con-3',
    pricing: { kind: 'fixed', ranges: [{ startISO: '2026-04-01', price: 650 }, { startISO: '2026-11-04', price: 700 }] },
  })

  it("the List's date picks the range in force; the price is the whole price", () => {
    const june = feeFor(spotCheckProcedure, { ...ON, dateISO: '2026-10-19', anaesthetist, contract: fixedPrice, rvgGroup: BASE_SINGLE_10 })
    expect(june.unitRate).toBeNull()
    expect(june.lines).toEqual([{ description: 'Contract price', amount: 650 }])
    expect(june.total).toBe(650)
    expect(june.needsPrice).toBe(false)
    expect(feeFor(spotCheckProcedure, { ...ON, dateISO: '2026-11-04', anaesthetist, contract: fixedPrice, rvgGroup: BASE_SINGLE_10 }).total).toBe(700)
    // BTM is still worked out, for reference only.
    expect(june.btm.totalUnits).toBe(23)
  })

  it('a fixed price is the whole price on an additional Procedure too (no second-procedure rule, RV-07)', () => {
    const primary = mkProcedure({ ...spotCheckProcedure, id: 'P-A' })
    const p = mkProcedure({ ...spotCheckProcedure, id: 'P-B', isPrimary: false })
    const result = bookingFeeFor([primary, p], (x) => ({ ...ON, anaesthetist, ...(x.id === 'P-B' ? { contract: fixedPrice } : {}), rvgGroup: BASE_SINGLE_10 }))
    const fee = result.kind === 'ok' ? result.fees['P-B']! : undefined
    expect(fee?.total).toBe(700)
    expect(fee?.lines).toEqual([{ description: 'Contract price, additional procedure', amount: 700 }])
  })

  it('needs a price before the first range: no line, no amount, never a fall back to RVG', () => {
    const fee = feeFor(spotCheckProcedure, { ...ON, dateISO: '2026-03-31', anaesthetist, contract: fixedPrice, rvgGroup: BASE_SINGLE_10 })
    expect(fee.needsPrice).toBe(true)
    expect(fee.lines).toEqual([])
    expect(fee.unitRate).toBeNull()
  })

  it('a typed price clears needs-a-price (catch-up Phase 24: the one typed price)', () => {
    const typed = mkProcedure({ ...spotCheckProcedure, enteredPrice: 600 })
    const fee = feeFor(typed, { ...ON, dateISO: '2026-03-31', anaesthetist, contract: fixedPrice, rvgGroup: BASE_SINGLE_10 })
    expect(fee).toMatchObject({ needsPrice: false, total: 600 })
    expect(fee.price).toMatchObject({ status: 'priced', heldBy: 'typed' })
  })

  it('a backdated range re-prices an unedited Procedure; an office override holds its own figure', () => {
    const backdated = mkContract({
      ...fixedPrice,
      pricing: { kind: 'fixed', ranges: [...(fixedPrice.pricing.kind === 'fixed' ? fixedPrice.pricing.ranges : []), { startISO: '2026-10-05', price: 680 }] },
    })
    const ctx = { ...ON, dateISO: '2026-10-19', anaesthetist, rvgGroup: BASE_SINGLE_10 }
    expect(feeFor(spotCheckProcedure, { ...ctx, contract: fixedPrice }).total).toBe(650)
    expect(feeFor(spotCheckProcedure, { ...ctx, contract: backdated }).total).toBe(680)
    const edited = mkProcedure({ ...spotCheckProcedure, enteredPrice: 640 })
    expect(feeFor(edited, { ...ctx, contract: backdated }).total).toBe(640)
  })

  it("the rate kinds ignore the date and the anaesthetist's value where the Contract sets the rate", () => {
    const rate = mkContract({ pricing: { kind: 'rvgContractRate', unitRate: 26.5 } })
    const dear = mkAnaesthetist({ unitValue: 42 })
    expect(feeFor(spotCheckProcedure, { ...ON, dateISO: '2020-05-06', anaesthetist: dear, contract: rate, rvgGroup: BASE_SINGLE_10 }).total).toBe(23 * 26.5)
  })

  it('an open price needs a price too: its RVG working is never shown as its price', () => {
    const open = mkContract({ pricing: { kind: 'open' } })
    expect(feeFor(spotCheckProcedure, { ...ON, anaesthetist, contract: open, rvgGroup: BASE_SINGLE_10 }).needsPrice).toBe(true)
  })

  it("Merivale's Facelift plus 1 add on is priced as one, $3,400 ex GST", () => {
    const combo = mkContract({ name: 'Facelift plus 1 add on (eg bleph)', pricing: { kind: 'fixed', ranges: [{ startISO: '2026-10-05', price: 3400 }] } })
    const fee = feeFor(mkProcedure({ rvgGroupId: undefined }), { ...ON, dateISO: '2026-12-02', anaesthetist, contract: combo })
    expect(fee.lines).toEqual([{ description: 'Contract price', amount: 3400 }])
    expect(fee.total).toBe(3400)
  })
})

describe('feeFor: a typed price (catch-up Phase 24; the reasoned override is gone)', () => {
  it('a typed price is the price, one line at the price, the computed price kept beside it', () => {
    const p = mkProcedure({ ...spotCheckProcedure, enteredPrice: 650 })
    const fee = feeFor(p, { ...ON, anaesthetist, rvgGroup: BASE_SINGLE_10 })
    expect(fee.total).toBe(650)
    // Still the RVG line with its units, for reference (US-03.5.2), but no rate: the price is typed.
    expect(fee.lines).toEqual([{ description: 'Anaesthesia (B + T + M units)', amount: 650, units: 23 }])
    expect(fee.unitRate).toBeNull()
    expect(fee.price).toMatchObject({ status: 'priced', price: 650, heldBy: 'typed', computed: { total: 690 } })
    // BTM stays recorded in full (US-03.5.2).
    expect(fee.btm.totalUnits).toBe(23)
  })

  it('a typed $0 is a price: no charge, the units untouched', () => {
    const fee = feeFor(mkProcedure({ ...spotCheckProcedure, enteredPrice: 0 }), { ...ON, anaesthetist, rvgGroup: BASE_SINGLE_10 })
    expect(fee).toMatchObject({ total: 0, needsPrice: false, billableUnits: 23 })
  })
})
