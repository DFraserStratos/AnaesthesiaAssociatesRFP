/**
 * Catch-up Phase 33: the sample files' seeded targets, pinned on a fresh seed,
 * and how every row classifies through `suggestDecision`.
 */
import { describe, expect, it } from 'vitest'
import { freshAppState } from './appStore'
import { matchingView } from './matchingSelectors'
import { railContextForList, railMastersOf } from './selectors'
import { suggestDecision, HOSPITAL_DOWNLOAD_SAMPLES, type RowAssessment } from '../domain/intake'
import { contractCandidatesFor } from '../domain/billing/contractRail'
import type { ImportRow } from '../domain/types'

const state = freshAppState()
const view = matchingView({ ...state })

function assess(sampleId: string): RowAssessment[] {
  const sample = HOSPITAL_DOWNLOAD_SAMPLES.find((s) => s.id === sampleId)!
  return sample.rows.map((incoming, i) => {
    const row: ImportRow = { id: `IR${i}`, batchId: 'IB', channel: sample.channel, source: 'hospital', receivedAtISO: '2026-11-24T09:00:00', incoming, status: 'open' }
    return suggestDecision(view, row)
  })
}

describe("St George's theatre list", () => {
  const [r1, r2, r3, r4, r5] = assess('SAMPLE_STG')
  it('R1 Sarah Mitchell: New, Create Booking on Dr Souter Tue 1 Dec AM', () => {
    expect(r1).toMatchObject({ changeType: 'new', suggestion: { kind: 'createBooking', listId: 'L-34821-2026-12-01-AM' } })
    expect(state.schedule.lists['L-34821-2026-12-01-AM']).toMatchObject({ state: 'ACTIVE', hospitalId: 'H-STG', surgeonId: 'S-HALE' })
  })
  it('R2 the 07:45 Booking (BK0066): No change', () => {
    expect(state.masters.patients[state.schedule.bookings['BK0066']!.patientId]!.nhi).toBe('GBB9305')
    expect(r2).toMatchObject({ changeType: 'noChange', match: { bookingId: 'BK0066' } })
  })
  it("R3 Diane Foster (BK0043, the rooms' WLE MM): Modification of time, text and note", () => {
    expect(state.schedule.procedures['P0046']!.procedureText?.text).toBe('WLE MM')
    expect(r3!.changeType).toBe('modification')
    expect(r3!.diffs.map((d) => d.key)).toEqual(['time', 'procedureText', 'note'])
  })
  it('R4 and R5, a day move: a Cancellation of BK0042 and a New row on Tue 8 Dec AM', () => {
    expect(r4).toMatchObject({ changeType: 'cancellation', match: { bookingId: 'BK0042' } })
    expect(r5).toMatchObject({ changeType: 'new', suggestion: { kind: 'createBooking', listId: 'L-34821-2026-12-08-AM' } })
  })
})

describe('Southern Cross theatre list', () => {
  const [r1, r2, r3, r4, r5] = assess('SAMPLE_SX')
  it('R1 Priya Nair: New on Dr Souter Tue 1 Dec PM', () => {
    expect(r1).toMatchObject({ changeType: 'new', suggestion: { kind: 'createBooking', listId: 'L-34821-2026-12-01-PM' } })
  })
  it('R2 Olive Ratima (BK0166, No contract): a Modification of name, date of birth, insurer and note; an nib Contract is offered', () => {
    expect(r2).toMatchObject({ changeType: 'modification', match: { bookingId: 'BK0166' } })
    expect(r2!.diffs.map((d) => d.key)).toEqual(['patientName', 'dob', 'insurer', 'note'])
    expect(r2!.flags).toEqual([])
    const list = state.schedule.lists['L-34821-2026-12-01-PM']!
    expect(contractCandidatesFor(railMastersOf(state), railContextForList(state, list)).map((c) => c.id)).toContain('CT-NIB-D1')
  })
  it('R3 on the authorised Wed 18 Mar List: Modification flagged List authorised', () => {
    expect(state.schedule.lists['L-HIST-08']!.state).toBe('AUTHORISED')
    expect(r3).toMatchObject({ changeType: 'modification', match: { bookingId: 'HBK08' } })
    expect(r3!.flags.map((f) => f.code)).toEqual(['listAuthorised'])
  })
  it('R4 no NHI: waits, exposing its List', () => {
    expect(r4).toMatchObject({ waitingForNhi: true, targetListId: 'L-34821-2026-12-01-PM' })
  })
  it('R5 Thu 10 Dec PM: unmatched, no List or Draft List there', () => {
    expect(r5).toMatchObject({ queue: 'unmatched', unmatchedReason: 'No List at Southern Cross for Ms Patel on Thu 10 Dec PM' })
    expect(Object.values(state.schedule.lists).some((l) => l.hospitalId === 'H-SX' && l.dateISO === '2026-12-10' && l.session === 'PM' && l.surgeonId === 'S-PATEL')).toBe(false)
  })
})

describe('Forte Health daily sheet', () => {
  const [r1, r2, r3] = assess('SAMPLE_FORTE_SHEET')
  it('R1 new onto Mr Okafor Tue 1 Dec AM; R2 NHI invalid; R3 unmatched with a recognised surgeon', () => {
    expect(r1).toMatchObject({ changeType: 'new', surgeonId: 'S-OKAFOR', suggestion: { kind: 'createBooking', listId: 'L-29104-2026-12-01-AM' } })
    expect(r2!.flags.map((f) => f.code)).toContain('nhiInvalid')
    expect(r3).toMatchObject({ queue: 'unmatched', surgeonId: 'S-OKAFOR' })
  })
})

describe('Sarah Mitchell and Priya Nair hold no other Booking at those hospitals that day', () => {
  it('so their rows read New', () => {
    for (const [patient, hospital, date] of [['PT0005', 'H-STG', '2026-12-01'], ['PT0008', 'H-SX', '2026-12-01']] as const) {
      const clash = Object.values(state.schedule.bookings).filter((b) => b.patientId === patient && state.schedule.lists[b.listId]?.hospitalId === hospital && state.schedule.lists[b.listId]?.dateISO === date)
      expect(clash).toEqual([])
    }
  })
})
