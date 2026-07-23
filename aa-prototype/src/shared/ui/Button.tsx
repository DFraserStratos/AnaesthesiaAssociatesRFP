import type { CSSProperties, ReactNode } from 'react'
import { accent, neutral, radius } from '../../theme/tokens'

type Variant = 'primary' | 'secondary' | 'pill'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: Variant
  disabled?: boolean
  /** Full-width block (primary CTAs). */
  block?: boolean
  style?: CSSProperties
  type?: 'button' | 'submit'
}

/**
 * The shared button set (convention 16; >=44px targets, N1). Teal is the only
 * action colour (`accent.base`); secondary is the design's outlined control;
 * pill is the compact tinted action used on rows and chips. Moved to
 * `src/shared/ui` in Phase 05 (was "deliberately mobile-local" — the kickoff
 * overrides that so the web app reuses the identical control); mobile re-exports
 * it as `MobileButton`.
 */
export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  block = false,
  style,
  type = 'button',
}: ButtonProps) {
  const base: CSSProperties = {
    fontFamily: 'inherit',
    fontWeight: 600,
    cursor: disabled ? 'default' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    border: 'none',
    transition: 'background 150ms, opacity 150ms',
    ...(block ? { width: '100%' } : {}),
  }

  let variantStyle: CSSProperties
  if (variant === 'primary') {
    variantStyle = {
      minHeight: 54,
      padding: '0 20px',
      borderRadius: radius.card,
      background: disabled ? neutral.line : accent.base,
      color: disabled ? neutral.mist : neutral.surface,
      fontSize: 17,
      fontWeight: 700,
    }
  } else if (variant === 'secondary') {
    variantStyle = {
      minHeight: 48,
      padding: '0 18px',
      borderRadius: radius.ctl,
      background: neutral.surface,
      color: disabled ? neutral.mist : neutral.ink,
      border: `1px solid ${neutral.line}`,
      fontSize: 15,
    }
  } else {
    variantStyle = {
      minHeight: 44,
      padding: '0 16px',
      borderRadius: radius.pill,
      background: disabled ? neutral.sunken : accent.tint,
      color: disabled ? neutral.mist : accent.pressed,
      fontSize: 13,
    }
  }

  return (
    <button type={type} onClick={disabled ? undefined : onClick} disabled={disabled} style={{ ...base, ...variantStyle, ...style }}>
      {children}
    </button>
  )
}
