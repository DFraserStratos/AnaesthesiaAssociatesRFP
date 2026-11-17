import { useId, type CSSProperties, type ReactNode, type Ref } from 'react'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import { motion } from '../../theme/motion'
import { dataAttributesOf, type DataAttributes } from './Field'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'pill' | 'danger'
export type ButtonSize = 'touch' | 'desktop' | 'compact'

interface ButtonProps extends DataAttributes {
  children: ReactNode
  onClick?: () => void
  /**
   * `primary` the filled teal command; `secondary` the neutral outlined one; `outline` the
   * teal-outlined secondary the mockups draw (Admin Day's Today, Admin Review's Log phone note);
   * `pill` the compact tinted action on rows and chips; `danger` the one red outline, kept for
   * "Cancel booking" only (README question 8).
   */
  variant?: ButtonVariant
  /**
   * `touch` (default, unchanged since Phase 05: primary 54, secondary 48, pill 44) is the phone's
   * and the sheets' size, so sheet footers keep their 54px primary (question 7). `desktop` (44,
   * radius 12, 14/600; the Admin Review mockup) and `compact` (36, radius 10, 13/600; Admin Day's
   * Today) are for desktop buttons that were hand-rolled before U5.
   */
  size?: ButtonSize
  disabled?: boolean
  /**
   * Why the button is disabled, printed beside it and tied to it by `aria-describedby` (the
   * SlotDrawer "Close out-of-hours session" pattern; UI unification U5). Shown only while
   * `disabled`.
   */
  disabledReason?: ReactNode
  /** Full-width block (primary CTAs). */
  block?: boolean
  style?: CSSProperties
  type?: 'button' | 'submit'
  title?: string
  /** An accessible name when the visible text alone is ambiguous. */
  ariaLabel?: string
  /** The button element, for initial focus (a confirm's safe button; UI unification U2). */
  buttonRef?: Ref<HTMLButtonElement>
  /** `data-shot` on the button. */
  shot?: string
}

const DESK_SIZE = {
  desktop: { height: 44, padding: '0 18px', radius: radius.md, fontSize: 14 },
  compact: { height: 36, padding: '0 14px', radius: radius.ctl, fontSize: 13 },
} as const

function sizeFor(variant: ButtonVariant, size: ButtonSize): CSSProperties {
  if (size === 'touch') {
    if (variant === 'primary') return { minHeight: 54, padding: '0 20px', borderRadius: radius.card, fontSize: 17, fontWeight: 700 }
    if (variant === 'pill') return { minHeight: 44, padding: '0 16px', borderRadius: radius.pill, fontSize: 13, fontWeight: 600 }
    return { minHeight: 48, padding: '0 18px', borderRadius: radius.ctl, fontSize: 15, fontWeight: 600 }
  }
  const s = DESK_SIZE[size]
  return { minHeight: s.height, padding: s.padding, borderRadius: variant === 'pill' ? radius.pill : s.radius, fontSize: s.fontSize, fontWeight: 600 }
}

function colourFor(variant: ButtonVariant, size: ButtonSize, disabled: boolean): CSSProperties {
  // The filled variants (primary, pill) draw no border, as before U5, so their width holds; the
  // outlined ones keep their 1px line. One disabled treatment for every variant (README U08): the
  // line fill and mist text.
  const filled = variant === 'primary' || variant === 'pill'
  if (disabled) return { background: neutral.line, color: neutral.mist, border: filled ? 'none' : `1px solid ${neutral.line}` }
  switch (variant) {
    case 'primary':
      return { background: accent.base, color: neutral.surface, border: 'none' }
    case 'outline':
      return { background: neutral.surface, color: accent.base, border: `1px solid ${accent.base}` }
    case 'pill':
      return { background: accent.tint, color: accent.pressed, border: 'none' }
    case 'danger':
      // The one red outline (question 8). Its border alpha lives here, its one home.
      return { background: neutral.surface, color: semantic.error.onTint, border: `1px solid ${semantic.error.solid}55` }
    case 'secondary':
    default:
      // The phone's secondary reads ink; the desktop sizes read slate, as the Admin Day mockup draws them.
      return { background: neutral.surface, color: size === 'touch' ? neutral.ink : neutral.slate, border: `1px solid ${neutral.line}` }
  }
}

/**
 * The shared button (convention 16; >=44px targets on the phone, N1). Teal is the only action
 * colour (`accent.base`). Moved to `src/shared/ui` in Phase 05 so the web app reuses the identical
 * control; mobile re-exports it as `MobileButton`. UI unification U5 added `outline`, `danger`,
 * the `desktop` and `compact` sizes, `disabledReason`, pass-through `data-*`, the teal focus ring
 * (`aa-ctl`) and the desktop hover (`aa-btn`, in `theme/global.css`; never inside the phone).
 * Press feedback stays in `global.css`'s mobile rules.
 */
export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'touch',
  disabled = false,
  disabledReason,
  block = false,
  style,
  type = 'button',
  title,
  ariaLabel,
  buttonRef,
  shot,
  ...rest
}: ButtonProps) {
  const reasonId = useId()
  const showReason = disabled && disabledReason !== undefined && disabledReason !== null && disabledReason !== false

  const css: CSSProperties = {
    fontFamily: 'inherit',
    cursor: disabled ? 'default' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: `background ${motion.uiFade.duration}ms, opacity ${motion.uiFade.duration}ms`,
    ...(block ? { width: '100%' } : {}),
    ...sizeFor(variant, size),
    ...colourFor(variant, size, disabled),
    ...style,
  }

  const button = (
    <button
      ref={buttonRef}
      type={type}
      className={`aa-ctl aa-btn aa-btn-${variant}`}
      data-shot={shot}
      title={title}
      aria-label={ariaLabel}
      aria-describedby={showReason ? reasonId : undefined}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={css}
      {...dataAttributesOf(rest)}
    >
      {children}
    </button>
  )

  if (!showReason) return button
  // The reason is the button's sibling, not a wrapper, so the button keeps its place and its
  // `style` in the caller's layout: in a wrapping row the reason takes a line of its own under the
  // row (`flexBasis: 100%`), in a column it sits under the button, in running text beside it.
  return (
    <>
      {button}
      <span id={reasonId} style={{ flexBasis: '100%', fontSize: 12, lineHeight: '17px', color: neutral.slate }}>
        {disabledReason}
      </span>
    </>
  )
}
