/**
 * Updates to a List AA holds (build plan Phase 69; US-02.1.2, US-02.1.3, US-02.2.3, DM-13, DM-17, D118, D125): a whole
 * List applied, left out row by row, rejected, or a cancellation decided, always through `decideArrivingLists` as one
 * change set or nothing. Against the core seed and the Okafor story (`OKAFOR_STORY`).
 */
import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { decideArrivingLists } from './intakeDecide'
import { arrivalFeedCounts, arrivalItemsOf, arrivalRows } from './intakeSelectors'
import { receiveCancellation, receiveHospitalBatch, receiveMailboxPdf, stgDayBeforeRows } from './intakeIngest'
import {
  CHOOSE_STUB_MESSAGE,
  REJECT_REASON_REQUIRED_MESSAGE,
  WAITS_FOR_NHI_MESSAGE,
  applyArrivingList,
  applyBlockers,
  decideCancellation,
  rejectArrivingList,
  stubCandidates,
} from './intakeApply'
import { LIST_LOCKED_MESSAGE, WORDING_OR_CODE_MESSAGE } from './matchingActions'
import { assessImportRow, matchingView } from './matchingSelectors'
import type { Actor } from './mutate'
import { OKAFOR_STORY, OKAFOR_STORY_LIST, OKAFOR_STORY_PATIENTS, type MailboxPdfSample } from '../domain/intake/hospitalDownloads'
import { SEED_STUB } from '../domain/seed/intakeSeed'
import { HOSP } from '../domain/seed/cast'
import type { IncomingBookingFields, List } from '../domain/types'

const ANAESTHETIST: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }
const P = OKAFOR_STORY_PATIENTS

function fresh(): AppStoreApi {
  return createAppStore()
}

/** The arriving List item of a batch (never a Needs NHI item). */
function listItemOf(api: AppStoreApi, batchId: string) {
  const item = arrivalItemsOf(api.getState()).find((i) => i.batchId === batchId && i.kind !== 'needsNhi')
  if (item === undefined) throw new Error(`no arriving List for ${batchId}`)
  return item
}

function changeSetsSince(api: AppStoreApi, from: number): Set<string | undefined> {
  return new Set(api.getState().audit.slice(from).map((a) => a.changeSetId))
}

/** The patient's Booking on a List, by NHI. */
function bookingOf(api: AppStoreApi, listId: string, nhi: string) {
  const s = api.getState()
  return Object.values(s.schedule.bookings).find((b) => b.listId === listId && s.masters.patients[b.patientId]?.nhi === nhi)
}

/** Mr Okafor's rooms PDF arrives and the office places its rows (not the one waiting for an NHI) in Dr Rutherford's free PM session. */
function placeOkaforList(api: AppStoreApi): { listId: string; batchId: string } {
  const first = receiveMailboxPdf(api, OKAFOR_STORY.roomsList)
  if (!first.ok) throw new Error(first.message)
  const s = api.getState()
  const slot = matchingView(s).openSlots.find(
    (o) => o.anaesthetistId === OKAFOR_STORY_LIST.anaesthetistId && o.dateISO === OKAFOR_STORY_LIST.dateISO && o.session === OKAFOR_STORY_LIST.session,
  )
  if (slot === undefined) throw new Error("Dr Rutherford's session is not free")
  const placeable = first.value.rowIds.filter((id) => s.intake.rows[id]!.incoming.patient.nhi !== undefined)
  const placed = decideArrivingLists(api, OFFICE_ACTOR, [
    { placement: { kind: 'slot', slotId: slot.id, surgeonId: OKAFOR_STORY_LIST.surgeonId }, rows: placeable.map((rowId) => ({ rowId, kind: 'place' as const })) },
  ])
  if (!placed.ok) throw new Error(placed.message)
  return { listId: placed.value.placedListIds[0]!, batchId: first.value.batchId }
}

