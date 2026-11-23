import { accent, elevation, neutral, radius, semantic } from '../../theme/tokens'
import { TextAction } from '../ui/TextAction'
import { TickGlyph } from '../ui/TickBadge'

interface CompleteBarProps {
  completed: boolean
  /** ACTIVE list — the completed bar offers the audited Amend. */
  canAmend: boolean
  onComplete: () => void
  onAmend: () => void
  /**
   * Why completing or amending must wait (catch-up Phase 35): the Admin draft
   * holds unsaved changes. Both are commands on the saved Booking.
   */
  blocked?: string | null
}

/**
 * The Booking screen's sticky-footer CONTENT (mockup screen 3): the teal "Mark
 * complete" CTA, or once completed the static success bar with the "Amend" link
 * (→ the audited uncompleteBooking) while the list is still ACTIVE.
 *
 * Phase 05 split the outer positioning out into the surface `Footer` (mobile
 * absolute bar vs web sticky bar), so this renders only the inner control and
 * is identical on both platforms; the caller wraps it in `useSurface().Footer`.
 */
export function CompleteBar({ completed, canAmend, onComplete, onAmend, blocked = null }: CompleteBarProps) {
  const isBlocked = blocked !== null
  return completed ? (
    <div
      style={{
        height: 56,
        borderRadius: radius.card,
        background: semantic.success.tint,
        color: semantic.success.onTint,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: 17,
        fontWeight: 700,
      }}
    >
      <TickGlyph size={18} color={semantic.success.onTint} />
      Booking complete
      {canAmend && (
        <TextAction inline onClick={onAmend} disabled={isBlocked} {...(isBlocked ? { title: blocked } : {})} style={{ marginLeft: 6, fontSize: 14, padding: '4px 0' }}>
          Amend
        </TextAction>
      )}
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        type="button"
        onClick={isBlocked ? undefined : onComplete}
        disabled={isBlocked}
        title={blocked ?? undefined}
        style={{
          height: 56,
          borderRadius: radius.card,
          border: 'none',
          // The one disabled treatment (Button's, README U08) while a command must wait.
          background: isBlocked ? neutral.line : accent.base,
          color: isBlocked ? neutral.mist : neutral.surface,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'inherit',
          fontSize: 17,
          fontWeight: 700,
          width: '100%',
          cursor: isBlocked ? 'default' : 'pointer',
          boxShadow: isBlocked ? 'none' : elevation.e2,
        }}
      >
        Mark complete
      </button>
      {/* The reason shows, as under Cancel booking (catch-up Phase 35): the Admin draft has unsaved changes. */}
      {isBlocked && (
        <span data-shot="complete-blocked-reason" style={{ fontSize: 12.5, lineHeight: '17px', color: neutral.slate }}>
          {blocked}
        </span>
      )}
    </div>
  )
}
