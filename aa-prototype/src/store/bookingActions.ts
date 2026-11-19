/**
 * Booking-creation guards (Phase 03): the ad-hoc/manual path. Modelled exactly on `cancelBooking` /
 * `editBooking`: an `editRefusal` gate, then one audited `mutate()` commit with
 * the audit metas allocated inside the recipe (the `reassignList` pattern).
 *
 * Domain logic lives here, not in components (PROGRESS convention 4). Every
 * write is audited and honours the role/source/state matrix.
 */

import type {
  Booking,
  BookingSource,
  IntegrationCorrelationRef,
  Procedure,
  ProcedureTextSource,
  RailAnswers,
} from '../domain/types'
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
import { editRefusal, getBooking } from './lifecycle'
import { payerFromInput, payerInputRefusal, type PayerInput } from './payerActions'
import { isBlankText, procedureTextOf, refreshedInvoiceDescriptionFor } from '../domain/billing/procedureStack'
import { payerForNewProcedure } from '../domain/billing/procedurePayer'
import { upsertPatient, type PatientIntakeDetails } from './intake'
import { listInSlot, proceduresForBooking, slotFor } from './selectors'
import { isOpenSlot } from '../domain/slotStatus'
import { rvgGroupPickRefusal } from '../domain/billing/rvgGroups'
import { claimsAuditView, reconcileClaims } from '../domain/billing/modifiers'
import { modifierFactsFor } from './modifierFacts'
import { placeListOnSlot } from './slotActions'
import { fillFromContract } from '../domain/billing/startingValues'
import { isRvgKind } from '../domain/billing/contracts'
import { contractPickRefusal } from './contractSelectionActions'
import { PREPAID_OFFICE_ONLY_MESSAGE, contractAllowedOn } from '../domain/billing/contractRail'
import { railContextForList, railMastersOf } from './selectors'
import { autoSendPrepayments } from './prepaymentActions'
import { originForNewList } from '../domain/lists/listOrigin'

// ---------------------------------------------------------------------------
// createBooking
// ---------------------------------------------------------------------------

export interface CreateBookingInput {
  /** Patient details — routed through the shared `upsertPatient` dedupe. */
  patient: PatientIntakeDetails
  scheduledTime?: string
  /**
   * The procedure text as received or as typed (catch-up Phase 20a;
   * US-02.5.7, US-02.4.1): stored exactly as given (no trim), with its
   * source and sender; a blank text stores nothing. The name Phases 33 and 35
   * use.
   */
  sourceText?: { text: string; source: ProcedureTextSource; from?: string }
  /** The optional RVG code: an RVG group row by id (catch-up Phase 19). Never changes the text. */
  rvgGroupId?: string
  /**
   * The Procedure's Contract, picked on the step rail (US-04.3.4): optional.
   * With none it "Needs an invoice destination" and waits on the office's
   * list; nothing is derived from the List (catch-up Phase 20).
   */
  governingContractId?: string
  /** The amount typed on an open-price fallback (INTERIM until Phase 24). */
  enteredPrice?: number
  /** The step rail's answers so far, when no Contract was picked. */
  railAnswers?: RailAnswers
  /**
   * The payer of the new Booking's Procedure (catch-up Phase 21; on each
   * Procedure since 22a, US-11.2.2): the patient unless a form ticks
   * "Different payer". Every creation path without one names the patient.
   */
  payer?: PayerInput
  notes?: string
  /**
   * Integration provenance (Phase 11): the `{sourceFeedId, externalAppointmentId}`
   * correlation ref an HL7/FHIR create stamps, so later S13/S14/S15 messages
   * locate this Booking by its appointment id. Backward-compatible: manual/photo/
   * PDF paths omit it.
   */
  correlationRef?: IntegrationCorrelationRef
  /**
   * How the Booking entered the system, when the calling path knows it
   * (DM-39). Display-only: stored on the Booking and in the create audit, read
   * by no rule.
   */
  source?: BookingSource
}

export const PROCEDURE_OR_CODE_REQUIRED_MESSAGE = 'Type the procedure as told, or choose an RVG code.'

/**
 * Create an ad-hoc Booking (the manual and photo paths share this — the photo path
 * simply pre-fills `input`). Runs the shared
 * `upsertPatient` first (NHI dedupe: reuse or create), then creates the Booking
 * and its first Procedure, the Booking's primary (`isPrimary: true`; catch-up
 * Phase 23: the first entered is the primary by default), audited `booking.create` +
 * `procedure.create`. The patient audit comes from `upsertPatient`.
 */
