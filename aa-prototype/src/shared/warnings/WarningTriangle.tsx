import type { Warning } from '../../domain/warnings'
import { isOpen } from '../../domain/warnings'
import { strongestOpen } from './useBookingWarnings'
import { warningPillTone, warningTone } from './tone'
import { AttentionDot } from './AttentionDot'
import { plural } from '../format'

/**
 * The small warning marker on a Booking (US-13.7.3 "Flag"), "much like the
 * prototype does today": the day grid's 13px corner-marker anatomy (the shared
 * `AttentionDot`, U3), a filled disc in the strongest open warning's colour (mild amber, strong red, only
 * cleared ones mist) with a white triangle, plus the open count when more than
 * one. Deliberately NOT interactive (US-13.7.3 removed tap-to-read): a span
 * with an accessible label, safe inside a row button. Renders nothing when the
 * Booking has no warnings.
 */
export function WarningTriangle({ warnings, size = 'md' }: { warnings: readonly Warning[]; size?: 'sm' | 'md' }) {
  if (warnings.length === 0) return null
  const open = warnings.filter(isOpen)
  const shown = open.length > 0 ? open : warnings
  const tone = warningTone(strongestOpen(warnings))
  const pillTone = warningPillTone(strongestOpen(warnings))
  const dotTone = pillTone === 'neutral' ? 'muted' : pillTone
  const d = size === 'sm' ? 15 : 18
  const label =
    open.length === 0
      ? `${warnings.length === 1 ? 'Warning' : `${warnings.length} warnings`} cleared: ${warnings[0]!.text}`
      : `${plural(open.length, 'warning')}: ${open.map((w) => w.text).join(' ')}`
  return (
    <span
      role="img"
      aria-label={label}
      title={shown.map((w) => w.text).join('\n')}
      data-shot="booking-warning"
      data-strength={strongestOpen(warnings) ?? 'cleared'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0, verticalAlign: 'middle' }}
    >
      <AttentionDot size={d} glyph="triangle" tone={dotTone} />
      {open.length > 1 && (
        <span aria-hidden style={{ fontSize: 11, fontWeight: 700, color: tone.onTint, fontVariantNumeric: 'tabular-nums' }}>
          {open.length}
        </span>
      )}
    </span>
  )
}
