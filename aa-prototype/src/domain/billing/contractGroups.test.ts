import { describe, expect, it } from 'vitest'
import { buildSeed } from '../seed'
import { CONTRACT } from '../seed/contracts'
import { PARTY } from '../seed/parties'
import { TAG } from '../seed/fundingTags'
import { SURG } from '../seed/cast'
import { nameWithoutTitle } from '../names'
import type { Contract } from '../types'
import { contractSearch } from './contracts'
import { CONTRACT_GROUPINGS, groupContracts, groupCount, NO_GROUP_KEY, parseContractGrouping, type ContractGroupWords, type ContractGrouping } from './contractGroups'

// The app passes `shared/contracts`' CONTRACT_GROUP_WORDS; the domain test keeps to the domain.
const CONTRACT_GROUP_WORDS: ContractGroupWords = {
  kindPlural: { aa: 'Anaesthesia Associates', hospital: 'Hospitals', insurer: 'Insurers', funder: 'Funders', surgeon: 'Surgeons', surgeonGroup: 'Surgeon groups', anaesthetist: 'Anaesthetists' },
  pricingKind: { rvgAnaesthetistRate: 'RVG', rvgContractRate: 'Rate', rvgDiscount: 'Discount', fixed: 'Fixed price', open: 'Open' },
  surname: (name) => nameWithoutTitle(name).split(/\s+/).pop() ?? name,
  noTag: 'No tag',
  noSurgeon: 'Not linked to a surgeon',
  patient: 'Patient',
  special: 'Special',
  standard: 'Standard',
  prepaid: 'Prepaid',
}

const state = buildSeed()
const masters = { parties: state.masters.parties, fundingTags: state.masters.fundingTags, surgeons: state.masters.surgeons }
const all = contractSearch('', { contracts: state.masters.contracts, parties: state.masters.parties, filters: { status: 'all' } })
const GROUPINGS: ContractGrouping[] = CONTRACT_GROUPINGS.options.map((o) => o.value)
const group = (by: ContractGrouping, list: readonly Contract[] = all) => groupContracts(list, by, masters, CONTRACT_GROUP_WORDS)
const keysOf = (by: ContractGrouping, id: string) => group(by).filter((g) => g.entries.some((e) => e.contract.id === id)).map((g) => g.key)

