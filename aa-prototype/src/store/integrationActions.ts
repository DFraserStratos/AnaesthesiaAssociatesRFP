/**
 * Integration processing (Phase 11) — the store side of the HL7/FHIR + PDF
 * story. Pure translation lives in `domain/integrations`. Since catch-up Phase
 * 33 a parsed message changes nothing by itself (RV-13; US-02.1.5 "No silent
 * apply"): it stages one row on the matching screen (`stageImportRows`,
 * channel `feedMessage`) and the office decides it there. The canned S13 to
 * S15 messages, Future Work as an automated path (US-02.5.1 to US-02.5.3),
 * become rows like any other; a day move arrives as a New row for the new day
 * (D62).
 *
 * MSH-10 still dedupes MESSAGES (a replay is a no-op, logged `duplicate`).
 * The SCH-2 appointment id travels on the row as its correlation ref, never a
 * match key.
 *
 * Reliability: `MAX_ATTEMPTS` retries. A transient fault fails once then
 * succeeds; a deterministic fault (an invalid NHI under a wrong mapping) fails
 * every time and exhausts the budget into `deadLetter`. Nothing parks: every
 * applicable message now waits for a decision on the matching screen.
 * "Retried" is a derived display label (processed with attempts > 1), never a
 * stored status. Tests drive `processMessage`/`retryMessage` synchronously; the
 * UI wires a short-timer auto-retry (`wireIntegrationRetry`).
 */

import type { IncomingBookingFields, IntegrationFeed, IntegrationMessage } from '../domain/types'
import { validateEthnicityCode } from '../domain/nzhis'
import { validateNhi } from '../domain/nhi'
import {
  cannedMessage,
  extractFromFhir,
  extractViaMapping,
  FEED_META,
  INTEGRATION_FEEDS,
  type CannedMessage,
  type ParsedMessage,
  type SurgeonPdf,
} from '../domain/integrations'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi, BoundAppStore } from './appStore'
import { createBooking } from './bookingActions'
import { editBooking } from './lifecycle'
import { replaceProcedureText } from './procedureTextActions'
import { stageImportRows } from './matchingActions'
import { bookingsOnListByNhi, listInSlot, proceduresForBooking, slotFor } from './selectors'

export const MAX_ATTEMPTS = 3

type PdfRow = SurgeonPdf['rows'][number]

function integrationActor(feedId: string): Actor {
  return { who: FEED_META[feedId]?.actorLabel ?? 'Integration feed', role: 'system', source: 'integration' }
}

/**
 * The inbound source for a hospital (catch-up Phase 23): its feed's actor
 * where one is configured, else a plain "Hospital feed", both audited as
 * `integration`.
 */
