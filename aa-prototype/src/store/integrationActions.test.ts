/**
 * Phase 11 store tests — processing HL7/FHIR messages through the audited
 * write-paths, the correlation-key locate, the lifecycle source guard, retry vs
 * dead-letter, dedupe, the ethnicity quarantine + manual fix, the feed-mapping
 * fix, and PDF ingestion (create vs update-not-duplicate). Every test uses an
 * isolated non-persisted store and drives retry synchronously (no timers).
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import {
  processMessage,
  retryMessage,
  reprocessMessage,
  setFeedMapping,
  correctEthnicityCode,
  ingestPdfRow,
} from './integrationActions'
import { cancelCard } from './lifecycle'
import {
  cardsForList,
  feedsForHospital,
  findCardByCorrelation,
  integrationAttentionCount,
  integrationMonitor,
  dataQualityItems,
} from './selectors'
import type { Actor } from './mutate'
import { ANAE, HOSP, SEED_LIST_IDS, SEED_MARKERS, listIdForSlot } from '../domain/seed'
import { APPT, FEED, CPH_NHI_FIX, SURGEON_PDFS } from '../domain/integrations'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function store(): BoundAppStore {
  return createAppStore()
}

const STG_LIST = SEED_LIST_IDS.integrationStgList
const SX_LIST = SEED_LIST_IDS.integrationSxList
const CPH_LIST = SEED_LIST_IDS.integrationCphList
const S13_MOVE_SOURCE = listIdForSlot(ANAE.souter, '2026-07-27', 'PM')

function rowFor(api: BoundAppStore, controlId: string) {
  return Object.values(api.getState().integrations.messages).find((m) => m.messageControlId === controlId)
}

describe('S12 create', () => {
  it('creates a Card on the routing List, stamps the correlation ref, audits source=integration, and reuses a repeat patient', () => {
    const api = store()
    const patientsBefore = Object.keys(api.getState().masters.patients).length
    const before = cardsForList(api.getState(), STG_LIST).length

    const out = processMessage(api, 'MSG-STG-1001')
    expect(out.ok).toBe(true)

    const state = api.getState()
    const cards = cardsForList(state, STG_LIST)
    expect(cards.length).toBe(before + 1)
    const created = findCardByCorrelation(state, { sourceFeedId: FEED.stg, externalAppointmentId: APPT.s12 })
    expect(created).toBeDefined()
    expect(created!.listId).toBe(STG_LIST)
    // Sarah Mitchell (CQY9304) is a seeded patient → reused, no duplicate row.
    expect(Object.keys(state.masters.patients).length).toBe(patientsBefore)
    // The create audit and the card-create audit carry source=integration.
    expect(state.audit.some((a) => a.entityId === created!.id && a.source === 'integration')).toBe(true)
  })

  it('processes a FHIR-native booking onto the Southern Cross List (no HL7 involved)', () => {
    const api = store()
    const before = cardsForList(api.getState(), SX_LIST).length
    const out = processMessage(api, 'FHIR-SX-2001')
    expect(out.ok).toBe(true)
    const created = findCardByCorrelation(api.getState(), { sourceFeedId: FEED.sx, externalAppointmentId: APPT.fhirCreate })
    expect(created?.listId).toBe(SX_LIST)
    expect(cardsForList(api.getState(), SX_LIST).length).toBe(before + 1)
  })

  it('quarantines an out-of-range ethnicity code (card created, code never stored) and the manual fix supplies a valid one', () => {
    const api = store()
    const out = processMessage(api, 'MSG-STG-1003')
    expect(out.ok).toBe(true)
    const created = findCardByCorrelation(api.getState(), { sourceFeedId: FEED.stg, externalAppointmentId: APPT.s12Ethnicity })
    expect(created).toBeDefined()
    const patient = api.getState().masters.patients[created!.patientId]!
    expect(patient.ethnicityCode).toBeUndefined()
    expect(patient.ethnicityPending?.receivedCode).toBe('77777')
    // A data-quality item is raised.
    expect(dataQualityItems(api.getState()).some((d) => d.patientId === patient.hiddenInternalId)).toBe(true)
    // Manual fix supplies a valid NZHIS code.
    expect(correctEthnicityCode(api, OFFICE, patient.hiddenInternalId, '11111').ok).toBe(true)
    const fixed = api.getState().masters.patients[created!.patientId]!
    expect(fixed.ethnicityCode).toBe('11111')
    expect(fixed.ethnicityPending).toBeUndefined()
    expect(dataQualityItems(api.getState()).some((d) => d.patientId === patient.hiddenInternalId)).toBe(false)
  })
})

describe('modify events located by correlation ref', () => {
  it('S14 updates the correlated Card (time + note)', () => {
    const api = store()
    const target = SEED_MARKERS['integrationS14']!.entityId
    expect(processMessage(api, 'MSG-STG-1012').ok).toBe(true)
    const card = api.getState().schedule.cards[target]!
    expect(card.scheduledTime).toBe('12:15')
    expect(card.notes).toBe('Bumped 15 min at surgeon request')
    expect(api.getState().audit.some((a) => a.entityId === target && a.source === 'integration' && a.action === 'card.update')).toBe(true)
  })

  it('S15 soft-cancels the correlated Card (retained, cancelled, audited)', () => {
    const api = store()
    const target = SEED_MARKERS['integrationS15']!.entityId
    expect(processMessage(api, 'MSG-STG-1013').ok).toBe(true)
    const card = api.getState().schedule.cards[target]!
    expect(card.cancellation).toBeDefined()
    expect(card.cancellation?.source).toBe('integration')
  })

  it('same-List S13 retimes the correlated Card in place', () => {
    const api = store()
    const target = SEED_MARKERS['integrationS13Time']!.entityId
    const before = api.getState().schedule.cards[target]!.listId
    expect(processMessage(api, 'MSG-STG-1010').ok).toBe(true)
    const card = api.getState().schedule.cards[target]!
    expect(card.listId).toBe(before)
    expect(card.scheduledTime).toBe('11:30')
  })

  it('cross-List S13 reassigns the correlated Card, leaving both Lists\' other cards untouched', () => {
    const api = store()
    const target = SEED_MARKERS['integrationS13Move']!.entityId
    const stgOthersBefore = cardsForList(api.getState(), STG_LIST).map((c) => c.id).sort()
    expect(api.getState().schedule.cards[target]!.listId).toBe(S13_MOVE_SOURCE)

    expect(processMessage(api, 'MSG-STG-1011').ok).toBe(true)

    const card = api.getState().schedule.cards[target]!
    expect(card.listId).toBe(STG_LIST)
    expect(card.scheduledTime).toBe('09:00')
    // The source list no longer holds it; the STG list's prior cards are all still present.
    expect(cardsForList(api.getState(), S13_MOVE_SOURCE).some((c) => c.id === target)).toBe(false)
    for (const id of stgOthersBefore) {
      expect(api.getState().schedule.cards[id]!.listId).toBe(STG_LIST)
    }
  })

  it('a modify targeting a soft-cancelled Card is not applied and parks as manual intervention', () => {
    const api = store()
    const target = SEED_MARKERS['integrationS14']!.entityId
    // The office cancels the appointment first; then a stale S14 arrives for it.
    expect(cancelCard(api, OFFICE, target, 'Patient deferred').ok).toBe(true)
    const timeBefore = api.getState().schedule.cards[target]!.scheduledTime

    const out = processMessage(api, 'MSG-STG-1012')
    expect(out.ok && out.value.outcome).toBe('manualIntervention')
    const card = api.getState().schedule.cards[target]!
    // Unchanged apart from staying cancelled: no time/note edit slipped through.
    expect(card.scheduledTime).toBe(timeBefore)
    expect(card.notes).toBeUndefined()
    expect(card.cancellation).toBeDefined()
  })

  it('a message targeting a Card on a SUBMITTED List is NOT applied and parks as manual intervention', () => {
    const api = store()
    const target = SEED_MARKERS['integrationLockedTarget']!.entityId
    const before = api.getState().schedule.cards[target]!
    // The locked target sits on a coherent booked SUBMITTED St George's list.
    const lockedList = api.getState().schedule.lists[before.listId]!
    expect(lockedList.state).toBe('SUBMITTED')
    expect(lockedList.statusKey).toBe('private')
    expect(lockedList.hospitalId).toBe('H-STG')
    const out = processMessage(api, 'MSG-STG-1014')
    expect(out.ok).toBe(true)
    if (out.ok) expect(out.value.outcome).toBe('manualIntervention')
    // Card unchanged.
    expect(api.getState().schedule.cards[target]).toEqual(before)
    const row = rowFor(api, 'MSG-STG-1014')
    expect(row?.status).toBe('manualIntervention')
    expect(integrationAttentionCount(api.getState())).toBeGreaterThan(0)
  })
})

describe('retry vs dead-letter', () => {
  it('a transient message fails once then succeeds on retry, with the attempt count shown', () => {
    const api = store()
    const first = processMessage(api, 'MSG-STG-1004')
    expect(first.ok && first.value.outcome).toBe('retrying')
    const row = rowFor(api, 'MSG-STG-1004')!
    expect(row.status).toBe('retrying')
    expect(row.attempts).toBe(1)

    const second = retryMessage(api, row.id)
    expect(second.ok && second.value.outcome).toBe('processed')
    const done = rowFor(api, 'MSG-STG-1004')!
    expect(done.status).toBe('processed')
    expect(done.attempts).toBe(2)
    // The derived display label is "Retried" (processed with attempts > 1).
    const mon = integrationMonitor(api.getState()).find((m) => m.messageControlId === 'MSG-STG-1004')!
    expect(mon.displayStatus).toBe('Retried')
  })

  it('a malformed message under a wrong mapping exhausts its retries into dead-letter, then a mapping fix + reprocess recovers it', () => {
    const api = store()
    const cphBefore = cardsForList(api.getState(), CPH_LIST).length

    // Attempt 1 (fails: PID-2 holds a local MRN, not the NHI).
    expect(processMessage(api, 'MSG-CPH-2001').ok).toBe(true)
    const row = rowFor(api, 'MSG-CPH-2001')!
    expect(row.status).toBe('retrying')
    // Exhaust the budget synchronously.
    retryMessage(api, row.id)
    retryMessage(api, row.id)
    const dead = rowFor(api, 'MSG-CPH-2001')!
    expect(dead.status).toBe('deadLetter')
    expect(dead.attempts).toBe(3)
    expect(cardsForList(api.getState(), CPH_LIST).length).toBe(cphBefore)

    // Fix the feed mapping (nhi <- PID-3) and reprocess.
    expect(setFeedMapping(api, OFFICE, FEED.cph, 'nhi', CPH_NHI_FIX).ok).toBe(true)
    const recovered = reprocessMessage(api, dead.id)
    expect(recovered.ok && recovered.value.outcome).toBe('processed')
    expect(cardsForList(api.getState(), CPH_LIST).length).toBe(cphBefore + 1)
    const created = findCardByCorrelation(api.getState(), { sourceFeedId: FEED.cph, externalAppointmentId: APPT.malformedCph })
    expect(created).toBeDefined()
  })
})

describe('dedupe', () => {
  it('replaying an already-processed message records a duplicate no-op (no second Card)', () => {
    const api = store()
    expect(processMessage(api, 'MSG-STG-1001').ok).toBe(true)
    const cardsAfterFirst = cardsForList(api.getState(), STG_LIST).length

    const replay = processMessage(api, 'MSG-STG-1001')
    expect(replay.ok && replay.value.outcome).toBe('duplicate')
    expect(cardsForList(api.getState(), STG_LIST).length).toBe(cardsAfterFirst)
    const dupRows = Object.values(api.getState().integrations.messages).filter(
      (m) => m.messageControlId === 'MSG-STG-1001' && m.status === 'duplicate',
    )
    expect(dupRows.length).toBe(1)
  })
})

describe('PDF ingestion', () => {
  it('updates an already-booked row (matched by NHI on the target List) instead of duplicating, and creates the new rows', () => {
    const api = store()
    const pdf = SURGEON_PDFS.find((p) => p.id === 'PDF-OKAFOR-0729')!
    const listId = listIdForSlot(pdf.targetList.anaesthetistId, pdf.targetList.dateISO, pdf.targetList.session)
    const before = cardsForList(api.getState(), listId).length

    const [r1, r2, r3] = pdf.rows

    // R1 (Sarah Mitchell) is already booked on this List → update, not duplicate.
    const u = ingestPdfRow(api, OFFICE, listId, r1!)
    expect(u.ok && u.value.outcome).toBe('updated')
    expect(cardsForList(api.getState(), listId).length).toBe(before)

    // R2 is a clean new patient → create.
    const c = ingestPdfRow(api, OFFICE, listId, r2!)
    expect(c.ok && c.value.outcome).toBe('created')
    expect(cardsForList(api.getState(), listId).length).toBe(before + 1)

    // R3's printed NHI is invalid → refused until corrected.
    const bad = ingestPdfRow(api, OFFICE, listId, r3!)
    expect(bad.ok).toBe(false)
    const good = ingestPdfRow(api, OFFICE, listId, { ...r3!, nhi: r3!.correctedNhi! })
    expect(good.ok && good.value.outcome).toBe('created')
    expect(cardsForList(api.getState(), listId).length).toBe(before + 2)
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