export function createBooking(
  api: AppStoreApi,
  actor: Actor,
  listId: string,
  input: CreateBookingInput,
): Outcome<{ bookingId: string; patientId: string }> {
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights
  // A person's entry needs something to show: the text as told, or an RVG
  // code (D33: the code is optional). An integration's message may carry
  // neither; it creates a Procedure with no text (no invented wording).
  const hasText = input.sourceText !== undefined && !isBlankText(input.sourceText.text)
  if (actor.source !== 'integration' && !hasText && input.rvgGroupId === undefined) {
    return refuse('procedureOrCodeRequired', PROCEDURE_OR_CODE_REQUIRED_MESSAGE)
  }
  const pickRefused = rvgGroupPickRefusal(state.masters.rvgGroups, input.rvgGroupId, undefined)
  if (pickRefused !== null) return refuse(pickRefused.code, pickRefused.message)
  // The anaesthetist is never on Prepaid, answers so far included (A17).
  if (actor.role === 'anaesthetist' && input.railAnswers?.destination === 'patient' && input.railAnswers.narrow === 'prepaid') {
    return refuse('prepaidOfficeOnly', PREPAID_OFFICE_ONLY_MESSAGE)
  }
  if (input.payer !== undefined) {
    const payerRefused = payerInputRefusal(input.payer)
    if (payerRefused !== null) return payerRefused
  }
  if (input.governingContractId !== undefined) {
    const contractRefused = contractPickRefusal(state, actor, list, undefined, input.governingContractId, {
      ...(input.enteredPrice !== undefined ? { enteredPrice: input.enteredPrice } : {}),
    })
    if (contractRefused !== null) return contractRefused
  }

  // Shared intake dedupe — may reuse an existing Patient or create one. A bad
  // NHI is surfaced verbatim before any Booking is created.
  const intake = upsertPatient(api, actor, input.patient)
  if (!intake.ok) return intake
  const patientId = intake.value.patient.hiddenInternalId

  let bookingId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    let counters = s.counters
    const bookingAlloc = allocateId(counters, 'booking')
    counters = bookingAlloc.counters
    bookingId = bookingAlloc.id
    const procAlloc = allocateId(counters, 'procedure')
    counters = procAlloc.counters
    const procedureId = procAlloc.id
    const atISO = clockISO(s.clock)
    // A new Booking's other payer is always a new person: a passed id is never reused (no other Booking's Xero contact).
    const formPayer = input.payer ?? { kind: 'patient' as const }
    const payerAlloc = payerFromInput(formPayer.kind === 'other' ? { ...formPayer, id: undefined } : formPayer, counters)
    counters = payerAlloc.counters

    const booking: Booking = {
      id: bookingId,
      listId,
      patientId,
      completed: false,
      lastModifiedBy: actor.who,
      lastModifiedAtISO: atISO,
    }
    if (input.scheduledTime !== undefined) booking.scheduledTime = input.scheduledTime
    if (input.notes !== undefined && input.notes.trim() !== '') booking.notes = input.notes.trim()
    if (input.correlationRef !== undefined) booking.correlationRef = input.correlationRef
    if (input.source !== undefined) booking.source = input.source

    // The form's payer (the patient unless another is ticked) on the Booking's Procedure (catch-up Phase 22a).
    const procedure: Procedure = {
      id: procedureId,
      bookingId,
      payer: payerAlloc.payer,
      procedureText:
        input.sourceText !== undefined && hasText
          ? procedureTextOf(input.sourceText.text, input.sourceText.source, atISO, input.sourceText.from)
          : null,
      invoiceDescription: null,
      isPrimary: true,
      modifierClaims: [],
      removedModifierIds: [],
    }
    if (input.rvgGroupId !== undefined) procedure.rvgGroupId = input.rvgGroupId
    if (input.governingContractId !== undefined) {
      procedure.governingContractId = input.governingContractId
      if (input.enteredPrice !== undefined) procedure.enteredPrice = input.enteredPrice
      const fill = fillFromContract(procedure, s.masters.contracts[input.governingContractId], s.masters.rvgGroups)
      if (fill !== null) procedure.rvgGroupId = fill.rvgGroupId
    } else if (input.railAnswers !== undefined) {
      procedure.railAnswers = input.railAnswers
    }
    // The order of defaults (US-08.4.6, D37): the text, or the Contract's invoice description; never the RVG code.
    procedure.invoiceDescription = refreshedInvoiceDescriptionFor(procedure, s.masters.contracts)

    metas.push(
      {
        entityType: 'booking',
        entityId: bookingId,
        action: 'booking.create',
        after: input.source !== undefined ? { listId, patientId, source: input.source } : { listId, patientId },
      },
      {
        entityType: 'procedure',
        entityId: procedureId,
        action: 'procedure.create',
        after: {
          procedureText: procedure.procedureText,
          ...(procedure.invoiceDescription !== null ? { invoiceDescription: procedure.invoiceDescription.text } : {}),
          ...(procedure.governingContractId !== undefined ? { governingContractId: procedure.governingContractId } : {}),
          ...(procedure.enteredPrice !== undefined ? { enteredPrice: procedure.enteredPrice } : {}),
          ...(procedure.rvgGroupId !== undefined ? { rvgGroupId: procedure.rvgGroupId } : {}),
          ...(procedure.railAnswers !== undefined ? { railAnswers: procedure.railAnswers } : {}),
        },
      },
    )
    return {
      schedule: {
        ...s.schedule,
        bookings: { ...s.schedule.bookings, [bookingId]: booking },
        procedures: { ...s.schedule.procedures, [procedureId]: procedure },
      },
      counters,
    }
  })

  // With approval off, a prepaid Booking created ready is sent at once (catch-up Phase 27).
  autoSendPrepayments(api, bookingId)
  return ok({ bookingId, patientId })
}

