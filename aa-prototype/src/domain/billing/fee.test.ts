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
import type { BillingLine, ContractPrice } from '../types'

const anaesthetist = mkAnaesthetist({ unitValue: 30 })

/** Base 10 + AS3 + 2h30m: B=10, T=11, M=3 → 24 units. */
const spotCheckProcedure = mkProcedure({
  rvgBaseCode: 'GA10',
  asaClass: 'AS3',
  anaestheticStartISO: START_0800,
  handoverISO: HANDOVER_1030,
})

describe('resolveBtm', () => {
  it('computes seeded B/T/M from the captured inputs', () => {
    const btm = resolveBtm(spotCheckProcedure, BASE_SINGLE_10)
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
    const btm = resolveBtm(p, BASE_SINGLE_10)
    expect(btm.time).toEqual({ units: 9, source: 'overridden' })
    expect(btm.base).toEqual({ units: 12, source: 'overridden' })
    expect(btm.totalUnits).toBe(12 + 9 + 3)
  })

  it('a range base code uses the selected value', () => {
    const p = mkProcedure({ rvgBaseCode: 'NR59', baseUnitsSelected: 7 })
    expect(resolveBtm(p, BASE_RANGE_5_9).base.units).toBe(7)
  })

  it('a range base code with no selection counts 0 (validation flags it)', () => {
    const p = mkProcedure({ rvgBaseCode: 'NR59' })
    expect(resolveBtm(p, BASE_RANGE_5_9).base.units).toBe(0)
  })

  it('does not double-count an ASA class repeated in the chip selection', () => {
    const p = mkProcedure({ ...spotCheckProcedure, selectedModifierCodes: ['AS3'] })
    expect(resolveBtm(p, BASE_SINGLE_10).modifiers.units).toBe(3)
  })
})

describe('splitBillingUnits', () => {
  it('an additional procedure yields time units only', () => {
    const p = mkProcedure({ ...spotCheckProcedure, isAdditional: true })
    const btm = resolveBtm(p, BASE_SINGLE_10)
    expect(splitBillingUnits(p, btm)).toBe(11)
    expect(splitBillingUnits(spotCheckProcedure, resolveBtm(spotCheckProcedure, BASE_SINGLE_10))).toBe(24)
  })
})

describe('feeFor — contract types', () => {
  it('PAPER SPOT-CHECK: 2h30m at $30/unit, base 10 + AS3 = (10 + 11 + 3) x 30 = $720', () => {
    const fee = feeFor(spotCheckProcedure, { anaesthetist, baseCode: BASE_SINGLE_10 })
    expect(fee.billableUnits).toBe(24)
    expect(fee.unitRate).toBe(30)
    expect(fee.subtotal).toBe(720)
    expect(fee.total).toBe(720)
    expect(fee.chargeBasis).toBe('rvg')
  })

  it('Type 1: units x the anaesthetist unit value', () => {
    const contract = mkContract({ type: 1 })
    const fee = feeFor(spotCheckProcedure, { anaesthetist, contract, baseCode: BASE_SINGLE_10 })
    expect(fee.total).toBe(24 * 30)
  })

  it('Type 2 (agreed unit rate): units x the agreed rate', () => {
    const contract = mkContract({ type: 2, type2Detail: { basis: 'agreedUnitRate', unitRate: 25 } })
    const fee = feeFor(spotCheckProcedure, { anaesthetist, contract, baseCode: BASE_SINGLE_10 })
    expect(fee.unitRate).toBe(25)
    expect(fee.total).toBe(24 * 25)
  })

  it('Type 2 (percent discount): units x the discounted unit value', () => {
    const contract = mkContract({ type: 2, type2Detail: { basis: 'percentDiscount', percent: 10 } })
    const fee = feeFor(spotCheckProcedure, { anaesthetist, contract, baseCode: BASE_SINGLE_10 })
    expect(fee.unitRate).toBe(27)
    expect(fee.total).toBe(24 * 27)
  })

  const type3 = mkContract({ id: 'con-3', type: 3 })
  const prices: ContractPrice[] = [
    { id: 'p-1', contractId: 'con-3', rvgBaseCode: 'GA10', procedureOrdinal: 1, price: 650 },
    { id: 'p-2', contractId: 'con-3', rvgBaseCode: 'GA10', procedureOrdinal: 2, price: 275 },
  ]

  it('Type 3: fixed price from the matching ContractPrice row', () => {
    const fee = feeFor(spotCheckProcedure, {
      anaesthetist,
      contract: type3,
      contractPrices: prices,
      baseCode: BASE_SINGLE_10,
      procedureOrdinal: 1,
    })
    expect(fee.chargeBasis).toBe('fixed')
    expect(fee.unitRate).toBeNull()
    expect(fee.total).toBe(650)
  })

  it('Type 3: a 2nd procedure matches its ordinal row', () => {
    const fee = feeFor(spotCheckProcedure, {
      anaesthetist,
      contract: type3,
      contractPrices: prices,
      baseCode: BASE_SINGLE_10,
      procedureOrdinal: 2,
    })
    expect(fee.total).toBe(275)
  })

  it('Type 3: no matching row falls back to the BTM path (demo reading)', () => {
    const fee = feeFor(spotCheckProcedure, {
      anaesthetist,
      contract: type3,
      contractPrices: [{ id: 'p-x', contractId: 'con-3', rvgBaseCode: 'XX99', price: 500 }],
      baseCode: BASE_SINGLE_10,
      procedureOrdinal: 1,
    })
    expect(fee.chargeBasis).toBe('rvg')
    expect(fee.total).toBe(24 * 30)
  })

  it('Type 3 fallback on an additional procedure charges time units only', () => {
    const p = mkProcedure({ ...spotCheckProcedure, isAdditional: true })
    const fee = feeFor(p, {
      anaesthetist,
      contract: type3,
      contractPrices: [],
      baseCode: BASE_SINGLE_10,
      procedureOrdinal: 2,
    })
    expect(fee.billableUnits).toBe(11)
    expect(fee.total).toBe(11 * 30)
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
    const p = mkProcedure({ rvgBaseCode: undefined })
    const fee = feeFor(p, { anaesthetist, nonRvgLines: [line] })
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
      anaesthetist,
      baseCode: BASE_SINGLE_10,
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
    const fee = feeFor(p, { anaesthetist, baseCode: BASE_SINGLE_10 })
    expect(fee.subtotal).toBe(720)
    expect(fee.override).toMatchObject({ before: 720, after: 650 })
    expect(fee.total).toBe(650)
  })

  it('dollarAdjustment shifts the subtotal', () => {
    const p = mkProcedure({
      ...spotCheckProcedure,
      priceOverride: { kind: 'dollarAdjustment', amount: -120, reason: 'Goodwill discount' },
    })
    expect(feeFor(p, { anaesthetist, baseCode: BASE_SINGLE_10 }).total).toBe(600)
  })

  it('percentAdjustment scales the subtotal', () => {
    const p = mkProcedure({
      ...spotCheckProcedure,
      priceOverride: { kind: 'percentAdjustment', percent: -25, reason: 'Hardship' },
    })
    expect(feeFor(p, { anaesthetist, baseCode: BASE_SINGLE_10 }).total).toBe(540)
  })

  it('amounts round to cents', () => {
    const p = mkProcedure({
      ...spotCheckProcedure,
      priceOverride: { kind: 'percentAdjustment', percent: -33.333, reason: 'Test' },
    })
    const fee = feeFor(p, { anaesthetist, baseCode: BASE_SINGLE_10 })
    expect(fee.total).toBe(480)
  })
})
