import type { CSSProperties, ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { neutral, radius } from '../../theme/tokens'
import { Avatar } from '../Avatar'
import { dataAttributesOf, type DataAttributes } from './Field'

interface ColleagueRowProps extends DataAttributes {
  /** The anaesthetist's move sheets: initials, the name at 15/600, a slate line, the chevron; sunken rules between rows. */
  look: 'colleague'
  name: string
  /** Under the name: why or how (12.5 slate), or a phone number with `lineMono` (mono 12). */
  line?: ReactNode
  lineMono?: boolean
  /** The first row of its list draws no rule above it. */
  first?: boolean
  /** Each sheet's own row height (Move a List 56, Move a Booking 60: no question settles one). */
  minHeight: number
  /** Picks this colleague. Absent: the same row in neutral, not a button, its line saying why. */
  onPick?: () => void
  shot?: string
}

interface BlockedRowProps extends DataAttributes {
  /** The office's candidate pickers: a colleague who cannot take the List, in a dashed `lineStrong` box on `neutral.bg`. */
  look: 'blocked'
  name: string
  line: ReactNode
  /** Which of the two lines steps back to mist (default the line; "Already has a List" quiets the name). */
  quiet?: 'name' | 'line'
  /** Chips and actions at the end of the row. */
  children?: ReactNode
  /** Let the end of the row wrap under the words (the closed colleague, with its stand-in trigger). */
  wrap?: boolean
  /** A labelled group (the closed colleague is read as one thing, never a button). */
  groupLabel?: string
  shot?: string
}

export type PickRowProps = ColleagueRowProps | BlockedRowProps

/**
 * A colleague in a pick list (UI unification U7, U35; J N5b), in its two looks: the anaesthetist's
 * `colleague` row (Move a List and Move a Booking to a colleague), one button named by the colleague, and the
 * office's `blocked` row (a colleague whose session is not available, or who already holds a List), never a
 * button. `data-*` hooks land on the row.
 */
export function PickRow(props: PickRowProps) {
  return props.look === 'colleague' ? <ColleagueRow {...props} /> : <BlockedRow {...props} />
}

function ColleagueRow({ name, line, lineMono = false, first = false, minHeight, onPick, shot, look: _look, ...rest }: ColleagueRowProps) {
  const base: CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    minHeight,
    border: 'none',
    borderTop: first ? 'none' : `1px solid ${neutral.sunken}`,
    fontFamily: 'inherit',
    textAlign: 'left',
  }
  const offered = onPick !== undefined
  const words = (
    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: offered ? neutral.ink : neutral.slate }}>{name}</span>
      {line !== undefined &&
        (lineMono ? (
          <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{line}</span>
        ) : (
          <span style={{ fontSize: 12.5, lineHeight: '17px', color: neutral.slate }}>{line}</span>
        ))}
    </span>
  )
  if (!offered) {
    return (
      <div data-shot={shot} {...dataAttributesOf(rest)} aria-disabled="true" style={{ ...base, background: neutral.bg }}>
        <Avatar name={name} size={36} variant="neutral" muted />
        {words}
      </div>
    )
  }
  return (
    <button type="button" className="aa-ctl" data-shot={shot} {...dataAttributesOf(rest)} onClick={onPick} style={{ ...base, background: neutral.surface, cursor: 'pointer' }}>
      <Avatar name={name} size={36} variant="neutral" />
      {words}
      <ChevronRight size={16} strokeWidth={2.2} color={neutral.mist} aria-hidden />
    </button>
  )
}

function BlockedRow({ name, line, quiet = 'line', children, wrap = false, groupLabel, shot, look: _look, ...rest }: BlockedRowProps) {
  return (
    <div
      {...(groupLabel !== undefined ? { role: 'group', 'aria-label': groupLabel } : {})}
      data-shot={shot}
      {...dataAttributesOf(rest)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        borderRadius: radius.card,
        border: `1px dashed ${neutral.lineStrong}`,
        background: neutral.bg,
        ...(wrap ? { flexWrap: 'wrap' as const } : {}),
      }}
    >
      <span style={{ flex: 1, minWidth: wrap ? 140 : 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: quiet === 'name' ? neutral.mist : neutral.slate }}>{name}</span>
        <span style={{ fontSize: 12, color: quiet === 'name' ? neutral.slate : neutral.mist }}>{line}</span>
      </span>
      {children}
    </div>
  )
}
