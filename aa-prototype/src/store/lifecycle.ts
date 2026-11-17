/**
 * Lifecycle guards (PROGRESS convention 6, amended in catch-up Phase 15b: the
 * state was DRAFT until EP-07 and FT-07.1 renamed it; its "SUBMITTED strips
 * anaesthetist edit rights" superseded in catch-up Phase 38a, RV-19, D63).
 * ACTIVE → SUBMITTED → AUTHORISED is strictly ordered; AUTHORISED locks
 * Bookings immutable; there is NO Returned transition anywhere. UI can never
 * bypass a guard — every guard returns an `Outcome` (refusals as data;
 * Phase 11's monitor turns integration refusals into manual-intervention
 * items).
 *
 * The edit window (US-07.2.1, US-07.2.3, FT-07.2):
 *   - anaesthetist: edits their own ACTIVE and SUBMITTED Lists' Bookings until
 *     the office authorises the List. Submitting only tells the office it has
 *     work to do;
 *   - office: edits ACTIVE and SUBMITTED directly (no "returned" state);
 *     authorises; nobody edits AUTHORISED;
 *   - the last change stands: no lock, neither side outranks the other, every
 *     change audited (Admin Review shows "Changed since submitted");
 *   - integration-sourced writes only while the List is ACTIVE.
 */

import type { Booking, List, ListPhoneNote, Procedure } from '../domain/types'
import { completionFailuresFor, type CompletionFailure } from '../domain/billing/completion'
import { pairingAcknowledgement } from '../domain/pairingPreferences'
import { pairingIssues } from '../domain/listPairing'
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
import { bookingsForList, completionContextFor, proceduresForBooking } from './selectors'
import { emitAppEvent } from './events'
import { BASE_UNITS_WHOLE_MESSAGE, isRecordableBaseUnits, rvgGroupPickRefusal } from '../domain/billing/rvgGroups'
import { claimsAuditView } from '../domain/billing/modifiers'
import { reconciledForGroup } from './modifierFacts'
import { approvalsAtAuthorise } from './contractApprovalActions'

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
  // A removed Draft List is History only (US-01.6.4).
  if (list.removedAtISO !== undefined) return refuse('listRemoved', 'This Draft List was removed.')
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
    // A Draft List is the office's (FT-01.6; OQ-86 answered no): no anaesthetist adds or edits a Booking on one.
    if (list.state === 'DRAFT') return refuse('notOwnList', 'Anaesthetists can only change Bookings on their own Lists.')
    if (actor.anaesthetistId !== undefined && actor.anaesthetistId !== list.anaesthetistId) {
      return refuse('notOwnList', 'Anaesthetists can only change Bookings on their own Lists.')
    }
    // ACTIVE and SUBMITTED are both theirs to change until AUTHORISED (RV-19, D63).
    return null
  }
  // office / system: DRAFT, ACTIVE and SUBMITTED are editable.
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
 * Reads only the completion rule (`completionFailuresFor`, catch-up Phase 21a:
 * a Contract, the RVG detail on RVG kinds, a price), never the billing
 * validator. `completeBooking` refuses on the first entry; the submit sheet,
 * the incomplete list and the Booking detail read the same failures.
 */
export function completionBlockersFor(state: AppState, booking: Booking): CompletionBlocker[] {
  const ctx = completionContextFor(state, booking.id)
  if (ctx === undefined) {
    return [{ code: 'missingContext', message: 'This Booking is missing its List or anaesthetist.' }]
  }
  const failures: CompletionFailure[] = completionFailuresFor(booking, proceduresForBooking(state, booking.id), ctx)
  if (failures.length === 0) return []
  const blockers: CompletionBlocker[] = []
  // A Procedure with no Contract refuses in its own words first (US-04.3.4, US-04.3.8).
  const noContract = failures.find((f) => f.code === 'noContract')
  if (noContract !== undefined) blockers.push({ code: 'needsInvoiceDestination', message: noContract.message })
  blockers.push({
    code: 'validationFailed',
    message: `This Booking is missing required billing data (${failures.length} ${failures.length === 1 ? 'item' : 'items'}).`,
    details: failures,
  })
  return blockers
}

