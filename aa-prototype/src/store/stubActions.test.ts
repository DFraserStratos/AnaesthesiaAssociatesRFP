/**
 * Catch-up Phase 33a: stubs placed, settled and resolved through the one
 * path (US-02.6.1, US-02.6.3, DM-58, D66), against the real seed.
 */
import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from './appStore'
import { OFFICE_ACTOR, OFFICE_SIMULATION_ACTOR } from './demoActors'
import { decideImportRow, stageImportRows } from './matchingActions'
import { receiveHospitalBatch } from './intakeIngest'
import { receiveSample } from '../test/intakeSamples'
import { assessImportRow } from './matchingSelectors'
import { resolveStub } from './stubActions'
import { standingStubCount, stubForRow, stubsForList } from './stubSelectors'
import { needsInvoiceDestinationBookings } from './selectors'
import { createDraftList, redateDraftList, removeDraftList } from './draftListActions'
import { reassignList } from './slotActions'
import { SAMPLE_SX, SX_NO_NHI_TYPED } from '../domain/intake'
import { SEED_STUB } from '../domain/seed/intakeSeed'
import type { Actor } from './mutate'

const ANAESTHETIST: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }
const R4_LIST = 'L-34821-2026-12-01-PM'

function fresh(): AppStoreApi {
  return createAppStore()
}

function domainOf(api: AppStoreApi): string {
  const s = api.getState()
  return JSON.stringify({ schedule: s.schedule, intake: s.intake, patients: s.masters.patients, counters: s.counters, audit: s.audit.length })
}

function sxRowIds(api: AppStoreApi): string[] {
  return receiveSample(api, SAMPLE_SX).rowIds
}

describe('the seeded stub', () => {
  it('stands on Dr Souter\'s Tue 8 Dec PM List for a waiting row, on its own id, never a Booking', () => {
    const s = fresh().getState()
    const stub = s.intake.stubs[SEED_STUB.stubId]!
    expect(stub).toMatchObject({ status: 'standing', listId: SEED_STUB.listId, importRowId: SEED_STUB.rowId, reason: 'noNhi' })
    expect(s.schedule.lists[SEED_STUB.listId]).toMatchObject({ state: 'ACTIVE', hospitalId: 'H-SX', surgeonId: 'S-PATEL' })
    expect(s.schedule.bookings[stub.id]).toBeUndefined()
    expect(stub.id).not.toContain(SEED_STUB.nhiToType)
    expect(assessImportRow(s, SEED_STUB.rowId)).toMatchObject({ waitingForNhi: true, targetListId: SEED_STUB.listId, queue: 'unmatched' })
    expect(stubsForList(s, SEED_STUB.listId).map((x) => x.id)).toEqual([SEED_STUB.stubId])
    expect(Object.values(s.masters.patients).some((p) => p.nhi === SEED_STUB.nhiToType)).toBe(false)
  })
})

describe('placing (US-02.6.1)', () => {
  it("Southern Cross R4 (no NHI) waits and places a stub on its List; the file's other rows place none; audited", () => {
    const api = fresh()
    const bookingsBefore = Object.keys(api.getState().schedule.bookings).length
    const rows = sxRowIds(api)
    const r4 = rows[3]!
    const s = api.getState()
    expect(Object.keys(s.schedule.bookings)).toHaveLength(bookingsBefore)
    const stub = stubForRow(s, r4)!
    expect(stub).toMatchObject({ listId: R4_LIST, status: 'standing', asReceived: { patientName: 'Tama Henare', procedureText: 'T&A', scheduledTime: '15:30' } })
    expect(stub.id).toBe('STB0002')
    expect(standingStubCount(s)).toBe(2)
    expect(s.audit.filter((a) => a.action === 'stub.place').map((a) => a.entityId)).toEqual(['STB0002'])
  })
  it('a re-import places no second stub', () => {
    const api = fresh()
    sxRowIds(api)
    // The same file again while its rows are open: refused, every row already waiting.
    expect(receiveHospitalBatch(api, SAMPLE_SX.hospitalId, SAMPLE_SX.label, SAMPLE_SX.rows, { sampleId: SAMPLE_SX.id })).toMatchObject({ ok: false, code: 'alreadyWaiting' })
    expect(standingStubCount(api.getState())).toBe(2)
  })
  it('a row with no List to land on places none', () => {
    const api = fresh()
    const staged = stageImportRows(api, OFFICE_ACTOR, 'download', 'H-SX', 'Test', [
      { hospitalId: 'H-SX', dateISO: '2026-12-10', session: 'PM', surgeon: { name: 'Ms K. Patel', hpiId: '41PATK' }, patient: { name: 'Nobody Listed' }, procedure: { text: 'Lap chole' }, hospitalStatus: 'booked' },
    ])
    expect(staged.ok).toBe(true)
    expect(standingStubCount(api.getState())).toBe(1)
  })
})

