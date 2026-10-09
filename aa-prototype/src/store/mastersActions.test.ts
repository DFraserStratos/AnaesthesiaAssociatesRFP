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
import { bookingsForList, proceduresForBooking } from './selectors'
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
import { ANAE, CONTRACT, HOSP, SEED_LEAVE, SEED_MARKERS, SURG, generateCanvasForDates } from '../domain/seed'
import { slotIdFor } from '../domain/slots'
import { assignListToSlot, reassignList } from './slotActions'
import { advanceClockDays } from './clockActions'
import { rosterForDate } from './selectors'

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
    const outcome = editAnaesthetist(api, OFFICE, ANAE.souter, { unitValue: 40, phone: '021 000 0000' })
    expect(outcome.ok).toBe(true)
    const anae = api.getState().masters.anaesthetists[ANAE.souter]
    expect(anae?.unitValue).toBe(40)
    expect(anae?.phone).toBe('021 000 0000')
    const entry = api.getState().audit.at(-1)
    expect(entry?.action).toBe('anaesthetist.update')
    expect(entry?.entityId).toBe(ANAE.souter)
    // Souter has Lists ahead, so switching her off is refused until they are reassigned (catch-up Phase 28).
    const off = editAnaesthetist(api, OFFICE, ANAE.souter, { active: false })
    expect(off.ok ? '' : off.code).toBe('listsAhead')
    expect(api.getState().masters.anaesthetists[ANAE.souter]?.active).toBe(true)
  })

  it('re-prices a Type 1 fee that reads the anaesthetist unit value', () => {
    const api = createAppStore()
    const booking = bookingsForList(api.getState(), MORRISON_LIST)[0]
    if (booking === undefined) throw new Error('no booking')
    const proc = proceduresForBooking(api.getState(), booking.id)[0]
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

describe('addAnaesthetist (catch-up Phase 28: Slots from the start date, US-01.1.3)', () => {
  const NEW = { registrationNumber: '99001', name: 'Dr New Person', phone: '021 555 9001', email: 'n.person@aa-associates.example', unitValue: 30, gstPeriod: 'monthly' as const }

  function theirSlots(api: ReturnType<typeof createAppStore>, reg = '99001') {
    return Object.values(api.getState().schedule.slots).filter((s) => s.anaesthetistId === reg)
  }

  it('from today: two free Slots per day to the horizon end, deep-matching a fresh generation, audited', () => {
    const api = createAppStore()
    const todayISO = api.getState().clock.todayISO
    const outcome = addAnaesthetist(api, OFFICE, { ...NEW, startDateISO: todayISO })
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const state = api.getState()
    expect(state.masters.anaesthetists['99001']).toMatchObject({ name: 'Dr New Person', startDateISO: todayISO, active: true })

    const slots = theirSlots(api)
    const dates = enumerateDatesISO(todayISO, horizonFor(todayISO, 4).endISO)
    expect(slots.length).toBe(dates.length * 2)
    expect(outcome.value.generatedSlots).toBe(slots.length)
    expect(outcome.value.fromISO).toBe(todayISO)
    // A new anaesthetist has no recurring booking: every session is free, and no List is created.
    expect(slots.every((s) => s.status === 'free')).toBe(true)
    expect(Object.values(state.schedule.lists).some((l) => l.anaesthetistId === '99001')).toBe(false)

    const fresh = generateCanvasForDates(
      { anaesthetists: [{ id: '99001', startDateISO: todayISO, active: true }], permanentLists: Object.values(state.masters.permanentLists), leave: SEED_LEAVE, holidays: Object.values(state.masters.holidays) },
      dates,
    )
    const stored = new Map(slots.map((s) => [s.id, s]))
    for (const f of fresh.slots) expect(stored.get(f.id)).toEqual(f)

    const actions = state.audit.slice(-2).map((a) => a.action)
    expect(actions).toEqual(['anaesthetist.create', 'canvas.generate'])
    expect(state.audit.at(-1)?.after).toMatchObject({ slots: slots.length, lists: 0, fromISO: todayISO })
  })

  it('from a future date inside the horizon: no Slot before it', () => {
    const api = createAppStore()
    expect(addAnaesthetist(api, OFFICE, { ...NEW, startDateISO: '2026-08-03' }).ok).toBe(true)
    const slots = theirSlots(api)
    expect(slots.length).toBeGreaterThan(0)
    expect(slots.every((s) => s.dateISO >= '2026-08-03')).toBe(true)
    expect(slots.some((s) => s.dateISO === '2026-08-03')).toBe(true)
  })

  it('from a date beyond the horizon: none yet, then the roll-forward creates them when the horizon reaches it', () => {
    const api = createAppStore()
    const end = horizonFor(api.getState().clock.todayISO, 4).endISO
    const outcome = addAnaesthetist(api, OFFICE, { ...NEW, startDateISO: '2026-11-23' })
    expect(end).toBe('2026-11-21')
    expect(outcome.ok && outcome.value.generatedSlots).toBe(0)
    expect(theirSlots(api)).toHaveLength(0)
    advanceClockDays(api, 3)
    const after = theirSlots(api)
    expect(after.map((s) => s.dateISO).sort()).toEqual(['2026-11-23', '2026-11-23', '2026-11-24', '2026-11-24'])
  })

  it('refuses a missing or malformed start date, a duplicate registration number, and is office-only', () => {
    const api = createAppStore()
    const bad = addAnaesthetist(api, OFFICE, { ...NEW, startDateISO: '' })
    expect(bad.ok ? '' : bad.code).toBe('invalidStartDate')
    const dup = addAnaesthetist(api, OFFICE, { ...NEW, registrationNumber: ANAE.souter, startDateISO: '2026-07-21' })
    expect(dup.ok ? '' : dup.code).toBe('duplicateRegistration')
    expect(addAnaesthetist(api, SOUTER, { ...NEW, startDateISO: '2026-07-21' }).ok).toBe(false)
  })
})

describe('editAnaesthetist: start date and active (catch-up Phase 28; US-01.1.3, FT-01.1)', () => {
  const NEW = { registrationNumber: '99002', name: 'Dr Second Person', phone: '', email: '', unitValue: 30, gstPeriod: 'monthly' as const }
  const slotsOf = (api: ReturnType<typeof createAppStore>) =>
    Object.values(api.getState().schedule.slots).filter((s) => s.anaesthetistId === '99002')

  it('moving the start date earlier fills the Slots in, later removes the early ones, and nothing before today is touched', () => {
    const api = createAppStore()
    addAnaesthetist(api, OFFICE, { ...NEW, startDateISO: '2026-08-03' })
    expect(editAnaesthetist(api, OFFICE, '99002', { startDateISO: '2026-07-29' }).ok).toBe(true)
    expect(slotsOf(api).some((s) => s.dateISO === '2026-07-29')).toBe(true)
    expect(slotsOf(api).some((s) => s.dateISO < '2026-07-29')).toBe(false)
    expect(api.getState().audit.at(-1)?.action).toBe('canvas.generate')

    expect(editAnaesthetist(api, OFFICE, '99002', { startDateISO: '2026-08-05' }).ok).toBe(true)
    expect(slotsOf(api).some((s) => s.dateISO < '2026-08-05')).toBe(false)
    expect(api.getState().audit.at(-1)?.action).toBe('canvas.trim')

    // A start date in the past never creates past Slots (only today on is touched).
    expect(editAnaesthetist(api, OFFICE, '99002', { startDateISO: '2026-07-01' }).ok).toBe(true)
    expect(slotsOf(api).every((s) => s.dateISO >= '2026-07-21')).toBe(true)
  })

  it('refuses a later start date while a removed session holds a List (listsBeforeStart)', () => {
    const api = createAppStore()
    addAnaesthetist(api, OFFICE, { ...NEW, startDateISO: '2026-08-03' })
    const slotId = slotIdFor('99002', '2026-08-03', 'AM')
    expect(assignListToSlot(api, OFFICE, slotId, { hospitalId: HOSP.stg, surgeonId: SURG.hale, kind: 'private' }).ok).toBe(true)
    const before = api.getState()
    const out = editAnaesthetist(api, OFFICE, '99002', { startDateISO: '2026-08-04' })
    expect(out.ok ? '' : out.code).toBe('listsBeforeStart')
    expect(out.ok ? '' : out.message).toBe('Dr Second Person has 1 List before that date. Reassign it first.')
    expect(api.getState().schedule).toBe(before.schedule)
  })

  it('switching inactive removes the Slots from today on (refused while a List stands); active again brings them back', () => {
    const api = createAppStore()
    addAnaesthetist(api, OFFICE, { ...NEW, startDateISO: '2026-07-21' })
    const slotId = slotIdFor('99002', '2026-07-22', 'PM')
    expect(assignListToSlot(api, OFFICE, slotId, { hospitalId: HOSP.stg, surgeonId: SURG.hale, kind: 'private' }).ok).toBe(true)
    const refused = editAnaesthetist(api, OFFICE, '99002', { active: false })
    expect(refused.ok ? '' : refused.code).toBe('listsAhead')
    expect(refused.ok ? '' : refused.message).toBe('Dr Second Person has 1 List from today. Reassign it first.')
    expect(api.getState().masters.anaesthetists['99002']?.active).toBe(true)

    const listId = Object.values(api.getState().schedule.lists).find((l) => l.slotId === slotId)!.id
    expect(reassignList(api, OFFICE, listId, ANAE.souter).ok).toBe(true)
    expect(editAnaesthetist(api, OFFICE, '99002', { active: false }).ok).toBe(true)
    expect(slotsOf(api)).toHaveLength(0)
    expect(rosterForDate(api.getState(), '2026-07-22').some((a) => a.registrationNumber === '99002')).toBe(false)

    expect(editAnaesthetist(api, OFFICE, '99002', { active: true }).ok).toBe(true)
    expect(slotsOf(api).length).toBe(enumerateDatesISO('2026-07-21', '2026-11-21').length * 2)
  })

  it('an inactive anaesthetist gets no Slots on roll-forward, and keeps past days', () => {
    const api = createAppStore()
    addAnaesthetist(api, OFFICE, { ...NEW, startDateISO: '2026-07-21' })
    advanceClockDays(api, 1)
    expect(editAnaesthetist(api, OFFICE, '99002', { active: false }).ok).toBe(true)
    advanceClockDays(api, 2)
    // Only Tue 21, the day before today when the switch went off, keeps its two Slots.
    expect(slotsOf(api).map((s) => s.dateISO)).toEqual(['2026-07-21', '2026-07-21'])
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
      kind: 'private',
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
    const denied = addPermanentList(api, SOUTER, { anaesthetistId: ANAE.souter, dayOfWeek: 1, session: 'AM', kind: 'private', hospitalId: null, surgeonId: null })
    expect(denied.ok).toBe(false)
  })

  it('takes a kind (private, public or pre-op) and optional times, refusing anything else (catch-up Phase 28)', () => {
    const api = createAppStore()
    const base = { anaesthetistId: ANAE.souter, dayOfWeek: 3 as const, session: 'PM' as const, hospitalId: null, surgeonId: null }
    const free = addPermanentList(api, OFFICE, { ...base, kind: 'free' as never })
    expect(free.ok ? '' : free.code).toBe('invalidKind')
    const backwards = addPermanentList(api, OFFICE, { ...base, kind: 'preop', startTime: '15:00', endTime: '14:00' })
    expect(backwards.ok ? '' : backwards.code).toBe('invalidTimes')
    const ok = addPermanentList(api, OFFICE, { ...base, kind: 'preop', startTime: '13:30', endTime: '' })
    expect(ok.ok).toBe(true)
    if (ok.ok) expect(api.getState().masters.permanentLists[ok.value.id]).toMatchObject({ kind: 'preop', startTime: '13:30' })
    if (ok.ok) expect(api.getState().masters.permanentLists[ok.value.id]?.endTime).toBeUndefined()
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
