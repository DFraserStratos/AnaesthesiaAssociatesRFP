import { describe, expect, it } from 'vitest'
import type { Booking, List, Procedure, RvgGroup } from '../../types'
import type { WarningFacts } from '../types'
import { baseUnitsOutsideGuideRule } from './baseUnitsOutsideGuide'

const H4: RvgGroup = { id: 'g-h4', code: 'H4', description: 'Complex procedures', anatomy: 'Head', baseUnits: 10, baseUnitsRange: { min: 10, max: 12 }, modifierUnits: 0, retired: false, includedModifierIds: [] }
const H1: RvgGroup = { id: 'g-h1', code: 'H1', description: 'Minor procedures', anatomy: 'Head', baseUnits: 4, modifierUnits: 0, retired: false, includedModifierIds: [] }
const GROUPS = { [H4.id]: H4, [H1.id]: H1 }

const proc = (id: string, patch: Partial<Procedure>): Procedure =>
  ({ id, bookingId: 'BK1', description: 'x', isAdditional: false, modifierClaims: [], removedModifierIds: [], ...patch }) as Procedure

function facts(procedures: Procedure[], rvgGroups: WarningFacts['rvgGroups'] | 'none' = GROUPS): WarningFacts {
  return {
    booking: { id: 'BK1' } as Booking,
    list: { id: 'L1' } as List,
    procedures,
    prepaymentStatus: 'none',
    todayISO: '2026-07-21',
    ...(rvgGroups !== 'none' && rvgGroups !== undefined ? { rvgGroups } : {}),
  }
}

describe('baseUnitsOutsideGuide rule (D3, RV-10; catch-up Phase 19)', () => {
  it('a chosen value outside the range: one mild after-procedure warning for that Procedure', () => {
    expect(baseUnitsOutsideGuideRule.evaluate(facts([proc('P1', { rvgGroupId: H4.id, baseUnitsSelected: 14 })]), {})).toEqual([
      { kind: 'afterProcedure', strength: 'mild', text: 'Base units 14 are outside the RVG guide for H4 (10 to 12).', procedureId: 'P1' },
    ])
  })

  it('a typed value off a single figure names the guide value', () => {
    const p = proc('P1', { rvgGroupId: H1.id, baseUnitsCaptured: { units: 6, source: 'overridden' } })
    expect(baseUnitsOutsideGuideRule.evaluate(facts([p]), {})[0]?.text).toBe('Base units 6 are outside the RVG guide for H1 (guide value 4).')
  })

  it('inside the range, the starting value, or no RVG code: nothing', () => {
    const quiet = [
      proc('P1', { rvgGroupId: H4.id, baseUnitsSelected: 11 }),
      proc('P2', { rvgGroupId: H4.id }),
      proc('P3', { rvgGroupId: H1.id, baseUnitsCaptured: { units: 4, source: 'overridden' } }),
      proc('P4', { baseUnitsCaptured: { units: 30, source: 'overridden' } }),
    ]
    expect(baseUnitsOutsideGuideRule.evaluate(facts(quiet), {})).toEqual([])
  })

  it('two outside Procedures give two warnings', () => {
    const found = baseUnitsOutsideGuideRule.evaluate(
      facts([proc('P1', { rvgGroupId: H4.id, baseUnitsSelected: 9 }), proc('P2', { rvgGroupId: H1.id, baseUnitsCaptured: { units: 2, source: 'overridden' } })]),
      {},
    )
    expect(found.map((f) => f.procedureId)).toEqual(['P1', 'P2'])
  })

  it('finds nothing without the RVG groups fact', () => {
    expect(baseUnitsOutsideGuideRule.evaluate(facts([proc('P1', { rvgGroupId: H4.id, baseUnitsSelected: 14 })], 'none'), {})).toEqual([])
  })
})

describe('baseUnitsOutsideGuide on an additional procedure', () => {
  it('finds nothing: an additional procedure charges time only', () => {
    expect(baseUnitsOutsideGuideRule.evaluate(facts([proc('P1', { rvgGroupId: H4.id, baseUnitsSelected: 40, isAdditional: true })]), {})).toEqual([])
  })
})
