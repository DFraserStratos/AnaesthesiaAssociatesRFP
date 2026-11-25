import { describe, expect, it } from 'vitest'
import { buildSeed } from '../seed'
import type { Contract } from '../types'
import { activeContractCount, contractSearch } from './contracts'
import { CONTRACT_GROUPINGS, groupContracts, groupCount, type ContractGroupWords } from './contractGroups'
import { isOfficeContract } from './fallbacks'
import {
  contractCountsByHolder,
  narrowContracts,
  NO_TAG,
  partyContractCounts,
  partyStepRailPlaces,
  tagContractsByHospital,
  type CatalogueNarrowing,
} from './partyContracts'

const state = buildSeed()
const { contracts, parties, fundingTags } = state.masters

const WORDS: ContractGroupWords = {
  kindPlural: { aa: 'AA', hospital: 'Hospitals', insurer: 'Insurers', funder: 'Funders', surgeon: 'Surgeons', surgeonGroup: 'Surgeon groups', anaesthetist: 'Anaesthetists' },
  pricingKind: { rvgAnaesthetistRate: 'RVG', rvgContractRate: 'Rate', rvgDiscount: 'Discount', fixed: 'Fixed price', open: 'Open' },
  surname: (name) => name,
  noTag: 'No tag',
  noSurgeon: 'None',
  patient: 'Patient',
  special: 'Special',
  standard: 'Standard',
  prepaid: 'Prepaid',
}

/**
 * The rows the catalogue lists at a count's link: the same pipeline `ContractsView` runs (search
 * with a status, the link's narrowing, the holder grouping, the picked group).
 */
function catalogueRows(link: { holderId?: string; tagId?: string; status?: 'active' | 'disabled' }, from: Readonly<Record<string, Contract>> = contracts): number {
  const narrowing: CatalogueNarrowing = { own: true, ...(link.tagId !== undefined ? { tag: link.tagId } : {}) }
  const searched = contractSearch('', { contracts: from, parties, filters: { status: link.status ?? 'active' } })
  const narrowed = narrowContracts(searched, narrowing)
  if (link.holderId === undefined) return narrowed.length
  const groups = groupContracts(narrowed, 'holder', { parties, fundingTags, surgeons: state.masters.surgeons }, WORDS)
  return groups.find((g) => g.key === link.holderId)?.entries.length ?? 0
}

/** A copy of a seeded Contract with a new id, holder, tag and status. */
function contractLike(base: Contract, id: string, over: Partial<Contract>): Contract {
  return { ...base, id, aaCode: id, ...over }
}

describe('partyContractCounts (build plan Phase 48; US-04.1.5)', () => {
  it('counts a Party\'s Active office Contracts per tag in step rail order, No tag last, Disabled apart', () => {
    const ces = partyContractCounts(contracts, fundingTags, 'PY-CES')
    expect(ces.byTag.map((r) => r.tagId)).toEqual(['TAG-SXAP', 'TAG-HNZ', 'TAG-ACC', NO_TAG])
    expect(ces.byTag.map((r) => r.count)).toEqual([6, 1, 1, 1])
    expect(ces.total).toBe(9)
    expect(ces.disabled).toBe(1)
  })

  it('reads the criteria\'s example: 56 SXAP, 62 HNZ and 26 ACC give three counts, and SXAP lists 56', () => {
    const base = Object.values(contracts).find((c) => c.holderId === 'PY-CES' && isOfficeContract(c) && c.status === 'active')!
    const own: Record<string, Contract> = {}
    const add = (tag: string, n: number) => {
      for (let i = 0; i < n; i++) own[`X-${tag}-${i}`] = contractLike(base, `X-${tag}-${i}`, { fundingTagId: tag })
    }
    add('TAG-SXAP', 56)
    add('TAG-HNZ', 62)
    add('TAG-ACC', 26)
    const counts = partyContractCounts(own, fundingTags, 'PY-CES')
    expect(counts.byTag).toEqual([
      { tagId: 'TAG-SXAP', count: 56 },
      { tagId: 'TAG-HNZ', count: 62 },
      { tagId: 'TAG-ACC', count: 26 },
    ])
    expect(catalogueRows({ holderId: 'PY-CES', tagId: 'TAG-SXAP' }, own)).toBe(56)
  })

  it('returns nothing for a Party that holds no Contracts', () => {
    expect(partyContractCounts(contracts, fundingTags, 'PY-AIA')).toEqual({ total: 0, byTag: [], disabled: 0 })
    expect(partyStepRailPlaces(contracts, parties, fundingTags, 'PY-AIA')).toEqual([])
  })

  it('never counts a system backstop or a Disabled Contract', () => {
    const backstops = Object.values(contracts).filter((c) => c.holderId === 'PY-CES' && !isOfficeContract(c))
    expect(backstops.length).toBeGreaterThan(0)
    const held = Object.values(contracts).filter((c) => c.holderId === 'PY-CES' && isOfficeContract(c))
    const counts = partyContractCounts(contracts, fundingTags, 'PY-CES')
    expect(counts.total + counts.disabled).toBe(held.length)
    expect(contractCountsByHolder(contracts).active.get('PY-CES')).toBe(counts.total)
  })

  it('the Contracts tab\'s count is what the default catalogue lists (Active, no narrowing), system backstops included', () => {
    const listed = contractSearch('', { contracts, parties, filters: { status: 'active' } })
    expect(listed.some((c) => !isOfficeContract(c))).toBe(true)
    for (const { value } of CONTRACT_GROUPINGS.options) {
      const groups = groupContracts(listed, value, { parties, fundingTags, surgeons: state.masters.surgeons }, WORDS)
      expect(groupCount(groups)).toBe(activeContractCount(contracts))
    }
  })

  it('equals the rows the catalogue lists at every count\'s link, for every Party', () => {
    for (const p of Object.values(parties)) {
      const counts = partyContractCounts(contracts, fundingTags, p.id)
      expect(catalogueRows({ holderId: p.id })).toBe(counts.total)
      for (const row of counts.byTag) expect(catalogueRows({ holderId: p.id, tagId: row.tagId })).toBe(row.count)
      expect(catalogueRows({ holderId: p.id, status: 'disabled' })).toBe(counts.disabled)
    }
  })
})

