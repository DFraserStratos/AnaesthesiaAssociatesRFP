import type { CSSProperties } from 'react'
import { brand, elevation, neutral } from '../theme/tokens'

interface AvatarProps {
  /** Initials, e.g. "MS". */
  initials: string
  /** Diameter in px (default 44). */
  size?: number
  style?: CSSProperties
}

/**
 * The persona identity avatar (Phase 13 "elevated white" treatment, the user's
 * pick): a white chip with crimson initials and a soft drop shadow, no ring. It
 * reads clearly on the brand-crimson mobile atmosphere AND on white cards,
 * lifting off either by elevation rather than colour. Crimson stays identity
 * only (the initials), never a fill or action colour. The shadow is the same
 * `elevation.e1` the list cards use, so the chip sits at the cards' altitude.
 */
export function Avatar({ initials, size = 44, style }: AvatarProps) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: neutral.surface,
        color: brand.base,
        boxShadow: elevation.e1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.34),
        fontWeight: 700,
        flex: 'none',
        ...style,
      }}
    >
      {initials}
    </span>
  )
}
