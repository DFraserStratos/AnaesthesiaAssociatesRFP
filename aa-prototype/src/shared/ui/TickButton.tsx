import { Check } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'

/**
 * The one tick an admin uses to say "dealt with" (catch-up Phase 32b; US-13.7.2,
 * US-13.8.3): the To-do card's Clear and a notice's Resolve are this same
 * control, so the affordance reads the same wherever the office finishes
 * something. A teal outline button with a check (teal is the only action
 * colour), its text and accessible name given per use. `iconOnly` is the quiet round tick of the
 * Admin Day To-do rows (docs/explorations/todo-restyle.html, "Quiet list, bare icons"): a 28px
 * circle with a mist check that turns teal on hover, its text kept as the accessible name and tip,
 * so Open stays the row's main action.
 */
export function TickButton({
  children,
  onClick,
  compact = false,
  label,
  shot,
  iconOnly = false,
}: {
  children: string
  onClick: () => void
  compact?: boolean
  /** The accessible name, giving the row's context ("Resolve notice: Dr Souter moved ..."). */
  label?: string
  shot?: string
  /** Draw only the check in a quiet round button; the text becomes the tip (and the name without `label`). */
  iconOnly?: boolean
}) {
  if (iconOnly) {
    return (
      <button
        type="button"
        className="aa-ctl aa-tick-icon"
        onClick={onClick}
        aria-label={label ?? children}
        title={children}
        data-shot={shot}
        style={{
          display: 'inline-grid',
          placeItems: 'center',
          width: 28,
          height: 28,
          padding: 0,
          borderRadius: radius.pill,
          border: `1px solid ${neutral.line}`,
          background: neutral.surface,
          color: neutral.mist,
          cursor: 'pointer',
          flex: 'none',
        }}
      >
        <Check size={15} aria-hidden />
      </button>
    )
  }
  return (
    <button
      type="button"
      className="aa-ctl"
      onClick={onClick}
      aria-label={label}
      data-shot={shot}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        minHeight: compact ? 30 : 36,
        padding: compact ? '0 10px' : '0 12px',
        borderRadius: radius.ctl,
        border: `1px solid ${accent.base}`,
        background: neutral.surface,
        color: accent.base,
        fontFamily: 'inherit',
        fontSize: compact ? 12 : 13,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flex: 'none',
      }}
    >
      <Check size={compact ? 13 : 14} aria-hidden />
      {children}
    </button>
  )
}
