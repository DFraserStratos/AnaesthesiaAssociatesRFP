/**
 * Integration processing (Phase 11) — the store side of the HL7/FHIR + PDF
 * story. Pure translation lives in `domain/integrations`; this module APPLIES a
 * parsed message to the schedule through the SAME audited write-paths the manual
 * app uses (`createCard`/`editCard`/`reassignCard`/`cancelCard`, patients via
 * `upsertPatient`), always with an `source:'integration'` actor. That is what
 * makes the lifecycle source guard, the validators and `upsertPatient`'s
 * ethnicity quarantine load-bearing here — no integration-specific domain maths.
 *
 * Correlation keys do two jobs: MSH-10 dedupes MESSAGES (a replay is a no-op,
 * logged `duplicate`); the SCH-2 appointment id correlates APPOINTMENTS
 * (S13/S14/S15 locate their Card by `{sourceFeedId, externalAppointmentId}`).
 *
 * Reliability: `MAX_ATTEMPTS` retries. A transient fault fails once then
 * succeeds; a deterministic fault (a bad NHI under a wrong mapping) fails every
 * time and exhausts the budget into `deadLetter`; a locked target (a
 * non-DRAFT List) or an unmatched appointment parks as `manualIntervention`.
 * "Retried" is a derived display label (processed with attempts > 1), never a
 * stored status. Tests drive `processMessage`/`retryMessage` synchronously; the
 * UI wires a short-timer auto-retry (`wireIntegrationRetry`).
 */

import type { IntegrationMessage } from '../domain/types'
import { validateEthnicityCode } from '../domain/nzhis'
import { validateNhi } from '../domain/nhi'
import {
  cannedMessage,
  extractFromFhir,
  extractViaMapping,
  FEED_META,
  type CannedMessage,
  type ParsedMessage,
  type SurgeonPdf,
} from '../domain/integrations'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi, BoundAppStore } from './appStore'
import { createCard } from './cardActions'
import { cancelCard, editCard, editProcedure, reassignCard, type CardPatch } from './lifecycle'
import { cardsOnListByNhi, findCardByCorrelation, listForSlot, proceduresForCard } from './selectors'

export const MAX_ATTEMPTS = 3

type PdfRow = SurgeonPdf['rows'][number]

function integrationActor(feedId: string): Actor {
  return { who: FEED_META[feedId]?.actorLabel ?? 'Integration feed', role: 'system', source: 'integration' }
}

function timeToSession(time: string | undefined): 'AM' | 'PM' {
  if (time === undefined) return 'AM'
  const hour = Number(time.slice(0, 2))
  return Number.isFinite(hour) && hour >= 12 ? 'PM' : 'AM'
}

// ---------------------------------------------------------------------------
// Message-log row writers
// ---------------------------------------------------------------------------

interface RowInit {
  status: IntegrationMessage['status']
  attempts: number
  failureReason?: string
  patientRef?: string
  resultCardId?: string
}

function createMessageRow(api: AppStoreApi, actor: Actor, canned: CannedMessage, init: RowInit): string {
  let id = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'integrationMessage')
    id = alloc.id
    const atISO = clockISO(s.clock)
    const row: IntegrationMessage = {
      id,
      feedId: canned.feedId,
      messageControlId: canned.id,
      eventType: canned.eventType,
      status: init.status,
      attempts: init.attempts,
      receivedAtISO: atISO,
      updatedAtISO: atISO,
      correlationRef: { sourceFeedId: canned.feedId, externalAppointmentId: canned.correlationAppointmentId },
    }
    if (init.failureReason !== undefined) row.failureReason = init.failureReason
    if (init.patientRef !== undefined) row.patientRef = init.patientRef
    if (init.resultCardId !== undefined) row.resultCardId = init.resultCardId
    metas.push({
      entityType: 'integrationMessage',
      entityId: id,
      action: 'integration.receive',
      after: { status: init.status, feed: canned.feedId, event: canned.eventType },
      stampCardId: null,
    })
    return {
      integrations: { ...s.integrations, messages: { ...s.integrations.messages, [id]: row } },
      counters: alloc.counters,
    }
  })
  return id
}

