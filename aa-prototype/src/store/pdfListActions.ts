/**
 * The rooms' PDFs at Intake (FT-02.2, US-02.2.1, US-02.2.4).
 *
 * The rooms' PDFs arrive through Phase 68's mailbox ingest (`receiveMailboxPdf`, store/intakeIngest.ts): read at
 * once, their rows staged for the office's decision. This file holds what the office does around that: correcting an
 * arriving row before its List is placed, adding a PDF by hand with the address it came from, and the unreadable
 * PDF's email to its sender and its dismissal. Nothing here writes a Booking, List or Patient.
 *
 * Office only; every write goes through the audited `mutate()`.
 */

import type { ImportBatch, ImportRow, ImportRowCorrection, ImportRowCorrections } from '../domain/types'
import { validateNhi } from '../domain/nhi'
import { isEmailShaped } from '../domain/billing/payer'
import { plural } from '../domain/dateText'
import { effectiveIncoming } from '../domain/intake/matching'
import { PDF_LIST_SAMPLES } from '../domain/intake/pdfLists'
import { FORTE_ROOMS_PDF, OKAFOR_ROOMS_PDF, SCAN_PDF, UNREADABLE_PDF, type MailboxPdfSample } from '../domain/intake/hospitalDownloads'
import { clockISO, mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { mailboxPdfReceived, receiveMailboxPdf, receiveUnreadablePdf, unreadablePdfStanding } from './intakeIngest'
import { arrivalItemsOf } from './intakeSelectors'

function officeOnly(actor: Actor): Outcome<never> | null {
  return actor.role === 'office' ? null : refuse('officeOnly', 'Only the AA office handles the rooms’ PDF lists.')
}

export const SENDER_REQUIRED_MESSAGE = 'Enter the address the PDF was sent from.'

// ---------------------------------------------------------------------------
// Corrections before placing (Phase 70)
// ---------------------------------------------------------------------------

/** The fields an arriving List's row may be corrected in before it is placed (never the wording). */
export type ArrivalRowPatch = Partial<Pick<ImportRowCorrections, 'nhi' | 'patientName' | 'dobISO' | 'scheduledTime' | 'ethnicityCode'>>

export const ARRIVAL_ROW_FIELDS = ['nhi', 'patientName', 'dobISO', 'scheduledTime', 'ethnicityCode'] as const
export type ArrivalRowField = (typeof ARRIVAL_ROW_FIELDS)[number]

export const NHI_NOT_CLEARED_MESSAGE = 'Enter a valid NHI. An NHI read from the List cannot be cleared.'

/** A row's value in each correctable field as it stands: the latest correction, else as it arrived. */
export function arrivalRowValues(row: Pick<ImportRow, 'incoming' | 'corrections'>): Record<ArrivalRowField, string> {
  const fields = effectiveIncoming(row)
  return {
    nhi: fields.patient.nhi ?? '',
    patientName: fields.patient.name,
    dobISO: fields.patient.dobISO ?? '',
    scheduledTime: fields.scheduledTime ?? '',
    // `effectiveIncoming` does not apply the ethnicity correction; read it as the data-quality check does.
    ethnicityCode: row.corrections?.ethnicityCode ?? row.incoming.patient.ethnicityCode ?? '',
  }
}

/**
 * The office corrects an arriving List's row before the List is placed (US-02.2.1, DM-15): NHI, name, date of
 * birth, time and ethnicity code. Each correction is kept with from, to, who and when; the wording is kept as
 * received. The NHI is checked as typed; an ethnicity is a five digit code. Corrections apply only while the row
 * is open: a placed List is edited on its Bookings. An unchanged field writes nothing.
 */
export function correctArrivalRow(api: AppStoreApi, actor: Actor, rowId: string, rawPatch: ArrivalRowPatch & Record<string, unknown>): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the AA office corrects an arriving List.')
  const patch = rawPatch
  if ('procedure' in patch || 'procedureText' in patch || 'text' in patch) return refuse('wordingKeptAsReceived', "The rooms' wording is kept as received.")
  const state = api.getState()
  const row = state.intake.rows[rowId]
  if (row === undefined) return refuse('notFound', 'Row not found.')
  if (row.status !== 'open') return refuse('alreadyDecided', 'This row has already been decided.')
  const current = arrivalRowValues(row)
  const atISO = clockISO(state.clock)
  const next: ImportRowCorrections = { ...row.corrections }
  const entries: ImportRowCorrection[] = []
  for (const field of ARRIVAL_ROW_FIELDS) {
    const raw: unknown = patch[field]
    if (raw === undefined) continue
    if (typeof raw !== 'string') return refuse('invalidValue', 'Enter the value as text.')
    let to = raw.trim()
    if (field === 'nhi' && to !== '') {
      const v = validateNhi(to)
      if (!v.valid) return refuse('invalidNhi', v.reason ?? 'That NHI is not valid.')
      to = v.normalised
    }
    const from = current[field]
    if (from === to) continue
    if (field === 'nhi' && to === '') return refuse('nhiRequired', NHI_NOT_CLEARED_MESSAGE)
    if (field === 'patientName' && to === '') return refuse('nameRequired', 'The patient needs a name.')
    if (field === 'dobISO' && !/^\d{4}-\d{2}-\d{2}$/.test(to)) return refuse('invalidDob', 'Enter the date of birth as a date.')
    if (field === 'scheduledTime' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(to)) return refuse('invalidTime', 'Enter the time as HH:MM.')
    if (field === 'ethnicityCode' && to !== '' && !/^\d{5}$/.test(to)) return refuse('invalidEthnicity', 'Enter the ethnicity as a five digit code.')
    next[field] = to
    entries.push({ field, from, to, atISO, by: actor.who })
  }
  if (entries.length === 0) return ok(undefined)
  mutate(
    api,
    actor,
    {
      entityType: 'importRow',
      entityId: rowId,
      action: 'importRow.correct',
      before: Object.fromEntries(entries.map((e) => [e.field, e.from])),
      after: Object.fromEntries(entries.map((e) => [e.field, e.to])),
      stampBookingId: null,
    },
    (s) => {
      const cur = s.intake.rows[rowId]
      if (cur === undefined) return {}
      const updated: ImportRow = { ...cur, corrections: next, correctionHistory: [...(cur.correctionHistory ?? []), ...entries] }
      return { intake: { ...s.intake, rows: { ...s.intake.rows, [rowId]: updated } } }
    },
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// Unreadable PDFs and PDFs added by hand (Phase 70)
// ---------------------------------------------------------------------------
//
// Build plan Phase 70 (US-02.2.1, D120, D125): a rooms' PDF that did not come through the mailbox is added by hand
// with the address it came from, and lands in the feed as a mailbox PDF does (68's `receiveMailboxPdf`). A PDF that
// cannot be read stays in the feed until the office dismisses it with a reason; the office can email the sender
// for a clearer copy, which is recorded in the audit only (nothing leaves the app). Office only, every write audited.

type UnreadableBatch = ImportBatch
const BY_HAND_UNREADABLE = UNREADABLE_PDF

/** One sample file the Add a PDF by hand picker offers. */
export interface ByHandSample {
  id: string
  fileName: string
  label: string
  detail: string
  defaultSender: string
  unreadable?: boolean
}

const BY_HAND_INVALID_EMAIL = 'Enter the address the PDF was sent from as an email address.'

/** The older rooms' samples as mailbox PDFs: the anaesthetist they target is the one the rooms name. */
function convertedListSamples(state: Pick<AppState, 'masters'>): MailboxPdfSample[] {
  return PDF_LIST_SAMPLES.map((s) => {
    const named = state.masters.anaesthetists[s.target.anaesthetistId]
    return {
      id: s.id,
      fileName: s.fileName,
      surgeonId: s.surgeonId,
      surgeonName: s.surgeonName,
      hospitalId: s.hospitalId,
      hospitalName: s.hospitalName,
      subject: s.subject,
      senderEmail: s.defaultSender,
      dateISO: s.target.dateISO,
      session: s.target.session,
      ...(named !== undefined ? { anaesthetist: { name: named.name, ...(named.hpiId !== undefined ? { hpiId: named.hpiId } : {}) } } : {}),
      rows: s.rows,
      ...(s.note !== undefined ? { note: s.note } : {}),
    }
  })
}

/** Every readable PDF the office can add by hand (a re-send is never offered: it is the rooms' own later email). */
function byHandMailboxSamples(state: Pick<AppState, 'masters'>): MailboxPdfSample[] {
  return [OKAFOR_ROOMS_PDF, FORTE_ROOMS_PDF, SCAN_PDF, ...convertedListSamples(state)]
}

/** The sample files Add a PDF by hand offers: those not yet received, and the unreadable page while none stands. */
export function byHandSamples(state: Pick<AppState, 'intake' | 'masters'>): ByHandSample[] {
  const readable = byHandMailboxSamples(state)
    .filter((s) => !mailboxPdfReceived(state, s.id))
    .map((s) => ({
      id: s.id,
      fileName: s.fileName,
      label: `${s.surgeonName} · ${s.hospitalName}`,
      detail: `${s.subject} · ${plural(s.rows.length, 'patient')}`,
      defaultSender: s.senderEmail,
    }))
  const unreadable: ByHandSample[] = unreadablePdfStanding(state, BY_HAND_UNREADABLE.fileName)
    ? []
    : [{ id: BY_HAND_UNREADABLE.id, fileName: BY_HAND_UNREADABLE.fileName, label: 'A faint scanned page', detail: BY_HAND_UNREADABLE.reason, defaultSender: BY_HAND_UNREADABLE.senderEmail, unreadable: true }]
  return [...readable, ...unreadable]
}

/** The feed item a batch lands as: its new List (or, failing that, its first List), never a row waiting for an NHI. */
function arrivalKeyOfBatch(state: AppState, batchId: string): string {
  const items = arrivalItemsOf(state).filter((i) => i.batchId === batchId)
  const item = items.find((i) => i.kind === 'newList') ?? items.find((i) => i.kind !== 'needsNhi') ?? items[0]
  return item?.key ?? batchId
}

/**
 * The office adds a rooms' PDF by hand (US-02.2.1, US-02.2.4): the address it came from is required. A readable PDF is
 * read and lands as a mailbox PDF does, its source the person who added it; the unreadable page lands with its reason.
 * Returns the new arrival's feed key, so the feed can open on it.
 */
export function addPdfByHand(api: AppStoreApi, actor: Actor, sampleId: string, senderEmail: string): Outcome<{ batchId: string; arrivalKey: string }> {
  const office = officeOnly(actor)
  if (office !== null) return office
  const sender = senderEmail.trim()
  if (sender === '') return refuse('senderRequired', SENDER_REQUIRED_MESSAGE)
  if (!isEmailShaped(sender)) return refuse('invalidEmail', BY_HAND_INVALID_EMAIL)
  const state = api.getState()
  if (sampleId === BY_HAND_UNREADABLE.id) {
    if (unreadablePdfStanding(state, BY_HAND_UNREADABLE.fileName)) return refuse('alreadyReceived', 'This PDF is already in Intake.')
    // 68's ingest records the mailbox as its source; the address is the one typed.
    const out = receiveUnreadablePdf(api, { fileName: BY_HAND_UNREADABLE.fileName, facsimile: BY_HAND_UNREADABLE.facsimile, senderEmail: sender, reason: BY_HAND_UNREADABLE.reason })
    if (!out.ok) return out
    return ok({ batchId: out.value.batchId, arrivalKey: out.value.batchId })
  }
  const sample = byHandMailboxSamples(state).find((s) => s.id === sampleId)
  if (sample === undefined) return refuse('unknownSample', 'No such sample PDF.')
  const out = receiveMailboxPdf(api, sample, { byHand: { by: actor.who, senderEmail: sender } })
  if (!out.ok) return out
  return ok({ batchId: out.value.batchId, arrivalKey: arrivalKeyOfBatch(api.getState(), out.value.batchId) })
}

/** An unreadable PDF still standing in the feed, or the refusal. */
function standingUnreadable(state: AppState, batchId: string): UnreadableBatch | Outcome<never> {
  const batch = state.intake.batches[batchId]
  if (batch === undefined || batch.unreadableReason === undefined) return refuse('notFound', 'That unreadable PDF is not in Intake.')
  if (batch.dismissed !== undefined) return refuse('alreadyDismissed', 'This PDF has already been dismissed.')
  return batch
}

/** The draft email to an unreadable PDF's sender, asking for a clearer copy. The office edits it before sending. */
export function unreadableEmailDraft(batch: UnreadableBatch): { to: string; subject: string; body: string } {
  const fileName = batch.file?.name ?? batch.label
  const to = batch.senderEmail ?? (batch.arrivalSource.kind === 'hospitalFeed' ? '' : batch.arrivalSource.senderEmail)
  const reason = batch.unreadableReason ?? 'We could not read it.'
  return {
    to,
    subject: `We could not read ${fileName}`,
    body: [
      'Hello,',
      '',
      `Thank you for sending ${fileName}. We could not read it, so we cannot add its patients to the List yet.`,
      '',
      `Why: ${reason}`,
      '',
      'Could you please send a clearer copy, or the List as typed text?',
      '',
      'Thank you,',
      'Anaesthesia Associates',
    ].join('\n'),
  }
}

/**
 * The office emails an unreadable PDF's sender (D125): recorded in the audit, and so the arrival's history, with what
 * was sent. Nothing leaves the app and no record changes.
 */
export function sendUnreadablePdfEmail(api: AppStoreApi, actor: Actor, batchId: string, email: { to: string; subject: string; body: string }): Outcome {
  const office = officeOnly(actor)
  if (office !== null) return office
  const found = standingUnreadable(api.getState(), batchId)
  if ('ok' in found) return found
  const to = email.to.trim()
  if (to === '') return refuse('toRequired', 'Enter the address to send the email to.')
  if (!isEmailShaped(to)) return refuse('invalidEmail', 'Enter the address to send the email to as an email address.')
  const body = email.body.trim()
  if (body === '') return refuse('bodyRequired', 'Write the email before sending it.')
  mutate(
    api,
    actor,
    { entityType: 'importBatch', entityId: batchId, action: 'importBatch.emailSender', after: { to, subject: email.subject.trim(), body }, stampBookingId: null },
    () => ({}),
  )
  return ok(undefined)
}

/** The emails sent to an unreadable PDF's sender, oldest first, from the audit. */
export function unreadableEmailsSent(state: Pick<AppState, 'audit'>, batchId: string): { to: string; atISO: string; by: string }[] {
  return state.audit
    .filter((a) => a.entityType === 'importBatch' && a.entityId === batchId && a.action === 'importBatch.emailSender')
    .map((a) => ({ to: String((a.after as { to?: unknown } | undefined)?.to ?? ''), atISO: a.atISO, by: a.who }))
}

export const DISMISS_REASON_REQUIRED_MESSAGE = 'Say why this PDF is dismissed.'

/** The office dismisses an unreadable PDF with a reason (D125): a decision, so the Intake count drops; never deleted. */
export function dismissUnreadablePdf(api: AppStoreApi, actor: Actor, batchId: string, reason: string): Outcome {
  const office = officeOnly(actor)
  if (office !== null) return office
  const why = reason.trim()
  if (why === '') return refuse('reasonRequired', DISMISS_REASON_REQUIRED_MESSAGE)
  const found = standingUnreadable(api.getState(), batchId)
  if ('ok' in found) return found
  mutate(
    api,
    actor,
    { entityType: 'importBatch', entityId: batchId, action: 'importBatch.dismiss', before: { dismissed: false }, after: { dismissed: true, reason: why }, stampBookingId: null },
    (s) => {
      const cur = s.intake.batches[batchId]
      if (cur === undefined) return {}
      const next: UnreadableBatch = { ...cur, dismissed: { by: actor.who, atISO: clockISO(s.clock), reason: why } }
      return { intake: { ...s.intake, batches: { ...s.intake.batches, [batchId]: next } } }
    },
  )
  return ok(undefined)
}
