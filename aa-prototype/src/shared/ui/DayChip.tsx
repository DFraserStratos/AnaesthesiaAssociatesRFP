import { X } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'
import { dayWithYear, longDay } from '../format'

/**
 * The picked day as one teal chip that closes the day view (UI unification U6, U35; B-pills G8):
 * "Fri 13 Mar 2026" with a close glyph, named in full ("Friday 13 March 2026. Close the day and go
 * back to your Lists"). `size` desktop is the web Lists chip (32 high, 14px X); touch the phone's
 * (44 high, a 44px minimum, 16px X), the mobile touch target. `testId` lands on the button. The chip leaves
 * when it closes, so `returnFocusTo` names the control keyboard focus goes back to (the date control that
 * picked the day), never the page body (U7).
 */
export function DayChip({
  dateISO,
  onClose,
  size = 'desktop',
  testId,
  returnFocusTo,
}: {
  dateISO: string
  onClose: () => void
  size?: 'desktop' | 'touch'
  testId?: string
  returnFocusTo?: () => HTMLElement | null
}) {
  const touch = size === 'touch'
  return (
    <button
      type="button"
      className="aa-ctl"
      data-testid={testId}
      aria-label={`${longDay(dateISO)}. Close the day and go back to your Lists`}
      onClick={() => {
        onClose()
        if (returnFocusTo !== undefined) requestAnimationFrame(() => returnFocusTo()?.focus())
      }}
      style={{
        height: touch ? 44 : 32,
        ...(touch ? { minWidth: 44 } : {}),
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: touch ? '0 10px 0 16px' : '0 10px 0 14px',
        borderRadius: radius.pill,
        border: 'none',
        background: accent.base,
        color: neutral.surface,
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      <span className="mono">{dayWithYear(dateISO)}</span>
      <X size={touch ? 16 : 14} strokeWidth={2.4} aria-hidden />
    </button>
  )
}
