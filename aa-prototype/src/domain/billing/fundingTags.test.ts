import { describe, expect, it } from 'vitest'
import {
  fundingTagRefusal,
  fundingTagsInOrder,
  fundingTagUsage,
  isAccTag,
  moveFundingTag,
  normaliseTagCode,
  procedureAccFunded,
  type FundingTag,
} from './fundingTags'
import { mkContract, mkParty, mkProcedure } from './fixtures'
import type { Party } from '../types'

const TAGS: Record<string, FundingTag> = {
  acc: { id: 'acc', code: 'ACC', order: 3 },
  sxap: { id: 'sxap', code: 'SXAP', order: 1, funderPartyId: 'py-schs' },
  hnz: { id: 'hnz', code: 'HNZ', order: 2 },
}
const PARTIES: Record<string, Party> = {
  'py-schs': { id: 'py-schs', kind: 'insurer', name: 'Southern Cross Health Society', codePrefix: 'SCHS' },
  'py-acc': { id: 'py-acc', kind: 'funder', name: 'ACC', codePrefix: 'ACC' },
  'party-hosp-1': mkParty(),
}

describe('funding tags', () => {
  it('lists the tags in step-rail order', () => {
    expect(fundingTagsInOrder(TAGS).map((t) => t.code)).toEqual(['SXAP', 'HNZ', 'ACC'])
  })

  it('ACC is the tag coded ACC, ignoring case', () => {
    expect(isAccTag(TAGS.acc)).toBe(true)
    expect(isAccTag({ code: 'acc' })).toBe(true)
    expect(isAccTag(TAGS.sxap)).toBe(false)
    expect(isAccTag(undefined)).toBe(false)
  })

  it('counts the Contracts carrying a tag', () => {
    const contracts = { a: mkContract({ fundingTagId: 'acc' }), b: mkContract({ id: 'b', fundingTagId: 'acc' }), c: mkContract({ id: 'c' }) }
    expect(fundingTagUsage(contracts, 'acc')).toBe(2)
    expect(fundingTagUsage(contracts, 'hnz')).toBe(0)
  })

  it('moves a tag up or down and renumbers, unchanged at the ends', () => {
    const up = moveFundingTag(TAGS, 'hnz', 'up')
    expect(fundingTagsInOrder(up).map((t) => `${t.order}:${t.code}`)).toEqual(['1:HNZ', '2:SXAP', '3:ACC'])
    const back = moveFundingTag(up, 'hnz', 'down')
    expect(fundingTagsInOrder(back).map((t) => t.code)).toEqual(['SXAP', 'HNZ', 'ACC'])
    expect(fundingTagsInOrder(moveFundingTag(TAGS, 'sxap', 'up')).map((t) => t.code)).toEqual(['SXAP', 'HNZ', 'ACC'])
  })

  it('a code is required and unique; the funder, when named, an insurer or funder Party', () => {
    const ctx = { tags: TAGS, parties: PARTIES }
    expect(fundingTagRefusal({ id: '', code: ' ' }, ctx)?.code).toBe('codeRequired')
    expect(fundingTagRefusal({ id: '', code: 'sx ap' }, ctx)?.code).toBe('codeTaken')
    expect(fundingTagRefusal({ id: 'sxap', code: 'SXAP' }, ctx)).toBeNull()
    expect(fundingTagRefusal({ id: '', code: 'NZDF', funderPartyId: 'py-none' }, ctx)?.code).toBe('funderUnknown')
    expect(fundingTagRefusal({ id: '', code: 'NZDF', funderPartyId: 'party-hosp-1' }, ctx)?.code).toBe('funderKind')
    expect(fundingTagRefusal({ id: '', code: 'NZDF', funderPartyId: 'py-acc' }, ctx)).toBeNull()
    expect(normaliseTagCode(' sx ap ')).toBe('SXAP')
  })
})

describe('procedureAccFunded (FT-05.5, US-05.5.1)', () => {
  const contracts = {
    acc: mkContract({ id: 'acc', fundingTagId: 'acc' }),
    sxap: mkContract({ id: 'sxap', fundingTagId: 'sxap' }),
    plain: mkContract({ id: 'plain' }),
  }
  const masters = { contracts, fundingTags: TAGS }

  it('is true only when the Contract carries the ACC tag', () => {
    expect(procedureAccFunded(masters, mkProcedure({ governingContractId: 'acc' }))).toBe(true)
    expect(procedureAccFunded(masters, mkProcedure({ governingContractId: 'sxap' }))).toBe(false)
    expect(procedureAccFunded(masters, mkProcedure({ governingContractId: 'plain' }))).toBe(false)
  })

  it('never reads the procedure text, and no stored Contract is never ACC', () => {
    expect(procedureAccFunded(masters, mkProcedure({ procedureText: { text: 'ACL reconstruction, ACC claim', source: 'surgeonPdf', receivedAtISO: '2026-11-17T09:00:00' }, governingContractId: 'plain' }))).toBe(false)
    expect(procedureAccFunded(masters, mkProcedure({ procedureText: { text: 'ACC knee reconstruction', source: 'surgeonPdf', receivedAtISO: '2026-11-17T09:00:00' } }))).toBe(false)
  })
})
