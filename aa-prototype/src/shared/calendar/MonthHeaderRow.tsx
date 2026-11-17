import type { CSSProperties, ReactNode } from 'react'
import { neutral } from '../../theme/tokens'
import { IconButton } from '../ui/IconButton'
import { WEEKDAY_INITIALS, WEEKDAY_SHORT_NAMES } from '../availability/monthCells'

/**
 * The Monday-first weekday header over a month (UI unification U4, group
 * U33): hidden from screen readers (each day's button already says its
 * weekday), so seven stray letters are never read out. `initial` (M T W ...)
 * or `short` (Mon Tue ...). The default is the phone calendars' header
 * (10.5/600 mist initials, 4px gaps); a calendar with its own size passes
 * `style` (the grid) and `cellStyle` (each name).
 */
const PHONE_ROW: CSSProperties = { gap: 4, marginBottom: 6 }
const PHONE_CELL: CSSProperties = { textAlign: 'center', fontSize: 10.5, fontWeight: 600, color: neutral.mist }

export function MonthHeaderRow({ variant = 'initial', style = PHONE_ROW, cellStyle = PHONE_CELL }: { variant?: 'initial' | 'short'; style?: CSSProperties; cellStyle?: CSSProperties }) {
  const names = variant === 'short' ? WEEKDAY_SHORT_NAMES : WEEKDAY_INITIALS
  return (
    <div aria-hidden style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', ...style }}>
      {names.map((d, i) => (
        <span key={i} style={cellStyle}>
          {d}
        </span>
      ))}
    </div>
  )
}

/** The 44px round month step button (MonthGrid's, Phase 38a), shared by the phone's calendars; the shared `IconButton` since U5. */
export function MonthStepButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <IconButton label={label} disabled={disabled} onClick={onClick} size={44} shape="round" tone="action">
      {children}
    </IconButton>
  )
}
