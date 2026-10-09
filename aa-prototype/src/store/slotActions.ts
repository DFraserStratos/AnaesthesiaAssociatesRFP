/**
 * Slot and List actions (catch-up Phase 28; EP-01, FT-01.1, FT-01.2,
 * US-01.1.4, US-01.2.3, US-01.3.3, US-01.4.1; OQ-17, OQ-27, OQ-64 answered;
 * OQ-84's recommendation, provisional in the Decisions log).
 *
 * A Slot is the AM or PM box every active anaesthetist has on every horizon
 * day; its status is the one availability mechanism. A List is created only
 * here (assignment), by the recurring-booking projection, or by the post-op
 * addendum, and moves between Slots intact. Every write goes through
 * `mutate()` with before and after metas and timestamps from the demo clock.
 * "Slot" never reaches app copy: refusals and audit labels say session.
 */

import type {
  AssignedList,
  CoverRequest,
  DraftList,
  DraftOrigin,
  List,
  ListKind,
  RecurringBooking,
  Session,
  Slot,
  SlotStatusKey,
  WallTime,
} from '../domain/types'
import { LIST_KINDS } from '../domain/types'
import { enumerateDatesISO, horizonDatesBetween, horizonFor } from '../domain/clock'
import { effectiveSlotTimes, isWallTime, slotDatesFor } from '../domain/slots'
import { defaultSlotStatusKey, isOpenSlot, statusFor } from '../domain/slotStatus'
import { format, parseISO } from 'date-fns'
import {
  canvasAnaesthetists,
  generateCanvasForDates,
  seriesPaintedCount,
  SEED_LEAVE,
  type CanvasMasters,
  type GeneratedCanvas,
} from '../domain/seed'
import { pairingAcknowledgement } from '../domain/pairingPreferences'
import { pairingIssues } from '../domain/listPairing'
import { answeringLists, recurringClashDraft, type NormalisedClash } from '../domain/draftLists'
import { answeredKey } from '../domain/recurringBookingProjection'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { editRefusal } from './lifecycle'
import { listInSlot, scheduleHorizon, slotFor } from './selectors'
import { seriesCalendarFor, setOneSessionAvailability } from './availabilityActions'
import { instanceKey } from '../domain/availabilitySeries'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * The generator's masters from live state for the dates being generated:
 * start dates, active flags, recurring bookings, the calendar (the seed's leave
 * and the active availability series, through the one helper
 * `seriesCalendarFor`), the status master and holidays. Every generating path
 * (roll-forward, horizon extension, a new or reactivated anaesthetist, an
 * earlier start date) comes through here.
 */
export function canvasMastersFrom(state: Pick<AppState, 'masters' | 'schedule'>, datesISO: readonly string[]): CanvasMasters {
  return {
    anaesthetists: canvasAnaesthetists(state.masters.anaesthetists),
    recurringBookings: Object.values(state.masters.recurringBookings),
    // Leave set at runtime already lives on the Slots it covers; the seed's
    // calendar is the generator's input for days it has not generated yet.
    leave: SEED_LEAVE,
    series: seriesCalendarFor(state, datesISO),
    statuses: state.masters.slotStatuses,
  }
}

/**
 * Add generated Slots and Lists to the schedule, never replacing one that
 * exists. A generated List whose projected id is already taken (a List that
 * kept its id when it moved, or went back to the office as a Draft List) gets
 * an `LG####` id instead, and one whose Slot already holds a List is dropped
 * (catch-up Phase 31): a projection never overwrites a List another record
 * holds.
 */
export function withGenerated(
  schedule: AppState['schedule'],
  generated: Pick<GeneratedCanvas, 'slots' | 'lists'>,
  counters: Record<string, number>,
): { schedule: AppState['schedule']; counters: Record<string, number>; slots: number; lists: number } {
  const slots = { ...schedule.slots }
  const lists = { ...schedule.lists }
  let addedSlots = 0
  let addedLists = 0
  let nextCounters = counters
  for (const slot of generated.slots) {
    if (slots[slot.id] === undefined) {
      slots[slot.id] = slot
      addedSlots++
    }
  }
  const occupied = new Set<string>()
  for (const l of Object.values(lists)) if (l.slotId !== undefined) occupied.add(l.slotId)
  // A day a Draft List (or a List assigned from one) answers for is never projected again.
  const answered = answeringLists(lists)
  for (const list of generated.lists) {
    if (list.slotId === undefined || slots[list.slotId] === undefined || occupied.has(list.slotId)) continue
    if (list.recurringBookingId !== undefined && list.anaesthetistId !== undefined && answered.has(answeredKey(list.recurringBookingId, list.anaesthetistId, list.dateISO, list.session))) continue
    let placed = list
    if (lists[list.id] !== undefined) {
      const alloc = allocateId(nextCounters, 'list')
      nextCounters = alloc.counters
      placed = { ...list, id: alloc.id }
    }
    lists[placed.id] = placed
    occupied.add(list.slotId)
    addedLists++
  }
  return { schedule: { ...schedule, slots, lists }, counters: nextCounters, slots: addedSlots, lists: addedLists }
}

/**
 * Generated canvas days into the schedule, every path alike (roll forward,
 * horizon extend, a new or reactivated anaesthetist, an earlier start date):
 * the Slots and projected Lists, then every recurring clash as a Draft List
 * (OQ-81 part 2) in the same commit. One `draftList.fromRecurringClash` meta
 * per Draft List, or one batch meta when `batch` names the run.
 */
