/**
 * Intake's URLs (build plan Phase 68; D117): the builders, the filter round trip, and every old Intake address
 * landing where D117 says.
 */

import { describe, expect, it } from 'vitest'
import type { FeedFilter } from '../../../../domain/intake/arrivals'
import { DEFAULT_INBOX_QUERY, type InboxQuery } from '../../../../domain/intake/inbox'
import {
  INTAKE_BASE,
  INTAKE_LEGACY_PATHS,
  arrivalPath,
  arrivalsPath,
  feedFilterFromParam,
  feedFilterParam,
  inboxPath,
  inboxQueryFromParams,
  inboxRedirectFromLegacyParams,
  intakePathFromLegacy,
  sameFeedFilter,
  sourcesPath,
} from './intakePaths'

describe('the builders', () => {
  it('Arrivals is the base; Sources its own path', () => {
    expect(arrivalsPath()).toBe(INTAKE_BASE)
    expect(sourcesPath()).toBe('/admin/intake/sources')
  })

  it('maps the old filter, search and item onto the inbox and the opened arrival', () => {
    expect(arrivalsPath({ filter: { kind: 'toDecide' } })).toBe('/admin/intake')
    expect(arrivalsPath({ filter: { kind: 'needsNhi' } })).toBe('/admin/intake?show=needs-nhi')
    expect(arrivalsPath({ filter: { kind: 'hospital', hospitalId: 'H-STG' }, q: ' okafor ', item: 'IB0001~a' })).toBe('/admin/intake/arrival/IB0001~a?source=H-STG&q=okafor')
    expect(arrivalsPath({ q: '   ' })).toBe('/admin/intake')
  })

  it('round-trips every part of the inbox query, leaving the defaults out', () => {
    expect(inboxPath()).toBe('/admin/intake')
    const q: InboxQuery = { show: 'decided', kind: 'update', source: 'rooms', surgery: '7d', look: true, sort: { key: 'received', dir: 'desc' }, q: 'tan' }
    const path = inboxPath(q)
    expect(path).toBe('/admin/intake?show=decided&kind=update&source=rooms&surgery=7d&look=1&sort=received-desc&q=tan')
    expect(inboxQueryFromParams(new URLSearchParams(path.split('?')[1]))).toEqual(q)
    expect(inboxQueryFromParams(new URLSearchParams('show=x&kind=y&surgery=z&sort=nope-up'))).toEqual(DEFAULT_INBOX_QUERY)
    expect(arrivalPath('K 1', q)).toBe(`/admin/intake/arrival/K%201?${path.split('?')[1]}`)
  })

  it('redirects an old ?item= or ?filter= address, and leaves an inbox address alone', () => {
    expect(inboxRedirectFromLegacyParams(new URLSearchParams('item=K1&filter=needs-nhi'))).toBe('/admin/intake/arrival/K1?show=needs-nhi')
    expect(inboxRedirectFromLegacyParams(new URLSearchParams('filter=rooms-pdfs'))).toBe('/admin/intake?source=rooms')
    expect(inboxRedirectFromLegacyParams(new URLSearchParams('show=decided'))).toBeUndefined()
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
      expect(intakePathFromLegacy(p, 'K1')).toBe('/admin/intake/arrival/K1')
    }
  })

  it('Waiting for NHI lands on Needs NHI, PDF lists on Rooms PDFs, Data quality and Validators on Arrivals', () => {
    expect(intakePathFromLegacy('/admin/intake/waiting')).toBe('/admin/intake?show=needs-nhi')
    expect(intakePathFromLegacy('/admin/intake/pdfs/')).toBe('/admin/intake?source=rooms')
    expect(intakePathFromLegacy('/admin/intake/quality')).toBe('/admin/intake')
    expect(intakePathFromLegacy('/admin/intake/validators')).toBe('/admin/intake')
  })

  it('lists every old address once', () => {
    expect(new Set(INTAKE_LEGACY_PATHS).size).toBe(INTAKE_LEGACY_PATHS.length)
  })
})