/** The re-send's rows by patient name. */
function resend(api: AppStoreApi) {
  const re = receiveMailboxPdf(api, OKAFOR_STORY.roomsResend)
  if (!re.ok) throw new Error(re.message)
  const item = listItemOf(api, re.value.batchId)
  const rows = api.getState().intake.rows
  const byName = (name: string) => item.rowIds.find((id) => rows[id]!.incoming.patient.name === name && rows[id]!.removalOfBookingId === undefined)!
  return {
    key: item.key,
    item,
    ngata: byName(P.ngata.name),
    lindqvist: byName(P.lindqvist.name),
    brooks: byName(P.brooks.name),
    removal: re.value.removalRowIds[0]!,
  }
}

/** A row for an existing Booking, as a hospital would send it unchanged. */
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
    ...(booking.scheduledTime !== undefined ? { scheduledTime: booking.scheduledTime } : {}),
    patient: { name: patient.name, ...(patient.nhi !== undefined ? { nhi: patient.nhi } : {}), ...(patient.dobISO !== undefined && patient.dobISO !== '' ? { dobISO: patient.dobISO } : {}) },
    hospitalStatus: 'booked',
  }
}

/** A live Booking on an ACTIVE List at a connected hospital (St George's or Southern Cross) whose row the matcher matches. */
function connectedBooking(api: AppStoreApi): string {
  const s = api.getState()
  const view = matchingView(s)
  for (const b of Object.values(view.bookings).sort((a, c) => a.id.localeCompare(c.id))) {
    const list = view.lists[b.listId]
    if (b.cancelled || list === undefined || list.state !== 'ACTIVE' || list.surgeonId === undefined || b.patient.nhi === undefined) continue
    if (list.hospitalId !== HOSP.stg && list.hospitalId !== HOSP.sx) continue
    if (list.dateISO <= s.clock.todayISO) continue
    return b.id
  }
  throw new Error('no Booking at a connected hospital')
}

/** The seeded stub's patient (Mere Tipene, no NHI, on Southern Cross Tue 8 Dec PM), sent again by Southern Cross with an NHI. */
function tipeneWithNhi(api: AppStoreApi, extra: Partial<IncomingBookingFields> = {}): { key: string; rowId: string; batchId: string } {
  const waiting = api.getState().intake.rows[SEED_STUB.rowId]!
  const row: IncomingBookingFields = {
    ...waiting.incoming,
    scheduledTime: '14:30',
    patient: { ...waiting.incoming.patient, nhi: SEED_STUB.nhiToType },
    procedure: { text: 'Laparoscopic cholecystectomy', code: 'G4' },
    ...extra,
  }
  const out = receiveHospitalBatch(api, HOSP.sx, 'Southern Cross theatre list, Tue 8 Dec (updated)', [row])
  if (!out.ok) throw new Error(out.message)
  return { key: listItemOf(api, out.value.batchId).key, rowId: out.value.rowIds[0]!, batchId: out.value.batchId }
}

