/**
 * Lifecycle guards (PROGRESS convention 6, amended in catch-up Phase 15b: the
 * state was DRAFT until EP-07 and FT-07.1 renamed it). ACTIVE → SUBMITTED → AUTHORISED is
 * strictly ordered; SUBMITTED strips anaesthetist edit rights; AUTHORISED
 * locks Bookings immutable; there is NO Returned transition anywhere. UI can
 * never bypass a guard — every guard returns an `Outcome` (refusals as data;
 * Phase 11's monitor turns integration refusals into manual-intervention
 * items).
 *
 * The RFP state table, as enforced here:
 *   - anaesthetist: edits own ACTIVE Lists' Bookings only;
 *   - office: edits ACTIVE and SUBMITTED; authorises; nobody edits AUTHORISED;
 *   - integration-sourced writes only while the List is ACTIVE.
 */

import type { Booking, CoverRequest, List, ListPhoneNote, ListStatusKey, Procedure, Session } from '../domain/types'
import { validateBookingForBilling } from '../domain/billing/validateBookingForBilling'
import {
  allocateId,
  clockISO,
  mutate,
  ok,
  refuse,
  type Actor,
  type MutationMeta,
  type Outcome,
} from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { billingContextForBooking, bookingsForList, listForSlot, proceduresForBooking } from './selectors'
import { emitAppEvent } from './events'

// ---------------------------------------------------------------------------
// Shared checks
// ---------------------------------------------------------------------------

export function getBooking(state: AppState, bookingId: string): { booking: Booking; list: List } | undefined {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return undefined
  const list = state.schedule.lists[booking.listId]
  if (list === undefined) return undefined
  return { booking, list }
}

/**
 * The edit-rights matrix for Booking/Procedure writes. Returns a refusal outcome
 * or null when the write may proceed. Exported so the Phase 03 booking-creation
 * and patient-edit guards apply the identical role/source/state gate.
 */
export function editRefusal(actor: Actor, list: List): Outcome<never> | null {
  if (list.state === 'AUTHORISED') {
    return refuse('listAuthorised', 'This List is authorised and its Bookings are locked. No edits are possible.')
  }
  if (actor.source === 'integration') {
    if (list.state !== 'ACTIVE') {
      return refuse(
        'integrationImmutable',
        'An integration update cannot change a submitted List. This message needs manual intervention.',
      )
    }
    return null
  }
  if (actor.role === 'anaesthetist') {
    if (actor.anaesthetistId !== undefined && actor.anaesthetistId !== list.anaesthetistId) {
      return refuse('notOwnList', 'Anaesthetists can only change Bookings on their own Lists.')
    }
    if (list.state !== 'ACTIVE') {
      return refuse('listSubmitted', 'This List has been submitted. Only the office can change it now.')
    }
    return null
  }
  // office / system: ACTIVE and SUBMITTED are editable.
  return null
}

// ---------------------------------------------------------------------------
// completeBooking
// ---------------------------------------------------------------------------

/**
 * An ordered completion blocker. Blockers are billing completeness only: a
 * warning (`domain/warnings`, e.g. an unpaid prepayment) never becomes a
 * blocker (catch-up Phase 15a; D5, US-13.7.1 "Never blocks").
 */
export interface CompletionBlocker {
  code: string
  message: string
  details?: unknown
}

/**
 * Why a Booking cannot be marked complete, without attempting the mutation.
 * `completeBooking` refuses on the first entry; the mobile submit sheet uses the
 * full list to name each incomplete booking's outstanding failures (Phase 04).
 */
export function completionBlockersFor(state: AppState, booking: Booking): CompletionBlocker[] {
  const blockers: CompletionBlocker[] = []

  const ctx = billingContextForBooking(state, booking)
  if (ctx === undefined) {
    blockers.push({ code: 'missingContext', message: 'This Booking is missing its List or anaesthetist.' })
    return blockers
  }
  const failures = validateBookingForBilling(booking, proceduresForBooking(state, booking.id), ctx)
  if (failures.length > 0) {
    blockers.push({
      code: 'validationFailed',
      message: `This Booking is missing required billing data (${failures.length} ${failures.length === 1 ? 'item' : 'items'}).`,
      details: failures,
    })
  }

  return blockers
}

