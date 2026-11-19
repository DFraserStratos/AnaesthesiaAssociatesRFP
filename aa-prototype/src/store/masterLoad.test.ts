/**
 * The seed load over the sample sheets (catch-up Phase 42; US-13.4.3 AC1,
 * AC2): each sample stages on its own against the seeded masters, a rejected
 * row's reason is word for word the manual refusal, staging never writes
 * master data, and a commit loads exactly the still-valid rows in one audited
 * change, the same records every time.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from './appStore'
import { OFFICE_ACTOR, SEED_LOAD_ACTOR, SOUTER_ACTOR } from './demoActors'
import { commitMasterLoad, stageMasterLoad } from './masterLoadActions'
import { createHospital } from './mastersActions'
import { createRvgGroup } from './rvgGroupActions'
import { addPriceRange, createContract, type ContractInput } from './contractActions'
import { createSurgeon } from './surgeonActions'
import { LOAD_ORDER, type LoadEntity, type MasterLoad } from '../domain/masterLoad/types'
import { SAMPLE_SHEETS, sampleFor } from '../domain/masterLoad/samples'
import type { Outcome } from './mutate'

function stage(api: AppStoreApi, entity: LoadEntity, csvText = sampleFor(entity).csv): string {
  const s = sampleFor(entity)
  const r = stageMasterLoad(api, SEED_LOAD_ACTOR, { entity, csvText, source: { kind: 'sample', sampleId: s.id } })
  if (!r.ok) throw new Error(r.message)
  return r.value.loadId
}

function loadOf(api: AppStoreApi, loadId: string): MasterLoad {
  const l = api.getState().masterLoads.loads[loadId]
  if (l === undefined) throw new Error(`no load ${loadId}`)
  return l
}

/** The rejected row whose first cell is `first`. */
function rejectedRow(api: AppStoreApi, loadId: string, first: string) {
  const row = loadOf(api, loadId).rows.find((r) => r.status === 'rejected' && r.cells[0] === first)
  if (row === undefined) throw new Error(`no rejected row ${first}`)
  return row
}

function message(o: Outcome<unknown>): string {
  return o.ok ? '' : o.message
}

const PINNED: Record<LoadEntity, { valid: number; rejected: number }> = {
  specialties: { valid: 2, rejected: 3 },
  surgeons: { valid: 5, rejected: 5 },
  anaesthetists: { valid: 2, rejected: 3 },
  hospitals: { valid: 2, rejected: 4 },
  hospitalHolidays: { valid: 2, rejected: 3 },
  publicHolidays: { valid: 4, rejected: 4 },
  rvgGroups: { valid: 3, rejected: 4 },
  modifiers: { valid: 3, rejected: 3 },
  parties: { valid: 3, rejected: 5 },
  fundingTags: { valid: 2, rejected: 3 },
  contracts: { valid: 4, rejected: 5 },
  priceRanges: { valid: 2, rejected: 5 },
}

describe('the sample sheets', () => {
  it('cover every sheet once, in load order', () => {
    expect(SAMPLE_SHEETS.map((s) => s.entity)).toEqual(LOAD_ORDER)
    expect(new Set(SAMPLE_SHEETS.map((s) => s.id)).size).toBe(SAMPLE_SHEETS.length)
  })

  it('carry no en or em dash and only .example emails', () => {
    for (const s of SAMPLE_SHEETS) {
      expect(s.csv).not.toMatch(new RegExp('[\\u2013\\u2014]'))
      for (const email of s.csv.match(/[^\s,;"@]+@[^\s,;"]+/g) ?? []) expect(email).toMatch(/\.example$/)
    }
  })

  for (const s of SAMPLE_SHEETS) {
    it(`${s.fileName} stages on its own with its pinned counts`, () => {
      const api = createAppStore()
      const r = stageMasterLoad(api, SEED_LOAD_ACTOR, { entity: s.entity, csvText: s.csv, source: { kind: 'sample', sampleId: s.id } })
      expect(r.ok).toBe(true)
      if (!r.ok) return
      expect({ valid: r.value.valid, rejected: r.value.rejected }).toEqual(PINNED[s.entity])
      const load = loadOf(api, r.value.loadId)
      expect(load.headerErrors).toEqual([])
      expect(load.source).toEqual({ kind: 'sample', sampleId: s.id })
      for (const row of load.rows.filter((x) => x.status === 'rejected')) expect(row.reasons.length).toBeGreaterThan(0)
      // Every rejected row is refused for a different reason.
      const firsts = load.rows.filter((x) => x.status === 'rejected').map((x) => x.reasons[0])
      expect(new Set(firsts).size).toBe(firsts.length)
    })
  }
})

