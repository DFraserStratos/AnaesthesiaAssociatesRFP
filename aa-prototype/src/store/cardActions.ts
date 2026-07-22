/**
 * Card-creation guards (Phase 03) — the ad-hoc/manual + photo path and the
 * additional-procedure Card Copy (M6). Modelled exactly on `cancelCard` /
 * `editCard`: an `editRefusal` gate, then one audited `mutate()` commit with
 * the audit metas allocated inside the recipe (the `reassignList` pattern).
 *
 * Domain logic lives here, not in components (PROGRESS convention 4). Every
 * write is audited and honours the role/source/state matrix.
 */

import type { BillingRoute, Card, CardAttachment, PatientPaymentCategory, Procedure } from '../domain/types'
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
import { proceduresForCard } from './selectors'

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
