/**
 * The board's camera rules for bringing a card into view, as pure functions over the card's box (flow
 * units), the viewport and the pane (screen pixels). The board centres a card when the open panel covers
 * it, an arrow-key step lands, a search hit opens or "Show on board" arrives (FINDINGS R-116, R-117).
 */
export interface Box {
  x: number
  y: number
  w: number
  h: number
}
export interface View {
  x: number
  y: number
  zoom: number
}
export interface Pane {
  w: number
  h: number
}

/** The floating toolbar's share of the top of the board: a card under it is not in view. */
export const TOOLBAR_H = 64
/** How much of a wide card (an epic) must be on screen to count as in view: its title. */
export const CARD_PEEK = 240
/** Where a card wider than the visible board puts its left edge, right of what covers the left. */
export const WIDE_INSET = 24

/** Is the top left of a card on screen, clear of the toolbar and of `dock` pixels on the left (the panel)? */
export function cardInView(card: Box, vp: View, pane: Pane, dock: number): boolean {
  const left = card.x * vp.zoom + vp.x
  const top = card.y * vp.zoom + vp.y
  return left >= dock && top >= TOOLBAR_H && left + Math.min(card.w, CARD_PEEK) * vp.zoom <= pane.w && top + card.h * vp.zoom <= pane.h
}

/**
 * The view that brings a card into the part of the board right of `clearLeft`, at `zoom`: centred when it
 * fits, else (a wide epic) with its left edge, and so its title, just right of `clearLeft`. Either way the
 * card then counts as in view (`cardInView` with `dock = clearLeft`), so no second pan follows.
 */
export function centreViewport(card: Box, pane: Pane, clearLeft: number, zoom: number): View {
  const room = pane.w - clearLeft
  const x = card.w * zoom > room ? clearLeft + WIDE_INSET - card.x * zoom : (pane.w + clearLeft) / 2 - (card.x + card.w / 2) * zoom
  return { x, y: pane.h / 2 - (card.y + card.h / 2) * zoom, zoom }
}
