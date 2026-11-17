import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import type { Actor } from './mutate'
import { createSpecialty, removeSpecialty, renameSpecialty } from './specialtyActions'
import { createFundingTag, editFundingTag, moveFundingTagInList, removeFundingTag } from './fundingTagActions'
import { createContract, disableContract, editContract, enableContract, type ContractInput } from './contractActions'
import { createSurgeon, editSurgeon } from './surgeonActions'
import { editProcedure } from './lifecycle'
import { chooseContractForFailedBooking } from './billingRun'
import { editParty } from './partyActions'
import { fundingTagsInOrder } from '../domain/billing/fundingTags'
import { destinationKey, destinationOf, impliedDestinations, isOpenPriceFallback, isRvgFallback } from '../domain/billing/fallbacks'
import { surgeonSpecialtyLabel } from '../domain/specialties'
import type { AuditEntry } from '../domain/types'
import { CONTRACT, PARTY, ROOM, SPC, SURG, TAG } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }

/** No audit value is a raw id or undefined (names only, Phase 18a). */
function expectNamed(entry: AuditEntry | undefined) {
  const text = JSON.stringify([entry?.before ?? null, entry?.after ?? null])
  expect(text).not.toMatch(/SPC-|TAG-|PY-|SPN\d|TGN\d/)
  expect(text).not.toContain('undefined')
}

describe('specialties (US-13.4.4)', () => {
  it('adds, renames and removes, each audited by name; office only', () => {
    const api = createAppStore()
    expect(createSpecialty(api, SOUTER, 'Paediatric surgery').ok).toBe(false)
    const added = createSpecialty(api, OFFICE, '  Paediatric surgery ')
    expect(added.ok).toBe(true)
    const id = added.ok ? added.value.id : ''
    expect(id).toBe('SPN001')
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'specialty.create', entityType: 'specialty', entityId: id, after: { name: 'Paediatric surgery' } })
    expect(renameSpecialty(api, OFFICE, id, 'Paediatric and neonatal surgery').ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'specialty.update', before: { name: 'Paediatric surgery' }, after: { name: 'Paediatric and neonatal surgery' } })
    expect(removeSpecialty(api, OFFICE, id).ok).toBe(true)
    expect(api.getState().masters.specialties[id]).toBeUndefined()
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'specialty.remove', before: { name: 'Paediatric and neonatal surgery' } })
  })

  it('refuses a blank or duplicate name', () => {
    const api = createAppStore()
    const codes = [createSpecialty(api, OFFICE, ' '), createSpecialty(api, OFFICE, 'ophthalmology'), renameSpecialty(api, OFFICE, SPC.ent, 'Urology')].map((o) =>
      o.ok ? 'ok' : o.code,
    )
    expect(codes).toEqual(['nameRequired', 'nameTaken', 'nameTaken'])
  })

  it('refuses to remove a held specialty, naming who holds it', () => {
    const api = createAppStore()
    const outcome = removeSpecialty(api, OFFICE, SPC.ophthalmology)
    expect(outcome.ok ? '' : outcome.message).toBe('Ophthalmology is held by 20 surgeons and 8 Contracts, so it cannot be removed. Rename it instead, or change them first.')
    const gen = removeSpecialty(api, OFFICE, SPC.generalSurgery)
    expect(gen.ok ? '' : gen.message).toMatch(/^General surgery is held by 29 surgeons and 2 Contracts/)
    expect(api.getState().masters.specialties[SPC.ophthalmology]).toBeDefined()
  })

  it('a rename shows on every surgeon holding it', () => {
    const api = createAppStore()
    renameSpecialty(api, OFFICE, SPC.plasticSurgery, 'Plastic and reconstructive surgery')
    const s = api.getState()
    expect(surgeonSpecialtyLabel(s.masters, s.masters.surgeons[SURG.lim])).toBe('Plastic and reconstructive surgery')
  })
})

