import { describe, expect, it } from 'vitest'
import {
  contractChoosableForProcedure,
  destinationHint,
  destinationKey,
  destinationOf,
  ensureFallbacks,
  fallbackNameFor,
  findFallback,
  findRvgFallback,
  isOfficeContract,
  isOpenPriceFallback,
  isRvgFallback,
  rvgFallbackNameFor,
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

  it('makes the two Patient fallbacks and, per hospital and tag and per Special holder, a Fixed price one and an RVG backstop', () => {
    const { created } = ensureFallbacks(byId(office), PARTIES, TAGS, newId)
    expect(created.map((c) => [c.name, c.aaCode]).sort()).toEqual(
      [
        ['Canterbury Orthopaedic Surgeons · Fixed price', 'COS-FIX'],
        ['Canterbury Orthopaedic Surgeons · RVG', 'COS-RVG'],
        ['No contract · Fixed price', 'AA-FIX'],
        ['Prepaid · Fixed price', 'AA-PRE'],
        ["St George's · ACC · Fixed price", 'STG-ACC-FIX'],
        ["St George's · ACC · RVG", 'STG-ACC-RVG'],
        ["St George's · Fixed price", 'STG-FIX'],
        ["St George's · RVG", 'STG-RVG'],
        ['nib · Fixed price', 'NIB-FIX'],
        ['nib · RVG', 'NIB-RVG'],
      ].sort(),
    )
  })

  it('each open-price fallback is kind open, system, Active, with no specialties or links; the tag only on a hospital one', () => {
    const { created } = ensureFallbacks(byId(office), PARTIES, TAGS, newId)
    const open = created.filter(isOpenPriceFallback)
    expect(open).toHaveLength(6)
    for (const f of open) {
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
    expect(created.map((c) => c.name)).toEqual(["St George's · HNZ · Fixed price", "St George's · HNZ · RVG"])
    expect(Object.values(contracts).some((c) => c.name === "St George's · ACC · Fixed price")).toBe(true)
    expect(Object.values(contracts).some((c) => c.name === "St George's · ACC · RVG")).toBe(true)
  })

  it('a Disabled Contract implies no destination; the Patient ones always exist', () => {
    const disabled = [mkContract({ id: 'ces-sxap', holderId: CES.id, fundingTagId: 'sxap', status: 'disabled' })]
    const { created } = ensureFallbacks(byId(disabled), PARTIES, TAGS, newId)
    expect(created.map((c) => c.aaCode).sort()).toEqual(['AA-FIX', 'AA-PRE'])
  })

  it('a fallback implies nothing of its own, and codes stay unique when the stem is taken', () => {
    const taken = [...office, mkContract({ id: 'x', aaCode: 'NIB-FIX', holderId: NIB.id, name: 'Something else' })]
    const { created } = ensureFallbacks(byId(taken), PARTIES, TAGS, newId)
    expect(created.find((c) => c.holderId === NIB.id && isOpenPriceFallback(c))?.aaCode).toBe('NIB-FIX-2')
    expect(created.find((c) => c.holderId === NIB.id && isRvgFallback(c))?.aaCode).toBe('NIB-RVG')
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

describe('the RVG backstops (owner review, 2026-11-16)', () => {
  const office = [
    mkContract({ id: 'stg-acc', aaCode: 'STG-002', holderId: STG.id, fundingTagId: 'acc' }),
    mkContract({ id: 'cos-acc', aaCode: 'COS-001', holderId: GROUP.id, fundingTagId: 'acc', linkedSurgeonIds: ['s1'] }),
    mkContract({ id: 'doyle', aaCode: 'DOYLE-001', holderId: GROUP.id, billsTo: 'payer' }),
    mkContract({ id: 'pre', aaCode: 'AA-009', holderId: AA.id, billsTo: 'payer', prepaid: true }),
  ]
  const seedIds = (_d: unknown, key: string, kind: 'open' | 'rvg') => seedFallbackId(key, kind)

  it('makes one per hospital tag and Special holder only, never a Patient one', () => {
    const { created } = ensureFallbacks(byId(office), PARTIES, TAGS, seedIds)
    const rvg = created.filter(isRvgFallback)
    expect(rvg.map((c) => [c.id, c.name, c.aaCode]).sort()).toEqual(
      [
        ['CT-RVG-HOSPITAL-PY-STG-ACC', "St George's · ACC · RVG", 'STG-ACC-RVG'],
        ['CT-RVG-SPECIAL-PY-COS', 'Canterbury Orthopaedic Surgeons · RVG', 'COS-RVG'],
      ].sort(),
    )
    expect(rvg.some((c) => c.billsTo === 'payer' || c.prepaid)).toBe(false)
    // Destinations in key order; per destination the open one first, then its backstop.
    expect(created.map((c) => c.id)).toEqual([
      'CT-FIX-HOSPITAL-PY-STG-ACC',
      'CT-RVG-HOSPITAL-PY-STG-ACC',
      'CT-FIX-PATIENT-PREPAID',
      'CT-FIX-PATIENT-STANDARD',
      'CT-FIX-SPECIAL-PY-COS',
      'CT-RVG-SPECIAL-PY-COS',
    ])
  })

  it("mirrors its destination's Fixed price fallback, priced from RVG units at the anaesthetist's rate", () => {
    const { contracts } = ensureFallbacks(byId(office), PARTIES, TAGS, seedIds)
    const fix = contracts['CT-FIX-HOSPITAL-PY-STG-ACC']!
    const rvg = contracts['CT-RVG-HOSPITAL-PY-STG-ACC']!
    expect(rvg).toEqual({
      ...fix,
      id: 'CT-RVG-HOSPITAL-PY-STG-ACC',
      name: "St George's · ACC · RVG",
      aaCode: 'STG-ACC-RVG',
      pricing: { kind: 'rvgAnaesthetistRate' },
      anaesthetistMayOverridePrice: true,
      systemRole: 'rvgFallback',
    })
    expect(rvg).toMatchObject({ holderId: STG.id, billsTo: 'holder', fundingTagId: 'acc', prepaid: false, status: 'active', specialtyIds: [], linkedSurgeonIds: [] })
    expect(contracts['CT-RVG-SPECIAL-PY-COS']).toMatchObject({ holderId: GROUP.id, billsTo: 'holder', prepaid: false, pricing: { kind: 'rvgAnaesthetistRate' }, systemRole: 'rvgFallback' })
    expect(contracts['CT-RVG-SPECIAL-PY-COS']?.fundingTagId).toBeUndefined()
    expect(isOpenPriceFallback(rvg)).toBe(false)
    expect(isOfficeContract(rvg)).toBe(false)
    expect(isOfficeContract(fix)).toBe(false)
    expect(isOfficeContract(contracts['stg-acc']!)).toBe(true)
    // Unlike the open-price fallback, the backstop carries a price of its own, so a Procedure may sit on it.
    expect(contractChoosableForProcedure(rvg)).toBe(true)
  })

  it('a backstop implies no destination of its own, and a second run creates none', () => {
    const first = ensureFallbacks(byId(office), PARTIES, TAGS, seedIds)
    const second = ensureFallbacks(first.contracts, PARTIES, TAGS, seedIds)
    expect(second.created).toEqual([])
    expect(second.contracts).toEqual(first.contracts)
  })

  it('a destination with its Fixed price fallback but no backstop gets only the backstop', () => {
    const first = ensureFallbacks(byId(office), PARTIES, TAGS, seedIds).contracts
    const missing = { ...first }
    delete missing['CT-RVG-SPECIAL-PY-COS']
    const { created } = ensureFallbacks(missing, PARTIES, TAGS, seedIds)
    expect(created.map((c) => [c.id, c.aaCode])).toEqual([['CT-RVG-SPECIAL-PY-COS', 'COS-RVG']])
  })

  it('findRvgFallback: the backstop per hospital or Special destination, No contract · RVG for Patient › Standard, none for Prepaid', () => {
    const noContract = mkContract({ id: 'CT-NO-CONTRACT', aaCode: 'AA-RVG', holderId: AA.id, billsTo: 'payer', pricing: { kind: 'rvgAnaesthetistRate' }, systemRole: 'noContractRvg' })
    const { contracts } = ensureFallbacks(byId([...office, noContract]), PARTIES, TAGS, seedIds)
    expect(findRvgFallback(contracts, { kind: 'hospital', holderPartyId: STG.id, fundingTagId: 'acc' }, PARTIES)?.id).toBe('CT-RVG-HOSPITAL-PY-STG-ACC')
    expect(findRvgFallback(contracts, { kind: 'special', holderPartyId: GROUP.id }, PARTIES)?.id).toBe('CT-RVG-SPECIAL-PY-COS')
    expect(findRvgFallback(contracts, { kind: 'patient', prepaid: false }, PARTIES)?.id).toBe('CT-NO-CONTRACT')
    expect(findRvgFallback(contracts, { kind: 'patient', prepaid: true }, PARTIES)).toBeUndefined()
    expect(findRvgFallback(contracts, { kind: 'special', holderPartyId: NIB.id }, PARTIES)).toBeUndefined()
    // findFallback still finds the open one, never the backstop.
    expect(findFallback(contracts, { kind: 'hospital', holderPartyId: STG.id, fundingTagId: 'acc' }, PARTIES)?.id).toBe('CT-FIX-HOSPITAL-PY-STG-ACC')
  })

  it('names and seed ids', () => {
    expect(rvgFallbackNameFor({ kind: 'hospital', holderPartyId: CES.id, fundingTagId: 'sxap' }, PARTIES, TAGS)).toBe('Christchurch Eye Surgery · SXAP · RVG')
    expect(rvgFallbackNameFor({ kind: 'special', holderPartyId: NIB.id }, PARTIES, TAGS)).toBe('nib · RVG')
    expect(seedFallbackId('hospital:PY-STG:TAG-ACC', 'rvg')).toBe('CT-RVG-HOSPITAL-PY-STG-TAG-ACC')
    expect(seedFallbackId('hospital:PY-STG:TAG-ACC', 'open')).toBe('CT-FIX-HOSPITAL-PY-STG-TAG-ACC')
  })

  it('the save guard accepts a seeded backstop unchanged and refuses anything but a rename or new AA code', () => {
    const { contracts } = ensureFallbacks(byId(office), PARTIES, TAGS, seedIds)
    const rvg = contracts['CT-RVG-HOSPITAL-PY-STG-ACC']!
    const ctx: ContractRefusalContext = {
      prev: rvg,
      parties: PARTIES,
      contracts,
      surgeonIds: new Set(['s1']),
      anaesthetistIds: new Set(),
      specialtyIds: new Set(['gen']),
      rvgGroups: {},
      fundingTagIds: new Set(Object.keys(TAGS)),
    }
    expect(contractRefusal(rvg, ctx)).toBeNull()
    expect(contractRefusal({ ...rvg, name: 'STG ACC RVG', aaCode: 'STG-ACC-R' }, ctx)).toBeNull()
    expect(contractRefusal({ ...rvg, anaesthetistMayOverridePrice: false }, ctx)?.code).toBe('systemFixed')
    expect(contractRefusal({ ...rvg, status: 'disabled' }, ctx)?.code).toBe('systemNeverDisabled')
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
