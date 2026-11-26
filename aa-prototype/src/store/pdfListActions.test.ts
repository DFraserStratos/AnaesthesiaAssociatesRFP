/**
 * Catch-up Phase 34: the rooms' PDF lists (FT-02.2, US-02.2.1, DM-61) and
 * where a List came from (US-02.2.4, DM-70), against the real seed.
 */
import { describe, expect, it } from 'vitest'
import { createAppStore, freshAppState, type AppStoreApi } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { correctPdfListRow, receiveResentPdfList, resendRefusal, sendPdfListToMatching, uploadPdfList } from './pdfListActions'
import { decideImportRow } from './matchingActions'
import { assessImportRow } from './matchingSelectors'
import { resetDemo } from './clockActions'
import { SEED_PDF_LIST } from '../domain/seed/intakeSeed'
import { SEED_ORIGIN_LISTS, SEED_PDF_LIST_SENDER } from '../domain/seed/listOrigins'
import { officeAddressFor } from '../domain/surgeonContacts'
import { effectivePdfRow, pdfRowIssues, PDF_LIST_SAMPLES } from '../domain/intake'
import { SURG } from '../domain/seed/cast'
import type { Actor } from './mutate'

const ANAESTHETIST: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }
const OKAFOR = SEED_PDF_LIST.id
const WHITFORD_SAMPLE = 'PDF-WHITFORD-0812'
const WHITFORD_LIST = 'L-47733-2026-12-16-PM'
/** Dr Rutherford's Wed 5 Aug AM: the session Mr Okafor's list suggests, which holds no List. */
const OKAFOR_SLOT = 'S-29104-2026-12-09-AM'

/**
 * The legacy two-step path these tests pin (upload, correct, send). Phase 68 seeds Mr Okafor's PDF as a mailbox
 * arrival, sent at once with its rows staged (D125); here it is put back as received, its rows not yet staged.
 */
function fresh(): AppStoreApi {
  const api = createAppStore()
  const s = api.getState()
  const staged = new Set<string>(SEED_PDF_LIST.rowIds)
  const batches = Object.fromEntries(Object.entries(s.intake.batches).filter(([id]) => id !== SEED_PDF_LIST.batchId))
  const rows = Object.fromEntries(Object.entries(s.intake.rows).filter(([id]) => !staged.has(id)))
  const { batchId: _batchId, sentAtISO: _sentAt, sentBy: _sentBy, ...received } = s.intake.pdfLists[OKAFOR]!
  api.setState({ intake: { ...s.intake, batches, rows, pdfLists: { ...s.intake.pdfLists, [OKAFOR]: { ...received, status: 'received' } } } })
  return api
}

function rowsOfBatch(api: AppStoreApi, batchId: string | undefined): string[] {
  return batchId === undefined ? [] : api.getState().intake.batches[batchId]!.rowIds
}

/** Correct the Okafor list's invalid NHI (R2: ZAA0068 to ZAA0067) and send it. */
function sendOkafor(api: AppStoreApi) {
  expect(correctPdfListRow(api, OFFICE_ACTOR, OKAFOR, 'R2', { nhi: 'ZAA0067' }).ok).toBe(true)
  const sent = sendPdfListToMatching(api, OFFICE_ACTOR, OKAFOR)
  if (!sent.ok) throw new Error(sent.message)
  return sent.value
}

/** Decide the first Okafor row by creating a List in Dr Rutherford's session, then the rest onto it. */
function decideOkafor(api: AppStoreApi, batchId: string | undefined): string {
  const [first, ...rest] = rowsOfBatch(api, batchId)
  const made = decideImportRow(api, OFFICE_ACTOR, first!, { kind: 'createList', slotId: api.getState().schedule.slots[OKAFOR_SLOT]!.id })
  if (!made.ok) throw new Error(made.message)
  for (const id of rest) {
    const s = assessImportRow(api.getState(), id)!.suggestion
    if (s?.kind !== 'createBooking') throw new Error(`expected a createBooking suggestion for ${id}`)
    const res = decideImportRow(api, OFFICE_ACTOR, id, s)
    if (!res.ok) throw new Error(res.message)
  }
  return made.value.listId!
}

