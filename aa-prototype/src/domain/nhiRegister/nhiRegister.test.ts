import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateNhi } from '../nhi'
import { buildPatients, PAT, PAT_REVIEW } from '../seed/patients'
import { SEED } from '../seed'
import {
  NHI_NOT_ON_REGISTER,
  NHI_REGISTER_ONLY,
  NHI_REGISTER_POOL_COUNT,
  NHI_REGISTER_RESERVED,
  NHI_REGISTER_UPDATES,
  nhiRegister,
} from '../seed/nhiRegister'
import type { Patient } from '../types'
import { applyRegisterRefresh, buildNhiRegister, lookupOnRegister, registerDifferences } from '.'

function build() {
  return buildNhiRegister({
    seed: SEED,
    seededPatients: buildPatients(SEED),
    registerOnly: NHI_REGISTER_ONLY,
    updates: NHI_REGISTER_UPDATES,
    poolCount: NHI_REGISTER_POOL_COUNT,
    reserved: NHI_REGISTER_RESERVED,
  })
}

const patients = buildPatients(SEED)
const byId = (id: string): Patient => {
  const p = patients.find((x) => x.hiddenInternalId === id)
  if (p === undefined) throw new Error(id)
  return p
}

describe('the synthetic NHI register (catch-up Phase 40a)', () => {
  it('is deterministic: two builds deep-equal', () => {
    expect([...build().entries()]).toEqual([...build().entries()])
  })

  it('moves no existing seed draw', () => {
    const before = buildPatients(SEED)
    build()
    expect(buildPatients(SEED)).toEqual(before)
  })

  it('holds every mirrored patient, the four register-only people and the pool', () => {
    const mirrored = new Set(patients.map((p) => p.nhi)).size
    expect(nhiRegister().size).toBe(mirrored + 4 + NHI_REGISTER_POOL_COUNT)
  })

  it('every NHI is valid, keyed by itself, with its format', () => {
    for (const [nhi, person] of nhiRegister()) {
      const verdict = validateNhi(nhi)
      expect(verdict.valid, nhi).toBe(true)
      expect(person.nhi).toBe(nhi)
      expect(person.format).toBe(verdict.format)
    }
  })

  it('has new-format people in the pool', () => {
    expect([...nhiRegister().values()].filter((p) => p.format === 'new').length).toBeGreaterThan(20)
  })

  it('mirrors every seeded patient exactly, except the two the register updates', () => {
    for (const p of patients) {
      const person = nhiRegister().get(p.nhi)
      expect(person, p.nhi).toBeDefined()
      if (p.nhi in NHI_REGISTER_UPDATES) continue
      expect(registerDifferences(p, person!)).toEqual({ differences: [], enrichments: [] })
    }
    expect(Object.keys(NHI_REGISTER_UPDATES).sort()).toEqual(['ZAM1098', 'ZAQ4425'])
  })

  it("Kevin Doherty's record lacks an address, so the register's is an enrichment", () => {
    const kevin = byId(PAT_REVIEW.contactMissing)
    expect(kevin.postalAddress).toBeUndefined()
    expect(registerDifferences(kevin, nhiRegister().get('ZAQ4425')!)).toEqual({
      differences: [],
      enrichments: [{ field: 'address', onRegister: '41 Harewood Road, Papanui, Christchurch 8053' }],
    })
  })

  it("carries Fiona Gray's married name and new address", () => {
    expect(nhiRegister().get('ZAM1098')).toMatchObject({ name: 'Fiona Tamihana', postalAddress: { line1: '5 Kowhai Lane', suburb: 'Halswell' } })
  })

  it('holds the register-only people, whom no seeded patient holds', () => {
    const held = new Set(patients.map((p) => p.nhi))
    for (const person of NHI_REGISTER_ONLY) {
      expect(held.has(person.nhi), person.nhi).toBe(false)
      expect(nhiRegister().get(person.nhi)).toMatchObject(person)
    }
  })

  it('leaves the reserved NHIs off', () => {
    for (const nhi of NHI_REGISTER_RESERVED) expect(nhiRegister().has(nhi), nhi).toBe(false)
  })

  it('reserves every valid intake-fixture NHI no seeded patient holds', () => {
    const files = [
      'domain/intake/hospitalDownloads.ts',
      'domain/intake/pdfLists.ts',
      'domain/seed/intakeSeed.ts',
      'store/matchingDemo.ts',
      'store/officeStandIn.ts',
    ]
    const held = new Set(patients.map((p) => p.nhi))
    for (const file of files) {
      const text = readFileSync(resolve(__dirname, '..', '..', file), 'utf8')
      for (const m of text.matchAll(/'([A-HJ-NP-Z]{3}\d{2}[0-9A-HJ-NP-Z]{2})'/g)) {
        const nhi = m[1] as string
        if (!validateNhi(nhi).valid || held.has(nhi)) continue
        expect(NHI_REGISTER_RESERVED.has(nhi), `${nhi} in ${file}`).toBe(true)
      }
    }
  })
})