describe('applyArrivingList: a re-sent rooms PDF (US-02.1.2, US-02.2.3, D118)', () => {
  it('three changes, one left out: two applied, the left-out row decided left out, its Booking untouched, one change set', () => {
    const api = fresh()
    const { listId } = placeOkaforList(api)
    const r = resend(api)
    expect(r.item.kind).toBe('update')
    expect(r.item.heldListId).toBe(listId)
    expect(applyBlockers(api.getState(), r.key)).toEqual({})
    const lindqvist = bookingOf(api, listId, P.lindqvist.nhi)!
    const from = api.getState().audit.length

    const res = applyArrivingList(api, OFFICE_ACTOR, r.key, { [r.lindqvist]: { kind: 'leaveOut' } })
    if (!res.ok) throw new Error(res.message)
    expect(res.value.leftOut).toEqual([r.lindqvist])
    expect(res.value.removed).toEqual([r.removal])
    expect(new Set(res.value.applied)).toEqual(new Set([r.ngata, r.brooks]))

    const s = api.getState()
    expect(s.intake.rows[r.lindqvist]).toMatchObject({ status: 'leftOut', decision: { kind: 'leftOut' } })
    expect(s.schedule.bookings[lindqvist.id]).toBe(lindqvist)
    expect(s.intake.rows[r.ngata]!.decision).toMatchObject({ kind: 'match', changeType: 'noChange', listId })
    expect(bookingOf(api, listId, P.brooks.nhi)).toBeDefined()
    const sets = changeSetsSince(api, from)
    expect(sets.size).toBe(1)
    expect([...sets][0]).toBe(res.value.changeSetId)
    expect(listItemOf(api, s.intake.rows[r.ngata]!.batchId).decided).toBe(true)
  })

  it('confirmed, the missing Booking is cancelled and stays on the List; left out, it is unchanged', () => {
    const confirmApi = fresh()
    const a = placeOkaforList(confirmApi)
    const ra = resend(confirmApi)
    const pike = bookingOf(confirmApi, a.listId, P.pike.nhi)!
    expect(applyArrivingList(confirmApi, OFFICE_ACTOR, ra.key, {}).ok).toBe(true)
    const cancelled = confirmApi.getState().schedule.bookings[pike.id]!
    expect(cancelled.cancellation).toBeDefined()
    expect(cancelled.listId).toBe(a.listId)
    expect(confirmApi.getState().intake.rows[ra.removal]!.decision).toMatchObject({ kind: 'match', changeType: 'cancellation', bookingId: pike.id })

    const leaveApi = fresh()
    const b = placeOkaforList(leaveApi)
    const rb = resend(leaveApi)
    const pike2 = bookingOf(leaveApi, b.listId, P.pike.nhi)!
    const res = applyArrivingList(leaveApi, OFFICE_ACTOR, rb.key, { [rb.removal]: { kind: 'leaveOut' } })
    expect(res).toMatchObject({ ok: true, value: { leftOut: [rb.removal], removed: [] } })
    expect(leaveApi.getState().schedule.bookings[pike2.id]).toBe(pike2)
  })

  it('an added Booking lands with no Contract (D125)', () => {
    const api = fresh()
    const { listId } = placeOkaforList(api)
    const r = resend(api)
    expect(applyArrivingList(api, OFFICE_ACTOR, r.key, {}).ok).toBe(true)
    const brooks = bookingOf(api, listId, P.brooks.nhi)!
    const procedures = Object.values(api.getState().schedule.procedures).filter((p) => p.bookingId === brooks.id)
    expect(procedures.length).toBeGreaterThan(0)
    expect(procedures.every((p) => p.governingContractId === undefined)).toBe(true)
  })

  it('a locked (authorised) List: every row names the lock, and apply refuses with nothing written', () => {
    const api = fresh()
    const { listId } = placeOkaforList(api)
    const r = resend(api)
    const s0 = api.getState()
    api.setState({ schedule: { ...s0.schedule, lists: { ...s0.schedule.lists, [listId]: { ...s0.schedule.lists[listId]!, state: 'AUTHORISED' } as List } } })
    const blockers = applyBlockers(api.getState(), r.key)
    for (const id of [r.ngata, r.lindqvist, r.brooks, r.removal]) expect(blockers[id]).toBe(LIST_LOCKED_MESSAGE)
    const before = api.getState()
    const res = applyArrivingList(api, OFFICE_ACTOR, r.key, {})
    expect(res).toMatchObject({ ok: false })
    expect(res.ok ? '' : res.message).toContain(LIST_LOCKED_MESSAGE)
    expect(api.getState().schedule).toBe(before.schedule)
    expect(api.getState().intake).toBe(before.intake)
    expect(api.getState().audit).toHaveLength(before.audit.length)
  })

  it('a row with no wording names it and refuses; left out, the rest apply', () => {
    const api = fresh()
    const { listId } = placeOkaforList(api)
    const r = resend(api)
    const s0 = api.getState()
    const brooksRow = s0.intake.rows[r.brooks]!
    api.setState({ intake: { ...s0.intake, rows: { ...s0.intake.rows, [r.brooks]: { ...brooksRow, incoming: { ...brooksRow.incoming, procedure: { text: ' ' } } } } } })
    expect(applyBlockers(api.getState(), r.key)[r.brooks]).toBe(WORDING_OR_CODE_MESSAGE)
    const before = api.getState()
    expect(applyArrivingList(api, OFFICE_ACTOR, r.key, {}).ok).toBe(false)
    expect(api.getState().audit).toHaveLength(before.audit.length)
    expect(applyArrivingList(api, OFFICE_ACTOR, r.key, { [r.brooks]: { kind: 'leaveOut' } }).ok).toBe(true)
    expect(bookingOf(api, listId, P.brooks.nhi)).toBeUndefined()
  })

  it('a refusal after earlier rows have written rolls the whole List back (all or nothing)', () => {
    const api = fresh()
    placeOkaforList(api)
    // A re-send listing Helen Brooks twice: the first copy books her, the second is refused as already booked.
    const twice: MailboxPdfSample = {
      ...OKAFOR_STORY.roomsResend,
      id: 'TEST-RESEND-TWICE',
      rows: [...OKAFOR_STORY.roomsResend.rows, { ...OKAFOR_STORY.roomsResend.rows.find((row) => row.nhi === P.brooks.nhi)!, id: 'R5', scheduledTime: '17:30' }],
    }
    const re = receiveMailboxPdf(api, twice)
    if (!re.ok) throw new Error(re.message)
    const key = listItemOf(api, re.value.batchId).key
    expect(applyBlockers(api.getState(), key)).toEqual({})
    const before = api.getState()
    const res = applyArrivingList(api, OFFICE_ACTOR, key, {})
    expect(res).toMatchObject({ ok: false, code: 'alreadyBooked' })
    const s = api.getState()
    expect(s.schedule).toBe(before.schedule)
    expect(s.intake).toBe(before.intake)
    expect(s.audit).toHaveLength(before.audit.length)
  })

  it('office only; an unknown key or another kind refuses', () => {
    const api = fresh()
    placeOkaforList(api)
    const r = resend(api)
    expect(applyArrivingList(api, ANAESTHETIST, r.key, {})).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(applyArrivingList(api, OFFICE_ACTOR, 'nope', {})).toMatchObject({ ok: false, code: 'notFound' })
    const fresher = fresh()
    const first = receiveMailboxPdf(fresher, OKAFOR_STORY.roomsList)
    if (!first.ok) throw new Error(first.message)
    expect(applyArrivingList(fresher, OFFICE_ACTOR, listItemOf(fresher, first.value.batchId).key, {})).toMatchObject({ ok: false, code: 'wrongKind' })
  })
})