// ---------------------------------------------------------------------------
// addPostOpAddendum
// ---------------------------------------------------------------------------

/**
 * Post-op addendum (B8; Phase 09) — a post-procedure charge against a
 * billed/locked episode (e.g. an HDU review, pain consult, nerve catheter).
 * The RFP's immutability answer: the original Booking stays LOCKED; the addendum
 * is a NEW linked Booking (`bookingType: 'postOpAddendum'`, `addendumOfBookingId`) that
 * runs its own capture -> submit -> authorise -> bill cycle.
 *
 * It goes on a NEW List in the original anaesthetist's open session today (AM
 * before PM): a List of its own, because submission is completion-gated for
 * the whole List, so a shared List would block on incomplete siblings or bill
 * them together. The List copies the original List's hospital, surgeon and
 * kind and is created with the Booking in one commit (catch-up Phase 28:
 * empty sessions are no longer Lists). INTERIM until Phase 38b replaces the
 * addendum Booking with an additional invoice. Refused `noOpenSession` when
 * neither of today's sessions is open.
 * The patient is reused; the billing setup is inherited from the original's
 * primary procedure, and the addendum's Procedure is its own Booking's primary. Audited `booking.create` + `procedure.create`; original untouched.
 */
export function addPostOpAddendum(
  api: AppStoreApi,
  actor: Actor,
  originalBookingId: string,
): Outcome<{ bookingId: string; listId: string }> {
  const state = api.getState()
  const found = getBooking(state, originalBookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  const { booking: original, list: originalList } = found

  if (originalList.state !== 'AUTHORISED') {
    return refuse(
      'notAuthorised',
      'A post-op addendum is only added to a locked (authorised) episode. The original Booking is not authorised yet.',
    )
  }

  const anaesthetistId = originalList.anaesthetistId
  const todayISO = state.clock.todayISO
  const target = (['AM', 'PM'] as const)
    .map((session) => slotFor(state, anaesthetistId, todayISO, session))
    .find((slot) => slot !== undefined && isOpenSlot(slot, listInSlot(state, slot.id), state.masters.slotStatuses))
  if (target === undefined) {
    return refuse(
      'noOpenSession',
      "No free session today for this anaesthetist to hold the post-op addendum. Free one of today's sessions first.",
    )
  }
  // The new List is ACTIVE and the original anaesthetist's: the usual edit rights apply to it.
  const rights = editRefusal(actor, { ...originalList, state: 'ACTIVE' })
  if (rights !== null) return rights

  const originals = proceduresForBooking(state, originalBookingId)
  const first = originals.find((p) => p.isPrimary) ?? originals[0]

  let bookingId = ''
  let listId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const placed = placeListOnSlot(s.counters, target, {
      // The addendum copies the original List's hospital and surgeon, so the pairing rule holds (US-01.3.1).
      kind: originalList.kind,
      hospitalId: originalList.hospitalId,
      surgeonId: originalList.surgeonId,
      // A List made from another keeps the origin of the List it came from (US-02.2.4 build choice).
      origin: originForNewList({ kind: 'derived', from: originalList }),
    })
    listId = placed.list.id
    metas.push(placed.meta)
    let counters = placed.counters
    const bookingAlloc = allocateId(counters, 'booking')
    counters = bookingAlloc.counters
    bookingId = bookingAlloc.id
    const procAlloc = allocateId(counters, 'procedure')
    counters = procAlloc.counters
    const procedureId = procAlloc.id
    const atISO = clockISO(s.clock)

    const booking: Booking = {
      id: bookingId,
      listId,
      patientId: original.patientId,
      completed: false,
      bookingType: 'postOpAddendum',
      addendumOfBookingId: originalBookingId,
      // Interim until Phase 39 replaces the addendum: the source follows the actor.
      source: actor.role === 'office' ? 'admin' : 'anaesthetistAdHoc',
      lastModifiedBy: actor.who,
      lastModifiedAtISO: atISO,
    }

    // The same episode's payer, by the one copy rule over the source Booking's Procedures (catch-up Phase 22a; until 38b makes the addendum an event).
    const procedure: Procedure = {
      id: procedureId,
      bookingId,
      payer: payerForNewProcedure(proceduresForBooking(s, originalBookingId), s.masters.contracts, original.patientId),
      procedureText: null,
      invoiceDescription: null,
      isPrimary: true,
      modifierClaims: [],
      removedModifierIds: [],
    }
    // The same episode's Contract (INTERIM until Phase 38b's additional
    // invoice): an RVG-kind Contract is copied (the payer by the copy rule); a
    // fixed, open or prepaid one is not (it is the whole price of the item it
    // was chosen for, and a post-op event is never prepaid), so the addendum
    // then needs an invoice destination. The post-op event bills its own
    // B/T/M: it is its own Booking, so its one Procedure is that Booking's primary.
    // Only a Contract the step rail allows on the addendum's List (US-04.3.2).
    if (first?.governingContractId !== undefined && contractAllowedOn(railMastersOf(s), railContextForList(s, placed.list), first.governingContractId)) {
      inheritContract(procedure, first.governingContractId, s.masters)
    }
    // No text arrives with an addendum; a copied Contract's invoice description applies (D37).
    procedure.invoiceDescription = refreshedInvoiceDescriptionFor(procedure, s.masters.contracts)

    metas.push(
      {
        entityType: 'booking',
        entityId: bookingId,
        action: 'booking.create',
        after: {
          listId,
          patientId: original.patientId,
          bookingType: 'postOpAddendum',
          addendumOfBookingId: originalBookingId,
          source: actor.role === 'office' ? 'admin' : 'anaesthetistAdHoc',
        },
      },
      {
        entityType: 'procedure',
        entityId: procedureId,
        action: 'procedure.create',
        after: {
          bookingId,
          ...(procedure.governingContractId !== undefined ? { governingContractId: procedure.governingContractId } : {}),
          ...(procedure.rvgGroupId !== undefined ? { rvgGroupId: procedure.rvgGroupId } : {}),
        },
      },
    )
    return {
      schedule: {
        ...s.schedule,
        lists: { ...s.schedule.lists, [listId]: placed.list },
        bookings: { ...s.schedule.bookings, [bookingId]: booking },
        procedures: { ...s.schedule.procedures, [procedureId]: procedure },
      },
      counters,
    }
  })

  return ok({ bookingId, listId })
}

