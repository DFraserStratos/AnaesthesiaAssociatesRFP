import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { heldMessageRaw, rawMessageColumns, rawRowEligible, rawRowRefusal, rawRowTarget, rawViewsFor, viewRawImportRow, RAW_ROW_NOT_ELIGIBLE, RAW_ROW_OFFICE_ONLY } from './rawRowActions'
import { receiveFailedMessage } from './intakeIngest'
import { OKAFOR_STORY } from '../domain/intake/hospitalDownloads'
import type { AppStoreApi } from './appStore'
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

const FAILED = OKAFOR_STORY.failedMessage

function holdMessage(api: AppStoreApi): string {
  const out = receiveFailedMessage(api, FAILED.hospitalId, { label: FAILED.label, reason: FAILED.reason, raw: FAILED.raw })
  if (!out.ok) throw new Error(out.message)
  return out.value.batchId
}

function dismiss(api: AppStoreApi, batchId: string) {
  const s = api.getState()
  api.setState({ intake: { ...s.intake, batches: { ...s.intake.batches, [batchId]: { ...s.intake.batches[batchId]!, dismissed: { by: 'Office', atISO: '2026-11-24T09:00:00', reason: 'Test' } } } } })
}

describe('the raw view of a held feed message (build plan Phase 71)', () => {
  it('a held message is eligible while held and undismissed, its raw text kept', () => {
    const api = createAppStore()
    const batchId = holdMessage(api)
    expect(heldMessageRaw(api.getState(), batchId)).toBe(FAILED.raw)
    expect(rawRowEligible(api.getState(), batchId)).toBe(true)
    expect(rawRowRefusal(api.getState(), batchId)).toBeNull()
    dismiss(api, batchId)
    expect(rawRowEligible(api.getState(), batchId)).toBe(false)
    expect(rawRowRefusal(api.getState(), batchId)).toBe(RAW_ROW_NOT_ELIGIBLE)
    expect(viewRawImportRow(api, OFFICE_ACTOR, batchId, 'Check')).toMatchObject({ ok: false, code: 'notEligible' })
  })

  it('the office view needs a reason, returns the message as masked columns and audits once with the reason', () => {
    const api = createAppStore()
    const batchId = holdMessage(api)
    expect(viewRawImportRow(api, OFFICE_ACTOR, batchId, '  ')).toMatchObject({ ok: false, code: 'reasonRequired' })
    const before = api.getState().audit.length
    const out = viewRawImportRow(api, OFFICE_ACTOR, batchId, 'Check what the hospital sent')
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.value.columns).toContainEqual({ name: 'resourceType', value: 'Appointment' })
    expect(out.value.columns).toContainEqual({ name: 'participant[0].actor.display', value: 'Ms K. Patel' })
    const entries = api.getState().audit.slice(before)
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ entityType: 'importBatch', entityId: batchId, action: 'importRow.rawViewed', after: { reason: 'Check what the hospital sent', columnsShown: out.value.columns.length } })
    expect(rawViewsFor(api.getState(), batchId).count).toBe(1)
  })

  it('another role is refused and audited, with no payload', () => {
    const api = createAppStore()
    const batchId = holdMessage(api)
    const before = api.getState().audit.length
    const out = viewRawImportRow(api, SOUTER_ACTOR, batchId, 'Demo: access check')
    expect(out).toMatchObject({ ok: false, code: 'officeOnly', message: RAW_ROW_OFFICE_ONLY })
    expect(api.getState().audit.slice(before).map((e) => [e.action, e.entityId])).toEqual([['importRow.rawViewDenied', batchId]])
  })

  it('the harness target falls back to the oldest held message when no row needs resolving', () => {
    const api = createAppStore()
    const batchId = holdMessage(api)
    const s = api.getState()
    const rows = Object.fromEntries(Object.entries(s.intake.rows).map(([id, r]) => [id, { ...r, status: 'rejected' as const }]))
    api.setState({ intake: { ...s.intake, rows } })
    expect(rawRowTarget(api.getState(), undefined)).toBe(batchId)
    expect(rawRowTarget(api.getState(), batchId)).toBe(batchId)
    dismiss(api, batchId)
    expect(rawRowTarget(api.getState(), undefined)).toBeUndefined()
  })

  it('reads HL7 as one column per segment, the PID by field, and masks the date of birth', () => {
    const cols = rawMessageColumns('MSH|^~\\&|SX|SX\rSCH|1662188\rPID|1||ZZZ0016^^^NHI||Doe^Jane||19800102|F')
    expect(cols.columns.map((c) => c.name)).toEqual(['MSH', 'SCH', 'PID-1', 'PID-3', 'PID-5', 'PID-7', 'PID-8'])
    expect(rawMessageColumns('not a message')).toEqual({ columns: [{ name: 'Message', value: 'not a message' }] })
    const api = createAppStore()
    const out = receiveFailedMessage(api, FAILED.hospitalId, { label: 'HL7', reason: 'Unreadable', raw: 'MSH|^~\\&|SX\rPID|1||ZZZ0016^^^NHI||Doe^Jane||19800102|F' })
    if (!out.ok) throw new Error(out.message)
    const view = viewRawImportRow(api, OFFICE_ACTOR, out.value.batchId, 'Check')
    if (!view.ok) throw new Error(view.message)
    expect(view.value.columns.find((c) => c.name === 'PID-7')!.value).toBe('1980-••-••')
    expect(JSON.stringify(view.value)).not.toContain('19800102')
  })
})
