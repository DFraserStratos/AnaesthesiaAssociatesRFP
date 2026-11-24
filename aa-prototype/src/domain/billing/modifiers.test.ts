/**
 * The one modifier rule module (catch-up Phase 19b). These cases re-express the
 * intent of the old band and absorbed-P1 tests under the catalogue's rules:
 * nothing is locked, only age and included modifiers are pre-applied, there is
 * no stacking limit, and nothing is ever counted twice.
 */

import { describe, expect, it } from 'vitest'
import {
  AGE_BANDS,
  ageInCompletedYears,
  ageModifierCodeFor,
  applyClaim,
  claimCompletionProblems,
  claimRefusal,
  modifierFromRvgRow,
  preApplicableModifiersFor,
  preAppliedModifiersFor,
  procedureModifiers,
  reconcileClaims,
  resolveModifiers,
  type ModifierFacts,
} from './modifiers'
import { BASE_INCLUDES_P1, BASE_SINGLE_10, RVG_MODIFIER_MASTER as M, mkClaim, modId } from './fixtures'

const ON = '2026-11-24'
const HIP = { ...BASE_SINGLE_10, code: 'LL4', includedModifierIds: [] }
const H7A = { ...BASE_INCLUDES_P1, code: 'H7A' }
const H7B = { ...BASE_INCLUDES_P1, code: 'H7b' }
const H6B = { ...BASE_SINGLE_10, code: 'H6b', noAgeModifier: true }

const facts = (over: Partial<ModifierFacts> = {}): ModifierFacts => ({ procedureDateISO: ON, modifiers: M, ...over })

describe('ageInCompletedYears (string based, no clock)', () => {
  it('counts completed years, a birthday completing the year', () => {
    expect(ageInCompletedYears('1954-07-18', '2026-11-24')).toBe(72)
    expect(ageInCompletedYears('1956-11-24', '2026-11-24')).toBe(70)
    expect(ageInCompletedYears('1956-11-25', '2026-11-24')).toBe(69)
  })

  it('takes a 29 February birthday as completing on 1 March in a common year', () => {
    expect(ageInCompletedYears('2024-02-29', '2025-02-28')).toBe(0)
    expect(ageInCompletedYears('2024-02-29', '2025-03-01')).toBe(1)
    expect(ageInCompletedYears('2024-02-29', '2028-02-29')).toBe(4)
  })

  it('is undefined for a malformed date or a date before the birth', () => {
    expect(ageInCompletedYears('not a date', ON)).toBeUndefined()
    expect(ageInCompletedYears('2026-12-05', ON)).toBeUndefined()
  })
})

describe('the age bands (D29; OQ-95 part 1 answered)', () => {
  it('reads each boundary, lower bounds inclusive as printed', () => {
    expect(AGE_BANDS).toHaveLength(4)
    expect([0, 1, 2, 69, 70, 79, 80, 95].map(ageModifierCodeFor)).toEqual(['A2', 'A1', undefined, undefined, 'A1', 'A1', 'A2', 'A2'])
  })

  it('pre-applies A1 or A2 on the procedure date, with its printed units and reason', () => {
    const row = (dob: string) => preApplicableModifiersFor(facts({ patientDobISO: dob }))[0]
    expect(row('1954-07-18')).toMatchObject({ code: 'A1', units: 1, origin: 'age', detail: "From the patient's age (72) on the procedure date" })
    expect(row('1946-11-24')).toMatchObject({ code: 'A2', units: 2 }) // 80 that day
    expect(row('1946-11-25')).toMatchObject({ code: 'A1', units: 1 }) // the day before 80
    expect(row('2025-11-24')).toMatchObject({ code: 'A1' }) // 1
    expect(row('2025-11-25')).toMatchObject({ code: 'A2' }) // 0
    expect(row('2024-11-25')).toMatchObject({ code: 'A1' }) // the day before 2
    expect(row('2024-11-24')).toBeUndefined() // 2
    expect(row('1956-11-25')).toBeUndefined() // the day before 70
  })

  it('applies no age modifier on a group already split by age (H6b, P2), or with no date of birth', () => {
    expect(preApplicableModifiersFor(facts({ patientDobISO: '1950-05-07', group: H6B }))).toEqual([])
    expect(preApplicableModifiersFor(facts())).toEqual([])
  })
})

describe('included modifiers (US-05.1.4, D43)', () => {
  it('pre-applies P1 at 0 units on a Spine group and on both an "a" and a "b" Neurosurgery group', () => {
    for (const group of [BASE_INCLUDES_P1, H7A, H7B]) {
      expect(preApplicableModifiersFor(facts({ group }))).toEqual([
        {
          modifierId: modId('P1'),
          code: 'P1',
          label: M[modId('P1')]!.factor,
          units: 0,
          origin: 'included',
          detail: `Included in the base units of ${group.code}`,
        },
      ])
    }
  })

  it('pre-applies nothing on a hip group, where P1 is an ordinary claim worth 2', () => {
    expect(preApplicableModifiersFor(facts({ group: HIP }))).toEqual([])
    const r = procedureModifiers({ modifierClaims: [mkClaim('P1')], removedModifierIds: [] }, { ...facts({ group: HIP }), start: 0 })
    expect(r.units).toBe(2)
  })

  it('pre-fills nothing else: no ASA grade, no procedure default', () => {
    const rows = preApplicableModifiersFor(facts({ patientDobISO: '1990-05-07', group: BASE_INCLUDES_P1 }))
    expect(rows.map((r) => r.code)).toEqual(['P1'])
  })
})

