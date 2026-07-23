/**
 * Lifecycle guards (PROGRESS convention 6). DRAFT → SUBMITTED → AUTHORISED is
 * strictly ordered; SUBMITTED strips anaesthetist edit rights; AUTHORISED
 * locks Cards immutable; there is NO Returned transition anywhere. UI can
 * never bypass a guard — every guard returns an `Outcome` (refusals as data;
 * Phase 11's monitor turns integration refusals into manual-intervention
 * items).
 *
 * The RFP state table, as enforced here:
 *   - anaesthetist: edits own DRAFT Lists' Cards only;
 *   - office: edits DRAFT and SUBMITTED; authorises; nobody edits AUTHORISED;
 *   - integration-sourced writes only while the List is DRAFT.
 */

import type { Card, CoverRequest, List, ListPhoneNote, ListStatusKey, Procedure, Session } from '../domain/types'
import { validateCardForBilling } from '../domain/billing/validateCardForBilling'
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
import { billingContextForCard, cardsForList, listForSlot, prepaymentStatusFor, proceduresForCard } from './selectors'
import { emitAppEvent } from './events'

// ---------------------------------------------------------------------------
// Shared checks
// ---------------------------------------------------------------------------

export function getCard(state: AppState, cardId: string): { card: Card; list: List } | undefined {
  const card = state.schedule.cards[cardId]
  if (card === undefined) return undefined
  const list = state.schedule.lists[card.listId]
  if (list === undefined) return undefined
  return { card, list }
}

/**
 * The edit-rights matrix for Card/Procedure writes. Returns a refusal outcome
 * or null when the write may proceed. Exported so the Phase 03 card-creation
 * and patient-edit guards apply the identical role/source/state gate.
 */
export function editRefusal(actor: Actor, list: List): Outcome<never> | null {
  if (list.state === 'AUTHORISED') {
    return refuse('listAuthorised', 'This List is authorised and its Cards are locked. No edits are possible.')
  }
  if (actor.source === 'integration') {
    if (list.state !== 'DRAFT') {
      return refuse(
        'integrationImmutable',
        'An integration update cannot change a submitted List. This message needs manual intervention.',
      )
    }
    return null
  }
  if (actor.role === 'anaesthetist') {
    if (actor.anaesthetistId !== undefined && actor.anaesthetistId !== list.anaesthetistId) {
      return refuse('notOwnList', 'Anaesthetists can only change Cards on their own Lists.')
    }
    if (list.state !== 'DRAFT') {
      return refuse('listSubmitted', 'This List has been submitted. Only the office can change it now.')
    }
    return null
  }
  // office / system: DRAFT and SUBMITTED are editable.
  return null
}

// ---------------------------------------------------------------------------
// completeCard
// ---------------------------------------------------------------------------

/**
 * An ordered completion blocker. Phase 09's pre-payment gate slots in as a
 * second entry in the list `completionBlockersFor` builds — no restructuring.
 */
export interface CompletionBlocker {
  code: string
  message: string
  details?: unknown
}

/**
 * Why a Card cannot be marked complete, without attempting the mutation.
 * `completeCard` refuses on the first entry; the mobile submit sheet uses the
 * full list to name each incomplete card's outstanding failures (Phase 04).
 */
export function completionBlockersFor(state: AppState, card: Card): CompletionBlocker[] {
  const blockers: CompletionBlocker[] = []

  const ctx = billingContextForCard(state, card)
  if (ctx === undefined) {
    blockers.push({ code: 'missingContext', message: 'This Card is missing its List or anaesthetist.' })
    return blockers
  }
  const failures = validateCardForBilling(card, proceduresForCard(state, card.id), ctx)
  if (failures.length > 0) {
    blockers.push({
      code: 'validationFailed',
      message: `This Card is missing required billing data (${failures.length} ${failures.length === 1 ? 'item' : 'items'}).`,
      details: failures,
    })
  }

  // Pre-payment gate (B7; Phase 09): "payment must be collected before the
  // procedure proceeds". completeCard is the last checkpoint the prototype
  // controls, so an unpaid selfFundedPrepayment card is blocked here — liftable
  // only by the audited `overridePrepaymentGate` (which sets prepaymentOverride,
  // moving the status to 'overridden') or a paid pre-invoice (status 'paid').
  const prepayment = prepaymentStatusFor(state, card.id)
  if (prepayment === 'required' || prepayment === 'outstanding') {
    blockers.push({
      code: 'prepaymentUnpaid',
      message:
        prepayment === 'required'
          ? 'Pre-payment is required for this Card and no pre-procedure invoice has been raised yet. Raise and collect the pre-payment, or record an office override, before completing.'
          : 'The pre-procedure invoice for this Card is unpaid. Collect the pre-payment, or record an office override, before completing.',
    })
  }

  return blockers
}