export function applyGenerated(
  s: AppState,
  generated: GeneratedCanvas,
  by: string,
  metas: MutationMeta[],
  batch?: { entityType: string; entityId: string },
): { schedule: AppState['schedule']; counters: Record<string, number>; slots: number; lists: number; draftListIds: string[] } {
  const added = withGenerated(s.schedule, generated, s.counters)
  const lists = { ...added.schedule.lists }
  const clashes = generated.clashes
    .map((c) => {
      const slot = added.schedule.slots[c.slotId]
      return slot === undefined ? undefined : { recurringBookingId: c.recurringBookingId, anaesthetistId: slot.anaesthetistId, dateISO: slot.dateISO, session: slot.session }
    })
    .filter((c): c is NormalisedClash => c !== undefined)
  const drafts = clashDraftsInto(lists, clashes, {
    recurringBookings: s.masters.recurringBookings,
    todayISO: s.clock.todayISO,
    nowISO: clockISO(s.clock),
    by,
    counters: added.counters,
  })
  if (batch !== undefined && drafts.draftListIds.length > 0) {
    metas.push({
      entityType: batch.entityType,
      entityId: batch.entityId,
      action: 'draftList.fromRecurringClash',
      after: { draftListIds: drafts.draftListIds },
      stampBookingId: null,
    })
  } else metas.push(...drafts.metas)
  return { schedule: { ...added.schedule, lists }, counters: drafts.counters, slots: added.slots, lists: added.lists, draftListIds: drafts.draftListIds }
}

export interface NewListFields {
  kind: ListKind
  hospitalId: string
  surgeonId: string
  notes?: string
}

/**
 * The one place a List is created at runtime (inside a mutate recipe): it
 * allocates `LG####`, puts the List in the Slot (`slotId` plus the
 * denormalised anaesthetist, date and session), starts it ACTIVE (15b's name
 * for an assigned List; DRAFT is Phase 31's, for a List with no anaesthetist)
 * and returns its `list.create` meta. Conflicts are not its business: the one
 * rule in `mutate()` flags a closed hospital or a closed session (catch-up
 * Phase 30). Not exported
 * from the store's index: callers are the store's own actions.
 */
export function placeListOnSlot(
  counters: Record<string, number>,
  slot: Slot,
  fields: NewListFields,
): { list: AssignedList; counters: Record<string, number>; meta: MutationMeta } {
  // Dev assertion (US-01.3.1): callers check the pairing first, so a gap here is a programming error.
  if (fields.hospitalId === '' || fields.surgeonId === '') throw new Error(`placeListOnSlot needs a hospital and a surgeon (${slot.id})`)
  const alloc = allocateId(counters, 'list')
  const list: AssignedList = {
    id: alloc.id,
    slotId: slot.id,
    dateISO: slot.dateISO,
    anaesthetistId: slot.anaesthetistId,
    session: slot.session,
    state: 'ACTIVE',
    kind: fields.kind,
    hospitalId: fields.hospitalId,
    surgeonId: fields.surgeonId,
    conflicts: [],
  }
  if (fields.notes !== undefined && fields.notes.trim() !== '') list.notes = fields.notes.trim()
  return {
    list,
    counters: alloc.counters,
    meta: {
      entityType: 'list',
      entityId: alloc.id,
      action: 'list.create',
      after: { state: 'ACTIVE', slotId: slot.id, kind: list.kind, hospitalId: list.hospitalId, surgeonId: list.surgeonId },
      stampBookingId: null,
    },
  }
}

/** An open Slot loses any cover marker once a List is in it (it is no longer open). */
export function withoutCoverRequest(slot: Slot): Slot {
  if (slot.coverRequest === undefined) return slot
  const next = { ...slot }
  delete next.coverRequest
  return next
}

// ---------------------------------------------------------------------------
// Draft List internals (catch-up Phase 31; EP-07, FT-01.6, DM-52)
// ---------------------------------------------------------------------------

/**
 * The one way a new Draft List record is written (state DRAFT): by
 * `createDraftList` and by the recurring clash. It never touches
 * `schedule.slots` or another List (US-01.6.1 "Takes no Slot"). Mutates the
 * `lists` copy it is given, inside a mutate recipe.
 */
export function insertDraftList(lists: Record<string, List>, draft: DraftList): void {
  if (draft.state !== 'DRAFT' || draft.anaesthetistId !== undefined || draft.slotId !== undefined) {
    throw new Error(`insertDraftList takes a DRAFT List with no anaesthetist and no session (${draft.id})`)
  }
  if (lists[draft.id] !== undefined) throw new Error(`insertDraftList would overwrite ${draft.id}`)
  lists[draft.id] = draft
}

/**
 * Turn recurring clashes into Draft Lists (OQ-81 part 2) through the one rule,
 * `recurringClashDraft`, skipping a past day and any day already answered
 * (`answeringLists`: a live clash Draft List, one the office re-dated or
 * removed, or a List assigned from one), so running it twice never makes a
 * second one. A derived id taken by a Draft List the recurring booking's own
 * change removed gets `LG####`. Writes no conflict: a hospital closure that
 * day comes from the reconcile in `mutate()`; an availability conflict never
 * can (no Slot; US-01.5.4 AC3).
 */
