/**
 * The Booking-level engine (catch-up Phase 23): every figure below is worked
 * out by hand in the comment beside it, at the anaesthetist's $30 unit value.
 *
 * The three-procedure example (the domain model's worked example, on test
 * groups): A, the primary, on GA10 (base 10), 08:00 to 09:30 (90 min, T 6);
 * B on H6 (base 6), 09:30 to 10:00 (30 min, T 2); C on H4 (base 4), 10:00 to
 * 10:30 (T 2). Claims on A: AS3 2, OB3 2, ASE 2, and the patient is 72 on the
 * List's date, so A1 1 is pre-applied: 7 modifier units, split 3 / 2 / 2.
 */

import { describe, expect, it } from 'vitest'
import { bookingFeeFor, NO_PRIMARY_MESSAGE, type ProcedureFeeContext } from './bookingFee'
import { BASE_SINGLE_10, mkAnaesthetist, mkClaim, mkContract, mkProcedure, RVG_MODIFIER_MASTER } from './fixtures'
import { DEFAULT_RVG_TIME_RULE } from './timeUnits'
import type { Contract, Procedure, RvgGroup } from '../types'

const H6: RvgGroup = { ...BASE_SINGLE_10, id: 'RG-T-H6', code: 'H6', description: 'Umbilical hernia', baseUnits: 6 }
const H4: RvgGroup = { ...BASE_SINGLE_10, id: 'RG-T-H4', code: 'H4', description: 'Inguinal hernia', baseUnits: 4 }
const GROUPS: Record<string, RvgGroup> = { [BASE_SINGLE_10.id]: BASE_SINGLE_10, [H6.id]: H6, [H4.id]: H4 }

const anaesthetist = mkAnaesthetist({ unitValue: 30 })
const SEVENTY_TWO = '1954-03-14'
const t = (hhmm: string) => `2026-07-21T${hhmm}:00`

const A = mkProcedure({
  id: 'P-A',
  isPrimary: true,
  rvgGroupId: BASE_SINGLE_10.id,
  anaestheticStartISO: t('08:00'),
  handoverISO: t('09:30'),
  modifierClaims: [mkClaim('AS3', 'ASA III, controlled COPD'), mkClaim('OB3', 'BMI 42'), mkClaim('ASE', 'Emergency case, acute cholecystitis')],
})
const B = mkProcedure({ id: 'P-B', isPrimary: false, rvgGroupId: H6.id, anaestheticStartISO: t('09:30'), handoverISO: t('10:00') })
const C = mkProcedure({ id: 'P-C', isPrimary: false, rvgGroupId: H4.id, anaestheticStartISO: t('10:00'), handoverISO: t('10:30') })

function ctxFor(contracts: Record<string, Contract> = {}, dob: string | null = SEVENTY_TWO) {
  return (p: Procedure): ProcedureFeeContext => {
    const ctx: ProcedureFeeContext = {
      anaesthetist,
      dateISO: '2026-07-21',
      timeRule: DEFAULT_RVG_TIME_RULE,
      patientDobISO: dob ?? undefined,
      modifiers: RVG_MODIFIER_MASTER,
      nonRvgLines: [],
    }
    const group = p.rvgGroupId !== undefined ? GROUPS[p.rvgGroupId] : undefined
    if (group !== undefined) ctx.rvgGroup = group
    const contract = contracts[p.id]
    if (contract !== undefined) ctx.contract = contract
    return ctx
  }
}

function priced(procedures: Procedure[], contracts: Record<string, Contract> = {}, dob?: string | null) {
  const result = bookingFeeFor(procedures, ctxFor(contracts, dob === undefined ? SEVENTY_TWO : dob))
  if (result.kind !== 'ok') throw new Error(`structural: ${result.reason}`)
  return result
}

/** Make `id` the primary (the others additional), keeping the claims on whichever is primary. */
function withPrimary(id: string): Procedure[] {
  return [A, B, C].map((p) => ({
    ...p,
    isPrimary: p.id === id,
    modifierClaims: p.id === id ? A.modifierClaims : [],
  }))
}

