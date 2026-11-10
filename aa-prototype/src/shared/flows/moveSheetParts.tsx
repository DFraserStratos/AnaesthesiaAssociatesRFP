import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'
import { initialsOf } from '../format'

/**
 * Parts the two move sheets share (Phase 32's `MoveListSheet`, Phase 32a's
 * `MoveBookingToColleagueSheet`), so their anatomy cannot drift.
 */

/** A teal text link back one step. */
export function BackLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 2, border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
      <ChevronLeft size={15} strokeWidth={2.4} aria-hidden /> {children}
    </button>
  )
}

/** A colleague's initials in a neutral disc (no tint that could read as a mark); `muted` for a colleague who cannot be picked. */
export function Initials({ name, size = 36, muted = false }: { name: string; size?: number; muted?: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        background: muted ? neutral.surface : neutral.sunken,
        border: muted ? `1px dashed ${neutral.lineStrong}` : 'none',
        color: muted ? neutral.mist : neutral.ink,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size > 40 ? 14 : 12,
        fontWeight: 700,
        flex: 'none',
        boxSizing: 'border-box',
      }}
    >
      {initialsOf(name)}
    </span>
  )
}
