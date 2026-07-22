import type { CSSProperties } from 'react'
import logoUrl from '../assets/aa-logo.png'

/** Intrinsic size of the logo asset (docs/assets/Anasthesia-logo-Short.png). */
const LOGO_W = 300
const LOGO_H = 43

interface LogoProps {
  /** Rendered height in px; width scales to preserve the aspect ratio. */
  height?: number
  style?: CSSProperties
  className?: string
}

/**
 * The AA wordmark — the actual logo asset, used everywhere a masthead/wordmark
 * appears (identity use of the brand). The logo is crimson on transparent, so
 * it sits on light surfaces; dark surfaces give it a light plaque.
 */
export function Logo({ height = 32, style, className }: LogoProps) {
  return (
    <img
      src={logoUrl}
      alt="Anaesthesia Associates"
      width={Math.round((LOGO_W / LOGO_H) * height)}
      height={height}
      style={{ display: 'block', height, width: 'auto', ...style }}
      className={className}
    />
  )
}
