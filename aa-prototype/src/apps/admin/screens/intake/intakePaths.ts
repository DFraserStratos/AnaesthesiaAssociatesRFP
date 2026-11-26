/**
 * Intake's URLs (build plan Phase 68; D117): Arrivals at `/admin/intake` and Sources at `/admin/intake/sources`. The
 * one home every in-app Intake link builds them from. Arrivals keeps its filter (`?filter=`), search (`?q=`) and the
 * selected item (`?item=`, an arrival key from `domain/intake/arrivals.ts`) in the URL. The old Intake addresses map
 * here through `intakePathFromLegacy` and redirect with replace (`routes.tsx`'s `IntakeLegacyRedirect`).
 */

import type { FeedFilter } from '../../../../domain/intake/arrivals'

export const INTAKE_BASE = '/admin/intake'

/** The filter values in the URL. To decide is the default and has none. */
export const FEED_FILTER_PARAMS = { needsNhi: 'needs-nhi', roomsPdfs: 'rooms-pdfs', decided: 'decided', hospitalPrefix: 'hospital-' } as const

/** A filter as its URL value; undefined for To decide. */
export function feedFilterParam(filter: FeedFilter): string | undefined {
  switch (filter.kind) {
    case 'toDecide':
      return undefined
    case 'needsNhi':
      return FEED_FILTER_PARAMS.needsNhi
    case 'roomsPdfs':
      return FEED_FILTER_PARAMS.roomsPdfs
    case 'decided':
      return FEED_FILTER_PARAMS.decided
    case 'hospital':
      return `${FEED_FILTER_PARAMS.hospitalPrefix}${filter.hospitalId}`
  }
}

/** A URL value as its filter; anything unknown reads as To decide. */
export function feedFilterFromParam(param: string | null | undefined): FeedFilter {
  if (param === FEED_FILTER_PARAMS.needsNhi) return { kind: 'needsNhi' }
  if (param === FEED_FILTER_PARAMS.roomsPdfs) return { kind: 'roomsPdfs' }
  if (param === FEED_FILTER_PARAMS.decided) return { kind: 'decided' }
  if (param !== null && param !== undefined && param.startsWith(FEED_FILTER_PARAMS.hospitalPrefix) && param.length > FEED_FILTER_PARAMS.hospitalPrefix.length) {
    return { kind: 'hospital', hospitalId: param.slice(FEED_FILTER_PARAMS.hospitalPrefix.length) }
  }
  return { kind: 'toDecide' }
}

/** Two filters are the same filter. */
export function sameFeedFilter(a: FeedFilter, b: FeedFilter): boolean {
  return feedFilterParam(a) === feedFilterParam(b)
}

export interface ArrivalsPathOptions {
  filter?: FeedFilter
  q?: string
  /** The selected arrival's key. */
  item?: string
}

/** Arrivals, with its filter, search and selected item. */
export function arrivalsPath(options: ArrivalsPathOptions = {}): string {
  const query = new URLSearchParams()
  const filter = options.filter !== undefined ? feedFilterParam(options.filter) : undefined
  if (filter !== undefined) query.set('filter', filter)
  if (options.q !== undefined && options.q.trim() !== '') query.set('q', options.q.trim())
  if (options.item !== undefined && options.item !== '') query.set('item', options.item)
  const search = query.toString()
  return `${INTAKE_BASE}${search === '' ? '' : `?${search}`}`
}

/** Sources. */
export function sourcesPath(): string {
  return `${INTAKE_BASE}/sources`
}

/** The Intake addresses before Phase 68, each redirected with replace. */
export const INTAKE_LEGACY_PATHS = [
  '/admin/intake/matching',
  '/admin/intake/waiting',
  '/admin/intake/pdfs',
  '/admin/intake/quality',
  '/admin/intake/validators',
  '/admin/matching',
  '/admin/integrations',
] as const

/**
 * Where an old Intake address lands (D117): Matching (and `/admin/matching`, `/admin/integrations`) on Arrivals
 * with the `selectRowId` row's arrival selected (`itemKey`, found by the caller), Waiting for NHI on the Needs NHI
 * filter, PDF lists on Rooms PDFs, Data quality and Validators on Arrivals.
 */
export function intakePathFromLegacy(pathname: string, itemKey?: string): string {
  const path = pathname.replace(/\/+$/, '')
  if (path.endsWith('/intake/waiting')) return arrivalsPath({ filter: { kind: 'needsNhi' }, ...(itemKey !== undefined ? { item: itemKey } : {}) })
  if (path.endsWith('/intake/pdfs')) return arrivalsPath({ filter: { kind: 'roomsPdfs' }, ...(itemKey !== undefined ? { item: itemKey } : {}) })
  return arrivalsPath(itemKey !== undefined ? { item: itemKey } : {})
}