function updateMessageRow(
  api: AppStoreApi,
  actor: Actor,
  rowId: string,
  patch: Partial<IntegrationMessage>,
  action = 'integration.process',
): void {
  const state = api.getState()
  const existing = state.integrations.messages[rowId]
  if (existing === undefined) return
  mutate(
    api,
    actor,
    {
      entityType: 'integrationMessage',
      entityId: rowId,
      action,
      before: { status: existing.status, attempts: existing.attempts },
      after: { status: patch.status ?? existing.status, attempts: patch.attempts ?? existing.attempts },
      stampCardId: null,
    },
    (s) => {
      const cur = s.integrations.messages[rowId]
      if (cur === undefined) return {}
      const next: IntegrationMessage = { ...cur, ...patch, updatedAtISO: clockISO(s.clock) }
      return { integrations: { ...s.integrations, messages: { ...s.integrations.messages, [rowId]: next } } }
    },
  )
}

// ---------------------------------------------------------------------------
// Effect application (routes a parsed message to the audited write-paths)
// ---------------------------------------------------------------------------

function applyEffect(
  api: AppStoreApi,
  actor: Actor,
  parsed: ParsedMessage,
  canned: CannedMessage,
): Outcome<{ cardId: string }> {
  const appointmentId = parsed.appointmentId ?? canned.correlationAppointmentId

  if (canned.eventType === 'S12') {
    const routing = canned.routing
    if (routing === undefined) return refuse('noTargetList', 'This booking has no target session configured.')
    const list = listForSlot(api.getState(), routing.anaesthetistId, routing.dateISO, routing.session)
    if (list === undefined) return refuse('noTargetList', 'The target session for this booking does not exist on the canvas.')
    const outcome = createCard(api, actor, list.id, {
      patient: {
        ...(parsed.patient.nhi !== undefined ? { nhi: parsed.patient.nhi } : {}),
        name: parsed.patient.name ?? 'Unknown patient',
        dobISO: parsed.patient.dobISO ?? '',
        ...(parsed.patient.ethnicityCode !== undefined ? { ethnicityCode: parsed.patient.ethnicityCode } : {}),
      },
      operation: parsed.operation ?? 'Procedure (from feed)',
      billingRoute: 'hospital',
      ...(parsed.scheduledTime !== undefined ? { scheduledTime: parsed.scheduledTime } : {}),
      correlationRef: { sourceFeedId: canned.feedId, externalAppointmentId: appointmentId },
    })
    if (!outcome.ok) return outcome
    return ok({ cardId: outcome.value.cardId })
  }

  // Modify events locate the Card by its appointment correlation ref.
  const card = findCardByCorrelation(api.getState(), { sourceFeedId: canned.feedId, externalAppointmentId: appointmentId })
  if (card === undefined) {
    return refuse('noMatch', 'No booking matches this appointment id. Parked for the office to reconcile.')
  }
  const currentList = api.getState().schedule.lists[card.listId]
  if (currentList === undefined) return refuse('noMatch', 'The matched Card has no List. Parked for the office.')
  // A stale update for an appointment the office already cancelled is not applied
  // (integrations never edit a soft-cancelled Card); it parks for reconciliation.
  if (card.cancellation !== undefined) {
    return refuse('cardCancelled', 'The matched appointment is cancelled. This update is not applied; the office should reconcile it.')
  }

  if (canned.eventType === 'S13') {
    const target =
      parsed.scheduledDateISO !== undefined
        ? listForSlot(api.getState(), currentList.anaesthetistId, parsed.scheduledDateISO, timeToSession(parsed.scheduledTime))
        : undefined
    if (target !== undefined && target.id !== card.listId) {
      // Cross-List reschedule: move the Card FIRST (the guarded, refusable step),
      // then set the new time. Reassign-before-edit means a refused move commits
      // nothing, so a locked target never strands a time change on the source Card.
      const moved = reassignCard(api, actor, card.id, target.id)
      if (!moved.ok) return moved
      if (parsed.scheduledTime !== undefined) {
        const timed = editCard(api, actor, card.id, { scheduledTime: parsed.scheduledTime })
        if (!timed.ok) return timed
      }
      return ok({ cardId: card.id })
    }
    // Same-List reschedule: a scheduledTime change.
    const patch: CardPatch = {}
    if (parsed.scheduledTime !== undefined) patch.scheduledTime = parsed.scheduledTime
    const retimed = editCard(api, actor, card.id, patch)
    if (!retimed.ok) return retimed
    return ok({ cardId: card.id })
  }

  if (canned.eventType === 'S14') {
    const patch: CardPatch = {}
    if (parsed.scheduledTime !== undefined) patch.scheduledTime = parsed.scheduledTime
    if (parsed.note !== undefined) patch.notes = parsed.note
    const modified = editCard(api, actor, card.id, patch)
    if (!modified.ok) return modified
    return ok({ cardId: card.id })
  }

  if (canned.eventType === 'S15') {
    const cancelled = cancelCard(api, actor, card.id, parsed.cancelReason ?? 'Cancelled by the hospital feed')
    if (!cancelled.ok) return cancelled
    return ok({ cardId: card.id })
  }

  return refuse('unknownEvent', `Unsupported event type ${canned.eventType}.`)
}

