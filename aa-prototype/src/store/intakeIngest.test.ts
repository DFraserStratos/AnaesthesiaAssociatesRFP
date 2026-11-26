/**
 * Intake's front door (build plan Phase 68; D119, D125, DM-13, DM-21): every arrival made by its source, audited as
 * that source, deciding nothing. Against the real seed (the core cast under Vitest; the practice where a sample
 * needs its Lists).
 */
import { describe, expect, it } from 'vitest'
import { createAppStore, practiceAppState, type AppStoreApi } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { decideArrivingLists } from './intakeDecide'
import { arrivalItemsOf } from './intakeSelectors'
import {
  MAILBOX_ACTOR,
  REMOVAL_REASON,
  receiveCancellation,
  receiveFailedMessage,
  receiveHospitalBatch,
  receiveMailboxPdf,
  receiveUnreadablePdf,
  stgDayBeforeRows,
  sxCancellationRow,
} from './intakeIngest'
import { SCRIPTED_BEAT_SCHEDULE } from '../domain/seed'
import { SEED_DECIDED_ARRIVAL, SEED_PDF_LIST, SEED_STUB } from '../domain/seed/intakeSeed'
import { OKAFOR_STORY, OKAFOR_STORY_LIST, OKAFOR_STORY_PATIENTS, type MailboxPdfSample } from '../domain/intake/hospitalDownloads'
import { isUnsure } from '../domain/intake/pdfRead'
import { validateNhi } from '../domain/nhi'
import { HOSP } from '../domain/seed/cast'
import type { IncomingBookingFields } from '../domain/types'

function fresh(): AppStoreApi {
  return createAppStore()
}

/** The audit entries written since `from`: who wrote them and as what. */
function actorsSince(api: AppStoreApi, from: number): { who: string; role: string }[] {
  return api.getState().audit.slice(from).map((a) => ({ who: a.who, role: a.role }))
}

/** Every write since `from` was made by `who`, never the office. */
function expectRunAs(api: AppStoreApi, from: number, who: string) {
  const actors = actorsSince(api, from)
  expect(actors.length).toBeGreaterThan(0)
  for (const a of actors) {
    expect(a.who).toBe(who)
    expect(a.role).not.toBe('office')
  }
}

/** Place the first Okafor PDF's rows that are not waiting as a Draft List (the office's decision, so the List is held). */
function placeOkafor(api: AppStoreApi, rowIds: readonly string[]): string {
  const rows = api.getState().intake.rows
  const placeable = rowIds.filter((id) => rows[id]!.incoming.patient.nhi !== undefined)
  const out = decideArrivingLists(api, OFFICE_ACTOR, [{ rows: placeable.map((rowId) => ({ rowId, kind: 'place' as const })), placement: { kind: 'draft' } }])
  if (!out.ok) throw new Error(out.message)
  return out.value.placedListIds[0]!
}

describe('the seed (Phase 68): arrivals by source', () => {
  it('the seeded PDF is a mailbox arrival, sent at once, its rows open with their read values', () => {
    const s = fresh().getState()
    const pdf = s.intake.pdfLists[SEED_PDF_LIST.id]!
    expect(pdf).toMatchObject({ status: 'sent', batchId: SEED_PDF_LIST.batchId, receivedBy: MAILBOX_ACTOR.who })
    expect(pdf.headerRead?.map((v) => v.field)).toEqual(['surgeon', 'hospital', 'date', 'session', 'anaesthetist'])
    expect(s.intake.batches[SEED_PDF_LIST.batchId]).toMatchObject({ channel: 'pdfList', source: 'rooms', pdfListId: SEED_PDF_LIST.id, arrivalSource: { kind: 'mailbox' } })
    const rows = SEED_PDF_LIST.rowIds.map((id) => s.intake.rows[id]!)
    expect(rows.map((r) => [r.status, r.pdfRowId])).toEqual([['open', 'R1'], ['open', 'R2'], ['open', 'R3']])
    // The NHI printed wrongly reads unsure; nothing else does.
    expect(pdf.rows.flatMap((r) => (r.read ?? []).filter(isUnsure).map((v) => `${r.id}.${v.field}`))).toEqual(['R2.nhi'])
  })

  it('one decided arrival: every row matched with no change, by the office, on its List', () => {
    const s = fresh().getState()
    const batch = s.intake.batches[SEED_DECIDED_ARRIVAL.batchId]!
    expect(batch.rowIds.length).toBeGreaterThan(0)
    for (const id of batch.rowIds) {
      const r = s.intake.rows[id]!
      expect(r).toMatchObject({ status: 'applied', decidedBy: 'Kirsty W.', decision: { kind: 'match', changeType: 'noChange', listId: SEED_DECIDED_ARRIVAL.listId } })
      const d = r.decision!
      expect(d.kind === 'match' && s.schedule.bookings[d.bookingId]!.listId).toBe(SEED_DECIDED_ARRIVAL.listId)
    }
    expect(arrivalItemsOf(s).find((i) => i.batchId === batch.id)).toMatchObject({ kind: 'matchesExactly', decided: true })
  })
})

