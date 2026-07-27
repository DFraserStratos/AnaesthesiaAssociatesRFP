/** Horizontal inset around the routed admin content. */
export const ADMIN_PAGE_HORIZONTAL_PADDING = 28

/** Width of the viewport-aligned List detail drawer. */
export const ADMIN_LIST_DRAWER_WIDTH = 440

/**
 * The day-view rail ends at the content inset while the drawer ends at the
 * viewport edge. Subtracting that inset aligns their left edges.
 */
export const ADMIN_RIGHT_RAIL_WIDTH = ADMIN_LIST_DRAWER_WIDTH - ADMIN_PAGE_HORIZONTAL_PADDING