describe('the seeded inbox', () => {
  it('holds Mr Okafor\'s list as received, with its sender, touching no List', () => {
    const s = freshAppState()
    const list = s.intake.pdfLists[OKAFOR]!
    // Arrived in the mailbox and read at once (Phase 68, D125): no received-then-sent step.
    expect(list).toMatchObject({ status: 'sent', batchId: SEED_PDF_LIST.batchId })
    expect(list.senderEmail).toBe('leanne.pa@avonsidesurgical.example')
    expect(list.surgeonId).toBe(SURG.okafor)
    expect(list.rows.map((r) => r.asRead.procedureText)).toEqual(['R inguinal hernia mesh', 'lap chole +/- IOC', 'gastro/colon'])
    expect(s.counters.pdfList).toBe(2)
    // Its target session holds no List, so its first decision creates one.
    expect(Object.values(s.schedule.lists).some((l) => l.slotId === OKAFOR_SLOT)).toBe(false)
  })

  it('is deterministic', () => {
    expect(JSON.stringify(freshAppState().intake.pdfLists)).toBe(JSON.stringify(freshAppState().intake.pdfLists))
  })
})

describe('upload (US-02.2.1, US-02.2.4)', () => {
  it('needs the address the PDF arrived from, as an email, office only, once per sample', () => {
    const api = fresh()
    expect(uploadPdfList(api, OFFICE_ACTOR, WHITFORD_SAMPLE, '  ')).toMatchObject({ ok: false, code: 'senderRequired' })
    expect(uploadPdfList(api, OFFICE_ACTOR, WHITFORD_SAMPLE, 'not an email')).toMatchObject({ ok: false, code: 'invalidEmail' })
    expect(uploadPdfList(api, ANAESTHETIST, WHITFORD_SAMPLE, 'bookings@merivaleeye.example')).toMatchObject({ ok: false, code: 'officeOnly' })
    const up = uploadPdfList(api, OFFICE_ACTOR, WHITFORD_SAMPLE, ' bookings@merivaleeye.example ')
    if (!up.ok) throw new Error(up.message)
    const list = api.getState().intake.pdfLists[up.value.pdfListId]!
    expect(up.value.pdfListId).toBe('PDL0002')
    expect(list.senderEmail).toBe('bookings@merivaleeye.example')
    expect(list.status).toBe('received')
    expect(api.getState().audit.some((a) => a.action === 'pdfList.upload' && a.entityId === 'PDL0002')).toBe(true)
    expect(uploadPdfList(api, OFFICE_ACTOR, WHITFORD_SAMPLE, 'bookings@merivaleeye.example')).toMatchObject({ ok: false, code: 'alreadyReceived' })
    expect(uploadPdfList(api, OFFICE_ACTOR, 'PDF-OKAFOR-0805', 'x@y.example')).toMatchObject({ ok: false, code: 'alreadyReceived' })
  })
})

describe('correction before ingest (US-02.2.1)', () => {
  it('keeps each correction with who and when, the wording as read, and checks the NHI as typed', () => {
    const api = fresh()
    expect(pdfRowIssues(api.getState().intake.pdfLists[OKAFOR]!.rows[1]!)[0]).toMatchObject({ code: 'nhiInvalid', blocksSend: true })
    expect(correctPdfListRow(api, OFFICE_ACTOR, OKAFOR, 'R2', { nhi: 'ZAA0069' })).toMatchObject({ ok: false, code: 'invalidNhi' })
    expect(correctPdfListRow(api, OFFICE_ACTOR, OKAFOR, 'R2', { procedureText: 'lap chole' } as never)).toMatchObject({ ok: false, code: 'wordingKeptAsReceived' })
    expect(correctPdfListRow(api, OFFICE_ACTOR, OKAFOR, 'R2', { nhi: 'zaa0067', scheduledTime: '09:30' }).ok).toBe(true)
    const row = api.getState().intake.pdfLists[OKAFOR]!.rows[1]!
    expect(row.corrections.map((c) => [c.field, c.from, c.to, c.by])).toEqual([
      ['nhi', 'ZAA0068', 'ZAA0067', OFFICE_ACTOR.who],
      ['scheduledTime', '09:15', '09:30', OFFICE_ACTOR.who],
    ])
    expect(row.asRead.nhi).toBe('ZAA0068')
    expect(effectivePdfRow(row)).toMatchObject({ nhi: 'ZAA0067', scheduledTime: '09:30', procedureText: 'lap chole +/- IOC' })
    expect(pdfRowIssues(row)).toEqual([])
  })
})