export function integrationActorForHospital(hospitalId: string | undefined): Actor {
  const feed = INTEGRATION_FEEDS.find((f) => f.hospitalId === hospitalId)
  return feed !== undefined ? integrationActor(feed.id) : { who: 'Hospital feed', role: 'system', source: 'integration' }
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
    metas.push({
      entityType: 'integrationMessage',
      entityId: id,
      action: 'integration.receive',
      after: { status: init.status, feed: canned.feedId, event: canned.eventType },
      stampBookingId: null,
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
      stampBookingId: null,
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
// Staging a parsed message as a matching-screen row (catch-up Phase 33; RV-13)
// ---------------------------------------------------------------------------

/**
 * The row a parsed message stands for: the feed's hospital, the message's
 * date and time, the session and surgeon the hospital sends (the canned
 * `rowContext`, or for a create the List in its routed session: the extractor
 * does not read them, the §10 fence), the patient, the wording exactly as the
 * message carried it, the note, and booked or cancelled. A message that moves
 * a Booking to another day is a booked row for the new day (D62).
 */
function rowFromMessage(api: AppStoreApi, feed: IntegrationFeed, parsed: ParsedMessage, canned: CannedMessage): IncomingBookingFields | undefined {
  const state = api.getState()
  const routing = canned.routing
  const ctx = canned.rowContext
  const dateISO = parsed.scheduledDateISO ?? ctx?.dateISO ?? routing?.dateISO
  if (dateISO === undefined) return undefined
  let surgeon = ctx?.surgeon
  if (surgeon === undefined && routing !== undefined) {
    const slot = slotFor(state, routing.anaesthetistId, routing.dateISO, routing.session)
    const list = slot !== undefined ? listInSlot(state, slot.id) : undefined
    const held = list?.surgeonId != null ? state.masters.surgeons[list.surgeonId] : undefined
    if (held !== undefined) surgeon = { name: held.name, ...(held.hpiId !== undefined ? { hpiId: held.hpiId } : {}) }
  }
  const nhi = parsed.patient.nhi?.trim()
  return {
    hospitalId: feed.hospitalId,
    dateISO,
    session: ctx?.session ?? routing?.session ?? timeToSession(parsed.scheduledTime),
    externalRef: parsed.appointmentId ?? canned.correlationAppointmentId,
    ...(surgeon !== undefined ? { surgeon } : {}),
    ...(parsed.scheduledTime !== undefined ? { scheduledTime: parsed.scheduledTime } : {}),
    patient: {
      name: parsed.patient.name ?? 'Unknown patient',
      ...(nhi !== undefined && nhi !== '' ? { nhi } : {}),
      ...(parsed.patient.dobISO !== undefined ? { dobISO: parsed.patient.dobISO } : {}),
      ...(parsed.patient.ethnicityCode !== undefined ? { ethnicityCode: parsed.patient.ethnicityCode } : {}),
    },
    ...(parsed.operation !== undefined ? { procedure: { text: parsed.operation } } : {}),
    ...(parsed.note !== undefined ? { note: parsed.note } : {}),
    hospitalStatus: canned.eventType === 'S15' ? 'cancelled' : 'booked',
    ...(parsed.cancelReason !== undefined ? { cancelReason: parsed.cancelReason } : {}),
  }
}


// ---------------------------------------------------------------------------
// processMessage / retryMessage / reprocessMessage
// ---------------------------------------------------------------------------

function attemptMessage(api: AppStoreApi, rowId: string): Outcome<{ outcome: string; importRowId?: string }> {
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

  // An invalid NHI is a feed-mapping fault (the wrong field read): it retries,
  // then dead-letters. A message with no NHI stages a row that waits (D11).
  const extractedNhi = parsed.patient.nhi?.trim()
  const fields = extractedNhi !== undefined && extractedNhi !== '' && !validateNhi(extractedNhi).valid ? undefined : rowFromMessage(api, feed, parsed, canned)
  if (fields === undefined) {
    const status = nextAttempts >= MAX_ATTEMPTS ? 'deadLetter' : 'retrying'
    updateMessageRow(api, actor, rowId, {
      status,
      attempts: nextAttempts,
      failureReason: extractedNhi !== undefined ? `The NHI "${extractedNhi}" is not valid under this feed mapping.` : 'The message carries no date.',
      ...(patientRef !== undefined ? { patientRef } : {}),
    })
    return ok({ outcome: status })
  }

  const hospital = state.masters.hospitals[feed.hospitalId]?.name ?? 'Hospital'
  const system = FEED_META[feed.id]?.name.match(/\(([^)]+)\)/)?.[1]
  const staged = stageImportRows(api, actor, 'feedMessage', feed.hospitalId, `${hospital}${system !== undefined ? ` ${system}` : ''} message ${canned.id}`, [fields], {
    messageId: canned.id,
  })
  if (!staged.ok) return staged
  const importRowId = staged.value.rowIds[0]
  updateMessageRow(api, actor, rowId, {
    status: 'processed',
    attempts: nextAttempts,
    ...(importRowId !== undefined ? { resultImportRowId: importRowId } : {}),
    failureReason: undefined,
    ...(patientRef !== undefined ? { patientRef } : {}),
  })
  return ok({ outcome: 'processed', ...(importRowId !== undefined ? { importRowId } : {}) })
}

/**
 * Replay a canned message (the simulator's "Replay message"). Deduped by MSH-10:
 * an already-processed control id records a `duplicate` row with no second
 * effect; an in-flight (retrying/pending) row continues; otherwise a fresh row
 * is created and processed.
 */
export function processMessage(api: AppStoreApi, cannedId: string): Outcome<{ outcome: string; importRowId?: string }> {
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
      failureReason: `Duplicate of ${canned.id}, already processed. Deduped by control id, no second row staged.`,
      ...(already.patientRef !== undefined ? { patientRef: already.patientRef } : {}),
    })
    return ok({ outcome: 'duplicate' })
  }

  const inFlight = rows.find((r) => r.messageControlId === canned.id && (r.status === 'retrying' || r.status === 'pending'))
  const rowId = inFlight?.id ?? createMessageRow(api, integrationActor(feed.id), canned, { status: 'pending', attempts: 0 })
  return attemptMessage(api, rowId)
}

