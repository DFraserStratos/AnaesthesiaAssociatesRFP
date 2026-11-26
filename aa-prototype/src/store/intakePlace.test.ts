/**
 * Placing a new List from Intake (build plan Phase 70; US-02.1.2's placement half, US-01.6.1, DM-19, D118, D125):
 * the named anaesthetist's free session suggested, another free session, an existing List or a Draft List, all as
 * ONE change set; a no-NHI row a stub on the placed List; a session taken meanwhile refused with nothing written.
 */
import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { receiveMailboxPdf } from './intakeIngest'
import { arrivalByKey, arrivalItemsOf } from './intakeSelectors'
import { placeArrivalList, placeChoicesFor, rejectArrivalList, REJECT_REASON_REQUIRED_MESSAGE, SLOT_TAKEN_MESSAGE } from './intakePlace'
import { assignListToSlot } from './slotActions'
import { placeStubsOnList } from './stubSettle'
import type { Actor } from './mutate'
import { OKAFOR_ROOMS_PDF, OKAFOR_STORY_LIST, OKAFOR_STORY_PATIENTS } from '../domain/intake/hospitalDownloads'

const ANAESTHETIST: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }

/** Mr Okafor's PDF arrives by the mailbox: its new List item's key and its four rows (the fourth has no NHI). */
function okaforArrives(api: AppStoreApi): { key: string; rowIds: string[] } {
  const out = receiveMailboxPdf(api, OKAFOR_ROOMS_PDF)
  if (!out.ok) throw new Error(out.message)
  const item = arrivalItemsOf(api.getState()).find((i) => i.batchId === out.value.batchId && i.kind === 'newList')
  if (item === undefined) throw new Error('no new List arrival')
  return { key: item.key, rowIds: out.value.rowIds }
}

function auditSince(api: AppStoreApi, from: number) {
  return api.getState().audit.slice(from)
}

/** Another surgeon than Mr Okafor, for a List AA already holds that afternoon. */
function otherSurgeonId(api: AppStoreApi): string {
  return Object.keys(api.getState().masters.surgeons).find((id) => id !== OKAFOR_STORY_LIST.surgeonId)!
}

describe('placeChoicesFor (DM-19)', () => {
  it("suggests the named anaesthetist's session only while it is free, and offers only that day and session", () => {
    const api = createAppStore()
    const { key } = okaforArrives(api)
    const choices = placeChoicesFor(api.getState(), key)!
    expect(choices.namedAnaesthetistId).toBe(OKAFOR_STORY_LIST.anaesthetistId)
    expect(choices.suggested).toMatchObject({ anaesthetistId: OKAFOR_STORY_LIST.anaesthetistId, dateISO: OKAFOR_STORY_LIST.dateISO, session: OKAFOR_STORY_LIST.session })
    expect(choices.otherSlots.length).toBeGreaterThan(0)
    expect(choices.otherSlots.every((s) => s.dateISO === OKAFOR_STORY_LIST.dateISO && s.session === OKAFOR_STORY_LIST.session)).toBe(true)
    expect(choices.otherSlots.some((s) => s.id === choices.suggested!.id)).toBe(false)
    expect(choices.surgeonKnown).toBe(true)

    // Dr Rutherford's session is taken first (another surgeon's List): no suggestion, and it is not offered at all.
    const taken = assignListToSlot(api, OFFICE_ACTOR, choices.suggested!.id, { hospitalId: OKAFOR_STORY_LIST.hospitalId, surgeonId: otherSurgeonId(api), kind: 'private' })
    if (!taken.ok) throw new Error(taken.message)
    const after = placeChoicesFor(api.getState(), key)!
    expect(after.suggested).toBeUndefined()
    expect(after.otherSlots.some((s) => s.id === choices.suggested!.id)).toBe(false)
    expect(after.namedAnaesthetistId).toBe(OKAFOR_STORY_LIST.anaesthetistId)
  })
})