export function clashDraftsInto(
  lists: Record<string, List>,
  clashes: readonly NormalisedClash[],
  ctx: { recurringBookings: Readonly<Record<string, RecurringBooking>>; todayISO: string; nowISO: string; by: string; counters: Record<string, number> },
): { counters: Record<string, number>; metas: MutationMeta[]; draftListIds: string[] } {
  let counters = ctx.counters
  const metas: MutationMeta[] = []
  const draftListIds: string[] = []
  if (clashes.length === 0) return { counters, metas, draftListIds }
  const answered = new Set(answeringLists(lists).keys())
  for (const clash of clashes) {
    const rb = ctx.recurringBookings[clash.recurringBookingId]
    if (rb === undefined) continue
    const key = answeredKey(clash.recurringBookingId, clash.anaesthetistId, clash.dateISO, clash.session)
    if (answered.has(key)) continue
    let draft = recurringClashDraft(clash, rb, ctx.todayISO, ctx.nowISO, ctx.by)
    if (draft === null) continue
    if (lists[draft.id] !== undefined) {
      const alloc = allocateId(counters, 'list')
      counters = alloc.counters
      draft = { ...draft, id: alloc.id }
    }
    insertDraftList(lists, draft)
    answered.add(key)
    draftListIds.push(draft.id)
    metas.push({
      entityType: 'list',
      entityId: draft.id,
      action: 'draftList.fromRecurringClash',
      after: {
        state: 'DRAFT',
        recurringBookingId: rb.id,
        dateISO: draft.dateISO,
        session: draft.session,
        hospitalId: draft.hospitalId,
        surgeonId: draft.surgeonId,
        fromAnaesthetistId: clash.anaesthetistId,
      },
      stampBookingId: null,
    })
  }
  return { counters, metas, draftListIds }
}

/**
 * The one DRAFT to ACTIVE step (EP-07; US-01.6.3 "Becomes active"): the
 * Draft List goes into the Slot, taking its anaesthetist (denormalised, as
 * Phase 28's invariant says) and state ACTIVE. It keeps its id, Bookings,
 * notes and conflicts; the draft trail is kept with `assignedAtISO`.
 */
export function attachListToSlot(list: DraftList, slot: Slot, by: string, atISO: string): AssignedList {
  const { draft, ...rest } = list
  return {
    ...rest,
    state: 'ACTIVE',
    slotId: slot.id,
    anaesthetistId: slot.anaesthetistId,
    dateISO: slot.dateISO,
    session: slot.session,
    draft: { ...draft, assignedAtISO: atISO, assignedBy: by },
  }
}

export interface DetachOptions {
  origin: Extract<DraftOrigin, 'movedToOffice' | 'unavailableReturn'>
  by: string
  atISO: string
  fromAnaesthetistId?: string
}

/**
 * The one ACTIVE to DRAFT step (EP-07: "an ACTIVE List that goes back to the
 * office is DRAFT again"), built here for Phase 32's callers (the anaesthetist
 * moves or withdraws a List to the office, or returns it when marking a booked
 * session unavailable; US-01.4.3, US-01.5.5). No screen in Phase 31 calls it.
 * Refuses a List that is not ACTIVE (`notActive`: a SUBMITTED or AUTHORISED
 * List never goes back). The List keeps its id, Bookings, notes and holiday
 * conflicts and its `recurringBookingId`; it leaves its Slot (whose own times
 * go back to the defaults; its status is whatever the caller set), loses its
 * availability conflicts, and gets a fresh draft trail. It re-triggers no
 * prepayment calculation (US-06.3.5, D20). Operates on the schedule passed in,
 * inside a mutate recipe.
 */
export function detachListToDraft(
  schedule: AppState['schedule'],
  listId: string,
  options: DetachOptions,
): Outcome<{ schedule: AppState['schedule']; list: DraftList; meta: MutationMeta }> {
  const list = schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  if (list.state !== 'ACTIVE') return refuse('notActive', 'Only an active List can go back to the office.')
  const { slotId, anaesthetistId, state: _state, ...rest } = list
  void _state
  const draft: DraftList = {
    ...rest,
    state: 'DRAFT',
    conflicts: list.conflicts.filter((c) => c.kind === 'holiday'),
    draft: {
      origin: options.origin,
      sinceISO: options.atISO,
      by: options.by,
      fromAnaesthetistId: options.fromAnaesthetistId ?? anaesthetistId,
      // A List assigned from a clash keeps answering for that recurring booking's day.
      ...(list.draft?.projectedFor !== undefined
        ? { projectedFor: { ...list.draft.projectedFor, anaesthetistId: list.draft.projectedFor.anaesthetistId ?? list.draft.fromAnaesthetistId ?? anaesthetistId } }
        : {}),
    },
  }
  const slots = { ...schedule.slots }
  const vacated = slots[slotId]
  if (vacated !== undefined && (vacated.startTime !== undefined || vacated.endTime !== undefined)) {
    const next = { ...vacated }
    delete next.startTime
    delete next.endTime
    slots[slotId] = next
  }
  const meta: MutationMeta = {
    entityType: 'list',
    entityId: listId,
    action: 'draftList.detach',
    before: { state: 'ACTIVE', anaesthetistId, slotId },
    after: { state: 'DRAFT', anaesthetistId: null, slotId: null, origin: options.origin },
    stampBookingId: null,
  }
  return ok({ schedule: { ...schedule, slots, lists: { ...schedule.lists, [listId]: draft } }, list: draft, meta })
}

