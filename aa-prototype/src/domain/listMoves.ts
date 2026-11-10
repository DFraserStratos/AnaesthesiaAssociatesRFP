/**
 * An anaesthetist moves her own List (catch-up Phase 32; US-01.4.3, US-01.4.5,
 * US-01.5.5; D7, D14, D44). Pure: no React, no store, no shared, no clock
 * reads. Inputs are domain-typed slices and `todayISO`, never `AppState`.
 *
 * AVAILABILITY ONLY (US-01.4.5, OQ-43 answered, D44): nothing here takes,
 * reads or returns a pairing preference or a priority tier, and nothing
 * imports `domain/pairingPreferences.ts`. The colleagues offered are one flat
 * list in surname order. Phase 17's privacy test watches the boundary.
 *
 * ONE RECEIVE RULE: `receiveRefusal` is what any List move into another
 * session checks, for every actor: the colleague is active and the session is
 * open, so nobody, the office included, ever moves a List onto a session its
 * anaesthetist has marked not available (D59, US-01.6.3; catch-up Phase 32b
 * dropped the office's accept-and-flag). `pushTargets` is exactly the
 * colleagues that pass it. Phase 32a's single-Booking receiver builds on it.
 *
 * THE VACATED SESSION (D60, OQ-84 answered; catch-up Phase 32b): whoever moves
 * a List, the anaesthetist or the office, chooses what the session it leaves
 * becomes, on every path: Free or Unavailable on a plain move (Free first),
 * and on the mark-unavailable path the status being set or Free (the status
 * being set first). `vacatedChoices` and `defaultVacated` are the one rule.
 */

import { compareBySurname } from './surgeons'
import { titledSurname } from './names'
import { SEED_STATUS, isOpenSlot, type SlotStatusRecords } from './slotStatus'
import { slotIdFor } from './slots'
import type { Anaesthetist, AnaesthetistId, AssignedList, List, Slot, SlotStatusKey } from './types'

/** The slices a move reads. */
export interface ListMoveInput {
  lists: Readonly<Record<string, List>>
  slots: Readonly<Record<string, Slot>>
  anaesthetists: Readonly<Record<string, Anaesthetist>>
  slotStatuses: SlotStatusRecords
}

export interface MoveRefusal {
  code: string
  message: string
}

/** The statuses a plain move offers for the vacated session, by fixed id (labels and colours come from the master). */
export const VACATED_SESSION_CHOICES: readonly SlotStatusKey[] = [SEED_STATUS.free, SEED_STATUS.unavailable]

/**
 * What the vacated session may become: on the mark-unavailable path the status
 * being set, then Free; on any other move Free, then Unavailable. The caller
 * still drops a status the actor may not set or one that is retired.
 */
export function vacatedChoices(statusBeingSet?: SlotStatusKey): SlotStatusKey[] {
  if (statusBeingSet === undefined) return [...VACATED_SESSION_CHOICES]
  return statusBeingSet === SEED_STATUS.free ? [SEED_STATUS.free] : [statusBeingSet, SEED_STATUS.free]
}

/** The pre-selected answer: the status being set on the mark-unavailable path, otherwise Free. */
export function defaultVacated(statusBeingSet?: SlotStatusKey): SlotStatusKey {
  return statusBeingSet ?? SEED_STATUS.free
}

/** "Dr Chen has marked this session not available. They need to make it available first." (US-01.6.3) */
export function sessionNotOpenMessage(anaesthetist: Pick<Anaesthetist, 'name'> | undefined): string {
  return `${anaesthetist === undefined ? 'The anaesthetist' : titledSurname(anaesthetist.name)} has marked this session not available. They need to make it available first.`
}

/**
 * Why the office may not put a List into this session, or null (US-01.6.3,
 * D59): only an open session of an active anaesthetist takes one. Assigning a
 * Draft List, assigning a new List and phone advice all ask this.
 */
export function sessionNotOpenRefusal(
  input: Pick<ListMoveInput, 'anaesthetists' | 'slotStatuses'>,
  slot: Pick<Slot, 'anaesthetistId' | 'status'>,
): MoveRefusal | null {
  const anaesthetist = input.anaesthetists[slot.anaesthetistId]
  if (anaesthetist !== undefined && anaesthetist.active !== true) {
    return { code: 'anaesthetistInactive', message: `${titledSurname(anaesthetist.name)} is not active.` }
  }
  if (!isOpenSlot(slot, undefined, input.slotStatuses)) return { code: 'sessionNotOpen', message: sessionNotOpenMessage(anaesthetist) }
  return null
}

/** The List in a session, if any (a Draft List has no session). */
function occupiedSlotIds(lists: Readonly<Record<string, List>>): Set<string> {
  const out = new Set<string>()
  for (const list of Object.values(lists)) if (list.slotId !== undefined) out.add(list.slotId)
  return out
}

function surnameLine(anaesthetist: Anaesthetist | undefined): string {
  return anaesthetist === undefined ? 'That colleague' : titledSurname(anaesthetist.name)
}

/**
 * The one receive rule, for every actor. A List moves to the same day and
 * session, into a different session that holds no List, whose anaesthetist is
 * active and whose status is open for bookings (US-01.6.3, D59).
 */
