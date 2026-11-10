import { describe, expect, it } from 'vitest'
import { foldName, parseBookingQuery, patientMatches } from './bookingSearch'

const mitchell = { name: 'Sarah Mitchell', nhi: 'CQY9304' }
const newFormat = { name: 'Aroha Ngata', nhi: 'ZZZ00AC' }
const noNhi = { name: 'Noah Prescott' }

describe('parseBookingQuery', () => {
  it('reads an NHI in either format, spaces and case ignored, check character or not', () => {
    expect(parseBookingQuery('CQY9304')).toEqual({ kind: 'nhi', nhi: 'CQY9304' })
    expect(parseBookingQuery(' cqy 9304 ')).toEqual({ kind: 'nhi', nhi: 'CQY9304' })
    expect(parseBookingQuery('zzz00ac')).toEqual({ kind: 'nhi', nhi: 'ZZZ00AC' })
    expect(parseBookingQuery('ABC1234')).toEqual({ kind: 'nhi', nhi: 'ABC1234' })
  })

  it('anything else is a name query, in folded words', () => {
    expect(parseBookingQuery('Prescot')).toEqual({ kind: 'name', tokens: ['prescot'] })
    expect(parseBookingQuery('sar  Mit')).toEqual({ kind: 'name', tokens: ['sar', 'mit'] })
    // An NHI-length word with I or O is not an NHI shape.
    expect(parseBookingQuery('OIOIOIO').kind).toBe('name')
  })

  it('empty and too short', () => {
    expect(parseBookingQuery('   ')).toEqual({ kind: 'empty' })
    expect(parseBookingQuery('a')).toEqual({ kind: 'tooShort' })
    expect(parseBookingQuery(' ʻ ')).toEqual({ kind: 'tooShort' })
  })
})

describe('foldName', () => {
  it('folds case, accents, the ʻokina, apostrophes and hyphen runs', () => {
    expect(foldName('Faʻaoso')).toBe('faaoso')
    expect(foldName('Māori')).toBe('maori')
    expect(foldName("O'Brien-Smith")).toBe('obrien smith')
    expect(foldName('  Te   Whare  ')).toBe('te whare')
  })
})

describe('patientMatches', () => {
  it('an NHI query matches the NHI exactly', () => {
    expect(patientMatches(parseBookingQuery('cqy 9304'), mitchell)).toBe(true)
    expect(patientMatches(parseBookingQuery('CQY9305'), mitchell)).toBe(false)
    expect(patientMatches(parseBookingQuery('zzz00ac'), newFormat)).toBe(true)
  })

  it('a name query needs every word inside the name', () => {
    expect(patientMatches(parseBookingQuery('mitch'), mitchell)).toBe(true)
    expect(patientMatches(parseBookingQuery('sar mit'), mitchell)).toBe(true)
    expect(patientMatches(parseBookingQuery('sar jones'), mitchell)).toBe(false)
    expect(patientMatches(parseBookingQuery('faaoso'), { name: 'Tavita Faʻaoso' })).toBe(true)
    expect(patientMatches(parseBookingQuery('maori'), { name: 'Māori Test' })).toBe(true)
  })

  it('a patient with no NHI is found by name only', () => {
    expect(patientMatches(parseBookingQuery('Prescott'), noNhi)).toBe(true)
    expect(patientMatches(parseBookingQuery('ABC1234'), noNhi)).toBe(false)
  })

  it('empty and too-short queries match nothing; deterministic', () => {
    expect(patientMatches(parseBookingQuery(''), mitchell)).toBe(false)
    expect(patientMatches(parseBookingQuery('a'), mitchell)).toBe(false)
    expect(parseBookingQuery('sar mit')).toEqual(parseBookingQuery('sar mit'))
  })
})