/** The pairing refusal every List write shares (US-01.3.1): the first issue's message carries the code given. */
export function pairingRefusal(
  input: { hospitalId?: string | null; surgeonId?: string | null },
  masters: Pick<AppState['masters'], 'hospitals' | 'surgeons'>,
  code = 'pairingIncomplete',
): Outcome<never> | null {
  const issues = pairingIssues(input, masters)
  if (issues.length === 0) return null
  return refuse(code, issues.map((i) => i.message).join(' '), { issues })
}


// ---------------------------------------------------------------------------
// assignListToSlot (US-01.3.3)
// ---------------------------------------------------------------------------

export interface AssignListFields {
  hospitalId: string
  surgeonId: string
  kind: ListKind
  notes?: string
}

/**
 * The office assigns a surgeon and a hospital to an available session, which
 * creates its List (US-01.3.3: "an admin assigns a surgeon and hospital to an
 * available Slot"; anaesthetists do not). A hospital closed that day, or a
 * session marked with a closed status, is accepted and flagged by the one
 * rule in `mutate()`, never refused (OQ-09, US-01.5.2; catch-up Phase 30
 * replaced 28's interim `slotNotAvailable` refusal). A not-preferred pairing of the
 * surgeon and the session's anaesthetist is never refused: when the actor is
 * the office the same commit records 17's `list.pairingAcknowledged`
 * (US-01.3.5 "every office path", OQ-43); a preferred pairing writes nothing.
 */
export function assignListToSlot(
  api: AppStoreApi,
  actor: Actor,
  slotId: string,
  fields: AssignListFields,
): Outcome<{ listId: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can assign a List.')
  const state = api.getState()
  const slot = state.schedule.slots[slotId]
  if (slot === undefined) return refuse('notFound', 'Session not found.')
  if (listInSlot(state, slotId) !== undefined) return refuse('slotOccupied', 'This session already holds a List.')
  // The one pairing rule (US-01.3.1, catch-up Phase 31): its first issue, with 28's codes.
  const issue = pairingIssues(fields, state.masters)[0]
  if (issue !== undefined) return refuse(issue.code === 'hospitalUnknown' || issue.code === 'surgeonUnknown' ? 'notFound' : issue.code, issue.message)
  if (!(LIST_KINDS as readonly string[]).includes(fields.kind)) return refuse('invalidKind', 'Choose private, public or pre-op.')

  const metas: MutationMeta[] = []
  let listId = ''
  mutate(api, actor, metas, (s) => {
    const placed = placeListOnSlot(s.counters, slot, fields)
    listId = placed.list.id
    metas.push(placed.meta)
    const ack = pairingAcknowledgement(s.officePrivate.pairingPreferences, slot.anaesthetistId, fields.surgeonId)
    if (ack !== null) {
      metas.push({ entityType: 'list', entityId: listId, action: 'list.pairingAcknowledged', after: ack, stampBookingId: null })
    }
    return {
      schedule: {
        ...s.schedule,
        slots: { ...s.schedule.slots, [slot.id]: withoutCoverRequest(slot) },
        lists: { ...s.schedule.lists, [listId]: placed.list },
      },
      counters: placed.counters,
    }
  })
  return ok({ listId })
}

// ---------------------------------------------------------------------------
// moveListToSlot / reassignList (US-01.4.1)
// ---------------------------------------------------------------------------

/**
 * Move a List into another Slot on the same day and session (US-01.4.1's
 * technical discussion: change the owner reference, consume the covering
 * anaesthetist's Slot, return the vacated Slot to available). The List keeps
 * its id, Bookings, phone notes, attachments and history; its `slotId` and
 * denormalised fields change; it loses its recurring-booking provenance (a
 * move is an edit, so no projection removes or rewrites it). Conflicts follow
 * the one rule in `mutate()`: an availability conflict resolves when the
 * target is open, a holiday conflict stays (the date and hospital move with
 * the List), and a closed target is accepted and flagged (OQ-09; catch-up
 * Phase 30 dropped 28's `targetNotOpen` for a closed target; an occupied one
 * is still refused). The Slot's own times travel to the target and are cleared
 * from the vacated one, which takes `vacatedStatus`.
 *
 * It reads, checks and logs NO pairing preference: Phases 32 and 32a reuse it
 * for the anaesthetist's own move, which shows no warning (US-01.4.5). The
 * office's acknowledgement is passed in by `reassignList` (`pairingAcknowledgement`).
 * A move re-checks no prepayment and recalculates no invoice (US-06.3.5,
 * US-06.5.4: an honour system). PHASE 41 SEAM: the payable's payee repoint
 * for a prepaid Booking on a move (OQ-80, D38) hangs here, after the commit.
 */
export interface MoveListOptions {
  /** What the vacated session becomes: the default status (Free) unless another active status is chosen (OQ-84's recommendation). */
  vacatedStatus?: SlotStatusKey
  /** The office's pairing acknowledgement, recorded in the same commit (`reassignList` only; never an anaesthetist's move). */
  pairingAcknowledgement?: MutationMeta
}

