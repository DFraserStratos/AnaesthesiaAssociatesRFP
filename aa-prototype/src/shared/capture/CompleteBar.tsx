import { accent, elevation, neutral, radius, semantic } from '../../theme/tokens'
import { TextAction } from '../ui/TextAction'

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
      <svg width="18" height="18" viewBox="0 0 14 14" aria-hidden>
        <path
          d="M2.5 7.5 L5.5 10.5 L11.5 3.5"
          fill="none"
          stroke={semantic.success.onTint}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Booking complete
      {canAmend && (
        <TextAction inline onClick={onAmend} disabled={isBlocked} {...(isBlocked ? { title: blocked } : {})} style={{ marginLeft: 6, fontSize: 14, padding: '4px 0' }}>
          Amend
        </TextAction>
      )}
    </div>
  ) : (
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
  )
}