describe('resolveStub (US-02.6.3)', () => {
  it('Add NHI with an invalid NHI is refused and changes nothing', () => {
    const api = fresh()
    const before = domainOf(api)
    expect(resolveStub(api, OFFICE_ACTOR, SEED_STUB.stubId, { kind: 'addNhi', nhi: 'ZQA1025' })).toMatchObject({ ok: false, code: 'invalidNhi' })
    expect(domainOf(api)).toBe(before)
  })
  it('Add NHI creates the Booking in the stub\'s place, with no Contract, through decideImportRow; the stub is resolved in the same commit', () => {
    const api = fresh()
    const res = resolveStub(api, OFFICE_ACTOR, SEED_STUB.stubId, { kind: 'addNhi', nhi: SEED_STUB.nhiToType })
    expect(res.ok).toBe(true)
    if (!res.ok || res.value.kind !== 'resolved') throw new Error('not resolved')
    const s = api.getState()
    const booking = s.schedule.bookings[res.value.bookingId]!
    expect(booking.listId).toBe(SEED_STUB.listId)
    expect(s.masters.patients[booking.patientId]?.nhi).toBe(SEED_STUB.nhiToType)
    expect(s.intake.stubs[SEED_STUB.stubId]).toMatchObject({ status: 'resolved', bookingId: booking.id, settledBy: OFFICE_ACTOR.who })
    expect(s.intake.rows[SEED_STUB.rowId]).toMatchObject({ status: 'applied', decision: { kind: 'createBooking', listId: SEED_STUB.listId } })
    expect(stubsForList(s, SEED_STUB.listId)).toEqual([])
    expect(needsInvoiceDestinationBookings(s).some((r) => r.bookingId === booking.id)).toBe(true)
    const actions = s.audit.map((a) => a.action)
    expect(actions).toContain('importRow.correct')
    const decideAt = actions.lastIndexOf('importRow.decide')
    const resolveAt = actions.lastIndexOf('stub.resolve')
    expect(decideAt).toBeGreaterThan(-1)
    expect(resolveAt).toBeGreaterThan(-1)
    // One commit: the row's decision and the stub's settling share a timestamp and sit side by side.
    expect(Math.abs(resolveAt - decideAt)).toBeLessThanOrEqual(2)
  })
  it('Add NHI on Southern Cross R4 lands the Booking on its List', () => {
    const api = fresh()
    const r4 = sxRowIds(api)[3]!
    const stub = stubForRow(api.getState(), r4)!
    const res = resolveStub(api, OFFICE_ACTOR, stub.id, { kind: 'addNhi', nhi: SX_NO_NHI_TYPED })
    expect(res).toMatchObject({ ok: true, value: { kind: 'resolved', listId: R4_LIST } })
  })
  it('Reject removes the stub through decideImportRow; a blank reason is refused and changes nothing', () => {
    const api = fresh()
    const before = domainOf(api)
    expect(resolveStub(api, OFFICE_ACTOR, SEED_STUB.stubId, { kind: 'reject', reason: '  ' })).toMatchObject({ ok: false, code: 'reasonRequired' })
    expect(domainOf(api)).toBe(before)
    expect(resolveStub(api, OFFICE_ACTOR, SEED_STUB.stubId, { kind: 'reject', reason: 'Patient not ours' })).toMatchObject({ ok: true, value: { kind: 'removed' } })
    const s = api.getState()
    expect(s.intake.stubs[SEED_STUB.stubId]).toMatchObject({ status: 'removed' })
    expect(s.intake.rows[SEED_STUB.rowId]?.status).toBe('rejected')
    expect(s.audit.some((a) => a.action === 'stub.remove' && a.entityId === SEED_STUB.stubId)).toBe(true)
  })
  it("deciding the row on Matching directly settles its stub too (the panel's Reject)", () => {
    const api = fresh()
    expect(decideImportRow(api, OFFICE_ACTOR, SEED_STUB.rowId, { kind: 'reject', reason: 'Duplicate' }).ok).toBe(true)
    expect(api.getState().intake.stubs[SEED_STUB.stubId]?.status).toBe('removed')
  })
  it('stops after the NHI when the matcher no longer suggests the stub\'s List; the stub stands', () => {
    const api = fresh()
    // The stub has (somehow) another List than the row now lands on.
    api.setState((s) => ({ intake: { ...s.intake, stubs: { ...s.intake.stubs, [SEED_STUB.stubId]: { ...s.intake.stubs[SEED_STUB.stubId]!, listId: R4_LIST } } } }))
    const res = resolveStub(api, OFFICE_ACTOR, SEED_STUB.stubId, { kind: 'addNhi', nhi: SEED_STUB.nhiToType })
    expect(res).toMatchObject({ ok: true, value: { kind: 'needsDecision', reason: expect.stringContaining('Choose a decision') } })
    const s = api.getState()
    expect(s.intake.rows[SEED_STUB.rowId]).toMatchObject({ status: 'open', corrections: { nhi: SEED_STUB.nhiToType } })
    expect(s.intake.stubs[SEED_STUB.stubId]?.status).toBe('standing')
  })
  it('refuses an anaesthetist, a settled stub and an unknown one; the PWA stand-in acts as the office', () => {
    const api = fresh()
    expect(resolveStub(api, ANAESTHETIST, SEED_STUB.stubId, { kind: 'addNhi', nhi: SEED_STUB.nhiToType })).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(resolveStub(api, OFFICE_ACTOR, 'STB9999', { kind: 'reject', reason: 'x' })).toMatchObject({ ok: false, code: 'notFound' })
    expect(resolveStub(api, OFFICE_SIMULATION_ACTOR, SEED_STUB.stubId, { kind: 'addNhi', nhi: SEED_STUB.nhiToType }).ok).toBe(true)
    expect(resolveStub(api, OFFICE_ACTOR, SEED_STUB.stubId, { kind: 'reject', reason: 'x' })).toMatchObject({ ok: false, code: 'stubSettled' })
  })
})

