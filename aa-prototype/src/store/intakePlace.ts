/**
 * Placing a new List from Intake as one act (build plan Phase 70; US-02.1.2's placement half, US-01.6.1, DM-19,
 * D118, D125). An arriving List AA does not hold goes in the named anaesthetist's free session (suggested), another
 * anaesthetist's free session that day and session, on a List AA holds, or as a Draft List. Every write (the List,
 * its Bookings, the stubs of rows still waiting for an NHI) is one change set, refused as a whole.
 *
 * Built on 68's one decision path (`decideArrivingLists`): the first placed row makes the List through the manual
 * assignment act (`assignListToSlot` and its guards) or `createDraftList`, the rest join it. When every row waits for
 * an NHI there is nothing to decide, so the List is made here through the same two actions and the stubs stand on it.
 * The Bookings land with no Contract (D125): it is chosen on the Booking afterwards.
 */

import type { ImportRow } from '../domain/types'
import { rowWaitsForNhi, type ArrivalItem } from '../domain/intake/arrivals'
import type { MatchingList, MatchingSlot } from '../domain/intake/matching'
import { placementOptions, type PlacementAt } from '../domain/intake/placement'
import { originForNewList } from '../domain/lists/listOrigin'
import type { AppState, AppStoreApi } from './appStore'
import { decideArrivingLists, type ListPlacement } from './intakeDecide'
import { arrivalByKey } from './intakeSelectors'
import { matchingView } from './matchingSelectors'
import { ok, refuse, transaction, withChangeSet, type Actor, type Outcome } from './mutate'
import { assignListToSlot } from './slotActions'
import { createDraftList } from './draftListActions'
import { placeStubsOnList } from './stubSettle'

/** Where the office places the List. A surgeon is chosen only when the arrival's is not recognised. */
export type PlaceChoice =
  | { kind: 'slot'; slotId: string; surgeonId?: string }
  | { kind: 'list'; listId: string }
  | { kind: 'draft'; surgeonId?: string }

/** The choice of a free session (a Slot), so screens build it without the code word in their strings. */
export function sessionChoice(slotId: string, surgeonId?: string): PlaceChoice {
  return { kind: 'slot', slotId, ...(surgeonId !== undefined ? { surgeonId } : {}) }
}

/** What the placement section offers, read at the moment it is asked. */
export interface PlaceChoices {
  at: PlacementAt
  /** The named anaesthetist's session, only while it is free. */
  suggested?: MatchingSlot
  /** The other free sessions on the arrival's own day and session (a row is only placed in its own session). */
  otherSlots: MatchingSlot[]
  /** The Lists AA holds that could take it. */
  lists: MatchingList[]
  /** Whether the arrival's surgeon resolves to the master (a session or Draft List needs one). */
  surgeonKnown: boolean
  /** The anaesthetist the sender named, resolved (set even when their session is not free). */
  namedAnaesthetistId?: string
}

export interface PlaceResult {
  changeSetId: string | null
  listId: string
  /** The rows that became Bookings, in arrival order. */
  bookingRowIds: string[]
  stubIds: string[]
}

export const SLOT_TAKEN_MESSAGE = 'That session has just been taken. Choose another.'
export const LIST_NOT_OFFERED_MESSAGE = 'That List cannot take these Bookings any more. Choose another.'
export const PLACE_SURGEON_REQUIRED_MESSAGE = 'Choose the surgeon for this List first.'
/** The same words as 69's Update bench (`intakeApply.ts`); the barrel exports that one. */
export const REJECT_REASON_REQUIRED_MESSAGE = 'Give a reason to reject this List.'
export const NOT_A_NEW_LIST_MESSAGE = 'This arrival is not a new List.'
export const ALREADY_DECIDED_MESSAGE = 'This List has already been decided.'

/** The placement section's options for a new List arrival, or undefined when the key names no such arrival. */
export function placeChoicesFor(state: Pick<AppState, 'masters' | 'schedule' | 'intake'>, arrivalKey: string): PlaceChoices | undefined {
  const arrival = arrivalByKey(state, arrivalKey)
  if (arrival === undefined || arrival.dateISO === undefined || arrival.session === undefined) return undefined
  const surgeonKnown = arrival.surgeonId !== undefined && state.masters.surgeons[arrival.surgeonId] !== undefined
  const at: PlacementAt = {
    hospitalId: arrival.hospitalId,
    dateISO: arrival.dateISO,
    session: arrival.session,
    ...(surgeonKnown && arrival.surgeonId !== undefined ? { surgeonId: arrival.surgeonId } : {}),
  }
  const options = placementOptions(matchingView(state), at, arrival.namedAnaesthetistId)
  return {
    at,
    ...(options.suggested !== undefined ? { suggested: options.suggested } : {}),
    otherSlots: options.otherSlots.filter((s) => s.dateISO === at.dateISO && s.session === at.session),
    lists: options.lists,
    surgeonKnown,
    ...(arrival.namedAnaesthetistId !== undefined ? { namedAnaesthetistId: arrival.namedAnaesthetistId } : {}),
  }
}

