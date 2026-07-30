import { useEffect } from 'react'
import { markFirstRender } from './bootMetrics'

/**
 * Stamps the cold-launch figure, and renders nothing. Rendered last inside the
 * PWA entry's tree; the number it produces is the one the More tab's Build card
 * shows.
 *
 * It has to be inside the tree. `createRoot(...).render(...)` schedules the
 * initial mount at DefaultLane, which time-slices, so a bare
 * `requestAnimationFrame` alongside the `render()` call is not ordered after
 * React's first commit at all: on a slow phone the browser can take a rendering
 * opportunity between slices and stamp a flattering number with nothing
 * committed. An effect only runs after a real commit.
 *
 * The double frame is what gets past the paint: an animation-frame callback runs
 * in the frame's rendering step, BEFORE style, layout and paint, so the second
 * callback is the first moment the pixels are known to be on screen.
 *
 * StrictMode's double-invoked effect is harmless: `markFirstRender` keeps only
 * the first value.
 *
 * Its own file rather than a few lines in `pwa/main.tsx`, because a component
 * declared in a module that exports nothing defeats React Fast Refresh (and is
 * what oxlint's `only-export-components` flags). PWA-only, like the rest of this
 * folder: the framed prototype has no boot metric to stamp.
 */
export function BootMark() {
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(markFirstRender))
  }, [])
  return null
}