/** Mark a Card completed — blocked unless `validateCardForBilling` passes. */
export function completeCard(api: AppStoreApi, actor: Actor, cardId: string): Outcome {
  const state = api.getState()
  const found = getCard(state, cardId)
  if (found === undefined) return refuse('notFound', 'Card not found.')
  const { card, list } = found

  if (card.cancellation !== undefined) {
    return refuse('cardCancelled', 'This Card is cancelled and cannot be completed.')
  }
  if (actor.source === 'integration') {
    return refuse('integrationForbidden', 'Integrations never complete Cards; completion is a clinical sign-off.')
  }
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights
  if (card.completed) return refuse('alreadyCompleted', 'This Card is already completed.')

  const blockers = completionBlockersFor(state, card)
  const first = blockers[0]
  if (first !== undefined) return refuse(first.code, first.message, blockers)

  mutate(
    api,
    actor,
    {
      entityType: 'card',
      entityId: cardId,
      action: 'card.complete',
      before: { completed: false },
      after: { completed: true },
    },
    (s) => ({
      schedule: {
        ...s.schedule,
        cards: {
          ...s.schedule.cards,
          [cardId]: { ...card, completed: true, completedAtISO: clockISO(s.clock) },
        },
      },
    }),
  )
  return ok(undefined)
}

/**
 * Re-open a completed Card (Phase 04's "Amend" link). The anaesthetist amends
 * their own Card while the List is DRAFT; the office may re-open on DRAFT or
 * SUBMITTED (the standard edit-rights matrix). Completion is a clinical
 * sign-off, so integrations never take it back either — mirrors completeCard.
 */