/** Mark a Booking completed: blocked unless `completionFailuresFor` passes (catch-up Phase 21a). */
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
  // Only an ACTIVE List is completed (EP-07): a Booking on a Draft List waits for its anaesthetist.
  if (list.state === 'DRAFT') return refuse('listNotActive', ASSIGN_FIRST)
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
 * their own Booking while the List is ACTIVE or SUBMITTED, and so may the office
 * (the standard edit-rights matrix; catch-up Phase 38a). A Booking re-opened on a
 * SUBMITTED List blocks authorise until it is completed again (`authoriseList`). Completion is a clinical
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

/** The refusal for submitting or authorising a Draft List (catch-up Phase 31). */
const ASSIGN_FIRST = 'Assign an anaesthetist first.'

/**
 * The List's non-cancelled Bookings not marked complete: what blocks submit and,
 * since catch-up Phase 38a, authorise (a Booking re-opened or added on a
 * SUBMITTED List must be completed again before the office can authorise it).
 */
export function incompleteBookingsOn(state: Pick<AppState, 'schedule'>, listId: string): Booking[] {
  return bookingsForList(state, listId).filter((c) => c.cancellation === undefined && !c.completed)
}

/**
 * ACTIVE → SUBMITTED. Completion-gated: every non-cancelled Booking must be
 * marked Completed (validation alone is not enough); a cancelled Booking never
 * blocks.
 */
