/**
 * Intake's URLs (build plan Phase 68; D117): the builders, the filter round trip, and every old Intake address
 * landing where D117 says.
 */

import { describe, expect, it } from 'vitest'
import type { FeedFilter } from '../../../../domain/intake/arrivals'
import { INTAKE_BASE, INTAKE_LEGACY_PATHS, arrivalsPath, feedFilterFromParam, feedFilterParam, intakePathFromLegacy, sameFeedFilter, sourcesPath } from './intakePaths'

describe('the builders', () => {
  it('Arrivals is the base; Sources its own path', () => {
    expect(arrivalsPath()).toBe(INTAKE_BASE)
    expect(sourcesPath()).toBe('/admin/intake/sources')
  })

  it('keeps the filter, search and item in the query, To decide having no filter', () => {
    expect(arrivalsPath({ filter: { kind: 'toDecide' } })).toBe('/admin/intake')
    expect(arrivalsPath({ filter: { kind: 'needsNhi' } })).toBe('/admin/intake?filter=needs-nhi')
    expect(arrivalsPath({ filter: { kind: 'hospital', hospitalId: 'H-STG' }, q: ' okafor ', item: 'IB0001~a' })).toBe('/admin/intake?filter=hospital-H-STG&q=okafor&item=IB0001%7Ea')
    expect(arrivalsPath({ q: '   ' })).toBe('/admin/intake')
  })

  it('round-trips every filter, anything unknown reading as To decide', () => {
    const filters: FeedFilter[] = [{ kind: 'toDecide' }, { kind: 'needsNhi' }, { kind: 'roomsPdfs' }, { kind: 'decided' }, { kind: 'hospital', hospitalId: 'H-SX' }]
    for (const f of filters) expect(feedFilterFromParam(feedFilterParam(f))).toEqual(f)
    for (const junk of [null, undefined, '', 'hospital-', 'quality', 'Decided']) expect(feedFilterFromParam(junk)).toEqual({ kind: 'toDecide' })
    expect(sameFeedFilter({ kind: 'hospital', hospitalId: 'H-SX' }, { kind: 'hospital', hospitalId: 'H-SX' })).toBe(true)
    expect(sameFeedFilter({ kind: 'hospital', hospitalId: 'H-SX' }, { kind: 'hospital', hospitalId: 'H-STG' })).toBe(false)
  })
})

describe('the old addresses (D117)', () => {
  it('Matching, /admin/matching and /admin/integrations land on Arrivals with the row’s arrival selected', () => {
    for (const p of ['/admin/intake/matching', '/admin/matching', '/admin/integrations']) {
      expect(intakePathFromLegacy(p)).toBe('/admin/intake')
      expect(intakePathFromLegacy(p, 'K1')).toBe('/admin/intake?item=K1')
    }
  })

  it('Waiting for NHI lands on Needs NHI, PDF lists on Rooms PDFs, Data quality and Validators on Arrivals', () => {
    expect(intakePathFromLegacy('/admin/intake/waiting')).toBe('/admin/intake?filter=needs-nhi')
    expect(intakePathFromLegacy('/admin/intake/pdfs/')).toBe('/admin/intake?filter=rooms-pdfs')
    expect(intakePathFromLegacy('/admin/intake/quality')).toBe('/admin/intake')
    expect(intakePathFromLegacy('/admin/intake/validators')).toBe('/admin/intake')
  })

  it('lists every old address once', () => {
    expect(new Set(INTAKE_LEGACY_PATHS).size).toBe(INTAKE_LEGACY_PATHS.length)
  })
})
