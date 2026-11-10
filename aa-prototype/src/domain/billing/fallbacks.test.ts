import { describe, expect, it } from 'vitest'
import {
  contractChoosableForProcedure,
  destinationHint,
  destinationKey,
  destinationOf,
  ensureFallbacks,
  fallbackNameFor,
  findFallback,
  isOpenPriceFallback,
  seedFallbackId,
} from './fallbacks'
import { contractRefusal, type Contract, type ContractRefusalContext } from './contracts'
import { mkContract, mkParty } from './fixtures'
import type { FundingTag } from './fundingTags'
import type { Party } from '../types'

const AA: Party = { id: 'py-aa', kind: 'aa', name: 'Anaesthesia Associates', codePrefix: 'AA' }
const STG = mkParty({ id: 'py-stg', name: "St George's", codePrefix: 'STG' })
const CES = mkParty({ id: 'py-ces', name: 'Christchurch Eye Surgery', codePrefix: 'CES', hospitalId: 'h-ces' })
const GROUP: Party = { id: 'py-cos', kind: 'surgeonGroup', name: 'Canterbury Orthopaedic Surgeons', codePrefix: 'COS', billingName: 'COS Ltd', email: 'a@cos.example', deliveryMethod: 'email' }
const NIB: Party = { id: 'py-nib', kind: 'insurer', name: 'nib', codePrefix: 'NIB', billingName: 'nib nz', email: 'c@nib.example', deliveryMethod: 'email' }
const PARTIES = Object.fromEntries([AA, STG, CES, GROUP, NIB].map((p) => [p.id, p]))
const TAGS: Record<string, FundingTag> = {
  sxap: { id: 'sxap', code: 'SXAP', order: 1 },
  hnz: { id: 'hnz', code: 'HNZ', order: 2 },
  acc: { id: 'acc', code: 'ACC', order: 3 },
}

const byId = (cs: Contract[]) => Object.fromEntries(cs.map((c) => [c.id, c]))
let n = 0
const newId = () => `F${++n}`

describe('destinationOf (AR-58 5.2, US-04.2.17)', () => {
  it('bills the payer: Patient, Standard or Prepaid, whatever its tag', () => {
    expect(destinationOf(mkContract({ billsTo: 'payer', holderId: AA.id }), PARTIES)).toEqual({ kind: 'patient', prepaid: false })
    expect(destinationOf(mkContract({ billsTo: 'payer', prepaid: true, holderId: AA.id }), PARTIES)).toEqual({ kind: 'patient', prepaid: true })
    expect(destinationOf(mkContract({ billsTo: 'payer', holderId: GROUP.id, fundingTagId: 'acc' }), PARTIES).kind).toBe('patient')
  })

  it('Under the hospital: a CES-held SXAP item billing CES sits under CES › SXAP', () => {
    const d = destinationOf(mkContract({ holderId: CES.id, fundingTagId: 'sxap' }), PARTIES)
    expect(d).toEqual({ kind: 'hospital', holderPartyId: CES.id, fundingTagId: 'sxap' })
    expect(destinationHint(d, PARTIES, TAGS)).toBe('Offered under Christchurch Eye Surgery › SXAP')
  })

  it('Untagged: a hospital-held, hospital-billed Contract with no tag sits under Special', () => {
    expect(destinationOf(mkContract({ holderId: STG.id }), PARTIES)).toEqual({ kind: 'special', holderPartyId: STG.id })
  })

  it('Billed directly: a surgeon group billed directly with an ACC tag sits under Special', () => {
    const d = destinationOf(mkContract({ holderId: GROUP.id, fundingTagId: 'acc', linkedSurgeonIds: ['s1'] }), PARTIES)
    expect(d).toEqual({ kind: 'special', holderPartyId: GROUP.id })
    expect(destinationHint(d, PARTIES, TAGS)).toBe('Offered under Special')
  })

  it('keys each destination stably', () => {
    expect(destinationKey({ kind: 'patient', prepaid: false })).toBe('patient:standard')
    expect(destinationKey({ kind: 'patient', prepaid: true })).toBe('patient:prepaid')
    expect(destinationKey({ kind: 'hospital', holderPartyId: 'py-stg', fundingTagId: 'acc' })).toBe('hospital:py-stg:acc')
    expect(destinationKey({ kind: 'special', holderPartyId: 'py-nib' })).toBe('special:py-nib')
    expect(seedFallbackId('hospital:PY-STG:TAG-ACC')).toBe('CT-FIX-HOSPITAL-PY-STG-TAG-ACC')
  })
})

