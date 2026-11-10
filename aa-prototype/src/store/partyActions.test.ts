import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import type { Actor } from './mutate'
import { createParty, editParty, partyContractFacts, type PartyFields } from './partyActions'
import { partyRefusal, PARTY_REFUSAL_MESSAGES } from '../domain/billing/parties'
import { HOSP, PARTY } from '../domain/seed'
import type { Party } from '../domain/types'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }

function fieldsOf(p: Party): PartyFields {
  if (p.kind === 'aa') throw new Error('not editable')
  return {
    kind: p.kind,
    name: p.name,
    codePrefix: p.codePrefix,
    ...(p.billingName !== undefined ? { billingName: p.billingName } : {}),
    ...(p.email !== undefined ? { email: p.email } : {}),
    ...(p.postalAddress !== undefined ? { postalAddress: p.postalAddress } : {}),
    ...(p.deliveryMethod !== undefined ? { deliveryMethod: p.deliveryMethod } : {}),
    ...(p.hospitalId !== undefined ? { hospitalId: p.hospitalId } : {}),
  }
}

describe('seeded Parties', () => {
  it('break none of their own guards, with exactly one AA Party', () => {
    const state = createAppStore().getState()
    const parties = Object.values(state.masters.parties)
    expect(parties.filter((p) => p.kind === 'aa')).toHaveLength(1)
    for (const p of parties) {
      if (p.kind === 'aa') continue
      expect(partyRefusal(p, { prev: p, parties: state.masters.parties, hospitals: state.masters.hospitals, ...partyContractFacts(state, p.id) }), p.id).toBeNull()
    }
  })

  it('every hospital except AA rooms has its Party; nib delivers by email (no portal value)', () => {
    const state = createAppStore().getState()
    const hospitalParties = Object.values(state.masters.parties).filter((p) => p.kind === 'hospital')
    const covered = new Set(hospitalParties.map((p) => p.hospitalId))
    for (const h of Object.values(state.masters.hospitals)) {
      expect(covered.has(h.id), h.id).toBe(h.locationType === 'hospital')
    }
    expect(state.masters.parties[PARTY.nib]).toMatchObject({ kind: 'insurer', deliveryMethod: 'email' })
    expect(['ACC', 'Health NZ', 'NZDF', 'Veterans Affairs'].map((n) => Object.values(state.masters.parties).find((p) => p.name === n)?.kind)).toEqual(['funder', 'funder', 'funder', 'funder'])
  })
})

describe('createParty', () => {
  it('adds a bare insurer or funder with no billing details, audited, and creates no Contract', () => {
    const api = createAppStore()
    const contractsBefore = Object.keys(api.getState().masters.contracts).length
    const outcome = createParty(api, OFFICE, { kind: 'insurer', name: 'Accuro', codePrefix: 'acu' })
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const party = outcome.value.party
    expect(party).toMatchObject({ id: 'PYN001', kind: 'insurer', codePrefix: 'ACU' })
    expect(createParty(api, OFFICE, { kind: 'funder', name: 'Pharmac', codePrefix: 'PHA' }).ok).toBe(true)
    const state = api.getState()
    expect(Object.keys(state.masters.contracts)).toHaveLength(contractsBefore)
    const entry = state.audit.find((a) => a.action === 'party.create' && a.entityId === party.id)
    expect(entry?.after).toMatchObject({ name: 'Accuro', kind: 'insurer' })
  })

  it('refuses a hospital Party without its hospital, a taken prefix, and anyone but the office', () => {
    const api = createAppStore()
    expect(createParty(api, OFFICE, { kind: 'hospital', name: 'Rangiora', codePrefix: 'RDS' })).toMatchObject({ ok: false, code: 'hospitalRequired' })
    expect(createParty(api, OFFICE, { kind: 'hospital', name: 'Rooms', codePrefix: 'RMS', hospitalId: HOSP.aaRooms })).toMatchObject({ ok: false, code: 'notAaRooms' })
    expect(createParty(api, OFFICE, { kind: 'insurer', name: 'Copy', codePrefix: 'NIB' })).toMatchObject({ ok: false, code: 'codePrefixTaken' })
    expect(createParty(api, SOUTER, { kind: 'insurer', name: 'Accuro', codePrefix: 'ACU' })).toMatchObject({ ok: false, code: 'officeOnly' })
  })
})

describe('editParty', () => {
  it('edits in place with the values before and after, keeping the interim counterparty', () => {
    const api = createAppStore()
    const nib = api.getState().masters.parties[PARTY.nib]!
    expect(editParty(api, OFFICE, PARTY.nib, { ...fieldsOf(nib), email: 'accounts@nib.example' }).ok).toBe(true)
    const state = api.getState()
    expect(state.masters.parties[PARTY.nib]).toMatchObject({ email: 'accounts@nib.example', legacyCounterparty: nib.legacyCounterparty })
    const entry = state.audit.at(-1)
    expect(entry).toMatchObject({ action: 'party.update', entityId: PARTY.nib, before: { email: nib.email }, after: { email: 'accounts@nib.example' } })
  })

  it('refuses a billed Party saved without its billing name, or email delivery with no email (A43)', () => {
    const api = createAppStore()
    const stg = api.getState().masters.parties[PARTY.stg]!
    expect(editParty(api, OFFICE, PARTY.stg, { ...fieldsOf(stg), billingName: '' })).toMatchObject({ ok: false, message: PARTY_REFUSAL_MESSAGES.billingNameRequired })
    expect(editParty(api, OFFICE, PARTY.stg, { ...fieldsOf(stg), email: '' })).toMatchObject({ ok: false, code: 'emailRequired' })
  })

  it('a Party no Contract bills saves without billing details', () => {
    const api = createAppStore()
    const acc = api.getState().masters.parties[PARTY.acc]!
    expect(editParty(api, OFFICE, PARTY.acc, { ...fieldsOf(acc), name: 'ACC (Accident Compensation Corporation)' }).ok).toBe(true)
  })

  it('the AA Party is read-only and a holding Party keeps its kind', () => {
    const api = createAppStore()
    expect(editParty(api, OFFICE, PARTY.aa, { kind: 'funder', name: 'AA', codePrefix: 'AA' })).toMatchObject({ ok: false, code: 'aaReadOnly' })
    const cos = api.getState().masters.parties[PARTY.cos]!
    expect(editParty(api, OFFICE, PARTY.cos, { ...fieldsOf(cos), kind: 'surgeon' })).toMatchObject({ ok: false, code: 'kindFixedWhileHolding' })
  })
})

describe('review-pass fixes (catch-up Phase 18)', () => {
  it("refuses a second Party for St George's and re-pointing a holding hospital Party", () => {
    const api = createAppStore()
    expect(createParty(api, OFFICE, { kind: 'hospital', name: 'STG again', codePrefix: 'STGA', hospitalId: HOSP.stg })).toMatchObject({ ok: false, code: 'oneHospitalParty' })
    const stg = api.getState().masters.parties[PARTY.stg]!
    expect(editParty(api, OFFICE, PARTY.stg, { ...fieldsOf(stg), hospitalId: HOSP.forte })).toMatchObject({ ok: false })
  })

  it("keeps AIA an insurer: it is the billing record behind Bookings' insurer", () => {
    const api = createAppStore()
    const aia = api.getState().masters.parties[PARTY.aia]!
    expect(editParty(api, OFFICE, PARTY.aia, { ...fieldsOf(aia), kind: 'funder' })).toMatchObject({ ok: false, code: 'kindFixedWhileHolding' })
  })
})
