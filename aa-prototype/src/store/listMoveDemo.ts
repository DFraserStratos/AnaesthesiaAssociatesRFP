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
 * persona's own Lists, never a List with a conflict (the Conflicts screen S2
 * shows), and never anything in `SCRIPTED_BEAT_SCHEDULE`, as the List moved or
 * the session it moves into.
 */

import { ANAE, SCRIPTED_BEAT_SCHEDULE } from '../domain/seed'
import { canReceiveList, ownMoveRefusal, pushTargets } from '../domain/listMoves'
import { SEED_STATUS } from '../domain/slotStatus'
import { slotIdFor } from '../domain/slots'
import type { AssignedList } from '../domain/types'
import type { AppState, AppStoreApi } from './appStore'
import { anaesthetistActor } from './demoActors'
import { moveListToOffice, pushListToSlot, type OwnMoveResult } from './listMoveActions'
import { ok, refuse, type Outcome } from './mutate'
import { moveInputOf } from './selectors'

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
    // A List with a conflict is on the Conflicts screen a beat shows (S2 Beat 3): never moved by a demo.
    if (list.conflicts.length > 0) continue
    // The demo acts as the List's owner: an inactive one cannot (the count then matches what runs).
    if (state.masters.anaesthetists[list.anaesthetistId]?.active !== true) continue
    if (ownMoveRefusal(input, list.id, list.anaesthetistId, todayISO) !== null) continue
    out.push(list)
  }
  return out.sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.session.localeCompare(b.session) || a.id.localeCompare(b.id))
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