describe('Add NHI never dead-ends (review fix)', () => {
  it('a row with no wording keeps the NHI and hands the decision to the office; the stub stands', () => {
    const api = fresh()
    // R4's wording blanked: the create would be refused (Choose an RVG code first).
    api.setState((s) => {
      const row = s.intake.rows[SEED_STUB.rowId]!
      return { intake: { ...s.intake, rows: { ...s.intake.rows, [row.id]: { ...row, incoming: { ...row.incoming, procedure: {} } } } } }
    })
    const res = resolveStub(api, OFFICE_ACTOR, SEED_STUB.stubId, { kind: 'addNhi', nhi: SEED_STUB.nhiToType })
    expect(res).toMatchObject({ ok: true, value: { kind: 'needsDecision', reason: expect.stringContaining('RVG code') } })
    const s = api.getState()
    expect(s.intake.rows[SEED_STUB.rowId]).toMatchObject({ status: 'open', corrections: { nhi: SEED_STUB.nhiToType } })
    expect(s.intake.stubs[SEED_STUB.stubId]?.status).toBe('standing')
    // The office then decides on Matching with an RVG code: the decision settles the stub.
    const groupId = Object.keys(s.masters.rvgGroups)[0]!
    const decided = decideImportRow(api, OFFICE_ACTOR, SEED_STUB.rowId, { kind: 'createBooking', listId: SEED_STUB.listId, picks: { rvgGroupId: groupId } })
    expect(decided.ok).toBe(true)
    expect(api.getState().intake.stubs[SEED_STUB.stubId]?.status).toBe('resolved')
  })
})

