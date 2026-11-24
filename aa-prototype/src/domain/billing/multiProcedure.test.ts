import { describe, expect, it } from 'vitest'
import {
  MODIFIER_SPLIT_THRESHOLD,
  allocateBooking,
  allocateModifierUnits,
  baseOn,
  inDisplayOrder,
  participantsOf,
  primaryOf,
  procedureRole,
} from './multiProcedure'

type P = { id: string; isPrimary: boolean; kind?: 'rvg' | 'fixed' | 'open'; startISO?: string }
const proc = (id: string, isPrimary = false, kind: P['kind'] = 'rvg', startISO?: string): P => ({ id, isPrimary, kind, ...(startISO !== undefined ? { startISO } : {}) })
const rvg = (p: P) => p.kind === 'rvg'

/** The shares in Booking order. */
function split(total: number, procedures: P[]): number[] {
  const alloc = allocateBooking(procedures, rvg, total)
  return procedures.map((p) => alloc[p.id]!.modifierShare)
}

describe('the threshold and the split (OQ-15, OQ-90 answered)', () => {
  it('splits above 4, not at 4', () => {
    expect(MODIFIER_SPLIT_THRESHOLD).toBe(4)
  })

  it('0 over 3 is 0 / 0 / 0; 4 over 3 is 4 / 0 / 0 (at the threshold, all on the primary)', () => {
    const three = [proc('A', true), proc('B'), proc('C')]
    expect(split(0, three)).toEqual([0, 0, 0])
    expect(split(4, three)).toEqual([4, 0, 0])
  })

  it('5 over 2 is 3 / 2', () => {
    expect(split(5, [proc('A', true), proc('B')])).toEqual([3, 2])
  })

  it("7 over 3 is 3 / 2 / 2: the domain model's AS3 2 + OB3 2 + ASE 2 + the pre-applied A1 1", () => {
    const total = 2 + 2 + 2 + 1
    expect(total).toBe(7)
    expect(split(total, [proc('A', true), proc('B'), proc('C')])).toEqual([3, 2, 2])
  })

  it('6 over 4 is 3 / 1 / 1 / 1; 8 over 4 is 2 / 2 / 2 / 2', () => {
    const four = [proc('A', true), proc('B'), proc('C'), proc('D')]
    expect(split(6, four)).toEqual([3, 1, 1, 1])
    expect(split(8, four)).toEqual([2, 2, 2, 2])
  })

  it('5 over 6 is 5 / 0 / 0 / 0 / 0 / 0: every share rounds to 0 and the remainder is all of it', () => {
    expect(split(5, [proc('A', true), proc('B'), proc('C'), proc('D'), proc('E'), proc('F')])).toEqual([5, 0, 0, 0, 0, 0])
  })

  it('9 over 1 is 9', () => {
    expect(split(9, [proc('A', true)])).toEqual([9])
  })

  it('the remainder goes to the primary wherever it sits in Booking order', () => {
    expect(split(7, [proc('A'), proc('B', true), proc('C')])).toEqual([2, 3, 2])
    expect(split(7, [proc('A'), proc('B'), proc('C', true)])).toEqual([2, 2, 3])
  })

  it('splits across different RVG-priced Contracts alike (No contract · RVG, a rate, a discount): still 3 / 2 / 2', () => {
    // Participation reads the pricing kind alone: each of the three is RVG-priced.
    const kinds = { A: 'rvgAnaesthetistRate', B: 'rvgContractRate', C: 'rvgDiscount' } as const
    const procedures = [proc('A', true), proc('B'), proc('C')]
    const alloc = allocateBooking(procedures, (p) => kinds[p.id as keyof typeof kinds].startsWith('rvg'), 7)
    expect(procedures.map((p) => alloc[p.id]!.modifierShare)).toEqual([3, 2, 2])
  })

  it('7 over 3 with the third on a fixed price splits over 2 (4 / 3) and the third gets 0; an open price behaves the same', () => {
    expect(split(7, [proc('A', true), proc('B'), proc('C', false, 'fixed')])).toEqual([4, 3, 0])
    expect(split(7, [proc('A', true), proc('B'), proc('C', false, 'open')])).toEqual([4, 3, 0])
  })

  it('a fixed-price primary with two RVG-priced additional Procedures: 7 split 4 / 3 over them (remainder to the first), the primary 0; 4 units sit on the primary, billed nowhere', () => {
    const procedures = [proc('A', true, 'fixed'), proc('B'), proc('C')]
    expect(split(7, procedures)).toEqual([0, 4, 3])
    const four = allocateBooking(procedures, rvg, 4)
    expect(procedures.map((p) => four[p.id]!.modifierShare)).toEqual([4, 0, 0])
    expect(four.A!.rvgPriced).toBe(false)
  })

  it('the shares always sum to the total', () => {
    const shapes: P[][] = [
      [proc('A', true)],
      [proc('A', true), proc('B')],
      [proc('A'), proc('B', true), proc('C')],
      [proc('A', true, 'fixed'), proc('B'), proc('C')],
      [proc('A', true), proc('B', false, 'fixed'), proc('C'), proc('D'), proc('E')],
    ]
    for (const shape of shapes) {
      for (let total = 0; total <= 23; total += 1) {
        expect(split(total, shape).reduce((a, b) => a + b, 0), `${total} over ${shape.length}`).toBe(total)
      }
    }
  })

  it('allocateModifierUnits records the shares for the participants and the primary', () => {
    expect(allocateModifierUnits(7, ['A', 'B', 'C'], 'A')).toEqual({ A: 3, B: 2, C: 2 })
    expect(allocateModifierUnits(3, ['B', 'C'], 'A')).toEqual({ A: 3, B: 0, C: 0 })
    expect(allocateModifierUnits(7, ['B', 'C'], 'A')).toEqual({ B: 4, C: 3 })
  })

  it('splitAcross is the participant count when split, else 1', () => {
    const procedures = [proc('A', true), proc('B'), proc('C')]
    expect(allocateBooking(procedures, rvg, 7).B!.splitAcross).toBe(3)
    expect(allocateBooking(procedures, rvg, 4).B!.splitAcross).toBe(1)
  })
})