describe('removal and restore (nothing is locked)', () => {
  const ellison = facts({ patientDobISO: '1954-07-18', group: BASE_INCLUDES_P1 })

  it('a removed A1 or P1 stays off and adds nothing; put back, it returns', () => {
    const all = preAppliedModifiersFor({ ...ellison, removedModifierIds: [] })
    expect(all.map((r) => r.code)).toEqual(['A1', 'P1'])
    const without = preAppliedModifiersFor({ ...ellison, removedModifierIds: [modId('A1'), modId('P1')] })
    expect(without).toEqual([])
    expect(procedureModifiers({ modifierClaims: [], removedModifierIds: [modId('A1')] }, { ...ellison, start: 0 }).units).toBe(0)
    expect(procedureModifiers({ modifierClaims: [], removedModifierIds: [] }, { ...ellison, start: 0 }).units).toBe(1)
  })
})

describe('claims', () => {
  const ctx = { claims: [], preApplied: preAppliedModifiersFor({ ...facts({ patientDobISO: '1954-07-18', group: BASE_INCLUDES_P1 }), removedModifierIds: [] }), modifiers: M }

  it('refuses an unknown modifier, a duplicate of a pre-applied one, and a second claim of the same', () => {
    expect(claimRefusal({ modifierId: 'MOD-NOPE', explanation: 'x' }, ctx)).toBe('That modifier is not in the modifier list.')
    expect(claimRefusal(mkClaim('A1'), ctx)).toBe("A1 is already applied from the patient's age.")
    expect(claimRefusal(mkClaim('P1'), ctx)).toBe('P1 is already on this Procedure.')
    expect(claimRefusal(mkClaim('AS3'), { ...ctx, claims: [mkClaim('AS3')] })).toBe('AS3 is already on this Procedure.')
  })

  it('needs a short explanation, at most 200 characters', () => {
    expect(claimRefusal(mkClaim('AS3', '   '), ctx)).toBe('Add a short explanation for AS3.')
    expect(claimRefusal(mkClaim('AS3', 'x'.repeat(201)), ctx)).toBe('Keep the explanation under 200 characters.')
    expect(claimRefusal(mkClaim('AS3', 'x'.repeat(200)), ctx)).toBeNull()
  })

  it('asks for units only where the printed value is not a plain number', () => {
    expect(claimRefusal(mkClaim('PA3'), ctx)).toBe('Enter the units for PA3 (RVG: 2 + Time, at least 2).')
    expect(claimRefusal(mkClaim('PA3', 'Reason', 0), ctx)).toBe('Enter the units for PA3 (RVG: 2 + Time, at least 2).')
    expect(claimRefusal(mkClaim('PA3', 'Reason', 2.5), ctx)).toBe('Enter the units for PA3 (RVG: 2 + Time, at least 2).')
    expect(claimRefusal(mkClaim('PA3', 'Reason', 1), ctx)).toBe('Enter the units for PA3 (RVG: 2 + Time, at least 2).')
    expect(claimRefusal(mkClaim('PA3', 'Reason', 3), ctx)).toBeNull()
    // The printed value bounds the entry: "2 [Max]" at most 2, "4-6" 4 to 6.
    expect(claimRefusal(mkClaim('PA5', 'Cancelled after review', 9), ctx)).toBe('Enter the units for PA5 (RVG: 2 [Max], at most 2).')
    expect(claimRefusal(mkClaim('PA5', 'Cancelled after review', 2), ctx)).toBeNull()
    expect(claimRefusal(mkClaim('POC2a', 'HDU cover', 3), ctx)).toBe('Enter the units for POC2a (RVG: 4-6, 4 to 6).')
    expect(claimRefusal(mkClaim('POC2a', 'HDU cover', 6), ctx)).toBeNull()
    expect(claimRefusal(mkClaim('AS3', 'Reason', 2), ctx)).toBe('AS3 is worth 2 units as printed; no units are entered.')
  })

  it('lets A1 or A2 be claimed by hand outside the bands, with an explanation', () => {
    const young = { claims: [], preApplied: [], modifiers: M }
    expect(claimRefusal(mkClaim('A1', 'Frail on pre-op review'), young)).toBeNull()
  })

  it('applyClaim adds, or replaces the claim of the same modifier, trimmed', () => {
    const one = applyClaim([], mkClaim('AS3', '  first  '))
    expect(one).toEqual([{ modifierId: modId('AS3'), explanation: 'first' }])
    expect(applyClaim(one, mkClaim('AS3', 'second'))).toEqual([{ modifierId: modId('AS3'), explanation: 'second' }])
    expect(applyClaim(one, mkClaim('OB2'))).toHaveLength(2)
  })
})

