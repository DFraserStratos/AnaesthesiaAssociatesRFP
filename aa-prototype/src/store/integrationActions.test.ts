/**
 * Phase 11 store tests, reworked in catch-up Phase 33: a parsed HL7/FHIR message
 * stages one matching-screen row and changes nothing (RV-13); retry vs
 * dead-letter, dedupe, the ethnicity quarantine + manual fix, the feed-mapping
 * fix, and PDF ingestion (create vs update-not-duplicate). Every test uses an
 * isolated non-persisted store and drives retry synchronously (no timers).
 */

import { SEED_STUB } from '../domain/seed/intakeSeed'
import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import {
  processMessage,
  retryMessage,
  reprocessMessage,
  setFeedMapping,
  correctEthnicityCode,
} from './integrationActions'
import { decideImportRow } from './matchingActions'
import { assessImportRow } from './matchingSelectors'
import { validNhiOf } from '../domain/intake'
import {
  bookingsForList,
  feedsForHospital,
  findBookingByCorrelation,
  integrationAttentionCount,
  integrationMonitor,
  dataQualityItems,
} from './selectors'
import type { Actor } from './mutate'
import { ANAE, HOSP, SEED_LIST_IDS } from '../domain/seed'
import { APPT, FEED, CPH_NHI_FIX } from '../domain/integrations'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function store(): BoundAppStore {
  return createAppStore()
}

const STG_LIST = SEED_LIST_IDS.integrationStgList

function rowFor(api: BoundAppStore, controlId: string) {
  return Object.values(api.getState().integrations.messages).find((m) => m.messageControlId === controlId)
}

/** A snapshot of everything a message must never change by itself (RV-13). */
function scheduleSnapshot(api: BoundAppStore): string {
  const s = api.getState()
  return JSON.stringify({ schedule: s.schedule, patients: s.masters.patients })
}

function stagedRow(api: BoundAppStore, controlId: string) {
  const id = rowFor(api, controlId)?.resultImportRowId
  return id !== undefined ? api.getState().intake.rows[id] : undefined
}