describe('a rejected row reads as the manual refusal', () => {
  it('hospital: an email that does not look right', () => {
    const api = createAppStore()
    const id = stage(api, 'hospitals')
    const manual = createHospital(createAppStore(), OFFICE_ACTOR, 'Timaru Surgical', 'not-an-email')
    expect(rejectedRow(api, id, 'Timaru Surgical').reasons).toEqual([message(manual)])
  })

  it('RVG group: base units 0', () => {
    const api = createAppStore()
    const id = stage(api, 'rvgGroups')
    const manual = createRvgGroup(createAppStore(), OFFICE_ACTOR, { code: 'AA3', description: 'Sedation review', anatomy: 'AA own', baseUnits: 0, modifierUnits: 0 })
    expect(rejectedRow(api, id, 'AA3').reasons).toEqual([message(manual)])
  })

  it('Contract: a prepaid Contract priced from RVG units', () => {
    const api = createAppStore()
    const id = stage(api, 'contracts')
    const manual = createContract(createAppStore(), OFFICE_ACTOR, {
      aaCode: 'SOUTER-102',
      name: 'Septoplasty',
      holderId: 'PY-SOUTER',
      billsTo: 'payer',
      pricing: { kind: 'rvgAnaesthetistRate' },
      prepaid: true,
      anaesthetistMayOverridePrice: false,
      linkedSurgeonIds: [],
      linkedAnaesthetistId: '34821',
    })
    expect(message(manual)).not.toBe('')
    expect(rejectedRow(api, id, 'SOUTER-102').reasons).toEqual([message(manual)])
  })

  it('price range: a start already on the Contract', () => {
    const api = createAppStore()
    const id = stage(api, 'priceRanges')
    const manual = addPriceRange(createAppStore(), OFFICE_ACTOR, 'CT-COS-FIXED', { startISO: '2026-08-01', price: 1275 })
    const row = loadOf(api, id).rows.find((r) => r.cells[1] === '2026-08-01')!
    expect(row.status).toBe('rejected')
    expect(row.reasons).toEqual([message(manual)])
  })

  it('surgeon: no specialty, and a malformed HPI CPN', () => {
    const api = createAppStore()
    const id = stage(api, 'surgeons')
    const none = createSurgeon(createAppStore(), OFFICE_ACTOR, { name: 'Mr Peter Lawry', specialtyIds: [] })
    expect(message(none)).toBe('Choose at least one specialty.')
    expect(rejectedRow(api, id, 'Mr Peter Lawry').reasons).toEqual([message(none)])
    const bad = createSurgeon(createAppStore(), OFFICE_ACTOR, { name: 'Mr Callum Reeve', specialtyIds: ['SPC-UROLOGY'], hpiId: 'ABC123' })
    expect(rejectedRow(api, id, 'Mr Callum Reeve').reasons).toEqual([message(bad)])
    expect(rejectedRow(api, id, 'Dr Nina Sorensen').reasons).toEqual(['No specialty named Cardiac.'])
  })

  it('Contract rules beyond the sample: each row refused as the manual create is', () => {
    const header = sampleFor('contracts').csv.split('\n')[0]!
    const rows = [
      // A rate of 0.
      ['SX-201', 'Zero rate', 'Southern Cross', '', '', '', 'Holder', 'Standard', "RVG at the Contract's rate", '0', '', '', '', 'No', '', '', '', ''],
      // A fixed price with no first range.
      ['SX-202', 'No range', 'Southern Cross', '', '', '', 'Holder', 'Standard', 'Fixed price', '', '', '', '', 'No', '', '', '', ''],
      // An override on a fixed price.
      ['SX-203', 'Override fixed', 'Southern Cross', '', '', '', 'Holder', 'Standard', 'Fixed price', '', '', '500', '2026-08-01', 'Yes', '', '', '', ''],
      // Linked surgeons on a hospital Contract.
      ['SX-204', 'Linked hospital', 'Southern Cross', '', '', '', 'Holder', 'Standard', "RVG at the anaesthetist's rate", '', '', '', '', 'No', '', '', '40HALT', ''],
    ]
    const csv = [header, ...rows.map((r) => r.join(','))].join('\n')
    const api = createAppStore()
    const id = stage(api, 'contracts', csv)
    const base: ContractInput = { name: 'x', holderId: 'PY-SX', billsTo: 'holder', pricing: { kind: 'rvgAnaesthetistRate' }, prepaid: false, anaesthetistMayOverridePrice: false, linkedSurgeonIds: [] }
    const manual = [
      createContract(createAppStore(), OFFICE_ACTOR, { ...base, aaCode: 'SX-201', pricing: { kind: 'rvgContractRate', unitRate: 0 } }),
      createContract(createAppStore(), OFFICE_ACTOR, { ...base, aaCode: 'SX-202', pricing: { kind: 'fixed', ranges: [] } }),
      createContract(createAppStore(), OFFICE_ACTOR, { ...base, aaCode: 'SX-203', pricing: { kind: 'fixed', ranges: [{ startISO: '2026-08-01', price: 500 }] }, anaesthetistMayOverridePrice: true }),
      createContract(createAppStore(), OFFICE_ACTOR, { ...base, aaCode: 'SX-204', linkedSurgeonIds: ['S-HALE'] }),
    ].map(message)
    expect(manual.every((m) => m !== '')).toBe(true)
    expect(loadOf(api, id).rows.map((r) => r.reasons[0])).toEqual(manual)
  })

  it('Contract names that resolve to nothing are refused by name', () => {
    const header = sampleFor('contracts').csv.split('\n')[0]!
    const csv = [
      header,
      ['SX-301', 'Unknown party', 'Acme Hospital', '', '', '', 'Holder', 'Standard', "RVG at the anaesthetist's rate", '', '', '', '', 'No', '', '', '', ''].join(','),
      ['SX-302', 'Unknown tag and specialty', 'Southern Cross', '', '', '', 'Holder', 'Standard', "RVG at the anaesthetist's rate", '', '', '', '', 'No', 'XYZ', 'Cardiac', '', ''].join(','),
    ].join('\n')
    const api = createAppStore()
    const id = stage(api, 'contracts', csv)
    const [a, b] = loadOf(api, id).rows
    expect(a!.reasons).toEqual(['No Party named Acme Hospital.'])
    expect(b!.reasons).toEqual(['No funding tag XYZ.', 'No specialty named Cardiac.'])
  })
})

