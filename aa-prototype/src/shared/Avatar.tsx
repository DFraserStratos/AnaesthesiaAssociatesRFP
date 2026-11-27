import type { CSSProperties } from 'react'
import { brand, elevation, neutral, radius } from '../theme/tokens'
import { initialsOf } from './format'

/**
 * A person's initials in a disc, always beside their printed name, so the disc
 * is `aria-hidden` (UI unification U3, README group U25: the one avatar).
 *
 * - `elevated` (the default): the persona identity avatar on mobile (Phase 13
 *   "elevated white", the user's pick): a white chip with crimson initials and
 *   the list cards' `elevation.e1` shadow, no ring. It reads on the crimson
 *   mobile atmosphere and on white cards alike. Crimson stays identity only.
 * - `tint`: the crimson tint of web and Admin (the Web Dashboard "MS", the Web
 *   Availability colleagues, the Admin Day and Review "KW").
 * - `solid`: crimson with white initials, the record's own disc at the head
 *   of an Admin People page (docs/explorations/profile-ideas.html `.av`, 54px
 *   with 19px initials).
 * - `neutral`: a colleague in the move sheets, with no tint that could read as
 *   a mark; `muted` for one who cannot be picked (a dashed ring, mist text).
 *
 * The initials come from `initialsOf(name)` (titles such as "Dr" and "Ms"
 * dropped), or from `initials` as given. The font follows the mockups' steps:
 * 28 to 30 gives 11, 34 gives 12, 36 gives 13, 44 gives 15, 54 gives 19, weight 700.
 */

export type AvatarVariant = 'elevated' | 'tint' | 'solid' | 'neutral'

export function avatarFontSize(size: number): number {
  if (size <= 30) return 11
  if (size <= 34) return 12
  if (size <= 36) return 13
  if (size <= 40) return 14
  if (size < 54) return 15
  return 19
}

function look(variant: AvatarVariant, muted: boolean): CSSProperties {
  if (variant === 'tint') return { background: brand.tint, color: brand.base }
  if (variant === 'solid') return { background: brand.base, color: neutral.surface, letterSpacing: '0.01em' }
  if (variant === 'neutral') {
    return muted
      ? { background: neutral.surface, border: `1px dashed ${neutral.lineStrong}`, color: neutral.mist }
      : { background: neutral.sunken, color: neutral.ink }
  }
  return { background: neutral.surface, color: brand.base, boxShadow: elevation.e1 }
}

type AvatarProps = {
  /** Diameter in px (default 44). */
  size?: number
  variant?: AvatarVariant
  /** Neutral only: a colleague who cannot be picked. */
  muted?: boolean
  /** Placement only (margins, flex). */
  style?: CSSProperties
} & ({ name: string; initials?: undefined } | { initials: string; name?: undefined })

export function Avatar({ name, initials, size = 44, variant = 'elevated', muted = false, style }: AvatarProps) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        ...look(variant, muted),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: avatarFontSize(size),
        fontWeight: 700,
        flex: 'none',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {name !== undefined ? initialsOf(name) : initials}
    </span>
  )
}