describe("the hospital's List for a List the rooms sent (US-02.1.3)", () => {
  it("St George's day-before List arrives as an update to the List placed from the rooms' PDF", () => {
    const api = fresh()
    const { listId } = placeOkaforList(api)
    const out = receiveHospitalBatch(api, HOSP.stg, OKAFOR_STORY.stgDayBefore.label, stgDayBeforeRows(api.getState()), { sampleId: OKAFOR_STORY.stgDayBefore.id })
    if (!out.ok) throw new Error(out.message)
    const item = listItemOf(api, out.value.batchId)
    expect(item).toMatchObject({ kind: 'update', heldListId: listId })
    // Sione Faleolo's row is added (the rooms' row waits for its NHI with no stub until a stub stands on the List).
    const faleolo = arrivalRows(api.getState(), item.key).find((r) => r.patientName === P.faleolo.name)!
    expect(faleolo.change).toBe('added')
  })
})

describe('DM-17: an arriving NHI turns the stub into the Booking', () => {
  it('the stub resolved, the waiting row applied, the arriving row applied onto the new Booking, one patient record', () => {
    const api = fresh()
    const arriving = tipeneWithNhi(api)
    const s0 = api.getState()
    expect(stubCandidates(s0, arriving.key)).toEqual({ [arriving.rowId]: [{ stubId: SEED_STUB.stubId, waitingRowId: SEED_STUB.rowId, nhi: SEED_STUB.nhiToType }] })
    expect(applyBlockers(s0, arriving.key)).toEqual({})
    const needsNhi = arrivalFeedCounts(s0).needsNhi
    const from = s0.audit.length

    const res = applyArrivingList(api, OFFICE_ACTOR, arriving.key, {})
    if (!res.ok) throw new Error(res.message)
    expect(res.value.applied).toEqual([SEED_STUB.rowId, arriving.rowId])

    const s = api.getState()
    const stub = s.intake.stubs[SEED_STUB.stubId]!
    expect(stub.status).toBe('resolved')
    const waiting = s.intake.rows[SEED_STUB.rowId]!
    expect(waiting).toMatchObject({ status: 'applied', decision: { kind: 'createBooking', listId: SEED_STUB.listId } })
    const bookingId = waiting.decision!.kind === 'createBooking' ? waiting.decision!.bookingId : ''
    expect(stub.bookingId).toBe(bookingId)
    expect(s.intake.rows[arriving.rowId]!.decision).toMatchObject({ kind: 'match', bookingId, changeType: 'modification' })
    expect(s.schedule.bookings[bookingId]!.scheduledTime).toBe('14:30')
    expect(Object.values(s.masters.patients).filter((p) => p.nhi === SEED_STUB.nhiToType)).toHaveLength(1)
    expect(arrivalFeedCounts(s).needsNhi).toBe(needsNhi - 1)
    expect(changeSetsSince(api, from).size).toBe(1)
    expect(s.audit.slice(from).filter((a) => a.action === 'stub.resolve')).toHaveLength(1)
  })

  it('two fitting stubs: apply needs the choice, refusing with nothing written; chosen, that stub resolves', () => {
    const api = fresh()
    // A second waiting row for the same patient on the same List, at another time: a second stub.
    const waiting = api.getState().intake.rows[SEED_STUB.rowId]!
    const second = receiveHospitalBatch(api, HOSP.sx, 'Southern Cross theatre list, Tue 8 Dec (again)', [{ ...waiting.incoming, scheduledTime: '15:00' }])
    if (!second.ok) throw new Error(second.message)
    const arriving = tipeneWithNhi(api)
    const candidates = stubCandidates(api.getState(), arriving.key)[arriving.rowId]!
    expect(candidates.map((c) => c.waitingRowId)).toEqual([SEED_STUB.rowId, second.value.rowIds[0]])

    const before = api.getState()
    expect(applyArrivingList(api, OFFICE_ACTOR, arriving.key, {})).toMatchObject({ ok: false, code: 'chooseStub', message: CHOOSE_STUB_MESSAGE })
    expect(api.getState()).toBe(before)

    const chosen = candidates[1]!
    const res = applyArrivingList(api, OFFICE_ACTOR, arriving.key, { [arriving.rowId]: { kind: 'apply', stubId: chosen.stubId } })
    if (!res.ok) throw new Error(res.message)
    const s = api.getState()
    expect(s.intake.stubs[chosen.stubId]!.status).toBe('resolved')
    expect(s.intake.stubs[SEED_STUB.stubId]!.status).toBe('standing')
  })

  it('a row waiting for its NHI is never decided here', () => {
    const api = fresh()
    const out = receiveHospitalBatch(api, HOSP.sx, 'Southern Cross theatre list, Tue 8 Dec (two)', [
      { ...api.getState().intake.rows[SEED_STUB.rowId]!.incoming, scheduledTime: '15:30', patient: { name: 'Ana Test', dobISO: '1990-02-02' } },
      { ...api.getState().intake.rows[SEED_STUB.rowId]!.incoming, scheduledTime: '16:00', patient: { name: 'Ben Test', nhi: 'ZQA3019', dobISO: '1971-02-03' } },
    ])
    if (!out.ok) throw new Error(out.message)
    const key = listItemOf(api, out.value.batchId).key
    const [waitingId, addedId] = out.value.rowIds as [string, string]
    expect(applyBlockers(api.getState(), key)).toEqual({ [waitingId]: WAITS_FOR_NHI_MESSAGE })
    const res = applyArrivingList(api, OFFICE_ACTOR, key, { [waitingId]: { kind: 'apply' } })
    expect(res).toMatchObject({ ok: true, value: { applied: [addedId] } })
    expect(api.getState().intake.rows[waitingId]!.status).toBe('open')
  })
})

