import type { CSSProperties, ReactNode, RefObject } from 'react'
import { X } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'
import { dataAttributesOf, type DataAttributes } from './Field'

export type IconButtonSize = 32 | 36 | 38 | 44
export type IconButtonShape = 'square' | 'round'
export type IconButtonTone = 'neutral' | 'action'

interface IconButtonProps extends DataAttributes {
  /** The accessible name: required, because an icon or a glyph alone names nothing (bug 5). */
  label: string
  onClick: () => void
  disabled?: boolean
  /** The mockups' step sizes (question 10): 32 the Web Dashboard week strip, 36 Admin Day,
   *  38 Web Availability, 44 the phone (round month buttons, square capture steppers). */
  size?: IconButtonSize
  shape?: IconButtonShape
  /** `neutral` a slate glyph (desktop steppers); `action` the pressed teal (the phone's month buttons). */
  tone?: IconButtonTone
  bordered?: boolean
  shot?: string
  title?: string
  style?: CSSProperties
  /**
   * Where focus goes after the click, as on `CloseButton`: a remove button leaves the page with the
   * row it removed, so it hands focus on (the next row's remove, or the add button). A function is
   * read at click time, before the row goes, for a target that depends on what is left.
   */
  returnFocusTo?: FocusTarget
  children: ReactNode
}

/** A focus target: a ref, or a function read at click time. */
export type FocusTarget = RefObject<HTMLElement | null> | (() => HTMLElement | null | undefined)

/** Run a click, then focus its target: a function target is read before the click, a ref after it. */
function clickThenFocus(onClick: () => void, target: FocusTarget | undefined): void {
  const before = typeof target === 'function' ? target() : undefined
  onClick()
  const el = typeof target === 'function' ? before : target?.current
  el?.focus()
}

/** Square radius and glyph size per step size, from each mockup (radius 9 at 32 is drift: 10). */
const SQUARE: Record<IconButtonSize, { radius: number; fontSize: number }> = {
  32: { radius: radius.ctl, fontSize: 14 },
  36: { radius: radius.ctl, fontSize: 15 },
  38: { radius: radius.ctl, fontSize: 16 },
  44: { radius: radius.md, fontSize: 20 },
}

/**
 * A button holding only an icon or a glyph (U20): the bordered steppers and month or day
 * navigation. White, a 1px line and a slate glyph on desktop; the phone's 44px round month button
 * in the action tone; disabled draws the glyph in `lineStrong`. UI unification U5.
 */
export function IconButton(props: IconButtonProps) {
  const { label, onClick, disabled = false, size = 36, shape = 'square', tone = 'neutral', bordered = true, shot, title, style, returnFocusTo, children } = props
  const sq = SQUARE[size]
  return (
    <button
      type="button"
      className={`aa-ctl${bordered ? ' aa-icon-btn' : ''}`}
      aria-label={label}
      title={title}
      {...dataAttributesOf(props)}
      data-shot={shot}
      disabled={disabled}
      onClick={
        disabled
          ? undefined
          : () => clickThenFocus(onClick, returnFocusTo)
      }
      style={{
        width: size,
        height: size,
        flex: 'none',
        padding: 0,
        borderRadius: shape === 'round' ? radius.pill : sq.radius,
        border: bordered ? `1px solid ${neutral.line}` : 'none',
        background: bordered ? neutral.surface : 'transparent',
        color: disabled ? neutral.lineStrong : tone === 'action' ? accent.pressed : neutral.slate,
        fontFamily: 'inherit',
        fontSize: sq.fontSize,
        fontWeight: size === 44 && shape === 'square' ? 600 : 400,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

interface CloseButtonProps {
  onClick: () => void
  /** Default "Close" (the drawers', panels' and dialogs' corner X). */
  label?: string
  /** The X's size: 20 in a corner (default), smaller inside a field or a chip. */
  iconSize?: number
  strokeWidth?: number
  /**
   * Where focus goes after the click (bug 9): a clear or remove button leaves the page with what it
   * cleared, so it hands focus to the search input, the chip input or the next chip.
   */
  returnFocusTo?: FocusTarget
  shot?: string
  style?: CSSProperties
}

/**
 * The borderless slate X (U20): the corner close of every drawer, panel and web dialog
 * (`CornerClose` until U5), and, with a `label` and `returnFocusTo`, the clear or remove button
 * of a search box or a chip.
 */
export function CloseButton({ onClick, label = 'Close', iconSize = 20, strokeWidth, returnFocusTo, shot, style }: CloseButtonProps) {
  return (
    <button
      type="button"
      className="aa-ctl"
      aria-label={label}
      data-shot={shot}
      onClick={() => clickThenFocus(onClick, returnFocusTo)}
      style={{ border: 'none', background: 'none', color: neutral.slate, cursor: 'pointer', padding: 4, borderRadius: radius.xs, ...style }}
    >
      <X size={iconSize} {...(strokeWidth !== undefined ? { strokeWidth } : {})} aria-hidden />
    </button>
  )
}
