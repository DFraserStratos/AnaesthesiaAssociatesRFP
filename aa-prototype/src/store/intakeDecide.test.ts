/**
 * The one List-level decision path (build plan Phase 68; D118): a List's rows decided together as ONE change set,
 * each applied, left out (its own kind), rejected or a removal confirmed, with an optional placement; refused as a
 * whole.
 */
import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { stageImportRows } from './matchingActions'
import { assessImportRow, matchingView } from './matchingSelectors'
import { decideArrivingLists } from './intakeDecide'
import type { Actor } from './mutate'
import type { IncomingBookingFields } from '../domain/types'
import { HOSP } from '../domain/seed/cast'

const ANAESTHETIST: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }
/** Valid NHIs no seeded patient holds (the intake samples' own). */
const NEW_NHIS = ['ZQA3019', 'ZQA2110'] as const

function fresh(): AppStoreApi {
  return createAppStore()
}

/** A row the hospital would send for an existing Booking, identical to it (no difference: No change). */
function rowFromBooking(api: AppStoreApi, bookingId: string): IncomingBookingFields {
  const s = api.getState()
  const booking = s.schedule.bookings[bookingId]!
  const list = s.schedule.lists[booking.listId]!
  const patient = s.masters.patients[booking.patientId]!
  const surgeon = list.surgeonId !== undefined && list.surgeonId !== null ? s.masters.surgeons[list.surgeonId] : undefined
  return {
    hospitalId: list.hospitalId,
    dateISO: list.dateISO,
    session: list.session,
    ...(surgeon !== undefined ? { surgeon: { name: surgeon.name, ...(surgeon.hpiId !== undefined ? { hpiId: surgeon.hpiId } : {}) } } : {}),
    patient: { name: patient.name, ...(patient.nhi !== undefined ? { nhi: patient.nhi } : {}), ...(patient.dobISO !== undefined && patient.dobISO !== '' ? { dobISO: patient.dobISO } : {}) },
    hospitalStatus: 'booked',
  }
}

/** Two live Bookings on two different ACTIVE hospital Lists, each a row that matches exactly. */
function twoMatchedBookings(api: AppStoreApi): [string, string] {
  const s = api.getState()
  const view = matchingView(s)
  const picked: string[] = []
  const lists = new Set<string>()
  for (const b of Object.values(view.bookings).sort((a, c) => a.id.localeCompare(c.id))) {
    const list = view.lists[b.listId]
    if (b.cancelled || list === undefined || list.state !== 'ACTIVE' || list.surgeonId === undefined || b.patient.nhi === undefined || lists.has(list.id)) continue
    if (s.masters.hospitals[list.hospitalId]?.locationType !== 'hospital') continue
    const staged = stageImportRows(api, OFFICE_ACTOR, 'download', list.hospitalId, 'probe', [rowFromBooking(api, b.id)])
    const rowId = staged.ok ? staged.value.rowIds[0] : undefined
    const ok = rowId !== undefined && assessImportRow(api.getState(), rowId)?.changeType === 'noChange'
    api.setState({ intake: s.intake, counters: s.counters, audit: s.audit })
    if (!ok) continue
    picked.push(b.id)
    lists.add(list.id)
    if (picked.length === 2) break
  }
  return picked as [string, string]
}

function stage(api: AppStoreApi, rows: IncomingBookingFields[], hospitalId: string = rows[0]!.hospitalId): string[] {
  const res = stageImportRows(api, OFFICE_ACTOR, 'download', hospitalId, 'Test batch', rows)
  if (!res.ok) throw new Error(res.message)
  return res.value.rowIds
}

function changeSetsSince(api: AppStoreApi, from: number): Set<string | undefined> {
  return new Set(api.getState().audit.slice(from).map((a) => a.changeSetId))
}