describe('ensureFallbacks (AR-58 5.5)', () => {
  const office = [
    mkContract({ id: 'stg-acc', aaCode: 'STG-002', holderId: STG.id, fundingTagId: 'acc' }),
    mkContract({ id: 'stg-rvg', aaCode: 'STG-001', holderId: STG.id }),
    mkContract({ id: 'cos-acc', aaCode: 'COS-001', holderId: GROUP.id, fundingTagId: 'acc', linkedSurgeonIds: ['s1'] }),
    mkContract({ id: 'nib', aaCode: 'NIB-001', holderId: NIB.id }),
  ]

  it('makes the two Patient fallbacks and one per hospital and tag and per Special holder', () => {
    const { created } = ensureFallbacks(byId(office), PARTIES, TAGS, newId)
    expect(created.map((c) => [c.name, c.aaCode]).sort()).toEqual(
      [
        ['Canterbury Orthopaedic Surgeons · Fixed price', 'COS-FIX'],
        ['No contract · Fixed price', 'AA-FIX'],
        ['Prepaid · Fixed price', 'AA-PRE'],
        ["St George's · ACC · Fixed price", 'STG-ACC-FIX'],
        ["St George's · Fixed price", 'STG-FIX'],
        ['nib · Fixed price', 'NIB-FIX'],
      ].sort(),
    )
  })

  it('each fallback is kind open, system, Active, with no specialties or links; the tag only on a hospital one', () => {
    const { created } = ensureFallbacks(byId(office), PARTIES, TAGS, newId)
    for (const f of created) {
      expect(f).toMatchObject({ pricing: { kind: 'open' }, systemRole: 'openPriceFallback', status: 'active', specialtyIds: [], linkedSurgeonIds: [] })
      expect(f.pricing.kind).not.toBe('fixed')
      expect(isOpenPriceFallback(f)).toBe(true)
      expect(contractChoosableForProcedure(f)).toBe(false)
    }
    const cos = created.find((c) => c.holderId === GROUP.id)!
    expect(cos.fundingTagId).toBeUndefined()
    expect(cos.billsTo).toBe('holder')
    const stgAcc = created.find((c) => c.name === "St George's · ACC · Fixed price")!
    expect(stgAcc).toMatchObject({ holderId: STG.id, billsTo: 'holder', fundingTagId: 'acc', prepaid: false })
    const prepaid = created.find((c) => c.aaCode === 'AA-PRE')!
    expect(prepaid).toMatchObject({ holderId: AA.id, billsTo: 'payer', prepaid: true })
  })

  it('is idempotent: a second run creates none', () => {
    const first = ensureFallbacks(byId(office), PARTIES, TAGS, newId)
    const second = ensureFallbacks(first.contracts, PARTIES, TAGS, newId)
    expect(second.created).toEqual([])
    expect(second.contracts).toEqual(first.contracts)
  })

  it('a Contract that moves destination gets the new fallback and the old stays', () => {
    const first = ensureFallbacks(byId(office), PARTIES, TAGS, newId).contracts
    const moved = { ...first, 'stg-acc': { ...first['stg-acc']!, fundingTagId: 'hnz' } }
    const { created, contracts } = ensureFallbacks(moved, PARTIES, TAGS, newId)
    expect(created.map((c) => c.name)).toEqual(["St George's · HNZ · Fixed price"])
    expect(Object.values(contracts).some((c) => c.name === "St George's · ACC · Fixed price")).toBe(true)
  })

  it('a Disabled Contract implies no destination; the Patient ones always exist', () => {
    const disabled = [mkContract({ id: 'ces-sxap', holderId: CES.id, fundingTagId: 'sxap', status: 'disabled' })]
    const { created } = ensureFallbacks(byId(disabled), PARTIES, TAGS, newId)
    expect(created.map((c) => c.aaCode).sort()).toEqual(['AA-FIX', 'AA-PRE'])
  })

  it('a fallback implies nothing of its own, and codes stay unique when the stem is taken', () => {
    const taken = [...office, mkContract({ id: 'x', aaCode: 'NIB-FIX', holderId: NIB.id, name: 'Something else' })]
    const { created } = ensureFallbacks(byId(taken), PARTIES, TAGS, newId)
    expect(created.find((c) => c.holderId === NIB.id)?.aaCode).toBe('NIB-FIX-2')
    const all = Object.values(ensureFallbacks(byId(taken), PARTIES, TAGS, newId).contracts).map((c) => c.aaCode)
    expect(new Set(all).size).toBe(all.length)
  })

  it('findFallback finds one per destination', () => {
    const { contracts } = ensureFallbacks(byId(office), PARTIES, TAGS, newId)
    expect(findFallback(contracts, { kind: 'hospital', holderPartyId: STG.id, fundingTagId: 'acc' }, PARTIES)?.aaCode).toBe('STG-ACC-FIX')
    expect(findFallback(contracts, { kind: 'patient', prepaid: false }, PARTIES)?.name).toBe('No contract · Fixed price')
    expect(findFallback(contracts, { kind: 'hospital', holderPartyId: CES.id, fundingTagId: 'sxap' }, PARTIES)).toBeUndefined()
  })

  it('names from the Party short name and the tag code', () => {
    expect(fallbackNameFor({ kind: 'hospital', holderPartyId: CES.id, fundingTagId: 'sxap' }, PARTIES, TAGS)).toBe('Christchurch Eye Surgery · SXAP · Fixed price')
  })
})