export function moveListToSlot(
  api: AppStoreApi,
  actor: Actor,
  listId: string,
  toSlotId: string,
  options: MoveListOptions = {},
): Outcome<{ listId: string; vacatedSlotId: string }> {
  const state = api.getState()
  const vacatedStatus = options.vacatedStatus ?? defaultSlotStatusKey(state.masters.slotStatuses)
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  if (actor.source === 'integration') return refuse('integrationForbidden', 'A feed cannot move a List.')
  // A Draft List has no session to move from: the office assigns it (`assignDraftList`).
  if (list.state === 'DRAFT') return refuse('notAssigned', 'This List has no anaesthetist yet. Assign it instead.')
  if (list.state === 'AUTHORISED') return refuse('listAuthorised', 'An authorised List is locked and cannot be moved.')
  if (actor.role === 'anaesthetist') {
    const rights = editRefusal(actor, list)
    if (rights !== null) return rights
  }
  const from = state.schedule.slots[list.slotId]
  if (from === undefined) return refuse('notFound', "This List's session is outside the schedule.")
  const to = state.schedule.slots[toSlotId]
  if (to === undefined) return refuse('notFound', 'That session does not exist.')
  if (to.id === from.id) return refuse('sameSlot', 'The List is already in that session.')
  if (to.dateISO !== from.dateISO || to.session !== from.session) {
    return refuse('differentSession', 'A List moves to the same day and session.')
  }
  if (listInSlot(state, to.id) !== undefined) return refuse('slotOccupied', 'That session already holds a List.')
  const vacatedRecord = statusFor(state.masters.slotStatuses, vacatedStatus)
  if (vacatedRecord === undefined || vacatedRecord.retiredAtISO !== undefined) {
    return refuse('invalidVacatedStatus', 'Choose an availability status in use for the vacated session.')
  }

  const moved: AssignedList = { ...list, slotId: to.id, anaesthetistId: to.anaesthetistId }
  if (list.recurringBookingId !== undefined && list.recurringOrigin === undefined) {
    moved.recurringOrigin = { recurringBookingId: list.recurringBookingId, slotId: from.id }
  }
  delete moved.recurringBookingId
  const target: Slot = withoutCoverRequest({ ...to })
  delete target.startTime
  delete target.endTime
  if (from.startTime !== undefined) target.startTime = from.startTime
  if (from.endTime !== undefined) target.endTime = from.endTime
  const vacated: Slot = { ...from, status: vacatedStatus }
  delete vacated.startTime
  delete vacated.endTime
  // A vacated series instance leaves its series (catch-up Phase 29), recorded
  // as an edited instance so no later generation repaints it.
  const vacatedSeries = from.seriesId !== undefined ? state.schedule.availabilitySeries[from.seriesId] : undefined
  delete vacated.seriesId

  const metas: MutationMeta[] = [
    {
      entityType: 'list',
      entityId: list.id,
      action: 'list.reassign',
      before: { slotId: from.id, anaesthetistId: list.anaesthetistId },
      after: { slotId: to.id, anaesthetistId: to.anaesthetistId },
      stampBookingId: null,
    },
    ...(options.pairingAcknowledgement !== undefined ? [options.pairingAcknowledgement] : []),
  ]
  if (vacatedStatus !== from.status) {
    metas.push({
      entityType: 'session',
      entityId: from.id,
      action: 'session.status',
      before: { status: from.status },
      after: { status: vacatedStatus },
      stampBookingId: null,
    })
  }
  mutate(api, actor, metas, (s) => ({
    schedule: {
      ...s.schedule,
      slots: { ...s.schedule.slots, [from.id]: vacated, [to.id]: target },
      lists: { ...s.schedule.lists, [list.id]: moved },
      ...(vacatedSeries !== undefined
        ? {
            availabilitySeries: {
              ...s.schedule.availabilitySeries,
              [vacatedSeries.id]: {
                ...vacatedSeries,
                exceptions: { ...vacatedSeries.exceptions, [instanceKey(from.dateISO, from.session)]: { kind: 'edited' as const, statusKey: vacatedStatus } },
              },
            },
          }
        : {}),
    },
  }))
  return ok({ listId: list.id, vacatedSlotId: from.id })
}

/**
 * The office reassigns a List to a colleague's open session on the same day
 * and session (US-01.4.1, the illness-cover case): the List moves intact and
 * the vacated session returns to Free unless the office marks it Unavailable
 * or Holiday (OQ-84's recommendation, provisional). Phase 17's acknowledgement
 * of a not-preferred pairing (the List's surgeon against the colleague) is
 * written here, the office entry point, never in `moveListToSlot`.
 */
export function reassignList(
  api: AppStoreApi,
  actor: Actor,
  listId: string,
  toAnaesthetistId: string,
  vacatedStatus?: SlotStatusKey,
): Outcome<{ listId: string; vacatedSlotId: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can reassign a List.')
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  if (toAnaesthetistId === list.anaesthetistId) return refuse('sameAnaesthetist', 'The List already belongs to that anaesthetist.')
  const colleague = state.masters.anaesthetists[toAnaesthetistId]
  if (colleague === undefined) return refuse('notFound', 'Target anaesthetist not found.')
  const to = slotFor(state, toAnaesthetistId, list.dateISO, list.session)
  if (to === undefined) return refuse('noTargetSession', `${colleague.name} has no session then.`)
  const ack = pairingAcknowledgement(state.officePrivate.pairingPreferences, toAnaesthetistId, list.surgeonId)
  return moveListToSlot(api, actor, listId, to.id, {
    ...(vacatedStatus !== undefined ? { vacatedStatus } : {}),
    ...(ack !== null
      ? { pairingAcknowledgement: { entityType: 'list', entityId: list.id, action: 'list.pairingAcknowledged', after: ack, stampBookingId: null } }
      : {}),
  })
}