export function uncompleteCard(api: AppStoreApi, actor: Actor, cardId: string): Outcome {
  const state = api.getState()
  const found = getCard(state, cardId)
  if (found === undefined) return refuse('notFound', 'Card not found.')
  const { card, list } = found

  if (card.cancellation !== undefined) {
    return refuse('cardCancelled', 'This Card is cancelled; there is no completion to amend.')
  }
  if (!card.completed) return refuse('notCompleted', 'This Card is not marked complete.')
  if (actor.source === 'integration') {
    return refuse('integrationForbidden', 'Integrations never re-open Cards; completion is a clinical sign-off.')
  }
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights

  mutate(
    api,
    actor,
    {
      entityType: 'card',
      entityId: cardId,
      action: 'card.uncomplete',
      before: { completed: true },
      after: { completed: false },
    },
    (s) => {
      const next: Card = { ...card, completed: false }
      delete next.completedAtISO
      return {
        schedule: { ...s.schedule, cards: { ...s.schedule.cards, [cardId]: next } },
      }
    },
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// submitList / authoriseList
// ---------------------------------------------------------------------------

/**
 * DRAFT → SUBMITTED. Completion-gated: every non-cancelled Card must be
 * marked Completed (validation alone is not enough); a cancelled Card never
 * blocks.
 */
export function submitList(api: AppStoreApi, actor: Actor, listId: string): Outcome {
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  if (list.state !== 'DRAFT') {
    return refuse('listNotDraft', 'Only a draft List can be submitted.')
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

  const incomplete = cardsForList(state, listId).filter((c) => c.cancellation === undefined && !c.completed)
  if (incomplete.length > 0) {
    return refuse(
      'cardsNotCompleted',
      `Every Card must be completed before submission (${incomplete.length} to finish).`,
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
      before: { state: 'DRAFT' },
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
 * SUBMITTED → AUTHORISED (strictly ordered — a DRAFT List can never jump).
 * Office only. Locks the List's Cards immutable and emits `listAuthorised`
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
 * an annotation, not a Card edit. There is NO return-to-anaesthetist action
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
      stampCardId: null,
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
// cancelCard
// ---------------------------------------------------------------------------

/**
 * Audited soft-cancel (7th review B23) — the legacy "Delete Card",
 * modernised. The Card is retained and visible, excluded from validation and
 * billing; never a hard delete. Phase 11's S15 message calls this same guard
 * with source=integration (DRAFT Lists only).
 */
export function cancelCard(api: AppStoreApi, actor: Actor, cardId: string, reason: string): Outcome {
  const state = api.getState()
  const found = getCard(state, cardId)
  if (found === undefined) return refuse('notFound', 'Card not found.')
  const { card, list } = found

  if (reason.trim() === '') {
    return refuse('reasonRequired', 'A cancellation reason is required.')
  }
  if (card.cancellation !== undefined) {
    return refuse('alreadyCancelled', 'This Card is already cancelled.')
  }
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights

  mutate(
    api,
    actor,
    {
      entityType: 'card',
      entityId: cardId,
      action: 'card.cancel',
      after: { cancelled: true, reason: reason.trim() },
    },
    (s) => ({
      schedule: {
        ...s.schedule,
        cards: {
          ...s.schedule.cards,
          [cardId]: {
            ...card,
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
// editCard / editProcedure (the guarded patch entry points)
// ---------------------------------------------------------------------------

export type CardPatch = Partial<Pick<Card, 'scheduledTime' | 'notes' | 'attachments'>>

export function editCard(api: AppStoreApi, actor: Actor, cardId: string, patch: CardPatch): Outcome {
  const state = api.getState()
  const found = getCard(state, cardId)
  if (found === undefined) return refuse('notFound', 'Card not found.')
  const { card, list } = found
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights

  mutate(
    api,
    actor,
    {
      entityType: 'card',
      entityId: cardId,
      action: 'card.update',
      before: Object.fromEntries(Object.keys(patch).map((k) => [k, card[k as keyof Card]])),
      after: patch,
    },
    (s) => ({
      schedule: {
        ...s.schedule,
        cards: { ...s.schedule.cards, [cardId]: { ...card, ...patch } },
      },
    }),
  )
  return ok(undefined)
}

export type ProcedurePatch = Partial<Omit<Procedure, 'id' | 'cardId'>>

export function editProcedure(
  api: AppStoreApi,
  actor: Actor,
  procedureId: string,
  patch: ProcedurePatch,
): Outcome {
  const state = api.getState()
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined) return refuse('notFound', 'Procedure not found.')
  const found = getCard(state, procedure.cardId)
  if (found === undefined) return refuse('notFound', 'The procedure has no Card.')
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
 * matrix (office edits DRAFT and SUBMITTED; the anaesthetist only their own
 * DRAFT; AUTHORISED blocked). An empty string (or explicit undefined) on a key
 * present in the patch clears that field. Audited `list.update`, stamps no Card.
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
      stampCardId: null,
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
// reassignList / reassignCard
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
  const targetCards = cardsForList(state, target.id)
  if (target.statusKey !== 'free' || target.state !== 'DRAFT' || targetCards.length > 0) {
    return refuse('targetNotFree', 'The target session must be Free to receive a reassigned List.')
  }

  const metas: MutationMeta[] = [
    {
      entityType: 'list',
      entityId: source.id,
      action: 'list.reassign',
      before: { anaesthetistId: source.anaesthetistId },
      after: { anaesthetistId: toAnaesthetistId },
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
    lists[source.id] = { ...source, anaesthetistId: toAnaesthetistId }
    lists[id] = {
      id,
      dateISO: source.dateISO,
      anaesthetistId: source.anaesthetistId,
      session: source.session,
      state: 'DRAFT',
      statusKey: vacatedStatus,
      conflicts: [],
    }
    return { schedule: { ...s.schedule, lists }, counters }
  })
  return ok({ movedListId: source.id, regeneratedListId })
}

/**
 * Move one Card (with its Procedures) to a different List — the RFP's routine
 * single-booking move, audited at Card level. Neither List's status or other
 * Cards change. Blocked when either List is AUTHORISED; a SUBMITTED target is
 * allowed for the office (the all-Cards-completed rule gates the
 * DRAFT→SUBMITTED transition, not later office rebooking).
 */
export function reassignCard(api: AppStoreApi, actor: Actor, cardId: string, toListId: string): Outcome {
  const state = api.getState()
  const found = getCard(state, cardId)
  if (found === undefined) return refuse('notFound', 'Card not found.')
  const { card, list: source } = found
  const target = state.schedule.lists[toListId]
  if (target === undefined) return refuse('notFound', 'Target List not found.')
  if (target.id === source.id) return refuse('sameList', 'The Card is already on that List.')

  if (source.state === 'AUTHORISED' || target.state === 'AUTHORISED') {
    return refuse('listAuthorised', 'Cards on an authorised List are locked; an authorised List cannot receive Cards.')
  }
  if (actor.source === 'integration') {
    if (source.state !== 'DRAFT' || target.state !== 'DRAFT') {
      return refuse(
        'integrationImmutable',
        'An integration update can only move a Card between draft Lists. This message needs manual intervention.',
      )
    }
  } else if (actor.role === 'anaesthetist') {
    if (
      actor.anaesthetistId !== undefined &&
      (actor.anaesthetistId !== source.anaesthetistId || actor.anaesthetistId !== target.anaesthetistId)
    ) {
      return refuse('notOwnList', 'Anaesthetists can only move Cards between their own Lists.')
    }
    if (source.state !== 'DRAFT' || target.state !== 'DRAFT') {
      return refuse('listSubmitted', 'This List has been submitted. Only the office can change it now.')
    }
  }

  mutate(
    api,
    actor,
    {
      entityType: 'card',
      entityId: cardId,
      action: 'card.reassign',
      before: { listId: source.id },
      after: { listId: target.id },
    },
    (s) => ({
      schedule: {
        ...s.schedule,
        cards: { ...s.schedule.cards, [cardId]: { ...card, listId: target.id } },
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
 * no hospital, no surgeon, no active Cards) restatuses; anything carrying
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
    const activeCards = cardsForList(state, list.id).filter((c) => c.cancellation === undefined)
    const unreserved =
      list.hospitalId === undefined && list.surgeonId === undefined && activeCards.length === 0
    if (kind === 'holiday' || kind === 'unavailable') {
      if (list.statusKey === 'free' && unreserved && list.state === 'DRAFT') reconciled = 'restatused'
      else reconciled = 'conflictFlagged'
    } else {
      if ((list.statusKey === 'holiday' || list.statusKey === 'unavailable') && unreserved && list.state === 'DRAFT') {
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