describe('the save guard on system Contracts (AR-58 validations 6 and 14)', () => {
  const { contracts } = ensureFallbacks(byId([mkContract({ id: 'stg-acc', holderId: STG.id, fundingTagId: 'acc' })]), PARTIES, TAGS, newId)
  const fallback = Object.values(contracts).find((c) => c.aaCode === 'STG-ACC-FIX')!
  const ctx: ContractRefusalContext = {
    prev: fallback,
    parties: PARTIES,
    contracts,
    surgeonIds: new Set(),
    anaesthetistIds: new Set(),
    specialtyIds: new Set(['gen']),
    rvgGroups: {},
    fundingTagIds: new Set(Object.keys(TAGS)),
  }

  it('a fallback accepts a rename and a new AA code', () => {
    expect(contractRefusal({ ...fallback, name: 'STG ACC other price', aaCode: 'STG-ACC-OTHER' }, ctx)).toBeNull()
  })

  it('refuses anything else, and a disable', () => {
    expect(contractRefusal({ ...fallback, specialtyIds: ['gen'] }, ctx)?.code).toBe('systemFixed')
    expect(contractRefusal({ ...fallback, fundingTagId: 'hnz' }, ctx)?.code).toBe('systemFixed')
    expect(contractRefusal({ ...fallback, status: 'disabled' }, ctx)?.code).toBe('systemNeverDisabled')
  })

  it('the office never creates kind open, nor a fallback; specialties and tags must exist', () => {
    const office: ContractRefusalContext = { ...ctx }
    delete office.prev
    const fresh = (o: Partial<Contract>) => mkContract({ id: 'new', aaCode: 'STG-009', holderId: STG.id, ...o })
    expect(contractRefusal(fresh({ pricing: { kind: 'open' } }), office)?.code).toBe('openNotChosen')
    expect(contractRefusal({ ...fallback, id: 'new', aaCode: 'STG-009' }, office)?.code).toBe('systemRoleNotChosen')
    expect(contractRefusal(fresh({ specialtyIds: ['nope'] }), office)?.code).toBe('specialtyUnknown')
    expect(contractRefusal(fresh({ fundingTagId: 'nope' }), office)?.code).toBe('fundingTagUnknown')
    expect(contractRefusal(fresh({ specialtyIds: ['gen'], fundingTagId: 'acc' }), office)).toBeNull()
  })
})
