/**
 * The rooms' PDF lists (catch-up Phase 34; FT-02.2, US-02.2.1, DM-61).
 *
 * The office uploads a PDF list with the address it arrived from (the reading
 * is simulated from the sample library), corrects a row's fields, and sends
 * the list to the matching screen through 33's `stageImportRows`, where every
 * row waits for the office's decision. Nothing here writes a Booking, List or
 * Patient: those happen only through `decideImportRow` and 33a's resolve.
 *
 * Every write goes through the audited `mutate()`, office only.
 */

import type { PdfListRow, PdfRowCorrection, PdfRowField, SurgeonPdfList } from '../domain/types'
import { validateNhi } from '../domain/nhi'
import { isEmailShaped } from '../domain/billing/payer'
import {
  buildFacsimile,
  effectivePdfRow,
  PDF_LIST_SAMPLES,
  pdfListBatchLabel,

  pdfRowIncoming,
  pdfRowIssues,
  resendSampleFor,
  resentPdfListOf,
  sessionLabel,
  type PdfListSample,
} from '../domain/intake'
import { allocateId, clockISO, mutate, ok, refuse, transaction, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { stageImportRows } from './matchingActions'

function officeOnly(actor: Actor): Outcome<never> | null {
  return actor.role === 'office' ? null : refuse('officeOnly', 'Only the AA office handles the rooms’ PDF lists.')
}

export const SENDER_REQUIRED_MESSAGE = 'Enter the address the PDF was sent from.'

/** Store one sample as a received PDF list (the shared body of an upload and a re-send). */
function receive(api: AppStoreApi, actor: Actor, sample: PdfListSample, rawSender: string, resend: boolean): Outcome<{ pdfListId: string }> {
  const sender = rawSender.trim()
  if (sender === '') return refuse('senderRequired', SENDER_REQUIRED_MESSAGE)
  if (!isEmailShaped(sender)) return refuse('invalidEmail', 'Enter the address the PDF was sent from as an email address.')
  const state = api.getState()
  if (Object.values(state.intake.pdfLists).some((l) => l.sampleId === sample.id)) return refuse('alreadyReceived', 'This PDF list is already in the inbox.')
  if (state.masters.surgeons[sample.surgeonId] === undefined) return refuse('notFound', 'That surgeon is not in the master data.')
  if (state.masters.hospitals[sample.hospitalId] === undefined) return refuse('notFound', 'Hospital not found.')
  const replaces = resentPdfListOf(state.intake.pdfLists, sample)
  let pdfListId = ''
  const metas: MutationMeta[] = []
  mutate(
    api,
    actor,
    metas,
    (s) => {
      const alloc = allocateId(s.counters, 'pdfList')
      pdfListId = alloc.id
      metas.push({
        entityType: 'pdfList',
        entityId: alloc.id,
        ...(resend ? { action: 'pdfList.resend' } : { action: 'pdfList.upload' }),
        after: { sampleId: sample.id, senderEmail: sender, surgeonId: sample.surgeonId, rows: sample.rows.length, ...(replaces !== undefined ? { replacesId: replaces.id } : {}) },
        stampBookingId: null,
      })
      const list: SurgeonPdfList = {
        id: alloc.id,
        sampleId: sample.id,
        file: { name: sample.fileName, facsimile: buildFacsimile(sample) },
        surgeonId: sample.surgeonId,
        senderEmail: sender,
        hospitalId: sample.hospitalId,
        subject: sample.subject,
        receivedAtISO: clockISO(s.clock),
        receivedBy: actor.who,
        target: { ...sample.target },
        status: 'received',
        ...(replaces !== undefined ? { replacesId: replaces.id } : {}),
        rows: sample.rows.map(({ id, ...asRead }) => ({ id, asRead, corrections: [] })),
      }
      return { intake: { ...s.intake, pdfLists: { ...s.intake.pdfLists, [alloc.id]: list } }, counters: alloc.counters }
    },
  )
  return ok({ pdfListId })
}

/**
 * The office uploads a PDF list (US-02.2.1): the sample's rows as read
 * (simulated), with the address it arrived from (required, US-02.2.4). A
 * later list for the same surgeon, hospital, date and session records the
 * earlier one it replaces (our reading). A sample already in the inbox is
 * refused.
 */
export function uploadPdfList(api: AppStoreApi, actor: Actor, sampleId: string, senderEmail: string): Outcome<{ pdfListId: string }> {
  const office = officeOnly(actor)
  if (office !== null) return office
  const sample = PDF_LIST_SAMPLES.find((s) => s.id === sampleId)
  if (sample === undefined) return refuse('unknownSample', 'No such sample PDF list.')
  return receive(api, actor, sample, senderEmail, false)
}

/** Why a sample's re-sent version cannot arrive yet, or null when it can. */
export function resendRefusal(state: Pick<AppState, 'intake'>, sampleId: string): string | null {
  const resend = resendSampleFor(sampleId)
  if (resend === undefined) return 'This list has no updated version.'
  const lists = Object.values(state.intake.pdfLists)
  if (!lists.some((l) => l.sampleId === sampleId && l.status === 'sent')) return 'Send the first version to matching first.'
  if (lists.some((l) => l.sampleId === resend.id)) return 'The updated list has already arrived.'
  return null
}

/**
 * The rooms re-send a list already sent to matching (the demo's "Receive
 * updated PDF from rooms"): its re-sent version lands in the inbox as
 * received, marked as replacing the earlier one, with its own sender.
 */
export function receiveResentPdfList(api: AppStoreApi, actor: Actor, sampleId: string): Outcome<{ pdfListId: string }> {
  const office = officeOnly(actor)
  if (office !== null) return office
  const why = resendRefusal(api.getState(), sampleId)
  if (why !== null) return refuse('resendNotReady', why)
  const resend = resendSampleFor(sampleId)!
  return receive(api, actor, resend, resend.defaultSender, true)
}

export type PdfRowPatch = Partial<Record<PdfRowField, string>>

/**
 * The office corrects a row's fields before sending (US-02.2.1): NHI, name,
 * date of birth, time, ethnicity. Each correction is kept with who and when;
 * the wording is kept as read and never corrected. A typed NHI is checked as
 * typed; a blank NHI is allowed (the row waits at intake).
 */
export function correctPdfListRow(api: AppStoreApi, actor: Actor, pdfListId: string, rowId: string, rawPatch: PdfRowPatch): Outcome {
  const office = officeOnly(actor)
  if (office !== null) return office
  const patch = rawPatch as PdfRowPatch & Record<string, unknown>
  if ('procedureText' in patch) return refuse('wordingKeptAsReceived', "The rooms' wording is kept as received.")
  const state = api.getState()
  const list = state.intake.pdfLists[pdfListId]
  if (list === undefined) return refuse('notFound', 'PDF list not found.')
  if (list.status !== 'received') return refuse('alreadySent', 'This list has been sent to matching.')
  const row = list.rows.find((r) => r.id === rowId)
  if (row === undefined) return refuse('notFound', 'Row not found.')
  const current = effectivePdfRow(row)
  const atISO = clockISO(state.clock)
  const corrections: PdfRowCorrection[] = []
  for (const field of ['nhi', 'name', 'dobISO', 'scheduledTime', 'ethnicityCode'] as const) {
    const raw = patch[field]
    if (raw === undefined) continue
    let to = raw.trim()
    if (field === 'nhi' && to !== '') {
      const v = validateNhi(to)
      if (!v.valid) return refuse('invalidNhi', v.reason ?? 'That NHI is not valid.')
      to = v.normalised
    }
    if (field === 'name' && to === '') return refuse('nameRequired', 'The patient needs a name.')
    if (field === 'dobISO' && to !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(to)) return refuse('invalidDob', 'Enter the date of birth as a date.')
    if (field === 'scheduledTime' && to !== '' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(to)) return refuse('invalidTime', 'Enter the time as HH:MM.')
    if (field === 'ethnicityCode' && to !== '' && !/^\d{5}$/.test(to)) return refuse('invalidEthnicity', 'Enter the ethnicity as a five digit code.')
    const from = current[field] ?? ''
    if (from === to) continue
    corrections.push({ field, from, to, atISO, by: actor.who })
  }
  if (corrections.length === 0) return ok(undefined)
  mutate(
    api,
    actor,
    { entityType: 'pdfList', entityId: pdfListId, action: 'pdfList.correct', before: { rowId }, after: { rowId, corrections: corrections.map((c) => ({ field: c.field, from: c.from, to: c.to })) }, stampBookingId: null },
    (s) => {
      const cur = s.intake.pdfLists[pdfListId]
      if (cur === undefined) return {}
      const rows: PdfListRow[] = cur.rows.map((r) => (r.id === rowId ? { ...r, corrections: [...r.corrections, ...corrections] } : r))
      return { intake: { ...s.intake, pdfLists: { ...s.intake.pdfLists, [pdfListId]: { ...cur, rows } } } }
    },
  )
  return ok(undefined)
}

export const INVALID_NHI_SEND_MESSAGE = 'Correct the invalid NHI before sending.'

/**
 * Send a received list to the matching screen (US-02.2.1): its rows, as
 * corrected, are staged through 33's `stageImportRows` with the rooms as their
 * source (channel `pdfList`, so the wording is the rooms' procedure text), the
 * batch carrying the list and its sender. 33's dedupe skips rows unchanged
 * since an earlier list; a changed row arrives as a modification for approval
 * and a new patient as a new row. A row with no NHI waits with a stub (33a).
 * Refused while any NHI is invalid. Nothing is applied: every row waits for
 * the office's decision.
 */
export function sendPdfListToMatching(api: AppStoreApi, actor: Actor, pdfListId: string): Outcome<{ batchId?: string; staged: number; unchanged: number }> {
  const office = officeOnly(actor)
  if (office !== null) return office
  const state = api.getState()
  const list = state.intake.pdfLists[pdfListId]
  if (list === undefined) return refuse('notFound', 'PDF list not found.')
  if (list.status !== 'received') return refuse('alreadySent', 'This list has already been sent to matching.')
  if (list.rows.some((r) => pdfRowIssues(r).some((i) => i.blocksSend))) return refuse('invalidNhi', INVALID_NHI_SEND_MESSAGE)
  const surgeon = state.masters.surgeons[list.surgeonId]
  const incoming = list.rows.map((r) => pdfRowIncoming(list, r, surgeon !== undefined ? { name: surgeon.name, ...(surgeon.hpiId !== undefined ? { hpiId: surgeon.hpiId } : {}) } : undefined))
  const label = pdfListBatchLabel(surgeon?.name ?? 'The surgeon', sessionLabel(list.target.dateISO, list.target.session))
  return transaction(api, () => {
    const staged = stageImportRows(api, actor, 'pdfList', list.hospitalId, label, incoming, {
      source: 'rooms',
      sampleId: list.sampleId,
      pdfListId: list.id,
      senderEmail: list.senderEmail,
    })
    if (!staged.ok) return staged
    const batchId = staged.value.batchId
    mutate(
      api,
      actor,
      {
        entityType: 'pdfList',
        entityId: pdfListId,
        action: 'pdfList.send',
        before: { status: 'received' },
        after: { status: 'sent', ...(batchId !== undefined ? { batchId } : {}), staged: staged.value.rowIds.length, unchanged: staged.value.skipped },
        stampBookingId: null,
      },
      (s) => {
        const cur = s.intake.pdfLists[pdfListId]
        if (cur === undefined) return {}
        const next: SurgeonPdfList = { ...cur, status: 'sent', sentAtISO: clockISO(s.clock), sentBy: actor.who, ...(batchId !== undefined ? { batchId } : {}) }
        return { intake: { ...s.intake, pdfLists: { ...s.intake.pdfLists, [pdfListId]: next } } }
      },
    )
    return ok({ ...(batchId !== undefined ? { batchId } : {}), staged: staged.value.rowIds.length, unchanged: staged.value.skipped })
  })
}


