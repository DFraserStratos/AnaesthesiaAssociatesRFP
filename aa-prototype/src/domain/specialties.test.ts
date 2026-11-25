import { describe, expect, it } from 'vitest'
import {
  cleanSpecialtyIds,
  contractFitsSpecialties,
  specialtiesInOrder,
  specialtyHolders,
  specialtyNameRefusal,
  specialtyUsage,
  specialtyUsageText,
  surgeonSpecialtyLabel,
  withSpecialties,
  type Specialty,
} from './specialties'
import { buildSeed } from './seed'
import { isOfficeContract } from './billing/fallbacks'
import type { Contract } from './billing/contracts'
import type { Surgeon } from './types'

const LIST: Record<string, Specialty> = {
  ophth: { id: 'ophth', name: 'Ophthalmology' },
  plastic: { id: 'plastic', name: 'Plastic surgery' },
  gen: { id: 'gen', name: 'General surgery' },
}
const MASTERS = { specialties: LIST }

describe('surgeonSpecialtyLabel (the one text every screen shows)', () => {
  it('joins the names in the order held, skipping an unknown id', () => {
    expect(surgeonSpecialtyLabel(MASTERS, { specialtyIds: ['plastic'] })).toBe('Plastic surgery')
    expect(surgeonSpecialtyLabel(MASTERS, { specialtyIds: ['plastic', 'gen'] })).toBe('Plastic surgery, General surgery')
    expect(surgeonSpecialtyLabel(MASTERS, { specialtyIds: ['nope', 'ophth'] })).toBe('Ophthalmology')
    expect(surgeonSpecialtyLabel(MASTERS, undefined)).toBe('')
  })

  it('reads a rename everywhere: the record holds the name once', () => {
    const renamed = { specialties: { ...LIST, plastic: { id: 'plastic', name: 'Plastic and reconstructive' } } }
    expect(surgeonSpecialtyLabel(renamed, { specialtyIds: ['plastic'] })).toBe('Plastic and reconstructive')
  })

  it('a picker option carries the label in brackets, or the name alone', () => {
    expect(withSpecialties('Ms G. Lim', 'Plastic surgery')).toBe('Ms G. Lim (Plastic surgery)')
    expect(withSpecialties('Ms G. Lim', '')).toBe('Ms G. Lim')
  })

  it('lists the specialties by name', () => {
    expect(specialtiesInOrder(LIST).map((s) => s.name)).toEqual(['General surgery', 'Ophthalmology', 'Plastic surgery'])
  })
})

describe('contractFitsSpecialties (US-04.2.16, A10)', () => {
  it('Hidden: a plastic-surgery-only Contract is not offered for an ophthalmologist', () => {
    expect(contractFitsSpecialties(['plastic'], ['ophth'])).toBe(false)
  })
  it('Two specialties: a breast reduction Contract fits a plastic and a general surgeon', () => {
    expect(contractFitsSpecialties(['plastic', 'gen'], ['plastic'])).toBe(true)
    expect(contractFitsSpecialties(['plastic', 'gen'], ['gen'])).toBe(true)
  })
  it('None: a Contract with no specialties fits every surgeon', () => {
    expect(contractFitsSpecialties([], ['ophth'])).toBe(true)
    expect(contractFitsSpecialties([], [])).toBe(true)
  })
  it('Several (US-13.6.6): any overlap with a two-specialty surgeon matches', () => {
    expect(contractFitsSpecialties(['gen'], ['ophth', 'gen'])).toBe(true)
    expect(contractFitsSpecialties(['plastic'], ['ophth', 'gen'])).toBe(false)
  })
})

