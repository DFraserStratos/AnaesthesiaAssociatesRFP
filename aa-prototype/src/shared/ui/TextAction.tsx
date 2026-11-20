import { useId, type CSSProperties, type ReactNode, type Ref } from 'react'
import { Link } from 'react-router-dom'
import { accent, neutral } from '../../theme/tokens'
import { dataAttributesOf, type DataAttributes } from './Field'

export type TextActionSize = 'sm' | 'md' | 'lg'

interface TextActionProps extends DataAttributes {
  children: ReactNode
  /** Runs on click (a button). Omit when `to` is given. */
  onClick?: () => void
  /** A route: renders a real router link in the same look (middle-click opens a new tab; catch-up Phase 40). */
  to?: string
  /** Router state carried by a `to` link. */
  linkState?: unknown
  /** `sm` 12.5 in tables, `md` 14 in cards (default), `lg` 15 with a 44px target on the phone. */
  size?: TextActionSize
  /** No vertical padding: the action sits on the text line it shares (a table cell, a header row). */
  flush?: boolean
  /** Underlined inside a sentence ("Edited. Amend"). */
  inline?: boolean
  shot?: string
  disabled?: boolean
  /** Why it is disabled, printed beside it and tied by `aria-describedby` (U5). */
  disabledReason?: ReactNode
  /** An accessible name when the visible text alone is ambiguous ("Remove A1"). */
  label?: string
  title?: string
  ariaExpanded?: boolean
  style?: CSSProperties
  /** The button element, so a remove elsewhere can hand focus here (bug 9). */
  buttonRef?: Ref<HTMLButtonElement>
}

const SIZE: Record<TextActionSize, CSSProperties> = {
  sm: { fontSize: 12.5, padding: '4px 0' },
  md: { fontSize: 14, padding: '6px 0' },
  lg: { fontSize: 15, padding: '0 0', minHeight: 44, display: 'inline-flex', alignItems: 'center' },
}

/**
 * A borderless teal word that does one thing: Edit, Open, Clear, Show all, Remove (U13). Teal is
 * the only action colour (convention 17; question 8 left no red text action). UI unification U5
 * added the sizes, `flush`, `inline`, `disabledReason`, `data-*` and the focus ring (`aa-ctl`).
 */
export function TextAction({
  children,
  onClick,
  to,
  linkState,
  size = 'md',
  flush = false,
  inline = false,
  shot,
  disabled = false,
  disabledReason,
  label,
  title,
  ariaExpanded,
  style,
  buttonRef,
  ...rest
}: TextActionProps) {
  const reasonId = useId()
  const showReason = disabled && disabledReason !== undefined && disabledReason !== null && disabledReason !== false
  const look: CSSProperties = {
    border: 'none',
    background: 'none',
    borderRadius: 4,
    fontFamily: 'inherit',
    fontWeight: 600,
    color: disabled ? neutral.mist : accent.base,
    cursor: disabled ? 'default' : 'pointer',
    whiteSpace: 'nowrap',
    ...SIZE[size],
    ...(flush ? { padding: 0 } : {}),
    ...(inline ? { padding: 0, fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 } : {}),
    ...style,
  }
  if (to !== undefined && !disabled) {
    return (
      <Link to={to} state={linkState} className="aa-ctl" data-shot={shot} aria-label={label} title={title} onClick={onClick} style={{ textDecoration: 'none', ...look }} {...dataAttributesOf(rest)}>
        {children}
      </Link>
    )
  }
  const button = (
    <button
      ref={buttonRef}
      type="button"
      className="aa-ctl"
      data-shot={shot}
      aria-label={label}
      aria-expanded={ariaExpanded}
      aria-describedby={showReason ? reasonId : undefined}
      title={title}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={look}
      {...dataAttributesOf(rest)}
    >
      {children}
    </button>
  )
  if (!showReason) return button
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
      {button}
      <span id={reasonId} style={{ fontSize: 12, lineHeight: '17px', color: neutral.slate }}>
        {disabledReason}
      </span>
    </span>
  )
}
