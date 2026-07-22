import { describe, expect, it } from 'vitest'
import { ETHNICITY_DEMO_SUBSET, lookupNhi, validateEthnicityCode } from './nzhis'
import { validateNhi } from './nhi'

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

describe('lookupNhi — simulated Digital Services Hub lookup', () => {
  it('returns canned patient data for a seeded current-format NHI', () => {
    const r = lookupNhi('CQY9304')
    expect(r).toEqual({
      found: true,
      name: 'Sarah Mitchell',
      dobISO: '1988-04-12',
      ethnicityCode: '11111',
    })
  })

  it('returns canned patient data for a seeded new-format NHI', () => {
    const r = lookupNhi('MYY54SL')
    expect(r).toEqual({
      found: true,
      name: 'Priya Nair',
      dobISO: '1969-11-08',
      ethnicityCode: '43111',
    })
  })

  it('normalises input before looking up', () => {
    expect(lookupNhi(' cqy9304 ').found).toBe(true)
  })

  it('returns not-found for an unseeded NHI', () => {
    expect(lookupNhi('ZAA0067')).toEqual({ found: false })
  })

  it('every canned NHI validates and every canned ethnicity code is in the demo subset', () => {
    for (const nhi of ['CQY9304', 'WQS3635', 'JKL1188', 'MYY54SL', 'RUE29KR']) {
      expect(validateNhi(nhi).valid, `${nhi} should validate`).toBe(true)
      const hit = lookupNhi(nhi)
      expect(hit.found).toBe(true)
      if (hit.found) {
        expect(validateEthnicityCode(hit.ethnicityCode).verdict).toBe('valid')
      }
    }
  })
})
