import { describe, expect, it } from 'vitest'
import { matchContractPrice, selectContract } from './contracts'
import { mkContract } from './fixtures'
import type { ContractPrice } from '../types'

const QUERY = {
  holder: { holderType: 'hospital', holderId: 'hosp-1' },
  anaesthetistId: 'REG-30821',
  dateISO: '2026-07-21',
} as const

describe('selectContract', () => {
  it('filters by holder', () => {
    const other = mkContract({ id: 'con-other', holderId: 'hosp-2' })
    expect(selectContract([other], QUERY)).toBeUndefined()
  })

  it('filters by effective dates (expired and not-yet-effective excluded)', () => {
    const expired = mkContract({ id: 'con-expired', effectiveToISO: '2026-06-30' })
    const future = mkContract({ id: 'con-future', effectiveFromISO: '2026-08-01' })
    const open = mkContract({ id: 'con-open' })
    expect(selectContract([expired, future, open], QUERY)?.id).toBe('con-open')
    expect(selectContract([expired, future], QUERY)).toBeUndefined()
  })

  it('includes contracts effective exactly on the boundary dates', () => {
    const c = mkContract({ id: 'con-b', effectiveFromISO: '2026-07-21', effectiveToISO: '2026-07-21' })
    expect(selectContract([c], QUERY)?.id).toBe('con-b')
  })

  it('individual-anaesthetist scope beats organisational when both match', () => {
    const org = mkContract({ id: 'con-org' })
    const individual = mkContract({
      id: 'con-ind',
      scope: { kind: 'individualAnaesthetist', anaesthetistId: 'REG-30821' },
    })
    expect(selectContract([org, individual], QUERY)?.id).toBe('con-ind')
    expect(selectContract([individual, org], QUERY)?.id).toBe('con-ind')
  })

  it("ignores an individual-scoped contract for a different anaesthetist", () => {
    const org = mkContract({ id: 'con-org' })
    const otherInd = mkContract({
      id: 'con-other-ind',
      scope: { kind: 'individualAnaesthetist', anaesthetistId: 'REG-99999' },
    })
    expect(selectContract([otherInd, org], QUERY)?.id).toBe('con-org')
    expect(selectContract([otherInd], QUERY)).toBeUndefined()
  })

  it('a specific contract beats the protected default; an expired specific falls back to it', () => {
    const defaultType1 = mkContract({ id: 'con-default', isDefault: true })
    const specific = mkContract({ id: 'con-type2', type: 2, type2Detail: { basis: 'agreedUnitRate', unitRate: 25 } })
    expect(selectContract([defaultType1, specific], QUERY)?.id).toBe('con-type2')

    const expiredSpecific = mkContract({ ...specific, id: 'con-type2-expired', effectiveToISO: '2026-06-30' })
    expect(selectContract([defaultType1, expiredSpecific], QUERY)?.id).toBe('con-default')
  })
})

describe('matchContractPrice — most-specific match wins', () => {
  const prices: ContractPrice[] = [
    { id: 'p-generic', contractId: 'con-3', price: 900 },
    { id: 'p-code', contractId: 'con-3', rvgBaseCode: 'GA10', price: 800 },
    { id: 'p-code-surgeon', contractId: 'con-3', rvgBaseCode: 'GA10', surgeonId: 'surg-1', price: 750 },
    { id: 'p-code-ord2', contractId: 'con-3', rvgBaseCode: 'GA10', procedureOrdinal: 2, price: 400 },
  ]

  it('ignores other contracts', () => {
    expect(matchContractPrice(prices, { contractId: 'con-x', rvgBaseCode: 'GA10' })).toBeUndefined()
  })

  it('falls through to the generic row when nothing more specific matches', () => {
    expect(matchContractPrice(prices, { contractId: 'con-3', rvgBaseCode: 'XX99' })?.id).toBe('p-generic')
  })

  it('prefers the row matching more keys', () => {
    expect(
      matchContractPrice(prices, { contractId: 'con-3', rvgBaseCode: 'GA10', procedureOrdinal: 1 })?.id,
    ).toBe('p-code')
    expect(
      matchContractPrice(prices, {
        contractId: 'con-3',
        rvgBaseCode: 'GA10',
        surgeonId: 'surg-1',
        procedureOrdinal: 1,
      })?.id,
    ).toBe('p-code-surgeon')
  })

  it('matches 2nd-procedure ordinal rows', () => {
    expect(
      matchContractPrice(prices, { contractId: 'con-3', rvgBaseCode: 'GA10', procedureOrdinal: 2 })?.id,
    ).toBe('p-code-ord2')
  })

  it('returns undefined when no row matches (the Type 3 BTM fallback trigger)', () => {
    const ordinalOnly: ContractPrice[] = [
      { id: 'p-ord1', contractId: 'con-3', procedureOrdinal: 1, price: 500 },
    ]
    expect(
      matchContractPrice(ordinalOnly, { contractId: 'con-3', procedureOrdinal: 2 }),
    ).toBeUndefined()
  })
})