describe('stage and commit', () => {
  it('staging never touches master data', () => {
    for (const s of SAMPLE_SHEETS) {
      const api = createAppStore()
      const before = api.getState().masters
      stage(api, s.entity)
      expect(api.getState().masters).toEqual(before)
    }
  })

  it('a commit loads exactly the valid rows, each create audited with its load and row', () => {
    const api = createAppStore()
    const id = stage(api, 'hospitals')
    const before = Object.keys(api.getState().masters.hospitals).length
    const auditBefore = api.getState().audit.length
    const r = commitMasterLoad(api, SEED_LOAD_ACTOR, id)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.loaded).toBe(2)
    expect(r.value.rejected).toBe(4)
    const hospitals = Object.values(api.getState().masters.hospitals)
    expect(hospitals.length).toBe(before + 2)
    expect(hospitals.map((h) => h.name)).toEqual(expect.arrayContaining(['Rangiora Day Surgery', 'Ashburton Hospital']))
    const added = api.getState().audit.slice(auditBefore)
    const creates = added.filter((e) => e.action === 'hospital.create')
    expect(creates.map((e) => e.entityId).sort()).toEqual([...r.value.recordIds].sort())
    for (const e of creates) {
      const after = e.after as { loadId?: string; rowNumber?: number }
      expect(after.loadId).toBe(id)
      expect([2, 3]).toContain(after.rowNumber)
    }
    expect(added.filter((e) => e.action === 'masterLoad.commit')).toHaveLength(1)
    expect(loadOf(api, id).status).toBe('loaded')
  })

  it('a second commit is refused', () => {
    const api = createAppStore()
    const id = stage(api, 'hospitals')
    expect(commitMasterLoad(api, SEED_LOAD_ACTOR, id).ok).toBe(true)
    const again = commitMasterLoad(api, SEED_LOAD_ACTOR, id)
    expect(again.ok ? '' : again.code).toBe('notStaged')
  })

  it('a sheet whose valid rows all went stale loads nothing and shows the new reasons', () => {
    const api = createAppStore()
    const id = stage(api, 'hospitals')
    expect(createHospital(api, OFFICE_ACTOR, 'Rangiora Day Surgery').ok).toBe(true)
    expect(createHospital(api, OFFICE_ACTOR, 'Ashburton Hospital').ok).toBe(true)
    const masters = api.getState().masters
    const r = commitMasterLoad(api, SEED_LOAD_ACTOR, id)
    expect(r.ok ? '' : r.code).toBe('nothingToLoad')
    expect(api.getState().masters).toEqual(masters)
    const load = loadOf(api, id)
    expect(load.status).toBe('staged')
    expect(load.rows.every((row) => row.status === 'rejected')).toBe(true)
    expect(load.rows.find((row) => row.rowNumber === 2)!.reasons).toEqual(['Already in master data: edit it there.'])
  })

  it('a row gone stale since staging is re-checked and left out', () => {
    const api = createAppStore()
    const id = stage(api, 'hospitals')
    expect(createHospital(api, OFFICE_ACTOR, 'Rangiora Day Surgery').ok).toBe(true)
    const r = commitMasterLoad(api, SEED_LOAD_ACTOR, id)
    expect(r.ok && r.value.loaded).toBe(1)
    expect(Object.values(api.getState().masters.hospitals).filter((h) => h.name === 'Rangiora Day Surgery')).toHaveLength(1)
  })

  it('the same sample on two fresh stores loads the same records', () => {
    for (const s of SAMPLE_SHEETS) {
      const [a, b] = [createAppStore(), createAppStore()]
      for (const api of [a, b]) expect(commitMasterLoad(api, SEED_LOAD_ACTOR, stage(api, s.entity)).ok).toBe(true)
      expect(a.getState().masters).toEqual(b.getState().masters)
    }
  })

  it('staging a sheet again discards the earlier staged load', () => {
    const api = createAppStore()
    const first = stage(api, 'specialties')
    const second = stage(api, 'specialties')
    expect(loadOf(api, first).status).toBe('discarded')
    expect(loadOf(api, second).status).toBe('staged')
  })

  it('an anaesthetist cannot stage or commit', () => {
    const api = createAppStore()
    const s = sampleFor('hospitals')
    const r = stageMasterLoad(api, SOUTER_ACTOR, { entity: 'hospitals', csvText: s.csv, source: { kind: 'sample', sampleId: s.id } })
    expect(r.ok ? '' : r.code).toBe('officeOnly')
    const c = commitMasterLoad(api, SOUTER_ACTOR, stage(api, 'hospitals'))
    expect(c.ok ? '' : c.code).toBe('officeOnly')
  })
})

