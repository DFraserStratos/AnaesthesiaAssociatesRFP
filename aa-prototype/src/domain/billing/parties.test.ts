import { describe, expect, it } from 'vitest'
import {
  PARTY_REFUSAL_MESSAGES,
  partyRefusal,
  suggestCodePrefix,
  type Party,
  type PartyRefusalContext,
} from './parties'
import { mkParty } from './fixtures'

const AA: Party = { id: 'py-aa', kind: 'aa', name: 'Anaesthesia Associates', codePrefix: 'AA' }
const HOSPITALS = {
  'hosp-1': { locationType: 'hospital' as const },
  'hosp-rooms': { locationType: 'aaRooms' as const },
}

function ctx(overrides: Partial<PartyRefusalContext> = {}): PartyRefusalContext {
  return {
    parties: { [AA.id]: AA, 'party-hosp-1': mkParty() },
    hospitals: HOSPITALS,
    holdsContracts: false,
    billedByAContract: false,
    ...overrides,
  }
}

const bareInsurer: Party = { id: 'py-new', kind: 'insurer', name: 'Accuro', codePrefix: 'ACU' }

describe('partyRefusal', () => {
  it('passes a bare insurer or funder that no Contract bills (A43)', () => {
    expect(partyRefusal(bareInsurer, ctx())).toBeNull()
    expect(partyRefusal({ ...bareInsurer, kind: 'funder' }, ctx())).toBeNull()
  })

  it('refuses an edit of the AA Party and any second AA Party', () => {
    expect(partyRefusal({ ...AA, name: 'AA Ltd' }, ctx({ prev: AA }))?.code).toBe('aaReadOnly')
    expect(partyRefusal({ ...bareInsurer, kind: 'aa' }, ctx())?.code).toBe('oneAaParty')
  })

  it('a hospital Party names a hospital, never AA rooms; no other kind names one', () => {
    const hosp: Party = { id: 'py-h', kind: 'hospital', name: 'Rangiora', codePrefix: 'RDS' }
    const hospitals = { ...HOSPITALS, 'hosp-3': { locationType: 'hospital' as const } }
    expect(partyRefusal(hosp, ctx({ hospitals }))?.code).toBe('hospitalRequired')
    expect(partyRefusal({ ...hosp, hospitalId: 'hosp-rooms' }, ctx({ hospitals }))?.code).toBe('notAaRooms')
    expect(partyRefusal({ ...hosp, hospitalId: 'hosp-3' }, ctx({ hospitals }))).toBeNull()
    expect(partyRefusal({ ...bareInsurer, hospitalId: 'hosp-1' }, ctx())?.code).toBe('hospitalOnlyOnHospital')
  })

  it('needs a name and a unique 2 to 6 capital code prefix', () => {
    expect(partyRefusal({ ...bareInsurer, name: ' ' }, ctx())?.code).toBe('nameRequired')
    expect(partyRefusal({ ...bareInsurer, codePrefix: 'a1' }, ctx())?.code).toBe('codePrefixFormat')
    expect(partyRefusal({ ...bareInsurer, codePrefix: 'TOOLONGX' }, ctx())?.code).toBe('codePrefixFormat')
    expect(partyRefusal({ ...bareInsurer, codePrefix: 'TST' }, ctx())?.code).toBe('codePrefixTaken')
  })

  it("fixes a Party's kind while it holds Contracts", () => {
    const prev = mkParty({ id: 'py-g', kind: 'surgeonGroup', hospitalId: undefined, codePrefix: 'GRP' })
    const next = { ...prev, kind: 'surgeon' as const }
    expect(partyRefusal(next, ctx({ prev, holdsContracts: true }))?.code).toBe('kindFixedWhileHolding')
    expect(partyRefusal(next, ctx({ prev, holdsContracts: false }))).toBeNull()
  })

  it('once a Contract bills it: a billing name, a delivery method, and the contact that delivery needs', () => {
    const billed = ctx({ billedByAContract: true })
    expect(partyRefusal(bareInsurer, billed)?.code).toBe('billingNameRequired')
    const named = { ...bareInsurer, billingName: 'Accuro Health Insurance' }
    expect(partyRefusal(named, billed)?.code).toBe('deliveryRequired')
    expect(partyRefusal({ ...named, deliveryMethod: 'email' }, billed)?.code).toBe('emailRequired')
    expect(partyRefusal({ ...named, deliveryMethod: 'post' }, billed)?.code).toBe('postalAddressRequired')
    expect(partyRefusal({ ...named, deliveryMethod: 'email', email: 'claims@accuro.example' }, billed)).toBeNull()
    expect(partyRefusal({ ...named, deliveryMethod: 'post', postalAddress: 'PO Box 1, Wellington' }, billed)).toBeNull()
  })

  it('every refusal is one sentence with no dashes', () => {
    for (const message of Object.values(PARTY_REFUSAL_MESSAGES)) {
      expect(message).toMatch(/^[A-Z].*\.$/)
      expect(message).not.toMatch(/[–—]/)
    }
  })
})

describe('suggestCodePrefix', () => {
  it('uses initials, then the first word, then a free letter', () => {
    expect(suggestCodePrefix('Rangiora Day Surgery', new Set())).toBe('RDS')
    expect(suggestCodePrefix('Accuro', new Set())).toBe('ACCURO')
    expect(suggestCodePrefix('Rangiora Day Surgery', new Set(['RDS']))).toBe('RANGIO')
    const taken = new Set(['RDS', 'RANGIO', 'RAN'])
    expect(suggestCodePrefix('Rangiora Day Surgery', taken)).toMatch(/^[A-Z]{2,6}$/)
    expect(taken.has(suggestCodePrefix('Rangiora Day Surgery', taken))).toBe(false)
  })
})

describe('review-pass guards (catch-up Phase 18)', () => {
  it("one Party per hospital, and a hospital Party's hospital is fixed while it holds Contracts", () => {
    const second: Party = { id: 'py-h2', kind: 'hospital', name: 'Second', codePrefix: 'SEC', hospitalId: 'hosp-1' }
    expect(partyRefusal(second, ctx())?.code).toBe('oneHospitalParty')
    const prev = mkParty()
    const hospitals = { ...HOSPITALS, 'hosp-2': { locationType: 'hospital' as const } }
    expect(partyRefusal({ ...prev, hospitalId: 'hosp-2' }, ctx({ prev, hospitals, holdsContracts: true }))?.code).toBe('hospitalFixedWhileHolding')
    expect(partyRefusal({ ...prev, hospitalId: 'hosp-2' }, ctx({ prev, hospitals, holdsContracts: false }))).toBeNull()
  })

  it("keeps the kind of a Party that stands behind Bookings' counterparty, even holding no Contract", () => {
    const aia: Party = { id: 'py-aia', kind: 'insurer', name: 'AIA', codePrefix: 'AIA', billingIdentity: { kind: 'insurer', id: 'I-AIA' } }
    expect(partyRefusal({ ...aia, kind: 'funder' }, ctx({ prev: aia }))?.code).toBe('kindFixedWhileHolding')
  })

  it('suggestCodePrefix never returns a taken prefix, even when every one-letter suffix is used', () => {
    const taken = new Set(['RDS', 'RANGIO', 'RAN', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => `RDS${l}`)])
    const got = suggestCodePrefix('Rangiora Day Surgery', taken)
    expect(got).toMatch(/^[A-Z]{2,6}$/)
    expect(taken.has(got)).toBe(false)
  })
})