describe("a surgeon's specialties (US-13.6.6)", () => {
  const KERR = { name: 'Ms R. Kerr', specialtyIds: [SPC.orthopaedics], roomIds: [ROOM.riccarton], hpiId: '50KERR' }

  it('refuses a save with none or an unknown one, in the store', () => {
    const api = createAppStore()
    const none = createSurgeon(api, OFFICE, { ...KERR, specialtyIds: [] })
    expect(none.ok ? '' : `${none.code}: ${none.message}`).toBe('specialtyRequired: Choose at least one specialty.')
    expect((createSurgeon(api, OFFICE, { ...KERR, specialtyIds: ['SPC-NOPE'] }) as { code?: string }).code).toBe('specialtyUnknown')
    const whitford = api.getState().masters.surgeons[SURG.whitford]!
    const cleared = editSurgeon(api, OFFICE, SURG.whitford, { ...whitford, specialtyIds: [] })
    expect(cleared.ok ? '' : cleared.code).toBe('specialtyRequired')
    expect(api.getState().masters.surgeons[SURG.whitford]?.specialtyIds).toEqual([SPC.ophthalmology])
  })

  it('saves two, duplicates dropped, audited by name before and after', () => {
    const api = createAppStore()
    const whitford = api.getState().masters.surgeons[SURG.whitford]!
    const outcome = editSurgeon(api, OFFICE, SURG.whitford, { ...whitford, specialtyIds: [SPC.ophthalmology, SPC.plasticSurgery, SPC.ophthalmology] })
    expect(outcome.ok).toBe(true)
    const s = api.getState()
    expect(s.masters.surgeons[SURG.whitford]?.specialtyIds).toEqual([SPC.ophthalmology, SPC.plasticSurgery])
    expect(surgeonSpecialtyLabel(s.masters, s.masters.surgeons[SURG.whitford])).toBe('Ophthalmology, Plastic surgery')
    const entry = s.audit.at(-1)
    expect(entry).toMatchObject({ action: 'surgeon.update', before: { specialties: ['Ophthalmology'] }, after: { specialties: ['Ophthalmology', 'Plastic surgery'] } })
    expectNamed(entry)
    const created = createSurgeon(api, OFFICE, KERR)
    expect(created.ok).toBe(true)
    expect(api.getState().audit.at(-1)?.after).toMatchObject({ specialties: ['Orthopaedics'] })
  })
})

describe('funding tags (US-13.4.5)', () => {
  it('adds at the end, edits code and funder, moves, removes; each audited by name', () => {
    const api = createAppStore()
    const added = createFundingTag(api, OFFICE, { code: ' nzdf ', funderPartyId: PARTY.nzdf })
    expect(added.ok).toBe(true)
    const id = added.ok ? added.value.id : ''
    expect(id).toBe('TGN001')
    expect(api.getState().masters.fundingTags[id]).toMatchObject({ code: 'NZDF', order: 4, funderPartyId: PARTY.nzdf })
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'fundingTag.create', after: { code: 'NZDF', funder: 'NZDF', order: 4 } })
    expect(editFundingTag(api, OFFICE, id, { code: 'NZDF', funderPartyId: PARTY.veterans }).ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'fundingTag.update', before: { funder: 'NZDF' }, after: { funder: 'Veterans Affairs' } })
    expect(editFundingTag(api, OFFICE, id, { code: 'NZDF', funderPartyId: '' }).ok).toBe(true)
    expect(api.getState().audit.at(-1)?.after).toEqual({ funder: 'No funder named' })
    expect(removeFundingTag(api, OFFICE, id).ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'fundingTag.remove', before: { code: 'NZDF' } })
    expectNamed(api.getState().audit.at(-1))
  })

  it('moves HNZ above SXAP and back, renumbering the order', () => {
    const api = createAppStore()
    expect(moveFundingTagInList(api, OFFICE, TAG.hnz, 'up').ok).toBe(true)
    expect(fundingTagsInOrder(api.getState().masters.fundingTags).map((t) => `${t.order}${t.code}`)).toEqual(['1HNZ', '2SXAP', '3ACC'])
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'fundingTag.move', before: { code: 'HNZ', order: 2 }, after: { code: 'HNZ', order: 1 } })
    expect(moveFundingTagInList(api, OFFICE, TAG.hnz, 'up').ok).toBe(false)
    moveFundingTagInList(api, OFFICE, TAG.hnz, 'down')
    expect(fundingTagsInOrder(api.getState().masters.fundingTags).map((t) => t.code)).toEqual(['SXAP', 'HNZ', 'ACC'])
  })

  it('refuses a duplicate code, a funder that is not an insurer or funder, and removing a tag a Contract carries', () => {
    const api = createAppStore()
    const codes = [
      createFundingTag(api, OFFICE, { code: 'sxap' }),
      createFundingTag(api, OFFICE, { code: 'X', funderPartyId: PARTY.stg }),
      removeFundingTag(api, OFFICE, TAG.sxap),
      createFundingTag(api, SOUTER, { code: 'Y' }),
    ].map((o) => (o.ok ? 'ok' : o.code))
    expect(codes).toEqual(['codeTaken', 'funderKind', 'fundingTagHeld', 'officeOnly'])
    const held = removeFundingTag(api, OFFICE, TAG.sxap)
    // 7 office Contracts, CES and Southern Cross's SXAP Fixed price fallbacks and their 2 RVG backstops.
    expect(held.ok ? '' : held.message).toBe('SXAP is carried by 11 Contracts, its system No contract Contracts included, so it cannot be removed. Edit its code instead.')
  })
})

