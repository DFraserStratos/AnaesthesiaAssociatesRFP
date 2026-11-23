import { Check } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'

/**
 * The one tick an admin uses to say "dealt with" (catch-up Phase 32b; US-13.7.2,
 * US-13.8.3): the To-do card's Clear and a notice's Resolve are this same
 * control, so the affordance reads the same wherever the office finishes
 * something. A teal outline button with a check (teal is the only action
 * colour), its text and accessible name given per use.
 */
export function TickButton({
  children,
  onClick,
  compact = false,
  label,
  shot,
}: {
  children: string
  onClick: () => void
  compact?: boolean
  /** The accessible name, giving the row's context ("Resolve notice: Dr Souter moved ..."). */
  label?: string
  shot?: string
}) {
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