describe('rejectArrivingList', () => {
  it('needs a reason; rejects every row and changes no Booking, List or stub', () => {
    const api = fresh()
    const arriving = tipeneWithNhi(api)
    expect(rejectArrivingList(api, OFFICE_ACTOR, arriving.key, '  ')).toMatchObject({ ok: false, message: REJECT_REASON_REQUIRED_MESSAGE })
    const before = api.getState()
    const res = rejectArrivingList(api, OFFICE_ACTOR, arriving.key, 'Not our patient')
    expect(res).toMatchObject({ ok: true, value: { rejected: [arriving.rowId] } })
    const s = api.getState()
    expect(s.schedule).toBe(before.schedule)
    expect(s.intake.stubs).toBe(before.intake.stubs)
    expect(s.intake.rows[arriving.rowId]).toMatchObject({ status: 'rejected', decision: { kind: 'reject', reason: 'Not our patient' } })
    expect(s.intake.rows[SEED_STUB.rowId]!.status).toBe('open')
  })

  it("a re-sent PDF rejected: the List's Bookings are as they were", () => {
    const api = fresh()
    placeOkaforList(api)
    const r = resend(api)
    const before = api.getState()
    const res = rejectArrivingList(api, OFFICE_ACTOR, r.key, 'Sent in error')
    expect(res.ok).toBe(true)
    expect(api.getState().schedule).toBe(before.schedule)
    expect([r.ngata, r.lindqvist, r.brooks, r.removal].map((id) => api.getState().intake.rows[id]!.status)).toEqual(['rejected', 'rejected', 'rejected', 'rejected'])
  })
})

