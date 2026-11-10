/**
 * Marking a booked session not available, for every actor (catch-up Phase 32b;
 * US-01.5.5, US-01.5.4, US-01.6.3; D59, D60): the office's forced return or
 * hand-on, the vacated-session choice validated in the store, and the colleague
 * stand-in that makes a closed session available.
 */

import { describe, expect, it } from 'vitest'
import { assigned } from '../test/lists'
import { createAppStore, type BoundAppStore } from './appStore'
import { markUnavailableAndMoveList, moveListToOffice, pushListToSlot } from './listMoveActions'
import { setAvailability } from './slotActions'
import { createAvailabilitySeries, setAvailabilityRange } from './availabilityActions'
import { addSlotStatus } from './slotStatusActions'
import { sicknessCandidates } from './demoSimulations'
import { getISODay, parseISO } from 'date-fns'
import { makeAvailableRefusal, makeSessionAvailableAsColleague, closedColleagueSessions } from './listMoveDemo'
import { listInSlot } from './selectors'
import { OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import type { Actor } from './mutate'
import { ANAE, LIST_MOVE_DEMO, SEED_LIST_IDS } from '../domain/seed'
import { slotIdFor } from '../domain/slots'
import { addPairingPreference } from './officePrivate'

const OFFICE = OFFICE_ACTOR
const SOUTER = SOUTER_ACTOR
const store = (): BoundAppStore => createAppStore()
const code = (o: { ok: boolean; code?: string }) => (o.ok ? 'ok' : o.code)

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

/** Dr Chen's Tue 21 PM Christchurch Eye Surgery List (Ms A. Reid): an ACTIVE colleague List the office can mark. */
const CHEN_PM = `L-${ANAE.chen}-2026-07-21-PM`
const chenSlot = slotIdFor(ANAE.chen, '2026-07-21', 'PM')
const freeColleague = (api: BoundAppStore, dateISO: string, session: 'AM' | 'PM' | 'OOH', not: string) =>
  Object.values(api.getState().schedule.slots).find((s) => s.dateISO === dateISO && s.session === session && s.anaesthetistId !== not && s.status === 'free' && listInSlot(api.getState(), s.id) === undefined)!

describe('the office marks a booked session not available (D59)', () => {
  it('return: one commit, the List a Draft List (unavailableReturn), the session closed with its note, office audit, no notice, no conflict', () => {
    const api = store()
    const pool = Object.keys(api.getState().notifications).length
    const auditBefore = api.getState().audit.length
    expect(commits(api, () => expect(markUnavailableAndMoveList(api, OFFICE, chenSlot, 'unavailable', { route: 'office' }, { note: 'Unwell' }).ok).toBe(true))).toBe(1)
    expect(api.getState().schedule.lists[CHEN_PM]).toMatchObject({ state: 'DRAFT', draft: { origin: 'unavailableReturn', by: 'Kirsty W.', fromAnaesthetistId: ANAE.chen } })
    expect(api.getState().schedule.slots[chenSlot]).toMatchObject({ status: 'unavailable', note: 'Unwell' })
    expect(Object.keys(api.getState().notifications)).toHaveLength(pool)
    const added = api.getState().audit.slice(auditBefore)
    expect(added.map((a) => a.action)).toEqual(['draftList.detach', 'session.status'])
    expect(added.every((a) => a.role === 'office' && a.who === 'Kirsty W.')).toBe(true)
    expect(added.some((a) => a.action === 'list.ownerMove' || a.action === 'list.conflict')).toBe(false)
  })

  it('hand-on: the List moves ACTIVE into an open colleague session, list.reassign plus the acknowledgement for a not-preferred pairing', () => {
    const api = store()
    // Dr Sharma is not preferred with Ms Reid (seeded) and free on Tue 21 PM.
    const sharmaPm = slotIdFor(ANAE.sharma, '2026-07-21', 'PM')
    expect(markUnavailableAndMoveList(api, OFFICE, chenSlot, 'unavailable', { route: 'colleague', toSlotId: sharmaPm }).ok).toBe(true)
    expect(api.getState().schedule.lists[CHEN_PM]).toMatchObject({ state: 'ACTIVE', slotId: sharmaPm, anaesthetistId: ANAE.sharma })
    const actions = api.getState().audit.filter((a) => a.entityId === CHEN_PM).map((a) => a.action)
    expect(actions).toEqual(expect.arrayContaining(['list.reassign', 'list.pairingAcknowledged']))
    expect(api.getState().schedule.slots[chenSlot]?.status).toBe('unavailable')
  })

  it('never onto a closed session: the hand-on refuses targetNotOpen with plain words', () => {
    const api = store()
    const ngataPm = slotIdFor(ANAE.ngata, '2026-07-21', 'PM')
    const before = api.getState().schedule
    const out = markUnavailableAndMoveList(api, OFFICE, chenSlot, 'unavailable', { route: 'colleague', toSlotId: ngataPm })
    expect(out).toMatchObject({ ok: false, code: 'targetNotOpen', message: 'Dr Ngata has marked this session not available. They need to make it available first.' })
    expect(api.getState().schedule).toBe(before)
  })

  it('a SUBMITTED List can only be handed on; an AUTHORISED List refuses', () => {
    const api = store()
    // Dr Chen's Tue 21 PM List, submitted today.
    const submitted = { ...assigned(api.getState().schedule.lists[CHEN_PM]), state: 'SUBMITTED' as const }
    api.setState({ schedule: { ...api.getState().schedule, lists: { ...api.getState().schedule.lists, [CHEN_PM]: submitted } } })
    expect(code(markUnavailableAndMoveList(api, OFFICE, chenSlot, 'unavailable', { route: 'office' }))).toBe('submittedHandOnOnly')
    // The guard on the plain status write names it for the prompt (a hand-on is possible).
    expect(setAvailability(api, OFFICE, ANAE.chen, '2026-07-21', 'PM', 'unavailable')).toMatchObject({ ok: false, code: 'holdsList' })
    const to = freeColleague(api, '2026-07-21', 'PM', ANAE.chen)
    expect(markUnavailableAndMoveList(api, OFFICE, chenSlot, 'unavailable', { route: 'colleague', toSlotId: to.id }).ok).toBe(true)
    expect(api.getState().schedule.lists[CHEN_PM]).toMatchObject({ state: 'SUBMITTED', slotId: to.id })
    const api2 = store()
    const authorised = { ...assigned(api2.getState().schedule.lists[CHEN_PM]), state: 'AUTHORISED' as const }
    api2.setState({ schedule: { ...api2.getState().schedule, lists: { ...api2.getState().schedule.lists, [CHEN_PM]: authorised } } })
    expect(code(markUnavailableAndMoveList(api2, OFFICE, chenSlot, 'unavailable', { route: 'office' }))).toBe('listAuthorised')
    expect(setAvailability(api2, OFFICE, ANAE.chen, '2026-07-21', 'PM', 'unavailable')).toMatchObject({ ok: false, code: 'holdsLockedList', message: 'The Tue 21 Jul PM List is authorised and locked, so its session cannot be marked not available.' })
  })

  it('a feed may not; a status that keeps the session open is refused', () => {
    const api = store()
    const feed: Actor = { who: 'Feed', role: 'system', source: 'integration' }
    expect(code(markUnavailableAndMoveList(api, feed, chenSlot, 'unavailable', { route: 'office' }))).toBe('notAllowed')
    expect(code(markUnavailableAndMoveList(api, OFFICE, chenSlot, 'free', { route: 'office' }))).toBe('notClosedStatus')
  })
})

describe('review fixes (catch-up Phase 32b review pass)', () => {
  it('the office cannot return or hand on a List whose day has passed (it could never be assigned again); Simulate sickness skips past Lists', () => {
    const api = store()
    const past = Object.values(api.getState().schedule.lists).find((l) => l.state === 'ACTIVE' && l.dateISO < '2026-07-21' && !l.id.startsWith('L-HIST'))!
    const slotId = assigned(past).slotId
    expect(code(markUnavailableAndMoveList(api, OFFICE, slotId, 'unavailable', { route: 'office' }))).toBe('pastDate')
    expect(api.getState().schedule.lists[past.id]?.state).toBe('ACTIVE')
    expect(sicknessCandidates(api.getState(), past.dateISO)).toEqual([])
  })

  it('a session left Free after its List moves takes no sickness note', () => {
    const api = store()
    expect(markUnavailableAndMoveList(api, OFFICE, chenSlot, 'unavailable', { route: 'office' }, { vacatedStatus: 'free', note: 'Unwell' }).ok).toBe(true)
    expect(api.getState().schedule.slots[chenSlot]?.status).toBe('free')
    expect(api.getState().schedule.slots[chenSlot]?.note).toBeUndefined()
  })

  it('her days off keep a session she chose to make Free when its List left: the range and the series skip it (D60)', () => {
    const api = store()
    const slotId = LIST_MOVE_DEMO.unavailableSlotId
    const slot = api.getState().schedule.slots[slotId]!
    expect(markUnavailableAndMoveList(api, SOUTER, slotId, 'unavailable', { route: 'office' }, { vacatedStatus: 'free' }).ok).toBe(true)
    const out = setAvailabilityRange(api, SOUTER, { anaesthetistId: ANAE.souter, fromISO: slot.dateISO, toISO: slot.dateISO, sessions: slot.session, statusKey: 'unavailable', skipSlotIds: [slotId] })
    expect(out.ok).toBe(true)
    expect(api.getState().schedule.slots[slotId]?.status).toBe('free')
    const weekday = getISODay(parseISO(slot.dateISO)) as 1 | 2 | 3 | 4 | 5 | 6 | 7
    const series = createAvailabilitySeries(api, SOUTER, { anaesthetistId: ANAE.souter, statusKey: 'unavailable', sessions: slot.session === 'OOH' ? 'both' : slot.session, weekdays: [weekday], everyWeeks: 1, startISO: slot.dateISO, untilISO: slot.dateISO }, { skipSlotIds: [slotId] })
    expect(series.ok).toBe(true)
    expect(api.getState().schedule.slots[slotId]?.status).toBe('free')
  })

  it('the colleague stand-in is not offered on a status only the office sets', () => {
    const api = store()
    expect(addSlotStatus(api, OFFICE, { label: 'Office hold', longLabel: 'Held by the office', description: 'Office use.', colour: 'unavailable', treatment: 'hatched', bookable: false, anaesthetistCanSet: false, isDefault: false }).ok).toBe(true)
    const sharmaPm = slotIdFor(ANAE.sharma, '2026-07-21', 'PM')
    expect(setAvailabilityRange(api, OFFICE, { anaesthetistId: ANAE.sharma, fromISO: '2026-07-21', toISO: '2026-07-21', sessions: 'PM', statusKey: 'ST0001' }).ok).toBe(true)
    expect(makeAvailableRefusal(api.getState(), sharmaPm)).toBe('Set by the office: the office changes it')
    expect(closedColleagueSessions(api.getState(), CHEN_PM)).not.toContain(sharmaPm)
  })
})

describe('the vacated-session choice, validated in the store (D60)', () => {
  it('on the mark-unavailable path: the status being set by default, or Free; nothing else', () => {
    const api = store()
    expect(code(markUnavailableAndMoveList(api, OFFICE, chenSlot, 'unavailable', { route: 'office' }, { vacatedStatus: 'holiday' }))).toBe('invalidVacatedStatus')
    expect(markUnavailableAndMoveList(api, OFFICE, chenSlot, 'holiday', { route: 'office' }, { vacatedStatus: 'free' }).ok).toBe(true)
    expect(api.getState().schedule.slots[chenSlot]?.status).toBe('free')
    const api2 = store()
    expect(markUnavailableAndMoveList(api2, OFFICE, chenSlot, 'holiday', { route: 'office' }).ok).toBe(true)
    expect(api2.getState().schedule.slots[chenSlot]?.status).toBe('holiday')
  })

  it("her own moves: Free or Unavailable only, Free by default; the unavailable prompt takes her choice too", () => {
    const api = store()
    expect(code(moveListToOffice(api, SOUTER, LIST_MOVE_DEMO.movableListId, { vacatedStatus: 'holiday' }))).toBe('invalidVacatedStatus')
    expect(moveListToOffice(api, SOUTER, LIST_MOVE_DEMO.movableListId).ok).toBe(true)
    expect(api.getState().schedule.slots[slotIdFor(ANAE.souter, '2026-07-27', 'PM')]?.status).toBe('free')
    const slotId = LIST_MOVE_DEMO.unavailableSlotId
    expect(markUnavailableAndMoveList(api, SOUTER, slotId, 'unavailable', { route: 'office' }, { vacatedStatus: 'free' }).ok).toBe(true)
    expect(api.getState().schedule.slots[slotId]?.status).toBe('free')
    expect(code(pushListToSlot(api, SOUTER, SEED_LIST_IDS.souterPm21, slotIdFor(ANAE.chen, '2026-07-21', 'PM'), { vacatedStatus: 'nope' }))).toBe('invalidVacatedStatus')
  })
})

describe('Ask Dr X to make this session available (the colleague stand-in, US-01.6.3)', () => {
  it('sets a closed, empty session Free as that anaesthetist; never one holding a List or one already open', () => {
    const api = store()
    const ngataAm = slotIdFor(ANAE.ngata, '2026-07-21', 'AM')
    expect(makeAvailableRefusal(api.getState(), ngataAm)).toBeNull()
    const out = makeSessionAvailableAsColleague(api, ngataAm)
    expect(out.ok).toBe(true)
    expect(api.getState().schedule.slots[ngataAm]?.status).toBe('free')
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'session.status', role: 'anaesthetist', who: 'Dr Tom Ngata' })
    expect(makeAvailableRefusal(api.getState(), ngataAm)).toBe('Already available')
    expect(makeAvailableRefusal(api.getState(), assigned(api.getState().schedule.lists[CHEN_PM]).slotId)).toBe('This session holds a List')
    expect(code(makeSessionAvailableAsColleague(api, chenSlot))).toBe('notEligible')
  })

  it("lists a List's closed, empty colleague sessions that day and session, never the List's own", () => {
    const api = store()
    const ids = closedColleagueSessions(api.getState(), 'L-29104-2026-07-22-AM')
    expect(ids).toContain(slotIdFor(ANAE.rutherford, '2026-07-22', 'AM'))
    for (const id of ids) expect(makeAvailableRefusal(api.getState(), id)).toBeNull()
    const own = closedColleagueSessions(api.getState(), SEED_LIST_IDS.souterAm21)
    expect(own.some((id) => id.startsWith(`S-${ANAE.souter}-`))).toBe(false)
  })
})

describe('pairing preferences never reach the anaesthetist path', () => {
  it('her own unavailable hand-on writes no acknowledgement even onto a not-preferred colleague', () => {
    const api = store()
    const list = assigned(api.getState().schedule.lists[LIST_MOVE_DEMO.movableListId])
    const to = freeColleague(api, list.dateISO, list.session, ANAE.souter)
    expect(addPairingPreference(api, OFFICE, { kind: 'NOT_PREFERRED', raisedBy: 'SURGEON', anaesthetistId: to.anaesthetistId, surgeonId: list.surgeonId }).ok).toBe(true)
    expect(markUnavailableAndMoveList(api, SOUTER, list.slotId, 'unavailable', { route: 'colleague', toSlotId: to.id }).ok).toBe(true)
    expect(api.getState().audit.some((a) => a.action === 'list.pairingAcknowledged' && a.entityId === list.id)).toBe(false)
  })
})