describe('no silent apply: every message stages one row and changes nothing (catch-up Phase 33; RV-13)', () => {
  const EXPECTED: Record<string, { changeType: string; text?: string }> = {
    'MSG-STG-1001': { changeType: 'new', text: 'lap appy ?conv to open' },
    'MSG-STG-1002': { changeType: 'new' },
    'MSG-STG-1003': { changeType: 'new' },
    'FHIR-SX-2001': { changeType: 'new', text: 'Diagnostic knee arthroscopy' },
    'MSG-STG-1010': { changeType: 'modification', text: 'Knee arthroscopy' },
    'MSG-STG-1011': { changeType: 'new', text: 'Wrist ORIF, distal radius' },
    'MSG-STG-1012': { changeType: 'modification' },
    'MSG-STG-1013': { changeType: 'cancellation' },
    'MSG-STG-1014': { changeType: 'modification' },
  }
  for (const [controlId, expected] of Object.entries(EXPECTED)) {
    it(`${controlId} stages a ${expected.changeType} row, its wording verbatim`, () => {
      const api = store()
      const before = scheduleSnapshot(api)
      const out = processMessage(api, controlId)
      expect(out.ok && out.value.outcome).toBe('processed')
      expect(scheduleSnapshot(api)).toBe(before)
      const row = stagedRow(api, controlId)!
      expect(row).toMatchObject({ channel: 'feedMessage', source: 'hospital', status: 'open', messageId: controlId })
      if (expected.text !== undefined) expect(row.incoming.procedure?.text).toBe(expected.text)
      expect(assessImportRow(api.getState(), row.id)?.changeType).toBe(expected.changeType)
      expect(integrationMonitor(api.getState()).find((m) => m.messageControlId === controlId)?.displayStatus).toBe('Sent to matching')
    })
  }

  it("the S13 that moves a Booking to another day stages a New row for the new day and leaves the old Booking where it is (D62)", () => {
    const api = store()
    const old = findBookingByCorrelation(api.getState(), { sourceFeedId: FEED.stg, externalAppointmentId: APPT.s13Move })!
    processMessage(api, 'MSG-STG-1011')
    const row = stagedRow(api, 'MSG-STG-1011')!
    expect(row.incoming).toMatchObject({ dateISO: '2026-08-04', session: 'AM', hospitalStatus: 'booked' })
    expect(api.getState().schedule.bookings[old.id]).toMatchObject({ listId: old.listId })
    expect(api.getState().schedule.bookings[old.id]!.cancellation).toBeUndefined()
  })

  it('MSG-STG-1014 (a SUBMITTED List) stages an ordinary row the office can apply until AUTHORISED', () => {
    const api = store()
    processMessage(api, 'MSG-STG-1014')
    const row = stagedRow(api, 'MSG-STG-1014')!
    const a = assessImportRow(api.getState(), row.id)!
    expect(a.flags).toEqual([])
    expect(decideImportRow(api, OFFICE, row.id, { kind: 'match', bookingId: a.match!.bookingId, fieldsApplied: ['time'] }).ok).toBe(true)
    expect(api.getState().schedule.bookings[a.match!.bookingId]!.scheduledTime).toBe('10:15')
  })

  it("MSG-STG-1012's row, applied, replaces Foster's WLE MM (kept in her change history) and changes neither her Contract nor her RVG code", () => {
    const api = store()
    processMessage(api, 'MSG-STG-1012')
    const row = stagedRow(api, 'MSG-STG-1012')!
    const foster = findBookingByCorrelation(api.getState(), { sourceFeedId: FEED.stg, externalAppointmentId: APPT.s14 })!
    const p = Object.values(api.getState().schedule.procedures).find((x) => x.bookingId === foster.id)!
    expect(p.procedureText?.text).toBe('WLE MM')
    expect(decideImportRow(api, OFFICE, row.id, { kind: 'match', bookingId: foster.id, fieldsApplied: ['time', 'procedureText', 'note'] }).ok).toBe(true)
    const after = api.getState().schedule.procedures[p.id]!
    expect(after.procedureText).toMatchObject({ text: 'WLE MM, left shoulder + flap repair + SNB + excision SCC and flap, left sternum + BCC', source: 'hospitalFeed', from: "St George's" })
    expect(after.governingContractId).toBe(p.governingContractId)
    expect(after.rvgGroupId).toBe(p.rvgGroupId)
    const history = api.getState().audit.filter((a) => a.action === 'procedure.procedureText.replace' && a.entityId === p.id)
    expect(history).toHaveLength(1)
    expect(history[0]!.before).toMatchObject({ procedureText: { text: 'WLE MM' } })
  })

  it('a created Booking from a feed row quarantines an out-of-range ethnicity code, and the manual fix supplies a valid one', () => {
    const api = store()
    processMessage(api, 'MSG-STG-1003')
    const row = stagedRow(api, 'MSG-STG-1003')!
    const a = assessImportRow(api.getState(), row.id)!
    expect(a.suggestion?.kind).toBe('createBooking')
    const created = decideImportRow(api, OFFICE, row.id, { kind: 'createBooking', listId: STG_LIST })
    expect(created.ok).toBe(true)
    const booking = api.getState().schedule.bookings[created.ok ? created.value.bookingId! : '']!
    expect(booking.source).toBe('hospitalDownload')
    const patient = api.getState().masters.patients[booking.patientId]!
    expect(patient.ethnicityCode).toBeUndefined()
    expect(patient.ethnicityPending?.receivedCode).toBe('77777')
    expect(dataQualityItems(api.getState()).some((d) => d.patientId === patient.hiddenInternalId)).toBe(true)
    expect(correctEthnicityCode(api, OFFICE, patient.hiddenInternalId, '11111').ok).toBe(true)
    expect(api.getState().masters.patients[booking.patientId]!.ethnicityCode).toBe('11111')
  })

  it('the integration actor no longer writes Bookings, and nothing parks: the attention count is dead-letter only', () => {
    const api = store()
    const seeded = api.getState().audit.length
    for (const id of ['MSG-STG-1012', 'MSG-STG-1013', 'MSG-STG-1014']) processMessage(api, id)
    expect(api.getState().audit.slice(seeded).filter((a) => a.entityType === 'booking' || a.entityType === 'procedure')).toEqual([])
    expect(integrationAttentionCount(api.getState())).toBe(0)
  })
})

