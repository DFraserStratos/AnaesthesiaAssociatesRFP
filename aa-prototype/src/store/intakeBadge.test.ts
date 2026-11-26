/**
 * Intake's badge (build plan Phase 68; D125, US-11.1.5): each arriving List with an undecided row not waiting for
 * an NHI, once; each unreadable PDF and held message until dismissed, once; each row waiting for an NHI, once. From
 * the intake slice alone, and always the feed's To decide count.
 */
import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { matchingAttentionCount } from './matchingSelectors'
import { arrivalFeedCounts } from './intakeSelectors'
import type { ImportBatch, ImportRow, IncomingBookingFields } from '../domain/types'

const AT = '2026-11-24T07:00:00'

function row(id: string, batchId: string, incoming: Partial<IncomingBookingFields>, status: ImportRow['status'] = 'open'): ImportRow {
  return {
    id,
    batchId,
    channel: 'download',
    source: 'hospital',
    receivedAtISO: AT,
    incoming: { hospitalId: 'H-STG', dateISO: '2026-12-02', session: 'AM', surgeon: { name: 'Mr C. Okafor', hpiId: '43OKAC' }, patient: { name: 'P' }, hospitalStatus: 'booked', ...incoming },
    status,
  }
}

function batch(id: string, rowIds: string[], extra: Partial<ImportBatch> = {}): ImportBatch {
  return { id, channel: 'download', source: 'hospital', hospitalId: 'H-STG', label: id, arrivalSource: { kind: 'hospitalFeed', hospitalId: 'H-STG' }, receivedAtISO: AT, rowIds, ...extra }
}

describe("Intake's badge (D125)", () => {
  it('counts each arriving List once, each waiting row once, each held or unreadable arrival until dismissed', () => {
    const rows = [
      row('R1', 'B1', { patient: { name: 'Ana', nhi: 'ZQA3019' } }),
      row('R2', 'B1', { patient: { name: 'Ben', nhi: 'ZQA2110' } }),
      row('R3', 'B1', { patient: { name: 'Cal' } }),
      row('R4', 'B1', { session: 'PM', patient: { name: 'Dee', nhi: 'ZQA1024' } }),
      row('R5', 'B1', { session: 'PM', patient: { name: 'Eve', nhi: 'ZQA1008' } }, 'applied'),
      row('R6', 'B2', { patient: { name: 'Fay', nhi: 'ZQA3019' } }, 'leftOut'),
    ]
    const intake = {
      rows: Object.fromEntries(rows.map((r) => [r.id, r])),
      batches: {
        B1: batch('B1', ['R1', 'R2', 'R3', 'R4', 'R5']),
        B2: batch('B2', ['R6']),
        B3: batch('B3', [], { heldReason: 'No patient in the message' }),
        B4: batch('B4', [], { unreadableReason: 'The scan is too faint to read.' }),
        B5: batch('B5', [], { heldReason: 'Dismissed one', dismissed: { by: 'Kirsty W.', atISO: AT, reason: 'Resent' } }),
      },
      stubs: {},
      pdfLists: {},
      sources: {},
    }
    // B1's AM List and PM List (2), Cal waiting (1), B3 held and B4 unreadable (2); B2 decided and B5 dismissed add none.
    expect(matchingAttentionCount({ intake })).toBe(5)
  })

  it('the waiting row drops by one when its NHI is added; a List of only waiting rows counts its rows, not itself', () => {
    const waiting = row('R1', 'B1', { patient: { name: 'Cal' } })
    const intake = { rows: { R1: waiting }, batches: { B1: batch('B1', ['R1']) }, stubs: {}, pdfLists: {}, sources: {} }
    expect(matchingAttentionCount({ intake })).toBe(1)
    const added = { ...intake, rows: { R1: { ...waiting, corrections: { nhi: 'ZQA3019' } } } }
    expect(matchingAttentionCount({ intake: added })).toBe(1)
    const decided = { ...intake, rows: { R1: { ...waiting, status: 'applied' as const } } }
    expect(matchingAttentionCount({ intake: decided })).toBe(0)
  })

  it('equals the feed’s To decide count on the seed', () => {
    const state = createAppStore().getState()
    expect(matchingAttentionCount(state)).toBe(arrivalFeedCounts(state).toDecide)
  })
})