describe('the rooms email a List (D119 action 1)', () => {
  it('lands at once as the mailbox: the PDF sent, four rows open, the named anaesthetist on each, nothing decided', () => {
    const api = fresh()
    const before = api.getState()
    const out = receiveMailboxPdf(api, OKAFOR_STORY.roomsList)
    if (!out.ok) throw new Error(out.message)
    expectRunAs(api, before.audit.length, MAILBOX_ACTOR.who)
    const s = api.getState()
    expect(s.schedule).toBe(before.schedule)
    const pdf = s.intake.pdfLists[out.value.pdfListId]!
    expect(pdf).toMatchObject({ status: 'sent', batchId: out.value.batchId, senderEmail: OKAFOR_STORY.roomsList.senderEmail, target: { anaesthetistId: OKAFOR_STORY_LIST.anaesthetistId } })
    expect(out.value.removalRowIds).toEqual([])
    const rows = out.value.rowIds.map((id) => s.intake.rows[id]!)
    expect(rows.map((r) => r.status)).toEqual(['open', 'open', 'open', 'open'])
    expect(rows.map((r) => r.pdfRowId)).toEqual(['R1', 'R2', 'R3', 'R4'])
    expect(rows.every((r) => r.decision === undefined && r.source === 'rooms' && r.incoming.anaesthetist?.hpiId === '11RUTJ')).toBe(true)
    expect(rows.filter((r) => r.incoming.patient.nhi === undefined).map((r) => r.incoming.patient.name)).toEqual([OKAFOR_STORY_PATIENTS.faleolo.name])
    expect(s.intake.batches[out.value.batchId]).toMatchObject({ arrivalSource: { kind: 'mailbox', senderEmail: OKAFOR_STORY.roomsList.senderEmail } })
    expect(s.intake.sources['SRC-MAILBOX']!.lastReceivedAtISO).toBe(s.intake.batches[out.value.batchId]!.receivedAtISO)
    expect(arrivalItemsOf(s).find((i) => i.batchId === out.value.batchId && i.kind !== 'needsNhi')).toMatchObject({ kind: 'newList', namedAnaesthetistId: OKAFOR_STORY_LIST.anaesthetistId })
    // The same PDF twice is refused.
    expect(receiveMailboxPdf(api, OKAFOR_STORY.roomsList)).toMatchObject({ ok: false, code: 'alreadyReceived' })
  })

  it('a PDF added by hand runs as the person, with the address it came from', () => {
    const api = fresh()
    const out = receiveMailboxPdf(api, OKAFOR_STORY.roomsList, { byHand: { by: 'Kirsty W.', senderEmail: 'leanne.pa@avonsidesurgical.example' } })
    if (!out.ok) throw new Error(out.message)
    expect(api.getState().intake.batches[out.value.batchId]).toMatchObject({ importedBy: 'Kirsty W.', arrivalSource: { kind: 'byHand', by: 'Kirsty W.', senderEmail: 'leanne.pa@avonsidesurgical.example' } })
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'pdfList.addByHand' })
  })

  it('a scan reads three values unsure and keeps the rest sure', () => {
    const api = fresh()
    const out = receiveMailboxPdf(api, OKAFOR_STORY.scan)
    if (!out.ok) throw new Error(out.message)
    const pdf = api.getState().intake.pdfLists[out.value.pdfListId]!
    expect(pdf.scanned).toBe(true)
    expect(pdf.rows.flatMap((r) => (r.read ?? []).filter(isUnsure).map((v) => `${r.id}.${v.field}`))).toEqual(['R2.nhi', 'R3.dobISO', 'R4.scheduledTime'])
    expect((pdf.headerRead ?? []).some(isUnsure)).toBe(false)
  })
})

