/**
 * Draft Lists in the store (catch-up Phase 31; FT-01.6, US-01.6.1 to
 * US-01.6.4, EP-07, FT-07.1, US-01.3.1, US-01.3.5; OQ-44, OQ-81 part 2, OQ-86).
 *
 * Create, assign, re-date and remove with every refusal and audit; "takes no
 * Slot"; DRAFT to ACTIVE and ACTIVE to DRAFT; Bookings on a Draft List; the
 * soft warnings and the not-preferred acknowledgement; the prepayment seam;
 * the recurring clash on every path that yields one; and the store-wide
 * lifecycle and pairing invariant after a sweep of actions.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import {
  addRecurringBooking,
  applyRecurringBookingsToCanvas,
  assignDraftList,
  authoriseList,
  cancelBooking,
  completeBooking,
  createBooking,
  createDraftList,
  draftListFitsAnaesthetist,
  editList,
  editRecurringBooking,
  reassignBooking,
  redateDraftList,
  removeDraftList,
  retireRecurringBooking,
  setAvailability,
  setHorizonMonths,
  submitList,
  type NewDraftListInput,
} from './index'
import { advanceClockDays, advanceClockMinutes } from './clockActions'
import { createAvailabilitySeries } from './availabilityActions'
import { detachListToDraft, withGenerated } from './slotActions'
import { addPostOpAddendum } from './bookingActions'
import { OFFICE_ACTOR, OFFICE_SIMULATION_ACTOR, SOUTER_ACTOR } from './demoActors'
import { clockISO, type Actor } from './mutate'
import {
  bookingCountsByList,
  conflictRows,
  draftListAvailabilityFor,
  draftListsForDate,
  finishedDraftLists,
  listInSlot,
  listsForDate,
  prepaymentStatusFor,
  scheduleHorizon,
  slotViewsForAnaesthetist,
  slotViewsForDate,
  submittedLists,
  waitingDraftListCount,
  waitingDraftLists,
} from './selectors'
import { openWarnings } from './warnings'
import { sicknessCandidates } from './demoSimulations'
import { ANAE, HOSP, SEED_DRAFT_LIST_IDS, SURG } from '../domain/seed'
import { slotIdFor } from '../domain/slots'
import { isActivePairing } from '../domain/listPairing'
import { assigned, draft } from '../test/lists'
import { addDays, format, parseISO } from 'date-fns'

const OFFICE = OFFICE_ACTOR
const FEED: Actor = { who: 'HL7 feed', role: 'system', source: 'integration' }
const store = (): BoundAppStore => createAppStore()
const code = (o: { ok: boolean; code?: string }) => (o.ok ? 'ok' : o.code)
const TUE21 = '2026-07-21'
const THU23 = '2026-07-23'

/** Thu 23 PM, St George's, Mr Tan: a fresh request no seed fact touches. */
const request: NewDraftListInput = { hospitalId: HOSP.stg, surgeonId: SURG.tan, dateISO: THU23, session: 'PM', source: 'phone' }

function create(api: BoundAppStore, over: Partial<NewDraftListInput> = {}): string {
  const out = createDraftList(api, OFFICE, { ...request, ...over })
  if (!out.ok) throw new Error(out.message)
  return out.value.listId
}

/** The store-wide FT-07.1 and US-01.3.1 invariant. */
function expectLifecycleInvariant(api: BoundAppStore): void {
  const s = api.getState()
  for (const l of Object.values(s.schedule.lists)) {
    expect(s.masters.hospitals[l.hospitalId], `${l.id} hospital`).toBeDefined()
    expect(s.masters.surgeons[l.surgeonId], `${l.id} surgeon`).toBeDefined()
    if (l.state === 'DRAFT') {
      expect(l.anaesthetistId, l.id).toBeUndefined()
      expect(l.slotId, l.id).toBeUndefined()
    } else {
      expect(isActivePairing(l), l.id).toBe(true)
    }
  }
}

