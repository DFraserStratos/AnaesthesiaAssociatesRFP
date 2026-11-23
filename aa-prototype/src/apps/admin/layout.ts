import { SIDE_PANEL_WIDTH } from '../../shared/surface/SidePanel'

/** Horizontal inset around the routed admin content. */
export const ADMIN_PAGE_HORIZONTAL_PADDING = 28

/** Width of the viewport-aligned List detail drawer: the shared side panel's `list` width. */
export const ADMIN_LIST_DRAWER_WIDTH = SIDE_PANEL_WIDTH.list

/**
 * The day-view rail ends at the content inset while the drawer ends at the
 * viewport edge. Subtracting that inset aligns their left edges.
 */
export const ADMIN_RIGHT_RAIL_WIDTH = ADMIN_LIST_DRAWER_WIDTH - ADMIN_PAGE_HORIZONTAL_PADDING