describe('the rooms re-send it (D119 action 2; DM-13)', () => {
  it('stages a removal row for the Booking it lacks, once, and again after one is left out', () => {
    const api = fresh()
    const first = receiveMailboxPdf(api, OKAFOR_STORY.roomsList)
    if (!first.ok) throw new Error(first.message)
    const listId = placeOkafor(api, first.value.rowIds)
    const pike = Object.values(api.getState().schedule.bookings).find((b) => b.listId === listId && api.getState().masters.patients[b.patientId]!.nhi === OKAFOR_STORY_PATIENTS.pike.nhi)!
    expect(pike.source).toBe('surgeonPdf')

    const before = api.getState()
    const re = receiveMailboxPdf(api, OKAFOR_STORY.roomsResend)
    if (!re.ok) throw new Error(re.message)
    expectRunAs(api, before.audit.length, MAILBOX_ACTOR.who)
    expect(api.getState().schedule).toBe(before.schedule)
    expect(re.value.removalRowIds).toHaveLength(1)
    const removal = api.getState().intake.rows[re.value.removalRowIds[0]!]!
    expect(removal).toMatchObject({ status: 'open', removalOfBookingId: pike.id, incoming: { hospitalStatus: 'cancelled', cancelReason: REMOVAL_REASON, patient: { nhi: OKAFOR_STORY_PATIENTS.pike.nhi } } })
    // Ngata is identical to a decided row: staged again (DM-21). Faleolo is identical to his open row: not staged.
    const names = re.value.rowIds.map((id) => api.getState().intake.rows[id]!.incoming.patient.name)
    expect(names).toEqual([OKAFOR_STORY_PATIENTS.ngata.name, OKAFOR_STORY_PATIENTS.lindqvist.name, OKAFOR_STORY_PATIENTS.brooks.name])
    // The removal groups with the re-sent List's rows.
    expect(arrivalItemsOf(api.getState()).find((i) => i.batchId === re.value.batchId && i.kind !== 'needsNhi')).toMatchObject({ kind: 'update', flags: { removals: 1 } })

    // A later re-send while the removal is still open offers no second one.
    const third: MailboxPdfSample = { ...OKAFOR_STORY.roomsResend, id: 'TEST-RESEND-3', rows: OKAFOR_STORY.roomsResend.rows.map((r) => (r.id === 'R4' ? { ...r, scheduledTime: '12:00' } : r)) }
    const again = receiveMailboxPdf(api, third)
    if (!again.ok) throw new Error(again.message)
    expect(again.value.removalRowIds).toEqual([])

    // Left out, the removal is offered again by the next re-send that still lacks the Booking.
    const left = decideArrivingLists(api, OFFICE_ACTOR, [{ rows: [{ rowId: removal.id, kind: 'leaveOut' }] }])
    expect(left.ok).toBe(true)
    expect(api.getState().schedule.bookings[pike.id]!.cancellation).toBeUndefined()
    const fourth: MailboxPdfSample = { ...third, id: 'TEST-RESEND-4', rows: third.rows.map((r) => (r.id === 'R4' ? { ...r, scheduledTime: '12:15' } : r)) }
    const offered = receiveMailboxPdf(api, fourth)
    if (!offered.ok) throw new Error(offered.message)
    expect(offered.value.removalRowIds.map((id) => api.getState().intake.rows[id]!.removalOfBookingId)).toEqual([pike.id])
  })

  it('a hospital List is never checked for missing Bookings', () => {
    const api = fresh()
    const first = receiveMailboxPdf(api, OKAFOR_STORY.roomsList)
    if (!first.ok) throw new Error(first.message)
    placeOkafor(api, first.value.rowIds)
    const out = receiveHospitalBatch(api, HOSP.stg, OKAFOR_STORY.stgDayBefore.label, stgDayBeforeRows(api.getState()))
    if (!out.ok) throw new Error(out.message)
    expect(out.value.rowIds.every((id) => api.getState().intake.rows[id]!.removalOfBookingId === undefined)).toBe(true)
  })
})

