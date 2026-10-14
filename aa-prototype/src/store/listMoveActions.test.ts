/**
 * An anaesthetist moves her own List (catch-up Phase 32; US-01.4.3, US-01.4.5,
 * US-01.5.5, US-13.8.2, US-06.3.5 AC2; D7, D14, D15, D20, D44 as answered).
 */

import { describe, expect, it } from 'vitest'
import { assigned, draft } from '../test/lists'
import { createAppStore, type BoundAppStore } from './appStore'
import { markUnavailableAndMoveList, moveListToOffice, pushListToSlot } from './listMoveActions'
import { reassignList, setAvailability } from './slotActions'
import { createAvailabilitySeries, setAvailabilityRange } from './availabilityActions'
import { assignDraftList } from './draftListActions'
import { addPairingPreference, setPriorityTier } from './officePrivate'
import { raisePreProcedureInvoice } from './prepaymentActions'
import { openWarnings } from './warnings'
import { bookingsForList, listInSlot, moveInputOf } from './selectors'
import { OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import type { Actor } from './mutate'
import { ANAE, LIST_MOVE_DEMO, SEED_LIST_IDS, SURG } from '../domain/seed'
import { slotIdFor } from '../domain/slots'
import { pushTargets } from '../domain/listMoves'
import type { AvailabilitySeriesDraft } from '../domain/availabilitySeries'

const OFFICE = OFFICE_ACTOR
const SOUTER = SOUTER_ACTOR
const SHARMA: Actor = { who: 'Dr Priya Sharma', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.sharma }
const DELANEY: Actor = { who: 'Dr Mark Delaney', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.delaney }

const MOVABLE = LIST_MOVE_DEMO.movableListId // Souter, Mon 27 Jul PM, St George's, Ms G. Lim
const MON27 = '2026-07-27'
const store = (): BoundAppStore => createAppStore()
const code = (o: { ok: boolean; code?: string }) => (o.ok ? 'ok' : o.code)
const actions = (api: BoundAppStore, from = 0) => api.getState().audit.slice(from).map((a) => a.action)
const colleagueSlot = (id: string, dateISO = MON27, session: 'AM' | 'PM' = 'PM') => slotIdFor(id, dateISO, session)

/** Counts the store commits an action makes. */
function commits(api: BoundAppStore, run: () => unknown): number {
  let n = 0
  const off = api.subscribe(() => {
    n += 1
  })
  run()
  off()
  return n
}

describe('refusals (ownership is enforced in the store)', () => {
  it('refuses the office, a feed and an anaesthetist acting on someone else\'s List, on all three actions', () => {
    const api = store()
    const before = api.getState()
    const target = colleagueSlot(ANAE.chen)
    for (const actor of [OFFICE, { who: 'Feed', role: 'system', source: 'integration' } as Actor]) {
      expect(code(moveListToOffice(api, actor, MOVABLE))).toBe('ownerOnly')
      expect(code(pushListToSlot(api, actor, MOVABLE, target))).toBe('ownerOnly')
      expect(code(markUnavailableAndMoveList(api, actor, LIST_MOVE_DEMO.unavailableSlotId, 'unavailable', { route: 'office' }))).toBe('ownerOnly')
    }
    expect(code(moveListToOffice(api, SHARMA, MOVABLE))).toBe('notOwnList')
    expect(code(pushListToSlot(api, SHARMA, MOVABLE, target))).toBe('notOwnList')
    expect(code(markUnavailableAndMoveList(api, SHARMA, LIST_MOVE_DEMO.unavailableSlotId, 'unavailable', { route: 'office' }))).toBe('notOwnList')
    expect(api.getState()).toBe(before)
  })

  it('refuses a Draft List, a SUBMITTED List and a past List', () => {
    const api = store()
    expect(code(moveListToOffice(api, SOUTER, 'LD-001'))).toBe('draftList')
    expect(code(moveListToOffice(api, DELANEY, SEED_LIST_IDS.integrationLocked))).toBe('listSubmitted')
    const past = Object.values(api.getState().schedule.lists).find((l) => l.state === 'ACTIVE' && l.anaesthetistId === ANAE.souter && l.dateISO < '2026-07-21')!
    expect(code(moveListToOffice(api, SOUTER, past.id))).toBe('pastDate')
  })

  it('refuses a closed, occupied or other-day target, and a vacated status she may not choose', () => {
    const api = store()
    const free = pushTargets({ lists: api.getState().schedule.lists, slots: api.getState().schedule.slots, anaesthetists: api.getState().masters.anaesthetists, slotStatuses: api.getState().masters.slotStatuses }, MOVABLE)
    const offered = new Set(free.map((t) => t.anaesthetistId))
    const closed = Object.values(api.getState().masters.anaesthetists).find((a) => a.registrationNumber !== ANAE.souter && !offered.has(a.registrationNumber) && listInSlot(api.getState(), colleagueSlot(a.registrationNumber)) === undefined && api.getState().schedule.slots[colleagueSlot(a.registrationNumber)] !== undefined)
    if (closed !== undefined) expect(code(pushListToSlot(api, SOUTER, MOVABLE, colleagueSlot(closed.registrationNumber)))).toBe('targetNotOpen')
    const occupied = Object.values(api.getState().schedule.lists).find((l) => l.state === 'ACTIVE' && l.dateISO === MON27 && l.session === 'PM' && l.anaesthetistId !== ANAE.souter)!
    expect(code(pushListToSlot(api, SOUTER, MOVABLE, assigned(occupied).slotId))).toBe('slotOccupied')
    expect(code(pushListToSlot(api, SOUTER, MOVABLE, colleagueSlot(ANAE.chen, MON27, 'AM')))).toBe('differentSession')
    expect(code(moveListToOffice(api, SOUTER, MOVABLE, { vacatedStatus: 'nope' }))).toBe('invalidVacatedStatus')
  })

  it('markUnavailableAndMoveList refuses a status that keeps the session open, and a session with no List', () => {
    const api = store()
    expect(code(markUnavailableAndMoveList(api, SOUTER, LIST_MOVE_DEMO.unavailableSlotId, 'free', { route: 'office' }))).toBe('notClosedStatus')
    const empty = slotIdFor(ANAE.souter, '2026-07-22', 'PM')
    expect(listInSlot(api.getState(), empty)).toBeUndefined()
    expect(code(markUnavailableAndMoveList(api, SOUTER, empty, 'unavailable', { route: 'office' }))).toBe('noList')
  })

  it('refusal messages use no dash and never say "slot"', () => {
    const api = store()
    const outs = [
      moveListToOffice(api, OFFICE, MOVABLE),
      moveListToOffice(api, SHARMA, MOVABLE),
      pushListToSlot(api, SOUTER, MOVABLE, colleagueSlot(ANAE.chen, MON27, 'AM')),
      markUnavailableAndMoveList(api, SOUTER, LIST_MOVE_DEMO.unavailableSlotId, 'free', { route: 'office' }),
      setAvailability(api, SOUTER, ANAE.souter, '2026-07-23', 'PM', 'unavailable'),
    ]
    for (const o of outs) {
      expect(o.ok).toBe(false)
      const message = o.ok ? '' : o.message
      expect(message).not.toMatch(/[–—]/)
      expect(message).not.toMatch(/\bslots?\b/i)
    }
  })
})

describe('moveListToOffice (US-01.4.3; US-13.8.2 "Returned to the office")', () => {
  it('in one commit: a Draft List with the same id, hospital, surgeon and Bookings, the session Free, one list.ownerMove and one notification', () => {
    const api = store()
    const before = assigned(api.getState().schedule.lists[LIST_MOVE_DEMO.returnListId])
    const bookings = bookingsForList(api.getState(), before.id).map((b) => b.id)
    expect(bookings.length).toBeGreaterThan(0)
    const auditFrom = api.getState().audit.length
    const n = commits(api, () => expect(moveListToOffice(api, SOUTER, before.id, { message: 'Family matter' }).ok).toBe(true))
    expect(n).toBe(1)
    const after = draft(api.getState().schedule.lists[before.id])
    expect(after).toMatchObject({ id: before.id, hospitalId: before.hospitalId, surgeonId: before.surgeonId, dateISO: before.dateISO, session: before.session, state: 'DRAFT' })
    expect(after.draft).toMatchObject({ origin: 'movedToOffice', by: SOUTER.who, fromAnaesthetistId: ANAE.souter })
    expect(bookingsForList(api.getState(), before.id).map((b) => b.id)).toEqual(bookings)
    expect(api.getState().schedule.slots[before.slotId]?.status).toBe('free')
    expect(actions(api, auditFrom).filter((a) => !a.startsWith('list.conflict'))).toEqual(['list.ownerMove'])
    const entry = api.getState().audit.find((a) => a.action === 'list.ownerMove')!
    expect(entry).toMatchObject({
      entityId: before.id,
      who: SOUTER.who,
      before: { slotId: before.slotId, anaesthetistId: ANAE.souter, state: 'ACTIVE' },
      after: { slotId: null, anaesthetistId: null, state: 'DRAFT', route: 'office', cause: 'move', notificationId: 'NT0001' },
    })
    expect(Object.values(api.getState().notifications)).toEqual([
      expect.objectContaining({ id: 'NT0001', route: 'office', cause: 'move', listId: before.id, fromAnaesthetistId: ANAE.souter, message: 'Family matter', dateISO: before.dateISO, session: before.session }),
    ])
    expect(api.getState().notifications['NT0001']?.toAnaesthetistId).toBeUndefined()
  })

  it('a chosen Unavailable is written to her session, audited; the office then assigns the Draft List and it is ACTIVE again', () => {
    const api = store()
    const before = assigned(api.getState().schedule.lists[LIST_MOVE_DEMO.returnListId])
    expect(moveListToOffice(api, SOUTER, before.id, { vacatedStatus: 'unavailable' }).ok).toBe(true)
    expect(api.getState().schedule.slots[before.slotId]?.status).toBe('unavailable')
    expect(actions(api)).toContain('session.status')
    const colleague = Object.values(api.getState().masters.anaesthetists).find((a) => {
      const slot = api.getState().schedule.slots[slotIdFor(a.registrationNumber, before.dateISO, before.session)]
      return a.registrationNumber !== ANAE.souter && slot?.status === 'free' && listInSlot(api.getState(), slot.id) === undefined
    })!
    expect(assignDraftList(api, OFFICE, before.id, { anaesthetistId: colleague.registrationNumber }).ok).toBe(true)
    expect(assigned(api.getState().schedule.lists[before.id])).toMatchObject({ state: 'ACTIVE', anaesthetistId: colleague.registrationNumber })
  })
})

describe('pushListToSlot (US-01.4.3; US-13.8.2 "Moved to a colleague")', () => {
  it('moves the List exactly as the office\'s reassignment does, with one list.ownerMove, no list.reassign and one notification naming both', () => {
    const viaOffice = store()
    const viaOwn = store()
    const target = colleagueSlot(ANAE.chen)
    expect(reassignList(viaOffice, OFFICE, MOVABLE, ANAE.chen).ok).toBe(true)
    const auditFrom = viaOwn.getState().audit.length
    const n = commits(viaOwn, () => expect(pushListToSlot(viaOwn, SOUTER, MOVABLE, target).ok).toBe(true))
    expect(n).toBe(1)
    expect(viaOwn.getState().schedule.lists[MOVABLE]).toEqual(viaOffice.getState().schedule.lists[MOVABLE])
    expect(viaOwn.getState().schedule.slots).toEqual(viaOffice.getState().schedule.slots)
    expect(assigned(viaOwn.getState().schedule.lists[MOVABLE])).toMatchObject({ state: 'ACTIVE', anaesthetistId: ANAE.chen, slotId: target })
    const own = actions(viaOwn, auditFrom)
    expect(own).toContain('list.ownerMove')
    expect(own).not.toContain('list.reassign')
    expect(own.filter((a) => a === 'list.ownerMove')).toHaveLength(1)
    expect(viaOwn.getState().notifications['NT0001']).toMatchObject({ route: 'colleague', fromAnaesthetistId: ANAE.souter, toAnaesthetistId: ANAE.chen, cause: 'move' })
  })
})

describe('no preference warning, nothing revealed (US-01.4.5, US-13.6.3, D44)', () => {
  function shapeOf(api: BoundAppStore, from: number) {
    const entries = api.getState().audit.slice(from).map((a) => ({ action: a.action, before: a.before, after: a.after && { ...(a.after as Record<string, unknown>), anaesthetistId: 'X', slotId: 'X' } }))
    const notes = Object.values(api.getState().notifications).map((n) => Object.keys(n).sort())
    return { entries, notes }
  }

  it.each([
    ['anaesthetist side (seeded PP-005)', ANAE.ropata, false],
    ['surgeon side', ANAE.chen, true],
  ])('a move to a colleague with a not-preferred pairing with the surgeon, %s, is exactly a clean move', (_label, colleague, addSurgeonSide) => {
    const flagged = store()
    if (addSurgeonSide) expect(addPairingPreference(flagged, OFFICE, { kind: 'NOT_PREFERRED', raisedBy: 'SURGEON', anaesthetistId: colleague, surgeonId: SURG.lim }).ok).toBe(true)
    const clean = store()
    if (addSurgeonSide) expect(addPairingPreference(clean, OFFICE, { kind: 'NOT_PREFERRED', raisedBy: 'SURGEON', anaesthetistId: ANAE.whitaker, surgeonId: SURG.reid }).ok).toBe(true)
    const warningsBefore = openWarnings(flagged.getState())
    const fFrom = flagged.getState().audit.length
    const cFrom = clean.getState().audit.length
    expect(pushListToSlot(flagged, SOUTER, MOVABLE, colleagueSlot(colleague)).ok).toBe(true)
    // A clean colleague on the same List.
    expect(pushListToSlot(clean, SOUTER, MOVABLE, colleagueSlot(ANAE.morrison)).ok).toBe(true)
    const f = shapeOf(flagged, fFrom)
    const c = shapeOf(clean, cFrom)
    expect(f.entries.map((e) => e.action)).toEqual(c.entries.map((e) => e.action))
    expect(f.notes).toEqual(c.notes)
    expect(flagged.getState().audit.some((a) => a.action.endsWith('pairingAcknowledged'))).toBe(false)
    expect(JSON.stringify(Object.values(flagged.getState().notifications))).not.toMatch(/prefer|pairing|tier/i)
    expect(openWarnings(flagged.getState())).toEqual(warningsBefore)
  })

  it('the colleagues offered on the real seed are the same members in the same order whatever the office records (Availability only)', () => {
    const api = store()
    const before = pushTargets(moveInputOf(api.getState()), MOVABLE)
    expect(before.map((t) => t.anaesthetistId)).toContain(ANAE.ropata)
    // Not preferred on both sides with Ms Lim, and the tiers turned upside down.
    expect(addPairingPreference(api, OFFICE, { kind: 'NOT_PREFERRED', raisedBy: 'SURGEON', anaesthetistId: ANAE.chen, surgeonId: SURG.lim }).ok).toBe(true)
    expect(addPairingPreference(api, OFFICE, { kind: 'PREFERRED', raisedBy: 'SURGEON', anaesthetistId: ANAE.whitaker, surgeonId: SURG.lim }).ok).toBe(true)
    expect(setPriorityTier(api, OFFICE, ANAE.ropata, 1).ok).toBe(true)
    expect(setPriorityTier(api, OFFICE, ANAE.chen, 4).ok).toBe(true)
    expect(pushTargets(moveInputOf(api.getState()), MOVABLE)).toEqual(before)
  })

  it('the same pairing through the office\'s reassignList still acknowledges (the office path is unchanged)', () => {
    const api = store()
    expect(reassignList(api, OFFICE, MOVABLE, ANAE.ropata).ok).toBe(true)
    expect(api.getState().audit.filter((a) => a.action === 'list.pairingAcknowledged')).toHaveLength(1)
  })

  it('the unavailable hand-on to that colleague is as clean', () => {
    const api = store()
    expect(markUnavailableAndMoveList(api, SOUTER, slotIdFor(ANAE.souter, MON27, 'PM'), 'unavailable', { route: 'colleague', toSlotId: colleagueSlot(ANAE.ropata) }).ok).toBe(true)
    expect(api.getState().audit.some((a) => a.action.endsWith('pairingAcknowledged'))).toBe(false)
  })
})

describe('mark unavailable while holding a List (US-01.5.5)', () => {
  const slotId = LIST_MOVE_DEMO.unavailableSlotId // Souter Thu 23 PM
  const THU23 = '2026-07-23'
  it('AC1: the plain status change is refused with holdsList, so the offer is the only way through', () => {
    const api = store()
    const listId = listInSlot(api.getState(), slotId)!.id
    const out = setAvailability(api, SOUTER, ANAE.souter, THU23, 'PM', 'unavailable')
    expect(out).toMatchObject({ ok: false, code: 'holdsList', details: { listIds: [listId] } })
    expect(api.getState().schedule.slots[slotId]?.status).toBe('free')
  })

  it('AC2: "return to the office" leaves a Draft List with its hospital, surgeon and Bookings, and the session closed, in one commit', () => {
    const api = store()
    const list = listInSlot(api.getState(), slotId)!
    const bookings = bookingsForList(api.getState(), list.id).map((b) => b.id)
    const n = commits(api, () => expect(markUnavailableAndMoveList(api, SOUTER, slotId, 'unavailable', { route: 'office' }).ok).toBe(true))
    expect(n).toBe(1)
    expect(draft(api.getState().schedule.lists[list.id])).toMatchObject({ hospitalId: list.hospitalId, surgeonId: list.surgeonId, draft: { origin: 'unavailableReturn' } })
    expect(bookingsForList(api.getState(), list.id).map((b) => b.id)).toEqual(bookings)
    expect(api.getState().schedule.slots[slotId]?.status).toBe('unavailable')
    expect(Object.values(api.getState().notifications)).toEqual([expect.objectContaining({ route: 'office', cause: 'unavailable' })])
    expect(api.getState().audit.find((a) => a.action === 'list.ownerMove')?.after).toMatchObject({ cause: 'unavailable' })
  })

  it('AC3: "assign" moves the List into an available colleague\'s session, the session closed, no conflict', () => {
    const api = store()
    const list = listInSlot(api.getState(), slotId)!
    const s = api.getState()
    const target = pushTargets({ lists: s.schedule.lists, slots: s.schedule.slots, anaesthetists: s.masters.anaesthetists, slotStatuses: s.masters.slotStatuses }, list.id)[0]!
    expect(markUnavailableAndMoveList(api, SOUTER, slotId, 'holiday', { route: 'colleague', toSlotId: target.slotId }).ok).toBe(true)
    expect(assigned(api.getState().schedule.lists[list.id])).toMatchObject({ state: 'ACTIVE', anaesthetistId: target.anaesthetistId })
    expect(api.getState().schedule.slots[slotId]?.status).toBe('holiday')
    expect(assigned(api.getState().schedule.lists[list.id]).conflicts).toEqual([])
    expect(api.getState().notifications['NT0001']).toMatchObject({ route: 'colleague', cause: 'unavailable', toAnaesthetistId: target.anaesthetistId })
  })

  it('the guard holds on every path: a range over two booked sessions refuses with both, and applies once both are moved', () => {
    const api = store()
    const range = { anaesthetistId: ANAE.souter, fromISO: MON27, toISO: MON27, sessions: 'both' as const, statusKey: 'holiday' }
    const am = listInSlot(api.getState(), slotIdFor(ANAE.souter, MON27, 'AM'))!.id
    const pm = listInSlot(api.getState(), slotIdFor(ANAE.souter, MON27, 'PM'))!.id
    expect(setAvailabilityRange(api, SOUTER, range)).toMatchObject({ ok: false, code: 'holdsList', details: { listIds: [am, pm] } })
    expect(markUnavailableAndMoveList(api, SOUTER, slotIdFor(ANAE.souter, MON27, 'AM'), 'holiday', { route: 'office' }).ok).toBe(true)
    expect(markUnavailableAndMoveList(api, SOUTER, slotIdFor(ANAE.souter, MON27, 'PM'), 'holiday', { route: 'colleague', toSlotId: colleagueSlot(ANAE.chen) }).ok).toBe(true)
    const out = setAvailabilityRange(api, SOUTER, range)
    expect(out.ok).toBe(true)
    expect(Object.keys(api.getState().notifications)).toHaveLength(2)
  })

  it('a series and a single-instance edit over a booked session are refused for her too', () => {
    const api = store()
    // Souter's Monday PM recurring Lists.
    const series: AvailabilitySeriesDraft = { anaesthetistId: ANAE.souter, statusKey: 'unavailable', sessions: 'PM', weekdays: [1], everyWeeks: 1, startISO: '2026-08-24', untilISO: '2026-08-24' }
    expect(createAvailabilitySeries(api, SOUTER, series)).toMatchObject({ ok: false, code: 'holdsList' })
    // The office paints it (flagged), then she edits that one instance to Holiday: refused.
    expect(createAvailabilitySeries(api, OFFICE, series).ok).toBe(true)
    const instance = setAvailabilityRange(api, SOUTER, { anaesthetistId: ANAE.souter, fromISO: '2026-08-24', toISO: '2026-08-24', sessions: 'PM', statusKey: 'holiday' })
    expect(instance).toMatchObject({ ok: false, code: 'holdsList' })
  })

  it('a series retried after the prompt takes the moved sessions as its own (review fix)', () => {
    const api = store()
    // Souter's Monday PM recurring Lists: 27 Jul, 3 Aug and 10 Aug.
    const series: AvailabilitySeriesDraft = { anaesthetistId: ANAE.souter, statusKey: 'unavailable', sessions: 'PM', weekdays: [1], everyWeeks: 1, startISO: '2026-07-27', untilISO: '2026-08-10' }
    const refused = createAvailabilitySeries(api, SOUTER, series)
    const listIds = refused.ok ? [] : (refused.details as { listIds: string[] }).listIds
    expect(listIds).toHaveLength(3)
    const slotIds = listIds.map((id) => assigned(api.getState().schedule.lists[id]).slotId)
    for (const slotId of slotIds) expect(markUnavailableAndMoveList(api, SOUTER, slotId, 'unavailable', { route: 'office' }).ok).toBe(true)
    const out = createAvailabilitySeries(api, SOUTER, series, { adoptSlotIds: slotIds })
    expect(out.ok && [out.value.set, out.value.leftAsIs]).toEqual([3, 0])
    for (const slotId of slotIds) expect(api.getState().schedule.slots[slotId]?.seriesId).toBe('AS0001')
  })

  it('a SUBMITTED List in the session is refused outright, naming it, with no prompt to open (review fix)', () => {
    const api = store()
    const list = assigned(api.getState().schedule.lists[LIST_MOVE_DEMO.returnListId])
    api.setState({ schedule: { ...api.getState().schedule, lists: { ...api.getState().schedule.lists, [list.id]: { ...list, state: 'SUBMITTED' } } } })
    const out = setAvailability(api, SOUTER, ANAE.souter, list.dateISO, list.session, 'unavailable')
    expect(out).toMatchObject({ ok: false, code: 'holdsLockedList', message: 'Your Thu 23 Jul AM List has been submitted, so only the office can move it. Ask the office to change this session.' })
  })

  it("the office's sickness entry on a booked session still raises the conflict and keeps the List (US-01.5.2, OQ-81 part 3)", () => {
    const api = store()
    const list = listInSlot(api.getState(), slotId)!
    expect(setAvailability(api, OFFICE, ANAE.souter, THU23, 'PM', 'unavailable', 'Unwell').ok).toBe(true)
    expect(listInSlot(api.getState(), slotId)?.id).toBe(list.id)
    expect(assigned(api.getState().schedule.lists[list.id]).conflicts.some((c) => c.kind === 'availability')).toBe(true)
    // Her own move afterwards keeps the office's closed status: a move never reopens it.
    expect(pushListToSlot(api, SOUTER, list.id, pushTargets({ lists: api.getState().schedule.lists, slots: api.getState().schedule.slots, anaesthetists: api.getState().masters.anaesthetists, slotStatuses: api.getState().masters.slotStatuses }, list.id)[0]!.slotId).ok).toBe(true)
    expect(api.getState().schedule.slots[slotId]?.status).toBe('unavailable')
  })
})

describe('nothing recalculated on a move (US-06.3.5 AC2, US-06.5.4, D20)', () => {
  function money(api: BoundAppStore) {
    const s = api.getState()
    const prepaid = [SEED_LIST_IDS.prepaymentPaidList, SEED_LIST_IDS.prepaymentUnpaidList].flatMap((id) => bookingsForList(s, id))
    return { billing: s.billing, xero: s.xero, bookings: prepaid }
  }
  function prepared() {
    const api = store()
    // A sent-and-paid prepayment (Fri 24 PM, seeded) and a generated one awaiting payment (Fri 24 AM).
    const unpaid = bookingsForList(api.getState(), SEED_LIST_IDS.prepaymentUnpaidList)[0]!
    const raised = raisePreProcedureInvoice(api, OFFICE, unpaid.id)
    expect(raised.ok).toBe(true)
    expect(Object.values(api.getState().billing.invoices).filter((i) => i.kind === 'prePayment').length).toBeGreaterThanOrEqual(2)
    return api
  }
  const paidSlot = () => slotIdFor(ANAE.souter, '2026-07-24', 'PM')

  it.each(['office', 'colleague', 'unavailable', 'unavailable-to-office'] as const)('the %s move leaves every invoice, prepayment, billing case and Xero record as it was', (kind) => {
    const api = prepared()
    const before = money(api)
    const auditFrom = api.getState().audit.length
    const list = assigned(api.getState().schedule.lists[SEED_LIST_IDS.prepaymentPaidList])
    const s = api.getState()
    const target = pushTargets({ lists: s.schedule.lists, slots: s.schedule.slots, anaesthetists: s.masters.anaesthetists, slotStatuses: s.masters.slotStatuses }, list.id)[0]!
    const out =
      kind === 'office'
        ? moveListToOffice(api, SOUTER, list.id)
        : kind === 'colleague'
          ? pushListToSlot(api, SOUTER, list.id, target.slotId)
          : kind === 'unavailable'
            ? markUnavailableAndMoveList(api, SOUTER, paidSlot(), 'unavailable', { route: 'colleague', toSlotId: target.slotId })
            : markUnavailableAndMoveList(api, SOUTER, paidSlot(), 'unavailable', { route: 'office' })
    expect(out.ok).toBe(true)
    const after = money(api)
    expect(after.billing).toEqual(before.billing)
    expect(after.xero).toEqual(before.xero)
    expect(after.bookings).toEqual(before.bookings)
    expect(actions(api, auditFrom).filter((a) => /prepayment|invoice|billing|xero|payable/i.test(a))).toEqual([])
  })
})

describe('determinism', () => {
  it('the same moves on the same seed give identical ids and state', () => {
    const run = () => {
      const api = store()
      moveListToOffice(api, SOUTER, LIST_MOVE_DEMO.returnListId)
      pushListToSlot(api, SOUTER, MOVABLE, colleagueSlot(ANAE.chen))
      markUnavailableAndMoveList(api, SOUTER, LIST_MOVE_DEMO.unavailableSlotId, 'unavailable', { route: 'office' })
      const s = api.getState()
      return { notifications: s.notifications, lists: s.schedule.lists, slots: s.schedule.slots, audit: s.audit, counters: s.counters }
    }
    expect(run()).toEqual(run())
  })
})
