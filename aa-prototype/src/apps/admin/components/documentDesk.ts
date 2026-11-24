import type { CSSProperties } from 'react'
import { neutral, radius } from '../../../theme/tokens'
import { ADMIN_DOCUMENT_WIDTH, adminRailWidth } from '../layout'

const DOCUMENT_GAP = 24

/**
 * The desk of an Admin `document` page (docs/admin-layout-audit.md, Q3): the paper at
 * `ADMIN_DOCUMENT_WIDTH` and its rail beside it at the rail width, both from the page's left edge, the
 * space to the right left empty. Where the window is too narrow for both (a 1280 laptop), the rail gives
 * way first, down to `ADMIN_RIGHT_RAIL_MIN_WIDTH`, then the paper; neither scrolls sideways. The invoice,
 * the credit note and the remittance advice share it.
 */
export const DOCUMENT_DESK_STYLE: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: DOCUMENT_GAP, width: '100%', minWidth: 0 }
/** The paper on the desk: white, ruled, its print width. */
export const DOCUMENT_PAPER_STYLE: CSSProperties = { flex: `0 1 ${ADMIN_DOCUMENT_WIDTH}px`, minWidth: 0, background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.panel, padding: '36px 40px' }
/** The rail on the desk: sticky beside the paper as it scrolls. */
export const DOCUMENT_RAIL_STYLE: CSSProperties = {
  position: 'sticky',
  top: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  flex: 'none',
  width: adminRailWidth(ADMIN_DOCUMENT_WIDTH + DOCUMENT_GAP),
}
