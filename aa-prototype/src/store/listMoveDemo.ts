/**
 * Demo trigger bodies for the anaesthetist's own List move (catch-up Phase 32).
 * The anaesthetist apps run only as Dr Souter, so a presenter cannot play a
 * colleague: these stage a COLLEAGUE's own move, acting as that colleague
 * through the product's own actions (`moveListToOffice`, `pushListToSlot`), so
 * the audit and the notification read truthfully. Nothing waits for the
 * office, so there is no office stand-in. The registry entries live in
 * `shared/demoTriggers`; the bodies live here so the PWA closure stays pure.
 *
 * Candidates are deterministic (date, then session, then id), never the
 * persona's own Lists, never a List with a conflict (a hospital closure the
 * Conflicts screen shows), and never anything in `SCRIPTED_BEAT_SCHEDULE`, as the List moved or
 * the session it moves into.
 */

import { ANAE, SCRIPTED_BEAT_SCHEDULE } from '../domain/seed'
import { canReceiveList, ownMoveRefusal, pushTargets } from '../domain/listMoves'
import { bookingMoveRefusal, bookingPlacement } from '../domain/bookingMoves'
import { titledSurname } from '../domain/names'
import { isOpenForBooking, SEED_STATUS, statusFor } from '../domain/slotStatus'
import { slotIdFor } from '../domain/slots'
import type { AssignedList } from '../domain/types'
import type { AppState, AppStoreApi } from './appStore'
import { anaesthetistActor } from './demoActors'
import { moveBookingToAnaesthetist, moveListToOffice, pushListToSlot, type BookingMoveResult, type OwnMoveResult } from './listMoveActions'
import { ok, refuse, type Outcome } from './mutate'
import { bookingMoveInputOf, closedEmptyColleagueSlots, listInSlot, moveInputOf } from './selectors'
import { setAvailability } from './slotActions'
import { compareSessions } from '../domain/outOfHours'

/** The persona the anaesthetist apps act as: her Lists are never a colleague's move. */
export const LIST_MOVE_DEMO_PERSONA = ANAE.souter

/** How many moves "A busy morning" stages: more than one page of the pool. */
export const BUSY_MORNING_MOVES = 8

const SCRIPTED_LISTS: ReadonlySet<string> = new Set(SCRIPTED_BEAT_SCHEDULE.listIds)
const SCRIPTED_SLOTS: ReadonlySet<string> = new Set(SCRIPTED_BEAT_SCHEDULE.slotIds)

type DemoState = Pick<AppState, 'schedule' | 'masters' | 'clock'>

/**
 * Colleagues' Lists a demo may move, from `fromISO` (default today): ACTIVE,
 * dated today or later, not the persona's, not scripted, in a session that is
 * not scripted, and movable by their owner. Date, session, id order.
 */
export function colleagueMoveCandidates(state: DemoState, fromISO?: string): AssignedList[] {
  const todayISO = state.clock.todayISO
  const start = fromISO !== undefined && fromISO > todayISO ? fromISO : todayISO
  const input = moveInputOf(state)
  const out: AssignedList[] = []
  for (const list of Object.values(state.schedule.lists)) {
    if (list.state !== 'ACTIVE') continue
    if (list.anaesthetistId === LIST_MOVE_DEMO_PERSONA || list.dateISO < start) continue
    if (SCRIPTED_LISTS.has(list.id) || SCRIPTED_SLOTS.has(list.slotId)) continue
    if (state.schedule.slots[list.slotId] === undefined) continue
    // A List with a conflict (a closure) is on the Conflicts screen a beat shows: never moved by a demo.
    if (list.conflicts.length > 0) continue
    // The demo acts as the List's owner: an inactive one cannot (the count then matches what runs).
    if (state.masters.anaesthetists[list.anaesthetistId]?.active !== true) continue
    if (ownMoveRefusal(input, list.id, list.anaesthetistId, todayISO) !== null) continue
    out.push(list)
  }
  return out.sort((a, b) => a.dateISO.localeCompare(b.dateISO) || compareSessions(a, b) || a.id.localeCompare(b.id))
}