// ---------------------------------------------------------------------------
// processMessage / retryMessage / reprocessMessage
// ---------------------------------------------------------------------------

function attemptMessage(api: AppStoreApi, rowId: string): Outcome<{ outcome: string; cardId?: string }> {
  const state = api.getState()
  const row = state.integrations.messages[rowId]
  if (row === undefined) return refuse('notFound', 'Message not found.')
  const canned = cannedMessage(row.messageControlId)
  if (canned === undefined) return refuse('unknownMessage', 'No canned message matches this control id.')
  const feed = state.integrations.feeds[canned.feedId]
  if (feed === undefined) return refuse('unknownFeed', 'The feed for this message is not configured.')
  const actor = integrationActor(feed.id)
  const nextAttempts = row.attempts + 1

  let parsed: ParsedMessage
  try {
    parsed =
      canned.transport === 'fhir'
        ? extractFromFhir(canned.fhirBundle!, feed.fieldMapping)
        : extractViaMapping(canned.raw ?? '', feed.fieldMapping)
  } catch {
    const status = nextAttempts >= MAX_ATTEMPTS ? 'deadLetter' : 'retrying'
    updateMessageRow(api, actor, rowId, { status, attempts: nextAttempts, failureReason: 'The message could not be parsed under this feed mapping.' })
    return ok({ outcome: status })
  }
  const patientRef = parsed.patient.name

  // Transient fault: fail exactly the first attempt, then succeed on retry.
  if (canned.simulatedFault === 'transient' && row.attempts === 0) {
    updateMessageRow(api, actor, rowId, {
      status: 'retrying',
      attempts: nextAttempts,
      failureReason: 'Transient delivery error (simulated timeout). Auto-retrying.',
      ...(patientRef !== undefined ? { patientRef } : {}),
    })
    return ok({ outcome: 'retrying' })
  }

  const result = applyEffect(api, actor, parsed, canned)
  if (!result.ok) {
    // A locked target, an unmatched appointment or a missing target session is
    // not a transient error — it needs a human, so it parks for manual review.
    if (
      result.code === 'integrationImmutable' ||
      result.code === 'listAuthorised' ||
      result.code === 'noMatch' ||
      result.code === 'noTargetList' ||
      result.code === 'cardCancelled'
    ) {
      updateMessageRow(api, actor, rowId, {
        status: 'manualIntervention',
        attempts: nextAttempts,
        failureReason: result.message,
        ...(patientRef !== undefined ? { patientRef } : {}),
      })
      return ok({ outcome: 'manualIntervention' })
    }
    const status = nextAttempts >= MAX_ATTEMPTS ? 'deadLetter' : 'retrying'
    updateMessageRow(api, actor, rowId, {
      status,
      attempts: nextAttempts,
      failureReason: result.message,
      ...(patientRef !== undefined ? { patientRef } : {}),
    })
    return ok({ outcome: status })
  }

  updateMessageRow(api, actor, rowId, {
    status: 'processed',
    attempts: nextAttempts,
    resultCardId: result.value.cardId,
    failureReason: undefined,
    ...(patientRef !== undefined ? { patientRef } : {}),
  })
  return ok({ outcome: 'processed', cardId: result.value.cardId })
}