// ---------------------------------------------------------------------------
// setAvailability (FT-01.2, the one mechanism)
// ---------------------------------------------------------------------------

/**
 * Set a session's availability: writes `Slot.status` and `Slot.note` directly
 * (FT-01.2, OQ-27: one mechanism, no second record, nothing reconciled). It
 * never touches the List's kind and reads nothing about Bookings (US-01.2.3).
 * The status is any in-use status of the master (an anaesthetist only one they
 * may set). The write is the range action's (`setOneSessionAvailability`,
 * through the shared per-session write `applySessionWrites`):
 *   - an empty session is simply updated;
 *   - a session holding a List marked with a closed status keeps its List and
 *     kind, and the one rule in `mutate()` flags it (catch-up Phase 30). For an
 *     anaesthetist this is the INTERIM until Phase 32 offers return to the
 *     office or assign to a colleague (US-01.5.5, the OQ-64 answer); for the
 *     office (a sickness phoned in) it is the built reading (OQ-81 part 3,
 *     provisional);
 *   - a bookable status resolves that conflict.
 */
export function setAvailability(
  api: AppStoreApi,
  actor: Actor,
  anaesthetistId: string,
  dateISO: string,
  session: Session,
  status: SlotStatusKey,
  note?: string,
): Outcome<{ result: 'updated' | 'conflictFlagged' | 'noChange' }> {
  return setOneSessionAvailability(api, actor, anaesthetistId, dateISO, session, status, note)
}

// ---------------------------------------------------------------------------
// Times (US-01.1.4)
// ---------------------------------------------------------------------------

export interface SlotTimesPatch {
  /** `HH:mm`; an empty string clears the override (the session follows the default). */
  startTime?: string
  endTime?: string
}

/** The office overrides one session's times (US-01.1.4 "each Slot can override"). */
export function setSlotTimes(api: AppStoreApi, actor: Actor, slotId: string, patch: SlotTimesPatch): Outcome<{ changed: boolean }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can change session times.')
  const state = api.getState()
  const slot = state.schedule.slots[slotId]
  if (slot === undefined) return refuse('notFound', 'Session not found.')
  const list = listInSlot(state, slotId)
  if (list?.state === 'AUTHORISED') return refuse('listAuthorised', 'This List is authorised and locked. Its times cannot change.')
  const next: Slot = { ...slot }
  for (const key of ['startTime', 'endTime'] as const) {
    const value = patch[key]
    if (value === undefined) continue
    if (value === '') delete next[key]
    else if (!isWallTime(value)) return refuse('invalidTime', 'Times are HH:mm, for example 13:30.')
    else next[key] = value
  }
  const effective = effectiveSlotTimes(next, state.appSettings.schedule)
  if (!(effective.startTime < effective.endTime)) return refuse('invalidTimes', 'The start time must be before the end time.')
  if (next.startTime === slot.startTime && next.endTime === slot.endTime) return ok({ changed: false })
  mutate(
    api,
    actor,
    {
      entityType: 'session',
      entityId: slotId,
      action: 'session.times',
      before: { startTime: slot.startTime ?? null, endTime: slot.endTime ?? null },
      after: { startTime: next.startTime ?? null, endTime: next.endTime ?? null },
      stampBookingId: null,
    },
    (s) => {
      // An office change of a projected List's times is a hand edit: the List
      // leaves its recurring booking (catch-up Phase 30), so no projection
      // writes the times back.
      const held = listInSlot(s, slotId)
      const lists =
        held !== undefined && held.recurringBookingId !== undefined
          ? { ...s.schedule.lists, [held.id]: (({ recurringBookingId: _rb, ...rest }) => rest)(held) }
          : s.schedule.lists
      return { schedule: { ...s.schedule, slots: { ...s.schedule.slots, [slotId]: next }, lists } }
    },
  )
  return ok({ changed: true })
}

/**
 * The office sets the default AM and PM times (US-01.1.4: "Admins set default
 * start and end times for AM and PM Slots"). Sessions without their own times
 * follow at once; sessions with their own keep them.
 */
export function setSlotDefaultTimes(
  api: AppStoreApi,
  actor: Actor,
  defaultTimes: Record<Session, { startTime: WallTime; endTime: WallTime }>,
): Outcome<{ changed: boolean }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can change the default session times.')
  for (const session of ['AM', 'PM'] as const) {
    const t = defaultTimes[session]
    if (!isWallTime(t.startTime) || !isWallTime(t.endTime)) return refuse('invalidTime', 'Times are HH:mm, for example 13:30.')
    if (!(t.startTime < t.endTime)) return refuse('invalidTimes', `The ${session} start time must be before its end time.`)
  }
  const state = api.getState()
  const before = state.appSettings.schedule.defaultTimes
  if (JSON.stringify(before) === JSON.stringify(defaultTimes)) return ok({ changed: false })
  const next = { AM: { ...defaultTimes.AM }, PM: { ...defaultTimes.PM } }
  mutate(
    api,
    actor,
    { entityType: 'settings', entityId: 'schedule', action: 'settings.scheduleDefaults', before, after: next, stampBookingId: null },
    (s) => ({ appSettings: { ...s.appSettings, schedule: { ...s.appSettings.schedule, defaultTimes: next } } }),
  )
  return ok({ changed: true })
}