describe('the List changes', () => {
  it('a stub follows its List when the office reassigns it', () => {
    const api = fresh()
    const others = Object.keys(api.getState().masters.anaesthetists).filter((id) => id !== '34821')
    const moved = others.some((id) => reassignList(api, OFFICE_ACTOR, SEED_STUB.listId, id).ok)
    expect(moved).toBe(true)
    const s = api.getState()
    expect(s.schedule.lists[SEED_STUB.listId]?.anaesthetistId).not.toBe('34821')
    expect(stubsForList(s, SEED_STUB.listId).map((x) => x.id)).toEqual([SEED_STUB.stubId])
  })
  it('a List removed by another path hides its stub (the row still waits)', () => {
    const api = fresh()
    api.setState((s) => ({ schedule: { ...s.schedule, lists: { ...s.schedule.lists, [SEED_STUB.listId]: { ...s.schedule.lists[SEED_STUB.listId]!, removedAtISO: '2026-11-24T09:00:00' } } } }))
    expect(stubsForList(api.getState(), SEED_STUB.listId)).toEqual([])
    expect(api.getState().intake.rows[SEED_STUB.rowId]?.status).toBe('open')
  })
  function stubOnDraft(api: AppStoreApi): { listId: string; rowId: string; stubId: string } {
    // A day with no Southern Cross List for Ms Patel, so the row lands on the new Draft List.
    const taken = new Set(Object.values(api.getState().schedule.lists).filter((l) => l.hospitalId === 'H-SX' && l.surgeonId === 'S-PATEL' && l.session === 'PM').map((l) => l.dateISO))
    const dateISO = ['2026-12-16', '2026-12-17', '2026-12-18', '2026-12-23', '2026-12-24'].find((d) => !taken.has(d))!
    const draft = createDraftList(api, OFFICE_ACTOR, { hospitalId: 'H-SX', surgeonId: 'S-PATEL', dateISO, session: 'PM', note: 'Test' }, 'hospitalRow')
    if (!draft.ok) throw new Error(draft.message)
    const staged = stageImportRows(api, OFFICE_ACTOR, 'download', 'H-SX', 'Test file', [
      { hospitalId: 'H-SX', dateISO, session: 'PM', surgeon: { name: 'Ms K. Patel', hpiId: '41PATK' }, scheduledTime: '13:30', patient: { name: 'Ana Draft' }, procedure: { text: 'Lap chole' }, hospitalStatus: 'booked' },
    ])
    if (!staged.ok) throw new Error(staged.message)
    const rowId = staged.value.rowIds[0]!
    const stub = stubForRow(api.getState(), rowId)
    if (stub === undefined) throw new Error('no stub on the Draft List')
    expect(stub.listId).toBe(draft.value.listId)
    return { listId: draft.value.listId, rowId, stubId: stub.id }
  }
  it('removing a Draft List takes its stub off; the row keeps waiting', () => {
    const api = fresh()
    const { listId, rowId, stubId } = stubOnDraft(api)
    expect(removeDraftList(api, OFFICE_ACTOR, listId, 'Cancelled').ok).toBe(true)
    const s = api.getState()
    expect(s.intake.stubs[stubId]).toMatchObject({ status: 'removed' })
    expect(s.intake.rows[rowId]?.status).toBe('open')
    expect(s.audit.some((a) => a.action === 'stub.remove' && a.entityId === stubId)).toBe(true)
  })
  it('re-dating a Draft List takes its stub off too', () => {
    const api = fresh()
    const { listId, stubId } = stubOnDraft(api)
    const date = api.getState().schedule.lists[listId]!.dateISO
    expect(redateDraftList(api, OFFICE_ACTOR, listId, { dateISO: date, session: 'AM' }).ok).toBe(true)
    expect(api.getState().intake.stubs[stubId]?.status).toBe('removed')
  })
})
