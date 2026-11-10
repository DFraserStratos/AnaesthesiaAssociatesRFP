/**
 * Catch-up Phase 18a seed pins: the specialties and funding tags, each
 * surgeon's free text mapped onto AA's list, every seeded Procedure's Contract
 * fitting its List's surgeon, the open-price fallbacks derived from the
 * Contracts, and the ACC marker read from the Contract's tag.
 *
 * `__parity__/phase-18a-baseline.json` was written from the seed BEFORE the
 * reshape (each surgeon's free-text specialty, the room and surgeon counts,
 * the Procedures then flagged ACC with their Contract); it never changes.
 */

import { describe, expect, it } from 'vitest'
import baseline from './__parity__/phase-18a-baseline.json'
import { freshAppState } from './appStore'
import { accpayInvoicesFor } from './selectors'
import { SPECIALTY_FOR_DIRECTORY_TEXT } from '../domain/seed'
import { DIRECTORY_ROOMS, DIRECTORY_SURGEONS } from '../domain/seed/specialistDirectory'
import { contractFitsSpecialties, surgeonSpecialtyLabel } from '../domain/specialties'
import { destinationKey, destinationOf, impliedDestinations, isOpenPriceFallback } from '../domain/billing/fallbacks'
import { fundingTagsInOrder, procedureAccFunded } from '../domain/billing/fundingTags'

const state = freshAppState()
const { masters, schedule } = state

describe('specialties and funding tags (seed)', () => {
  it('seeds the twelve broad specialties', () => {
    expect(Object.values(masters.specialties).map((s) => s.name).sort()).toEqual(
      [
        'Cardiothoracic surgery', 'ENT', 'Gastroenterology', 'General surgery', 'Gynaecology', 'Neurosurgery',
        'Ophthalmology', 'Oral and maxillofacial surgery', 'Orthopaedics', 'Plastic surgery', 'Urology', 'Vascular surgery',
      ],
    )
  })

  it('seeds SXAP, HNZ, ACC in that order, each naming its funder Party', () => {
    expect(fundingTagsInOrder(masters.fundingTags).map((t) => [t.code, masters.parties[t.funderPartyId ?? '']?.name])).toEqual([
      ['SXAP', 'Southern Cross Health Society'],
      ['HNZ', 'Health NZ'],
      ['ACC', 'ACC'],
    ])
  })
})

describe("surgeons' specialties (US-13.6.6)", () => {
  it('keeps the directory counts', () => {
    expect(DIRECTORY_SURGEONS.length).toBe(131)
    expect(DIRECTORY_ROOMS.length).toBe(40)
    expect(Object.keys(masters.surgeons).length).toBe(baseline.surgeonCount)
    expect(Object.keys(masters.surgeonRooms).length).toBe(baseline.rooms)
  })

  it("maps every surgeon's free text onto AA's list, one specialty each", () => {
    for (const { id, specialty } of baseline.surgeons) {
      const surgeon = masters.surgeons[id]!
      expect(specialty, id).not.toBeNull()
      expect(surgeon.specialtyIds, id).toEqual([SPECIALTY_FOR_DIRECTORY_TEXT[specialty!]])
    }
  })

  it('pins the directory counts per specialty, subspecialties folded in', () => {
    const counts: Record<string, number> = {}
    for (const s of DIRECTORY_SURGEONS) {
      const label = surgeonSpecialtyLabel(masters, s)
      counts[label] = (counts[label] ?? 0) + 1
    }
    expect(counts).toEqual({
      Orthopaedics: 22,
      Ophthalmology: 18,
      ENT: 14,
      Urology: 9,
      Gynaecology: 21,
      'General surgery': 26,
      'Plastic surgery': 10,
      'Oral and maxillofacial surgery': 5,
      'Vascular surgery': 3,
      Neurosurgery: 3,
    })
  })

  it("keeps the cast's ten, Lim reading Plastic surgery", () => {
    const label = (id: string) => surgeonSpecialtyLabel(masters, masters.surgeons[id])
    expect(['S-HALE', 'S-PATEL', 'S-OKAFOR', 'S-DOYLE', 'S-WHITFORD', 'S-REID', 'S-LIM', 'S-TAN', 'S-NAND', 'S-CAMERON'].map(label)).toEqual([
      'Orthopaedics', 'General surgery', 'General surgery', 'General surgery', 'Ophthalmology', 'Ophthalmology',
      'Plastic surgery', 'Urology', 'ENT', 'Gynaecology',
    ])
  })

  it('maps a Fertility surgeon to Gynaecology and an Upper GI one to General surgery', () => {
    const fertility = baseline.surgeons.find((s) => s.specialty === 'Fertility')!
    const upperGi = baseline.surgeons.find((s) => s.specialty === 'Upper GI')!
    expect(surgeonSpecialtyLabel(masters, masters.surgeons[fertility.id])).toBe('Gynaecology')
    expect(surgeonSpecialtyLabel(masters, masters.surgeons[upperGi.id])).toBe('General surgery')
  })
})

