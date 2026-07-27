import { describe, expect, it } from 'vitest'
import {
  ASA_SEED_UNITS,
  getModifierCode,
  MODIFIER_CODES,
  modifierBandOf,
  toggleModifierCode,
} from './modifierCodes'
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

// ---------------------------------------------------------------------------
// Bands — one code per band (Decisions log 2026-07-27)
// ---------------------------------------------------------------------------

describe('modifier bands', () => {
  it('bands the four exclusive groups and exempts the rest', () => {
    expect(modifierBandOf('PA1')).toBe('PA')
    expect(modifierBandOf('PA4')).toBe('PA')
    expect(modifierBandOf('A1')).toBe('A')
    expect(modifierBandOf('AS2')).toBe('AS')
    expect(modifierBandOf('OB3')).toBe('OB')
    // PA5 is the recorded exception: a later contact, not an assessment type.
    expect(modifierBandOf('PA5')).toBeUndefined()
    for (const code of ['ASE', 'P1', 'AI1', 'PO1', 'PO2']) {
      expect(modifierBandOf(code)).toBeUndefined()
    }
    expect(modifierBandOf('ZZ9')).toBeUndefined()
  })

  it('refuses a same-band sibling, keeping the FIRST code, with a reason', () => {
    // The bug this rule closes: A1 + A2 summed to M = 3 for one patient.
    const r = modifierUnits(['A1', 'A2'], BASE_SINGLE_10)
    expect(r.units).toBe(1) // A1 only, not 3
    expect(r.refused).toHaveLength(1)
    expect(r.refused[0]?.code).toBe('A2')
    expect(r.refused[0]?.reason).toContain('A1')
    expect(r.refused[0]?.reason).toContain('age-extreme band')
  })

  it('first-wins holds whichever order the codes arrive in', () => {
    const r = modifierUnits(['A2', 'A1'], BASE_SINGLE_10)
    expect(r.units).toBe(2) // A2 only
    expect(r.refused[0]?.code).toBe('A1')
  })

  it('applies to every exclusive band (A, OB, PA1 to PA4, AS)', () => {
    expect(modifierUnits(['OB2', 'OB4'], BASE_SINGLE_10).units).toBe(1) // not 4
    expect(modifierUnits(['PA1', 'PA2', 'PA3', 'PA4'], BASE_SINGLE_10).units).toBe(1) // not 10
    expect(modifierUnits(['AS2', 'AS4'], BASE_SINGLE_10).units).toBe(1) // not 5
    // Three of a band: two refusals, both naming the code that won.
    const r = modifierUnits(['OB2', 'OB3', 'OB4'], BASE_SINGLE_10)
    expect(r.units).toBe(1)
    expect(r.refused.map((x) => x.code)).toEqual(['OB3', 'OB4'])
    expect(r.refused.every((x) => x.reason.includes('OB2'))).toBe(true)
  })

  it('does not band across different groups', () => {
    // One code from each of four bands plus two free codes still sums.
    const r = modifierUnits(['PA2', 'A1', 'OB3', 'AS2', 'ASE', 'AI1'], BASE_SINGLE_10)
    expect(r.units).toBe(2 + 1 + 2 + 1 + 2 + 2)
    expect(r.refused).toEqual([])
  })

  it('lets PA5 stack on its group (the recorded 5-unit exception)', () => {
    const r = modifierUnits(['PA4', 'PA5'], BASE_SINGLE_10)
    expect(r.units).toBe(5) // one ABOVE the RFP's stated 1 to 4 PA range
    expect(r.refused).toEqual([])
  })

  it('lets post-op codes stack (separately itemised, RFP.md:1103)', () => {
    const r = modifierUnits(['PO1', 'PO2'], BASE_SINGLE_10)
    expect(r.units).toBe(3)
    expect(r.refused).toEqual([])
  })

  it('resolves a stale selected AS code against the seeded ASA class to one value', () => {
    // fee.ts appends procedure.asaClass after the chip selection, so the stale
    // chip wins the band and the appended class is refused — 3 units, not 4.
    const r = modifierUnits(['AS3', 'AS2'], BASE_SINGLE_10)
    expect(r.units).toBe(3)
    expect(r.refused.map((x) => x.code)).toEqual(['AS2'])
  })

  it('an absorbed code still holds its band, so a sibling cannot slip in', () => {
    const r = modifierUnits(['P1', 'A1', 'A2'], BASE_ABSORBS_P1)
    expect(r.units).toBe(1) // P1 absorbed, A1 counted, A2 refused
    expect(r.refused.map((x) => x.code)).toEqual(['P1', 'A2'])
  })
})

describe('toggleModifierCode', () => {
  it('swaps a same-band sibling in one tap', () => {
    expect(toggleModifierCode(['OB2'], 'OB3')).toEqual(['OB3'])
    expect(toggleModifierCode(['A1'], 'A2')).toEqual(['A2'])
    expect(toggleModifierCode(['PA1'], 'PA4')).toEqual(['PA4'])
  })

  it('keeps codes from other bands when it swaps', () => {
    expect(toggleModifierCode(['A1', 'OB2', 'ASE'], 'OB4')).toEqual(['A1', 'ASE', 'OB4'])
  })

  it('appends a code that stacks freely', () => {
    expect(toggleModifierCode(['PA3'], 'PA5')).toEqual(['PA3', 'PA5'])
    expect(toggleModifierCode(['PO1'], 'PO2')).toEqual(['PO1', 'PO2'])
    expect(toggleModifierCode(['A1'], 'P1')).toEqual(['A1', 'P1'])
  })

  it('deselects a selected code and leaves the rest alone', () => {
    expect(toggleModifierCode(['A1', 'OB2'], 'A1')).toEqual(['OB2'])
    expect(toggleModifierCode([], 'A1')).toEqual(['A1'])
  })

  it('cleans up a pre-existing collision when either code is tapped', () => {
    expect(toggleModifierCode(['A1', 'A2'], 'A2')).toEqual(['A1'])
    expect(toggleModifierCode(['A1', 'A2'], 'A1')).toEqual(['A2'])
  })

  it('does not mutate the input', () => {
    const before = ['OB2', 'A1']
    toggleModifierCode(before, 'OB4')
    expect(before).toEqual(['OB2', 'A1'])
  })
})
