import { neutral, radius, semantic } from '../../theme/tokens'
import { easing } from '../../theme/motion'

interface ProgressBarProps {
  done: number
  total: number
  /** The bar's accessible name (default "Bookings complete"). */
  label?: string
  /** A fixed width (200 in the web List header) or `fill` (the phone, the rest of its row). */
  width?: number | 'fill'
}

/**
 * "n of N complete" as a bar (U32; UI unification U5): a 6px `line` track with a success-green
 * fill that grows on `easing.card` (the reduced-motion clamp in `global.css` shortens it). A
 * `role="progressbar"` with its values, so it is read as progress, not decoration. The visible
 * "n of N complete" text stays beside it at each call site.
 */
export function ProgressBar({ done, total, label = 'Bookings complete', width = 'fill' }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={`${done} of ${total}`}
      style={{ ...(width === 'fill' ? { flex: 1 } : { width }), height: 6, borderRadius: radius.pill, background: neutral.line, overflow: 'hidden', display: 'block' }}
    >
      <span style={{ display: 'block', height: '100%', borderRadius: radius.pill, background: semantic.success.solid, transition: `width 300ms ${easing.card}`, width: `${pct}%` }} />
    </span>
  )
}
