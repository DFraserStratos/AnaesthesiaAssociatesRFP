/**
 * Catch-up Phase 42's demo triggers: "Load sample spreadsheet" (the
 * developer's seed load, staged and not loaded) and "Go-live data load
 * (demo)", both bar only on Admin · Master data.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from '../../store'
import { SAMPLE_SHEETS } from '../../domain/masterLoad/samples'
import { DEMO_TRIGGERS } from './registry'
import { demoTriggersFor } from './match'
import type { DemoContextValues } from './context'
import type { DemoTriggerCtx } from './types'

const byId = (id: string) => DEMO_TRIGGERS.find((t) => t.id === id)!
const ctx = (published: Partial<DemoContextValues> = {}): DemoTriggerCtx => ({ pathname: '/admin/masters', params: {}, published })

describe('Load sample spreadsheet (catch-up Phase 42)', () => {
  const entry = byId('load-sample-spreadsheet')

  it('is bar only on Master data and the Contract list, shown on Seed load and on a seeded view, never on an unseeded one', () => {
    const api = createAppStore()
    expect(entry.surfaces).toEqual(['bar'])
    expect(entry.routes).toEqual(['/admin/masters', '/admin/contracts', '/admin/contracts/parties', '/admin/contracts/tags'])
    expect(entry.indexPath(api.getState())).toBe('/admin/masters?view=seedLoad')
    const on = (view: string) => demoTriggersFor(api.getState(), '/admin/masters', 'bar', { 'adminMasters.view': view }).map((m) => m.trigger.id)
    expect(on('seedLoad')).toContain('load-sample-spreadsheet')
    expect(on('hospitals')).toContain('load-sample-spreadsheet')
    expect(on('surgeonGroups')).not.toContain('load-sample-spreadsheet')
    expect(on('goLive')).not.toContain('load-sample-spreadsheet')
    expect(demoTriggersFor(api.getState(), '/admin/masters', 'pwa', { 'adminMasters.view': 'seedLoad' }).map((m) => m.trigger.id)).not.toContain('load-sample-spreadsheet')
    // The Contract list moved to its own section (build plan Phase 45): its tab offers the contracts sheets.
    expect(demoTriggersFor(api.getState(), '/admin/contracts', 'bar', { 'adminContracts.tab': 'contracts' }).map((m) => m.trigger.id)).toContain('load-sample-spreadsheet')
    expect(entry.choices!(api.getState(), ctx({ 'adminContracts.tab': 'contracts' })).map((c) => c.label)).toEqual(['contracts.csv', 'price-ranges.csv'])
    // Parties and Funding tags are tabs of the section too (build plan Phase 48): each offers its own sheet.
    expect(demoTriggersFor(api.getState(), '/admin/contracts/parties', 'bar', { 'adminContracts.tab': 'parties' }).map((m) => m.trigger.id)).toContain('load-sample-spreadsheet')
    expect(entry.choices!(api.getState(), ctx({ 'adminContracts.tab': 'parties' })).map((c) => c.label)).toEqual(['parties.csv'])
    expect(entry.choices!(api.getState(), ctx({ 'adminContracts.tab': 'fundingTags' })).map((c) => c.label)).toEqual(['funding-tags.csv'])
  })

  it('offers every sample on Seed load and a view its own sheets, by file name', () => {
    const api = createAppStore()
    const labels = (view: string) => entry.choices!(api.getState(), ctx({ 'adminMasters.view': view })).map((c) => c.label)
    expect(labels('seedLoad')).toEqual(SAMPLE_SHEETS.map((s) => s.fileName))
    expect(labels('hospitals')).toEqual(['hospitals.csv', 'hospital-holidays.csv'])
    expect(labels('contracts')).toEqual(['contracts.csv', 'price-ranges.csv'])
    expect(labels('rvgGroups')).toEqual(['rvg-groups.csv'])
    expect(labels('publicHolidays')).toEqual(['public-holidays-2027.csv'])
    expect(labels('surgeons')).toEqual(['surgeons.csv'])
  })

  it('stages the sample as the developer, with a computed message, and waits while it is staged', () => {
    const api = createAppStore()
    const c = ctx({ 'adminMasters.view': 'hospitals' })
    expect(entry.disabledReason(api.getState(), c, 'sample-hospitals')).toBeNull()
    const result = entry.run(api, c, 'sample-hospitals')
    const load = Object.values(api.getState().masterLoads.loads).find((l) => l.entity === 'hospitals')!
    const valid = load.rows.filter((r) => r.status === 'valid').length
    expect(result).toEqual({
      ok: true,
      message: `hospitals.csv checked: ${valid} ${valid === 1 ? 'row' : 'rows'} valid, ${load.rows.length - valid} rejected. Open Master data, Seed load, and press Load.`,
    })
    expect(load.status).toBe('staged')
    expect(load.stagedBy).toBe('Developer seed load (simulated)')
    expect(load.source).toEqual({ kind: 'sample', sampleId: 'sample-hospitals' })
    expect(entry.disabledReason(api.getState(), c, 'sample-hospitals')).toBe('A load is already waiting for this sheet; load or discard it first')
    expect(entry.disabledReason(api.getState(), c, 'sample-hospital-holidays')).toBeNull()
  })
})

describe('Go-live data load (catch-up Phase 42)', () => {
  const entry = byId('go-live-data-load')

  it('is bar only on every Master data view and opens Go-live load', () => {
    const api = createAppStore()
    expect(entry.surfaces).toEqual(['bar'])
    expect(entry.indexPath(api.getState())).toBe('/admin/masters?view=goLive')
    for (const view of ['anaesthetists', 'surgeonGroups', 'goLive']) {
      expect(demoTriggersFor(api.getState(), '/admin/masters', 'bar', { 'adminMasters.view': view }).map((m) => m.trigger.id)).toContain('go-live-data-load')
    }
  })

  it('prepares the batch as the developer with the fixture counts, then waits until it is loaded or discarded', () => {
    const api = createAppStore()
    expect(entry.disabledReason(api.getState(), ctx())).toBeNull()
    expect(entry.run(api, ctx())).toEqual({
      ok: true,
      message: 'Go-live load prepared: 14 Solutions Plus names (5 excluded as junk, 2 not approved) and 6 controlled spreadsheets. Open Master data, Go-live load.',
    })
    expect(api.getState().masterLoads.goLive?.stagedBy).toBe('Developer seed load (simulated)')
    expect(entry.disabledReason(api.getState(), ctx())).toBe('A go-live load is already waiting; load or discard it first')
  })
})
