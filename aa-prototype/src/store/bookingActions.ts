/**
 * Booking-creation guards (Phase 03) — the ad-hoc/manual + photo path and
 * Booking Copy (a skeleton-only new Booking since catch-up Phase 15). Modelled exactly on `cancelBooking` /
 * `editBooking`: an `editRefusal` gate, then one audited `mutate()` commit with
 * the audit metas allocated inside the recipe (the `reassignList` pattern).
 *
 * Domain logic lives here, not in components (PROGRESS convention 4). Every
 * write is audited and honours the role/source/state matrix.
 */

import type {
  BillingRoute,
  Attachment,
  Booking,
  BookingSource,
  IntegrationCorrelationRef,
  PatientPaymentCategory,
  Procedure,
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
import type { AppStoreApi } from './appStore'
import { editRefusal, getBooking } from './lifecycle'
import { newAttachment } from './attachmentActions'
import { upsertPatient, type PatientIntakeDetails } from './intake'
import { bookingsForList, listForSlot, proceduresForBooking } from './selectors'

// ---------------------------------------------------------------------------
// createBooking
// ---------------------------------------------------------------------------

export interface CreateBookingInput {
  /** Patient details — routed through the shared `upsertPatient` dedupe. */
  patient: PatientIntakeDetails
  scheduledTime?: string
  /** The procedure/operation description. */
  operation: string
  rvgBaseCode?: string
  /** Explicit billing route (the RFP: set explicitly, never derived). */
  billingRoute: BillingRoute
  insurerId?: string
  billablePartyId?: string
  patientPaymentCategory?: PatientPaymentCategory
  billingReference?: string
  notes?: string
  /** A photo/file to attach (the photo-capture path adds a `kind:'photo'` one). */
  attachment?: { name: string; kind: Attachment['kind']; dataUrl?: string }
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

/**
 * Create an ad-hoc Booking (the manual and photo paths share this — the photo path
 * simply pre-fills `input` and passes an attachment). Runs the shared
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
  if (input.operation.trim() === '') {
    return refuse('operationRequired', 'An operation description is required.')
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

    const attachments: Attachment[] = []
    if (input.attachment !== undefined) {
      const built = newAttachment(counters, input.attachment)
      counters = built.counters
      attachments.push(built.attachment)
    }

    const booking: Booking = {
      id: bookingId,
      listId,
      patientId,
      completed: false,
      attachments,
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
      description: input.operation.trim(),
      billingRoute: input.billingRoute,
      accRelated: false,
      isAdditional: false,
      selectedModifierCodes: [],
    }
    if (input.rvgBaseCode !== undefined) procedure.rvgBaseCode = input.rvgBaseCode
    if (input.insurerId !== undefined) procedure.insurerId = input.insurerId
    if (input.billablePartyId !== undefined) procedure.billablePartyId = input.billablePartyId
    if (input.patientPaymentCategory !== undefined) procedure.patientPaymentCategory = input.patientPaymentCategory
    if (input.billingReference !== undefined && input.billingReference.trim() !== '') {
      procedure.billingReference = input.billingReference.trim()
    }

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
        after: { description: procedure.description, billingRoute: input.billingRoute },
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
// copyBooking
// ---------------------------------------------------------------------------

/**
 * Copy a Booking (US-02.4.3; catch-up Phase 15). A NEW Booking with only the
 * skeleton: the same List and patient, and the source's billing reference (the
 * reading of "references" recorded in the Decisions log; never the hospital
 * appointment correlation, because a copy is a different appointment). It has
 * one fresh PRIMARY Procedure and inherits nothing else: no notes,
 * attachments, time, procedure details, insurer, billable party, payment
 * category or Contract. Additional Procedures are added inside a Booking with
 * `addProcedure`, which is the only additional-procedure path.
 *
 * `billingRoute: 'hospital'` is a DEFAULT, not an inheritance: the same
 * starting value the add flow offers any new Booking, so the anaesthetist can
 * capture and complete the copy without an office step (interim until Phase 20
 * replaces the route with the default hospital Contract). Audited
 * `booking.copy` + `procedure.create`; the source Booking is untouched.
 */
export function copyBooking(api: AppStoreApi, actor: Actor, sourceBookingId: string): Outcome<{ bookingId: string }> {
  const state = api.getState()
  const found = getBooking(state, sourceBookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  const { booking: source, list } = found
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights

  const billingReference = proceduresForBooking(state, sourceBookingId)[0]?.billingReference

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
      listId: source.listId,
      patientId: source.patientId,
      completed: false,
      copiedFromBookingId: sourceBookingId,
      source: 'copy',
      attachments: [],
      lastModifiedBy: actor.who,
      lastModifiedAtISO: atISO,
    }

    const procedure: Procedure = {
      id: procedureId,
      bookingId,
      description: '',
      billingRoute: 'hospital',
      accRelated: false,
      isAdditional: false,
      selectedModifierCodes: [],
    }
    if (billingReference !== undefined) procedure.billingReference = billingReference

    metas.push(
      {
        entityType: 'booking',
        entityId: bookingId,
        action: 'booking.copy',
        after: { copiedFromBookingId: sourceBookingId, listId: source.listId, patientId: source.patientId, source: 'copy' },
      },
      {
        entityType: 'procedure',
        entityId: procedureId,
        action: 'procedure.create',
        after:
          billingReference !== undefined
            ? { isAdditional: false, billingRoute: 'hospital', billingReference }
            : { isAdditional: false, billingRoute: 'hospital' },
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

  return ok({ bookingId })
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
 * It lands on the original anaesthetist's empty/free DRAFT List for today (AM
 * before PM) — an empty List is required because submission is completion-gated
 * for the whole List, so a shared List would block on incomplete siblings or
 * bill them together (same pattern as Phase 06 phone-advice booking). Refused
 * `noOpenSession` when neither of today's sessions is a free, empty DRAFT List.
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
  const candidates = (['AM', 'PM'] as const)
    .map((session) => listForSlot(state, anaesthetistId, todayISO, session))
    .filter((l): l is NonNullable<typeof l> => l !== undefined)
  const target = candidates.find(
    (l) =>
      l.state === 'DRAFT' &&
      l.statusKey === 'free' &&
      l.hospitalId === undefined &&
      l.surgeonId === undefined &&
      bookingsForList(state, l.id).filter((c) => c.cancellation === undefined).length === 0,
  )
  if (target === undefined) {
    return refuse(
      'noOpenSession',
      "No free, empty session is open today for this anaesthetist to hold the post-op addendum. Free one of today's sessions first.",
    )
  }

  const rights = editRefusal(actor, target)
  if (rights !== null) return rights

  const first = proceduresForBooking(state, originalBookingId)[0]

  let bookingId = ''
  const listId = target.id
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
      patientId: original.patientId,
      completed: false,
      bookingType: 'postOpAddendum',
      addendumOfBookingId: originalBookingId,
      // Interim until Phase 39 replaces the addendum: the source follows the actor.
      source: actor.role === 'office' ? 'admin' : 'anaesthetistAdHoc',
      attachments: [],
      lastModifiedBy: actor.who,
      lastModifiedAtISO: atISO,
    }

    const procedure: Procedure = {
      id: procedureId,
      bookingId,
      description: '',
      accRelated: false,
      isAdditional: false,
      selectedModifierCodes: [],
    }
    // Inherit the funding context (the same episode); the post-op event bills
    // its own B/T/M (not time-only — it is a distinct billable item).
    if (first?.billingRoute !== undefined) procedure.billingRoute = first.billingRoute
    if (first?.insurerId !== undefined) procedure.insurerId = first.insurerId
    if (first?.billablePartyId !== undefined) procedure.billablePartyId = first.billablePartyId
    if (first?.patientPaymentCategory !== undefined) {
      // A post-op event is never itself pre-paid: an inherited selfFundedPrepayment
      // downgrades to a post-procedure self-funded charge, else the addendum is born
      // demanding a pre-payment it has no deposit/detail for (and cannot complete).
      // prepaymentDetail is deliberately never inherited.
      procedure.patientPaymentCategory =
        first.patientPaymentCategory === 'selfFundedPrepayment' ? 'selfFundedPostProcedure' : first.patientPaymentCategory
    }
    if (first?.governingContractId !== undefined) procedure.governingContractId = first.governingContractId

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
      { entityType: 'procedure', entityId: procedureId, action: 'procedure.create', after: { bookingId } },
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

  return ok({ bookingId, listId })
}

// ---------------------------------------------------------------------------
// addProcedure
// ---------------------------------------------------------------------------

/**
 * Add an additional Procedure to an existing Booking (Phase 04's "Add another
 * procedure"). Additional from the first (RFP split-billing rule): it bills
 * time units only — base and modifier units stay on the first procedure. The
 * skeleton mirrors copyBooking's: empty description, `isAdditional: true`, the
 * funding context (route / insurer / billable party / category / contract)
 * inherited from the Booking's FIRST procedure. Audited `procedure.create`.
 */
export function addProcedure(api: AppStoreApi, actor: Actor, bookingId: string): Outcome<{ procedureId: string }> {
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

  let procedureId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const procAlloc = allocateId(s.counters, 'procedure')
    procedureId = procAlloc.id

    const procedure: Procedure = {
      id: procedureId,
      bookingId,
      description: '',
      accRelated: false,
      isAdditional: true,
      selectedModifierCodes: [],
    }
    // Inherit the funding context only (the same episode) — never the base /
    // modifier / time specifics.
    if (first?.billingRoute !== undefined) procedure.billingRoute = first.billingRoute
    if (first?.insurerId !== undefined) procedure.insurerId = first.insurerId
    if (first?.billablePartyId !== undefined) procedure.billablePartyId = first.billablePartyId
    if (first?.patientPaymentCategory !== undefined) procedure.patientPaymentCategory = first.patientPaymentCategory
    if (first?.governingContractId !== undefined) procedure.governingContractId = first.governingContractId

    metas.push({
      entityType: 'procedure',
      entityId: procedureId,
      action: 'procedure.create',
      after: { bookingId, isAdditional: true },
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
 *    ones deliberately do not, and its position feeds Type 3 second-procedure
 *    pricing. Deleting it would leave a Booking billing time units only, and
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