// ---------------------------------------------------------------------------
// The horizon (FT-01.1)
// ---------------------------------------------------------------------------

export const HORIZON_MONTHS_MIN = 1
/** The long-horizon scale question is Phase 43's (FT-01.1: "we don't have to worry about it for now"). */
export const HORIZON_MONTHS_MAX = 24

export interface HorizonChangePreview {
  direction: 'extend' | 'shorten' | 'none'
  fromEndISO: string
  toEndISO: string
  /** Days added or removed at the far edge. */
  days: number
  /** Lists after the new end that would be dropped (none of them holds a Booking). */
  listsDropped: number
  /**
   * Lists after the new end that hold a Booking (cancelled ones included, as
   * their record points at the List) or an attachment: a shorten is refused
   * while any stands, so no record is orphaned and no file lost.
   */
  listsWithBookings: number
}

/** What changing the horizon to `months` would do (pure; the settings sheet's live preview). */
export function previewHorizonChange(
  state: Pick<AppState, 'clock' | 'appSettings'> & { schedule: Pick<AppState['schedule'], 'lists' | 'bookings'> },
  months: number,
): HorizonChangePreview {
  const fromEndISO = scheduleHorizon(state).endISO
  const toEndISO = horizonFor(state.clock.todayISO, months).endISO
  if (toEndISO === fromEndISO) return { direction: 'none', fromEndISO, toEndISO, days: 0, listsDropped: 0, listsWithBookings: 0 }
  if (toEndISO > fromEndISO) {
    return { direction: 'extend', fromEndISO, toEndISO, days: horizonDatesBetween(fromEndISO, toEndISO).length, listsDropped: 0, listsWithBookings: 0 }
  }
  const beyond = Object.values(state.schedule.lists).filter((l) => l.dateISO > toEndISO && l.state !== 'DRAFT')
  const booked = new Set(Object.values(state.schedule.bookings).map((b) => b.listId))
  const withBookings = beyond.filter((l) => booked.has(l.id) || (l.attachments ?? []).length > 0).length
  return {
    direction: 'shorten',
    fromEndISO,
    toEndISO,
    days: horizonDatesBetween(toEndISO, fromEndISO).length,
    listsDropped: beyond.length - withBookings,
    listsWithBookings: withBookings,
  }
}

/**
 * The office changes the schedule horizon (FT-01.1: "flexible enough to have
 * any number of months"; shortening drops the far-edge days and extending
 * fills them). Extending generates the new far-edge dates exactly as the
 * roll-forward would (free Slots, the calendar, then recurring bookings).
 * Shortening drops every Slot after the new end with the Lists in it, and is
 * refused while any of those Lists holds a Booking.
 */
export function setHorizonMonths(api: AppStoreApi, actor: Actor, months: number): Outcome<HorizonChangePreview & { slots: number; lists: number }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can change the schedule horizon.')
  if (!Number.isInteger(months) || months < HORIZON_MONTHS_MIN || months > HORIZON_MONTHS_MAX) {
    return refuse('invalidHorizon', `The horizon is a whole number of months from ${HORIZON_MONTHS_MIN} to ${HORIZON_MONTHS_MAX}.`)
  }
  const state = api.getState()
  const fromMonths = state.appSettings.schedule.horizonMonths
  const preview = previewHorizonChange(state, months)
  // The same value is no change (as the other settings actions): nothing written.
  if (months === fromMonths) return ok({ ...preview, direction: 'none', slots: 0, lists: 0 })
  if (preview.listsWithBookings > 0) {
    const n = preview.listsWithBookings
    return refuse(
      'listsBeyondHorizon',
      `${n} ${n === 1 ? 'List' : 'Lists'} after ${format(parseISO(preview.toEndISO), 'EEE d MMM yyyy')} ${n === 1 ? 'holds' : 'hold'} Bookings or attachments (cancelled Bookings count). Move them first, or keep the longer horizon.`,
    )
  }

  let slotsChanged = 0
  let listsChanged = 0
  let seriesSessions = 0
  const droppedListIds: string[] = []
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    let schedule = s.schedule
    let counters = s.counters
    if (preview.direction === 'extend') {
      const extendDates = horizonDatesBetween(preview.fromEndISO, preview.toEndISO)
      const generated = generateCanvasForDates(canvasMastersFrom(s, extendDates), extendDates)
      // Recurring clashes on the new days become Draft Lists (OQ-81 part 2; FT-01.1 "extending fills them in").
      const added = applyGenerated(s, generated, actor.who, metas)
      seriesSessions = seriesPaintedCount(generated)
      schedule = added.schedule
      counters = added.counters
      slotsChanged = added.slots
      listsChanged = added.lists
    } else if (preview.direction === 'shorten') {
      const slots = { ...schedule.slots }
      const lists = { ...schedule.lists }
      for (const slot of Object.values(schedule.slots)) {
        if (slot.dateISO > preview.toEndISO) {
          delete slots[slot.id]
          slotsChanged++
        }
      }
      for (const list of Object.values(schedule.lists)) {
        // Draft Lists hold no session: the office resolves them, and a removed one stays in History.
        if (list.dateISO > preview.toEndISO && list.state !== 'DRAFT') {
          delete lists[list.id]
          droppedListIds.push(list.id)
          listsChanged++
        }
      }
      schedule = { ...schedule, slots, lists }
    }
    metas.push({
      entityType: 'settings',
      entityId: 'schedule',
      action: 'settings.horizon',
      before: { horizonMonths: fromMonths },
      after: {
        fromMonths,
        toMonths: months,
        fromEndISO: preview.fromEndISO,
        toEndISO: preview.toEndISO,
        slots: preview.direction === 'shorten' ? -slotsChanged : slotsChanged,
        lists: preview.direction === 'shorten' ? -listsChanged : listsChanged,
        ...(seriesSessions > 0 ? { seriesSessions } : {}),
        ...(droppedListIds.length > 0 ? { droppedListIds: droppedListIds.sort() } : {}),
      },
      stampBookingId: null,
    })
    return { schedule, counters, appSettings: { ...s.appSettings, schedule: { ...s.appSettings.schedule, horizonMonths: months } } }
  })
  return ok({ ...preview, slots: slotsChanged, lists: listsChanged })
}

