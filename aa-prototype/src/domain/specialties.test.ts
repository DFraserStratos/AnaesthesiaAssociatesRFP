import { describe, expect, it } from 'vitest'
import {
  cleanSpecialtyIds,
  contractFitsSpecialties,
  specialtiesInOrder,
  specialtyNameRefusal,
  specialtyUsage,
  specialtyUsageText,
  surgeonSpecialtyLabel,
  withSpecialties,
  type Specialty,
} from './specialties'

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