describe('send to matching (US-02.2.1, no direct write)', () => {
  it('is refused while an NHI is invalid', () => {
    const api = fresh()
    expect(sendPdfListToMatching(api, OFFICE_ACTOR, OKAFOR)).toMatchObject({ ok: false, code: 'invalidNhi' })
    expect(api.getState().intake.pdfLists[OKAFOR]!.status).toBe('received')
  })

  it('stages each row once with the rooms as source and the wording verbatim, and writes no Booking, List or Patient', () => {
    const api = fresh()
    const before = api.getState()
    const sent = sendOkafor(api)
    const s = api.getState()
    expect(sent.staged).toBe(3)
    expect(s.schedule.bookings).toBe(before.schedule.bookings)
    expect(s.schedule.lists).toBe(before.schedule.lists)
    expect(s.masters.patients).toBe(before.masters.patients)
    const batch = s.intake.batches[sent.batchId!]!
    expect(batch).toMatchObject({ channel: 'pdfList', source: 'rooms', pdfListId: OKAFOR, senderEmail: 'leanne.pa@avonsidesurgical.example' })
    const rows = batch.rowIds.map((id) => s.intake.rows[id]!)
    expect(rows.map((r) => r.incoming.procedure?.text)).toEqual(['R inguinal hernia mesh', 'lap chole +/- IOC', 'gastro/colon'])
    expect(rows.every((r) => r.source === 'rooms' && r.status === 'open')).toBe(true)
    expect(rows[1]!.incoming.patient.nhi).toBe('ZAA0067')
    expect(s.intake.pdfLists[OKAFOR]).toMatchObject({ status: 'sent', batchId: sent.batchId })
    expect(sendPdfListToMatching(api, OFFICE_ACTOR, OKAFOR)).toMatchObject({ ok: false, code: 'alreadySent' })
  })

  it('a blank NHI is sent and waits at intake with a stub on its List', () => {
    const api = fresh()
    const up = uploadPdfList(api, OFFICE_ACTOR, WHITFORD_SAMPLE, 'bookings@merivaleeye.example')
    if (!up.ok) throw new Error(up.message)
    expect(pdfRowIssues(api.getState().intake.pdfLists[up.value.pdfListId]!.rows[2]!)[0]).toMatchObject({ code: 'noNhi', blocksSend: false })
    const sent = sendPdfListToMatching(api, OFFICE_ACTOR, up.value.pdfListId)
    if (!sent.ok) throw new Error(sent.message)
    const s = api.getState()
    const noNhi = rowsOfBatch(api, sent.value.batchId).find((id) => s.intake.rows[id]!.incoming.patient.nhi === undefined)!
    expect(assessImportRow(s, noNhi)!.waitingForNhi).toBe(true)
    const stub = Object.values(s.intake.stubs).find((x) => x.importRowId === noNhi)
    expect(stub).toMatchObject({ listId: WHITFORD_LIST, status: 'standing' })
  })
})

