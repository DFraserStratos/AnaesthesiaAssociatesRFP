/**
 * The rooms' PDFs (FT-02.2, US-02.2.1, DM-61) and where a List came from (US-02.2.4, DM-70), against the real seed.
 * The PDFs arrive through 68's mailbox ingest (the seed's Mr Okafor PDF) or are added by hand (`addPdfByHand`); their
 * rows are decided through the one decision path (`decideArrivingLists`).
 */
import { describe, expect, it } from 'vitest'
import { createAppStore, freshAppState, type AppStoreApi } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { addPdfByHand, correctArrivalRow } from './pdfListActions'
import { decideArrivingLists } from './intakeDecide'
import { assessImportRow } from './matchingSelectors'
import { resetDemo } from './clockActions'
import { SEED_PDF_LIST } from '../domain/seed/intakeSeed'
import { SEED_ORIGIN_LISTS, SEED_PDF_LIST_SENDER } from '../domain/seed/listOrigins'
import { officeAddressFor } from '../domain/surgeonContacts'
import { SURG } from '../domain/seed/cast'

const OKAFOR = SEED_PDF_LIST.id
const WHITFORD_SAMPLE = 'PDF-WHITFORD-0812'
const WHITFORD_LIST = 'L-47733-2026-12-16-PM'
/** Dr Rutherford's Wed 9 Dec AM: the session Mr Okafor's list names, which holds no List. */
const OKAFOR_SLOT = 'S-29104-2026-12-09-AM'

function fresh(): AppStoreApi {
  return createAppStore()
}

/** Correct the seeded Okafor PDF's misprinted NHI (R2: ZAA0068 to ZAA0067), then place its rows in Dr Rutherford's session. */
function placeOkafor(api: AppStoreApi): string {
  const [, r2] = SEED_PDF_LIST.rowIds
  const corrected = correctArrivalRow(api, OFFICE_ACTOR, r2, { nhi: 'ZAA0067' })
  if (!corrected.ok) throw new Error(corrected.message)
  const out = decideArrivingLists(api, OFFICE_ACTOR, [
    { rows: SEED_PDF_LIST.rowIds.map((rowId) => ({ rowId, kind: 'place' as const })), placement: { kind: 'slot', slotId: api.getState().schedule.slots[OKAFOR_SLOT]!.id } },
  ])
  if (!out.ok) throw new Error(out.message)
  return out.value.placedListIds[0]!
}

/** Mr Whitford's PDF added by hand with the given sender; its batch's row ids in file order. */
function addWhitford(api: AppStoreApi, sender: string): string[] {
  const out = addPdfByHand(api, OFFICE_ACTOR, WHITFORD_SAMPLE, sender)
  if (!out.ok) throw new Error(out.message)
  return api.getState().intake.batches[out.value.batchId]!.rowIds
}

describe('the seeded inbox', () => {
  it("holds Mr Okafor's PDF as a mailbox arrival with its sender, touching no List", () => {
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

describe('deciding rooms rows: the List and its origin (US-02.2.4)', () => {
  it("the first decision creates a List recording the PDF and its sender; the rest land on it; Bookings are from the surgeon's PDF", () => {
    const api = fresh()
    const listId = placeOkafor(api)
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

  it('a blank NHI waits at intake with a stub on its List', () => {
    const api = fresh()
    const rowIds = addWhitford(api, 'bookings@merivaleeye.example')
    const s = api.getState()
    const noNhi = rowIds.find((id) => s.intake.rows[id]!.incoming.patient.nhi === undefined)!
    expect(assessImportRow(s, noNhi)!.waitingForNhi).toBe(true)
    const stub = Object.values(s.intake.stubs).find((x) => x.importRowId === noNhi)
    expect(stub).toMatchObject({ listId: WHITFORD_LIST, status: 'standing' })
  })

  it('a rooms row onto a by-hand or recurring List adds no sender', () => {
    const api = fresh()
    const [r1] = addWhitford(api, 'someone.else@merivaleeye.example')
    expect(assessImportRow(api.getState(), r1!)!.suggestion).toMatchObject({ kind: 'createBooking', listId: WHITFORD_LIST })
    const out = decideArrivingLists(api, OFFICE_ACTOR, [{ rows: [{ rowId: r1!, kind: 'place' }], placement: { kind: 'list', listId: WHITFORD_LIST } }])
    expect(out.ok).toBe(true)
    expect(api.getState().schedule.lists[WHITFORD_LIST]!.origin).toEqual({ kind: 'recurring' })
    expect(api.getState().audit.some((a) => a.action === 'list.senderChanged')).toBe(false)
  })
})

describe('seeded origins and reset', () => {
  it("pins one pdf List whose sender is not the surgeon's first office contact, and one hospital List; the rest manual or recurring", () => {
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
    placeOkafor(api)
    addWhitford(api, 'bookings@merivaleeye.example')
    resetDemo(api)
    expect(JSON.stringify(api.getState().intake.pdfLists)).toBe(JSON.stringify(freshAppState().intake.pdfLists))
    expect(JSON.stringify(api.getState().schedule.lists)).toBe(JSON.stringify(freshAppState().schedule.lists))
  })
})
