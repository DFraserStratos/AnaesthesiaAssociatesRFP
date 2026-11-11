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
import { isBlankText, procedureTextOf, refreshedInvoiceDescriptionFor } from '../domain/billing/procedureStack'
import { upsertPatient, type PatientIntakeDetails } from './intake'
import { listInSlot, proceduresForBooking, slotFor } from './selectors'
import { isOpenSlot } from '../domain/slotStatus'
import { rvgGroupPickRefusal } from '../domain/billing/rvgGroups'
import { placeListOnSlot } from './slotActions'
import { fillFromContract } from '../domain/billing/startingValues'
import { isRvgKind } from '../domain/billing/contracts'
import { contractPickRefusal } from './contractSelectionActions'
import { PREPAID_OFFICE_ONLY_MESSAGE, contractAllowedOn } from '../domain/billing/contractRail'
import { railContextForList, railMastersOf } from './selectors'

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
  /** INTERIM payer override until Phase 21 (a guardian or named payer). */
  billablePartyId?: string
  billingReference?: string
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
 * and its first Procedure (`isAdditional:false`), audited `booking.create` +
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

    const procedure: Procedure = {
      id: procedureId,
      bookingId,
      procedureText:
        input.sourceText !== undefined && hasText
          ? procedureTextOf(input.sourceText.text, input.sourceText.source, atISO, input.sourceText.from)
          : null,
      invoiceDescription: null,
      isAdditional: false,
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
    if (input.billablePartyId !== undefined) procedure.billablePartyId = input.billablePartyId
    if (input.billingReference !== undefined && input.billingReference.trim() !== '') {
      procedure.billingReference = input.billingReference.trim()
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
 * first procedure. Audited `booking.create` + `procedure.create`; original untouched.
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

  const first = proceduresForBooking(state, originalBookingId)[0]

  let bookingId = ''
  let listId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const placed = placeListOnSlot(s.counters, target, {
      // The addendum copies the original List's hospital and surgeon, so the pairing rule holds (US-01.3.1).
      kind: originalList.kind,
      hospitalId: originalList.hospitalId,
      surgeonId: originalList.surgeonId,
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

    const procedure: Procedure = {
      id: procedureId,
      bookingId,
      procedureText: null,
      invoiceDescription: null,
      isAdditional: false,
      modifierClaims: [],
      removedModifierIds: [],
    }
    // The same episode's Contract (INTERIM until Phase 38b's additional
    // invoice): an RVG-kind Contract is copied, with the payer override; a
    // fixed, open or prepaid one is not (it is the whole price of the item it
    // was chosen for, and a post-op event is never prepaid), so the addendum
    // then needs an invoice destination. The post-op event bills its own
    // B/T/M (not time-only: it is a distinct billable item).
    if (first?.billablePartyId !== undefined) procedure.billablePartyId = first.billablePartyId
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
 * procedure"). Additional from the first (RFP split-billing rule): it bills
 * time units only; base and modifier units stay on the first procedure. The
 * skeleton is an empty additional Procedure: no procedure text,
 * `isAdditional: true`, the first Procedure's payer override copied
 * (INTERIM until Phase 21). It picks its own Contract (US-03.2.3, catch-up
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

  const first = proceduresForBooking(state, bookingId)[0]
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

    const procedure: Procedure = {
      id: procedureId,
      bookingId,
      procedureText: null,
      invoiceDescription: null,
      isAdditional: true,
      modifierClaims: [],
      removedModifierIds: [],
    }
    // The same episode's payer override (INTERIM until Phase 21); never the
    // base, modifier or time specifics.
    if (first?.billablePartyId !== undefined) procedure.billablePartyId = first.billablePartyId
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
        isAdditional: true,
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
 *  - **The Booking's first procedure is not removable** (user ruling, 2026-07-27).
 *    It is the anchor: it carries the base and modifier units the additional
 *    ones deliberately do not. Deleting it would leave a Booking billing time units only, and
 *    silently promoting the next one would rewrite the billing basis of a
 *    procedure nobody touched. A Booking booked wholly in error is a booking
 *    CANCELLATION, which is the refusal's pointer.
 *  - **Its billing lines go with it**, each separately audited in the same
 *    commit, so no line is orphaned onto a procedure that no longer exists
 *    (an orphan would break the completion validator's conservation check and
 *    the invoice build). A line carrying an office funder allocation blocks an
 *    anaesthetist, exactly as `removeBillingLine` does.
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

  // Position, not the stored `isAdditional` flag: what may not be removed is
  // whatever the Booking currently anchors on, which is what the UI numbers
  // PROCEDURE 1.
  const siblings = proceduresForBooking(state, booking.id)
  if (siblings[0]?.id === procedureId) {
    return refuse(
      'primaryProcedure',
      "A Booking's first procedure cannot be removed. Remove the additional procedures, or cancel the Booking if the whole booking is wrong.",
    )
  }

  const lines = Object.values(state.schedule.billingLines).filter((l) => l.procedureId === procedureId)
  if (actor.role === 'anaesthetist' && lines.some((l) => l.funderOverride !== undefined)) {
    return refuse(
      'funderAllocationOfficeOnly',
      'This procedure carries a billing line the office allocated to a funder. Only the office can remove it.',
    )
  }

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

  return ok(undefined)
}