describe('a hospital feed (D119 actions 3, 4, 6; DM-21)', () => {
  it("St George's day-before List runs as the hospital's feed, stages every row and decides nothing", () => {
    const api = fresh()
    const before = api.getState()
    const out = receiveHospitalBatch(api, HOSP.stg, OKAFOR_STORY.stgDayBefore.label, stgDayBeforeRows(before), { sampleId: OKAFOR_STORY.stgDayBefore.id })
    if (!out.ok) throw new Error(out.message)
    const who = api.getState().audit.at(-1)!.who
    expect(who).not.toBe(OFFICE_ACTOR.who)
    expectRunAs(api, before.audit.length, who)
    expect(api.getState().schedule).toBe(before.schedule)
    expect(out.value.rowIds.map((id) => api.getState().intake.rows[id]!.status)).toEqual(['open', 'open', 'open', 'open'])
    expect(api.getState().intake.batches[out.value.batchId]).toMatchObject({ sampleId: OKAFOR_STORY.stgDayBefore.id, arrivalSource: { kind: 'hospitalFeed', hospitalId: HOSP.stg } })
    expect(api.getState().intake.sources['SRC-STG']!.lastReceivedAtISO).toBe(api.getState().intake.batches[out.value.batchId]!.receivedAtISO)
  })

  it('an identical row whose earlier copy is decided is staged; one whose copy is still open is not', () => {
    const api = fresh()
    const decided = api.getState().intake.batches[SEED_DECIDED_ARRIVAL.batchId]!.rowIds.map((id) => api.getState().intake.rows[id]!.incoming)
    const again = receiveHospitalBatch(api, HOSP.stg, 'Identical re-arrival', decided)
    if (!again.ok) throw new Error(again.message)
    expect(again.value.rowIds).toHaveLength(decided.length)
    expect(arrivalItemsOf(api.getState()).find((i) => i.batchId === again.value.batchId)).toMatchObject({ kind: 'matchesExactly', decided: false })
    expect(receiveHospitalBatch(api, HOSP.stg, 'Identical while open', decided)).toMatchObject({ ok: false, code: 'alreadyWaiting' })
  })

  it("the practice's day-before message carries Lists that match exactly, one naming its anaesthetist", () => {
    const api = fresh()
    api.setState(practiceAppState())
    const rows = stgDayBeforeRows(api.getState())
    expect(rows.length).toBeGreaterThan(OKAFOR_STORY.stgDayBefore.okaforRows.length)
    const out = receiveHospitalBatch(api, HOSP.stg, OKAFOR_STORY.stgDayBefore.label, rows)
    if (!out.ok) throw new Error(out.message)
    const items = arrivalItemsOf(api.getState()).filter((i) => i.batchId === out.value.batchId && i.kind !== 'needsNhi')
    const exact = items.filter((i) => i.kind === 'matchesExactly')
    expect(exact).toHaveLength(OKAFOR_STORY.stgDayBefore.matchingListCount)
    expect(exact.filter((i) => i.namedAnaesthetistId !== undefined)).toHaveLength(1)
    expect(exact.every((i) => !(SCRIPTED_BEAT_SCHEDULE.listIds as readonly string[]).includes(i.heldListId!))).toBe(true)
  })

  it('the Southern Cross cancellation is one cancelled row, as the feed; the Booking is untouched', () => {
    const api = fresh()
    api.setState(practiceAppState())
    const row = sxCancellationRow(api.getState())!
    expect(row).toMatchObject({ hospitalId: HOSP.sx, hospitalStatus: 'cancelled' })
    const before = api.getState()
    const out = receiveCancellation(api, HOSP.sx, row)
    if (!out.ok) throw new Error(out.message)
    expect(api.getState().schedule).toBe(before.schedule)
    expect(api.getState().intake.rows[out.value.rowId]).toMatchObject({ status: 'open', incoming: { hospitalStatus: 'cancelled' } })
    expect(arrivalItemsOf(api.getState()).find((i) => i.batchId === out.value.batchId)).toMatchObject({ kind: 'cancellation' })
    expect(actorsSince(api, before.audit.length).every((a) => a.role === 'system')).toBe(true)
    // The core seed holds no unscripted Southern Cross Booking ahead.
    expect(sxCancellationRow(fresh().getState())).toBeUndefined()
  })

  it('a failed message lands as an arrival with no rows, held with its reason, its message in the dead-letter shape', () => {
    const api = fresh()
    const before = api.getState()
    const { label, reason, raw } = OKAFOR_STORY.failedMessage
    const out = receiveFailedMessage(api, HOSP.sx, { label, reason, raw })
    if (!out.ok) throw new Error(out.message)
    expect(actorsSince(api, before.audit.length).every((a) => a.role === 'system' && a.who !== OFFICE_ACTOR.who)).toBe(true)
    const s = api.getState()
    expect(s.intake.batches[out.value.batchId]).toMatchObject({ rowIds: [], heldReason: reason, messageId: out.value.messageId, channel: 'feedMessage' })
    expect(s.integrations.messages[out.value.messageId]).toMatchObject({ status: 'deadLetter', failureReason: reason, raw, feedId: 'FEED-SX' })
    expect(arrivalItemsOf(s).find((i) => i.batchId === out.value.batchId)).toMatchObject({ kind: 'held', reason, decided: false })
  })

  it('a hospital that is not connected cannot send through a feed', () => {
    const api = fresh()
    const row: IncomingBookingFields = { hospitalId: HOSP.forte, dateISO: '2026-12-01', session: 'AM', patient: { name: 'Test' }, hospitalStatus: 'booked' }
    expect(receiveHospitalBatch(api, HOSP.forte, 'Forte', [row])).toMatchObject({ ok: false, code: 'notConnected' })
    expect(receiveFailedMessage(api, HOSP.forte, { label: 'x', reason: 'y', raw: '' })).toMatchObject({ ok: false, code: 'notConnected' })
  })

  it('a row with no NHI gets its stub when its List exists', () => {
    const api = fresh()
    const list = api.getState().schedule.lists[SEED_STUB.listId]!
    const out = receiveHospitalBatch(api, HOSP.sx, 'Southern Cross theatre list', [
      { hospitalId: HOSP.sx, dateISO: list.dateISO, session: list.session, surgeon: { name: 'Ms K. Patel', hpiId: '41PATK' }, scheduledTime: '15:00', patient: { name: 'Ana Test', dobISO: '1990-02-02' }, procedure: { text: 'lap chole' }, hospitalStatus: 'booked' },
    ])
    if (!out.ok) throw new Error(out.message)
    const stub = Object.values(api.getState().intake.stubs).find((s) => s.importRowId === out.value.rowIds[0])
    expect(stub).toMatchObject({ listId: SEED_STUB.listId, status: 'standing' })
  })
})