describe('bookingFeeFor · the seeded three-procedure example', () => {
  it('A: B 10 + T 6 + M 3 = 19 x $30 = $570; B: T 2 + M 2 = 4 x $30 = $120; C: the same, $120; total $810, 27 units', () => {
    const r = priced([A, B, C])
    expect(r.allocations['P-A']!.bookingModifierUnits).toBe(7) // AS3 2 + OB3 2 + ASE 2 + A1 1
    expect([r.fees['P-A']!.total, r.fees['P-B']!.total, r.fees['P-C']!.total]).toEqual([570, 120, 120])
    expect([r.fees['P-A']!.billableUnits, r.fees['P-B']!.billableUnits, r.fees['P-C']!.billableUnits]).toEqual([19, 4, 4])
    expect(r.total).toBe(810)
    expect(r.units).toBe(27)
    expect(r.order).toEqual(['P-A', 'P-B', 'P-C'])
    expect(r.fees['P-A']!.lines[0]!.description).toBe('Anaesthesia, primary procedure (B 10 + T 6 + M 3 of 7 units)')
    expect(r.fees['P-B']!.lines[0]!.description).toBe('Anaesthesia, additional procedure (T 2 + M 2 of 7 units)')
    expect(r.allocations['P-A']!.splitShares).toEqual([3, 2, 2])
  })

  it("after making B primary: B 6 (its own group) + T 2 + M 3 = 11 x $30 = $330; A: T 6 + M 2 = 8 x $30 = $240; C $120; total $690, B listed first", () => {
    const r = priced(withPrimary('P-B'))
    expect([r.fees['P-A']!.total, r.fees['P-B']!.total, r.fees['P-C']!.total]).toEqual([240, 330, 120])
    expect(r.fees['P-B']!.btm.base.units).toBe(6)
    expect(r.fees['P-A']!.btm.base.units).toBe(0)
    expect(r.allocations['P-B']!.modifierShare).toBe(3)
    expect(r.total).toBe(690)
    expect(r.order).toEqual(['P-B', 'P-A', 'P-C'])
  })

  it("an additional Procedure's own group base reaches B only once it is the primary", () => {
    expect(priced([A, B, C]).fees['P-C']!.btm.base.units).toBe(0)
    expect(priced(withPrimary('P-C')).fees['P-C']!.btm.base.units).toBe(4)
  })

  it("C on a rate Contract at $25: still 3 / 2 / 2, C's T 2 + M 2 = 4 x $25 = $100; total $790", () => {
    const r = priced([A, B, C], { 'P-C': mkContract({ id: 'rate', pricing: { kind: 'rvgContractRate', unitRate: 25 } }) })
    expect([r.allocations['P-A']!.modifierShare, r.allocations['P-B']!.modifierShare, r.allocations['P-C']!.modifierShare]).toEqual([3, 2, 2])
    expect(r.fees['P-C']!.total).toBe(100)
    expect(r.total).toBe(790)
  })

  it("C on a 10% discount Contract: only C's charged units at $27, 4 x $27 = $108; total $798", () => {
    const r = priced([A, B, C], { 'P-C': mkContract({ id: 'disc', pricing: { kind: 'rvgDiscount', discountPct: 10 } }) })
    expect(r.fees['P-C']!.total).toBe(108)
    expect(r.fees['P-A']!.total).toBe(570)
    expect(r.total).toBe(798)
  })

  it('C on a fixed price of $500 keeps its price and takes no share: 7 over A and B is 4 / 3; A 20 x $30 = $600, B 5 x $30 = $150; total $1,250', () => {
    const fixed = mkContract({ id: 'fx', pricing: { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 500 }] } })
    const r = priced([A, B, C], { 'P-C': fixed })
    expect([r.allocations['P-A']!.modifierShare, r.allocations['P-B']!.modifierShare, r.allocations['P-C']!.modifierShare]).toEqual([4, 3, 0])
    expect([r.fees['P-A']!.total, r.fees['P-B']!.total, r.fees['P-C']!.total]).toEqual([600, 150, 500])
    expect(r.fees['P-C']!.lines[0]!.description).toBe('Contract price, additional procedure')
    expect(r.total).toBe(1250)
  })

  it('an open price (the No contract · Fixed price backstop) behaves the same: its typed $480 stands, no share', () => {
    const open = mkContract({ id: 'open', pricing: { kind: 'open' } })
    const r = priced([A, B, { ...C, enteredPrice: 480 }], { 'P-C': open })
    expect(r.fees['P-C']!.total).toBe(480)
    expect(r.allocations['P-C']!.modifierShare).toBe(0)
    expect(r.fees['P-A']!.total).toBe(600)
  })

  it('a manual M adjustment of 9 on the primary is the total that splits: 3 / 3 / 3; A 19 x $30 = $570, B and C 5 x $30 = $150', () => {
    const r = priced([{ ...A, modifierUnitsCaptured: { units: 9, source: 'overridden' } }, B, C])
    expect([r.fees['P-A']!.total, r.fees['P-B']!.total, r.fees['P-C']!.total]).toEqual([570, 150, 150])
  })

  it('a typed office price on B replaces its price but leaves the split as it was (participation reads the pricing kind alone)', () => {
    const r = priced([A, { ...B, priceOverride: { kind: 'fixedFee', amount: 1000, reason: 'Agreed' } }, C])
    expect(r.allocations['P-B']!.modifierShare).toBe(2)
    expect(r.fees['P-B']!.total).toBe(1000)
    expect(r.fees['P-A']!.total).toBe(570)
  })

  it('counts the pre-applied age modifier once for the Booking, never once per Procedure', () => {
    const r = priced([A, B, C])
    // Each Procedure would pre-apply A1 on its own; only the primary's counts.
    expect(r.fees['P-B']!.btm.modifierItems).toEqual([])
    expect(r.allocations['P-B']!.bookingModifierUnits).toBe(7)
  })
})