/**
 * A post-op addendum copies the original's Contract when it is priced from
 * RVG units (and never a prepaid one), filling an empty RVG code from its
 * default (catch-up Phase 19a, DM-43). A fixed or open price is never copied:
 * it is the whole price of the item it was chosen for (OQ-53).
 */
function inheritContract(procedure: Procedure, contractId: string, masters: AppState['masters']): void {
  const contract = masters.contracts[contractId]
  if (contract === undefined || !isRvgKind(contract.pricing.kind) || contract.prepaid) return
  procedure.governingContractId = contractId
  const fill = fillFromContract(procedure, masters.contracts[contractId], masters.rvgGroups)
  if (fill !== null) procedure.rvgGroupId = fill.rvgGroupId
}

// ---------------------------------------------------------------------------
// addProcedure
// ---------------------------------------------------------------------------

/**
 * Add an additional Procedure to an existing Booking (Phase 04's "Add another
 * procedure"). It is additional (`isPrimary: false`): under the multi-procedure
 * rule (catch-up Phase 23) it earns its own time units, its share of the
 * Booking's modifiers above 4, and no base units. The
 * skeleton is an empty additional Procedure: no procedure text,
 * `isPrimary: false`, its payer by the copy rule (`payerForNewProcedure`, catch-up Phase 22a). It picks its own Contract (US-03.2.3, catch-up
 * Phase 20): the one given, checked as on the step rail, else none ("Needs an
 * invoice destination"); never one stored silently. Audited `procedure.create`.
 */