describe('specialty usage and names', () => {
  it('counts the surgeons and Contracts holding a specialty', () => {
    const usage = specialtyUsage(
      {
        surgeons: { a: { specialtyIds: ['gen'] }, b: { specialtyIds: ['gen', 'plastic'] }, c: { specialtyIds: ['ophth'] } },
        contracts: { x: { specialtyIds: ['gen'] }, y: { specialtyIds: [] } },
      },
      'gen',
    )
    expect(usage).toEqual({ surgeons: 2, contracts: 1 })
    expect(specialtyUsageText(usage)).toBe('2 surgeons and 1 Contract')
    expect(specialtyUsageText({ surgeons: 1, contracts: 0 })).toBe('1 surgeon')
    expect(specialtyUsageText({ surgeons: 0, contracts: 0 })).toBe('nothing')
  })

  it('a name is required and unique, ignoring case and outer spaces', () => {
    expect(specialtyNameRefusal('  ', LIST)?.code).toBe('nameRequired')
    expect(specialtyNameRefusal(' ophthalmology ', LIST)?.code).toBe('nameTaken')
    expect(specialtyNameRefusal('Ophthalmology', LIST, 'ophth')).toBeNull()
    expect(specialtyNameRefusal('Paediatric surgery', LIST)).toBeNull()
  })

  it("a surgeon's list: one or more known ids, duplicates dropped, order kept", () => {
    expect(cleanSpecialtyIds(['gen', 'ophth', 'gen'], LIST)).toEqual({ ok: true, ids: ['gen', 'ophth'] })
    expect(cleanSpecialtyIds([], LIST)).toMatchObject({ ok: false, code: 'specialtyRequired', message: 'Choose at least one specialty.' })
    expect(cleanSpecialtyIds(undefined, LIST)).toMatchObject({ ok: false, code: 'specialtyRequired' })
    expect(cleanSpecialtyIds(['nope'], LIST)).toMatchObject({ ok: false, code: 'specialtyUnknown' })
  })
})

describe('who holds a specialty, listed (Phase 56; US-13.4.4 Specialty page)', () => {
  const seed = buildSeed().masters
  const template = Object.values(seed.contracts).find((c) => isOfficeContract(c))!
  const surgeon = (id: string, name: string, specialtyIds: string[], retired = false): Surgeon => ({
    id,
    name,
    specialtyIds,
    personalContact: {},
    officeContacts: [],
    ...(retired ? { retiredAtISO: '2026-11-01' } : {}),
  })
  const contract = (id: string, name: string, specialtyIds: string[], extra: Partial<Contract> = {}): Contract => ({ ...template, id, name, specialtyIds, ...extra })

  it('the example: Ophthalmology held by three surgeons and two Contracts lists exactly those, Retired and Disabled marked', () => {
    const masters = {
      specialties: LIST,
      parties: seed.parties,
      fundingTags: seed.fundingTags,
      surgeons: {
        a: surgeon('a', 'Ms A. Reid', ['ophth']),
        b: surgeon('b', 'Mr J. Whitford', ['ophth', 'plastic']),
        c: surgeon('c', 'Dr B. Adams', ['ophth'], true),
        d: surgeon('d', 'Mr C. Okafor', ['gen']),
      },
      contracts: {
        x: contract('x', 'Eye list', ['ophth']),
        y: contract('y', 'Cataracts', ['ophth', 'gen'], { status: 'disabled' }),
        z: contract('z', 'Every specialty', []),
        s: contract('s', 'System RVG', ['ophth'], { systemRole: 'rvgFallback' }),
      },
    }
    const held = specialtyHolders(masters, 'ophth')
    expect(held.surgeons.map((h) => [h.surgeon.id, h.alsoHolds, h.retired])).toEqual([
      ['c', '', true],
      ['a', '', false],
      ['b', 'Plastic surgery', false],
    ])
    expect(held.contracts.map((h) => [h.contract.id, h.disabled])).toEqual([
      ['y', true],
      ['x', false],
    ])
    expect(held.contracts[0]!.holderName).toBe(seed.parties[template.holderId]!.name)
  })

  it('for every seeded specialty both lists are as long as specialtyUsage', () => {
    for (const id of Object.keys(seed.specialties)) {
      const held = specialtyHolders(seed, id)
      expect({ surgeons: held.surgeons.length, contracts: held.contracts.length }, id).toEqual(specialtyUsage(seed, id))
    }
  })

  it('a Contract with no specialty and a system Contract are in no list', () => {
    const listed = new Set(Object.keys(seed.specialties).flatMap((id) => specialtyHolders(seed, id).contracts.map((h) => h.contract.id)))
    for (const c of Object.values(seed.contracts)) {
      if (c.specialtyIds.length === 0 || !isOfficeContract(c)) expect(listed.has(c.id), c.id).toBe(false)
    }
  })
})
