import { accent, elevation, neutral, radius, semantic } from '../../theme/tokens'

interface CompleteBarProps {
  completed: boolean
  /** DRAFT list — the completed bar offers the audited Amend. */
  canAmend: boolean
  onComplete: () => void
  onAmend: () => void
}

/**
 * The Card screen's sticky-footer CONTENT (mockup screen 3): the teal "Mark
 * complete" CTA, or once completed the static success bar with the "Amend" link
 * (→ the audited uncompleteCard) while the list is still DRAFT.
 *
 * Phase 05 split the outer positioning out into the surface `Footer` (mobile
 * absolute bar vs web sticky bar), so this renders only the inner control and
 * is identical on both platforms; the caller wraps it in `useSurface().Footer`.
 */
export function CompleteBar({ completed, canAmend, onComplete, onAmend }: CompleteBarProps) {
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
      Card complete
      {canAmend && (
        <button
          type="button"
          onClick={onAmend}
          style={{
            border: 'none',
            background: 'none',
            padding: '4px 0',
            marginLeft: 6,
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 600,
            color: accent.base,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Amend
        </button>
      )}
    </div>
  ) : (
    <button
      type="button"
      onClick={onComplete}
      style={{
        height: 56,
        borderRadius: radius.card,
        border: 'none',
        background: accent.base,
        color: neutral.surface,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'inherit',
        fontSize: 17,
        fontWeight: 700,
        width: '100%',
        cursor: 'pointer',
        boxShadow: elevation.e2,
      }}
    >
      Mark complete
    </button>
  )
}
