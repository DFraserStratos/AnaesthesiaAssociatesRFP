import { describe, expect, it } from 'vitest'
import { generateNhi, NHI_REASONS, nhiEntryFeedback, validateNhi } from './nhi'
import { mulberry32 } from './rng'

describe('validateNhi — current format (AAANNNC, mod 11)', () => {
  it("validates the RFP's example ZAA0067 (weighted sum 191, remainder 4, check 7)", () => {
    const r = validateNhi('ZAA0067')
    expect(r).toEqual({ normalised: 'ZAA0067', format: 'current', valid: true })
  })

  it('rejects a wrong check digit (ZAA0068)', () => {
    const r = validateNhi('ZAA0068')
    expect(r.format).toBe('current')
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/check digit/i)
  })

  it('normalises lowercase input', () => {
    const r = validateNhi('  zaa0067 ')
    expect(r.normalised).toBe('ZAA0067')
    expect(r.valid).toBe(true)
  })
})

describe('validateNhi — new format (AAANNAX, mod 23)', () => {
  it("validates the RFP's example ACA31FM (weighted sum 57, remainder 11, check M)", () => {
    const r = validateNhi('ACA31FM')
    expect(r).toEqual({ normalised: 'ACA31FM', format: 'new', valid: true })
  })

  it('rejects a wrong check letter (ACA31FK)', () => {
    const r = validateNhi('ACA31FK')
    expect(r.format).toBe('new')
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/check letter/i)
  })
})

describe('validateNhi — malformed shapes', () => {
  it('rejects wrong lengths', () => {
    for (const bad of ['', 'ZAA006', 'ZAA00678']) {
      const r = validateNhi(bad)
      expect(r.valid).toBe(false)
      expect(r.format).toBeNull()
      expect(r.reason).toMatch(/7 characters/)
    }
  })

  it('rejects the letters I and O anywhere', () => {
    for (const bad of ['IAA0067', 'ZOA0067', 'ACA31FO']) {
      const r = validateNhi(bad)
      expect(r.valid).toBe(false)
      expect(r.reason).toMatch(/I and O/)
    }
  })

  it('rejects digit/letter class violations (neither AAANNNC nor AAANNAX)', () => {
    for (const bad of ['Z1A0067', 'ZAAA067', 'ZAA0A67', 'ZAA00F7', '1234567', 'ABCDEFG']) {
      const r = validateNhi(bad)
      expect(r.valid).toBe(false)
      expect(r.format).toBeNull()
    }
  })
})

describe('generateNhi', () => {
  it('round-trips validateNhi for the current format over a seeded run', () => {
    const rng = mulberry32(42)
    for (let i = 0; i < 200; i++) {
      const nhi = generateNhi('current', rng)
      const r = validateNhi(nhi)
      expect(r.valid, `${nhi} should validate`).toBe(true)
      expect(r.format).toBe('current')
    }
  })

  it('round-trips validateNhi for the new format over a seeded run', () => {
    const rng = mulberry32(4242)
    for (let i = 0; i < 200; i++) {
      const nhi = generateNhi('new', rng)
      const r = validateNhi(nhi)
      expect(r.valid, `${nhi} should validate`).toBe(true)
      expect(r.format).toBe('new')
    }
  })

  it('is deterministic for the same seed', () => {
    const a = generateNhi('current', mulberry32(7))
    const b = generateNhi('current', mulberry32(7))
    expect(a).toBe(b)
  })
})

describe('nhiEntryFeedback: the NHI checked as it is typed (catch-up Phase 40a)', () => {
  it('reads valid in both formats', () => {
    expect(nhiEntryFeedback('ZAA0067')).toEqual({ state: 'valid', normalised: 'ZAA0067', format: 'current' })
    expect(nhiEntryFeedback('ZBX41AL')).toEqual({ state: 'valid', normalised: 'ZBX41AL', format: 'new' })
  })

  it("gives the validator's check digit and check letter reasons on the seventh character", () => {
    expect(nhiEntryFeedback('ZAA0068')).toMatchObject({ state: 'invalid', reason: 'The check digit does not match.' })
    expect(nhiEntryFeedback('ZBX41AM')).toMatchObject({ state: 'invalid', reason: 'The check letter does not match.' })
  })

  it('flags an I or O at once, before 7 characters', () => {
    expect(nhiEntryFeedback('ABI')).toEqual({ state: 'invalid', normalised: 'ABI', reason: NHI_REASONS.letterIO })
    expect(nhiEntryFeedback('o')).toMatchObject({ state: 'invalid', reason: NHI_REASONS.letterIO })
  })

  it('normalises, reads empty and incomplete with no reason, and refuses more than 7', () => {
    expect(nhiEntryFeedback('zaa0067 ')).toMatchObject({ state: 'valid', normalised: 'ZAA0067' })
    expect(nhiEntryFeedback('   ')).toEqual({ state: 'empty', normalised: '' })
    expect(nhiEntryFeedback('ZAA006')).toEqual({ state: 'incomplete', normalised: 'ZAA006' })
    expect(nhiEntryFeedback('ZAA00671')).toMatchObject({ state: 'invalid', reason: 'An NHI is exactly 7 characters.' })
  })

  it("every 7-character reason is validateNhi's own", () => {
    for (const input of ['ZAA0068', 'ZBX41AM', 'ZAA0060', 'ZZZ12345'.slice(0, 7), '1234567', 'ZZ1AB23']) {
      const feedback = nhiEntryFeedback(input)
      const verdict = validateNhi(input)
      expect(feedback.state === 'valid').toBe(verdict.valid)
      if (!verdict.valid) expect(feedback.reason).toBe(verdict.reason)
    }
  })
})