describe('retry vs dead-letter', () => {
  it('a transient message fails once then stages its row on retry, with the attempt count shown', () => {
    const api = store()
    const first = processMessage(api, 'MSG-STG-1004')
    expect(first.ok && first.value.outcome).toBe('retrying')
    const row = rowFor(api, 'MSG-STG-1004')!
    expect(row.status).toBe('retrying')
    expect(row.attempts).toBe(1)
    const second = retryMessage(api, row.id)
    expect(second.ok && second.value.outcome).toBe('processed')
    const done = rowFor(api, 'MSG-STG-1004')!
    expect(done).toMatchObject({ status: 'processed', attempts: 2 })
    expect(stagedRow(api, 'MSG-STG-1004')).toBeDefined()
    expect(integrationMonitor(api.getState()).find((m) => m.messageControlId === 'MSG-STG-1004')!.displayStatus).toBe('Retried, sent to matching')
  })

  it('a malformed message under a wrong mapping exhausts its retries into dead-letter, then a mapping fix + reprocess stages a valid row', () => {
    const api = store()
    expect(processMessage(api, 'MSG-CPH-2001').ok).toBe(true)
    const row = rowFor(api, 'MSG-CPH-2001')!
    expect(row.status).toBe('retrying')
    retryMessage(api, row.id)
    retryMessage(api, row.id)
    const dead = rowFor(api, 'MSG-CPH-2001')!
    expect(dead).toMatchObject({ status: 'deadLetter', attempts: 3 })
    expect(Object.keys(api.getState().intake.rows).filter((id) => id !== SEED_STUB.rowId)).toHaveLength(0)
    expect(integrationAttentionCount(api.getState())).toBe(1)
    expect(setFeedMapping(api, OFFICE, FEED.cph, 'nhi', CPH_NHI_FIX).ok).toBe(true)
    const recovered = reprocessMessage(api, dead.id)
    expect(recovered.ok && recovered.value.outcome).toBe('processed')
    const staged = stagedRow(api, 'MSG-CPH-2001')!
    expect(staged.incoming).toMatchObject({ hospitalId: HOSP.cph })
    expect(validNhiOf(staged.incoming)).toBeDefined()
    // Not integrated today (catch-up Phase 34; RV-16): its row says it came from the Future-scope demo.
    expect(api.getState().intake.batches[staged.batchId]!.label).toBe('Future-scope HL7 demo · Christchurch Public · message MSG-CPH-2001')
  })
})

describe('dedupe', () => {
  it('replaying an already-processed message records a duplicate no-op (no second Booking)', () => {
    const api = store()
    expect(processMessage(api, 'MSG-STG-1001').ok).toBe(true)
    const bookingsAfterFirst = bookingsForList(api.getState(), STG_LIST).length

    const replay = processMessage(api, 'MSG-STG-1001')
    expect(replay.ok && replay.value.outcome).toBe('duplicate')
    expect(bookingsForList(api.getState(), STG_LIST).length).toBe(bookingsAfterFirst)
    const dupRows = Object.values(api.getState().integrations.messages).filter(
      (m) => m.messageControlId === 'MSG-STG-1001' && m.status === 'duplicate',
    )
    expect(dupRows.length).toBe(1)
  })
})

describe('feed mapping edit is audited and office-only', () => {
  it('refuses a non-office actor and audits an office edit', () => {
    const api = store()
    const anae: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
    expect(setFeedMapping(api, anae, FEED.cph, 'nhi', 'PID-3').ok).toBe(false)
    expect(setFeedMapping(api, OFFICE, FEED.cph, 'nhi', 'PID-3').ok).toBe(true)
    expect(api.getState().integrations.feeds[FEED.cph]!.fieldMapping.nhi).toBe('PID-3')
    expect(api.getState().audit.some((a) => a.entityId === FEED.cph && a.action === 'feed.update')).toBe(true)
  })

  it('feedsForHospital returns the configured feed for a hospital', () => {
    const api = store()
    const stgFeeds = feedsForHospital(api.getState(), HOSP.stg)
    expect(stgFeeds.map((f) => f.id)).toEqual([FEED.stg])
    expect(stgFeeds[0]!.transport).toBe('hl7v2')
  })
})

