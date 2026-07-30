import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { motion } from '../../../theme/motion'

export interface SlideLayer {
  key: string
  /** Rendered only when true; the slot otherwise sits empty off-screen right. */
  mounted: boolean
  node: ReactNode
}

interface SlideStackProps {
  layers: SlideLayer[]
  /** Active layer index (0 = base). Layers before it park at −24% + dim; after, off-screen right. */
  depth: number
  /**
   * Pop one layer. Supplying it arms edge-swipe-back on the active layer
   * whenever the stack is drilled in (`depth > 0`); omit it and every layer
   * renders exactly as it did before the gesture existed. The caller wires its
   * own per-depth back handler rather than a history `go(-1)`, because history
   * can hold entries that are not part of this stack.
   */
  onPop?: () => void
}

/** A touch must start within this many px of the layer's left edge to arm. */
const EDGE_ZONE_PX = 28
/** Releasing past this fraction of the layer's width commits the pop. */
const COMMIT_FRACTION = 0.35
/** ...as does releasing above this trailing speed, in px per millisecond. */
const COMMIT_VELOCITY_PX_PER_MS = 0.5
/** How far behind the release the trailing speed is measured from. */
const VELOCITY_WINDOW_MS = 100

interface DragState {
  pointerId: number
  /** Where the finger went down, and how wide the layer it grabbed is. */
  startX: number
  width: number
  /**
   * The trailing speed sample. `recent` is the newest point seen; `older` is
   * held roughly `VELOCITY_WINDOW_MS` behind it. Two slots are enough, and they
   * are what makes drag-then-rest-then-lift read as ~0 px/ms instead of
   * replaying whatever speed the finger had before it stopped.
   */
  olderX: number
  olderT: number
  recentX: number
  recentT: number
  /** Reduced motion: still track the gesture, but do not move the layer. */
  reduced: boolean
}

interface EdgeSwipe {
  /** Live drag distance in client px while a swipe is in flight, else null. */
  offset: number | null
  handlers: {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void
    onPointerCancel: (e: ReactPointerEvent<HTMLDivElement>) => void
  }
}

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n))

/** Read at the moment the gesture starts, in the `BottomSheet` idiom. */
const prefersReducedMotion = (): boolean =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Edge-swipe-back: drag the active layer off to the right from its left edge to
 * pop it, the way every native iOS stack behaves. Installed as a PWA there is
 * no browser back button and no dependable OS edge swipe, and the Lists tab is
 * three layers deep, so this gesture is the only always-available way back.
 *
 * Three rules keep it honest:
 *
 * 1. **Touch only.** A `pointerType` of `'mouse'` never arms. That keeps the
 *    framed desktop prototype byte-identical (nothing inside `PhoneFrame` is
 *    ever driven by touch), and it sidesteps a real unit trap: `clientX` under
 *    `PhoneFrame`'s presenter `transform: scale()` is in SCALED pixels, the
 *    same hazard `SlidingSegmentedControl` avoids by measuring in local layout
 *    coordinates instead of viewport rects. Here there is nothing to
 *    compensate for: the gesture cannot run inside the frame, and the PWA host
 *    applies no scale, so scaled px and CSS px are the same px. (The 35%
 *    threshold would survive a scale anyway, since `dx` and the layer width
 *    come from the same space and the ratio cancels; the 28px edge zone and
 *    the px/ms speed would not, which is the part the guard retires.)
 * 2. **Start at the edge.** Only the leftmost `EDGE_ZONE_PX` arms, so the
 *    screen's own content, sliders and horizontal scrollers keep their swipes.
 * 3. **Commit on intent.** Past `COMMIT_FRACTION` of the layer's width, or
 *    released faster than `COMMIT_VELOCITY_PX_PER_MS`, pops; anything else
 *    eases back. Both outcomes animate on `motion.cardAdvance`, because the
 *    transition is restored in the same commit that clears the drag offset:
 *    the browser then transitions from wherever the finger left the layer, to
 *    `translateX(0)` on a cancel or to `translateX(100%)` once `onPop` moves
 *    depth. Neither ending snaps.
 *
 * No sheet guard is needed: `BottomSheet` renders at `zIndex: 70` over the
 * stack and shadows the layer's pointer events while it is open.
 */