export function submitList(api: AppStoreApi, actor: Actor, listId: string): Outcome {
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  // A Draft List (no anaesthetist yet) is never submitted, authorised or billed (EP-07).
  if (list.state === 'DRAFT') return refuse('listNotActive', ASSIGN_FIRST)
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

  const incomplete = incompleteBookingsOn(state, listId)
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
 * Office only. Completion-gated like `submitList` (catch-up Phase 38a): the
 * anaesthetist can re-open or add a Booking on a SUBMITTED List, so authorise is
 * refused while any non-cancelled Booking is incomplete, naming them. The List
 * stays SUBMITTED (no return state): the office completes the Booking itself or
 * rings the anaesthetist. Locks the List's Bookings immutable and emits
 * `listAuthorised` for Phase 08's billing run.
 */
export function authoriseList(api: AppStoreApi, actor: Actor, listId: string): Outcome {
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  if (list.state === 'DRAFT') return refuse('listNotActive', ASSIGN_FIRST)
  if (list.state !== 'SUBMITTED') {
    return refuse('listNotSubmitted', 'Only a submitted List can be authorised.')
  }
  if (actor.role !== 'office') {
    return refuse('officeOnly', 'Only the office can authorise a List for billing.')
  }
  const incomplete = incompleteBookingsOn(state, listId)
  if (incomplete.length > 0) {
    return refuse(
      'bookingsNotCompleted',
      `Every Booking must be completed before the List is authorised (${incomplete.length} to finish).`,
      incomplete.map((c) => c.id),
    )
  }

  const blockers = authoriseBlockersFor(state, listId)
  if (blockers.length > 0) return refuse(blockers[0]!.code, blockers[0]!.message)

  // Every anaesthetist's Contract change still unapproved is approved at
  // authorise, in the same commit (catch-up Phase 21a, US-07.2.2): never a gate.
  const approvals = approvalsAtAuthorise(state, actor, listId)
  mutate(
    api,
    actor,
    [
      {
        entityType: 'list',
        entityId: listId,
        action: 'list.authorise',
        before: { state: 'SUBMITTED' },
        after: { state: 'AUTHORISED' },
      },
      ...approvals.metas,
    ],
    (s) => ({
      schedule: {
        ...s.schedule,
        lists: { ...s.schedule.lists, [listId]: { ...list, state: 'AUTHORISED' } },
        procedures: { ...s.schedule.procedures, ...approvals.procedures },
      },
    }),
  )
  emitAppEvent({ type: 'listAuthorised', listId })
  return ok(undefined)
}

/** A reason a SUBMITTED List may not be authorised yet (catch-up Phase 21a's seam). */
export interface AuthoriseBlocker {
  code: string
  message: string
  bookingId?: string
}

/**
 * The one place authorise blockers live (catch-up Phase 21a), shared by
 * `authoriseList`, Review's action bar and the PWA's office stand-ins. It
 * returns **none in this phase**: review flags never block (Phase 07's ruling,
 * AR-58 A49). Phase 25 adds its "Needs a price" kind and Phase 40 the missing
 * NHI. Incomplete Bookings stay `authoriseList`'s own completion gate (38a).
 */
export function authoriseBlockersFor(_state: Pick<AppState, 'schedule'>, _listId: string): AuthoriseBlocker[] {
  return []
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
 * anywhere: a SUBMITTED List flows only forward to AUTHORISED (no Returned
 * state). The office corrects directly, and the anaesthetist can too until
 * AUTHORISED; the last change stands (catch-up Phase 38a, US-07.2.3).
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

/** The Booking fields `editBooking` may change. */
const BOOKING_PATCH_KEYS = ['scheduledTime', 'notes'] as const
export type BookingPatch = Partial<Pick<Booking, (typeof BOOKING_PATCH_KEYS)[number]>>

export function editBooking(api: AppStoreApi, actor: Actor, bookingId: string, rawPatch: BookingPatch): Outcome {
  // Only the patchable keys pass, even from an untyped caller.
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

/** The fields only the step rail writes (catch-up Phase 20). */
const CONTRACT_FIELDS = ['governingContractId', 'railAnswers'] as const

/** The typed price changes only through `setProcedurePrice` and its gates (catch-up Phase 24), or with a Contract on the rail. */
const PRICE_FIELDS = ['enteredPrice'] as const

/**
 * The procedure text and the invoice description (catch-up Phase 20a): the
 * text changes only through `replaceProcedureText`, the invoice description
 * only through its own actions, so no edit path touches either.
 */
const TEXT_FIELDS = ['procedureText', 'invoiceDescription'] as const

/**
 * What `editProcedure` may change: never the Contract or what rides with it
 * (the step rail's, catch-up Phase 20), nor the two texts (20a), nor which
 * Procedure is primary (`setPrimaryProcedure`, catch-up Phase 23).
 */
export type ProcedurePatch = Partial<
  Omit<Procedure, 'id' | 'bookingId' | 'isPrimary' | (typeof CONTRACT_FIELDS)[number] | (typeof PRICE_FIELDS)[number] | (typeof TEXT_FIELDS)[number]>
>

/** The primary changes only through Make primary (catch-up Phase 23). */
export const USE_PRIMARY_ACTION_MESSAGE = 'Use Make primary to change the primary procedure.'
/** Base units are recorded on the primary only (US-05.3.1, enforced, not a hint). */
export const ADDITIONAL_PROCEDURE_BASE_MESSAGE = 'Base units are charged on the primary procedure only.'
/** The Booking's modifiers are recorded once, on the primary (catch-up Phase 23). */
export const MODIFIERS_ON_PRIMARY_MESSAGE = 'Modifiers are recorded once for the Booking, on the primary procedure.'

export const PROCEDURE_TEXT_NOT_EDITABLE_MESSAGE =
  'The procedure text is kept as received, and the invoice description is changed by the office on its own.'

export const MODIFIERS_THROUGH_ACTIONS_MESSAGE =
  'Modifiers are claimed, removed and put back one at a time, each claim with its explanation.'


export const CONTRACT_THROUGH_RAIL_MESSAGE = 'Choose the Contract on the step rail.'
/** `editProcedure` never writes the typed price (catch-up Phase 24). */
export const PRICE_THROUGH_SET_PRICE_MESSAGE = 'Change the price with Change price, so who may change it is checked.'

/**
 * The RVG row-change rule a patch carries (catch-up Phases 19 and 19b), shared
 * by `editProcedure` and the step rail's `setProcedureContract`: a new code
 * must be a row that can be picked; a new row starts from its own starting
 * value (a chosen or typed base from the old row is cleared unless the patch
 * sets one); and the included modifiers are re-derived in the same commit
 * (`reconcileClaims`).
 */
export function withRvgRowChange<P extends Partial<Procedure>>(
  state: AppState,
  procedure: Procedure,
  patch: P,
): Outcome<{ patch: P; reconciled: ReturnType<typeof reconciledForGroup> | null }> {
  if ('rvgGroupId' in patch) {
    const pick = rvgGroupPickRefusal(state.masters.rvgGroups, patch.rvgGroupId, procedure.rvgGroupId)
    if (pick !== null) return refuse(pick.code, pick.message)
    if (patch.rvgGroupId !== procedure.rvgGroupId) {
      patch = {
        ...('baseUnitsSelected' in patch ? {} : { baseUnitsSelected: undefined }),
        ...('baseUnitsCaptured' in patch ? {} : { baseUnitsCaptured: undefined }),
        ...patch,
      }
    }
  }
  const reconciled =
    'rvgGroupId' in patch && patch.rvgGroupId !== procedure.rvgGroupId
      ? reconciledForGroup(state, procedure, patch.rvgGroupId)
      : null
  return ok({ patch, reconciled })
}

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
  // Modifier claims and removals change only through the modifier actions
  // (catch-up Phase 19b), so no claim is ever saved without its explanation.
  if ('modifierClaims' in patch || 'removedModifierIds' in patch) {
    return refuse('modifiersThroughActions', MODIFIERS_THROUGH_ACTIONS_MESSAGE)
  }
  // Which Procedure is primary changes only through Make primary (a defensive guard for untyped callers).
  if ('isPrimary' in (patch as Partial<Procedure>)) return refuse('usePrimaryAction', USE_PRIMARY_ACTION_MESSAGE)
  // Structural, not cosmetic (US-05.3.1, catch-up Phase 23): an additional Procedure takes no base
  // value and no manual M. Only a value is refused; clearing a key is allowed.
  if (!procedure.isPrimary) {
    if (patch.baseUnitsSelected !== undefined || patch.baseUnitsCaptured !== undefined) {
      return refuse('additionalProcedureBase', ADDITIONAL_PROCEDURE_BASE_MESSAGE)
    }
    if (patch.modifierUnitsCaptured !== undefined) return refuse('modifiersOnPrimary', MODIFIERS_ON_PRIMARY_MESSAGE)
  }
  // Any whole base-unit value of 0 or more is accepted (D3, catch-up Phase 19):
  // no range check here; an out-of-range value only warns the office.
  if ('baseUnitsSelected' in patch && patch.baseUnitsSelected !== undefined && !isRecordableBaseUnits(patch.baseUnitsSelected)) {
    return refuse('baseUnitsInvalid', BASE_UNITS_WHOLE_MESSAGE)
  }
  if (patch.baseUnitsCaptured?.source === 'overridden' && !isRecordableBaseUnits(patch.baseUnitsCaptured.units)) {
    return refuse('baseUnitsInvalid', BASE_UNITS_WHOLE_MESSAGE)
  }
  // The Contract and what rides with it change only on the step rail
  // (`setProcedureContract`, catch-up Phase 20), so no edit bypasses its guard.
  if (CONTRACT_FIELDS.some((k) => k in (patch as Partial<Procedure>))) return refuse('contractThroughRail', CONTRACT_THROUGH_RAIL_MESSAGE)
  // The typed price has its own action and gates (catch-up Phase 24).
  if (PRICE_FIELDS.some((k) => k in (patch as Partial<Procedure>))) return refuse('priceThroughSetPrice', PRICE_THROUGH_SET_PRICE_MESSAGE)
  // Nobody edits the procedure text (US-02.5.7); the invoice description has its own office actions (US-08.4.6).
  if (TEXT_FIELDS.some((k) => k in (patch as Partial<Procedure>))) return refuse('procedureTextNotEditable', PROCEDURE_TEXT_NOT_EDITABLE_MESSAGE)
  const row = withRvgRowChange(state, procedure, patch)
  if (!row.ok) return row
  patch = row.value.patch
  const reconciled = row.value.reconciled

  mutate(
    api,
    actor,
    {
      entityType: 'procedure',
      entityId: procedureId,
      action: 'procedure.update',
      before: {
        ...Object.fromEntries(Object.keys(patch).map((k) => [k, procedure[k as keyof Procedure]])),
        ...(reconciled !== null ? claimsAuditView(procedure, state.masters.modifiers) : {}),
      },
      after: { ...patch, ...(reconciled !== null ? claimsAuditView(reconciled, state.masters.modifiers) : {}) },
    },
    (s) => ({
      schedule: {
        ...s.schedule,
        procedures: { ...s.schedule.procedures, [procedureId]: { ...procedure, ...patch, ...(reconciled ?? {}) } },
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
 * Neither the hospital nor the surgeon can be cleared: every List has both
 * (US-01.3.1, catch-up Phase 31's pairing rule, `pairingIssues`). A Draft List
 * is edited the same way (it is a List).
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
  // The one pairing rule (US-01.3.1): a patch may change the hospital or surgeon, never clear either.
  if (('hospitalId' in patch && (patch.hospitalId ?? '').trim() === '') || ('surgeonId' in patch && (patch.surgeonId ?? '').trim() === '')) {
    return refuse('pairingRequired', 'A List needs a hospital and a surgeon.')
  }
  const issues = pairingIssues({ hospitalId: patch.hospitalId ?? list.hospitalId, surgeonId: patch.surgeonId ?? list.surgeonId }, state.masters)
  if (issues.length > 0) return refuse('pairingRequired', issues.map((i) => i.message).join(' '), { issues })

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
      if (patch.hospitalId !== undefined) next.hospitalId = patch.hospitalId
      if (patch.surgeonId !== undefined) next.surgeonId = patch.surgeonId
      if ('notes' in patch) {
        if (patch.notes === undefined || patch.notes === '') delete next.notes
        else next.notes = patch.notes
      }
      // A hand-edited List leaves its recurring booking (catch-up Phase 30,
      // US-01.3.2): no later projection overwrites or removes it.
      if (next.hospitalId !== list.hospitalId || next.surgeonId !== list.surgeonId || next.notes !== list.notes) delete next.recurringBookingId
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
 * Bookings change. Blocked when either List is AUTHORISED; a SUBMITTED List at
 * either end is allowed for the office and, on their own Lists, the anaesthetist
 * (catch-up Phase 38a). A Booking moved onto a SUBMITTED List counts toward its
 * completeness check at authorise.
 */
export function reassignBooking(api: AppStoreApi, actor: Actor, bookingId: string, toListId: string): Outcome {
  const state = api.getState()
  const found = getBooking(state, bookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  const { list: source } = found
  const target = state.schedule.lists[toListId]
  // A removed Draft List takes no Bookings (it has left every view but History).
  if (target === undefined || target.removedAtISO !== undefined) return refuse('notFound', 'Target List not found.')
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
    if (actor.anaesthetistId !== undefined && actor.anaesthetistId !== source.anaesthetistId) {
      return refuse('notOwnList', 'Anaesthetists can only move Bookings between their own Lists.')
    }
    // Catch-up Phase 32a: an anaesthetist hands a Booking to a colleague only
    // through the one sanctioned path, `moveBookingToAnaesthetist`, which makes
    // a new List in the colleague's free session (never onto an existing List).
    if (actor.anaesthetistId !== undefined && actor.anaesthetistId !== target.anaesthetistId) {
      return refuse('notOwnList', 'To hand a Booking to a colleague, use Move to a colleague.')
    }
    // ACTIVE and SUBMITTED Lists of their own, both ends (catch-up Phase 38a, D63);
    // a Draft List is the office's (editRefusal).
    const rights = editRefusal(actor, source) ?? editRefusal(actor, target)
    if (rights !== null) return rights
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
    (s) => ({ schedule: reassignBookingCore(s.schedule, bookingId, target.id) }),
  )
  return ok(undefined)
}

/**
 * The move itself, guard-free and draft level: the Booking (its Procedures
 * follow by `bookingId`) now sits on `toListId`. No audit, no commit: the
 * caller has checked and writes its own event. `reassignBooking` (office,
 * integration, an anaesthetist between her own Lists) and Phase 32a's
 * `moveBookingToAnaesthetist` both run it, so a Booking moves one way.
 */
export function reassignBookingCore(schedule: AppState['schedule'], bookingId: string, toListId: string): AppState['schedule'] {
  const booking = schedule.bookings[bookingId]
  if (booking === undefined) throw new Error(`reassignBookingCore: no Booking ${bookingId}`)
  return { ...schedule, bookings: { ...schedule.bookings, [bookingId]: { ...booking, listId: toListId } } }
}

