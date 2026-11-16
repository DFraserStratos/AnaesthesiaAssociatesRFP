import type { CSSProperties } from 'react'

/**
 * Text for screen readers only: clipped to a pixel, never shown (UI unification
 * U3; moved from `ActiveCount`). Spread it on a span that holds the words.
 */
export const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}