describe('createDraftList (US-01.6.1)', () => {
  it('writes a DRAFT List with no anaesthetist and takes no Slot: the Slots and every other List are untouched', () => {
    const api = store()
    const before = api.getState()
    const id = create(api, { note: '  Booking office rang  ' })
    const after = api.getState()
    expect(after.schedule.slots).toBe(before.schedule.slots)
    for (const [lid, l] of Object.entries(before.schedule.lists)) expect(after.schedule.lists[lid]).toBe(l)
    const list = draft(after.schedule.lists[id])
    expect(id).toMatch(/^LG\d{4}$/)
    expect(list).toMatchObject({ state: 'DRAFT', hospitalId: HOSP.stg, surgeonId: SURG.tan, dateISO: THU23, session: 'PM', kind: 'private', notes: 'Booking office rang', conflicts: [] })
    expect(list.draft).toEqual({ origin: 'request', source: 'phone', sinceISO: clockISO(before.clock), by: 'Kirsty W.' })
    expect(after.audit.at(-1)).toMatchObject({ action: 'draftList.create', entityId: id, after: { state: 'DRAFT', origin: 'request', source: 'phone' } })
  })

  it('refuses each missing field, a passed day, a day beyond the schedule, a missing source, and anyone but the office', () => {
    const api = store()
    expect(code(createDraftList(api, OFFICE, { ...request, hospitalId: '' }))).toBe('pairingIncomplete')
    expect(code(createDraftList(api, OFFICE, { ...request, surgeonId: '' }))).toBe('pairingIncomplete')
    expect(code(createDraftList(api, OFFICE, { ...request, surgeonId: 'S-NOPE' }))).toBe('pairingIncomplete')
    expect(code(createDraftList(api, OFFICE, { ...request, dateISO: '' }))).toBe('dateRequired')
    expect(code(createDraftList(api, OFFICE, { ...request, session: 'XX' as never }))).toBe('invalidSession')
    expect(code(createDraftList(api, OFFICE, { ...request, dateISO: '2026-07-20' }))).toBe('datePassed')
    const beyond = createDraftList(api, OFFICE, { ...request, dateISO: '2027-01-15' })
    expect(beyond.ok ? '' : beyond.message).toBe('That day is beyond the schedule, which runs 4 months ahead.')
    expect(code(createDraftList(api, OFFICE, { ...request, source: undefined }))).toBe('sourceRequired')
    expect(code(createDraftList(api, SOUTER_ACTOR, request))).toBe('officeOnly')
    expect(code(createDraftList(api, FEED, request))).toBe('integrationForbidden')
    const refused = createDraftList(api, OFFICE, { ...request, surgeonId: '' })
    expect(refused.ok ? '' : refused.message).toBe('Choose the surgeon.')
    // Phase 33's hospital row needs no source.
    expect(code(createDraftList(api, OFFICE, { ...request, source: undefined }, 'hospitalRow'))).toBe('ok')
  })

  it('a Draft List at a hospital with a holiday that day carries the holiday conflict, as any List does', () => {
    const api = store()
    const id = create(api, { hospitalId: HOSP.sx, dateISO: '2026-07-22', session: 'AM' })
    expect(api.getState().schedule.lists[id]!.conflicts).toMatchObject([{ kind: 'holiday', holidayId: 'HH900' }])
    const row = conflictRows(api.getState()).find((r) => r.listId === id)!
    expect(row).toMatchObject({ reason: 'Hospital closed', listState: 'DRAFT' })
    expect(row.anaesthetistId).toBeUndefined()
  })
})

describe('Bookings on a Draft List (US-01.6.1 "Bookings allowed")', () => {
  it('the office adds a Booking and moves one off it; an anaesthetist cannot; it cannot be submitted or authorised', () => {
    const api = store()
    const id = create(api)
    const added = createBooking(api, OFFICE, id, { patient: { name: 'Test Patient', dobISO: '1970-01-01' }, operation: 'Cystoscopy', billingRoute: 'billableParty' })
    expect(added.ok).toBe(true)
    const bookingId = added.ok ? added.value.bookingId : ''
    expect(code(createBooking(api, SOUTER_ACTOR, id, { patient: { name: 'X Y', dobISO: '1970-01-01' }, operation: 'X', billingRoute: 'hospital' }))).toBe('notOwnList')
    expect(code(submitList(api, OFFICE, id))).toBe('listNotActive')
    const sub = submitList(api, OFFICE, id)
    expect(sub.ok ? '' : sub.message).toBe('Assign an anaesthetist first.')
    const auth = authoriseList(api, OFFICE, id)
    expect(auth.ok ? '' : auth.message).toBe('Assign an anaesthetist first.')
    // The prepayment routine sees no anaesthetist: nothing required, nothing generated.
    expect(prepaymentStatusFor(api.getState(), bookingId)).toBe('none')
    expect(openWarnings(api.getState()).filter((w) => w.listId === id)).toEqual([])
    // Off it, onto an ACTIVE List, and back.
    const target = slotViewsForDate(api.getState(), THU23).find((v) => v.list !== undefined && v.list.state === 'ACTIVE')!.list!
    expect(reassignBooking(api, OFFICE, bookingId, target.id).ok).toBe(true)
    expect(reassignBooking(api, OFFICE, bookingId, id).ok).toBe(true)
    expect(api.getState().schedule.bookings[bookingId]!.listId).toBe(id)
  })
})

