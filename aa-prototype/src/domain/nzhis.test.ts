import { describe, expect, it } from 'vitest'
import { ETHNICITY_DEMO_SUBSET, validateEthnicityCode } from './nzhis'
import { validateNhi } from './nhi'
import { lookupOnRegister } from './nhiRegister'
import { nhiRegister } from './seed/nhiRegister'

describe('validateEthnicityCode — three-way verdict', () => {
  it('accepts a code in the demo subset with its group name', () => {
    const r = validateEthnicityCode('21111')
    expect(r).toEqual({
      verdict: 'valid',
      code: '21111',
      label: 'Māori',
      level1Group: 'Māori',
    })
  })

  it('accepts every code in the demo subset', () => {
    for (const entry of ETHNICITY_DEMO_SUBSET) {
      expect(validateEthnicityCode(entry.code).verdict).toBe('valid')
    }
  })

  it('labels a well-formed unknown code outsideDemoSubset, never "invalid"', () => {
    const r = validateEthnicityCode('12345')
    expect(r.verdict).toBe('outsideDemoSubset')
    if (r.verdict === 'outsideDemoSubset') {
      expect(r.message).toMatch(/may be a valid NZHIS Level 4 code/)
      expect(r.message).toMatch(/curated subset/)
    }
  })

  it('rejects malformed codes with a reason', () => {
    for (const bad of ['', '1111', '111111', 'ABCDE', '1111x']) {
      const r = validateEthnicityCode(bad)
      expect(r.verdict).toBe('malformed')
    }
  })

  it('demo subset spans the six Level 1 groups', () => {
    const groups = new Set(ETHNICITY_DEMO_SUBSET.map((e) => e.level1Group))
    expect(groups).toEqual(
      new Set(['European', 'Māori', 'Pacific Peoples', 'Asian', 'MELAA', 'Other Ethnicity']),
    )
  })
})

describe('lookupOnRegister: the NHI lookup over the synthetic register (catch-up Phase 40a, replacing the Phase 01 stand-in)', () => {
  it('returns the patient for a seeded current-format NHI', () => {
    expect(lookupOnRegister(nhiRegister(), 'CQY9304')).toMatchObject({ kind: 'found', person: { name: 'Sarah Mitchell', dobISO: '1988-04-12', ethnicityCode: '11111' } })
  })

  it('returns the patient for a seeded new-format NHI', () => {
    expect(lookupOnRegister(nhiRegister(), 'MYY54SL')).toMatchObject({ kind: 'found', person: { name: 'Priya Nair', dobISO: '1969-11-08', ethnicityCode: '43111' } })
  })

  it('returns the complete phone-advice demo patient', () => {
    expect(lookupOnRegister(nhiRegister(), 'DEM1239')).toEqual({
      kind: 'found',
      person: { nhi: 'DEM1239', name: 'Demo Patient', dobISO: '1990-01-01', phone: '021 555 0190', ethnicityCode: '11111', format: 'current' },
    })
  })

  it('normalises input before looking up', () => {
    expect(lookupOnRegister(nhiRegister(), ' cqy9304 ').kind).toBe('found')
  })

  it('an NHI failing its check digit is invalid with the reason, never looked up', () => {
    expect(lookupOnRegister(nhiRegister(), 'ABC1234')).toEqual({ kind: 'invalid', reason: 'The check digit does not match.' })
  })

  it('the formerly canned NHIs validate and their ethnicity codes are in the demo subset', () => {
    for (const nhi of ['CQY9304', 'WQS3635', 'JKL1188', 'MYY54SL', 'RUE29KR', 'DEM1239']) {
      expect(validateNhi(nhi).valid, `${nhi} should validate`).toBe(true)
      const hit = lookupOnRegister(nhiRegister(), nhi)
      expect(hit.kind).toBe('found')
      if (hit.kind === 'found') expect(validateEthnicityCode(hit.person.ethnicityCode ?? '').verdict).toBe('valid')
    }
  })
})