describe('decideCancellation', () => {
  function cancellation(api: AppStoreApi): { key: string; bookingId: string; rowId: string } {
    const bookingId = connectedBooking(api)
    const hospitalId = api.getState().schedule.lists[api.getState().schedule.bookings[bookingId]!.listId]!.hospitalId
    const out = receiveCancellation(api, hospitalId, { ...rowFromBooking(api, bookingId), hospitalStatus: 'cancelled', cancelReason: 'Patient unwell' })
    if (!out.ok) throw new Error(out.message)
    const item = listItemOf(api, out.value.batchId)
    expect(item.kind).toBe('cancellation')
    expect(assessImportRow(api.getState(), out.value.rowId)?.suggestion).toMatchObject({ kind: 'match', bookingId, changeType: 'cancellation' })
    return { key: item.key, bookingId, rowId: out.value.rowId }
  }

  it('apply cancels the Booking, kept on its List and marked cancelled', () => {
    const api = fresh()
    const c = cancellation(api)
    const listId = api.getState().schedule.bookings[c.bookingId]!.listId
    const res = decideCancellation(api, OFFICE_ACTOR, c.key, 'apply')
    expect(res).toMatchObject({ ok: true, value: { applied: [c.rowId] } })
    const booking = api.getState().schedule.bookings[c.bookingId]!
    expect(booking.cancellation).toBeDefined()
    expect(booking.listId).toBe(listId)
  })

  it('reject needs a reason and changes nothing on the schedule', () => {
    const api = fresh()
    const c = cancellation(api)
    expect(decideCancellation(api, OFFICE_ACTOR, c.key, 'reject')).toMatchObject({ ok: false, message: REJECT_REASON_REQUIRED_MESSAGE })
    const before = api.getState()
    expect(decideCancellation(api, OFFICE_ACTOR, c.key, 'reject', 'Wrong patient')).toMatchObject({ ok: true, value: { rejected: [c.rowId] } })
    expect(api.getState().schedule).toBe(before.schedule)
    expect(api.getState().schedule.bookings[c.bookingId]!.cancellation).toBeUndefined()
  })

  it('an update is not a cancellation, and a cancellation is not an update', () => {
    const api = fresh()
    const c = cancellation(api)
    expect(applyArrivingList(api, OFFICE_ACTOR, c.key, {})).toMatchObject({ ok: false, code: 'wrongKind' })
    const arriving = tipeneWithNhi(api)
    expect(decideCancellation(api, OFFICE_ACTOR, arriving.key, 'apply')).toMatchObject({ ok: false, code: 'wrongKind' })
  })
})
