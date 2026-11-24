import { SIDE_PANEL_WIDTH } from '../../shared/surface/SidePanel'

/**
 * The Admin page frame's measurements (docs/admin-layout-audit.md, "Layout decisions"). A screen
 * never sets its own page width: it picks an `AdminPage` mode (`fit`, `fluid` or `document`) and the
 * frame fills the content column. Only text, forms and documents keep a width of their own.
 */

/** Horizontal inset around the routed admin content. */
export const ADMIN_PAGE_HORIZONTAL_PADDING = 28

/** The shell's narrowest width: a 1080p laptop at 150% scaling. Below it the window scrolls sideways. */
export const ADMIN_MIN_WIDTH = 1280

/** Width of the viewport-aligned List detail drawer: the shared side panel's `list` width. */
export const ADMIN_LIST_DRAWER_WIDTH = SIDE_PANEL_WIDTH.list

/**
 * The one right-rail width, on every Admin page that has a rail (the Day view, list pages, records,
 * documents). The day-view rail ends at the content inset while the drawer ends at the viewport edge;
 * subtracting that inset aligns their left edges.
 */
export const ADMIN_RIGHT_RAIL_WIDTH = ADMIN_LIST_DRAWER_WIDTH - ADMIN_PAGE_HORIZONTAL_PADDING

/** A section's own left navigation inside a page (Master data's view list). */
export const ADMIN_SUBNAV_WIDTH = 200

/** A form or settings card inside a fluid page: narrow by choice, never by the page's width. */
export const ADMIN_FORM_WIDTH = 560

/** A printable document's paper (invoice, credit note, remittance advice): the width it prints at. */
export const ADMIN_DOCUMENT_WIDTH = 760

/** The least height a `fit` page's rows area keeps on a short window. */
export const ADMIN_FIT_MIN_BODY_HEIGHT = 360

/** Reading width for prose (intros, captions, explanations): under 80 characters a line. */
export const ADMIN_PROSE_WIDTH = '75ch'