export function addProcedure(
  api: AppStoreApi,
  actor: Actor,
  bookingId: string,
  pick: { governingContractId?: string; enteredPrice?: number } = {},
): Outcome<{ procedureId: string }> {
  const state = api.getState()
  const found = getBooking(state, bookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  const { booking, list } = found

  if (booking.cancellation !== undefined) {
    return refuse('bookingCancelled', 'This Booking is cancelled and cannot take another procedure.')
  }
  if (booking.completed) {
    return refuse('bookingCompleted', 'This Booking is already marked complete. Amend it before adding a procedure.')
  }
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights

  if (pick.governingContractId !== undefined) {
    const contractRefused = contractPickRefusal(state, actor, list, undefined, pick.governingContractId, {
      ...(pick.enteredPrice !== undefined ? { enteredPrice: pick.enteredPrice } : {}),
    })
    if (contractRefused !== null) return contractRefused
  }

  let procedureId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const procAlloc = allocateId(s.counters, 'procedure')
    procedureId = procAlloc.id

    // A Procedure added later takes the Booking's shared payer, else the patient (US-11.2.2, the one copy rule).
    const procedure: Procedure = {
      id: procedureId,
      bookingId,
      payer: payerForNewProcedure(proceduresForBooking(s, bookingId), s.masters.contracts, booking.patientId),
      procedureText: null,
      invoiceDescription: null,
      isPrimary: false,
      modifierClaims: [],
      removedModifierIds: [],
    }
    // Never the base, modifier or time specifics.
    if (pick.governingContractId !== undefined) {
      procedure.governingContractId = pick.governingContractId
      if (pick.enteredPrice !== undefined) procedure.enteredPrice = pick.enteredPrice
      const fill = fillFromContract(procedure, s.masters.contracts[pick.governingContractId], s.masters.rvgGroups)
      if (fill !== null) procedure.rvgGroupId = fill.rvgGroupId
    }
    // An added Procedure has no text of its own; the chosen Contract's invoice description applies (D37).
    procedure.invoiceDescription = refreshedInvoiceDescriptionFor(procedure, s.masters.contracts)

    metas.push({
      entityType: 'procedure',
      entityId: procedureId,
      action: 'procedure.create',
      after: {
        bookingId,
        isPrimary: false,
        ...(procedure.governingContractId !== undefined ? { governingContractId: procedure.governingContractId } : {}),
        ...(procedure.enteredPrice !== undefined ? { enteredPrice: procedure.enteredPrice } : {}),
        ...(procedure.rvgGroupId !== undefined ? { rvgGroupId: procedure.rvgGroupId } : {}),
      },
    })
    return {
      schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [procedureId]: procedure } },
      counters: procAlloc.counters,
    }
  })

  // With approval off, a prepaid Procedure added ready is sent at once (catch-up Phase 27).
  autoSendPrepayments(api, bookingId)
  return ok({ procedureId })
}

// ---------------------------------------------------------------------------
// removeProcedure
// ---------------------------------------------------------------------------