/** The arrival's open rows that belong to the new List (a removal row never does), in arrival order. */
function openListRows(state: AppState, arrival: ArrivalItem): ImportRow[] {
  return arrival.openRowIds.flatMap((id) => {
    const row = state.intake.rows[id]
    return row !== undefined && row.status === 'open' && row.removalOfBookingId === undefined ? [row] : []
  })
}

/** An arrival the office may decide as a new List, or the refusal. */
function newListArrival(state: AppState, actor: Actor, arrivalKey: string): Outcome<ArrivalItem> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the AA office places arriving Lists.')
  const arrival = arrivalByKey(state, arrivalKey)
  if (arrival === undefined) return refuse('notFound', 'Arrival not found.')
  if (arrival.kind !== 'newList') return refuse('notANewList', NOT_A_NEW_LIST_MESSAGE)
  if (arrival.decided) return refuse('alreadyDecided', ALREADY_DECIDED_MESSAGE)
  return ok(arrival)
}

/** Where the Draft List says it came from, as the row path's note does. */
function draftNote(state: AppState, arrival: ArrivalItem, rows: readonly ImportRow[]): string {
  const hospital = state.masters.hospitals[arrival.hospitalId]?.name ?? 'The hospital'
  const first = rows[0]
  const from =
    arrival.source.kind === 'rooms'
      ? `${arrival.surgeonName ?? 'The surgeon'}'s rooms PDF list`
      : first?.channel === 'manualSheet'
        ? `${hospital} daily sheet`
        : `${hospital} theatre list`
  const names = rows.map((r) => r.incoming.patient.name).join(', ')
  return names === '' ? `From ${from}` : `From ${from}: ${names}`
}

/**
 * Place a new List arrival (US-02.1.2, US-01.6.1, DM-19). The choice is checked against what is offered now: a
 * session taken since it was shown is refused with nothing written. Then, as ONE change set: the List (made in the
 * session, as a Draft List, or the List chosen), every row with an NHI a Booking on it with no Contract, and a stub on
 * it for each row still waiting for an NHI. Office only.
 */
export function placeArrivalList(api: AppStoreApi, actor: Actor, arrivalKey: string, choice: PlaceChoice): Outcome<PlaceResult> {
  const state = api.getState()
  const found = newListArrival(state, actor, arrivalKey)
  if (!found.ok) return found
  const arrival = found.value
  const choices = placeChoicesFor(state, arrivalKey)
  if (choices === undefined) return refuse('notFound', 'Arrival not found.')
  const rows = openListRows(state, arrival)
  if (rows.length === 0) return refuse('nothingToPlace', 'This List has no patients left to place.')

  // Checked against the options as they stand now, before anything is written.
  let placement: ListPlacement
  let surgeonId: string | undefined
  switch (choice.kind) {
    case 'slot': {
      const offered = [...(choices.suggested !== undefined ? [choices.suggested] : []), ...choices.otherSlots]
      if (!offered.some((s) => s.id === choice.slotId)) return refuse('slotTaken', SLOT_TAKEN_MESSAGE)
      surgeonId = choices.at.surgeonId ?? choice.surgeonId
      if (surgeonId === undefined || state.masters.surgeons[surgeonId] === undefined) return refuse('surgeonRequired', PLACE_SURGEON_REQUIRED_MESSAGE)
      placement = { kind: 'slot', slotId: choice.slotId, surgeonId }
      break
    }
    case 'list':
      if (!choices.lists.some((l) => l.id === choice.listId)) return refuse('listNotOffered', LIST_NOT_OFFERED_MESSAGE)
      placement = { kind: 'list', listId: choice.listId }
      break
    case 'draft':
      surgeonId = choices.at.surgeonId ?? choice.surgeonId
      if (surgeonId === undefined || state.masters.surgeons[surgeonId] === undefined) return refuse('surgeonRequired', PLACE_SURGEON_REQUIRED_MESSAGE)
      placement = { kind: 'draft', surgeonId }
      break
  }

  const waiting = rows.filter((r) => rowWaitsForNhi(r)).map((r) => r.id)
  const withNhi = rows.filter((r) => !rowWaitsForNhi(r)).map((r) => r.id)
  const auditBefore = state.audit.length
  const placed = withChangeSet(api, 'match', () =>
    transaction(api, (): Outcome<{ listId: string; bookingRowIds: string[]; stubIds: string[] }> => {
      let listId: string
      let bookingRowIds: string[] = []
      if (withNhi.length > 0) {
        // The first row makes the List (or goes on the chosen one), the rest join it: 68's one path.
        const decided = decideArrivingLists(api, actor, [{ placement, rows: withNhi.map((rowId) => ({ rowId, kind: 'place' as const })) }])
        if (!decided.ok) return decided
        const made = decided.value.placedListIds[0]
        if (made === undefined) return refuse('notPlaced', 'The List could not be placed.')
        listId = made
        bookingRowIds = decided.value.applied
      } else {
        // Every row waits for an NHI: make the List through the same actions, then the stubs stand on it.
        const made = madeListFor(api, actor, state, arrival, rows, placement)
        if (!made.ok) return made
        listId = made.value
      }
      const stubIds = placeStubsOnList(api, actor, listId, waiting)
      return ok({ listId, bookingRowIds, stubIds })
    }),
  )
  if (!placed.ok) return placed
  return ok({ changeSetId: api.getState().audit[auditBefore]?.changeSetId ?? null, ...placed.value })
}