describe('decideArrivingLists (D118)', () => {
  it('two unchanged Lists confirmed together are one change set', () => {
    const api = fresh()
    const [b1, b2] = twoMatchedBookings(api)
    const [r1] = stage(api, [rowFromBooking(api, b1)])
    const [r2] = stage(api, [rowFromBooking(api, b2)])
    const from = api.getState().audit.length
    const res = decideArrivingLists(api, OFFICE_ACTOR, [
      { rows: [{ rowId: r1!, kind: 'apply', input: { kind: 'match', bookingId: b1, fieldsApplied: [] } }] },
      { rows: [{ rowId: r2!, kind: 'apply', input: { kind: 'match', bookingId: b2, fieldsApplied: [] } }] },
    ])
    expect(res.ok).toBe(true)
    const sets = changeSetsSince(api, from)
    expect(sets.size).toBe(1)
    expect([...sets][0]).toBe(res.ok ? res.value.changeSetId : 'x')
    expect(api.getState().intake.rows[r1!]!.status).toBe('applied')
    expect(api.getState().intake.rows[r2!]!.decision).toMatchObject({ kind: 'match', changeType: 'noChange', listId: api.getState().schedule.bookings[b2]!.listId })
  })

  it('a List with one row left out is one change set; left out is its own kind, never a reject', () => {
    const api = fresh()
    const [b1, b2] = twoMatchedBookings(api)
    const rows = stage(api, [rowFromBooking(api, b1), rowFromBooking(api, b2)])
    const from = api.getState().audit.length
    const res = decideArrivingLists(api, OFFICE_ACTOR, [
      { rows: [{ rowId: rows[0]!, kind: 'apply', input: { kind: 'match', bookingId: b1, fieldsApplied: [] } }, { rowId: rows[1]!, kind: 'leaveOut', reason: 'Checking with the rooms' }] },
    ])
    expect(res).toMatchObject({ ok: true, value: { applied: [rows[0]], leftOut: [rows[1]] } })
    expect(changeSetsSince(api, from).size).toBe(1)
    const left = api.getState().intake.rows[rows[1]!]!
    expect(left.status).toBe('leftOut')
    expect(left.decision).toEqual({ kind: 'leftOut', reason: 'Checking with the rooms' })
    expect(api.getState().audit.slice(from).some((a) => a.action === 'importRow.decide' && (a.after as { status?: string }).status === 'leftOut')).toBe(true)
  })

  it('rejects with a reason; refuses as a whole, writing nothing, when any row refuses', () => {
    const api = fresh()
    const [b1] = twoMatchedBookings(api)
    const rows = stage(api, [rowFromBooking(api, b1), { ...rowFromBooking(api, b1), patient: { name: 'Nobody Here' } }])
    const before = api.getState()
    const refused = decideArrivingLists(api, OFFICE_ACTOR, [
      { rows: [{ rowId: rows[0]!, kind: 'apply', input: { kind: 'match', bookingId: b1, fieldsApplied: [] } }, { rowId: rows[1]!, kind: 'reject', reason: '  ' }] },
    ])
    expect(refused.ok).toBe(false)
    expect(api.getState().intake).toBe(before.intake)
    expect(api.getState().audit).toHaveLength(before.audit.length)
    const done = decideArrivingLists(api, OFFICE_ACTOR, [{ rows: [{ rowId: rows[1]!, kind: 'reject', reason: 'Not ours' }] }])
    expect(done).toMatchObject({ ok: true, value: { rejected: [rows[1]] } })
    expect(api.getState().intake.rows[rows[1]!]!.status).toBe('rejected')
  })

  it('a confirmed removal cancels the Booking through today’s cancel, kept and marked cancelled', () => {
    const api = fresh()
    const [b1] = twoMatchedBookings(api)
    const [rowId] = stage(api, [{ ...rowFromBooking(api, b1), hospitalStatus: 'cancelled', cancelReason: 'Not on the re-sent List' }])
    const s = api.getState()
    api.setState({ intake: { ...s.intake, rows: { ...s.intake.rows, [rowId!]: { ...s.intake.rows[rowId!]!, removalOfBookingId: b1 } } } })
    const res = decideArrivingLists(api, OFFICE_ACTOR, [{ rows: [{ rowId: rowId!, kind: 'confirmRemoval' }] }])
    expect(res).toMatchObject({ ok: true, value: { removed: [rowId] } })
    const booking = api.getState().schedule.bookings[b1]!
    expect(booking.cancellation).toBeDefined()
    expect(api.getState().intake.rows[rowId!]!.decision).toMatchObject({ kind: 'match', changeType: 'cancellation' })
  })

  it('a removal only for a removal row', () => {
    const api = fresh()
    const [b1] = twoMatchedBookings(api)
    const [rowId] = stage(api, [rowFromBooking(api, b1)])
    expect(decideArrivingLists(api, OFFICE_ACTOR, [{ rows: [{ rowId: rowId!, kind: 'confirmRemoval' }] }])).toMatchObject({ ok: false, code: 'notARemoval' })
  })

  it('places a new List in a free Slot: the first row makes the List, the second joins it, one change set', () => {
    const api = fresh()
    const s = api.getState()
    const view = matchingView(s)
    const slot = view.openSlots.filter((o) => o.dateISO > s.clock.todayISO).sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.id.localeCompare(b.id))[0]!
    const surgeon = Object.values(s.masters.surgeons).sort((a, b) => a.id.localeCompare(b.id))[0]!
    const base = { hospitalId: HOSP.stg, dateISO: slot.dateISO, session: slot.session, surgeon: { name: surgeon.name, ...(surgeon.hpiId !== undefined ? { hpiId: surgeon.hpiId } : {}) }, procedure: { text: 'Knee arthroscopy' }, hospitalStatus: 'booked' as const }
    const rows = stage(api, [
      { ...base, scheduledTime: '08:00', patient: { name: 'Ana Test', nhi: NEW_NHIS[0], dobISO: '1970-01-02' } },
      { ...base, scheduledTime: '09:00', patient: { name: 'Ben Test', nhi: NEW_NHIS[1], dobISO: '1971-02-03' } },
    ])
    const from = api.getState().audit.length
    const res = decideArrivingLists(api, OFFICE_ACTOR, [
      { placement: { kind: 'slot', slotId: slot.id, surgeonId: surgeon.id }, rows: rows.map((rowId) => ({ rowId, kind: 'place' as const })) },
    ])
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.value.placedListIds).toHaveLength(1)
    const listId = res.value.placedListIds[0]!
    expect(api.getState().schedule.lists[listId]).toMatchObject({ slotId: slot.id, hospitalId: HOSP.stg })
    expect(rows.map((r) => api.getState().intake.rows[r]!.decision?.kind)).toEqual(['createList', 'createBooking'])
    expect(changeSetsSince(api, from).size).toBe(1)
  })

  it('places a new List as a Draft List', () => {
    const api = fresh()
    const s = api.getState()
    const surgeon = Object.values(s.masters.surgeons).sort((a, b) => a.id.localeCompare(b.id))[0]!
    const rows = stage(api, [
      { hospitalId: HOSP.stg, dateISO: '2026-12-15', session: 'PM', surgeon: { name: surgeon.name }, procedure: { text: 'Hernia repair' }, patient: { name: 'Ana Test', nhi: NEW_NHIS[0], dobISO: '1970-01-02' }, hospitalStatus: 'booked' },
    ])
    const res = decideArrivingLists(api, OFFICE_ACTOR, [{ placement: { kind: 'draft', surgeonId: surgeon.id }, rows: [{ rowId: rows[0]!, kind: 'place' }] }])
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(api.getState().schedule.lists[res.value.placedListIds[0]!]?.state).toBe('DRAFT')
  })

  it('office only; a place row needs a placement; nothing to decide refuses', () => {
    const api = fresh()
    const [b1] = twoMatchedBookings(api)
    const [rowId] = stage(api, [rowFromBooking(api, b1)])
    expect(decideArrivingLists(api, ANAESTHETIST, [{ rows: [{ rowId: rowId!, kind: 'leaveOut' }] }])).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(decideArrivingLists(api, OFFICE_ACTOR, [{ rows: [{ rowId: rowId!, kind: 'place' }] }])).toMatchObject({ ok: false, code: 'placementRequired' })
    expect(decideArrivingLists(api, OFFICE_ACTOR, [{ rows: [] }])).toMatchObject({ ok: false, code: 'nothingToDecide' })
  })
})