/**
 * Remove an ADDITIONAL procedure from a Booking — the undo for `addProcedure` (and
 * for a second procedure captured in error). A HARD delete with the removed row
 * snapshotted into `before`, mirroring `removeBillingLine`: a procedure is a
 * sub-entity of the Booking, not a billable record in its own right, so there is
 * nothing for a soft-cancel state to remain visible on. The Booking itself keeps
 * its soft-cancel; that is the audited "this happened and then did not" case.
 *
 * Two things make it safe:
 *  - **The primary procedure is not removable** (user ruling, 2026-07-27,
 *    re-based on the flag in catch-up Phase 23). It carries the base units and
 *    the Booking's modifiers. Removal never promotes another: silently
 *    promoting one would rewrite the billing basis of a procedure nobody
 *    touched. Make primary is the explicit route, and a Booking booked wholly
 *    in error is a booking CANCELLATION; the refusal names both.
 *  - **Its billing lines go with it**, each separately audited in the same
 *    commit, so no line is orphaned onto a procedure that no longer exists
 *    (an orphan would break the invoice build).
 */
export function removeProcedure(api: AppStoreApi, actor: Actor, procedureId: string): Outcome {
  const state = api.getState()
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined) return refuse('notFound', 'Procedure not found.')
  const found = getBooking(state, procedure.bookingId)
  if (found === undefined) return refuse('notFound', 'The procedure has no Booking.')
  const { booking, list } = found

  if (booking.cancellation !== undefined) {
    return refuse('bookingCancelled', 'This Booking is cancelled. Its procedures cannot be changed.')
  }
  if (booking.completed) {
    return refuse('bookingCompleted', 'This Booking is already marked complete. Amend it before removing a procedure.')
  }
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights

  // The flag, not the position (catch-up Phase 23): the primary is refused, and nothing is promoted.
  if (procedure.isPrimary) return refuse('primaryProcedure', PRIMARY_NOT_REMOVABLE_MESSAGE)

  const lines = Object.values(state.schedule.billingLines).filter((l) => l.procedureId === procedureId)

  const metas: MutationMeta[] = [
    {
      entityType: 'procedure',
      entityId: procedureId,
      action: 'procedure.remove',
      before: procedure,
      stampBookingId: booking.id,
    },
    ...lines.map(
      (line): MutationMeta => ({
        entityType: 'billingLine',
        entityId: line.id,
        action: 'billingLine.remove',
        before: line,
        stampBookingId: booking.id,
      }),
    ),
  ]

  mutate(api, actor, metas, (s) => {
    const procedures = { ...s.schedule.procedures }
    delete procedures[procedureId]
    const billingLines = { ...s.schedule.billingLines }
    for (const line of lines) delete billingLines[line.id]
    return { schedule: { ...s.schedule, procedures, billingLines } }
  })

  // With approval off, a group this left ready is sent now (catch-up Phase 27).
  autoSendPrepayments(api, procedure.bookingId)
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// setPrimaryProcedure (catch-up Phase 23; US-03.2.2, US-03.2.1)
// ---------------------------------------------------------------------------

/** `removeProcedure`'s refusal on the primary: removal never promotes (2026-07-27, re-based on the flag). */
export const PRIMARY_NOT_REMOVABLE_MESSAGE =
  'The primary procedure cannot be removed. Make another procedure primary first, or cancel the Booking if the whole booking is wrong.'

/** The anaesthetist's refusal on a completed Booking; the office corrects it at review. */
export const PRIMARY_COMPLETED_MESSAGE = 'This Booking is marked complete. Amend it before changing the primary procedure.'

/**
 * Make another Procedure the Booking's primary ("Make primary"): anyone with
 * edit rights (the anaesthetist on her own ACTIVE List, the office on ACTIVE
 * and SUBMITTED, an inbound feed on ACTIVE), while the Booking is editable.
 * One audited commit, two `procedure.setPrimary` entries (old and new, each
 * with before and after), stamping the Booking. The effect:
 *  - the old primary's flag clears and the new one's sets;
 *  - the Booking's modifier records move to the new primary: the claims (each
 *    with its explanation), the removed pre-applied modifiers, the manual M
 *    adjustment and the modifiers step's answer. The pre-applied age and
 *    included modifiers are derived, so they re-derive for the new primary,
 *    and a claim its RVG group includes is dropped (`reconcileClaims`; kept in
 *    the old entry's `before`). Picked reading, logged;
 *  - the old primary's base inputs (a recorded value, a chosen value on a
 *    ranged group) are cleared, kept in its `before`, so no additional
 *    Procedure carries base inputs; the new primary's base starts from 19's
 *    resolver for its own RVG group.
 */