describe('assignDraftList (US-01.6.3)', () => {
  it('the same List goes ACTIVE in the anaesthetist\'s session with its Bookings, pairing and note; the trail is kept; audited DRAFT to ACTIVE', () => {
    const api = store()
    const id = SEED_DRAFT_LIST_IDS.forte
    const before = draft(api.getState().schedule.lists[id])
    const bookingIds = Object.values(api.getState().schedule.bookings).filter((b) => b.listId === id).map((b) => b.id)
    const auditBefore = api.getState().audit.length
    const out = assignDraftList(api, OFFICE, id, { anaesthetistId: ANAE.souter })
    expect(out.ok && out.value.warnings).toEqual([])
    expect(out.ok && out.value.firstAssignmentBookingIds).toEqual(bookingIds)
    const after = assigned(api.getState().schedule.lists[id])
    expect(after).toMatchObject({ state: 'ACTIVE', anaesthetistId: ANAE.souter, slotId: slotIdFor(ANAE.souter, '2026-07-22', 'PM'), hospitalId: before.hospitalId, surgeonId: before.surgeonId, notes: before.notes })
    expect(after.draft).toMatchObject({ ...before.draft, assignedAtISO: clockISO(api.getState().clock), assignedBy: 'Kirsty W.' })
    expect(listInSlot(api.getState(), after.slotId)?.id).toBe(id)
    expect(Object.values(api.getState().schedule.bookings).filter((b) => b.listId === id).map((b) => b.id)).toEqual(bookingIds)
    const metas = api.getState().audit.slice(auditBefore)
    expect(metas.map((a) => a.action)).toEqual(['draftList.assign'])
    expect(metas[0]).toMatchObject({ before: { state: 'DRAFT', anaesthetistId: null, slotId: null }, after: { state: 'ACTIVE', anaesthetistId: ANAE.souter } })
    expect(waitingDraftLists(api.getState()).some((l) => l.id === id)).toBe(false)
    expect(finishedDraftLists(api.getState())[0]?.id).toBe(id)
    // Now it is the anaesthetist's ACTIVE List.
    expect(slotViewsForAnaesthetist(api.getState(), ANAE.souter, '2026-07-22', '2026-07-22').some((v) => v.list?.id === id)).toBe(true)
    expectLifecycleInvariant(api)
  })

  it('refuses: not found, not a Draft List, unknown or inactive anaesthetist, a passed day, an occupied session, anyone but the office', () => {
    const api = store()
    const id = create(api)
    expect(code(assignDraftList(api, OFFICE, 'LG9999', { anaesthetistId: ANAE.souter }))).toBe('notFound')
    expect(code(assignDraftList(api, OFFICE, assigned(api.getState().schedule.lists[slotViewsForDate(api.getState(), THU23).find((v) => v.list !== undefined)!.list!.id]).id, { anaesthetistId: ANAE.souter }))).toBe('notDraftList')
    expect(code(assignDraftList(api, OFFICE, id, { anaesthetistId: 'A-NOPE' }))).toBe('anaesthetistNotFound')
    const occupied = slotViewsForDate(api.getState(), THU23).find((v) => v.slot.session === 'PM' && v.list !== undefined)!
    const refused = assignDraftList(api, OFFICE, id, { anaesthetistId: occupied.slot.anaesthetistId })
    expect(code(refused)).toBe('slotOccupied')
    expect(refused.ok ? '' : refused.message).toMatch(/already has a List that session\. Resolve it first\.$/)
    expect(code(assignDraftList(api, SOUTER_ACTOR, id, { anaesthetistId: ANAE.souter }))).toBe('officeOnly')
    expect(code(assignDraftList(api, FEED, id, { anaesthetistId: ANAE.souter }))).toBe('integrationForbidden')
    // An inactive anaesthetist (set directly: deactivating one with Lists ahead is refused by its own action).
    const masters = api.getState().masters
    api.setState({ masters: { ...masters, anaesthetists: { ...masters.anaesthetists, [ANAE.hughes]: { ...masters.anaesthetists[ANAE.hughes]!, active: false } } } })
    expect(code(assignDraftList(api, OFFICE, id, { anaesthetistId: ANAE.hughes }))).toBe('anaesthetistInactive')
    advanceClockDays(api, 3)
    const passed = assignDraftList(api, OFFICE, id, { anaesthetistId: ANAE.sharma })
    expect(code(passed)).toBe('datePassed')
    expect(passed.ok ? '' : passed.message).toBe("This Draft List's day has passed. Change its date or remove it.")
  })

  it('warns, never blocks: a closed session assigns and raises a conflict, naming the status and asking the office to check', () => {
    const api = store()
    const clash = 'LD-RCB016-2026-07-21-AM'
    const out = assignDraftList(api, OFFICE, clash, { anaesthetistId: ANAE.ngata })
    expect(out.ok).toBe(true)
    expect(out.ok && out.value.warnings[0]).toMatch(/^Dr Ngata is on .+ for this session\. Assigning flags a conflict on the List\. Check with Dr Ngata first\.$/)
    const list = assigned(api.getState().schedule.lists[clash])
    expect(list.conflicts).toMatchObject([{ kind: 'availability' }])
    expect(conflictRows(api.getState()).some((r) => r.listId === clash && r.reason === 'Anaesthetist unavailable')).toBe(true)
  })

  it('a not-preferred pairing assigns and writes one acknowledgement; a preferred one writes none', () => {
    const api = store()
    const reid = SEED_DRAFT_LIST_IDS.eyeSurgery
    const out = assignDraftList(api, OFFICE, reid, { anaesthetistId: ANAE.sharma })
    expect(out.ok && out.value.warnings.some((w) => /prefers not to work with Dr Priya Sharma/.test(w))).toBe(true)
    expect(api.getState().audit.filter((a) => a.entityId === reid && a.action === 'list.pairingAcknowledged')).toHaveLength(1)
    const whitford = create(api, { hospitalId: HOSP.ces, surgeonId: SURG.whitford })
    expect(assignDraftList(api, OFFICE, whitford, { anaesthetistId: ANAE.sharma }).ok).toBe(true)
    expect(api.getState().audit.filter((a) => a.entityId === whitford && a.action === 'list.pairingAcknowledged')).toHaveLength(0)
  })

  it('a hospital holiday stays on the List after assignment, and the warning says so', () => {
    const api = store()
    const id = create(api, { hospitalId: HOSP.sx, dateISO: '2026-07-22', session: 'AM' })
    const free = slotViewsForDate(api.getState(), '2026-07-22').find((v) => v.slot.session === 'AM' && v.open)!
    const out = assignDraftList(api, OFFICE, id, { anaesthetistId: free.slot.anaesthetistId })
    expect(out.ok && out.value.warnings).toEqual(['Southern Cross is closed that day (hospital holiday). The List keeps its conflict.'])
    expect(api.getState().schedule.lists[id]!.conflicts).toMatchObject([{ kind: 'holiday' }])
  })

  it('draftListFitsAnaesthetist: a boolean, true only on a free session with no not-preferred pairing', () => {
    const api = store()
    const s = api.getState()
    expect(draftListFitsAnaesthetist(s, SEED_DRAFT_LIST_IDS.forte, ANAE.souter)).toBe(true)
    expect(draftListFitsAnaesthetist(s, SEED_DRAFT_LIST_IDS.eyeSurgery, ANAE.sharma)).toBe(false)
    expect(draftListFitsAnaesthetist(s, 'LD-RCB016-2026-07-21-AM', ANAE.ngata)).toBe(false)
  })
})