function useEdgeSwipeBack(onPop: (() => void) | undefined): EdgeSwipe {
  const drag = useRef<DragState | null>(null)
  const [offset, setOffset] = useState<number | null>(null)

  /** The in-flight drag for this pointer, or null if it is not ours. */
  function active(e: ReactPointerEvent<HTMLDivElement>): DragState | null {
    const state = drag.current
    return state !== null && state.pointerId === e.pointerId ? state : null
  }

  /** End the drag, then settle: back to rest on a cancel, or off on a commit. */
  function release(commit: boolean) {
    drag.current = null
    // Clearing the offset restores BOTH the layer's own transform and its
    // `motion.cardAdvance` transition in one render, so the settle animates.
    setOffset(null)
    if (commit) onPop?.()
  }

  return {
    offset,
    handlers: {
      onPointerDown(e) {
        if (onPop === undefined || drag.current !== null) return
        // Rule 1 (see the docblock): touch and pen only, never the mouse.
        if (e.pointerType === 'mouse') return
        const rect = e.currentTarget.getBoundingClientRect()
        // An unmeasurable layer has no meaningful 35% to cross.
        if (rect.width <= 0) return
        // Rule 2: the gesture belongs to the left edge, not to the content.
        if (e.clientX - rect.left > EDGE_ZONE_PX) return

        // Capture so a finger that wanders off the layer (or off the viewport)
        // still delivers move and up here. The browser drops the capture again
        // on pointerup / pointercancel, so there is nothing to release.
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          width: rect.width,
          olderX: e.clientX,
          olderT: e.timeStamp,
          recentX: e.clientX,
          recentT: e.timeStamp,
          reduced: prefersReducedMotion(),
        }
      },

      onPointerMove(e) {
        const state = active(e)
        if (state === null) return
        // Slide the trailing sample forward only once it ages past the window,
        // which keeps `older` about `VELOCITY_WINDOW_MS` behind the finger.
        if (e.timeStamp - state.olderT >= VELOCITY_WINDOW_MS) {
          state.olderX = state.recentX
          state.olderT = state.recentT
        }
        state.recentX = e.clientX
        state.recentT = e.timeStamp
        // Reduced motion: the layer does not track the finger, but the gesture
        // is still measured so it can commit on release.
        if (state.reduced) return
        setOffset(clamp(e.clientX - state.startX, 0, state.width))
      },

      onPointerUp(e) {
        const state = active(e)
        if (state === null) return
        const travelled = clamp(e.clientX - state.startX, 0, state.width)
        const elapsed = e.timeStamp - state.olderT
        // Unsigned on purpose: a flick back toward the edge is negative and
        // must not read as intent to leave.
        const velocity = elapsed > 0 ? (e.clientX - state.olderX) / elapsed : 0
        release(travelled > state.width * COMMIT_FRACTION || velocity > COMMIT_VELOCITY_PX_PER_MS)
      },

      onPointerCancel(e) {
        if (active(e) === null) return
        release(false)
      },
    },
  }
}

/**
 * The card-advance choreography (Design Language §05; convention 17): every
 * layer stays mounted and absolutely positioned; the active one sits at
 * translateX(0), the one behind parallaxes to −24% and dims 8%, layers ahead
 * wait off-screen right. Transform transitions run at `motion.cardAdvance`, so
 * pushing and popping both animate. Matches the mockup's translateX approach —
 * screens stay mounted for the slide.
 *
 * Given an `onPop`, the active layer also answers an edge swipe back (see
 * `useEdgeSwipeBack`). Only that layer carries the pointer handlers; the rest
 * render exactly as they always have.
 */
export function SlideStack({ layers, depth, onPop }: SlideStackProps) {
  const swipe = useEdgeSwipeBack(onPop)
  const swipeArmed = depth > 0 && onPop !== undefined

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {layers.map((layer, i) => {
        let transform: string
        if (i === depth) transform = 'translateX(0)'
        else if (i < depth) transform = `translateX(${motion.cardAdvance.parallax})`
        else transform = 'translateX(100%)'
        const behind = i < depth
        const draggable = swipeArmed && i === depth
        const dragX = draggable ? swipe.offset : null
        return (
          <div
            key={layer.key}
            data-testid={`slide-${layer.key}`}
            // Read by `global.css` to hand the horizontal axis to this gesture
            // across the layer's WHOLE subtree. The inline `touchAction` below
            // covers only this element, and a touch never lands on it.
            data-aa-swipe-back={draggable ? 'armed' : undefined}
            aria-hidden={i !== depth}
            onPointerDown={draggable ? swipe.handlers.onPointerDown : undefined}
            onPointerMove={draggable ? swipe.handlers.onPointerMove : undefined}
            onPointerUp={draggable ? swipe.handlers.onPointerUp : undefined}
            onPointerCancel={draggable ? swipe.handlers.onPointerCancel : undefined}
            style={{
              // Opaque layers (so a parked layer-behind never shows through the
              // active layer's gutters) that paint the SAME atmosphere as the
              // rest of the canvas via PhoneFrame's shared `--aa-atmos-*` vars.
              // Pixel-aligned with the fixed AtmosphereLayer at rest, so push /
              // pop stays seamless (no flash or restart) and parallax is intact.
              position: 'absolute',
              inset: 0,
              background: 'var(--aa-atmos-base, #F6F8F7)',
              backgroundImage: 'var(--aa-atmos-image, none)',
              transform: dragX !== null ? `translateX(${dragX}px)` : transform,
              transition:
                dragX !== null
                  ? 'none'
                  : `transform ${motion.cardAdvance.in}ms ${motion.cardAdvance.easing}`,
              boxShadow: i === depth && i > 0 ? '-16px 0 32px rgba(23,35,32,0.12)' : 'none',
              // Off-screen layers must not intercept taps.
              pointerEvents: i === depth ? 'auto' : 'none',
              // The one place the mobile subtree's blanket `touch-action:
              // manipulation` is not enough: `manipulation` permits `pan-x`, so
              // Chrome claims a horizontal drag as a pan and fires
              // `pointercancel` after the FIRST pointermove, killing the
              // gesture. `pan-y pinch-zoom` withholds the horizontal axis while
              // still leaving vertical scrolling and pinch-zoom to the browser.
              //
              // Inline is NOT sufficient on its own, and this was a real bug:
              // `touch-action` is resolved from the hit-tested element, and a
              // touch always lands on a descendant (a scroller, a card), never
              // on this div. The companion rule in `global.css`, keyed off
              // `data-aa-swipe-back`, is what actually covers the subtree.
              touchAction: draggable ? 'pan-y pinch-zoom' : undefined,
            }}
          >
            {layer.mounted ? layer.node : null}
            {behind && (
              <div
                aria-hidden
                style={{ position: 'absolute', inset: 0, background: `rgba(23,35,32,${motion.cardAdvance.dim})`, pointerEvents: 'none' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