describe('tagContractsByHospital (build plan Phase 48; US-13.4.5)', () => {
  it('lists each hospital holding the tag\'s Contracts with its count, by name', () => {
    const sxap = tagContractsByHospital(contracts, parties, fundingTags, 'TAG-SXAP')
    expect(sxap.hospitals).toEqual([
      { partyId: 'PY-CES', count: 6 },
      { partyId: 'PY-SX', count: 1 },
    ])
    expect(sxap.notUnderHospital).toBe(0)
  })

  it('reads the criteria\'s example: SXAP under CES, Forte Health and Southern Cross shows the three with their counts', () => {
    const base = Object.values(contracts).find((c) => c.holderId === 'PY-CES' && isOfficeContract(c) && c.status === 'active' && c.billsTo === 'holder')!
    const own: Record<string, Contract> = {}
    const add = (holderId: string, n: number) => {
      for (let i = 0; i < n; i++) own[`X-${holderId}-${i}`] = contractLike(base, `X-${holderId}-${i}`, { holderId, fundingTagId: 'TAG-SXAP' })
    }
    add('PY-CES', 56)
    add('PY-FORTE', 20)
    add('PY-SX', 18)
    const sxap = tagContractsByHospital(own, parties, fundingTags, 'TAG-SXAP')
    expect(sxap.hospitals).toEqual([
      { partyId: 'PY-CES', count: 56 },
      { partyId: 'PY-FORTE', count: 20 },
      { partyId: 'PY-SX', count: 18 },
    ])
    for (const h of sxap.hospitals) expect(catalogueRows({ holderId: h.partyId, tagId: 'TAG-SXAP' }, own)).toBe(h.count)
  })

  it('puts a tagged Contract not held by a hospital under "Not under a hospital"', () => {
    const acc = tagContractsByHospital(contracts, parties, fundingTags, 'TAG-ACC')
    expect(acc.notUnderHospital).toBe(2)
    expect(acc.total).toBe(acc.hospitals.reduce((n, h) => n + h.count, 0) + acc.notUnderHospital)
    for (const h of acc.hospitals) expect(catalogueRows({ holderId: h.partyId, tagId: 'TAG-ACC' })).toBe(h.count)
  })

  it('skips Disabled Contracts and backstops', () => {
    const all = Object.values(contracts).filter((c) => c.fundingTagId === 'TAG-SXAP')
    const counted = all.filter((c) => c.status === 'active' && isOfficeContract(c))
    expect(all.length).toBeGreaterThan(counted.length)
    expect(tagContractsByHospital(contracts, parties, fundingTags, 'TAG-SXAP').total).toBe(counted.length)
  })
})

describe('partyStepRailPlaces (build plan Phase 48; US-04.1.5)', () => {
  it('lists where a hospital\'s Contracts sit: its tags in order, then Special', () => {
    const places = partyStepRailPlaces(contracts, parties, fundingTags, 'PY-CES')
    expect(places.map((p) => p.key)).toEqual(['hospital:PY-CES:TAG-SXAP', 'hospital:PY-CES:TAG-HNZ', 'hospital:PY-CES:TAG-ACC', 'special:PY-CES'])
    expect(places.map((p) => p.count)).toEqual([6, 1, 1, 1])
  })
})

describe('narrowContracts', () => {
  it('keeps the input order and narrows by own and tag', () => {
    const list = contractSearch('', { contracts, parties, filters: { status: 'all' } })
    const untagged = narrowContracts(list, { own: false, tag: NO_TAG })
    expect(untagged.every((c) => c.fundingTagId === undefined)).toBe(true)
    expect(narrowContracts(list, { own: false })).toEqual(list)
    expect(narrowContracts(list, { own: true }).every(isOfficeContract)).toBe(true)
  })
})