export function setPrimaryProcedure(api: AppStoreApi, actor: Actor, procedureId: string): Outcome<{ previousPrimaryId: string | undefined }> {
  const state = api.getState()
  const target = state.schedule.procedures[procedureId]
  if (target === undefined) return refuse('notFound', 'Procedure not found.')
  const found = getBooking(state, target.bookingId)
  if (found === undefined) return refuse('notFound', 'The procedure has no Booking.')
  const { booking, list } = found
  if (booking.cancellation !== undefined) {
    return refuse('bookingCancelled', 'This Booking is cancelled. Its procedures cannot be changed.')
  }
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights
  if (booking.completed && actor.role === 'anaesthetist') return refuse('bookingCompleted', PRIMARY_COMPLETED_MESSAGE)
  if (target.isPrimary) return refuse('alreadyPrimary', 'This is already the primary procedure.')

  const old = proceduresForBooking(state, booking.id).find((p) => p.isPrimary)
  const carried: Pick<Procedure, 'modifierClaims' | 'removedModifierIds'> & Partial<Pick<Procedure, 'modifierUnitsCaptured' | 'modifiersConfirmed'>> = {
    modifierClaims: old?.modifierClaims ?? [],
    removedModifierIds: old?.removedModifierIds ?? [],
    ...(old?.modifierUnitsCaptured !== undefined ? { modifierUnitsCaptured: old.modifierUnitsCaptured } : {}),
    ...(old?.modifiersConfirmed !== undefined ? { modifiersConfirmed: old.modifiersConfirmed } : {}),
  }
  // The pre-applied modifiers re-derive for the new primary; a claim its group includes is dropped.
  const reconciled = reconcileClaims(carried.modifierClaims, carried.removedModifierIds, modifierFactsFor(state, target))
  const next: Procedure = {
    ...withoutBookingModifiers(target),
    isPrimary: true,
    modifierClaims: reconciled.modifierClaims,
    removedModifierIds: reconciled.removedModifierIds,
    ...(carried.modifierUnitsCaptured !== undefined ? { modifierUnitsCaptured: carried.modifierUnitsCaptured } : {}),
    ...(carried.modifiersConfirmed !== undefined ? { modifiersConfirmed: carried.modifiersConfirmed } : {}),
  }
  const modifiers = state.masters.modifiers
  const metas: MutationMeta[] = []
  const updates: Record<string, Procedure> = { [target.id]: next }
  if (old !== undefined) {
    const demoted: Procedure = { ...withoutBookingModifiers(old), isPrimary: false, modifierClaims: [], removedModifierIds: [] }
    delete demoted.baseUnitsSelected
    delete demoted.baseUnitsCaptured
    updates[old.id] = demoted
    metas.push({
      entityType: 'procedure',
      entityId: old.id,
      action: 'procedure.setPrimary',
      before: {
        isPrimary: true,
        ...claimsAuditView(old, modifiers),
        ...(old.modifierUnitsCaptured !== undefined ? { modifierUnitsCaptured: old.modifierUnitsCaptured } : {}),
        ...(old.baseUnitsSelected !== undefined ? { baseUnitsSelected: old.baseUnitsSelected } : {}),
        ...(old.baseUnitsCaptured !== undefined ? { baseUnitsCaptured: old.baseUnitsCaptured } : {}),
      },
      after: { isPrimary: false, ...claimsAuditView(demoted, modifiers) },
      stampBookingId: booking.id,
    })
  }
  metas.push({
    entityType: 'procedure',
    entityId: target.id,
    action: 'procedure.setPrimary',
    before: { isPrimary: false, ...claimsAuditView(target, modifiers) },
    after: {
      isPrimary: true,
      ...claimsAuditView(next, modifiers),
      ...(next.modifierUnitsCaptured !== undefined ? { modifierUnitsCaptured: next.modifierUnitsCaptured } : {}),
    },
    stampBookingId: booking.id,
  })
  mutate(api, actor, metas, (s) => ({
    schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, ...updates } },
  }))
  return ok({ previousPrimaryId: old?.id })
}

/** A Procedure without the Booking-level modifier records (they live on the primary alone). */
function withoutBookingModifiers(procedure: Procedure): Procedure {
  const copy: Procedure = { ...procedure }
  delete copy.modifierUnitsCaptured
  delete copy.modifiersConfirmed
  return copy
}
