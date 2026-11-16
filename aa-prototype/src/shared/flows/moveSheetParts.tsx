import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'
import { initialsOf } from '../format'

/**
 * Parts the move sheets share (Phase 32's `MoveListSheet`, Phase 32a's
 * `MoveBookingToColleagueSheet`, Phase 32b's office status sheet), so their
 * anatomy cannot drift.
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

/** One "where does it go" choice: a neutral icon disc, a title and a line, a chevron. */
export function ChoiceRow({ icon, title, line, onClick, disabled = false, shot }: { icon: ReactNode; title: string; line: string; onClick: () => void; disabled?: boolean; shot: string }) {
  return (
    <button
      type="button"
      data-shot={shot}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        minHeight: 64,
        borderRadius: radius.card,
        border: `1px solid ${neutral.line}`,
        background: neutral.surface,
        fontFamily: 'inherit',
        textAlign: 'left',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span aria-hidden style={{ width: 36, height: 36, borderRadius: radius.pill, background: neutral.sunken, color: neutral.slate, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>{title}</span>
        <span style={{ fontSize: 12.5, lineHeight: '17px', color: neutral.slate }}>{line}</span>
      </span>
      {!disabled && <ChevronRight size={16} strokeWidth={2.2} color={neutral.mist} aria-hidden />}
    </button>
  )
}