/** The List a placement with no row to decide makes (or names), through the manual assignment or Draft List act. */
function madeListFor(
  api: AppStoreApi,
  actor: Actor,
  state: AppState,
  arrival: ArrivalItem,
  rows: readonly ImportRow[],
  placement: ListPlacement,
): Outcome<string> {
  if (placement.kind === 'list') return ok(placement.listId)
  const surgeonId = placement.surgeonId
  if (surgeonId === undefined) return refuse('surgeonRequired', PLACE_SURGEON_REQUIRED_MESSAGE)
  const first = rows[0]
  if (first === undefined) return refuse('nothingToPlace', 'This List has no patients left to place.')
  const batch = state.intake.batches[first.batchId]
  // The origin the row path gives a List it makes (the rooms' address for a PDF, else the hospital).
  const origin = originForNewList({
    kind: 'importRow',
    source: first.source,
    hospitalId: arrival.hospitalId,
    ...(batch?.senderEmail !== undefined ? { senderEmail: batch.senderEmail } : {}),
    ...(batch?.pdfListId !== undefined ? { pdfListId: batch.pdfListId } : {}),
  })
  if (placement.kind === 'slot') {
    const made = assignListToSlot(api, actor, placement.slotId, { hospitalId: arrival.hospitalId, surgeonId, kind: 'private', origin })
    return made.ok ? ok(made.value.listId) : made
  }
  if (arrival.dateISO === undefined || arrival.session === undefined) return refuse('notFound', 'Arrival not found.')
  const made = createDraftList(
    api,
    actor,
    { hospitalId: arrival.hospitalId, surgeonId, dateISO: arrival.dateISO, session: arrival.session, note: draftNote(state, arrival, rows), listOrigin: origin },
    'hospitalRow',
  )
  return made.ok ? ok(made.value.listId) : made
}

/**
 * Reject a whole new List arrival with a reason (US-02.1.2): every open row rejected through the one decision path,
 * one change set. Nothing is placed and no List made. Office only.
 */
export function rejectArrivalList(api: AppStoreApi, actor: Actor, arrivalKey: string, reason: string): Outcome<{ changeSetId: string | null }> {
  const state = api.getState()
  const found = newListArrival(state, actor, arrivalKey)
  if (!found.ok) return found
  const why = reason.trim()
  if (why === '') return refuse('reasonRequired', REJECT_REASON_REQUIRED_MESSAGE)
  const rowIds = found.value.openRowIds.filter((id) => state.intake.rows[id]?.status === 'open')
  const decided = decideArrivingLists(api, actor, [{ rows: rowIds.map((rowId) => ({ rowId, kind: 'reject' as const, reason: why })) }])
  if (!decided.ok) return decided
  return ok({ changeSetId: decided.value.changeSetId })
}