/** Re-attempt a `retrying` message (the auto-retry timer + the manual retry button). */
export function retryMessage(api: AppStoreApi, rowId: string): Outcome<{ outcome: string; importRowId?: string }> {
  return attemptMessage(api, rowId)
}

/** Reprocess a dead-lettered / parked message after a fix (feed mapping edit), with a fresh retry budget. */
export function reprocessMessage(api: AppStoreApi, rowId: string): Outcome<{ outcome: string; importRowId?: string }> {
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
      stampBookingId: null,
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
      stampBookingId: null,
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
 * Ingest one reviewed PDF row onto a List. A row whose NHI matches a Booking
 * already on that List UPDATES it (scheduled time; the text through
 * `replaceProcedureText`, catch-up Phase 20a) rather than duplicating; otherwise a new Booking is created (patient via the shared
 * `upsertPatient`). Office-actor; a bad NHI refuses so the office must fix it in
 * review first.
 */
export function ingestPdfRow(
  api: AppStoreApi,
  actor: Actor,
  targetListId: string,
  row: PdfRow,
): Outcome<{ bookingId: string; outcome: 'created' | 'updated' }> {
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

  const existing = normalisedNhi !== undefined ? bookingsOnListByNhi(state, targetListId, normalisedNhi)[0] : undefined
  if (existing !== undefined) {
    if (row.scheduledTime !== '') {
      const timed = editBooking(api, actor, existing.id, { scheduledTime: row.scheduledTime })
      if (!timed.ok) return timed
    }
    // The rooms' text through the one write path (US-02.5.7): it replaces a
    // different rooms' text, never a hospital's; an identical row changes nothing.
    const first = proceduresForBooking(state, existing.id).find((p) => p.isPrimary)
    if (first !== undefined && row.operation.trim() !== '') {
      const text = replaceProcedureText(api, actor, first.id, { text: row.operation, source: 'surgeonPdf' })
      if (!text.ok) return text
    }
    return ok({ bookingId: existing.id, outcome: 'updated' })
  }

  const created = createBooking(api, actor, targetListId, {
    patient: {
      ...(row.nhi.trim() !== '' ? { nhi: row.nhi.trim() } : {}),
      name: row.name,
      dobISO: row.dobISO,
      ...(row.ethnicityCode !== undefined ? { ethnicityCode: row.ethnicityCode } : {}),
    },
    sourceText: { text: row.operation, source: 'surgeonPdf' },
    ...(row.scheduledTime !== '' ? { scheduledTime: row.scheduledTime } : {}),
    source: 'surgeonPdf',
  })
  if (!created.ok) return created
  return ok({ bookingId: created.value.bookingId, outcome: 'created' })
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
