/**
 * The small solid attention disc (UI unification U3, README group U26; moved
 * from Admin's `ConflictDot`): a "!" for a conflict or a List that needs the
 * office, a triangle for a Booking's warnings. The Admin Day mockup draws it at
 * 13px with a 9px glyph; legends and rows pass their host's size.
 *
 * A marker, never a control (US-13.7.3, convention 20): a span that takes no
 * focus. With `label` it is `role="img"` with that name; without, it is
 * `aria-hidden`, for a disc whose host already names the attention (a Day grid
 * block's title, a calendar cell's label, the words beside a row's dot).
 * `WarningTriangle` composes it. Lives in `src/shared` because the phone's
 * calendar draws it (`pwaPurity.test.ts`).
 */

import type { CSSProperties } from 'react'
import { TriangleAlert } from 'lucide-react'
import { neutral, radius, semantic } from '../../theme/tokens'

export type AttentionTone = 'warning' | 'error' | 'muted'

const FILL: Record<AttentionTone, string> = {
  warning: semantic.warning.solid,
  error: semantic.error.solid,
  muted: neutral.mist,
}

/** The "!" size per disc: 9 gives 7, 11 to 12 give 8, 13 to 14 give 9 (the mockup's 13/9), larger about 0.64. */
export function attentionGlyphSize(size: number): number {
  if (size <= 9) return 7
  if (size <= 12) return 8
  if (size <= 14) return 9
  return Math.round(size * 0.64)
}

export function AttentionDot({
  size = 13,
  glyph = '!',
  tone = 'warning',
  label,
  title,
  shot,
  style,
}: {
  size?: number
  glyph?: '!' | 'triangle'
  tone?: AttentionTone
  /** The accessible name; without it the disc is hidden from assistive tech. */
  label?: string
  /** A hover hint for mouse users (no effect on the accessible name). */
  title?: string
  shot?: string
  /** Placement only (position, offsets, flex). */
  style?: CSSProperties
}) {
  const a11y = label === undefined ? { 'aria-hidden': true as const } : { role: 'img' as const, 'aria-label': label }
  return (
    <span
      {...a11y}
      data-shot={shot}
      title={title}
      style={{
        width: size,
        height: size,
        flex: 'none',
        borderRadius: radius.pill,
        background: FILL[tone],
        color: neutral.surface,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: attentionGlyphSize(size),
        fontWeight: 700,
        ...style,
      }}
    >
      {glyph === '!' ? '!' : <TriangleAlert size={Math.round(size * 0.61)} strokeWidth={size <= 13 ? 3 : 2.75} aria-hidden />}
    </span>
  )
}