describe("Contracts' specialties and tags (US-04.2.16, US-04.2.17)", () => {
  it('tags SXAP, HNZ and the ACC Contracts; specialties only on Doyle\'s bariatric', () => {
    const tagged = Object.values(masters.contracts)
      .filter((c) => !isOpenPriceFallback(c) && c.fundingTagId !== undefined)
      .map((c) => `${c.aaCode}:${masters.fundingTags[c.fundingTagId!]?.code}`)
      .sort()
    expect(tagged).toEqual(['COS-001:ACC', 'COS-002:ACC', 'CPH-002:HNZ', 'STG-002:ACC', 'SX-002:SXAP'])
    const withSpecialties = Object.values(masters.contracts).filter((c) => c.specialtyIds.length > 0)
    expect(withSpecialties.map((c) => [c.aaCode, c.specialtyIds])).toEqual([['DOYLE-001', ['SPC-GENSURG']]])
  })

  it("every seeded Procedure's Contract fits its List's surgeon, so no seeded Booking's Contract is hidden", () => {
    let checked = 0
    for (const p of Object.values(schedule.procedures)) {
      if (p.governingContractId === undefined) continue
      const list = schedule.lists[schedule.bookings[p.bookingId]!.listId]!
      const contract = masters.contracts[p.governingContractId]!
      expect(contractFitsSpecialties(contract.specialtyIds, masters.surgeons[list.surgeonId]!.specialtyIds), p.id).toBe(true)
      checked++
    }
    expect(checked).toBeGreaterThan(20)
  })

  it('places SXAP and HNZ under their hospitals, St George\'s ACC under St George\'s, COS ACC under Special', () => {
    const at = (id: string) => destinationKey(destinationOf(masters.contracts[id]!, masters.parties))
    expect(at('CT-SXAP')).toBe('hospital:PY-SX:TAG-SXAP')
    expect(at('CT-HNZ')).toBe('hospital:PY-CPH:TAG-HNZ')
    expect(at('CT-STG-ACC')).toBe('hospital:PY-STG:TAG-ACC')
    expect(at('CT-COS-ACC')).toBe('special:PY-COS')
    expect(at('CT-STG-D1')).toBe('special:PY-STG')
    expect(at('CT-DOYLE-BAR')).toBe('patient:standard')
  })
})