describe('groupContracts (build plan Phase 47; US-04.1.2)', () => {
  it('has six groupings with Kind the default, and parses only those', () => {
    expect(GROUPINGS).toEqual(['kind', 'holder', 'tag', 'surgeon', 'destination', 'pricing'])
    expect(CONTRACT_GROUPINGS.defaultValue).toBe('kind')
    expect(parseContractGrouping('tag')).toBe('tag')
    expect(parseContractGrouping('Holder')).toBeUndefined()
    expect(parseContractGrouping(null)).toBeUndefined()
  })

  it.each(GROUPINGS)('%s places every Contract at least once and counts each once', (by) => {
    const groups = group(by)
    const placed = new Set(groups.flatMap((g) => g.entries.map((e) => e.contract.id)))
    expect(placed.size).toBe(all.length)
    expect(groupCount(groups)).toBe(all.length)
  })

  it('puts a Contract linked to two surgeons under both, so the groups add up to more than the distinct count', () => {
    expect(keysOf('surgeon', CONTRACT.ariaContractRate).sort()).toEqual([SURG.lim, SURG.okafor].sort())
    const groups = group('surgeon')
    const sum = groups.reduce((n, g) => n + g.entries.length, 0)
    expect(sum).toBeGreaterThan(groupCount(groups))
  })

  it('puts unlinked Contracts last under "Not linked to a surgeon", and surgeons by surname', () => {
    const groups = group('surgeon')
    const last = groups[groups.length - 1]!
    expect(last.key).toBe(NO_GROUP_KEY)
    expect(last.label).toBe('Not linked to a surgeon')
    expect(keysOf('surgeon', CONTRACT.noContractRvg)).toEqual([NO_GROUP_KEY])
    const surnames = groups.slice(0, -1).map((g) => CONTRACT_GROUP_WORDS.surname(g.label))
    expect(surnames).toEqual([...surnames].sort((a, b) => a.localeCompare(b)))
  })

  it('puts an anaesthetist-linked Contract with no surgeon under none', () => {
    const base = all[0]!
    const own: Contract = { ...base, id: 'CT-OWN', linkedSurgeonIds: [], linkedAnaesthetistId: 'A-1', systemRole: undefined }
    expect(group('surgeon', [own]).map((g) => g.key)).toEqual([NO_GROUP_KEY])
  })

  it('groups by funding tag in AA order with No tag last, sub-headed by holder', () => {
    const groups = group('tag')
    expect(groups[groups.length - 1]!.key).toBe(NO_GROUP_KEY)
    expect(groups[groups.length - 1]!.label).toBe('No tag')
    const sxap = groups.find((g) => g.key === TAG.sxap)!
    expect(sxap.entries.every((e) => e.contract.fundingTagId === TAG.sxap)).toBe(true)
    expect(sxap.entries.every((e) => e.subKey === e.contract.holderId)).toBe(true)
    expect(keysOf('tag', CONTRACT.stgRvg)).toEqual([NO_GROUP_KEY])
  })

  it('reads where the invoice goes only from destinationOf (D91): Patient first, then hospitals, Special last', () => {
    const groups = group('destination')
    expect(groups[0]!.key).toBe('patient')
    expect(groups[groups.length - 1]!.key).toBe('special')
    // A hospital's untagged Contract is Special (OQ-145 open); a tagged one is under its hospital and tag.
    expect(keysOf('destination', CONTRACT.stgRvg)).toEqual(['special'])
    expect(keysOf('destination', CONTRACT.stgAcc)).toEqual([`hospital:${PARTY.stg}`])
    const stg = groups.find((g) => g.key === `hospital:${PARTY.stg}`)!
    expect(stg.entries.find((e) => e.contract.id === CONTRACT.stgAcc)!.subLabel).toBe('ACC')
    // A surgeon group's ACC Contract that bills the group is Special.
    expect(keysOf('destination', CONTRACT.cosAcc)).toEqual(['special'])
    // A payer-billed Contract is Patient, Standard or Prepaid.
    expect(keysOf('destination', CONTRACT.doyleBariatric)).toEqual(['patient'])
    const prepaid = all.find((c) => c.billsTo === 'payer' && c.prepaid)!
    expect(groups[0]!.entries.find((e) => e.contract.id === prepaid.id)!.subLabel).toBe('Prepaid')
    const patientSubs = groups[0]!.entries.map((e) => e.subKey)
    expect(patientSubs.indexOf('prepaid')).toBeGreaterThan(patientSubs.lastIndexOf('standard'))
  })

  it('heads Holder and Kind with AA, whose system Contracts come first; Holder sub-heads by tag with No tag last', () => {
    expect(group('kind')[0]!.key).toBe('aa')
    expect(group('kind')[0]!.label).toBe('Anaesthesia Associates')
    expect(group('kind').map((g) => g.key)).toEqual(['aa', 'hospital', 'insurer', 'funder', 'surgeonGroup', 'surgeon', 'anaesthetist'].filter((k) => group('kind').some((g) => g.key === k)))
    const holder = group('holder')
    expect(holder[0]!.key).toBe(PARTY.aa)
    expect(holder[0]!.section).toBeUndefined()
    expect(holder[0]!.entries[0]!.contract.systemRole).toBe('noContractRvg')
    expect(holder.find((g) => g.key === PARTY.stg)!.section).toBe('Hospitals')
    for (const g of holder) {
      const subs = g.entries.map((e) => e.subKey)
      const firstNone = subs.indexOf(NO_GROUP_KEY)
      if (firstNone >= 0) expect(subs.slice(firstNone).every((s) => s === NO_GROUP_KEY)).toBe(true)
    }
  })

  it('groups by pricing kind in the catalogue order', () => {
    const order = ['rvgAnaesthetistRate', 'rvgContractRate', 'rvgDiscount', 'fixed', 'open']
    const keys = group('pricing').map((g) => g.key)
    expect(keys).toEqual(order.filter((k) => keys.includes(k)))
    expect(keysOf('pricing', CONTRACT.forteDiscount)).toEqual(['rvgDiscount'])
  })

  it('groups a Disabled Contract like any other (the caller filters)', () => {
    expect(keysOf('holder', CONTRACT.cesOldRate)).toEqual([PARTY.ces])
  })

  it('gives no groups for an empty list, stable id keys, and leaves the input alone', () => {
    expect(group('kind', [])).toEqual([])
    const copy = JSON.stringify(all)
    const a = group('surgeon').map((g) => g.key)
    const b = group('surgeon').map((g) => g.key)
    expect(a).toEqual(b)
    expect(a).toContain(SURG.lim)
    expect(JSON.stringify(all)).toBe(copy)
  })
})
