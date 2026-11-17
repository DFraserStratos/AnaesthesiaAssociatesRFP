import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { neutral, radius } from '../../theme/tokens'

/**
 * Parts the move sheets share (Phase 32's `MoveListSheet`, Phase 32a's
 * `MoveBookingToColleagueSheet`, Phase 32b's office status sheet), so their
 * anatomy cannot drift.
 */

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