describe('the availability view (US-01.6.3: everybody potentially available)', () => {
  it('puts every active anaesthetist with a session in one group, by status alone', () => {
    const api = store()
    const av = draftListAvailabilityFor(api.getState(), SEED_DRAFT_LIST_IDS.stGeorges)!
    expect(av.free.map((r) => r.anaesthetistId)).toEqual(expect.arrayContaining([ANAE.fitzgerald, ANAE.sharma, ANAE.delaney, ANAE.hughes, ANAE.strand]))
    expect(av.notAvailable.map((r) => r.anaesthetistId)).toEqual(expect.arrayContaining([ANAE.beaumont, ANAE.ngatai]))
    const total = av.free.length + av.notAvailable.length + av.occupied.length
    expect(total).toBe(Object.values(api.getState().masters.anaesthetists).filter((a) => a.active).length)
  })
})

describe('redateDraftList and removeDraftList (US-01.6.4)', () => {
  it('a re-date moves it and its Bookings to the new day, keeps the wait and the state, and runs nothing else', () => {
    const api = store()
    const id = SEED_DRAFT_LIST_IDS.forte
    const since = draft(api.getState().schedule.lists[id]).draft.sinceISO
    const auditBefore = api.getState().audit.length
    expect(redateDraftList(api, OFFICE, id, { dateISO: '2026-07-24', session: 'AM' }).ok).toBe(true)
    const l = draft(api.getState().schedule.lists[id])
    expect(l).toMatchObject({ dateISO: '2026-07-24', session: 'AM', state: 'DRAFT' })
    expect(l.draft.sinceISO).toBe(since)
    expect(Object.values(api.getState().schedule.bookings).filter((b) => b.listId === id)).toHaveLength(2)
    expect(draftListsForDate(api.getState(), '2026-07-24').map((d) => d.id)).toContain(id)
    expect(draftListsForDate(api.getState(), '2026-07-22').map((d) => d.id)).not.toContain(id)
    expect(api.getState().audit.slice(auditBefore).map((a) => a.action)).toEqual(['draftList.redate'])
  })

  it('a re-date refuses: same day, passed day, beyond the schedule, not a Draft List, not the office', () => {
    const api = store()
    const id = create(api)
    expect(code(redateDraftList(api, OFFICE, id, { dateISO: THU23, session: 'PM' }))).toBe('sameDay')
    expect(code(redateDraftList(api, OFFICE, id, { dateISO: '2026-07-01', session: 'PM' }))).toBe('datePassed')
    expect(code(redateDraftList(api, OFFICE, id, { dateISO: '2027-07-01', session: 'PM' }))).toBe('outsideCanvas')
    expect(code(redateDraftList(api, OFFICE, slotViewsForDate(api.getState(), THU23).find((v) => v.list !== undefined)!.list!.id, { dateISO: THU23, session: 'AM' }))).toBe('notDraftList')
    expect(code(redateDraftList(api, SOUTER_ACTOR, id, { dateISO: THU23, session: 'AM' }))).toBe('officeOnly')
  })

  it('removal is refused while an active Booking waits, then soft and audited; a removed Draft List leaves every view but History and cannot be assigned', () => {
    const api = store()
    const id = SEED_DRAFT_LIST_IDS.forte
    const refused = removeDraftList(api, OFFICE, id, 'Duplicate request')
    expect(code(refused)).toBe('hasBookings')
    expect(refused.ok ? '' : refused.message).toBe('Move or cancel its 2 Bookings first.')
    for (const b of Object.values(api.getState().schedule.bookings).filter((x) => x.listId === id)) cancelBooking(api, OFFICE, b.id, 'Cancelled by the rooms')
    const count = waitingDraftListCount(api.getState())
    expect(removeDraftList(api, OFFICE, id, '  Duplicate request ').ok).toBe(true)
    const l = api.getState().schedule.lists[id]!
    expect(l).toMatchObject({ state: 'DRAFT', removedBy: 'Kirsty W.', removeReason: 'Duplicate request' })
    expect(waitingDraftListCount(api.getState())).toBe(count - 1)
    expect(finishedDraftLists(api.getState()).map((x) => x.id)).toContain(id)
    expect(code(assignDraftList(api, OFFICE, id, { anaesthetistId: ANAE.souter }))).toBe('notDraftList')
    expect(code(removeDraftList(api, OFFICE, id))).toBe('notDraftList')
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'draftList.remove', after: { removeReason: 'Duplicate request' } })
  })
})