describe('the open-price fallbacks (DM-49, AR-58 5.5)', () => {
  const fallbacks = Object.values(masters.contracts).filter(isOpenPriceFallback)

  it('exactly one per invoice destination the Contracts imply, the two Patient ones included', () => {
    const keys = fallbacks.map((f) => destinationKey(destinationOf(f, masters.parties))).sort()
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).toEqual(impliedDestinations(masters.contracts, masters.parties).map(destinationKey))
    expect(keys).toContain('patient:standard')
    expect(keys).toContain('patient:prepaid')
  })

  it('ids derive from the destination key; kind open, Active, no specialties or links', () => {
    for (const f of fallbacks) {
      expect(f.id).toBe(`CT-FIX-${destinationKey(destinationOf(f, masters.parties)).replace(/[^A-Za-z0-9]+/g, '-').toUpperCase()}`)
      expect(f).toMatchObject({ pricing: { kind: 'open' }, status: 'active', specialtyIds: [], linkedSurgeonIds: [] })
    }
    expect(masters.contracts['CT-FIX-PATIENT-STANDARD']).toMatchObject({ name: 'No contract · Fixed price', aaCode: 'AA-FIX', holderId: 'PY-AA', billsTo: 'payer', prepaid: false })
    expect(masters.contracts['CT-FIX-PATIENT-PREPAID']).toMatchObject({ name: 'Prepaid · Fixed price', aaCode: 'AA-PRE', prepaid: true })
    expect(masters.contracts['CT-FIX-HOSPITAL-PY-STG-TAG-ACC']).toMatchObject({ name: "St George's · ACC · Fixed price", aaCode: 'STG-ACC-FIX', fundingTagId: 'TAG-ACC' })
    expect(masters.contracts['CT-FIX-SPECIAL-PY-COS']).toMatchObject({ aaCode: 'COS-FIX', billsTo: 'holder' })
    expect(masters.contracts['CT-FIX-SPECIAL-PY-COS']?.fundingTagId).toBeUndefined()
  })

  it('no seeded Procedure sits on a fallback', () => {
    const ids = new Set(fallbacks.map((f) => f.id))
    expect(Object.values(schedule.procedures).filter((p) => ids.has(p.governingContractId ?? ''))).toEqual([])
  })
})

describe('ACC is a funding tag (FT-05.5, US-05.5.1)', () => {
  it('each Procedure seeded ACC on an ACC Contract still reads ACC, on the same Contract', () => {
    const live = baseline.accProcedures.filter((p) => p.contractId !== null)
    expect(live.map((p) => p.procedureId)).toEqual(['P0012', 'P0033', 'P0042'])
    for (const { procedureId, contractId } of live) {
      const p = schedule.procedures[procedureId]!
      expect(p.governingContractId).toBe(contractId)
      expect(procedureAccFunded(masters, p), procedureId).toBe(true)
    }
  })

  it('only Procedures on an ACC-tagged Contract read ACC from a tag; the archived accounts keep the old marker on their case', () => {
    const acc = Object.values(schedule.procedures).filter((p) => procedureAccFunded(masters, p)).map((p) => p.id).sort()
    expect(acc).toEqual(['P0012', 'P0033', 'P0042'])
    const archived = baseline.accProcedures.filter((p) => p.contractId === null).map((p) => p.procedureId)
    expect(archived).toEqual(['HP04', 'HP06', 'HP26'])
    for (const id of archived) {
      const p = schedule.procedures[id]!
      expect(p.governingContractId).toBeUndefined()
      const theCase = Object.values(state.billing.cases).find((c) => c.bookingId === p.bookingId)
      expect(theCase?.archivedAccRelated, id).toBe(true)
    }
    expect(Object.values(state.billing.cases).filter((c) => c.archivedAccRelated === true)).toHaveLength(3)
  })

  it("Dr Souter's accounts still mark the archived ACC accounts (Prentice and Foster among them), and nothing else", () => {
    const rows = accpayInvoicesFor(state, '34821', '2026-07-21')
    const flagged = rows.filter((r) => r.accFunded)
    expect(flagged.map((r) => r.patientName)).toEqual(expect.arrayContaining(['Alan Prentice', 'Diane Foster']))
    for (const r of rows) expect(r.accFunded, r.invoiceNumber).toBe(state.billing.cases[r.caseId]?.archivedAccRelated === true)
  })

  it('the Procedure no longer stores an ACC flag', () => {
    for (const p of Object.values(schedule.procedures)) expect('accRelated' in p, p.id).toBe(false)
  })
})