/** The colleagues a demo hand-on may use: the receive rule's targets, minus the persona and scripted sessions. */
function demoTargets(state: Pick<AppState, 'schedule' | 'masters'>, listId: string) {
  return pushTargets(moveInputOf(state), listId).filter((t) => t.anaesthetistId !== LIST_MOVE_DEMO_PERSONA && !SCRIPTED_SLOTS.has(t.slotId))
}

/** The one move "One move" stages: the first candidate on `dateISO`, or the next date that has one. */
function firstCandidate(state: DemoState, dateISO?: string): AssignedList | undefined {
  return colleagueMoveCandidates(state, dateISO)[0]
}

/** Why "Colleague moves a List to the office" cannot run, or null. */
export function colleagueMoveRefusal(state: DemoState, dateISO?: string, moves = 1): string | null {
  const n = colleagueMoveCandidates(state, dateISO).length
  if (n === 0) return 'No List on the schedule fits'
  if (n < moves) return `Only ${n} List${n === 1 ? '' : 's'} on the schedule fit`
  return null
}

/**
 * "One move": a colleague returns one of their Lists to the office (it goes
 * back to DRAFT, a Draft List), marking the session Unavailable. On the date in
 * the URL, or the next date with a candidate.
 */
export function stageColleagueMoveToOffice(api: AppStoreApi, dateISO?: string): Outcome<OwnMoveResult & { anaesthetistId: string; dateISO: string }> {
  const state = api.getState()
  const reason = colleagueMoveRefusal(state, dateISO)
  const list = firstCandidate(state, dateISO)
  if (reason !== null || list === undefined) return refuse('notAvailable', reason ?? 'No List on the schedule fits')
  const actor = anaesthetistActor(state, list.anaesthetistId)
  if (actor === undefined) return refuse('notAvailable', 'No List on the schedule fits')
  const out = moveListToOffice(api, actor, list.id, { vacatedStatus: SEED_STATUS.unavailable })
  if (!out.ok) return out
  return ok({ ...out.value, anaesthetistId: list.anaesthetistId, dateISO: list.dateISO })
}

/**
 * "A busy morning": eight colleagues' moves in a row, each its own commit and
 * notification, alternating a return to the office and a hand-on into a free
 * colleague's session (where one exists), so the pool runs to two pages.
 */
export function stageBusyMorning(api: AppStoreApi, dateISO?: string): Outcome<{ moves: OwnMoveResult[] }> {
  const reason = colleagueMoveRefusal(api.getState(), dateISO, BUSY_MORNING_MOVES)
  if (reason !== null) return refuse('notAvailable', reason)
  const moves: OwnMoveResult[] = []
  const used = new Set<string>()
  for (let i = 0; moves.length < BUSY_MORNING_MOVES; i += 1) {
    const state = api.getState()
    const list = colleagueMoveCandidates(state, dateISO).find((l) => !used.has(l.id))
    if (list === undefined) break
    used.add(list.id)
    const actor = anaesthetistActor(state, list.anaesthetistId)
    if (actor === undefined) continue
    const target = moves.length % 2 === 1 ? demoTargets(state, list.id)[0] : undefined
    const out =
      target !== undefined
        ? pushListToSlot(api, actor, list.id, target.slotId)
        : moveListToOffice(api, actor, list.id, { vacatedStatus: SEED_STATUS.unavailable })
    if (out.ok) moves.push(out.value)
    if (i > 200) break
  }
  return moves.length === 0 ? refuse('notAvailable', 'No List on the schedule fits') : ok({ moves })
}

/**
 * A colleague's List the persona can receive: the first candidate (date,
 * session, id) whose day and session find the persona's own session open and
 * empty (the receive rule) and not scripted.
 */
