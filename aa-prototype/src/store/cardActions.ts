/**
 * Card-creation guards (Phase 03) — the ad-hoc/manual + photo path and the
 * additional-procedure Card Copy (M6). Modelled exactly on `cancelCard` /
 * `editCard`: an `editRefusal` gate, then one audited `mutate()` commit with
 * the audit metas allocated inside the recipe (the `reassignList` pattern).
 *
 * Domain logic lives here, not in components (PROGRESS convention 4). Every
 * write is audited and honours the role/source/state matrix.
 */

import type {
  BillingRoute,
  Card,
  CardAttachment,
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
import { editRefusal, getCard } from './lifecycle'
import { upsertPatient, type PatientIntakeDetails } from './intake'
import { cardsForList, listForSlot, proceduresForCard } from './selectors'

// ---------------------------------------------------------------------------
// createCard
// ---------------------------------------------------------------------------

export interface CreateCardInput {
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
  attachment?: { name: string; kind: CardAttachment['kind']; dataUrl?: string }
  /**
   * Integration provenance (Phase 11): the `{sourceFeedId, externalAppointmentId}`
   * correlation ref an HL7/FHIR create stamps, so later S13/S14/S15 messages
   * locate this Card by its appointment id. Backward-compatible: manual/photo/
   * PDF paths omit it.
   */
  correlationRef?: IntegrationCorrelationRef
}

/**
 * Create an ad-hoc Card (the manual and photo paths share this — the photo path
 * simply pre-fills `input` and passes an attachment). Runs the shared
 * `upsertPatient` first (NHI dedupe: reuse or create), then creates the Card
 * and its first Procedure (`isAdditional:false`), audited `card.create` +
 * `procedure.create`. The patient audit comes from `upsertPatient`.
 */
export function createCard(
  api: AppStoreApi,
  actor: Actor,
  listId: string,
  input: CreateCardInput,
): Outcome<{ cardId: string; patientId: string }> {
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights
  if (input.operation.trim() === '') {
    return refuse('operationRequired', 'An operation description is required.')
  }

  // Shared intake dedupe — may reuse an existing Patient or create one. A bad
  // NHI is surfaced verbatim before any Card is created.
  const intake = upsertPatient(api, actor, input.patient)
  if (!intake.ok) return intake
  const patientId = intake.value.patient.hiddenInternalId

  let cardId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    let counters = s.counters
    const cardAlloc = allocateId(counters, 'card')
    counters = cardAlloc.counters
    cardId = cardAlloc.id
    const procAlloc = allocateId(counters, 'procedure')
    counters = procAlloc.counters
    const procedureId = procAlloc.id
    const atISO = clockISO(s.clock)

    const attachments: CardAttachment[] = []
    if (input.attachment !== undefined) {
      const attachment: CardAttachment = {
        id: `${cardId}-A1`,
        name: input.attachment.name,
        kind: input.attachment.kind,
      }
      if (input.attachment.dataUrl !== undefined) attachment.dataUrl = input.attachment.dataUrl
      attachments.push(attachment)
    }

    const card: Card = {
      id: cardId,
      listId,
      patientId,
      completed: false,
      attachments,
      lastModifiedBy: actor.who,
      lastModifiedAtISO: atISO,
    }
    if (input.scheduledTime !== undefined) card.scheduledTime = input.scheduledTime
    if (input.notes !== undefined && input.notes.trim() !== '') card.notes = input.notes.trim()
    if (input.correlationRef !== undefined) card.correlationRef = input.correlationRef

    const procedure: Procedure = {
      id: procedureId,
      cardId,
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
      { entityType: 'card', entityId: cardId, action: 'card.create', after: { listId, patientId } },
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
        cards: { ...s.schedule.cards, [cardId]: card },
        procedures: { ...s.schedule.procedures, [procedureId]: procedure },
      },
      counters,
    }
  })

  return ok({ cardId, patientId })
}