describe('lookupOnRegister', () => {
  it('finds people in both formats, normalising the input', () => {
    expect(lookupOnRegister(nhiRegister(), 'zbr4417 ')).toMatchObject({ kind: 'found', person: { name: 'Mereana Tipene', format: 'current' } })
    expect(lookupOnRegister(nhiRegister(), 'ZBX41AL')).toMatchObject({ kind: 'found', person: { name: 'Ana Fifita', format: 'new' } })
  })

  it("keeps what Phase 01's canned lookup returned", () => {
    expect(lookupOnRegister(nhiRegister(), 'CQY9304')).toMatchObject({ kind: 'found', person: { name: 'Sarah Mitchell', dobISO: '1988-08-16', ethnicityCode: '11111' } })
    expect(lookupOnRegister(nhiRegister(), 'MYY54SL')).toMatchObject({ kind: 'found', person: { name: 'Priya Nair', dobISO: '1970-03-14', ethnicityCode: '43111' } })
    expect(lookupOnRegister(nhiRegister(), 'DEM1239')).toMatchObject({ kind: 'found', person: { name: 'Demo Patient', dobISO: '1990-05-07', phone: '021 555 0190', ethnicityCode: '11111' } })
  })

  it('reads not found for a valid NHI off the register', () => {
    expect(lookupOnRegister(nhiRegister(), NHI_NOT_ON_REGISTER)).toEqual({ kind: 'notFound', nhi: 'ZBW6638' })
  })

  it('never reads the register with an invalid NHI', () => {
    const spy = new Map(nhiRegister())
    let reads = 0
    const counting = { get: (k: string) => { reads++; return spy.get(k) } } as unknown as ReadonlyMap<string, never>
    expect(lookupOnRegister(counting, 'ZAA0068')).toEqual({ kind: 'invalid', reason: 'The check digit does not match.' })
    expect(lookupOnRegister(counting, 'ABC1234')).toEqual({ kind: 'invalid', reason: 'The check digit does not match.' })
    expect(reads).toBe(0)
  })
})

describe('registerDifferences and applyRegisterRefresh', () => {
  const fiona = byId(PAT.gray)
  const fionaOnRegister = nhiRegister().get('ZAM1098')!

  it('Fiona Gray differs in name and address', () => {
    const { differences, enrichments } = registerDifferences(fiona, fionaOnRegister)
    expect(differences.map((d) => d.field)).toEqual(['name', 'address'])
    expect(differences[0]).toEqual({ field: 'name', onRecord: 'Fiona Gray', onRegister: 'Fiona Tamihana' })
    expect(enrichments).toEqual([])
  })

  it('Sarah Mitchell has nothing to change', () => {
    expect(registerDifferences(byId(PAT.mitchell), nhiRegister().get('CQY9304')!)).toEqual({ differences: [], enrichments: [] })
  })

  it('a field the record lacks is an enrichment, not a difference', () => {
    const bare: Patient = { hiddenInternalId: 'PTX', nhi: 'DEM1239', name: 'Demo Patient', dobISO: '1990-05-07' }
    const { differences, enrichments } = registerDifferences(bare, nhiRegister().get('DEM1239')!)
    expect(differences).toEqual([])
    expect(enrichments.map((e) => e.field)).toEqual(['phone', 'ethnicityCode'])
  })

  it('an ethnicity mismatch is a difference', () => {
    const p = { ...byId(PAT.mitchell), ethnicityCode: '21111' }
    expect(registerDifferences(p, nhiRegister().get('CQY9304')!).differences).toEqual([{ field: 'ethnicityCode', onRecord: '21111', onRegister: '11111' }])
  })

  it('applies enrichments always and differences only on Use register', () => {
    const kept = applyRegisterRefresh(fiona, fionaOnRegister, {})
    expect(kept.changed).toEqual([])
    expect(kept.patient).toBe(fiona)
    const used = applyRegisterRefresh(fiona, fionaOnRegister, { name: 'useRegister', address: 'keep' })
    expect(used.changed).toEqual(['name'])
    expect(used.patient.name).toBe('Fiona Tamihana')
    expect(used.patient.postalAddress).toEqual(fiona.postalAddress)
    const bare: Patient = { hiddenInternalId: 'PTX', nhi: 'DEM1239', name: 'Demo Patient', dobISO: '1990-05-07' }
    expect(applyRegisterRefresh(bare, nhiRegister().get('DEM1239')!, {}).patient).toMatchObject({ phone: '021 555 0190', ethnicityCode: '11111' })
  })
})

describe('refresh fixes (catch-up Phase 40a review)', () => {
  it('a record from intake with no DOB gets the register DOB as an enrichment', () => {
    const noDob: Patient = { hiddenInternalId: 'PTX', nhi: 'DEM1239', name: 'Demo Patient', dobISO: '', phone: '021 555 0190', ethnicityCode: '11111' }
    expect(registerDifferences(noDob, nhiRegister().get('DEM1239')!).enrichments).toEqual([{ field: 'dobISO', onRegister: '1990-05-07' }])
    expect(applyRegisterRefresh(noDob, nhiRegister().get('DEM1239')!, {}).patient.dobISO).toBe('1990-05-07')
  })

  it("the register's ethnicity code replaces a code held for review", () => {
    const held: Patient = { hiddenInternalId: 'PTX', nhi: 'DEM1239', name: 'Demo Patient', dobISO: '1990-05-07', phone: '021 555 0190', ethnicityPending: { receivedCode: '99999', reason: 'Not in the code set.' } }
    const out = applyRegisterRefresh(held, nhiRegister().get('DEM1239')!, {})
    expect(out.changed).toEqual(['ethnicityCode'])
    expect(out.patient.ethnicityCode).toBe('11111')
    expect(out.patient.ethnicityPending).toBeUndefined()
  })
})