describe('what the samples load', () => {
  it('surgeons: a blank HPI CPN loads blank, name gaps load with notes, two practices make one surgeon', () => {
    const api = createAppStore()
    const id = stage(api, 'surgeons')
    const rows = loadOf(api, id).rows
    expect(rows.find((r) => r.cells[0] === 'Dr Aroha')!.notes).toEqual(['No surname: complete it in Master data.'])
    expect(rows.find((r) => r.cells[0] === 'Jane Mercer')!.notes).toEqual(['No title: complete it in Master data.'])
    expect(rows.find((r) => r.cells[0] === 'Dr Aroha')!.status).toBe('valid')
    expect(rows.find((r) => r.cells[0] === 'Jane Mercer')!.status).toBe('valid')
    expect(commitMasterLoad(api, SEED_LOAD_ACTOR, id).ok).toBe(true)
    const surgeons = Object.values(api.getState().masters.surgeons)
    const corrigan = surgeons.filter((s) => s.name === 'Dr Matthew Corrigan')
    expect(corrigan).toHaveLength(1)
    expect(corrigan[0]!.hpiId).toBeUndefined()
    const strachan = surgeons.filter((s) => s.name === 'Ms Fiona Strachan')
    expect(strachan).toHaveLength(1)
    expect(strachan[0]!.officeContacts).toEqual([
      { name: 'Marie Dunstan', email: 'office@hagleysurgical.example' },
      { name: 'Tui Henare', email: 'desk@papanuiday.example' },
    ])
    expect(strachan[0]!.specialtyIds).toEqual(['SPC-GENSURG', 'SPC-UROLOGY'])
  })

  it('contracts: every Contract a load makes is Active, and No contract · RVG is untouched', () => {
    const api = createAppStore()
    const before = api.getState().masters.contracts
    const noContract = Object.values(before).find((c) => c.systemRole === 'noContractRvg')!
    const r = commitMasterLoad(api, SEED_LOAD_ACTOR, stage(api, 'contracts'))
    expect(r.ok && r.value.loaded).toBe(4)
    const after = api.getState().masters.contracts
    const made = Object.values(after).filter((c) => before[c.id] === undefined)
    expect(made.length).toBeGreaterThanOrEqual(4)
    expect(made.every((c) => c.status === 'active')).toBe(true)
    expect(made.map((c) => c.aaCode)).toEqual(expect.arrayContaining(['SX-101', 'STG-101', 'NIB-101', 'SOUTER-101']))
    expect(after[noContract.id]).toEqual(noContract)
  })

  it('public holidays 2027: the four rows are in the calendar', () => {
    const api = createAppStore()
    expect(commitMasterLoad(api, SEED_LOAD_ACTOR, stage(api, 'publicHolidays')).ok).toBe(true)
    const byDate = Object.values(api.getState().masters.publicHolidays).map((p) => [p.dateISO, p.name])
    expect(byDate).toEqual(
      expect.arrayContaining([
        ['2027-03-26', 'Good Friday'],
        ['2027-03-29', 'Easter Monday'],
        ['2027-04-26', 'ANZAC Day (observed)'],
        ['2027-06-07', "King's Birthday"],
      ]),
    )
  })

  it('price ranges: a later range and a backdated range join the seeded Contract', () => {
    const api = createAppStore()
    expect(commitMasterLoad(api, SEED_LOAD_ACTOR, stage(api, 'priceRanges')).ok).toBe(true)
    const c = api.getState().masters.contracts['CT-COS-FIXED']!
    expect(c.pricing.kind === 'fixed' && c.pricing.ranges.map((r) => r.startISO)).toEqual(['2026-03-01', '2026-08-01', '2027-01-01'])
  })
})