export function receiveRefusal(
  input: ListMoveInput,
  fromSlot: Pick<Slot, 'id' | 'dateISO' | 'session'>,
  toSlotId: string,
  options: { occupied?: ReadonlySet<string> } = {},
): MoveRefusal | null {
  const to = input.slots[toSlotId]
  if (to === undefined) return { code: 'notFound', message: 'That session does not exist.' }
  if (to.id === fromSlot.id) return { code: 'sameSlot', message: 'The List is already in that session.' }
  if (to.dateISO !== fromSlot.dateISO || to.session !== fromSlot.session) {
    return { code: 'differentSession', message: 'A List moves to the same day and session.' }
  }
  const occupied = options.occupied ?? occupiedSlotIds(input.lists)
  if (occupied.has(to.id)) return { code: 'slotOccupied', message: 'That session already holds a List.' }
  const colleague = input.anaesthetists[to.anaesthetistId]
  if (colleague?.active !== true) return { code: 'targetNotOpen', message: `${surnameLine(colleague)}'s session cannot take a List.` }
  if (!isOpenSlot(to, undefined, input.slotStatuses)) return { code: 'targetNotOpen', message: sessionNotOpenMessage(colleague) }
  return null
}

/** Whether a session can receive this List. */
export function canReceiveList(input: ListMoveInput, fromSlot: Pick<Slot, 'id' | 'dateISO' | 'session'>, toSlotId: string): boolean {
  return receiveRefusal(input, fromSlot, toSlotId) === null
}

/**
 * Why an anaesthetist may not move this List herself, or null. Only the owner
 * moves it, and only an ACTIVE List dated today or later: never a Draft List
 * (it has no owner; the office assigns it, D46), a SUBMITTED or an AUTHORISED
 * List (the office's Reassign), or a past one.
 */
export function ownMoveRefusal(
  input: Pick<ListMoveInput, 'lists'>,
  listId: string,
  actorAnaesthetistId: AnaesthetistId | undefined,
  todayISO: string,
): MoveRefusal | null {
  const list = input.lists[listId]
  if (list === undefined) return { code: 'notFound', message: 'List not found.' }
  if (list.state === 'DRAFT') return { code: 'draftList', message: 'This List has no anaesthetist yet. Only the office can assign it.' }
  if (actorAnaesthetistId === undefined || list.anaesthetistId !== actorAnaesthetistId) {
    return { code: 'notOwnList', message: 'You can only move your own Lists.' }
  }
  if (list.state === 'SUBMITTED') return { code: 'listSubmitted', message: 'This List has been submitted. Only the office can move it now.' }
  if (list.state === 'AUTHORISED') return { code: 'listAuthorised', message: 'This List is authorised and locked. Only the office can move it now.' }
  if (list.dateISO < todayISO) return { code: 'pastDate', message: "This List's day has passed." }
  return null
}

/** Whether the owner may move this List now (the UI's "Move this List" visibility). */
export function isMovableByOwner(input: Pick<ListMoveInput, 'lists'>, listId: string, anaesthetistId: AnaesthetistId, todayISO: string): boolean {
  return ownMoveRefusal(input, listId, anaesthetistId, todayISO) === null
}

/** A colleague who could take the List: who, and the session it would go into. Nothing else (US-01.4.5 "Availability only"). */
export interface PushTarget {
  anaesthetistId: AnaesthetistId
  name: string
  phone: string
  slotId: string
}

/**
 * The colleagues an anaesthetist can hand this List on to: every active
 * colleague whose session that day and session passes the receive rule. One
 * flat list in surname order, never grouped, marked or
 * ordered by a preference or a tier.
 */
export function pushTargets(input: ListMoveInput, listId: string): PushTarget[] {
  const list = input.lists[listId]
  if (list === undefined || list.state === 'DRAFT') return []
  const from = input.slots[list.slotId]
  if (from === undefined) return []
  const occupied = occupiedSlotIds(input.lists)
  const out: PushTarget[] = []
  for (const colleague of Object.values(input.anaesthetists)) {
    if (colleague.registrationNumber === list.anaesthetistId) continue
    const slotId = slotIdFor(colleague.registrationNumber, list.dateISO, list.session)
    if (receiveRefusal(input, from, slotId, { occupied }) !== null) continue
    out.push({ anaesthetistId: colleague.registrationNumber, name: colleague.name, phone: colleague.phone, slotId })
  }
  return out.sort(compareBySurname)
}

/** The persona's movable Lists from today for `days` days, by date then session (the web dashboard's picker). */
export function movableListsFor(input: Pick<ListMoveInput, 'lists'>, anaesthetistId: AnaesthetistId, todayISO: string, untilISO: string): AssignedList[] {
  const out: AssignedList[] = []
  for (const list of Object.values(input.lists)) {
    if (list.state === 'DRAFT' || list.anaesthetistId !== anaesthetistId) continue
    if (list.dateISO > untilISO) continue
    if (ownMoveRefusal(input, list.id, anaesthetistId, todayISO) !== null) continue
    out.push(list)
  }
  return out.sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.session.localeCompare(b.session) || a.id.localeCompare(b.id))
}
