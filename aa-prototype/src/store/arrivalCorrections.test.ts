/**
 * An arriving List's rows corrected before it is placed (build plan Phase 70; US-02.2.1, DM-15): each correction
 * kept with from, to, who and when; the NHI checked as typed; the wording kept as received; the ethnicity a five
 * digit code whose correction clears the arrival's data-quality flag; office only, open rows only.
 */
import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from './appStore'
import { OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { receiveMailboxPdf } from './intakeIngest'
import { arrivalItemsOf } from './intakeSelectors'
import { arrivalRowValues, correctArrivalRow } from './pdfListActions'
import { placeArrivalList, placeChoicesFor, sessionChoice } from './intakePlace'
import { clockISO } from './mutate'
import { OKAFOR_STORY } from '../domain/intake/hospitalDownloads'
import { SEED_DECIDED_ARRIVAL, SEED_PDF_LIST } from '../domain/seed/intakeSeed'

function okafor(): { api: AppStoreApi; batchId: string; rowIds: string[] } {
  const api = createAppStore()
  const out = receiveMailboxPdf(api, OKAFOR_STORY.roomsList)
  if (!out.ok) throw new Error(out.message)
  return { api, batchId: out.value.batchId, rowIds: out.value.rowIds }
}

function dataQualityOf(api: AppStoreApi, batchId: string): number | undefined {
  const item = arrivalItemsOf(api.getState()).find((i) => i.batchId === batchId && i.kind === 'newList')
  if (item === undefined) throw new Error('no new List arrival for the batch')
  return item.flags.dataQuality
}

describe('correctArrivalRow (Phase 70): corrections before placing', () => {
  it('keeps each correction with from, to, who and when, and audits it', () => {
    const { api, rowIds } = okafor()
    const rowId = rowIds[0]!
    const before = api.getState().intake.rows[rowId]!
    const auditFrom = api.getState().audit.length
    const out = correctArrivalRow(api, OFFICE_ACTOR, rowId, { patientName: 'Wiremu  Ngata-Hall ', scheduledTime: '13:30' })
    expect(out.ok).toBe(true)
    const s = api.getState()
    const row = s.intake.rows[rowId]!
    const atISO = clockISO(s.clock)
    expect(row.correctionHistory).toEqual([
      { field: 'patientName', from: before.incoming.patient.name, to: 'Wiremu  Ngata-Hall', atISO, by: OFFICE_ACTOR.who },
      { field: 'scheduledTime', from: before.incoming.scheduledTime, to: '13:30', atISO, by: OFFICE_ACTOR.who },
    ])
    expect(arrivalRowValues(row)).toMatchObject({ patientName: 'Wiremu  Ngata-Hall', scheduledTime: '13:30' })
    // The row as received is kept.
    expect(row.incoming).toBe(before.incoming)
    const audit = s.audit.slice(auditFrom)
    expect(audit.map((a) => a.action)).toEqual(['importRow.correct'])

    // A second correction appends; an unchanged field writes nothing.
    expect(correctArrivalRow(api, OFFICE_ACTOR, rowId, { scheduledTime: '14:00', patientName: 'Wiremu  Ngata-Hall' }).ok).toBe(true)
    const again = api.getState().intake.rows[rowId]!
    expect(again.correctionHistory?.map((c) => [c.field, c.from, c.to])).toEqual([
      ['patientName', before.incoming.patient.name, 'Wiremu  Ngata-Hall'],
      ['scheduledTime', before.incoming.scheduledTime, '13:30'],
      ['scheduledTime', '13:30', '14:00'],
    ])
    const state = api.getState()
    expect(correctArrivalRow(api, OFFICE_ACTOR, rowId, { scheduledTime: '14:00' }).ok).toBe(true)
    expect(api.getState()).toBe(state)
  })

  it('checks the NHI as typed: an invalid one is refused and writes nothing; a valid one is normalised', () => {
    const api = createAppStore()
    const rowId = SEED_PDF_LIST.rowIds[1] // R2: the NHI printed wrongly (ZAA0068)
    const state = api.getState()
    const bad = correctArrivalRow(api, OFFICE_ACTOR, rowId, { nhi: 'ZAA0069' })
    expect(bad).toMatchObject({ ok: false, code: 'invalidNhi' })
    expect(api.getState()).toBe(state)
    expect(correctArrivalRow(api, OFFICE_ACTOR, rowId, { nhi: 'zaa0067' }).ok).toBe(true)
    const row = api.getState().intake.rows[rowId]!
    expect(row.corrections?.nhi).toBe('ZAA0067')
    expect(row.correctionHistory).toEqual([expect.objectContaining({ field: 'nhi', from: 'ZAA0068', to: 'ZAA0067', by: OFFICE_ACTOR.who })])
    // An NHI read from the List is not cleared.
    expect(correctArrivalRow(api, OFFICE_ACTOR, rowId, { nhi: ' ' })).toMatchObject({ ok: false, code: 'nhiRequired' })
  })

  it('keeps the wording as received, and checks the other fields', () => {
    const { api, rowIds } = okafor()
    const rowId = rowIds[1]!
    const state = api.getState()
    expect(correctArrivalRow(api, OFFICE_ACTOR, rowId, { procedureText: 'Hernia repair' })).toMatchObject({ ok: false, code: 'wordingKeptAsReceived', message: "The rooms' wording is kept as received." })
    expect(correctArrivalRow(api, OFFICE_ACTOR, rowId, { patientName: '  ' })).toMatchObject({ ok: false, message: 'The patient needs a name.' })
    expect(correctArrivalRow(api, OFFICE_ACTOR, rowId, { dobISO: '9/11/1949' })).toMatchObject({ ok: false, message: 'Enter the date of birth as a date.' })
    expect(correctArrivalRow(api, OFFICE_ACTOR, rowId, { scheduledTime: '2pm' })).toMatchObject({ ok: false, message: 'Enter the time as HH:MM.' })
    expect(correctArrivalRow(api, OFFICE_ACTOR, rowId, { ethnicityCode: '111' })).toMatchObject({ ok: false, message: 'Enter the ethnicity as a five digit code.' })
    expect(api.getState()).toBe(state)
  })

  it("an unrecognised ethnicity code raises the arrival's data-quality flag; corrected, it clears", () => {
    // A rooms' PDF prints no ethnicity, so the row arrives with none; an unrecognised code is corrected in (five digits, outside the list).
    const { api, batchId, rowIds } = okafor()
    expect(dataQualityOf(api, batchId)).toBeUndefined()
    expect(correctArrivalRow(api, OFFICE_ACTOR, rowIds[0]!, { ethnicityCode: '99999' }).ok).toBe(true)
    expect(dataQualityOf(api, batchId)).toBe(1)
    expect(correctArrivalRow(api, OFFICE_ACTOR, rowIds[0]!, { ethnicityCode: '21111' }).ok).toBe(true)
    expect(dataQualityOf(api, batchId)).toBeUndefined()
    expect(api.getState().intake.rows[rowIds[0]!]!.correctionHistory?.map((c) => [c.field, c.from, c.to])).toEqual([
      ['ethnicityCode', '', '99999'],
      ['ethnicityCode', '99999', '21111'],
    ])
  })

  it('refuses a decided row: a placed List is edited on its Bookings', () => {
    const api = createAppStore()
    const rowId = api.getState().intake.batches[SEED_DECIDED_ARRIVAL.batchId]!.rowIds[0]!
    const state = api.getState()
    expect(correctArrivalRow(api, OFFICE_ACTOR, rowId, { scheduledTime: '07:45' })).toMatchObject({ ok: false, code: 'alreadyDecided', message: 'This row has already been decided.' })
    expect(api.getState()).toBe(state)
  })

  it('refuses anyone but the office', () => {
    const { api, rowIds } = okafor()
    const state = api.getState()
    expect(correctArrivalRow(api, SOUTER_ACTOR, rowIds[0]!, { scheduledTime: '13:30' })).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(api.getState()).toBe(state)
  })
})

describe('a corrected ethnicity code reaches the patient (Wave 7 join; DM-15)', () => {
  it('placing the List carries the corrected code onto the new patient the row becomes', () => {
    const { api, rowIds } = okafor()
    // A row whose patient AA does not hold yet (an existing patient's record is not overwritten by an arrival).
    const known = new Set(Object.values(api.getState().masters.patients).map((p) => p.nhi))
    const rowId = rowIds.find((id) => {
      const nhi = api.getState().intake.rows[id]!.incoming.patient.nhi
      return nhi !== undefined && !known.has(nhi)
    })!
    expect(rowId).toBeDefined()
    // A valid code from the demo's set, different from the one read.
    const code = api.getState().intake.rows[rowId]!.incoming.patient.ethnicityCode === '11111' ? '21111' : '11111'
    expect(correctArrivalRow(api, OFFICE_ACTOR, rowId, { ethnicityCode: code }).ok).toBe(true)
    const item = arrivalItemsOf(api.getState()).find((i) => i.rowIds.includes(rowId) && i.kind === 'newList')!
    const choices = placeChoicesFor(api.getState(), item.key)!
    const slot = choices.suggested ?? choices.otherSlots[0]!
    const placed = placeArrivalList(api, OFFICE_ACTOR, item.key, sessionChoice(slot.id))
    if (!placed.ok) throw new Error(placed.message)
    const s = api.getState()
    const decision = s.intake.rows[rowId]!.decision
    const bookingId = decision !== undefined && 'bookingId' in decision ? decision.bookingId : undefined
    const patientId = bookingId !== undefined ? s.schedule.bookings[bookingId]?.patientId : undefined
    expect(patientId).toBeDefined()
    expect(s.masters.patients[patientId!]?.ethnicityCode).toBe(code)
  })
})
