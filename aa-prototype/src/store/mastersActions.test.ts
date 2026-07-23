/**
 * Master-data mutation guards (Phase 07): anaesthetist edit/add (+ canvas
 * forward), hospital-holiday add + live reconcile, permanent-list add/edit, and
 * the contract surface including BOTH halves of the default-Type-1 invariant
 * (delete blocked AND end-date blocked). The creation half (createHospital /
 * setInsurerDirectClaims) stays tested in intake.test.ts.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { editProcedure } from './lifecycle'
import { cardsForList, proceduresForCard } from './selectors'
import {
  addAnaesthetist,
  addHospitalHoliday,
  addPermanentList,
  editAnaesthetist,
  editPermanentList,
} from './mastersActions'
import { addContractPrice, createContract, deleteContract, editContract, editContractPrice } from './contractActions'
import type { Actor } from './mutate'
import { procedureFee } from '../shared/capture/feeContext'
import { enumerateDatesISO, horizonFor } from '../domain/clock'
import { ANAE, CONTRACT, HOSP, SEED, SEED_MARKERS, SURG, generateListsForDates } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = {
  who: 'Dr Melanie Souter',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.souter,
}

function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}

const MORRISON_LIST = marker('submittedListMorrison')

describe('editAnaesthetist', () => {
  it('updates unit value / contact / active and audits before to after', () => {
    const api = createAppStore()
    const outcome = editAnaesthetist(api, OFFICE, ANAE.souter, { unitValue: 40, phone: '021 000 0000', active: false })
    expect(outcome.ok).toBe(true)
    const anae = api.getState().masters.anaesthetists[ANAE.souter]
    expect(anae?.unitValue).toBe(40)
    expect(anae?.phone).toBe('021 000 0000')
    expect(anae?.active).toBe(false)
    const entry = api.getState().audit.at(-1)
    expect(entry?.action).toBe('anaesthetist.update')
    expect(entry?.entityId).toBe(ANAE.souter)
  })

  it('re-prices a Type 1 fee that reads the anaesthetist unit value', () => {
    const api = createAppStore()
    const card = cardsForList(api.getState(), MORRISON_LIST)[0]
    if (card === undefined) throw new Error('no card')
    const proc = proceduresForCard(api.getState(), card.id)[0]
    if (proc === undefined) throw new Error('no procedure')
    // Force plain Type 1 (units x own unit value): no contract, no override.
    expect(editProcedure(api, OFFICE, proc.id, { governingContractId: undefined, priceOverride: undefined }).ok).toBe(true)

    const feeArgs = () => {
      const s = api.getState()
      return { procedure: s.schedule.procedures[proc.id]!, list: s.schedule.lists[MORRISON_LIST]!, ordinal: 1, masters: s.masters, billingLines: s.schedule.billingLines }
    }
    const before = procedureFee(feeArgs()).fee.total
    expect(before).toBeGreaterThan(0)
    expect(editAnaesthetist(api, OFFICE, ANAE.morrison, { unitValue: 70 }).ok).toBe(true)
    const after = procedureFee(feeArgs()).fee.total
    expect(after).not.toBe(before)
    expect(after).toBeGreaterThan(before)
  })

  it('rejects a non-positive unit value and is office-only', () => {
    const api = createAppStore()
    expect(editAnaesthetist(api, OFFICE, ANAE.souter, { unitValue: 0 }).ok).toBe(false)
    expect(editAnaesthetist(api, SOUTER, ANAE.souter, { unitValue: 30 }).ok).toBe(false)
    expect(editAnaesthetist(api, OFFICE, 'nope', { unitValue: 30 }).ok).toBe(false)
  })
})

describe('addAnaesthetist', () => {
  it('adds an anaesthetist and extends the canvas forward, deep-matching a fresh generation', () => {
    const api = createAppStore()
    const todayISO = api.getState().clock.todayISO
    const outcome = addAnaesthetist(api, OFFICE, {
      registrationNumber: '99001',
      name: 'Dr New Person',
      phone: '021 555 9001',
      email: 'n.person@aa-associates.example',
      unitValue: 30,
      gstPeriod: 'monthly',
    })
    expect(outcome.ok).toBe(true)
    const state = api.getState()
    expect(state.masters.anaesthetists['99001']?.name).toBe('Dr New Person')

    // 2 Lists per day across their forward horizon (the canvas invariant).
    const theirs = Object.values(state.schedule.lists).filter((l) => l.anaesthetistId === '99001')
    const byDate: Record<string, number> = {}
    for (const l of theirs) byDate[l.dateISO] = (byDate[l.dateISO] ?? 0) + 1
    expect(theirs.length).toBeGreaterThan(0)
    expect(Object.values(byDate).every((n) => n === 2)).toBe(true)

    // Deep-match a fresh full-horizon generation for just this anaesthetist.
    const dates = enumerateDatesISO(todayISO, horizonFor(todayISO).endISO)
    const fresh = generateListsForDates(
      {
        seed: SEED,
        anaesthetistIds: ['99001'],
        permanentLists: Object.values(state.masters.permanentLists),
        availability: Object.values(state.masters.availability),
        holidays: Object.values(state.masters.holidays),
      },
      dates,
    )
    expect(fresh.length).toBe(theirs.length)
    const stored = new Map(theirs.map((l) => [l.id, l]))
    for (const f of fresh) expect(stored.get(f.id)).toEqual(f)

    // Audited create + one canvas.generate summary.
    const actions = state.audit.slice(-2).map((a) => a.action)
    expect(actions).toEqual(['anaesthetist.create', 'canvas.generate'])
  })

  it('rejects a duplicate registration number and is office-only', () => {
    const api = createAppStore()
    const dup = addAnaesthetist(api, OFFICE, { registrationNumber: ANAE.souter, name: 'Clash', phone: '', email: '', unitValue: 30, gstPeriod: 'monthly' })
    expect(dup.ok).toBe(false)
    if (!dup.ok) expect(dup.code).toBe('duplicateRegistration')
    const denied = addAnaesthetist(api, SOUTER, { registrationNumber: '90000', name: 'X', phone: '', email: '', unitValue: 30, gstPeriod: 'monthly' })
    expect(denied.ok).toBe(false)
  })
})

describe('addHospitalHoliday', () => {
  it('flags an already-booked list at that hospital/date and audits it', () => {
    const api = createAppStore()
    const listId = marker('designDayAmList')
    const list = api.getState().schedule.lists[listId]
    if (list === undefined) throw new Error('no design-day AM list')
    const hospitalId = list.hospitalId
    expect(hospitalId).toBeDefined()
    if (hospitalId === undefined) return

    const outcome = addHospitalHoliday(api, OFFICE, hospitalId, list.dateISO, 'Unplanned closure')
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.value.flaggedListCount).toBeGreaterThan(0)

    const flagged = api.getState().schedule.lists[listId]
    expect(flagged?.conflicts.some((c) => c.kind === 'holiday')).toBe(true)

    const actions = api.getState().audit.slice(-(1 + outcome.value.flaggedListCount)).map((a) => a.action)
    expect(actions[0]).toBe('holiday.create')
    expect(actions).toContain('list.conflict')
  })

  it('refuses a duplicate holiday and is office-only', () => {
    const api = createAppStore()
    expect(addHospitalHoliday(api, OFFICE, HOSP.stg, '2026-08-03', 'Test day').ok).toBe(true)
    const dup = addHospitalHoliday(api, OFFICE, HOSP.stg, '2026-08-03', 'Test day again')
    expect(dup.ok).toBe(false)
    if (!dup.ok) expect(dup.code).toBe('duplicateHoliday')
    expect(addHospitalHoliday(api, SOUTER, HOSP.stg, '2026-08-04', 'x').ok).toBe(false)
  })
})

describe('permanent lists', () => {
  it('adds a template (incl. usual surgeon) with a runtime PLN id and edits it', () => {
    const api = createAppStore()
    const add = addPermanentList(api, OFFICE, {
      anaesthetistId: ANAE.souter,
      dayOfWeek: 3,
      session: 'AM',
      statusKey: 'private',
      hospitalId: HOSP.stg,
      surgeonId: SURG.hale,
      notes: 'Wed ortho',
    })
    expect(add.ok).toBe(true)
    if (!add.ok) return
    expect(add.value.id.startsWith('PLN')).toBe(true)
    expect(api.getState().masters.permanentLists[add.value.id]?.surgeonId).toBe(SURG.hale)

    expect(editPermanentList(api, OFFICE, add.value.id, { surgeonId: null }).ok).toBe(true)
    expect(api.getState().masters.permanentLists[add.value.id]?.surgeonId).toBe(null)
    expect(api.getState().audit.at(-1)?.action).toBe('permanentList.update')
  })

  it('is office-only', () => {
    const api = createAppStore()
    const denied = addPermanentList(api, SOUTER, { anaesthetistId: ANAE.souter, dayOfWeek: 1, session: 'AM', statusKey: 'free', hospitalId: null, surgeonId: null })
    expect(denied.ok).toBe(false)
  })
})

describe('contracts + the default-Type-1 invariant (second half)', () => {
  it('creates, edits and deletes a non-default contract', () => {
    const api = createAppStore()
    const created = createContract(api, OFFICE, {
      name: 'Test agreed rate',
      type: 2,
      holderType: 'hospital',
      holderId: HOSP.sx,
      scope: { kind: 'organisation' },
      permitsIndividualArrangement: false,
      effectiveFromISO: '2026-01-01',
      type2Detail: { basis: 'agreedUnitRate', unitRate: 30 },
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    expect(created.value.contract.id.startsWith('CTN')).toBe(true)
    expect(created.value.contract.isDefault).toBe(false)
    const id = created.value.contract.id

    expect(editContract(api, OFFICE, id, { name: 'Renamed rate' }).ok).toBe(true)
    expect(api.getState().masters.contracts[id]?.name).toBe('Renamed rate')

    expect(deleteContract(api, OFFICE, id).ok).toBe(true)
    expect(api.getState().masters.contracts[id]).toBeUndefined()
  })

  it('rejects a Type 2 contract with no agreed rate / discount', () => {
    const api = createAppStore()
    const outcome = createContract(api, OFFICE, {
      name: 'Bad type 2',
      type: 2,
      holderType: 'hospital',
      holderId: HOSP.sx,
      scope: { kind: 'organisation' },
      permitsIndividualArrangement: false,
      effectiveFromISO: '2026-01-01',
    })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('type2DetailRequired')
  })

  it('BLOCKS deleting a default Type 1 contract', () => {
    const api = createAppStore()
    const outcome = deleteContract(api, OFFICE, CONTRACT.stgDefault)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('defaultContractProtected')
    expect(api.getState().masters.contracts[CONTRACT.stgDefault]).toBeDefined()
  })

  it('BLOCKS end-dating a default Type 1 contract', () => {
    const api = createAppStore()
    const outcome = editContract(api, OFFICE, CONTRACT.stgDefault, { effectiveToISO: '2027-01-01' })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('defaultContractProtected')
    expect(api.getState().masters.contracts[CONTRACT.stgDefault]?.effectiveToISO).toBeUndefined()
  })

  it('ALLOWS a non-essential edit of a default Type 1 (its name)', () => {
    const api = createAppStore()
    const outcome = editContract(api, OFFICE, CONTRACT.stgDefault, { name: "St George's standard units (reviewed)" })
    expect(outcome.ok).toBe(true)
    expect(api.getState().masters.contracts[CONTRACT.stgDefault]?.name).toContain('reviewed')
  })

  it('BLOCKS changing a default Type 1 away from Type 1, or moving its holder (invariant kept in the store)', () => {
    const api = createAppStore()
    const retyped = editContract(api, OFFICE, CONTRACT.stgDefault, { type: 2, type2Detail: { basis: 'agreedUnitRate', unitRate: 30 } })
    expect(retyped.ok).toBe(false)
    if (!retyped.ok) expect(retyped.code).toBe('defaultContractProtected')

    const reheld = editContract(api, OFFICE, CONTRACT.stgDefault, { holderId: HOSP.sx })
    expect(reheld.ok).toBe(false)
    if (!reheld.ok) expect(reheld.code).toBe('defaultContractProtected')

    // The protected default is untouched: still isDefault Type 1 at its own holder.
    const c = api.getState().masters.contracts[CONTRACT.stgDefault]
    expect(c?.type).toBe(1)
    expect(c?.isDefault).toBe(true)
    expect(c?.holderId).toBe(HOSP.stg)
    // St George's still has exactly one protected default (the invariant holds).
    const defaults = Object.values(api.getState().masters.contracts).filter(
      (x) => x.isDefault && x.type === 1 && x.holderType === 'hospital' && x.holderId === HOSP.stg,
    )
    expect(defaults.length).toBe(1)
  })

  it('clears a stale type2Detail when a contract is changed off Type 2', () => {
    const api = createAppStore()
    const created = createContract(api, OFFICE, {
      name: 'Temp type 2', type: 2, holderType: 'hospital', holderId: HOSP.sx,
      scope: { kind: 'organisation' }, permitsIndividualArrangement: false, effectiveFromISO: '2026-01-01',
      type2Detail: { basis: 'agreedUnitRate', unitRate: 30 },
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    expect(editContract(api, OFFICE, created.value.contract.id, { type: 1 }).ok).toBe(true)
    expect(api.getState().masters.contracts[created.value.contract.id]?.type2Detail).toBeUndefined()
  })

  it('adds and edits a Type 3 price row', () => {
    const api = createAppStore()
    const add = addContractPrice(api, OFFICE, { contractId: CONTRACT.doyleBariatric, rvgBaseCode: '20884', price: 3100 })
    expect(add.ok).toBe(true)
    if (!add.ok) return
    expect(add.value.id.startsWith('CPN')).toBe(true)
    expect(api.getState().masters.contractPrices[add.value.id]?.price).toBe(3100)
    expect(editContractPrice(api, OFFICE, add.value.id, { price: 3200 }).ok).toBe(true)
    expect(api.getState().masters.contractPrices[add.value.id]?.price).toBe(3200)
  })

  it('is office-only across the contract surface', () => {
    const api = createAppStore()
    expect(createContract(api, SOUTER, { name: 'x', type: 1, holderType: 'hospital', holderId: HOSP.sx, scope: { kind: 'organisation' }, permitsIndividualArrangement: false, effectiveFromISO: '2026-01-01' }).ok).toBe(false)
    expect(deleteContract(api, SOUTER, CONTRACT.sxap).ok).toBe(false)
  })
})