/**
 * Replay a canned message (the simulator's "Replay message"). Deduped by MSH-10:
 * an already-processed control id records a `duplicate` row with no second
 * effect; an in-flight (retrying/pending) row continues; otherwise a fresh row
 * is created and processed.
 */
export function processMessage(api: AppStoreApi, cannedId: string): Outcome<{ outcome: string; cardId?: string }> {
  const canned = cannedMessage(cannedId)
  if (canned === undefined) return refuse('unknownMessage', 'No such message in the library.')
  const state = api.getState()
  const feed = state.integrations.feeds[canned.feedId]
  if (feed === undefined) return refuse('unknownFeed', 'The feed for this message is not configured.')
  const rows = Object.values(state.integrations.messages)

  const already = rows.find((r) => r.messageControlId === canned.id && r.status === 'processed')
  if (already !== undefined) {
    createMessageRow(api, integrationActor(feed.id), canned, {
      status: 'duplicate',
      attempts: 1,
      failureReason: `Duplicate of ${canned.id}, already processed. Deduped by control id, no second Card created.`,
      ...(already.patientRef !== undefined ? { patientRef: already.patientRef } : {}),
    })
    return ok({ outcome: 'duplicate' })
  }

  const inFlight = rows.find((r) => r.messageControlId === canned.id && (r.status === 'retrying' || r.status === 'pending'))
  const rowId = inFlight?.id ?? createMessageRow(api, integrationActor(feed.id), canned, { status: 'pending', attempts: 0 })
  return attemptMessage(api, rowId)
}

/** Re-attempt a `retrying` message (the auto-retry timer + the manual retry button). */
export function retryMessage(api: AppStoreApi, rowId: string): Outcome<{ outcome: string; cardId?: string }> {
  return attemptMessage(api, rowId)
}

/** Reprocess a dead-lettered / parked message after a fix (feed mapping edit), with a fresh retry budget. */
export function reprocessMessage(api: AppStoreApi, rowId: string): Outcome<{ outcome: string; cardId?: string }> {
  const row = api.getState().integrations.messages[rowId]
  if (row === undefined) return refuse('notFound', 'Message not found.')
  updateMessageRow(api, integrationActor(row.feedId), rowId, { status: 'pending', attempts: 0, failureReason: undefined }, 'integration.reprocess')
  return attemptMessage(api, rowId)
}

// ---------------------------------------------------------------------------
// setFeedMapping (the malformed-message fix)
// ---------------------------------------------------------------------------

