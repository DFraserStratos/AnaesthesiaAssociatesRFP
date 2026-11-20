import { describe, expect, it } from 'vitest'
import { findNhiTokens, maskNhi, redactNhis } from './nhiDetect'
import { generateNhi, validateNhi } from '../nhi'
import { mulberry32 } from '../rng'

const rng = mulberry32(43)
const CURRENT = generateNhi('current', rng)
const NEW = generateNhi('new', rng)

/** A current-shape token that fails the check digit. */
function lookAlike(nhi: string): string {
  for (let d = 0; d <= 9; d++) {
    const candidate = `${nhi.slice(0, 6)}${d}`
    if (!validateNhi(candidate).valid) return candidate
  }
  throw new Error('no look-alike')
}

describe('findNhiTokens', () => {
  it('finds both formats, in any case, inside JSON and punctuation', () => {
    expect(findNhiTokens(`patient ${CURRENT} and ${NEW}.`)).toEqual([CURRENT, NEW])
    expect(findNhiTokens(`{"nhi":"${CURRENT.toLowerCase()}"}`)).toEqual([CURRENT])
    expect(findNhiTokens(`(${NEW}),${CURRENT};`)).toEqual([NEW, CURRENT])
  })

  it('does not flag a look-alike that fails the check digit, or a token inside a longer run', () => {
    expect(findNhiTokens(`ref ${lookAlike(CURRENT)}`)).toEqual([])
    expect(findNhiTokens(`X${CURRENT}`)).toEqual([])
    expect(findNhiTokens(`${CURRENT}9`)).toEqual([])
    // I and O are not NHI letters.
    expect(findNhiTokens('IOA1234')).toEqual([])
  })

  it('redacts and masks', () => {
    expect(redactNhis(`failed for ${CURRENT}`)).toBe('failed for [NHI]')
    expect(redactNhis(`ref ${lookAlike(CURRENT)}`)).toBe(`ref ${lookAlike(CURRENT)}`)
    expect(maskNhi('ZAA1234')).toBe('ZAA••••')
  })
})