describe('placeArrivalList (D118: one change set per placed List)', () => {
  it('placed in the suggested session: one List with every NHI row a Booking, the no-NHI row a standing stub, one change set', () => {
    const api = createAppStore()
    const { key, rowIds } = okaforArrives(api)
    const choices = placeChoicesFor(api.getState(), key)!
    const from = api.getState().audit.length
    const out = placeArrivalList(api, OFFICE_ACTOR, key, { kind: 'slot', slotId: choices.suggested!.id })
    if (!out.ok) throw new Error(out.message)
    const s = api.getState()
    const list = s.schedule.lists[out.value.listId]!
    expect(list).toMatchObject({ state: 'ACTIVE', slotId: choices.suggested!.id, anaesthetistId: OKAFOR_STORY_LIST.anaesthetistId, surgeonId: OKAFOR_STORY_LIST.surgeonId })
    expect(out.value.bookingRowIds).toEqual(rowIds.slice(0, 3))
    expect(Object.values(s.schedule.bookings).filter((b) => b.listId === list.id)).toHaveLength(3)
    expect(out.value.stubIds).toHaveLength(1)
    expect(s.intake.stubs[out.value.stubIds[0]!]).toMatchObject({
      listId: list.id,
      importRowId: rowIds[3],
      status: 'standing',
      asReceived: { patientName: OKAFOR_STORY_PATIENTS.faleolo.name },
    })
    expect(s.intake.rows[rowIds[3]!]!.status).toBe('open')
    const written = auditSince(api, from)
    expect(out.value.changeSetId).not.toBeNull()
    expect(new Set(written.map((a) => a.changeSetId))).toEqual(new Set([out.value.changeSetId]))
    expect(written.some((a) => a.action === 'stub.place')).toBe(true)
    // Only the waiting row is still open on the arrival.
    expect(arrivalByKey(s, key)?.openRowIds ?? [rowIds[3]]).toEqual([rowIds[3]])
  })

  it('the placed Bookings carry no Contract (D125)', () => {
    const api = createAppStore()
    const { key } = okaforArrives(api)
    const choices = placeChoicesFor(api.getState(), key)!
    const out = placeArrivalList(api, OFFICE_ACTOR, key, { kind: 'slot', slotId: choices.suggested!.id })
    if (!out.ok) throw new Error(out.message)
    const s = api.getState()
    const bookingIds = new Set(Object.values(s.schedule.bookings).filter((b) => b.listId === out.value.listId).map((b) => b.id))
    const procedures = Object.values(s.schedule.procedures).filter((p) => bookingIds.has(p.bookingId))
    expect(procedures.length).toBeGreaterThanOrEqual(3)
    expect(procedures.every((p) => p.governingContractId === undefined)).toBe(true)
  })

  it("placed in another anaesthetist's free session", () => {
    const api = createAppStore()
    const { key } = okaforArrives(api)
    const other = placeChoicesFor(api.getState(), key)!.otherSlots[0]!
    const out = placeArrivalList(api, OFFICE_ACTOR, key, { kind: 'slot', slotId: other.id })
    if (!out.ok) throw new Error(out.message)
    expect(api.getState().schedule.lists[out.value.listId]).toMatchObject({ slotId: other.id, anaesthetistId: other.anaesthetistId })
    expect(out.value.bookingRowIds).toHaveLength(3)
    expect(out.value.stubIds).toHaveLength(1)
  })

  it('added to a List AA holds', () => {
    const api = createAppStore()
    const { key } = okaforArrives(api)
    const before = placeChoicesFor(api.getState(), key)!
    // Another surgeon's List the same afternoon at St George's, made by hand.
    const held = assignListToSlot(api, OFFICE_ACTOR, before.otherSlots[0]!.id, { hospitalId: OKAFOR_STORY_LIST.hospitalId, surgeonId: otherSurgeonId(api), kind: 'private' })
    if (!held.ok) throw new Error(held.message)
    const choices = placeChoicesFor(api.getState(), key)!
    expect(choices.lists.map((l) => l.id)).toContain(held.value.listId)
    const listsBefore = Object.keys(api.getState().schedule.lists).length
    const out = placeArrivalList(api, OFFICE_ACTOR, key, { kind: 'list', listId: held.value.listId })
    if (!out.ok) throw new Error(out.message)
    expect(out.value.listId).toBe(held.value.listId)
    expect(Object.keys(api.getState().schedule.lists)).toHaveLength(listsBefore)
    expect(Object.values(api.getState().schedule.bookings).filter((b) => b.listId === held.value.listId)).toHaveLength(3)
    expect(api.getState().intake.stubs[out.value.stubIds[0]!]?.listId).toBe(held.value.listId)
  })

  it('a List not offered is refused with nothing written', () => {
    const api = createAppStore()
    const { key } = okaforArrives(api)
    const before = api.getState()
    expect(placeArrivalList(api, OFFICE_ACTOR, key, { kind: 'list', listId: 'L-NOPE' })).toMatchObject({ ok: false, code: 'listNotOffered' })
    expect(api.getState().audit).toBe(before.audit)
  })

  it('a Draft List holds every Booking and its stub, and no session changes', () => {
    const api = createAppStore()
    const { key } = okaforArrives(api)
    const slotsBefore = api.getState().schedule.slots
    const freeBefore = placeChoicesFor(api.getState(), key)!.otherSlots.map((s) => s.id)
    const from = api.getState().audit.length
    const out = placeArrivalList(api, OFFICE_ACTOR, key, { kind: 'draft' })
    if (!out.ok) throw new Error(out.message)
    const s = api.getState()
    expect(s.schedule.slots).toBe(slotsBefore)
    const list = s.schedule.lists[out.value.listId]!
    expect(list).toMatchObject({
      state: 'DRAFT',
      surgeonId: OKAFOR_STORY_LIST.surgeonId,
      hospitalId: OKAFOR_STORY_LIST.hospitalId,
      dateISO: OKAFOR_STORY_LIST.dateISO,
      session: OKAFOR_STORY_LIST.session,
    })
    expect(Object.values(s.schedule.bookings).filter((b) => b.listId === list.id)).toHaveLength(3)
    expect(s.intake.stubs[out.value.stubIds[0]!]?.listId).toBe(list.id)
    // No List was put in any session: every session free before is free still.
    const inSessions = new Set(Object.values(s.schedule.lists).flatMap((l) => (l.state !== 'DRAFT' && l.removedAtISO === undefined ? [l.slotId] : [])))
    expect(freeBefore.some((id) => inSessions.has(id))).toBe(false)
    expect(new Set(auditSince(api, from).map((a) => a.changeSetId))).toEqual(new Set([out.value.changeSetId]))
  })

  it('a session taken since it was shown is refused in place, with nothing written', () => {
    const api = createAppStore()
    const { key } = okaforArrives(api)
    const slotId = placeChoicesFor(api.getState(), key)!.otherSlots[0]!.id
    expect(assignListToSlot(api, OFFICE_ACTOR, slotId, { hospitalId: OKAFOR_STORY_LIST.hospitalId, surgeonId: otherSurgeonId(api), kind: 'private' }).ok).toBe(true)
    const before = api.getState()
    expect(placeArrivalList(api, OFFICE_ACTOR, key, { kind: 'slot', slotId })).toMatchObject({ ok: false, code: 'slotTaken', message: SLOT_TAKEN_MESSAGE })
    const after = api.getState()
    expect(after.audit.length).toBe(before.audit.length)
    expect(after.schedule).toBe(before.schedule)
    expect(after.intake).toBe(before.intake)
  })

  it('refuses a non-office actor and an unknown arrival', () => {
    const api = createAppStore()
    const { key } = okaforArrives(api)
    const choices = placeChoicesFor(api.getState(), key)!
    const before = api.getState()
    expect(placeArrivalList(api, ANAESTHETIST, key, { kind: 'slot', slotId: choices.suggested!.id })).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(rejectArrivalList(api, ANAESTHETIST, key, 'Not ours')).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(placeArrivalList(api, OFFICE_ACTOR, 'no-such-key', { kind: 'draft' })).toMatchObject({ ok: false, code: 'notFound' })
    expect(api.getState().audit).toBe(before.audit)
  })

  it('a List whose every row waits for an NHI is made through the session act and holds only stubs', () => {
    const api = createAppStore()
    // The rooms send only Sione Faleolo, with no NHI.
    const out0 = receiveMailboxPdf(api, { ...OKAFOR_ROOMS_PDF, id: 'PDF-OKAFOR-NO-NHI', rows: OKAFOR_ROOMS_PDF.rows.filter((r) => r.nhi === undefined) })
    if (!out0.ok) throw new Error(out0.message)
    const item = arrivalItemsOf(api.getState()).find((i) => i.batchId === out0.value.batchId && i.kind === 'newList')!
    expect(item).toBeDefined()
    const choices = placeChoicesFor(api.getState(), item.key)!
    const from = api.getState().audit.length
    const out = placeArrivalList(api, OFFICE_ACTOR, item.key, { kind: 'slot', slotId: choices.suggested!.id })
    if (!out.ok) throw new Error(out.message)
    expect(out.value.bookingRowIds).toEqual([])
    expect(api.getState().schedule.lists[out.value.listId]).toMatchObject({ state: 'ACTIVE', slotId: choices.suggested!.id, surgeonId: OKAFOR_STORY_LIST.surgeonId })
    const stubs = Object.values(api.getState().intake.stubs).filter((st) => st.listId === out.value.listId && st.status === 'standing')
    expect(stubs.map((st) => st.importRowId)).toEqual(out0.value.rowIds)
    expect(new Set(auditSince(api, from).map((a) => a.changeSetId))).toEqual(new Set([out.value.changeSetId]))
  })

  it('a Draft List of waiting rows only changes no session and holds their stubs', () => {
    const api = createAppStore()
    const arrived = receiveMailboxPdf(api, { ...OKAFOR_ROOMS_PDF, id: 'PDF-OKAFOR-NO-NHI', rows: OKAFOR_ROOMS_PDF.rows.filter((r) => r.nhi === undefined) })
    if (!arrived.ok) throw new Error(arrived.message)
    const item = arrivalItemsOf(api.getState()).find((i) => i.batchId === arrived.value.batchId && i.kind === 'newList')!
    const slotsBefore = api.getState().schedule.slots
    const out = placeArrivalList(api, OFFICE_ACTOR, item.key, { kind: 'draft' })
    if (!out.ok) throw new Error(out.message)
    const list = api.getState().schedule.lists[out.value.listId]!
    expect(list).toMatchObject({ state: 'DRAFT', surgeonId: OKAFOR_STORY_LIST.surgeonId, dateISO: OKAFOR_STORY_LIST.dateISO, session: OKAFOR_STORY_LIST.session })
    expect(list.notes).toContain(OKAFOR_STORY_PATIENTS.faleolo.name)
    expect(api.getState().schedule.slots).toBe(slotsBefore)
    expect(out.value.stubIds).toHaveLength(1)
  })
})

