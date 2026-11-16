/**
 * A small count beside a card or page heading (UI unification U3, README group
 * U26): the Admin Day right rail's 18px bubble (`0 7px` 11.5/18 700, tabular
 * numbers). Neutral by default; warning for counts that are attention (the
 * waiting Draft Lists, the demo actions). A passive span (question 3).
 *
 * `srNoun` adds a visually hidden noun after the figure, so a screen reader
 * hears "3 to do" or "2 active" where the eye sees the number beside the
 * heading. Hidden at zero unless `hideAtZero={false}` (the Notifications count
 * still shows "0" once every notice is ticked). The SideNav badge is the
 * mockup's own and stays in the side nav.
 */

import { fontFamily, neutral, radius, semantic } from '../../theme/tokens'
import { visuallyHidden } from './visuallyHidden'

export type CountBadgeTone = 'neutral' | 'warning'

const TONES: Record<CountBadgeTone, { background: string; color: string }> = {
  neutral: { background: neutral.sunken, color: neutral.slate },
  warning: { background: semantic.warning.tint, color: semantic.warning.onTint },
}

export function CountBadge({
  count,
  tone = 'neutral',
  srNoun,
  mono = false,
  hideAtZero = true,
  shot,
}: {
  count: number
  tone?: CountBadgeTone
  /** Read after the figure by screen readers only ("to do", "active"). */
  srNoun?: string
  mono?: boolean
  hideAtZero?: boolean
  shot?: string
}) {
  if (hideAtZero && count === 0) return null
  return (
    <span
      data-shot={shot}
      style={{
        display: 'inline-block',
        minWidth: 18,
        padding: '0 7px',
        boxSizing: 'border-box',
        borderRadius: radius.pill,
        ...TONES[tone],
        fontSize: 11.5,
        fontWeight: 700,
        lineHeight: '18px',
        textAlign: 'center',
        fontVariantNumeric: 'tabular-nums',
        ...(mono ? { fontFamily: fontFamily.mono } : {}),
      }}
    >
      {count}
      {srNoun !== undefined && <span style={visuallyHidden}> {srNoun}</span>}
    </span>
  )
}