// ---------------------------------------------------------------------------
// copyCard
// ---------------------------------------------------------------------------

/**
 * Card Copy — the RFP's additional-procedure mechanism (M6; 3rd review #2). The
 * copy lands in the SAME List, records `copiedFromCardId`, reuses the patient,
 * and clears notes/attachments and completion. Its one skeleton Procedure is
 * `isAdditional:true` from the first (Phase 04 renders it time-only, base and
 * modifiers structurally disabled) so copy cannot double-charge base units the
 * original Card already claimed. Billing route/context inherit from the
 * source's first procedure. Audited `card.copy` + `procedure.create`.
 */
export function copyCard(api: AppStoreApi, actor: Actor, sourceCardId: string): Outcome<{ cardId: string }> {
  const state = api.getState()
  const found = getCard(state, sourceCardId)
  if (found === undefined) return refuse('notFound', 'Card not found.')
  const { card: source, list } = found
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights

  const first = proceduresForCard(state, sourceCardId)[0]

  let cardId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    let counters = s.counters
    const cardAlloc = allocateId(counters, 'card')
    counters = cardAlloc.counters
    cardId = cardAlloc.id
    const procAlloc = allocateId(counters, 'procedure')
    counters = procAlloc.counters
    const procedureId = procAlloc.id
    const atISO = clockISO(s.clock)

    const card: Card = {
      id: cardId,
      listId: source.listId,
      patientId: source.patientId,
      completed: false,
      copiedFromCardId: sourceCardId,
      attachments: [],
      lastModifiedBy: actor.who,
      lastModifiedAtISO: atISO,
    }
    if (source.scheduledTime !== undefined) card.scheduledTime = source.scheduledTime

    const procedure: Procedure = {
      id: procedureId,
      cardId,
      description: '',
      accRelated: false,
      isAdditional: true,
      selectedModifierCodes: [],
    }
    // Inherit the funding context only (the same episode), never the base /
    // modifier / time specifics — those are cleared for the additional line.
    if (first?.billingRoute !== undefined) procedure.billingRoute = first.billingRoute
    if (first?.insurerId !== undefined) procedure.insurerId = first.insurerId
    if (first?.billablePartyId !== undefined) procedure.billablePartyId = first.billablePartyId
    if (first?.patientPaymentCategory !== undefined) procedure.patientPaymentCategory = first.patientPaymentCategory
    if (first?.governingContractId !== undefined) procedure.governingContractId = first.governingContractId

    metas.push(
      {
        entityType: 'card',
        entityId: cardId,
        action: 'card.copy',
        after: { copiedFromCardId: sourceCardId, listId: source.listId, patientId: source.patientId },
      },
      { entityType: 'procedure', entityId: procedureId, action: 'procedure.create', after: { isAdditional: true } },
    )
    return {
      schedule: {
        ...s.schedule,
        cards: { ...s.schedule.cards, [cardId]: card },
        procedures: { ...s.schedule.procedures, [procedureId]: procedure },
      },
      counters,
    }
  })

  return ok({ cardId })
}

// ---------------------------------------------------------------------------
// addPostOpAddendum
// ---------------------------------------------------------------------------

/**
 * Post-op addendum (B8; Phase 09) — a post-procedure charge against a
 * billed/locked episode (e.g. an HDU review, pain consult, nerve catheter).
 * The RFP's immutability answer: the original Card stays LOCKED; the addendum
 * is a NEW linked Card (`cardType: 'postOpAddendum'`, `addendumOfCardId`) that
 * runs its own capture -> submit -> authorise -> bill cycle.
 *
 * It lands on the original anaesthetist's empty/free DRAFT List for today (AM
 * before PM) — an empty List is required because submission is completion-gated
 * for the whole List, so a shared List would block on incomplete siblings or
 * bill them together (same pattern as Phase 06 phone-advice booking). Refused
 * `noOpenSession` when neither of today's sessions is a free, empty DRAFT List.
 * The patient is reused; the billing setup is inherited from the original's
 * first procedure. Audited `card.create` + `procedure.create`; original untouched.
 */
