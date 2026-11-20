import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { rawRowRefusal, rawViewsFor, viewRawImportRow, RAW_ROW_NOT_ELIGIBLE, RAW_ROW_OFFICE_ONLY } from './rawRowActions'
import { HOSPITAL_FEED_ACTOR, OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { SEED_STUB } from '../domain/seed/intakeSeed'
import { findNhiTokens } from '../domain/privacy/nhiDetect'
import { ACTION_LABELS } from '../shared/audit/actionLabels'

const ROW = SEED_STUB.rowId

describe('the restricted raw hospital row (catch-up Phase 43)', () => {
  it('the seeded row waiting for its NHI holds its raw payload and is eligible', () => {
    const api = createAppStore()
    expect(api.getState().intake.rows[ROW]!.raw?.columns.length).toBeGreaterThan(10)
    expect(rawRowRefusal(api.getState(), ROW)).toBeNull()
  })

  it('refuses an unknown row, a blank reason and a decided row', () => {
    const api = createAppStore()
    expect(viewRawImportRow(api, OFFICE_ACTOR, 'IR9999', 'x')).toMatchObject({ ok: false, code: 'notFound' })
    expect(viewRawImportRow(api, OFFICE_ACTOR, ROW, '   ')).toMatchObject({ ok: false, code: 'reasonRequired' })
    const s = api.getState()
    api.setState({ intake: { ...s.intake, rows: { ...s.intake.rows, [ROW]: { ...s.intake.rows[ROW]!, status: 'rejected' } } } })
    expect(viewRawImportRow(api, OFFICE_ACTOR, ROW, 'Check')).toMatchObject({ ok: false, code: 'notEligible', message: RAW_ROW_NOT_ELIGIBLE })
  })

  it('a non-office attempt is refused, audited once and returns no payload', () => {
    for (const actor of [SOUTER_ACTOR, HOSPITAL_FEED_ACTOR]) {
      const api = createAppStore()
      const before = api.getState().audit.length
      const out = viewRawImportRow(api, actor, ROW, 'Demo: access check')
      expect(out).toMatchObject({ ok: false, code: 'officeOnly', message: RAW_ROW_OFFICE_ONLY })
      expect('value' in out).toBe(false)
      const added = api.getState().audit.slice(before)
      expect(added).toHaveLength(1)
      expect(added[0]).toMatchObject({ action: 'importRow.rawViewDenied', entityId: ROW, after: { role: actor.role, source: actor.source } })
    }
  })

  it('the office view writes one entry with the reason and no values, and returns the masked payload', () => {
    const api = createAppStore()
    const before = api.getState().audit.length
    const out = viewRawImportRow(api, OFFICE_ACTOR, ROW, 'Find why this row did not match')
    expect(out.ok).toBe(true)
    if (!out.ok) return
    const entries = api.getState().audit.slice(before)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.after).toEqual({ reason: 'Find why this row did not match', columnsShown: out.value.columns.length })
    const dob = api.getState().intake.rows[ROW]!.incoming.patient.dobISO!
    expect(JSON.stringify(out.value)).not.toContain(dob)
    expect(findNhiTokens(JSON.stringify(out.value))).toEqual([])
    expect(rawViewsFor(api.getState(), ROW)).toMatchObject({ count: 1, last: { who: OFFICE_ACTOR.who } })
    // The row itself is untouched (each view is a fresh request).
    expect(api.getState().intake.rows[ROW]).toEqual(createAppStore().getState().intake.rows[ROW])
  })

  it('audits a non-office attempt even with a blank reason, and keeps no NHI typed into a reason', () => {
    const api = createAppStore()
    const before = api.getState().audit.length
    expect(viewRawImportRow(api, SOUTER_ACTOR, ROW, '')).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(api.getState().audit.slice(before).map((e) => e.action)).toEqual(['importRow.rawViewDenied'])
    const nhi = Object.values(api.getState().masters.patients).find((p) => p.nhi !== undefined)!.nhi!
    expect(viewRawImportRow(api, OFFICE_ACTOR, ROW, `Hospital says ${nhi} is wrong`).ok).toBe(true)
    const entry = api.getState().audit.at(-1)!
    expect(JSON.stringify(entry)).not.toContain(nhi)
    expect((entry.after as { reason: string }).reason).toBe('Hospital says [NHI] is wrong')
  })

  it('labels both audit codes', () => {
    expect(ACTION_LABELS['importRow.rawViewed']).toBeDefined()
    expect(ACTION_LABELS['importRow.rawViewDenied']).toBeDefined()
  })
})