export function moveToPersonaCandidate(state: DemoState, personaId: string): { list: AssignedList; toSlotId: string } | undefined {
  const input = moveInputOf(state)
  for (const list of colleagueMoveCandidates(state)) {
    if (list.anaesthetistId === personaId) continue
    const toSlotId = slotIdFor(personaId, list.dateISO, list.session)
    if (SCRIPTED_SLOTS.has(toSlotId)) continue
    const from = state.schedule.slots[list.slotId]
    if (from === undefined || !canReceiveList(input, from, toSlotId)) continue
    return { list, toSlotId }
  }
  return undefined
}

/** Why "Colleague moves a List into my free session" cannot run, or null. */
export function moveToPersonaRefusal(state: DemoState, personaId: string): string | null {
  return moveToPersonaCandidate(state, personaId) === undefined ? 'No colleague List fits one of your free sessions' : null
}

/**
 * PWA stand-in "Colleague moves a List into my free session" (US-01.4.3 AC2):
 * a colleague hands one of their Lists on into the persona's free session, as
 * themselves, so the persona sees the Moved to you notice and the List.
 */
export function stageColleagueMoveToPersona(api: AppStoreApi, personaId: string): Outcome<OwnMoveResult & { fromAnaesthetistId: string; dateISO: string }> {
  const state = api.getState()
  const found = moveToPersonaCandidate(state, personaId)
  if (found === undefined) return refuse('notAvailable', 'No colleague List fits one of your free sessions')
  const actor = anaesthetistActor(state, found.list.anaesthetistId)
  if (actor === undefined) return refuse('notAvailable', 'No colleague List fits one of your free sessions')
  const out = pushListToSlot(api, actor, found.list.id, found.toSlotId)
  if (!out.ok) return out
  return ok({ ...out.value, fromAnaesthetistId: found.list.anaesthetistId, dateISO: found.list.dateISO })
}

// ---------------------------------------------------------------------------
// A colleague hands a single Booking to the persona (catch-up Phase 32a;
// US-01.4.7). The same rules: acting as the colleague through the product's
// own `moveBookingToAnaesthetist`, never a scripted List or session, never a
// List with a conflict. A candidate exists only where the persona's session is
// free and empty: no trigger here sets the persona's availability, so a session
// she is not available in is offered only after she sets it available herself.
// ---------------------------------------------------------------------------

/** One Booking a colleague could hand the persona: the first non-cancelled Booking of a candidate List. */
export interface BookingMoveCandidate {
  bookingId: string
  fromAnaesthetistId: string
  listId: string
  dateISO: string
  session: string
  hospitalId: string
}

/** Colleague Bookings the persona could receive, from `fromISO` (default today), in date, session, List order. */
export function bookingMoveCandidates(state: DemoState, personaId: string, fromISO?: string): BookingMoveCandidate[] {
  const input = bookingMoveInputOf(state)
  const todayISO = state.clock.todayISO
  // Each List's Bookings, in id order, gathered once.
  const byList = new Map<string, string[]>()
  for (const id of Object.keys(state.schedule.bookings).sort()) {
    const listId = state.schedule.bookings[id]!.listId
    byList.set(listId, [...(byList.get(listId) ?? []), id])
  }
  const out: BookingMoveCandidate[] = []
  for (const list of colleagueMoveCandidates(state, fromISO)) {
    if (list.anaesthetistId === personaId) continue
    if (SCRIPTED_SLOTS.has(slotIdFor(personaId, list.dateISO, list.session))) continue
    const ids = byList.get(list.id) ?? []
    const bookingId = ids.find((id) => bookingMoveRefusal(input, id, list.anaesthetistId, todayISO) === null)
    // Whether the persona's session can take it depends on the List's day and session only: asked once.
    if (bookingId === undefined || !bookingPlacement(input, bookingId, personaId).ok) continue
    out.push({ bookingId, fromAnaesthetistId: list.anaesthetistId, listId: list.id, dateISO: list.dateISO, session: list.session, hospitalId: list.hospitalId })
  }
  return out
}

/** Why a colleague cannot hand the persona a Booking (none fits a session she is free in), or null. */
export function bookingMoveCandidateRefusal(state: DemoState, personaId: string, message: string, fromISO?: string): string | null {
  return bookingMoveCandidates(state, personaId, fromISO).length === 0 ? message : null
}

