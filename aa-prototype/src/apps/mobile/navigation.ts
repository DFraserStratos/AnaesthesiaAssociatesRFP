import { matchPath } from 'react-router-dom'

/**
 * Where the mobile app is, derived from the URL. Kept in one pure module because
 * both the app shell (which hides the tab bar while the Lists stack is drilled
 * in) and the stack host itself need the same answer.
 */

export type MobileTab = 'lists' | 'availability' | 'balances' | 'more'

export const MOBILE_TAB_PATH: Record<MobileTab, string> = {
  lists: '/mobile/lists',
  availability: '/mobile/availability',
  balances: '/mobile/balances',
  more: '/mobile/more',
}

export function mobileTabForPath(pathname: string): MobileTab {
  if (pathname.startsWith('/mobile/availability')) return 'availability'
  if (pathname.startsWith('/mobile/balances')) return 'balances'
  if (pathname.startsWith('/mobile/more')) return 'more'
  return 'lists'
}

export interface ListsStackLocation {
  /** `SlideStack` depth: 0 = Forward Lists, 1 = List detail, 2 = Card detail. */
  depth: 0 | 1 | 2
  listId: string | null
  cardId: string | null
}

/**
 * The Lists-tab stack position encoded in the URL. The Lists tab is ONE route
 * hosting all three layers (not sibling routes) because `SlideStack` keeps every
 * layer mounted and animates by transform — sibling routes would unmount the
 * outgoing screen and kill the pop (Decisions log 2026-07-23, upheld).
 */
export function listsStackLocation(pathname: string): ListsStackLocation {
  const card = matchPath('/mobile/lists/:listId/cards/:cardId', pathname)
  if (card !== null) return { depth: 2, listId: card.params.listId ?? null, cardId: card.params.cardId ?? null }
  const list = matchPath('/mobile/lists/:listId', pathname)
  if (list !== null) return { depth: 1, listId: list.params.listId ?? null, cardId: null }
  return { depth: 0, listId: null, cardId: null }
}
