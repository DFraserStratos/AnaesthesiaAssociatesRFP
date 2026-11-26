/**
 * Unreadable PDFs and PDFs added by hand (build plan Phase 70; US-02.2.1, US-02.2.4, D125): a PDF added by hand lands
 * as a mailbox one does; an unreadable PDF stays until dismissed with a reason; emailing its sender is recorded only.
 */
import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from './appStore'
import { OFFICE_ACTOR, DEMO_TRIGGER_ACTOR } from './demoActors'
import { arrivalByKey, arrivalItemsOf } from './intakeSelectors'
import { matchingAttentionCount } from './matchingSelectors'
import {
  addPdfByHand,
  byHandSamples,
  DISMISS_REASON_REQUIRED_MESSAGE,
  dismissUnreadablePdf,
  SENDER_REQUIRED_MESSAGE,
  sendUnreadablePdfEmail,
  unreadableEmailDraft,
  unreadableEmailsSent,
} from './pdfListActions'
import { OKAFOR_ROOMS_PDF, OKAFOR_ROOMS_RESEND, SCAN_PDF, UNREADABLE_PDF } from '../domain/intake/hospitalDownloads'
import { SEED_PDF_LIST } from '../domain/seed/intakeSeed'

const SENDER = 'leanne.pa@avonsidesurgical.example'

function fresh(): AppStoreApi {
  return createAppStore()
}

function addUnreadable(api: AppStoreApi): string {
  const out = addPdfByHand(api, OFFICE_ACTOR, UNREADABLE_PDF.id, UNREADABLE_PDF.senderEmail)
  if (!out.ok) throw new Error(out.message)
  return out.value.batchId
}

describe('the samples Add a PDF by hand offers', () => {
  it('offers the mailbox and older samples not yet received, never a re-send, and the unreadable page', () => {
    const ids = byHandSamples(fresh().getState()).map((s) => s.id)
    expect(ids).toContain(OKAFOR_ROOMS_PDF.id)
    expect(ids).toContain(SCAN_PDF.id)
    expect(ids).toContain('PDF-WHITFORD-0812')
    expect(ids).toContain(UNREADABLE_PDF.id)
    expect(ids).not.toContain(OKAFOR_ROOMS_RESEND.id)
    // The seed's PDF has already arrived.
    expect(ids).not.toContain(SEED_PDF_LIST.sampleId)
  })

  it('drops a sample once it has arrived, and the unreadable page while one stands', () => {
    const api = fresh()
    expect(addPdfByHand(api, OFFICE_ACTOR, SCAN_PDF.id, SENDER).ok).toBe(true)
    addUnreadable(api)
    const ids = byHandSamples(api.getState()).map((s) => s.id)
    expect(ids).not.toContain(SCAN_PDF.id)
    expect(ids).not.toContain(UNREADABLE_PDF.id)
  })
})

