import type { ReactNode } from 'react'
import { accent, fontFamily, neutral, radius, type as typeScale } from '../../theme/tokens'
import { dataAttributesOf, type DataAttributes } from './Field'

export interface OptionRowProps extends DataAttributes {
  /** The row's main words, left. */
  children: ReactNode
  /** Quiet facts at the right end (mono slate: a session, a time, an owner). */
  trailing?: ReactNode
  /** The pick already made: the teal accent edge and tint, and `aria-pressed` (`aria-current` on `nav`). */
  selected?: boolean
  onClick: () => void
  /**
   * `pick` (default): today's bordered result row. `nav` (build plan Phase 47): a borderless index
   * item, as `docs/explorations/contracts-section.html` #catalogue's `.gidx` and Master data's view
   * list draw it: slate words, teal on the accent tint when picked (`aria-current`), the trailing
   * count in mono, a long label clipped with its full text in the title.
   */
  variant?: 'pick' | 'nav'
  /** The full label as a tooltip (`nav`, where the label clips). */
  title?: string
  /** `data-shot` on the button. */
  shot?: string
}

/**
 * One result in a short pick list under a search box (catch-up Phase 33's review: Matching's "Match
 * to another Booking"): a full-width bordered button, its words left and quiet facts right, 13px. The
 * current pick reads in the teal accent (`accent.base` border, `accent.tint` fill), as the Contract
 * rail's list rows do. Not a table row: a table row that opens a record is `ClickableRow`. Lay the
 * rows out in a `role="list"` of `role="listitem"`s. `data-*` and `shot` land on the button.
 * `variant="nav"` is the item of an index pane (`GroupIndex`).
 */
export function OptionRow({ children, trailing, selected = false, onClick, variant = 'pick', title, shot, ...rest }: OptionRowProps) {
  const nav = variant === 'nav'
  return (
    <button
      type="button"
      className="aa-ctl"
      data-shot={shot}
      {...(nav ? { 'aria-current': selected ? 'true' : undefined } : { 'aria-pressed': selected })}
      title={title}
      {...dataAttributesOf(rest)}
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: nav ? 'center' : 'baseline',
        gap: 8,
        padding: nav ? '7px 10px' : '8px 10px',
        border: nav ? 'none' : `1px solid ${selected ? accent.base : neutral.line}`,
        borderRadius: nav ? radius.sm : radius.ctl,
        background: selected ? accent.tint : nav ? 'transparent' : neutral.surface,
        color: nav ? (selected ? accent.pressed : neutral.slate) : neutral.ink,
        fontFamily: 'inherit',
        fontSize: 13,
        ...(nav ? { fontWeight: selected ? 700 : 500, flex: 'none' } : {}),
        cursor: 'pointer',
      }}
    >
      <span style={{ minWidth: 0, ...(nav ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : {}) }}>{children}</span>
      {trailing !== undefined && (
        <span
          className="mono"
          style={
            nav
              ? { flex: 'none', fontFamily: fontFamily.mono, fontVariantNumeric: 'tabular-nums', fontSize: typeScale.captionSm.size, fontWeight: 600, color: selected ? accent.pressed : neutral.mist }
              : { flex: 'none', color: neutral.slate, fontSize: 12 }
          }
        >
          {trailing}
        </span>
      )}
    </button>
  )
}
