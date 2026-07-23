import type { CSSProperties } from 'react'
import { neutral } from '../../theme/tokens'

/**
 * Shared table cell styles for the admin data screens (review, master data,
 * audit) — one definition instead of three near-identical copies. `compact` is
 * the tighter 8px/12.5 variant used by the dense audit + master tables; the
 * default is the roomier 10px/13 review table.
 */
export function cellStyle(compact = false): CSSProperties {
  return {
    padding: compact ? '8px 10px' : '10px 10px',
    fontSize: compact ? 12.5 : 13,
    borderBottom: `1px solid ${neutral.line}`,
    textAlign: 'left',
    verticalAlign: 'top',
  }
}

export function headCellStyle(compact = false): CSSProperties {
  return {
    ...cellStyle(compact),
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: neutral.mist,
    borderBottom: `1px solid ${neutral.lineStrong}`,
    background: neutral.bg,
  }
}
