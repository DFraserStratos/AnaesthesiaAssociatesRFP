/**
 * Phase 51 (US-11.1.5, US-11.1.4, US-02.1.4; D99): a row waiting for an NHI
 * counts once, on Intake (`matchingAttentionCount`), never in the Patients
 * count. Adding the NHI drops Intake's count when the row becomes a Booking;
 * a row with no List yet leaves the waiting tab and stays one open row on
 * Matching, still counted once. A hospital cancellation with no NHI is never
 * on the tab and stays counted on Matching for Reject.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from './appStore'
import type { Actor } from './mutate'
import { stageNoNhiList } from '../test/intakeSamples'
import { addNhiToWaitingRow } from './patientActions'
import { patientAttentionCount, waitingNhiRows } from './patientSelectors'
import { assessImportRow, matchingAttentionCount } from './matchingSelectors'
import { stubForRow } from './stubSelectors'
import { NO_NHI_NEW_PATIENT_NHI, NO_NHI_RETURNING_NHI } from '../domain/intake/hospitalDownloads'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function staged() {
  const api = createAppStore()
  stageNoNhiList(api)
  // The seed's own waiting rows (IRS001, and the seeded morning's IRM006 and IRM018) are left out.
  const rows = waitingNhiRows(api.getState()).filter((r) => !['IRS001', 'IRM006', 'IRM018'].includes(r.rowId))
  const rowOf = (name: string) => rows.find((r) => r.patientName === name)!.rowId
  return { api, rowOf }
}

/** Edit one row in place, as a test fixture only: a date with no List, or a hospital cancellation. */
function patchRow(api: AppStoreApi, rowId: string, patch: { dateISO?: string; hospitalStatus?: 'cancelled' }) {
  api.setState((s) => {
    const row = s.intake.rows[rowId]!
    const stubs = Object.fromEntries(Object.entries(s.intake.stubs).filter(([, stub]) => stub.importRowId !== rowId))
    return { intake: { ...s.intake, stubs, rows: { ...s.intake.rows, [rowId]: { ...row, incoming: { ...row.incoming, ...patch } } } } }
  })
}

describe('a waiting row counts once, on Intake (Phase 51)', () => {
  it('counts in matchingAttentionCount and never in patientAttentionCount', () => {
    const api = createAppStore()
    const intake = matchingAttentionCount(api.getState())
    const patients = patientAttentionCount(api.getState())
    stageNoNhiList(api)
    // The seed's three and the sample's two.
    expect(waitingNhiRows(api.getState())).toHaveLength(5)
    expect(matchingAttentionCount(api.getState())).toBe(intake + 2)
    expect(patientAttentionCount(api.getState())).toBe(patients)
  })

  it('Add NHI on a row with a stub drops Intake\'s count by one (new patient and returning patient)', () => {
    const { api, rowOf } = staged()
    for (const [name, nhi] of [['Aroha Ngata', NO_NHI_NEW_PATIENT_NHI], ['Losa Tuilagi', NO_NHI_RETURNING_NHI]] as const) {
      const rowId = rowOf(name)
      expect(stubForRow(api.getState(), rowId)).toBeDefined()
      const before = matchingAttentionCount(api.getState())
      expect(addNhiToWaitingRow(api, OFFICE, rowId, nhi)).toMatchObject({ ok: true, value: { kind: 'resolved' } })
      expect(matchingAttentionCount(api.getState())).toBe(before - 1)
      expect(waitingNhiRows(api.getState()).map((r) => r.rowId)).not.toContain(rowId)
    }
  })

  it('a row with no List: Add NHI takes it off the tab and leaves one open row on Matching, counted once', () => {
    const { api, rowOf } = staged()
    const rowId = rowOf('Aroha Ngata')
    patchRow(api, rowId, { dateISO: '2027-06-02' })
    const listed = waitingNhiRows(api.getState()).find((r) => r.rowId === rowId)!
    expect(listed.listId).toBeUndefined()
    expect(stubForRow(api.getState(), rowId)).toBeUndefined()
    const before = matchingAttentionCount(api.getState())
    expect(addNhiToWaitingRow(api, OFFICE, rowId, NO_NHI_NEW_PATIENT_NHI)).toMatchObject({ ok: true, value: { kind: 'needsDecision' } })
    expect(waitingNhiRows(api.getState()).map((r) => r.rowId)).not.toContain(rowId)
    const after = assessImportRow(api.getState(), rowId)!
    expect(after.waitingForNhi).toBe(false)
    expect(after.queue).toBe('unmatched')
    // Still the office's to decide (no List to land on), so it stays counted, once.
    expect(matchingAttentionCount(api.getState())).toBe(before)
  })

  it('a hospital cancellation with no NHI is not on the tab and stays counted on Matching', () => {
    const { api, rowOf } = staged()
    const rowId = rowOf('Losa Tuilagi')
    const before = matchingAttentionCount(api.getState())
    patchRow(api, rowId, { hospitalStatus: 'cancelled' })
    expect(waitingNhiRows(api.getState()).map((r) => r.rowId)).not.toContain(rowId)
    expect(assessImportRow(api.getState(), rowId)?.changeType).toBe('cancellation')
    expect(matchingAttentionCount(api.getState())).toBe(before)
  })
})