describe('deciding rooms rows: the List and its origin (US-02.2.4)', () => {
  it('the first decision creates a List recording the PDF and its sender; the rest land on it; Bookings are from the surgeon\'s PDF', () => {
    const api = fresh()
    const sent = sendOkafor(api)
    const listId = decideOkafor(api, sent.batchId)
    const s = api.getState()
    expect(s.schedule.lists[listId]!.origin).toEqual({ kind: 'pdf', senderEmail: 'leanne.pa@avonsidesurgical.example', pdfListId: OKAFOR })
    const bookings = Object.values(s.schedule.bookings).filter((b) => b.listId === listId)
    expect(bookings).toHaveLength(3)
    expect(bookings.every((b) => b.source === 'surgeonPdf')).toBe(true)
    const procs = Object.values(s.schedule.procedures).filter((p) => bookings.some((b) => b.id === p.bookingId))
    expect(procs.map((p) => p.procedureText?.source)).toEqual(['surgeonPdf', 'surgeonPdf', 'surgeonPdf'])
    // The office's replies go to the sender, not Mr Okafor's first office contact; the contact is offered.
    const to = officeAddressFor(s.masters, SURG.okafor, s.schedule.lists[listId])
    expect(to.to).toEqual({ email: 'leanne.pa@avonsidesurgical.example', source: 'listSender' })
    expect(to.others.map((o) => o.email)).toEqual(['admin@avonsidesurgical.example'])
  })

  it('a re-sent list stages its unchanged rows to confirm, brings the changed time as a modification and the new patient as a new row; applying a row takes the newer sender into History', () => {
    const api = fresh()
    const first = sendOkafor(api)
    const listId = decideOkafor(api, first.batchId)
    expect(resendRefusal(api.getState(), 'PDF-OKAFOR-0805')).toBeNull()
    const re = receiveResentPdfList(api, OFFICE_ACTOR, 'PDF-OKAFOR-0805')
    if (!re.ok) throw new Error(re.message)
    const resent = api.getState().intake.pdfLists[re.value.pdfListId]!
    expect(resent).toMatchObject({ replacesId: OKAFOR, senderEmail: 'admin@avonsidesurgical.example', status: 'received' })
    expect(resendRefusal(api.getState(), 'PDF-OKAFOR-0805')).toBe('The updated list has already arrived.')
    const before = api.getState().schedule.bookings
    const sent = sendPdfListToMatching(api, OFFICE_ACTOR, re.value.pdfListId)
    if (!sent.ok) throw new Error(sent.message)
    // Every row is staged, the unchanged ones included (Phase 68; DM-21): they wait for a person's confirm.
    expect(sent.value).toMatchObject({ staged: 4, unchanged: 0 })
    // Nothing applied until decided.
    expect(api.getState().schedule.bookings).toBe(before)
    const assessed = rowsOfBatch(api, sent.value.batchId).map((id) => assessImportRow(api.getState(), id)!)
    expect(assessed.map((a) => a.changeType)).toEqual(['noChange', 'modification', 'noChange', 'new'])
    const [, changed, , added] = assessed
    expect(changed!.changeType).toBe('modification')
    expect(changed!.diffs.map((d) => d.key)).toEqual(['time'])
    expect(added!.changeType).toBe('new')
    expect(api.getState().schedule.lists[listId]!.origin).toMatchObject({ senderEmail: 'leanne.pa@avonsidesurgical.example' })
    const applied = decideImportRow(api, OFFICE_ACTOR, changed!.rowId, changed!.suggestion!)
    if (!applied.ok) throw new Error(applied.message)
    const s = api.getState()
    expect(s.schedule.lists[listId]!.origin).toEqual({ kind: 'pdf', senderEmail: 'admin@avonsidesurgical.example', pdfListId: re.value.pdfListId })
    const history = s.audit.find((a) => a.action === 'list.senderChanged' && a.entityId === listId)
    expect(history).toMatchObject({ before: { senderEmail: 'leanne.pa@avonsidesurgical.example' }, after: { senderEmail: 'admin@avonsidesurgical.example' } })
  })

  it('a rooms row onto a by-hand or recurring List adds no sender', () => {
    const api = fresh()
    const up = uploadPdfList(api, OFFICE_ACTOR, WHITFORD_SAMPLE, 'someone.else@merivaleeye.example')
    if (!up.ok) throw new Error(up.message)
    const sent = sendPdfListToMatching(api, OFFICE_ACTOR, up.value.pdfListId)
    if (!sent.ok) throw new Error(sent.message)
    const r1 = rowsOfBatch(api, sent.value.batchId)[0]!
    const s = assessImportRow(api.getState(), r1)!.suggestion!
    expect(s).toMatchObject({ kind: 'createBooking', listId: WHITFORD_LIST })
    expect(decideImportRow(api, OFFICE_ACTOR, r1, s).ok).toBe(true)
    expect(api.getState().schedule.lists[WHITFORD_LIST]!.origin).toEqual({ kind: 'recurring' })
    expect(api.getState().audit.some((a) => a.action === 'list.senderChanged')).toBe(false)
  })
})

describe('the re-send trigger body', () => {
  it('waits until the first version is sent, and refuses a list with no update', () => {
    const api = fresh()
    expect(resendRefusal(api.getState(), 'PDF-OKAFOR-0805')).toBe('Send the first version to matching first.')
    expect(receiveResentPdfList(api, OFFICE_ACTOR, 'PDF-OKAFOR-0805')).toMatchObject({ ok: false, code: 'resendNotReady' })
    expect(resendRefusal(api.getState(), 'PDF-NOPE')).toBe('This list has no updated version.')
    expect(PDF_LIST_SAMPLES).toHaveLength(2)
  })
})

describe('seeded origins and reset', () => {
  it('pins one pdf List whose sender is not the surgeon\'s first office contact, and one hospital List; the rest manual or recurring', () => {
    const s = freshAppState()
    const pdf = s.schedule.lists[SEED_ORIGIN_LISTS.pdf]!
    expect(pdf.origin).toEqual({ kind: 'pdf', senderEmail: SEED_PDF_LIST_SENDER })
    const replies = officeAddressFor(s.masters, pdf.surgeonId, pdf)
    expect(replies.to?.email).toBe(SEED_PDF_LIST_SENDER)
    expect(officeAddressFor(s.masters, pdf.surgeonId).to?.email).not.toBe(SEED_PDF_LIST_SENDER)
    expect(s.schedule.lists[SEED_ORIGIN_LISTS.hospital]!.origin.kind).toBe('hospital')
    for (const l of Object.values(s.schedule.lists)) {
      if (l.id === SEED_ORIGIN_LISTS.pdf || l.id === SEED_ORIGIN_LISTS.hospital) continue
      if (l.recurringBookingId !== undefined && l.draft === undefined) expect(l.origin.kind).toBe('recurring')
      expect(['manual', 'recurring']).toContain(l.origin.kind)
    }
  })

  it('reset restores the seeded inbox and origins', () => {
    const api = fresh()
    sendOkafor(api)
    resetDemo(api)
    expect(JSON.stringify(api.getState().intake.pdfLists)).toBe(JSON.stringify(freshAppState().intake.pdfLists))
  })
})