describe('rejectArrivalList', () => {
  it('needs a reason, and given one rejects every row and makes no List', () => {
    const api = createAppStore()
    const { key, rowIds } = okaforArrives(api)
    const before = api.getState()
    expect(rejectArrivalList(api, OFFICE_ACTOR, key, '  ')).toMatchObject({ ok: false, code: 'reasonRequired', message: REJECT_REASON_REQUIRED_MESSAGE })
    expect(api.getState().audit).toBe(before.audit)
    const out = rejectArrivalList(api, OFFICE_ACTOR, key, 'Not an AA List')
    if (!out.ok) throw new Error(out.message)
    const s = api.getState()
    expect(rowIds.map((id) => s.intake.rows[id]!.decision)).toEqual(rowIds.map(() => ({ kind: 'reject', reason: 'Not an AA List' })))
    expect(s.schedule.lists).toBe(before.schedule.lists)
    expect(s.schedule.bookings).toBe(before.schedule.bookings)
    expect(new Set(s.audit.slice(before.audit.length).map((a) => a.changeSetId))).toEqual(new Set([out.value.changeSetId]))
  })
})

describe('placeStubsOnList', () => {
  it('places no stub on an unknown List and none twice for a row', () => {
    const api = createAppStore()
    const { rowIds } = okaforArrives(api)
    expect(placeStubsOnList(api, OFFICE_ACTOR, 'L-NOPE', rowIds)).toEqual([])
    const listId = Object.values(api.getState().schedule.lists).find((l) => l.state === 'ACTIVE' && l.removedAtISO === undefined)!.id
    expect(placeStubsOnList(api, OFFICE_ACTOR, listId, rowIds)).toHaveLength(1)
    expect(placeStubsOnList(api, OFFICE_ACTOR, listId, rowIds)).toEqual([])
  })
})

describe('placed once (Wave 7 join)', () => {
  it('a placed List whose stub still waits cannot be placed or rejected again, and nothing is written', () => {
    const api = createAppStore()
    const { key } = okaforArrives(api)
    const choices = placeChoicesFor(api.getState(), key)!
    const first = placeArrivalList(api, OFFICE_ACTOR, key, { kind: 'slot', slotId: (choices.suggested ?? choices.otherSlots[0]!).id })
    expect(first.ok).toBe(true)
    // The no-NHI row still waits, so the arrival is not decided, but it is placed.
    expect(arrivalByKey(api.getState(), key)?.decided).toBe(false)
    const before = api.getState()
    expect(placeArrivalList(api, OFFICE_ACTOR, key, { kind: 'draft' })).toMatchObject({ ok: false, code: 'alreadyPlaced' })
    expect(rejectArrivalList(api, OFFICE_ACTOR, key, 'Wrong List')).toMatchObject({ ok: false, code: 'alreadyPlaced' })
    expect(api.getState().schedule).toBe(before.schedule)
    expect(api.getState().audit.length).toBe(before.audit.length)
  })
})
