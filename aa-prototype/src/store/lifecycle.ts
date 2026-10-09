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

import type { Booking, List, ListPhoneNote, Procedure } from '../domain/types'
import { validateBookingForBilling } from '../domain/billing/validateBookingForBilling'
import { pairingAcknowledgement } from '../domain/pairingPreferences'
import {
  clockISO,
  mutate,
  ok,
  refuse,
  type Actor,
  type MutationMeta,
  type Outcome,
} from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { billingContextForBooking, bookingsForList, proceduresForBooking } from './selectors'
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
 * Editable List fields. Kind, Slot and anaesthetist are deliberately absent:
 * a List's Slot changes only by a move (`reassignList`). The session's times
 * belong to the Slot since Phase 28 (`setSlotTimes`). The office assigns or
 * corrects hospital and surgeon; a `notes` edit is the office's annotation.
 * Clearing a hospital or surgeon is left open until Phase 31's pairing rule.
 */
export type ListPatch = Partial<Pick<List, 'hospitalId' | 'surgeonId' | 'notes'>>

/**
 * Patch a List's hospital/surgeon/notes through the standard edit-rights
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

  const metas: MutationMeta[] = [
    {
      entityType: 'list',
      entityId: listId,
      action: 'list.update',
      before: Object.fromEntries(Object.keys(patch).map((k) => [k, list[k as keyof List]])),
      after: patch,
      stampBookingId: null,
    },
  ]
  // Catch-up Phase 17 (US-01.3.5): an office surgeon change onto a
  // not-preferred pairing is never refused; going ahead records the
  // acknowledgement in the same commit. Only the office: an anaesthetist's
  // own edit never reads, checks or logs preferences (US-01.4.5, OQ-43).
  const surgeonChanged = 'surgeonId' in patch && (patch.surgeonId ?? '') !== '' && patch.surgeonId !== list.surgeonId
  if (actor.role === 'office' && surgeonChanged) {
    const ack = pairingAcknowledgement(state.officePrivate.pairingPreferences, list.anaesthetistId, patch.surgeonId)
    if (ack !== null) {
      metas.push({ entityType: 'list', entityId: listId, action: 'list.pairingAcknowledged', after: ack, stampBookingId: null })
    }
  }

  mutate(
    api,
    actor,
    metas,
    (s) => {
      const next: List = { ...list }
      const setOrDelete = <K extends 'hospitalId' | 'surgeonId' | 'notes'>(
        key: K,
        value: List[K] | undefined,
      ) => {
        if (value === undefined || value === '') delete next[key]
        else next[key] = value
      }
      if ('hospitalId' in patch) setOrDelete('hospitalId', patch.hospitalId)
      if ('surgeonId' in patch) setOrDelete('surgeonId', patch.surgeonId)
      if ('notes' in patch) setOrDelete('notes', patch.notes)
      return { schedule: { ...s.schedule, lists: { ...s.schedule.lists, [listId]: next } } }
    },
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// reassignBooking (a List's own move is `reassignList` in slotActions.ts)
// ---------------------------------------------------------------------------

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