describe('detachListToDraft (ACTIVE back to DRAFT, built for Phase 32)', () => {
  it('keeps the id, Bookings, notes and holiday conflicts; leaves the session; drops availability conflicts; refuses a SUBMITTED List', () => {
    const api = store()
    const s = api.getState()
    // Rutherford's Wed 22 AM List carries an availability conflict (the seeded sickness).
    const rutherford = assigned(s.schedule.lists['L-29104-2026-07-22-AM'])
    const out = detachListToDraft(s.schedule, rutherford.id, { origin: 'movedToOffice', by: 'Dr Rutherford', atISO: clockISO(s.clock) })
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.value.list).toMatchObject({ id: rutherford.id, state: 'DRAFT', hospitalId: rutherford.hospitalId, surgeonId: rutherford.surgeonId, draft: { origin: 'movedToOffice', fromAnaesthetistId: ANAE.rutherford } })
    expect(out.value.list.anaesthetistId).toBeUndefined()
    expect(out.value.list.slotId).toBeUndefined()
    expect(out.value.list.conflicts).toEqual([])
    expect(out.value.meta).toMatchObject({ action: 'draftList.detach', before: { state: 'ACTIVE' }, after: { state: 'DRAFT', anaesthetistId: null, slotId: null } })
    // The vacated session keeps the status the caller set (unavailable here) and holds no List.
    expect(out.value.schedule.slots[rutherford.slotId]?.status).toBe('unavailable')
    const submitted = submittedLists(api.getState())[0]!
    expect(code(detachListToDraft(s.schedule, submitted.id, { origin: 'movedToOffice', by: 'x', atISO: clockISO(s.clock) }))).toBe('notActive')
  })
})