export function addPostOpAddendum(
  api: AppStoreApi,
  actor: Actor,
  originalCardId: string,
): Outcome<{ cardId: string; listId: string }> {
  const state = api.getState()
  const found = getCard(state, originalCardId)
  if (found === undefined) return refuse('notFound', 'Card not found.')
  const { card: original, list: originalList } = found

  if (originalList.state !== 'AUTHORISED') {
    return refuse(
      'notAuthorised',
      'A post-op addendum is only added to a locked (authorised) episode. The original Card is not authorised yet.',
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
      cardsForList(state, l.id).filter((c) => c.cancellation === undefined).length === 0,
  )
  if (target === undefined) {
    return refuse(
      'noOpenSession',
      "No free, empty session is open today for this anaesthetist to hold the post-op addendum. Free one of today's sessions first.",
    )
  }

  const rights = editRefusal(actor, target)
  if (rights !== null) return rights

  const first = proceduresForCard(state, originalCardId)[0]

  let cardId = ''
  const listId = target.id
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    let counters = s.counters
    const cardAlloc = allocateId(counters, 'card')
    counters = cardAlloc.counters
    cardId = cardAlloc.id
    const procAlloc = allocateId(counters, 'procedure')
    counters = procAlloc.counters
    const procedureId = procAlloc.id
    const atISO = clockISO(s.clock)

    const card: Card = {
      id: cardId,
      listId,
      patientId: original.patientId,
      completed: false,
      cardType: 'postOpAddendum',
      addendumOfCardId: originalCardId,
      attachments: [],
      lastModifiedBy: actor.who,
      lastModifiedAtISO: atISO,
    }

    const procedure: Procedure = {
      id: procedureId,
      cardId,
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
        entityType: 'card',
        entityId: cardId,
        action: 'card.create',
        after: { listId, patientId: original.patientId, cardType: 'postOpAddendum', addendumOfCardId: originalCardId },
      },
      { entityType: 'procedure', entityId: procedureId, action: 'procedure.create', after: { cardId } },
    )
    return {
      schedule: {
        ...s.schedule,
        cards: { ...s.schedule.cards, [cardId]: card },
        procedures: { ...s.schedule.procedures, [procedureId]: procedure },
      },
      counters,
    }
  })

  return ok({ cardId, listId })
}

// ---------------------------------------------------------------------------
// addProcedure
// ---------------------------------------------------------------------------

/**
 * Add an additional Procedure to an existing Card (Phase 04's "Add another
 * procedure"). Additional from the first (RFP split-billing rule): it bills
 * time units only — base and modifier units stay on the first procedure. The
 * skeleton mirrors copyCard's: empty description, `isAdditional: true`, the
 * funding context (route / insurer / billable party / category / contract)
 * inherited from the Card's FIRST procedure. Audited `procedure.create`.
 */
export function addProcedure(api: AppStoreApi, actor: Actor, cardId: string): Outcome<{ procedureId: string }> {
  const state = api.getState()
  const found = getCard(state, cardId)
  if (found === undefined) return refuse('notFound', 'Card not found.')
  const { card, list } = found

  if (card.cancellation !== undefined) {
    return refuse('cardCancelled', 'This Card is cancelled and cannot take another procedure.')
  }
  if (card.completed) {
    return refuse('cardCompleted', 'This Card is already marked complete. Amend it before adding a procedure.')
  }
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights

  const first = proceduresForCard(state, cardId)[0]

  let procedureId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const procAlloc = allocateId(s.counters, 'procedure')
    procedureId = procAlloc.id

    const procedure: Procedure = {
      id: procedureId,
      cardId,
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
      after: { cardId, isAdditional: true },
    })
    return {
      schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [procedureId]: procedure } },
      counters: procAlloc.counters,
    }
  })

  return ok({ procedureId })
}