describe('bookingFeeFor · the mixed Booking (a fixed-price primary; OQ-132 default, provisional)', () => {
  const bariatric = mkContract({ id: 'bar', pricing: { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 2800 }] } })

  it('above 4: no base on either; 7 split 4 / 3 over B and C (remainder to the first participant); A $2,800, B T 2 + M 4 = $180, C T 2 + M 3 = $150; total $3,130', () => {
    const r = priced([A, B, C], { 'P-A': bariatric })
    expect(Object.values(r.allocations).some((a) => a.baseCharged)).toBe(false)
    expect([r.allocations['P-B']!.modifierShare, r.allocations['P-C']!.modifierShare]).toEqual([4, 3])
    expect([r.fees['P-A']!.total, r.fees['P-B']!.total, r.fees['P-C']!.total]).toEqual([2800, 180, 150])
    expect(r.total).toBe(3130)
  })

  it('4 or fewer: they sit on the fixed-price primary and are billed nowhere; B and C bill T 2 alone, $60 each; total $2,920', () => {
    const fourUnits = { ...A, modifierClaims: [mkClaim('AS3'), mkClaim('OB3')] }
    const r = priced([fourUnits, B, C], { 'P-A': bariatric }, null)
    expect(r.allocations['P-A']!.bookingModifierUnits).toBe(4)
    expect([r.fees['P-A']!.total, r.fees['P-B']!.total, r.fees['P-C']!.total]).toEqual([2800, 60, 60])
    expect(r.fees['P-B']!.lines[0]!.description).toBe('Anaesthesia, additional procedure (T 2 units)')
  })
})

describe('bookingFeeFor · prepayment never changes the ranking (D57)', () => {
  it("with the primary on a prepaid Contract, B's allocation and fee are those of the unprepaid case: no base, T 2, its share 2, $120", () => {
    const prepaid = mkContract({ id: 'pre', prepaid: true, billsTo: 'payer', pricing: { kind: 'rvgAnaesthetistRate' } })
    const plain = priced([A, B, C])
    const withPrepaid = priced([A, B, C], { 'P-A': prepaid })
    expect(withPrepaid.allocations['P-B']).toEqual(plain.allocations['P-B'])
    expect(withPrepaid.fees['P-B']!.total).toBe(120)
  })
})

describe('bookingFeeFor · single Procedures and structure', () => {
  it('a single-Procedure Booking keeps its description and figures: B 10 + T 6 + M 7 = 23 x $30 = $690', () => {
    const r = priced([A])
    expect(r.fees['P-A']!.total).toBe(690)
    expect(r.fees['P-A']!.lines[0]!.description).toBe('Anaesthesia (B + T + M units)')
  })

  it('refuses a Booking with no primary or several, rather than guessing', () => {
    expect(bookingFeeFor([{ ...A, isPrimary: false }, B], ctxFor())).toEqual({ kind: 'structural', reason: 'noPrimary' })
    expect(bookingFeeFor([A, { ...B, isPrimary: true }], ctxFor())).toEqual({ kind: 'structural', reason: 'severalPrimaries' })
    expect(NO_PRIMARY_MESSAGE).toBe('This Booking needs exactly one primary procedure')
  })

  it('an empty Booking prices to nothing', () => {
    expect(bookingFeeFor([], ctxFor())).toMatchObject({ kind: 'ok', total: 0, units: 0, order: [] })
  })
})