/**
 * A colleague hands the persona one of their Bookings, at once, as themselves:
 * the chosen candidate (`choiceId` is its Booking id), else the first from
 * `dateISO` on. A new List appears in her free session.
 */
export function stageColleagueBookingMove(
  api: AppStoreApi,
  personaId: string,
  options: { dateISO?: string; choiceId?: string; tellOffice?: boolean; refusal?: string } = {},
): Outcome<BookingMoveResult & BookingMoveCandidate> {
  const state = api.getState()
  const candidates = bookingMoveCandidates(state, personaId, options.dateISO)
  const found = options.choiceId !== undefined ? candidates.find((c) => c.bookingId === options.choiceId) : candidates[0]
  const persona = state.masters.anaesthetists[personaId]
  const none = `No colleague Booking fits a session ${persona !== undefined ? titledSurname(persona.name) : 'they are'} free in`
  if (found === undefined) return refuse('notAvailable', options.refusal ?? none)
  const actor = anaesthetistActor(state, found.fromAnaesthetistId)
  if (actor === undefined) return refuse('notAvailable', options.refusal ?? none)
  const out = moveBookingToAnaesthetist(api, actor, found.bookingId, personaId, { tellOffice: options.tellOffice === true })
  if (!out.ok) return out
  return ok({ ...found, ...out.value })
}

// ---------------------------------------------------------------------------
// "Ask Dr X to make this session available" (catch-up Phase 32b; US-01.6.3,
// D59): the office never assigns onto an unavailable session; it is made
// available first, with the anaesthetist's agreement. The stand-in plays that
// anaesthetist agreeing: their own availability write, as themselves, to Free.
// ---------------------------------------------------------------------------

/** Why the colleague stand-in cannot free this session, or null. */
export function makeAvailableRefusal(state: Pick<AppState, 'schedule' | 'masters'>, slotId: string): string | null {
  const slot = state.schedule.slots[slotId]
  if (slot === undefined) return 'Session not found'
  if (listInSlot(state, slotId) !== undefined) return 'This session holds a List'
  if (isOpenForBooking(statusFor(state.masters.slotStatuses, slot.status))) return 'Already available'
  if (state.masters.anaesthetists[slot.anaesthetistId]?.active !== true) return 'This anaesthetist is not active'
  // Only a status the anaesthetist may set herself can she clear (the office set the others).
  if (statusFor(state.masters.slotStatuses, slot.status)?.anaesthetistCanSet !== true) return 'Set by the office: the office changes it'
  return null
}

/** The anaesthetist sets their own closed, empty session Free (`setAvailability` as `anaesthetistActor`), never one holding a List. */
export function makeSessionAvailableAsColleague(api: AppStoreApi, slotId: string): Outcome<{ slotId: string; anaesthetistId: string }> {
  const state = api.getState()
  const reason = makeAvailableRefusal(state, slotId)
  if (reason !== null) return refuse('notEligible', reason)
  const slot = state.schedule.slots[slotId]!
  const actor = anaesthetistActor(state, slot.anaesthetistId)
  if (actor === undefined) return refuse('notFound', 'Anaesthetist not found')
  const out = setAvailability(api, actor, slot.anaesthetistId, slot.dateISO, slot.session, SEED_STATUS.free, '')
  if (!out.ok) return refuse(out.code, out.message)
  return ok({ slotId, anaesthetistId: slot.anaesthetistId })
}

/** Closed, empty colleague sessions on a List's day and session (the open picker's blocked rows), by surname, that the stand-in can free. */
export function closedColleagueSessions(state: Pick<AppState, 'schedule' | 'masters'>, listId: string): string[] {
  const list = state.schedule.lists[listId]
  if (list === undefined) return []
  const own = list.state !== 'DRAFT' ? list.anaesthetistId : undefined
  return closedEmptyColleagueSlots(state, list.dateISO, list.session, own)
    .filter((slot) => makeAvailableRefusal(state, slot.id) === null)
    .map((slot) => slot.id)
}