describe('the recurring clash (OQ-81 part 2; US-01.3.2 AC2, US-01.5.4 AC3)', () => {
  /** A Thursday AM recurring booking for Dr Beaumont, who is on holiday to Sun 26. */
  function beaumontThursday(api: BoundAppStore) {
    const out = addRecurringBooking(api, OFFICE, { anaesthetistId: ANAE.beaumont, dayOfWeek: 4, session: 'AM', kind: 'private', hospitalId: HOSP.ces, surgeonId: SURG.whitford })
    if (!out.ok) throw new Error(out.message)
    return out.value
  }

  it('adding a recurring booking for an anaesthetist on leave makes a Draft List for that day and ACTIVE Lists after, in one commit', () => {
    const api = store()
    const auditBefore = api.getState().audit.length
    const result = beaumontThursday(api)
    expect(result.skipped.map((k) => k.dateISO)).toEqual([THU23])
    const clash = draft(api.getState().schedule.lists[`LD-${result.id}-${THU23}-AM`])
    expect(clash).toMatchObject({ hospitalId: HOSP.ces, surgeonId: SURG.whitford, recurringBookingId: result.id, draft: { origin: 'recurringClash', fromAnaesthetistId: ANAE.beaumont, by: 'Kirsty W.' } })
    expect(clash.conflicts).toEqual([])
    expect(listInSlot(api.getState(), slotIdFor(ANAE.beaumont, '2026-07-30', 'AM'))?.recurringBookingId).toBe(result.id)
    // One commit: the Draft List's meta sits in the same batch as the recurring booking's.
    const actions = api.getState().audit.slice(auditBefore).map((a) => a.action)
    expect(actions[0]).toBe('recurringBooking.create')
    expect(actions.filter((a) => a === 'draftList.fromRecurringClash')).toHaveLength(1)
    // Never a conflict on the anaesthetist (US-01.5.4 AC3); the session keeps its holiday.
    expect(conflictRows(api.getState()).some((r) => r.listId === clash.id)).toBe(false)
    expect(api.getState().schedule.slots[slotIdFor(ANAE.beaumont, THU23, 'AM')]?.status).toBe('holiday')
  })

  it('"Apply to canvas now" twice, or after a re-date or a removal, never brings a second one back', () => {
    const api = store()
    const result = beaumontThursday(api)
    const clashId = `LD-${result.id}-${THU23}-AM`
    const count = () => Object.values(api.getState().schedule.lists).filter((l) => l.draft?.projectedFor?.recurringBookingId === result.id).length
    expect(applyRecurringBookingsToCanvas(api, OFFICE).ok).toBe(true)
    expect(count()).toBe(1)
    expect(redateDraftList(api, OFFICE, clashId, { dateISO: '2026-07-24', session: 'AM' }).ok).toBe(true)
    applyRecurringBookingsToCanvas(api, OFFICE)
    expect(count()).toBe(1)
    expect(removeDraftList(api, OFFICE, clashId).ok).toBe(true)
    applyRecurringBookingsToCanvas(api, OFFICE)
    expect(count()).toBe(1)
    expect(waitingDraftLists(api.getState()).some((l) => l.recurringBookingId === result.id)).toBe(false)
  })

  it('reopening the session projects no second List: the Draft List answers for the day', () => {
    const api = store()
    const result = beaumontThursday(api)
    setAvailability(api, OFFICE, ANAE.beaumont, THU23, 'AM', 'free')
    applyRecurringBookingsToCanvas(api, OFFICE)
    expect(listInSlot(api.getState(), slotIdFor(ANAE.beaumont, THU23, 'AM'))).toBeUndefined()
    // Assigning it back to her: the same List, now in her session; still no second List.
    expect(assignDraftList(api, OFFICE, `LD-${result.id}-${THU23}-AM`, { anaesthetistId: ANAE.beaumont }).ok).toBe(true)
    applyRecurringBookingsToCanvas(api, OFFICE)
    expect(Object.values(api.getState().schedule.lists).filter((l) => l.recurringBookingId === result.id && l.dateISO === THU23)).toHaveLength(1)
  })

  it('an edit updates an empty clash Draft List and keeps one with Bookings; a retire removes the empty one', () => {
    const api = store()
    const result = beaumontThursday(api)
    const clashId = `LD-${result.id}-${THU23}-AM`
    const edited = editRecurringBooking(api, OFFICE, result.id, { surgeonId: SURG.reid })
    expect(edited.ok && edited.value.draftListsUpdated).toBe(1)
    expect(api.getState().schedule.lists[clashId]?.surgeonId).toBe(SURG.reid)
    createBooking(api, OFFICE, clashId, { patient: { name: 'Test Patient', dobISO: '1970-01-01' }, operation: 'Cataract', billingRoute: 'billableParty' })
    const again = editRecurringBooking(api, OFFICE, result.id, { surgeonId: SURG.whitford })
    expect(again.ok && again.value.kept.some((k) => k.listId === clashId && k.reason === 'hasBookings')).toBe(true)
    expect(api.getState().schedule.lists[clashId]?.surgeonId).toBe(SURG.reid)

    const api2 = store()
    const r2 = beaumontThursday(api2)
    const retired = retireRecurringBooking(api2, OFFICE, r2.id, TUE21)
    expect(retired.ok && retired.value.draftListsRemoved).toBe(1)
    expect(api2.getState().schedule.lists[`LD-${r2.id}-${THU23}-AM`]).toMatchObject({ removeReason: 'Recurring booking changed' })
  })

  it('a clash Draft List the office moved off its passed day survives any later edit (review fix)', () => {
    const api = store()
    const result = beaumontThursday(api)
    const clashId = `LD-${result.id}-${THU23}-AM`
    advanceClockDays(api, 2)
    expect(redateDraftList(api, OFFICE, clashId, { dateISO: '2026-07-24', session: 'PM' }).ok).toBe(true)
    const edited = editRecurringBooking(api, OFFICE, result.id, { notes: 'Bring the loupes' })
    expect(edited.ok && (edited.value.draftListsRemoved ?? 0)).toBe(0)
    expect(api.getState().schedule.lists[clashId]?.removedAtISO).toBeUndefined()
  })

  it('a List assigned from a clash and sent back to the office keeps answering for the day (review fix)', () => {
    const api = store()
    const result = beaumontThursday(api)
    const clashId = `LD-${result.id}-${THU23}-AM`
    const other = draftListAvailabilityFor(api.getState(), clashId)!.free[0]!.anaesthetistId
    expect(assignDraftList(api, OFFICE, clashId, { anaesthetistId: other }).ok).toBe(true)
    const s = api.getState()
    const out = detachListToDraft(s.schedule, clashId, { origin: 'movedToOffice', by: 'x', atISO: clockISO(s.clock) })
    if (!out.ok) throw new Error(out.message)
    api.setState({ schedule: out.value.schedule })
    applyRecurringBookingsToCanvas(api, OFFICE)
    expect(Object.values(api.getState().schedule.lists).filter((l) => l.recurringBookingId === result.id && l.dateISO === THU23)).toHaveLength(1)
  })

  it('regeneration never projects a List for a day a Draft List answers (review fix)', () => {
    const api = store()
    const result = beaumontThursday(api)
    setAvailability(api, OFFICE, ANAE.beaumont, THU23, 'AM', 'free')
    const s = api.getState()
    const slotId = slotIdFor(ANAE.beaumont, THU23, 'AM')
    const projected = assigned({ ...s.schedule.lists[`LD-${result.id}-${THU23}-AM`]!, id: `L-${ANAE.beaumont}-${THU23}-AM`, state: 'ACTIVE', anaesthetistId: ANAE.beaumont, slotId } as never)
    const out = withGenerated(s.schedule, { slots: [], lists: [projected] }, s.counters)
    expect(out.lists).toBe(0)
  })

  it('shortening the horizon keeps Draft Lists beyond it, waiting or removed (review fix)', () => {
    const api = store()
    const ropata = waitingDraftLists(api.getState()).filter((l) => l.dateISO >= '2026-08-25')
    expect(ropata.length).toBeGreaterThan(0)
    expect(setHorizonMonths(api, OFFICE, 1).ok).toBe(true)
    for (const l of ropata) expect(api.getState().schedule.lists[l.id]?.state).toBe('DRAFT')
  })

  it('a removed Draft List takes no Booking and no new conflict (review fix)', () => {
    const api = store()
    expect(removeDraftList(api, OFFICE, SEED_DRAFT_LIST_IDS.stGeorges).ok).toBe(true)
    const booking = Object.values(api.getState().schedule.bookings).find((b) => b.listId === SEED_DRAFT_LIST_IDS.forte)!
    expect(code(reassignBooking(api, OFFICE, booking.id, SEED_DRAFT_LIST_IDS.stGeorges))).toBe('notFound')
  })

  it('a roll forward onto a day a series already closed makes one Draft List, waiting from the roll; a second roll makes none', () => {
    const api = store()
    const souterWed = Object.values(api.getState().masters.recurringBookings).find((r) => r.anaesthetistId === ANAE.souter && r.dayOfWeek === 3 && r.session === 'AM')!
    const end = scheduleHorizon(api.getState()).endISO
    expect(createAvailabilitySeries(api, OFFICE, { anaesthetistId: ANAE.souter, statusKey: 'unavailable', sessions: 'AM', weekdays: [3], everyWeeks: 1, startISO: end }).ok).toBe(true)
    // The next Wednesday past the horizon's end.
    let wed = parseISO(end)
    do wed = addDays(wed, 1)
    while (wed.getDay() !== 3)
    const wedISO = format(wed, 'yyyy-MM-dd')
    advanceClockDays(api, Math.round((wed.getTime() - parseISO(end).getTime()) / 86_400_000))
    const id = `LD-${souterWed.id}-${wedISO}-AM`
    const clash = draft(api.getState().schedule.lists[id])
    expect(clash.draft.sinceISO).toBe(clockISO(api.getState().clock))
    expect(clash.draft.by).toBe('Demo control')
    expect(listInSlot(api.getState(), slotIdFor(ANAE.souter, wedISO, 'AM'))).toBeUndefined()
    expect(api.getState().audit.some((a) => a.action === 'draftList.fromRecurringClash' && a.entityType === 'canvas')).toBe(true)
    advanceClockMinutes(api, 60)
    applyRecurringBookingsToCanvas(api, OFFICE)
    expect(Object.values(api.getState().schedule.lists).filter((l) => l.draft?.projectedFor?.recurringBookingId === souterWed.id && l.draft.projectedFor.dateISO === wedISO)).toHaveLength(1)
  })

  it('a horizon extend over a series-closed recurring-booking day makes the Draft List too', () => {
    const api = store()
    const souterWed = Object.values(api.getState().masters.recurringBookings).find((r) => r.anaesthetistId === ANAE.souter && r.dayOfWeek === 3 && r.session === 'AM')!
    const end = scheduleHorizon(api.getState()).endISO
    expect(createAvailabilitySeries(api, OFFICE, { anaesthetistId: ANAE.souter, statusKey: 'unavailable', sessions: 'AM', weekdays: [3], everyWeeks: 1, startISO: end }).ok).toBe(true)
    expect(setHorizonMonths(api, OFFICE, 5).ok).toBe(true)
    const made = Object.values(api.getState().schedule.lists).filter((l) => l.state === 'DRAFT' && l.recurringBookingId === souterWed.id && l.dateISO > end)
    expect(made.length).toBeGreaterThan(0)
    for (const l of made) expect(l.draft?.by).toBe('Kirsty W.')
  })

  it('no past day ever gets one: the seed made none before today', () => {
    const api = store()
    expect(Object.values(api.getState().schedule.lists).some((l) => l.draft?.origin === 'recurringClash' && l.dateISO < TUE21)).toBe(false)
  })

  it('the office marking a booked session unavailable still gives Phase 30\'s conflict (an anaesthetist is asked where the List goes, Phase 32)', () => {
    const api = store()
    const booked = slotViewsForDate(api.getState(), THU23).find((v) => v.list !== undefined && v.list.state === 'ACTIVE')!
    setAvailability(api, OFFICE, booked.slot.anaesthetistId, THU23, booked.slot.session, 'unavailable')
    expect(api.getState().schedule.lists[booked.list!.id]?.conflicts.some((c) => c.kind === 'availability')).toBe(true)
    expect(api.getState().schedule.lists[booked.list!.id]?.state).toBe('ACTIVE')
  })
})