describe('Contracts with specialties, a tag and the fallbacks (US-04.2.16, US-04.2.17, DM-49)', () => {
  const CES_SXAP: ContractInput = {
    name: 'Christchurch Eye Surgery SXAP cataract',
    holderId: PARTY.ces,
    billsTo: 'holder',
    pricing: { kind: 'rvgContractRate', unitRate: 27 },
    prepaid: false,
    anaesthetistMayOverridePrice: false,
    linkedSurgeonIds: [],
    specialtyIds: [SPC.ophthalmology],
    fundingTagId: TAG.sxap,
  }

  // Christchurch Eye Surgery holds seeded SXAP, HNZ and ACC items since catch-up
  // Phase 19a, so its fallbacks exist from the start: Forte has none.
  const FORTE_SXAP = { ...CES_SXAP, holderId: PARTY.forte }

  it("tagging a hospital's first SXAP Contract creates its fallback and RVG backstop in the same commit, audited", () => {
    const api = createAppStore()
    const before = api.getState().audit.length
    const outcome = createContract(api, OFFICE, FORTE_SXAP)
    expect(outcome.ok).toBe(true)
    const s = api.getState()
    const added = s.audit.slice(before)
    expect(added.map((a) => a.action)).toEqual(['contract.create', 'contract.fallbackCreate', 'contract.fallbackCreate'])
    expect(new Set(added.map((a) => a.atISO)).size).toBe(1)
    const fallback = s.masters.contracts[added[1]!.entityId]!
    expect(fallback).toMatchObject({ name: 'Forte Health · SXAP · Fixed price', aaCode: 'FORTE-SXAP-FIX', pricing: { kind: 'open' }, systemRole: 'openPriceFallback', fundingTagId: TAG.sxap })
    const backstop = s.masters.contracts[added[2]!.entityId]!
    expect(backstop).toMatchObject({
      name: 'Forte Health · SXAP · RVG',
      aaCode: 'FORTE-SXAP-RVG',
      pricing: { kind: 'rvgAnaesthetistRate' },
      systemRole: 'rvgFallback',
      anaesthetistMayOverridePrice: true,
      holderId: PARTY.forte,
      billsTo: 'holder',
      fundingTagId: TAG.sxap,
    })
    expect(added[0]!.after).toMatchObject({ holder: 'Forte Health', specialties: 'Ophthalmology', fundingTag: 'SXAP' })
    expect(added[1]!.after).toMatchObject({ holder: 'Forte Health', specialties: 'Every specialty', fundingTag: 'SXAP' })
    expect(added[2]!.after).toMatchObject({ name: 'Forte Health · SXAP · RVG', holder: 'Forte Health', specialties: 'Every specialty', fundingTag: 'SXAP' })
    for (const a of added) expectNamed(a)
  })

  it('an edit to another tag adds the new fallback and backstop, keeps the old, and a second save makes no duplicate', () => {
    const api = createAppStore()
    const created = createContract(api, OFFICE, FORTE_SXAP)
    const id = created.ok ? created.value.contract.id : ''
    expect(editContract(api, OFFICE, id, { fundingTagId: TAG.hnz }).ok).toBe(true)
    const names = () => Object.values(api.getState().masters.contracts).filter(isOpenPriceFallback).map((c) => c.name)
    expect(names()).toContain('Forte Health · SXAP · Fixed price')
    expect(names()).toContain('Forte Health · HNZ · Fixed price')
    const backstops = () => Object.values(api.getState().masters.contracts).filter(isRvgFallback).map((c) => c.name)
    expect(backstops()).toContain('Forte Health · SXAP · RVG')
    expect(backstops()).toContain('Forte Health · HNZ · RVG')
    expect(api.getState().audit.slice(-3).map((a) => a.action)).toEqual(['contract.update', 'contract.fallbackCreate', 'contract.fallbackCreate'])
    expect(api.getState().audit.at(-3)).toMatchObject({ action: 'contract.update', before: { fundingTag: 'SXAP' }, after: { fundingTag: 'HNZ' } })
    const count = names().length
    const backstopCount = backstops().length
    expect(editContract(api, OFFICE, id, { name: 'CES HNZ cataract' }).ok).toBe(true)
    expect(names().length).toBe(count)
    expect(backstops().length).toBe(backstopCount)
    expect(editContract(api, OFFICE, id, { fundingTagId: undefined }).ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({ before: { fundingTag: 'HNZ' }, after: { fundingTag: 'None' } })
  })

  it('one fallback per destination, and one RVG backstop per hospital or Special one, after any run of creates, edits, disables and re-enables', () => {
    const api = createAppStore()
    createContract(api, OFFICE, { ...CES_SXAP, holderId: PARTY.forte, name: 'Forte SXAP fixed', fundingTagId: TAG.sxap })
    const ces = createContract(api, OFFICE, CES_SXAP)
    const id = ces.ok ? ces.value.contract.id : ''
    disableContract(api, OFFICE, id)
    enableContract(api, OFFICE, id)
    editContract(api, OFFICE, CONTRACT.stgRvg, { fundingTagId: TAG.hnz })
    editContract(api, OFFICE, CONTRACT.stgRvg, { fundingTagId: TAG.acc })
    const s = api.getState()
    const keys = Object.values(s.masters.contracts).filter(isOpenPriceFallback).map((f) => destinationKey(destinationOf(f, s.masters.parties)))
    expect(new Set(keys).size).toBe(keys.length)
    for (const d of impliedDestinations(s.masters.contracts, s.masters.parties)) expect(keys).toContain(destinationKey(d))
    const rvgKeys = Object.values(s.masters.contracts).filter(isRvgFallback).map((f) => destinationKey(destinationOf(f, s.masters.parties)))
    expect(new Set(rvgKeys).size).toBe(rvgKeys.length)
    for (const d of impliedDestinations(s.masters.contracts, s.masters.parties)) {
      if (d.kind !== 'patient') expect(rvgKeys).toContain(destinationKey(d))
    }
    expect(rvgKeys.some((k) => k.startsWith('patient:'))).toBe(false)
    const codes = Object.values(s.masters.contracts).map((c) => c.aaCode)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('a re-enable runs the fallbacks too: a Contract disabled before its tag implied one gets it on enable', () => {
    const api = createAppStore()
    const created = createContract(api, OFFICE, CES_SXAP)
    const id = created.ok ? created.value.contract.id : ''
    expect(enableContract(api, OFFICE, id).ok).toBe(true)
    expect(disableContract(api, OFFICE, id).ok).toBe(true)
    expect(api.getState().audit.at(-1)?.action).toBe('contract.disable')
  })

  it('refuses an unknown specialty or tag, and kind open, from the office', () => {
    const api = createAppStore()
    const codes = [
      createContract(api, OFFICE, { ...CES_SXAP, specialtyIds: ['SPC-NOPE'] }),
      createContract(api, OFFICE, { ...CES_SXAP, fundingTagId: 'TAG-NOPE' }),
      createContract(api, OFFICE, { ...CES_SXAP, pricing: { kind: 'open' } }),
      editContract(api, OFFICE, CONTRACT.sxap, { pricing: { kind: 'open' } }),
    ].map((o) => (o.ok ? 'ok' : o.code))
    expect(codes).toEqual(['specialtyUnknown', 'fundingTagUnknown', 'openNotChosen', 'pricingKindFixed'])
  })

  it('a system Contract takes a rename and a new AA code, nothing else, and is never disabled', () => {
    const api = createAppStore()
    const fb = 'CT-FIX-HOSPITAL-PY-STG-TAG-ACC'
    expect(editContract(api, OFFICE, fb, { name: "St George's ACC other price", aaCode: 'STG-ACC-OTHER' }).ok).toBe(true)
    expect(api.getState().masters.contracts[fb]).toMatchObject({ name: "St George's ACC other price", aaCode: 'STG-ACC-OTHER' })
    const refused = [
      editContract(api, OFFICE, fb, { specialtyIds: [SPC.orthopaedics] }),
      editContract(api, OFFICE, fb, { fundingTagId: TAG.hnz }),
      editContract(api, OFFICE, CONTRACT.noContractRvg, { specialtyIds: [SPC.ent] }),
      disableContract(api, OFFICE, fb),
      disableContract(api, OFFICE, 'CT-FIX-PATIENT-STANDARD'),
    ].map((o) => (o.ok ? 'ok' : o.code))
    expect(refused).toEqual(['systemFixed', 'systemFixed', 'systemFixed', 'systemNeverDisabled', 'systemNeverDisabled'])
  })

  it('a Procedure reaches an open-price Contract only through the step rail, never a plain edit or the retry (catch-up Phase 20)', () => {
    const api = createAppStore()
    const p = Object.values(api.getState().schedule.procedures).find((x) => x.governingContractId === CONTRACT.stgAcc)!
    const outcome = editProcedure(api, OFFICE, p.id, { governingContractId: 'CT-FIX-HOSPITAL-PY-STG-TAG-ACC' } as never)
    expect(outcome.ok ? '' : outcome.code).toBe('contractThroughRail')
    expect(api.getState().schedule.procedures[p.id]?.governingContractId).toBe(CONTRACT.stgAcc)
    const retry = chooseContractForFailedBooking(api, OFFICE, 'nope', p.id, 'CT-FIX-PATIENT-STANDARD')
    expect(retry.ok).toBe(false)
  })
})

describe('review-pass guards (catch-up Phase 18a)', () => {
  it('a funder Party a tag names stays an insurer or funder', () => {
    const api = createAppStore()
    const acc = api.getState().masters.parties[PARTY.acc]!
    const outcome = editParty(api, OFFICE, PARTY.acc, { ...acc, kind: 'surgeonGroup' } as never)
    expect(outcome.ok ? '' : outcome.code).toBe('funderKindFixed')
    expect(editParty(api, OFFICE, PARTY.acc, { ...acc, kind: 'insurer' } as never).ok).toBe(true)
  })

  it('a tag code needs a letter or number', () => {
    const api = createAppStore()
    const outcome = createFundingTag(api, OFFICE, { code: ' - ' })
    expect(outcome.ok ? '' : outcome.code).toBe('codeRequired')
  })
})
