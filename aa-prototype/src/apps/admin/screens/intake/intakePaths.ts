/**
 * Intake's URLs (build plan Phase 68; D117): Arrivals at `/admin/intake` and Sources at `/admin/intake/sources`. The
 * one home every in-app Intake link builds them from. Arrivals keeps its filter (`?filter=`), search (`?q=`) and the
 * selected item (`?item=`, an arrival key from `domain/intake/arrivals.ts`) in the URL. The old Intake addresses map
 * here through `intakePathFromLegacy` and redirect with replace (`routes.tsx`'s `IntakeLegacyRedirect`).
 */

import { ARRIVAL_KINDS, type ArrivalKind, type FeedFilter } from '../../../../domain/intake/arrivals'
import { DEFAULT_INBOX_QUERY, INBOX_SORT_LABELS, INBOX_SURGERY_LABELS, type InboxQuery, type InboxShow, type InboxSortKey, type InboxSurgery } from '../../../../domain/intake/inbox'

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

/**
 * Arrivals in the old terms (a feed filter, a search, a selected item), as the new addresses: the item opened on its
 * own page, else the inbox with the filter's query. Kept so links built before the rebuild land in the right place.
 */
export function arrivalsPath(options: ArrivalsPathOptions = {}): string {
  const query = inboxQueryFromFeedFilter(options.filter ?? { kind: 'toDecide' }, options.q ?? '')
  return options.item !== undefined && options.item !== '' ? arrivalPath(options.item, query) : inboxPath(query)
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

// ---------------------------------------------------------------------------
// The inbox and the opened arrival (27 Nov 2026 rebuild)
// ---------------------------------------------------------------------------

const SHOW_PARAMS: Record<InboxShow, string | undefined> = { toDecide: undefined, needsNhi: 'needs-nhi', decided: 'decided' }

/** The inbox query as URL params; the default for each part is left out. */
export function inboxSearch(query: InboxQuery): string {
  const p = new URLSearchParams()
  const show = SHOW_PARAMS[query.show]
  if (show !== undefined) p.set('show', show)
  if (query.kind !== 'all') p.set('kind', query.kind)
  if (query.source !== 'all') p.set('source', query.source)
  if (query.surgery !== 'any') p.set('surgery', query.surgery)
  if (query.look) p.set('look', '1')
  const d = DEFAULT_INBOX_QUERY.sort
  if (query.sort.key !== d.key || query.sort.dir !== d.dir) p.set('sort', `${query.sort.key}-${query.sort.dir}`)
  if (query.q.trim() !== '') p.set('q', query.q.trim())
  const out = p.toString()
  return out === '' ? '' : `?${out}`
}

/** URL params as the inbox query; anything unknown falls back to its default. */
export function inboxQueryFromParams(params: URLSearchParams): InboxQuery {
  const showParam = params.get('show')
  const show = (Object.keys(SHOW_PARAMS) as InboxShow[]).find((k) => SHOW_PARAMS[k] !== undefined && SHOW_PARAMS[k] === showParam) ?? 'toDecide'
  const kindParam = params.get('kind')
  const kind: ArrivalKind | 'all' = kindParam !== null && (ARRIVAL_KINDS as readonly string[]).includes(kindParam) ? (kindParam as ArrivalKind) : 'all'
  const surgeryParam = params.get('surgery')
  const surgery: InboxSurgery = surgeryParam !== null && Object.hasOwn(INBOX_SURGERY_LABELS, surgeryParam) ? (surgeryParam as InboxSurgery) : 'any'
  const [sortKey, sortDir] = (params.get('sort') ?? '').split('-')
  const sort =
    sortKey !== undefined && Object.hasOwn(INBOX_SORT_LABELS, sortKey) && (sortDir === 'asc' || sortDir === 'desc')
      ? { key: sortKey as InboxSortKey, dir: sortDir as 'asc' | 'desc' }
      : DEFAULT_INBOX_QUERY.sort
  return {
    show,
    kind,
    source: params.get('source') ?? 'all',
    surgery,
    look: params.get('look') === '1',
    sort,
    q: params.get('q') ?? '',
  }
}

/** The inbox, with its query. */
export function inboxPath(query: InboxQuery = DEFAULT_INBOX_QUERY): string {
  return `${INTAKE_BASE}${inboxSearch(query)}`
}

/** One arrival opened on its own page; the inbox's query rides along so Back, Previous and Next keep its order. */
export function arrivalPath(key: string, query: InboxQuery = DEFAULT_INBOX_QUERY): string {
  return `${INTAKE_BASE}/arrival/${encodeURIComponent(key)}${inboxSearch(query)}`
}

/** An old feed filter (`?filter=`) as the inbox query it now means. */
export function inboxQueryFromFeedFilter(filter: FeedFilter, q = ''): InboxQuery {
  switch (filter.kind) {
    case 'toDecide':
      return { ...DEFAULT_INBOX_QUERY, q }
    case 'needsNhi':
      return { ...DEFAULT_INBOX_QUERY, show: 'needsNhi', q }
    case 'decided':
      return { ...DEFAULT_INBOX_QUERY, show: 'decided', q }
    case 'roomsPdfs':
      return { ...DEFAULT_INBOX_QUERY, source: 'rooms', q }
    case 'hospital':
      return { ...DEFAULT_INBOX_QUERY, source: filter.hospitalId, q }
  }
}

/**
 * Where an old Arrivals address lands: `?item=` opens that arrival, `?filter=` becomes the inbox query; undefined
 * when the address is already an inbox address.
 */
export function inboxRedirectFromLegacyParams(params: URLSearchParams): string | undefined {
  const item = params.get('item')
  const filterParam = params.get('filter')
  if (item === null && filterParam === null) return undefined
  const query = inboxQueryFromFeedFilter(feedFilterFromParam(filterParam), params.get('q') ?? '')
  return item !== null && item !== '' ? arrivalPath(item, query) : inboxPath(query)
}
