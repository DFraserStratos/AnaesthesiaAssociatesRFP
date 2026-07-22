import { describe, expect, it } from 'vitest'
import { ASA_SEED_UNITS, getModifierCode, MODIFIER_CODES } from './modifierCodes'
import { modifierUnits } from './modifierUnits'
import { BASE_ABSORBS_P1, BASE_SINGLE_10 } from './fixtures'

describe('modifier code table', () => {
  it('covers all the RFP-named groups', () => {
    const groups = new Set(MODIFIER_CODES.map((m) => m.group))
    expect(groups).toEqual(new Set(['PA', 'A', 'AS', 'ASE', 'OB', 'P', 'AI', 'POSTOP']))
  })

  it('seeds ASA classes at the logged demo-plausible values (AS1=0 AS2=1 AS3=3 AS4=4)', () => {
    expect(ASA_SEED_UNITS).toEqual({ AS1: 0, AS2: 1, AS3: 3, AS4: 4 })
    // The AS master rows agree with the seed map.
    for (const [code, units] of Object.entries(ASA_SEED_UNITS)) {
      expect(getModifierCode(code)?.units).toBe(units)
    }
  })
})

describe('modifierUnits', () => {
  it('sums selected modifier units', () => {
    // A2 (2) + OB3 (2) + P1 (2) on a non-absorbing base
    const r = modifierUnits(['A2', 'OB3', 'P1'], BASE_SINGLE_10)
    expect(r.units).toBe(6)
    expect(r.refused).toEqual([])
  })

  it('allows P1 on a base that does not absorb positioning', () => {
    const r = modifierUnits(['P1'], BASE_SINGLE_10)
    expect(r.units).toBe(2)
    expect(r.refused).toEqual([])
  })

  it('refuses (zeroes) P1 when the base code absorbs it, with a reason', () => {
    const r = modifierUnits(['P1', 'A1'], BASE_ABSORBS_P1)
    expect(r.units).toBe(1) // A1 only
    expect(r.refused).toHaveLength(1)
    expect(r.refused[0]?.code).toBe('P1')
    expect(r.refused[0]?.reason).toContain('SP07')
  })

  it('maps ASA codes via the seeding table', () => {
    expect(modifierUnits(['AS1'], BASE_SINGLE_10).units).toBe(0)
    expect(modifierUnits(['AS2'], BASE_SINGLE_10).units).toBe(1)
    expect(modifierUnits(['AS3'], BASE_SINGLE_10).units).toBe(3)
    expect(modifierUnits(['AS4'], BASE_SINGLE_10).units).toBe(4)
  })

  it('sums a combined selection (ASA + emergency + after hours)', () => {
    // AS3 (3) + ASE (2) + A2 (2)
    expect(modifierUnits(['AS3', 'ASE', 'A2'], BASE_SINGLE_10).units).toBe(7)
  })

  it('refuses unknown codes with a reason', () => {
    const r = modifierUnits(['ZZ9'], BASE_SINGLE_10)
    expect(r.units).toBe(0)
    expect(r.refused[0]?.reason).toMatch(/unknown/i)
  })

  it('works without a base code', () => {
    expect(modifierUnits(['P1']).units).toBe(2)
  })
})