describe('a PDF added by hand', () => {
  it('lands like a mailbox PDF: rows staged, the source the person with the typed sender, a new List arrival', () => {
    const api = fresh()
    const out = addPdfByHand(api, OFFICE_ACTOR, OKAFOR_ROOMS_PDF.id, ` ${SENDER} `)
    expect(out.ok).toBe(true)
    if (!out.ok) return
    const s = api.getState()
    const batch = s.intake.batches[out.value.batchId]!
    expect(batch.rowIds).toHaveLength(OKAFOR_ROOMS_PDF.rows.length)
    expect(batch.arrivalSource).toEqual({ kind: 'byHand', by: OFFICE_ACTOR.who, senderEmail: SENDER })
    expect(batch.importedBy).toBe(OFFICE_ACTOR.who)
    expect(s.intake.pdfLists[batch.pdfListId!]).toMatchObject({ sampleId: OKAFOR_ROOMS_PDF.id, senderEmail: SENDER, status: 'sent' })
    for (const id of batch.rowIds) expect(s.intake.rows[id]!.status).toBe('open')
    // The arrival the feed opens on: the new List, never a row waiting for an NHI.
    expect(arrivalByKey(s, out.value.arrivalKey)).toMatchObject({ kind: 'newList', batchId: out.value.batchId })
    expect(s.audit.some((a) => a.action === 'pdfList.addByHand' && a.who === OFFICE_ACTOR.who)).toBe(true)
  })

  it('a List AA holds lands as its update, and the feed opens on it', () => {
    const api = fresh()
    const out = addPdfByHand(api, OFFICE_ACTOR, SCAN_PDF.id, SENDER)
    expect(out.ok).toBe(true)
    if (!out.ok) return
    const item = arrivalByKey(api.getState(), out.value.arrivalKey)
    expect(item?.batchId).toBe(out.value.batchId)
    expect(item?.kind).not.toBe('needsNhi')
  })

  it('takes an older sample, naming its anaesthetist', () => {
    const api = fresh()
    const out = addPdfByHand(api, OFFICE_ACTOR, 'PDF-WHITFORD-0812', 'bookings@merivaleeye.example')
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(api.getState().intake.batches[out.value.batchId]!.rowIds.length).toBe(3)
    expect(arrivalItemsOf(api.getState()).some((i) => i.key === out.value.arrivalKey)).toBe(true)
  })

  it('needs the sender, as an email address, and is refused a second time', () => {
    const api = fresh()
    const before = api.getState()
    const blank = addPdfByHand(api, OFFICE_ACTOR, SCAN_PDF.id, '  ')
    expect(blank).toMatchObject({ ok: false, code: 'senderRequired', message: SENDER_REQUIRED_MESSAGE })
    expect(addPdfByHand(api, OFFICE_ACTOR, SCAN_PDF.id, 'not an address')).toMatchObject({ ok: false, code: 'invalidEmail' })
    expect(addPdfByHand(api, OFFICE_ACTOR, UNREADABLE_PDF.id, 'nope')).toMatchObject({ ok: false, code: 'invalidEmail' })
    expect(api.getState()).toBe(before)
    expect(addPdfByHand(api, OFFICE_ACTOR, SCAN_PDF.id, SENDER).ok).toBe(true)
    expect(addPdfByHand(api, OFFICE_ACTOR, SCAN_PDF.id, SENDER)).toMatchObject({ ok: false, code: 'alreadyReceived' })
  })

  it('is office only', () => {
    const api = fresh()
    const before = api.getState()
    expect(addPdfByHand(api, DEMO_TRIGGER_ACTOR, SCAN_PDF.id, SENDER)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(api.getState()).toBe(before)
  })
})

describe('an unreadable PDF', () => {
  it('lands with its reason and the typed sender, and stays in the feed and the Intake count until dismissed', () => {
    const api = fresh()
    const countBefore = matchingAttentionCount(api.getState())
    const out = addPdfByHand(api, OFFICE_ACTOR, UNREADABLE_PDF.id, 'scans@riccartonortho.example')
    expect(out.ok).toBe(true)
    if (!out.ok) return
    const s = api.getState()
    expect(s.intake.batches[out.value.batchId]).toMatchObject({ rowIds: [], unreadableReason: UNREADABLE_PDF.reason, senderEmail: 'scans@riccartonortho.example' })
    expect(arrivalByKey(s, out.value.arrivalKey)).toMatchObject({ kind: 'unreadable', decided: false, reason: UNREADABLE_PDF.reason })
    expect(matchingAttentionCount(s)).toBe(countBefore + 1)
    expect(addPdfByHand(api, OFFICE_ACTOR, UNREADABLE_PDF.id, 'scans@riccartonortho.example')).toMatchObject({ ok: false, code: 'alreadyReceived' })
  })

  it('is dismissed only with a reason, office only, once; then the count drops and the record stays', () => {
    const api = fresh()
    const countBefore = matchingAttentionCount(api.getState())
    const batchId = addUnreadable(api)
    expect(dismissUnreadablePdf(api, OFFICE_ACTOR, batchId, '  ')).toMatchObject({ ok: false, code: 'reasonRequired', message: DISMISS_REASON_REQUIRED_MESSAGE })
    expect(dismissUnreadablePdf(api, DEMO_TRIGGER_ACTOR, batchId, 'Clearer copy received')).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(api.getState().intake.batches[batchId]!.dismissed).toBeUndefined()

    expect(dismissUnreadablePdf(api, OFFICE_ACTOR, batchId, ' Clearer copy received ').ok).toBe(true)
    const s = api.getState()
    expect(s.intake.batches[batchId]!.dismissed).toEqual({ by: OFFICE_ACTOR.who, atISO: expect.any(String), reason: 'Clearer copy received' })
    expect(matchingAttentionCount(s)).toBe(countBefore)
    expect(arrivalByKey(s, batchId)).toMatchObject({ decided: true })
    expect(s.audit.at(-1)).toMatchObject({ action: 'importBatch.dismissed', entityType: 'importBatch', entityId: batchId, who: OFFICE_ACTOR.who })
    expect(dismissUnreadablePdf(api, OFFICE_ACTOR, batchId, 'Again')).toMatchObject({ ok: false, code: 'alreadyDismissed' })
    // Once dismissed, the page can be added again.
    expect(byHandSamples(s).map((x) => x.id)).toContain(UNREADABLE_PDF.id)
  })

  it('drafts an email to the sender with the reason, with no dashes', () => {
    const api = fresh()
    const batchId = addUnreadable(api)
    const draft = unreadableEmailDraft(api.getState().intake.batches[batchId]!)
    expect(draft.to).toBe(UNREADABLE_PDF.senderEmail)
    expect(draft.subject).toContain(UNREADABLE_PDF.fileName)
    expect(draft.body).toContain(UNREADABLE_PDF.reason)
    expect(`${draft.subject}${draft.body}`).not.toMatch(/[–—]/)
  })

  it('records the email in the audit only: no domain slice changes, and it is listed as sent', () => {
    const api = fresh()
    const batchId = addUnreadable(api)
    const before = api.getState()
    const draft = unreadableEmailDraft(before.intake.batches[batchId]!)
    expect(sendUnreadablePdfEmail(api, OFFICE_ACTOR, batchId, { ...draft, to: 'nope' })).toMatchObject({ ok: false, code: 'invalidEmail' })
    expect(sendUnreadablePdfEmail(api, OFFICE_ACTOR, batchId, { ...draft, body: ' ' })).toMatchObject({ ok: false, code: 'bodyRequired' })
    expect(sendUnreadablePdfEmail(api, DEMO_TRIGGER_ACTOR, batchId, draft)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(api.getState()).toBe(before)

    expect(sendUnreadablePdfEmail(api, OFFICE_ACTOR, batchId, draft).ok).toBe(true)
    const after = api.getState()
    expect(after.intake).toBe(before.intake)
    expect(after.schedule).toBe(before.schedule)
    expect(after.masters).toBe(before.masters)
    expect(after.audit).toHaveLength(before.audit.length + 1)
    expect(after.audit.at(-1)).toMatchObject({ entityType: 'importBatch', entityId: batchId, action: 'importBatch.emailSender', after: { to: draft.to, subject: draft.subject } })
    expect(unreadableEmailsSent(after, batchId)).toEqual([{ to: draft.to, atISO: expect.any(String), by: OFFICE_ACTOR.who }])

    dismissUnreadablePdf(api, OFFICE_ACTOR, batchId, 'Clearer copy received')
    expect(sendUnreadablePdfEmail(api, OFFICE_ACTOR, batchId, draft)).toMatchObject({ ok: false, code: 'alreadyDismissed' })
  })
})