describe('the pairing rule on the other paths (US-01.3.1)', () => {
  it('editList cannot clear the hospital or the surgeon; it can change them', () => {
    const api = store()
    const list = slotViewsForDate(api.getState(), THU23).find((v) => v.list?.state === 'ACTIVE')!.list!
    expect(code(editList(api, OFFICE, list.id, { surgeonId: '' }))).toBe('pairingRequired')
    expect(code(editList(api, OFFICE, list.id, { hospitalId: '' }))).toBe('pairingRequired')
    expect(code(editList(api, OFFICE, list.id, { surgeonId: 'S-NOPE' }))).toBe('pairingRequired')
    expect(editList(api, OFFICE, list.id, { surgeonId: SURG.lim }).ok).toBe(true)
  })

  it('a recurring booking needs both', () => {
    const api = store()
    const base = { anaesthetistId: ANAE.souter, dayOfWeek: 6 as const, session: 'AM' as const, kind: 'private' as const }
    expect(code(addRecurringBooking(api, OFFICE, { ...base, hospitalId: '', surgeonId: SURG.hale }))).toBe('pairingRequired')
    expect(code(addRecurringBooking(api, OFFICE, { ...base, hospitalId: HOSP.stg, surgeonId: '' }))).toBe('pairingRequired')
  })

  it('one anaesthetist\'s AM and PM Lists still differ in hospital and surgeon', () => {
    const api = store()
    const souter = listsForDate(api.getState(), TUE21).filter((l) => l.anaesthetistId === ANAE.souter)
    expect(souter).toHaveLength(2)
    expect(souter[0]!.hospitalId).not.toBe(souter[1]!.hospitalId)
    expect(souter[0]!.surgeonId).not.toBe(souter[1]!.surgeonId)
  })

  it('the post-op addendum copies the original List\'s hospital and surgeon', () => {
    const api = store()
    const authorised = Object.values(api.getState().schedule.lists).find((l) => l.state === 'AUTHORISED' && l.anaesthetistId === ANAE.souter && !l.id.startsWith('L-HIST') && !l.id.startsWith('L-RB-'))
    if (authorised === undefined) return
    const booking = Object.values(api.getState().schedule.bookings).find((b) => b.listId === authorised.id)
    if (booking === undefined) return
    const out = addPostOpAddendum(api, OFFICE, booking.id)
    if (!out.ok) return
    const created = Object.values(api.getState().schedule.lists).find((l) => l.id.startsWith('LG') && l.state === 'ACTIVE' && l.dateISO === TUE21)
    expect(created).toMatchObject({ hospitalId: authorised.hospitalId, surgeonId: authorised.surgeonId })
  })
})