/** Edit one entry of a feed's field mapping (office-only), audited `feed.update`. */
export function setFeedMapping(api: AppStoreApi, actor: Actor, feedId: string, key: string, sourcePath: string): Outcome {
  const state = api.getState()
  const feed = state.integrations.feeds[feedId]
  if (feed === undefined) return refuse('notFound', 'Feed not found.')
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office edits a feed mapping.')

  mutate(
    api,
    actor,
    {
      entityType: 'integrationFeed',
      entityId: feedId,
      action: 'feed.update',
      before: { [key]: feed.fieldMapping[key] },
      after: { [key]: sourcePath },
      stampCardId: null,
    },
    (s) => {
      const f = s.integrations.feeds[feedId]
      if (f === undefined) return {}
      return {
        integrations: {
          ...s.integrations,
          feeds: { ...s.integrations.feeds, [feedId]: { ...f, fieldMapping: { ...f.fieldMapping, [key]: sourcePath } } },
        },
      }
    },
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// correctEthnicityCode (the data-quality manual fix)
// ---------------------------------------------------------------------------

/**
 * Supply a valid NZHIS code for a patient held in ethnicity quarantine: it
 * validates via `validateEthnicityCode`, stores the code and clears
 * `ethnicityPending`. A focused action because `editPatient`'s patch cannot
 * carry ethnicity (the same reason `withEthnicity` exists in intake).
 */
export function correctEthnicityCode(api: AppStoreApi, actor: Actor, patientId: string, code: string): Outcome {
  const state = api.getState()
  const patient = state.masters.patients[patientId]
  if (patient === undefined) return refuse('notFound', 'Patient not found.')
  const verdict = validateEthnicityCode(code)
  if (verdict.verdict !== 'valid') {
    return refuse('invalidEthnicity', verdict.verdict === 'malformed' ? verdict.reason : verdict.message)
  }

  mutate(
    api,
    actor,
    {
      entityType: 'patient',
      entityId: patientId,
      action: 'patient.ethnicity.correct',
      before: { pending: patient.ethnicityPending?.receivedCode },
      after: { ethnicityCode: verdict.code },
      stampCardId: null,
    },
    (s) => {
      const p = s.masters.patients[patientId]
      if (p === undefined) return {}
      const next = { ...p, ethnicityCode: verdict.code }
      delete next.ethnicityPending
      return { masters: { ...s.masters, patients: { ...s.masters.patients, [patientId]: next } } }
    },
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// PDF ingestion
// ---------------------------------------------------------------------------

/**
 * Ingest one reviewed PDF row onto a List. A row whose NHI matches a Card
 * already on that List UPDATES it (scheduled time + operation) rather than
 * duplicating; otherwise a new Card is created (patient via the shared
 * `upsertPatient`). Office-actor; a bad NHI refuses so the office must fix it in
 * review first.
 */
export function ingestPdfRow(
  api: AppStoreApi,
  actor: Actor,
  targetListId: string,
  row: PdfRow,
): Outcome<{ cardId: string; outcome: 'created' | 'updated' }> {
  const state = api.getState()
  const list = state.schedule.lists[targetListId]
  if (list === undefined) return refuse('notFound', 'Target List not found.')

  let normalisedNhi: string | undefined
  if (row.nhi.trim() !== '') {
    const verdict = validateNhi(row.nhi)
    if (!verdict.valid) {
      return refuse('invalidNhi', verdict.reason ?? 'The NHI on this row is not valid. Correct it before ingesting.')
    }
    normalisedNhi = verdict.normalised
  }

  const existing = normalisedNhi !== undefined ? cardsOnListByNhi(state, targetListId, normalisedNhi)[0] : undefined
  if (existing !== undefined) {
    if (row.scheduledTime !== '') {
      const timed = editCard(api, actor, existing.id, { scheduledTime: row.scheduledTime })
      if (!timed.ok) return timed
    }
    const first = proceduresForCard(state, existing.id)[0]
    if (first !== undefined && row.operation.trim() !== '') {
      const desc = editProcedure(api, actor, first.id, { description: row.operation.trim() })
      if (!desc.ok) return desc
    }
    return ok({ cardId: existing.id, outcome: 'updated' })
  }

  const created = createCard(api, actor, targetListId, {
    patient: {
      ...(row.nhi.trim() !== '' ? { nhi: row.nhi.trim() } : {}),
      name: row.name,
      dobISO: row.dobISO,
      ...(row.ethnicityCode !== undefined ? { ethnicityCode: row.ethnicityCode } : {}),
    },
    operation: row.operation,
    billingRoute: 'hospital',
    ...(row.scheduledTime !== '' ? { scheduledTime: row.scheduledTime } : {}),
  })
  if (!created.ok) return created
  return ok({ cardId: created.value.cardId, outcome: 'created' })
}

// ---------------------------------------------------------------------------
// wireIntegrationRetry (UI-layer auto-retry timer)
// ---------------------------------------------------------------------------

/**
 * Auto-retry `retrying` messages on a short timer — the UI-layer mechanism that
 * makes the transient message recover on its own (and the malformed one march
 * through its budget into dead-letter). Wired once for the singleton store;
 * tests never wire it and drive `retryMessage` synchronously instead. Returns
 * the unsubscribe function.
 */
export function wireIntegrationRetry(store: BoundAppStore, delayMs = 900): () => void {
  const scheduled = new Set<string>()
  return store.subscribe((state) => {
    for (const row of Object.values(state.integrations.messages)) {
      if (row.status !== 'retrying' || scheduled.has(row.id)) continue
      scheduled.add(row.id)
      setTimeout(() => {
        scheduled.delete(row.id)
        const current = store.getState().integrations.messages[row.id]
        if (current !== undefined && current.status === 'retrying') retryMessage(store, row.id)
      }, delayMs)
    }
  })
}
