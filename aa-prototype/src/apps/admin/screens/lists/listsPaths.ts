/**
 * The Lists section's URLs (US-13.1.3): its four tabs and a List's review page under To authorise.
 * The one home every in-app link builds them from. The old Draft Lists, Conflicts and Review queue
 * addresses map here through `listsPathFromLegacy` and redirect with replace (`routes.tsx`'s
 * `ListsLegacyRedirect`), keeping their query; the Review queue's Events tab now lives in
 * Finances › Payments.
 *
 * Fixed query shapes the tabs read: Draft Lists `?open=<listId>` (opens that Draft List's drawer on
 * arrival, read by the Admin layout), `?assigned=<listId>` (the outcome line after an assignment) and
 * `?view=history` (the assigned and removed Draft Lists); Conflicts `?when=`, `?hospital=`,
 * `?anaesthetist=`, `?cleared=1`.
 */

import { financePath } from '../finances/financePaths'

export type ListsTab = 'draft-lists' | 'conflicts' | 'contracts-to-set' | 'to-authorise'

export const LISTS_BASE = '/admin/lists'

export const LISTS_TAB_IDS: readonly ListsTab[] = ['draft-lists', 'conflicts', 'contracts-to-set', 'to-authorise']

export function isListsTab(value: string): value is ListsTab {
  return (LISTS_TAB_IDS as readonly string[]).includes(value)
}

function withQuery(path: string, query: Readonly<Record<string, string>> | URLSearchParams | string = {}): string {
  const search =
    typeof query === 'string'
      ? query.replace(/^\?/, '')
      : (query instanceof URLSearchParams ? query : new URLSearchParams(query as Record<string, string>)).toString()
  return `${path}${search === '' ? '' : `?${search}`}`
}

/** A Lists tab, with any list state as its query. */
export function listsPath(tab: ListsTab, query: Readonly<Record<string, string>> | URLSearchParams = {}): string {
  return withQuery(`${LISTS_BASE}/${tab}`, query)
}

/** A submitted List's review page, under To authorise. */
export function reviewPath(listId: string): string {
  return `${LISTS_BASE}/to-authorise/${encodeURIComponent(listId)}`
}

/** Router state a To authorise row passes to a List's review page: the tab's filters (`?q=`, `?date=`, `?look=`, `?page=`) to go back to. */
export interface ToAuthoriseReturnState {
  from: 'to-authorise'
  search: string
}

/** The To authorise filters a review page goes back to, from its router state; null when it was not opened from the tab. */
export function toAuthoriseReturn(state: unknown): ToAuthoriseReturnState | null {
  if (typeof state !== 'object' || state === null) return null
  const s = state as Partial<ToAuthoriseReturnState>
  return s.from === 'to-authorise' ? { from: 'to-authorise', search: typeof s.search === 'string' ? s.search : '' } : null
}

/** Draft Lists with one Draft List's drawer open on arrival. */
export function draftListOpenPath(listId: string): string {
  return listsPath('draft-lists', { open: listId })
}

/**
 * Where an old Lists address lives now, its query kept: `/admin/draft-lists` (its `?tab=history`
 * read as `?view=history`; `?open=` and `?assigned=` kept), `/admin/conflicts`, `/admin/review`
 * (`?tab=lists` dropped), `/admin/review?tab=events` (Finances › Payments) and `/admin/review/:listId`.
 * A shape it does not know lands on Draft Lists.
 */
export function listsPathFromLegacy(pathname: string, search = ''): string {
  const [head, a] = pathname
    .replace(/^\/admin\/?/, '')
    .split('/')
    .filter((p) => p !== '')
  const params = new URLSearchParams(search.replace(/^\?/, ''))
  switch (head) {
    case 'draft-lists': {
      if (params.get('tab') === 'history') params.set('view', 'history')
      params.delete('tab')
      return listsPath('draft-lists', params)
    }
    case 'conflicts':
      return listsPath('conflicts', params)
    case 'review': {
      const tab = params.get('tab')
      params.delete('tab')
      if (a !== undefined) return withQuery(reviewPath(decodeURIComponent(a)), params)
      if (tab === 'events') return financePath('payments')
      return listsPath('to-authorise', params)
    }
    default:
      return listsPath('draft-lists', params)
  }
}