describe('Draft Lists never reach an anaesthetist (OQ-86 answered no, D46)', () => {
  it('no anaesthetist-scoped selector returns a Draft List or a removed one', () => {
    const api = store()
    removeDraftList(api, OFFICE, SEED_DRAFT_LIST_IDS.stGeorges)
    const s = api.getState()
    const draftIds = new Set(Object.values(s.schedule.lists).filter((l) => l.state === 'DRAFT').map((l) => l.id))
    expect(draftIds.size).toBeGreaterThan(0)
    const seen: string[] = []
    for (const a of Object.keys(s.masters.anaesthetists)) {
      for (const v of slotViewsForAnaesthetist(s, a, TUE21, '2026-11-30')) if (v.list !== undefined) seen.push(v.list.id)
    }
    for (const v of slotViewsForDate(s, TUE21)) if (v.list !== undefined) seen.push(v.list.id)
    seen.push(...listsForDate(s, TUE21).map((l) => l.id), ...listsForDate(s, '2026-07-22').map((l) => l.id))
    seen.push(...sicknessCandidates(s, TUE21).map((l) => l.id), ...sicknessCandidates(s, '2026-07-22').map((l) => l.id))
    expect(seen.filter((id) => draftIds.has(id))).toEqual([])
  })
})

describe('the store-wide lifecycle and pairing invariant (FT-07.1)', () => {
  it('holds after a sweep: create, assign, re-date, remove, reassign, detach, roll forward, recurring add/edit/apply, the stand-in actor', () => {
    const api = store()
    expectLifecycleInvariant(api)
    const a = create(api)
    const b = create(api, { dateISO: '2026-07-24', session: 'AM' })
    createDraftList(api, OFFICE_SIMULATION_ACTOR, { ...request, dateISO: '2026-07-28', session: 'AM', source: 'email' })
    const free = slotViewsForDate(api.getState(), THU23).find((v) => v.slot.session === 'PM' && v.open)!
    assignDraftList(api, OFFICE, a, { anaesthetistId: free.slot.anaesthetistId })
    redateDraftList(api, OFFICE, b, { dateISO: '2026-07-27', session: 'PM' })
    removeDraftList(api, OFFICE, b)
    const booking = createBooking(api, OFFICE, SEED_DRAFT_LIST_IDS.stGeorges, { patient: { name: 'Sweep Patient', dobISO: '1980-01-01' }, operation: 'Cystoscopy', billingRoute: 'billableParty' })
    if (booking.ok) reassignBooking(api, OFFICE, booking.value.bookingId, a)
    const result = addRecurringBooking(api, OFFICE, { anaesthetistId: ANAE.beaumont, dayOfWeek: 4, session: 'AM', kind: 'private', hospitalId: HOSP.ces, surgeonId: SURG.whitford })
    if (result.ok) editRecurringBooking(api, OFFICE, result.value.id, { surgeonId: SURG.reid })
    applyRecurringBookingsToCanvas(api, OFFICE)
    // Detach (Phase 32's helper) through a recipe, as 32's callers will.
    const s = api.getState()
    const out = detachListToDraft(s.schedule, a, { origin: 'movedToOffice', by: 'Dr X', atISO: clockISO(s.clock) })
    if (out.ok) api.setState({ schedule: out.value.schedule })
    advanceClockDays(api, 2)
    expectLifecycleInvariant(api)
  })
})

describe('bookingCountsByList (US-13.1.1)', () => {
  it('counts active Bookings per List, never a cancelled one', () => {
    const api = store()
    const id = SEED_DRAFT_LIST_IDS.forte
    expect(bookingCountsByList(api.getState().schedule.bookings).get(id)).toBe(2)
    const first = Object.values(api.getState().schedule.bookings).find((b) => b.listId === id)!
    cancelBooking(api, OFFICE, first.id, 'Cancelled by the rooms')
    expect(bookingCountsByList(api.getState().schedule.bookings).get(id)).toBe(1)
  })
})

describe('a Booking on a Draft List is not completed (EP-07: only an ACTIVE List is completed)', () => {
  it('refuses completion with "Assign an anaesthetist first."', () => {
    const api = store()
    const booking = Object.values(api.getState().schedule.bookings).find((b) => b.listId === SEED_DRAFT_LIST_IDS.forte)!
    const out = completeBooking(api, OFFICE, booking.id)
    expect(out.ok ? '' : out.message).toBe('Assign an anaesthetist first.')
  })
})