describe('resolveModifiers: the itemised list and the M total', () => {
  it('stacks with no limit: OB2, AS3 and PA2 claimed together all count', () => {
    const r = resolveModifiers({ claims: [mkClaim('OB2'), mkClaim('AS3'), mkClaim('PA2')], preApplied: [], start: 0, modifiers: M })
    expect(r.units).toBe(1 + 2 + 2)
    expect(r.items.every((i) => i.refused === undefined)).toBe(true)
  })

  it('never counts a duplicate of a pre-applied P1 twice (the backstop)', () => {
    const preApplied = preApplicableModifiersFor(facts({ group: BASE_INCLUDES_P1 }))
    const r = resolveModifiers({ claims: [mkClaim('P1')], preApplied, start: 0, modifiers: M })
    expect(r.units).toBe(0)
    expect(r.items[1]).toMatchObject({ code: 'P1', origin: 'chosen', units: 0, refused: 'P1 is already on this Procedure; this claim adds nothing.' })
  })

  it('adds the starting modifier units, lists pre-applied rows first, and prices a non-numeric modifier from its claim', () => {
    const preApplied = preApplicableModifiersFor(facts({ patientDobISO: '1954-07-18' }))
    const r = resolveModifiers({ claims: [mkClaim('PA3', 'Seen in clinic', 3)], preApplied, start: 2, modifiers: M })
    expect(r.items.map((i) => [i.code, i.units, i.origin])).toEqual([
      ['A1', 1, 'age'],
      ['PA3', 3, 'chosen'],
    ])
    expect(r.units).toBe(2 + 1 + 3)
  })

  it('keeps an unknown modifier with its reason and adds nothing', () => {
    const r = resolveModifiers({ claims: [{ modifierId: 'MOD-GONE', explanation: 'x' }], preApplied: [], start: 0, modifiers: M })
    expect(r.units).toBe(0)
    expect(r.items[0]?.refused).toBe('This modifier is no longer in the modifier list.')
  })
})

describe('reconcileClaims (a change of group)', () => {
  it('drops a P1 claim when the group now includes P1', () => {
    const r = reconcileClaims([mkClaim('P1'), mkClaim('AS3')], [], facts({ group: BASE_INCLUDES_P1 }))
    expect(r.modifierClaims.map((c) => c.modifierId)).toEqual([modId('AS3')])
  })

  it('drops the removal of P1 when the group no longer includes it', () => {
    const r = reconcileClaims([], [modId('P1')], facts({ group: HIP }))
    expect(r.removedModifierIds).toEqual([])
  })

  it('keeps a removal that still applies', () => {
    const r = reconcileClaims([], [modId('P1')], facts({ group: H7B }))
    expect(r.removedModifierIds).toEqual([modId('P1')])
  })
})

describe('the completion backstop (US-03.6.1, finished by Phase 21)', () => {
  it('names a claim with a blank explanation, or missing its units; none at all passes', () => {
    expect(claimCompletionProblems([], M)).toEqual([])
    expect(claimCompletionProblems([mkClaim('AS3', ' ')], M)).toEqual([{ modifierId: modId('AS3'), message: 'Add a short explanation for AS3, or remove it.' }])
    expect(claimCompletionProblems([mkClaim('PA3', 'Seen')], M)[0]?.message).toBe('Enter the units for PA3 (RVG: 2 + Time, at least 2), or remove it.')
    expect(claimCompletionProblems([mkClaim('AS3')], M)).toEqual([])
    // A refused duplicate of a pre-applied modifier adds nothing and is no failure.
    expect(claimCompletionProblems([mkClaim('P1', ' ')], M, [{ modifierId: modId('P1') }])).toEqual([])
  })
})

describe('the master from the generated table', () => {
  it('holds hidden ids, plain units as numbers and everything else as null', () => {
    expect(M[modId('POC 1')]?.id).toBe('MOD-RVG-POC1')
    expect(M[modId('AS3')]).toMatchObject({ units: 2, unitsAsPrinted: '2', source: 'rvg' })
    expect(M[modId('POC2a')]).toMatchObject({ units: null, unitsAsPrinted: '4-6' })
    expect(M[modId('PA5')]).toMatchObject({ units: null, unitsAsPrinted: '2 [Max]' })
    expect(Object.values(M).filter((m) => m.appliedFrom === 'age').map((m) => m.code)).toEqual(['A1', 'A2'])
    expect(Object.values(M).map((m) => m.code)).not.toContain('AS2')
    expect(modifierFromRvgRow({ code: 'X 1', block: 'B', factor: 'F', unitsAsPrinted: '3', trigger: 't', automatic: false, page: 1 }).id).toBe('MOD-RVG-X1')
  })
})