// ---------------------------------------------------------------------------
// requestCover (Phase 03's marker, on the Slot until Phase 32 removes it)
// ---------------------------------------------------------------------------

/**
 * Record a cover offer or request on an open session (Phase 03 mobile flow).
 * `offer`: the owner offers their own free session; `request`: a colleague is
 * asked to cover someone else's. Simulated only. Refused unless the session is
 * open (free, no List). Phase 32 removes it: the anaesthetist then moves their
 * own List instead.
 */
export function requestCover(
  api: AppStoreApi,
  actor: Actor,
  slotId: string,
  kind: 'offer' | 'request',
  message?: string,
  targetAnaesthetistId?: string,
): Outcome {
  const state = api.getState()
  const slot = state.schedule.slots[slotId]
  if (slot === undefined) return refuse('notFound', 'Session not found.')
  if (actor.role !== 'anaesthetist') return refuse('anaesthetistOnly', 'Cover offers and requests come from an anaesthetist.')
  if (!isOpenSlot(slot, listInSlot(state, slotId), state.masters.slotStatuses)) {
    return refuse('notFree', 'Cover can only be offered or requested on a free session.')
  }
  if (kind === 'offer') {
    if (actor.anaesthetistId !== undefined && actor.anaesthetistId !== slot.anaesthetistId) {
      return refuse('notOwnList', 'You can only offer cover on your own free session.')
    }
  } else if (actor.anaesthetistId !== undefined && actor.anaesthetistId === slot.anaesthetistId) {
    return refuse('ownList', 'This is your own session, use Offer cover instead.')
  }
  if (slot.coverRequest !== undefined) return refuse('alreadyRequested', 'A cover request is already pending on this session.')

  const coverRequest: CoverRequest = { by: actor.who, kind, atISO: clockISO(state.clock), status: 'pending' }
  if (message !== undefined && message.trim() !== '') coverRequest.message = message.trim()
  if (targetAnaesthetistId !== undefined) coverRequest.targetAnaesthetistId = targetAnaesthetistId

  mutate(
    api,
    actor,
    {
      entityType: 'session',
      entityId: slotId,
      action: 'session.coverRequest',
      after: { kind, ...(targetAnaesthetistId !== undefined ? { targetAnaesthetistId } : {}) },
      stampBookingId: null,
    },
    (s) => ({ schedule: { ...s.schedule, slots: { ...s.schedule.slots, [slotId]: { ...slot, coverRequest } } } }),
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// Generation helpers for the anaesthetist master and the clock
// ---------------------------------------------------------------------------

/**
 * The Slots (and projected Lists) one anaesthetist should gain or lose from
 * `fromISO` to the horizon end, given a start date and an active flag
 * (US-01.1.3, FT-01.1). Pure over the state passed in.
 */
export function anaesthetistCanvasDelta(
  state: Pick<AppState, 'masters' | 'schedule' | 'clock' | 'appSettings'>,
  anaesthetist: { registrationNumber: string; startDateISO: string; active: boolean },
  fromISO: string,
): { add: GeneratedCanvas; removeSlotIds: string[]; listsInRemoved: List[]; toISO: string } {
  const toISO = scheduleHorizon(state).endISO
  const dates = fromISO <= toISO ? enumerateDatesISO(fromISO, toISO) : []
  const want = new Set(anaesthetist.active ? slotDatesFor(anaesthetist.startDateISO, dates) : [])
  const existing = Object.values(state.schedule.slots).filter(
    (s) => s.anaesthetistId === anaesthetist.registrationNumber && s.dateISO >= fromISO,
  )
  const have = new Set(existing.map((s) => s.dateISO))
  const removeSlotIds = existing.filter((s) => !want.has(s.dateISO)).map((s) => s.id)
  const missing = [...want].filter((d) => !have.has(d)).sort()
  const masters = canvasMastersFrom(state, missing)
  const add = generateCanvasForDates(
    {
      ...masters,
      anaesthetists: [{ id: anaesthetist.registrationNumber, startDateISO: anaesthetist.startDateISO, active: anaesthetist.active }],
    },
    missing,
  )
  const removed = new Set(removeSlotIds)
  const listsInRemoved = Object.values(state.schedule.lists).filter((l) => l.slotId !== undefined && removed.has(l.slotId))
  return { add, removeSlotIds, listsInRemoved, toISO }
}

