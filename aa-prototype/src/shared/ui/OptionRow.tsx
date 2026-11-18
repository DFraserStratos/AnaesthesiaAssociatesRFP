import type { ReactNode } from 'react'
import { accent, neutral, radius } from '../../theme/tokens'
import { dataAttributesOf, type DataAttributes } from './Field'

export interface OptionRowProps extends DataAttributes {
  /** The row's main words, left. */
  children: ReactNode
  /** Quiet facts at the right end (mono slate: a session, a time, an owner). */
  trailing?: ReactNode
  /** The pick already made: the teal accent edge and tint, and `aria-pressed`. */
  selected?: boolean
  onClick: () => void
  /** `data-shot` on the button. */
  shot?: string
}

/**
 * One result in a short pick list under a search box (catch-up Phase 33's review: Matching's "Match
 * to another Booking"): a full-width bordered button, its words left and quiet facts right, 13px. The
 * current pick reads in the teal accent (`accent.base` border, `accent.tint` fill), as the Contract
 * rail's list rows do. Not a table row: a table row that opens a record is `ClickableRow`. Lay the
 * rows out in a `role="list"` of `role="listitem"`s. `data-*` and `shot` land on the button.
 */
export function OptionRow({ children, trailing, selected = false, onClick, shot, ...rest }: OptionRowProps) {
  return (
    <button
      type="button"
      className="aa-ctl"
      data-shot={shot}
      aria-pressed={selected}
      {...dataAttributesOf(rest)}
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 8,
        padding: '8px 10px',
        border: `1px solid ${selected ? accent.base : neutral.line}`,
        borderRadius: radius.ctl,
        background: selected ? accent.tint : neutral.surface,
        color: neutral.ink,
        fontFamily: 'inherit',
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      <span style={{ minWidth: 0 }}>{children}</span>
      {trailing !== undefined && (
        <span className="mono" style={{ flex: 'none', color: neutral.slate, fontSize: 12 }}>
          {trailing}
        </span>
      )}
    </button>
  )
}