/** Mark a Booking completed — blocked unless `validateBookingForBilling` passes. */
export function completeBooking(api: AppStoreApi, actor: Actor, bookingId: string): Outcome {
  const state = api.getState()
  const found = getBooking(state, bookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  const { booking, list } = found

  if (booking.cancellation !== undefined) {
    return refuse('bookingCancelled', 'This Booking is cancelled and cannot be completed.')
  }
  if (actor.source === 'integration') {
    return refuse('integrationForbidden', 'Integrations never complete Bookings; completion is a clinical sign-off.')
  }
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights
  if (booking.completed) return refuse('alreadyCompleted', 'This Booking is already completed.')

  const blockers = completionBlockersFor(state, booking)
  const first = blockers[0]
  if (first !== undefined) return refuse(first.code, first.message, blockers)

  mutate(
    api,
    actor,
    {
      entityType: 'booking',
      entityId: bookingId,
      action: 'booking.complete',
      before: { completed: false },
      after: { completed: true },
    },
    (s) => ({
      schedule: {
        ...s.schedule,
        bookings: {
          ...s.schedule.bookings,
          [bookingId]: { ...booking, completed: true, completedAtISO: clockISO(s.clock) },
        },
      },
    }),
  )
  return ok(undefined)
}

/**
 * Re-open a completed Booking (Phase 04's "Amend" link). The anaesthetist amends
 * their own Booking while the List is ACTIVE; the office may re-open on ACTIVE or
 * SUBMITTED (the standard edit-rights matrix). Completion is a clinical
 * sign-off, so integrations never take it back either — mirrors completeBooking.
 */
export function uncompleteBooking(api: AppStoreApi, actor: Actor, bookingId: string): Outcome {
  const state = api.getState()
  const found = getBooking(state, bookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  const { booking, list } = found

  if (booking.cancellation !== undefined) {
    return refuse('bookingCancelled', 'This Booking is cancelled; there is no completion to amend.')
  }
  if (!booking.completed) return refuse('notCompleted', 'This Booking is not marked complete.')
  if (actor.source === 'integration') {
    return refuse('integrationForbidden', 'Integrations never re-open Bookings; completion is a clinical sign-off.')
  }
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights

  mutate(
    api,
    actor,
    {
      entityType: 'booking',
      entityId: bookingId,
      action: 'booking.uncomplete',
      before: { completed: true },
      after: { completed: false },
    },
    (s) => {
      const next: Booking = { ...booking, completed: false }
      delete next.completedAtISO
      return {
        schedule: { ...s.schedule, bookings: { ...s.schedule.bookings, [bookingId]: next } },
      }
    },
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// submitList / authoriseList
// ---------------------------------------------------------------------------

/**
 * ACTIVE → SUBMITTED. Completion-gated: every non-cancelled Booking must be
 * marked Completed (validation alone is not enough); a cancelled Booking never
 * blocks.
 */
export function submitList(api: AppStoreApi, actor: Actor, listId: string): Outcome {
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  if (list.state !== 'ACTIVE') {
    return refuse('listNotActive', 'Only an active List can be submitted.')
  }
  if (actor.source === 'integration' || actor.source === 'system') {
    return refuse('submitForbidden', 'Only the anaesthetist or the office can submit a List.')
  }
  if (
    actor.role === 'anaesthetist' &&
    actor.anaesthetistId !== undefined &&
    actor.anaesthetistId !== list.anaesthetistId
  ) {
    return refuse('notOwnList', 'Anaesthetists can only submit their own Lists.')
  }

  const incomplete = bookingsForList(state, listId).filter((c) => c.cancellation === undefined && !c.completed)
  if (incomplete.length > 0) {
    return refuse(
      'bookingsNotCompleted',
      `Every Booking must be completed before submission (${incomplete.length} to finish).`,
      incomplete.map((c) => c.id),
    )
  }

  mutate(
    api,
    actor,
    {
      entityType: 'list',
      entityId: listId,
      action: 'list.submit',
      before: { state: 'ACTIVE' },
      after: { state: 'SUBMITTED' },
    },
    (s) => ({
      schedule: {
        ...s.schedule,
        lists: { ...s.schedule.lists, [listId]: { ...list, state: 'SUBMITTED' } },
      },
    }),
  )
  return ok(undefined)
}

/**
 * SUBMITTED → AUTHORISED (strictly ordered — an ACTIVE List can never jump).
 * Office only. Locks the List's Bookings immutable and emits `listAuthorised`
 * for Phase 08's billing run.
 */
export function authoriseList(api: AppStoreApi, actor: Actor, listId: string): Outcome {
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  if (list.state !== 'SUBMITTED') {
    return refuse('listNotSubmitted', 'Only a submitted List can be authorised.')
  }
  if (actor.role !== 'office') {
    return refuse('officeOnly', 'Only the office can authorise a List for billing.')
  }

  mutate(
    api,
    actor,
    {
      entityType: 'list',
      entityId: listId,
      action: 'list.authorise',
      before: { state: 'SUBMITTED' },
      after: { state: 'AUTHORISED' },
    },
    (s) => ({
      schedule: {
        ...s.schedule,
        lists: { ...s.schedule.lists, [listId]: { ...list, state: 'AUTHORISED' } },
      },
    }),
  )
  emitAppEvent({ type: 'listAuthorised', listId })
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// logListNote (the office's phone-call note on a List)
// ---------------------------------------------------------------------------

/**
 * Append an office-logged phone-call note to a List (Phase 07 review). Records
 * a call the office made about the List (e.g. clarifying a reference with the
 * hospital) — it surfaces on the review action bar AND, via the audit entry, in
 * the List's history. Office-initiated; allowed in any List state since it is
 * an annotation, not a Booking edit. There is NO return-to-anaesthetist action
 * anywhere: a SUBMITTED List flows only forward to AUTHORISED (convention 6, no
 * Returned state).
 */
export function logListNote(api: AppStoreApi, actor: Actor, listId: string, text: string): Outcome {
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  if (actor.role !== 'office') {
    return refuse('officeOnly', 'Only the office logs a phone note on a List.')
  }
  const trimmed = text.trim()
  if (trimmed === '') return refuse('textRequired', 'A phone note needs some text.')

  const note: ListPhoneNote = { text: trimmed, by: actor.who, atISO: clockISO(state.clock) }
  mutate(
    api,
    actor,
    {
      entityType: 'list',
      entityId: listId,
      action: 'list.phoneNote',
      after: { text: trimmed },
      stampBookingId: null,
    },
    (s) => ({
      schedule: {
        ...s.schedule,
        lists: { ...s.schedule.lists, [listId]: { ...list, phoneNotes: [...(list.phoneNotes ?? []), note] } },
      },
    }),
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// cancelBooking
// ---------------------------------------------------------------------------

/**
 * Audited soft-cancel (7th review B23) — the legacy "Delete Booking",
 * modernised. The Booking is retained and visible, excluded from validation and
 * billing; never a hard delete. Phase 11's S15 message calls this same guard
 * with source=integration (ACTIVE Lists only).
 */
export function cancelBooking(api: AppStoreApi, actor: Actor, bookingId: string, reason: string): Outcome {
  const state = api.getState()
  const found = getBooking(state, bookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  const { booking, list } = found

  if (reason.trim() === '') {
    return refuse('reasonRequired', 'A cancellation reason is required.')
  }
  if (booking.cancellation !== undefined) {
    return refuse('alreadyCancelled', 'This Booking is already cancelled.')
  }
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights

  mutate(
    api,
    actor,
    {
      entityType: 'booking',
      entityId: bookingId,
      action: 'booking.cancel',
      after: { cancelled: true, reason: reason.trim() },
    },
    (s) => ({
      schedule: {
        ...s.schedule,
        bookings: {
          ...s.schedule.bookings,
          [bookingId]: {
            ...booking,
            cancellation: {
              reason: reason.trim(),
              by: actor.who,
              role: actor.role,
              source: actor.source,
              atISO: clockISO(s.clock),
            },
          },
        },
      },
    }),
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// editBooking / editProcedure (the guarded patch entry points)
// ---------------------------------------------------------------------------

/** Attachments are not patchable: `addAttachment` / `removeAttachment` own them (catch-up Phase 15). */
const BOOKING_PATCH_KEYS = ['scheduledTime', 'notes'] as const
export type BookingPatch = Partial<Pick<Booking, (typeof BOOKING_PATCH_KEYS)[number]>>

export function editBooking(api: AppStoreApi, actor: Actor, bookingId: string, rawPatch: BookingPatch): Outcome {
  // Only the patchable keys pass, even from an untyped caller: attachments go
  // through `addAttachment` / `removeAttachment`.
  const patch: BookingPatch = Object.fromEntries(
    BOOKING_PATCH_KEYS.filter((k) => k in rawPatch).map((k) => [k, rawPatch[k]]),
  )
  if (Object.keys(patch).length === 0) return ok(undefined)
  const state = api.getState()
  const found = getBooking(state, bookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  const { booking, list } = found
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights

  mutate(
    api,
    actor,
    {
      entityType: 'booking',
      entityId: bookingId,
      action: 'booking.update',
      before: Object.fromEntries(Object.keys(patch).map((k) => [k, booking[k as keyof Booking]])),
      after: patch,
    },
    (s) => ({
      schedule: {
        ...s.schedule,
        bookings: { ...s.schedule.bookings, [bookingId]: { ...booking, ...patch } },
      },
    }),
  )
  return ok(undefined)
}

export type ProcedurePatch = Partial<Omit<Procedure, 'id' | 'bookingId'>>

export function editProcedure(
  api: AppStoreApi,
  actor: Actor,
  procedureId: string,
  patch: ProcedurePatch,
): Outcome {
  const state = api.getState()
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined) return refuse('notFound', 'Procedure not found.')
  const found = getBooking(state, procedure.bookingId)
  if (found === undefined) return refuse('notFound', 'The procedure has no Booking.')
  const rights = editRefusal(actor, found.list)
  if (rights !== null) return rights

  mutate(
    api,
    actor,
    {
      entityType: 'procedure',
      entityId: procedureId,
      action: 'procedure.update',
      before: Object.fromEntries(Object.keys(patch).map((k) => [k, procedure[k as keyof Procedure]])),
      after: patch,
    },
    (s) => ({
      schedule: {
        ...s.schedule,
        procedures: { ...s.schedule.procedures, [procedureId]: { ...procedure, ...patch } },
      },
    }),
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// editList (office/anaesthetist field edits — NOT status or anaesthetist)
// ---------------------------------------------------------------------------

/**
 * Editable List fields. Status and anaesthetist are deliberately absent — those
 * change only through availability reconciliation and reassignment. The office
 * assigns/corrects hospital, surgeon and the session's start/end times (5th
 * review #6: List times "have a default value, but that may be overridden");
 * a `notes` edit is the office's day annotation on the row.
 */
export type ListPatch = Partial<Pick<List, 'hospitalId' | 'surgeonId' | 'startTime' | 'endTime' | 'notes'>>

/**
 * Patch a List's hospital/surgeon/times/notes through the standard edit-rights
 * matrix (office edits ACTIVE and SUBMITTED; the anaesthetist only their own
 * ACTIVE; AUTHORISED blocked). An empty string (or explicit undefined) on a key
 * present in the patch clears that field. Audited `list.update`, stamps no Booking.
 */
export function editList(api: AppStoreApi, actor: Actor, listId: string, patch: ListPatch): Outcome {
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights

  mutate(
    api,
    actor,
    {
      entityType: 'list',
      entityId: listId,
      action: 'list.update',
      before: Object.fromEntries(Object.keys(patch).map((k) => [k, list[k as keyof List]])),
      after: patch,
      stampBookingId: null,
    },
    (s) => {
      const next: List = { ...list }
      const setOrDelete = <K extends 'hospitalId' | 'surgeonId' | 'startTime' | 'endTime' | 'notes'>(
        key: K,
        value: List[K] | undefined,
      ) => {
        if (value === undefined || value === '') delete next[key]
        else next[key] = value
      }
      if ('hospitalId' in patch) setOrDelete('hospitalId', patch.hospitalId)
      if ('surgeonId' in patch) setOrDelete('surgeonId', patch.surgeonId)
      if ('startTime' in patch) setOrDelete('startTime', patch.startTime)
      if ('endTime' in patch) setOrDelete('endTime', patch.endTime)
      if ('notes' in patch) setOrDelete('notes', patch.notes)
      return { schedule: { ...s.schedule, lists: { ...s.schedule.lists, [listId]: next } } }
    },
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// reassignList / reassignBooking
// ---------------------------------------------------------------------------

/** Vacated-slot statuses that carry no booking context. */
const VACATED_STATUSES: readonly ListStatusKey[] = ['unavailable', 'free', 'holiday'] as const

/**
 * Move a whole List to another anaesthetist (the illness-cover case). The
 * fixed canvas must survive: the target session must be Free, its empty List
 * is absorbed, and the vacated slot regenerates (office-chosen status,
 * default Unavailable). This slot mechanic is the prototype's PROPOSED answer
 * to the RFP's open reassignment-mechanism question (4th review #6).
 */
export function reassignList(
  api: AppStoreApi,
  actor: Actor,
  listId: string,
  toAnaesthetistId: string,
  vacatedStatus: ListStatusKey = 'unavailable',
): Outcome<{ movedListId: string; regeneratedListId: string }> {
  const state = api.getState()
  const source = state.schedule.lists[listId]
  if (source === undefined) return refuse('notFound', 'List not found.')
  if (actor.role !== 'office') {
    return refuse('officeOnly', 'Only the office can reassign a List.')
  }
  if (source.state === 'AUTHORISED') {
    return refuse('listAuthorised', 'An authorised List is locked and cannot be reassigned.')
  }
  if (toAnaesthetistId === source.anaesthetistId) {
    return refuse('sameAnaesthetist', 'The List already belongs to that anaesthetist.')
  }
  if (state.masters.anaesthetists[toAnaesthetistId] === undefined) {
    return refuse('notFound', 'Target anaesthetist not found.')
  }
  if (!VACATED_STATUSES.includes(vacatedStatus)) {
    return refuse('invalidVacatedStatus', 'The vacated slot can only become free, unavailable or holiday.')
  }

  const target = listForSlot(state, toAnaesthetistId, source.dateISO, source.session)
  if (target === undefined) return refuse('noTargetSlot', 'The target slot does not exist on the canvas.')
  const targetBookings = bookingsForList(state, target.id)
  // A target carrying List attachments is not genuinely Free: absorbing it would
  // delete them unaudited (catch-up Phase 15).
  if (target.statusKey !== 'free' || target.state !== 'ACTIVE' || targetBookings.length > 0 || (target.attachments ?? []).length > 0) {
    return refuse('targetNotFree', 'The target session must be Free to receive a reassigned List.')
  }

  // Availability conflicts describe the anaesthetist-slot pairing, not the
  // booking itself. The target is proven genuinely Free above, so a conflict
  // belonging to the previous anaesthetist must not travel with the List.
  // Hospital-holiday conflicts still apply because the date and hospital move
  // intact with the booking.
  const retainedConflicts = source.conflicts.filter((conflict) => conflict.kind !== 'availability')

  const metas: MutationMeta[] = [
    {
      entityType: 'list',
      entityId: source.id,
      action: 'list.reassign',
      before: { anaesthetistId: source.anaesthetistId, conflicts: source.conflicts },
      after: { anaesthetistId: toAnaesthetistId, conflicts: retainedConflicts },
    },
    {
      entityType: 'list',
      entityId: target.id,
      action: 'list.absorb',
      before: { statusKey: target.statusKey },
    },
  ]

  let regeneratedListId = ''
  mutate(api, actor, metas, (s) => {
    const { id, counters } = allocateId(s.counters, 'list')
    regeneratedListId = id
    metas.push({
      entityType: 'list',
      entityId: id,
      action: 'list.regenerate',
      after: { statusKey: vacatedStatus },
    })
    const lists = { ...s.schedule.lists }
    delete lists[target.id]
    lists[source.id] = { ...source, anaesthetistId: toAnaesthetistId, conflicts: retainedConflicts }
    lists[id] = {
      id,
      dateISO: source.dateISO,
      anaesthetistId: source.anaesthetistId,
      session: source.session,
      state: 'ACTIVE',
      statusKey: vacatedStatus,
      conflicts: [],
    }
    return { schedule: { ...s.schedule, lists }, counters }
  })
  return ok({ movedListId: source.id, regeneratedListId })
}

/**
 * Move one Booking (with its Procedures) to a different List — the RFP's routine
 * single-booking move, audited at Booking level. Neither List's status or other
 * Bookings change. Blocked when either List is AUTHORISED; a SUBMITTED target is
 * allowed for the office (the all-Bookings-completed rule gates the
 * ACTIVE→SUBMITTED transition, not later office rebooking).
 */
export function reassignBooking(api: AppStoreApi, actor: Actor, bookingId: string, toListId: string): Outcome {
  const state = api.getState()
  const found = getBooking(state, bookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  const { booking, list: source } = found
  const target = state.schedule.lists[toListId]
  if (target === undefined) return refuse('notFound', 'Target List not found.')
  if (target.id === source.id) return refuse('sameList', 'The Booking is already on that List.')

  if (source.state === 'AUTHORISED' || target.state === 'AUTHORISED') {
    return refuse('listAuthorised', 'Bookings on an authorised List are locked; an authorised List cannot receive Bookings.')
  }
  if (actor.source === 'integration') {
    if (source.state !== 'ACTIVE' || target.state !== 'ACTIVE') {
      return refuse(
        'integrationImmutable',
        'An integration update can only move a Booking between active Lists. This message needs manual intervention.',
      )
    }
  } else if (actor.role === 'anaesthetist') {
    if (
      actor.anaesthetistId !== undefined &&
      (actor.anaesthetistId !== source.anaesthetistId || actor.anaesthetistId !== target.anaesthetistId)
    ) {
      return refuse('notOwnList', 'Anaesthetists can only move Bookings between their own Lists.')
    }
    if (source.state !== 'ACTIVE' || target.state !== 'ACTIVE') {
      return refuse('listSubmitted', 'This List has been submitted. Only the office can change it now.')
    }
  }

  mutate(
    api,
    actor,
    {
      entityType: 'booking',
      entityId: bookingId,
      action: 'booking.reassign',
      before: { listId: source.id },
      after: { listId: target.id },
    },
    (s) => ({
      schedule: {
        ...s.schedule,
        bookings: { ...s.schedule.bookings, [bookingId]: { ...booking, listId: target.id } },
      },
    }),
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// setAvailability
// ---------------------------------------------------------------------------

/**
 * Write the AnaesthetistAvailability MASTER row, then reconcile that slot's
 * List (1st review #2; 7th review A9): only a truly-Free List (Free status,
 * no hospital, no surgeon, no active Bookings) restatuses; anything carrying
 * booking context gets a conflict flag for the office — never a silent
 * change. The un-block direction is symmetric (a picked reading): 'available'
 * restatuses only an empty holiday/unavailable List back to Free.
 */
export function setAvailability(
  api: AppStoreApi,
  actor: Actor,
  anaesthetistId: string,
  dateISO: string,
  session: Session,
  kind: 'available' | 'unavailable' | 'holiday',
  note?: string,
): Outcome<{ reconciled: 'restatused' | 'conflictFlagged' | 'noChange' }> {
  const state = api.getState()
  if (state.masters.anaesthetists[anaesthetistId] === undefined) {
    return refuse('notFound', 'Anaesthetist not found.')
  }
  if (actor.source === 'integration') {
    return refuse('integrationForbidden', 'Availability comes from the anaesthetist or the office, never a feed.')
  }
  if (
    actor.role === 'anaesthetist' &&
    actor.anaesthetistId !== undefined &&
    actor.anaesthetistId !== anaesthetistId
  ) {
    return refuse('notOwnAvailability', 'Anaesthetists can only set their own availability.')
  }

  const existing = Object.values(state.masters.availability).find(
    (a) => a.anaesthetistId === anaesthetistId && a.dateISO === dateISO && a.session === session,
  )
  const list = listForSlot(state, anaesthetistId, dateISO, session)

  // Decide the reconciliation before committing.
  let reconciled: 'restatused' | 'conflictFlagged' | 'noChange' = 'noChange'
  if (list !== undefined) {
    const activeBookings = bookingsForList(state, list.id).filter((c) => c.cancellation === undefined)
    const unreserved =
      list.hospitalId === undefined &&
      list.surgeonId === undefined &&
      activeBookings.length === 0 &&
      // A List's own attachments are booking context too (catch-up Phase 15).
      (list.attachments ?? []).length === 0
    if (kind === 'holiday' || kind === 'unavailable') {
      if (list.statusKey === 'free' && unreserved && list.state === 'ACTIVE') reconciled = 'restatused'
      else reconciled = 'conflictFlagged'
    } else {
      if ((list.statusKey === 'holiday' || list.statusKey === 'unavailable') && unreserved && list.state === 'ACTIVE') {
        reconciled = 'restatused'
      } else if (list.statusKey === 'free') {
        reconciled = 'noChange'
      } else {
        reconciled = 'conflictFlagged'
      }
    }
  }

  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    let counters = s.counters
    let rowId = existing?.id
    if (rowId === undefined) {
      const allocated = allocateId(counters, 'availability')
      rowId = allocated.id
      counters = allocated.counters
    }
    const row = {
      id: rowId,
      anaesthetistId,
      dateISO,
      session,
      kind,
      ...(note !== undefined ? { note } : {}),
    }
    metas.push({
      entityType: 'availability',
      entityId: rowId,
      action: existing === undefined ? 'availability.set' : 'availability.update',
      ...(existing !== undefined ? { before: { kind: existing.kind } } : {}),
      after: { kind, dateISO, session },
    })

    let lists = s.schedule.lists
    if (list !== undefined && reconciled === 'restatused') {
      const next = { ...list }
      if (kind === 'available') {
        next.statusKey = 'free'
        delete next.notes
        // Un-blocking resolves any prior availability conflict on this slot.
        next.conflicts = next.conflicts.filter((c) => c.kind !== 'availability')
      } else {
        next.statusKey = kind
        if (note !== undefined) next.notes = note
        else delete next.notes
      }
      delete next.startTime
      delete next.endTime
      lists = { ...lists, [list.id]: next }
      metas.push({
        entityType: 'list',
        entityId: list.id,
        action: 'list.restatus',
        before: { statusKey: list.statusKey },
        after: { statusKey: next.statusKey },
      })
    } else if (list !== undefined && reconciled === 'conflictFlagged') {
      const message =
        kind === 'available'
          ? 'Marked available, but this List carries booking context. Review and clear it manually.'
          : `Marked ${kind}, but this List carries booking context. Review and rebook or clear it.`
      // Replace, never stack: repeated toggles must leave at most one
      // availability conflict, and the latest message wins.
      lists = {
        ...lists,
        [list.id]: {
          ...list,
          conflicts: [...list.conflicts.filter((c) => c.kind !== 'availability'), { kind: 'availability', message }],
        },
      }
      metas.push({
        entityType: 'list',
        entityId: list.id,
        action: 'list.conflict',
        after: { kind: 'availability', message },
      })
    }

    return {
      masters: { ...s.masters, availability: { ...s.masters.availability, [rowId]: row } },
      schedule: { ...s.schedule, lists },
      counters,
    }
  })

  return ok({ reconciled })
}

// ---------------------------------------------------------------------------
// requestCover
// ---------------------------------------------------------------------------

/**
 * Record a cover offer/request marker on a Free List (Phase 03 mobile flow;
 * Decisions log 2026-07-21). `offer` = the owner offers their own free session;
 * `request` = a colleague is asked to cover someone else's free session.
 * Simulated only: the marker + audit entry are the demonstration, there is no
 * real notification. Anaesthetist actor; the free-session and ownership checks
 * mirror `editRefusal`'s shape.
 */
export function requestCover(
  api: AppStoreApi,
  actor: Actor,
  listId: string,
  kind: 'offer' | 'request',
  message?: string,
  targetAnaesthetistId?: string,
): Outcome {
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  if (actor.role !== 'anaesthetist') {
    return refuse('anaesthetistOnly', 'Cover offers and requests come from an anaesthetist.')
  }
  if (list.statusKey !== 'free') {
    return refuse('notFree', 'Cover can only be offered or requested on a free session.')
  }
  if (kind === 'offer') {
    if (actor.anaesthetistId !== undefined && actor.anaesthetistId !== list.anaesthetistId) {
      return refuse('notOwnList', 'You can only offer cover on your own free session.')
    }
  } else if (actor.anaesthetistId !== undefined && actor.anaesthetistId === list.anaesthetistId) {
    return refuse('ownList', 'This is your own session, use Offer cover instead.')
  }
  if (list.coverRequest !== undefined) {
    return refuse('alreadyRequested', 'A cover request is already pending on this session.')
  }

  const coverRequest: CoverRequest = {
    by: actor.who,
    kind,
    atISO: clockISO(state.clock),
    status: 'pending',
  }
  if (message !== undefined && message.trim() !== '') coverRequest.message = message.trim()
  if (targetAnaesthetistId !== undefined) coverRequest.targetAnaesthetistId = targetAnaesthetistId

  mutate(
    api,
    actor,
    {
      entityType: 'list',
      entityId: listId,
      action: 'list.coverRequest',
      after: { kind, ...(targetAnaesthetistId !== undefined ? { targetAnaesthetistId } : {}) },
    },
    (s) => ({
      schedule: { ...s.schedule, lists: { ...s.schedule.lists, [listId]: { ...list, coverRequest } } },
    }),
  )
  return ok(undefined)
}
