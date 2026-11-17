import type { CSSProperties } from 'react'
import { accent } from '../../theme/tokens'
import { densityCellStyle, densityHeadCellStyle } from '../../shared/table'

/**
 * The admin cell styles, now a thin re-export of the shared table kit (`src/shared/table/`, UI
 * unification U6) for the screens that still type their own cells (Billing monitor, Integrations,
 * the pairing and edit sheets) and Phase 43's `Pager`. `compact` is the kit's `dense` density (8px
 * 10px at 12.5, the audit and master tables); the default is its `compact` density (10px 10px at 13).
 * The header is the Admin Review mockup's (question 19).
 */
export function cellStyle(compact = false): CSSProperties {
  return densityCellStyle(compact ? 'dense' : 'compact')
}

export function headCellStyle(compact = false): CSSProperties {
  return densityHeadCellStyle(compact ? 'dense' : 'compact')
}

export { isInteractiveRowTarget } from '../../shared/table'

/** A teal text action inside a table, card or sheet ("Edit", "End", "Open record"). */
export const textActionStyle: CSSProperties = {
  border: 'none',
  background: 'none',
  color: accent.base,
  fontFamily: 'inherit',
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'none',
}