describe('base units (US-05.3.1; OQ-132 provisional)', () => {
  it('sit on the marked primary only', () => {
    const alloc = allocateBooking([proc('A'), proc('B', true)], rvg, 0)
    expect(alloc.A!.baseCharged).toBe(false)
    expect(alloc.B!.baseCharged).toBe(true)
    expect(baseOn([proc('A'), proc('B', true)])?.id).toBe('B')
  })

  it('are billed on no Procedure when the primary is on a fixed or open price (OQ-132 default)', () => {
    for (const kind of ['fixed', 'open'] as const) {
      const alloc = allocateBooking([proc('A', true, kind), proc('B'), proc('C')], rvg, 0)
      expect(Object.values(alloc).some((a) => a.baseCharged)).toBe(false)
      expect(baseOn([proc('A', true, kind), proc('B')])?.id).toBe('A')
    }
  })
})

describe('roles, participants and order', () => {
  it('procedureRole: base and modifiers on the primary only', () => {
    expect(procedureRole({ isPrimary: true })).toEqual({ role: 'primary', baseCharged: true, modifiersRecorded: true })
    expect(procedureRole({ isPrimary: false })).toEqual({ role: 'additional', baseCharged: false, modifiersRecorded: false })
  })

  it('participantsOf keeps the RVG-priced Procedures in Booking order, whatever their position', () => {
    expect(participantsOf([proc('A', true, 'fixed'), proc('B'), proc('C', false, 'open'), proc('D')], rvg).map((p) => p.id)).toEqual(['B', 'D'])
  })

  it('inDisplayOrder puts a primary stored last at the top and keeps the others in Booking order', () => {
    expect(inDisplayOrder([proc('A'), proc('B'), proc('C', true)]).map((p) => p.id)).toEqual(['C', 'A', 'B'])
    expect(inDisplayOrder([proc('A', true), proc('B'), proc('C')]).map((p) => p.id)).toEqual(['A', 'B', 'C'])
  })

  it('a primary with a later start time than an additional Procedure stays primary and first', () => {
    const procedures = [proc('A', false, 'rvg', '2026-11-23T08:00:00+12:00'), proc('B', true, 'rvg', '2026-11-23T10:00:00+12:00')]
    expect(inDisplayOrder(procedures)[0]!.id).toBe('B')
    const result = primaryOf(procedures)
    expect(result.kind === 'ok' && result.primary.id).toBe('B')
  })

  it('refuses no primary and two primaries rather than guessing', () => {
    expect(primaryOf([proc('A'), proc('B')])).toEqual({ kind: 'noPrimary' })
    expect(primaryOf([proc('A', true), proc('B', true)])).toEqual({ kind: 'severalPrimaries', ids: ['A', 'B'] })
  })
})