describe('the mailbox: a page that cannot be read (D119 action 5, second choice)', () => {
  it('lands as an arrival with no rows, its page and its reason, as the mailbox', () => {
    const api = fresh()
    const before = api.getState()
    const u = OKAFOR_STORY.unreadable
    const out = receiveUnreadablePdf(api, { fileName: u.fileName, facsimile: u.facsimile, senderEmail: u.senderEmail, reason: u.reason })
    if (!out.ok) throw new Error(out.message)
    expectRunAs(api, before.audit.length, MAILBOX_ACTOR.who)
    expect(api.getState().intake.batches[out.value.batchId]).toMatchObject({ rowIds: [], unreadableReason: u.reason, file: { name: u.fileName }, arrivalSource: { kind: 'mailbox', senderEmail: u.senderEmail } })
    expect(arrivalItemsOf(api.getState()).find((i) => i.batchId === out.value.batchId)).toMatchObject({ kind: 'unreadable', reason: u.reason })
  })
})

describe('the samples', () => {
  it('every story NHI is valid and held by no seeded patient', () => {
    const held = new Set(Object.values(practiceAppState().masters.patients).map((p) => p.nhi))
    const nhis = [
      ...[OKAFOR_STORY.roomsList, OKAFOR_STORY.roomsResend, OKAFOR_STORY.scan].flatMap((s) => s.rows.flatMap((r) => (r.nhi !== undefined ? [r.nhi] : []))),
      ...OKAFOR_STORY.stgDayBefore.okaforRows.flatMap((r) => (r.patient.nhi !== undefined ? [r.patient.nhi] : [])),
    ]
    for (const nhi of nhis) {
      expect(validateNhi(nhi).valid).toBe(true)
      expect(held.has(nhi)).toBe(false)
    }
  })
})
