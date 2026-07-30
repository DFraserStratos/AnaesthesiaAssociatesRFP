import {
  useRef,
  useState,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
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
/** Horizontal travel that decides the gesture is a swipe and not a scroll. */
const AXIS_LOCK_PX = 10
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
  startY: number
  width: number
  /**
   * False until the finger has cleared `AXIS_LOCK_PX` horizontally AND won the
   * axis comparison (rule 4). Nothing moves while it is false, so a vertical
   * scroll that happens to start in the edge zone never shears the screen.
   */
  engaged: boolean
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
  /**
   * How far to hold the layer, in client px, while a swipe is in flight; null
   * whenever it should sit where the stack puts it. Not the raw finger distance:
   * `AXIS_LOCK_PX` is already deducted (rule 4), so it stays 0 until the gesture
   * has claimed the axis.
   */
  offset: number | null
  handlers: {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void
    onPointerCancel: (e: ReactPointerEvent<HTMLDivElement>) => void
  }
}

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n))

/**
 * Parked layers are inert as well as `aria-hidden`. `pointerEvents: 'none'` stops
 * taps but not the keyboard: focus could stay in, or Tab into, a layer sitting
 * off-screen, and the browser then scrolls the `overflow: hidden` stack container
 * to reveal it, shunting the whole app sideways with no way to scroll it back.
 * `inert` also drops focus out of a layer at the moment it parks, which is what
 * makes a pop leave focus somewhere real. Installed as a PWA there is no browser
 * chrome to escape to if it goes wrong.
 *
 * The cast is React 18: `inert` is neither in its DOM types nor in its boolean
 * attribute list (a `true` would render as the string "true" and warn), so the
 * attribute's present form, the empty string, is spread in through one cast here.
 */
const PARKED_ATTRS = { inert: '' } as unknown as HTMLAttributes<HTMLDivElement>

/** Read at the moment the gesture starts, in the `BottomSheet` idiom. */
const prefersReducedMotion = (): boolean =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Edge-swipe-back: drag the active layer off to the right from its left edge to
 * pop it, the way every native iOS stack behaves. Installed as a PWA there is no
 * browser back button and no dependable OS edge swipe (Android's system Back
 * walks history, and its own gesture zone often claims a left-edge swipe first),
 * and the Lists tab is three layers deep, so this gesture is the app's own
 * always-available way back.
 *
 * Five rules keep it honest:
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
 * 3. **Never under an open sheet.** Most of the app's mobile sheets are rendered
 *    by the screen itself, which makes them DESCENDANTS of this layer: their
 *    `pointerdown` bubbles straight into these handlers, and `zIndex: 70`
 *    changes paint order, not propagation. (Only the two the Lists route renders
 *    as siblings of the stack, `AddCardFlow` and `RequestCoverSheet`, are
 *    genuinely outside it.) Unguarded, a drag on a sheet or its scrim took the
 *    whole layer with it and popped, and because a screen does not reset its own
 *    `sheet` state on the way out, re-entering showed the stale sheet still
 *    open. So an open modal dialog anywhere inside the layer refuses the arm.
 * 4. **Claim the axis before moving.** Nothing translates until the finger has
 *    travelled `AXIS_LOCK_PX` horizontally, and at that first qualifying move a
 *    vertical-dominant gesture is handed back rather than taken over. The
 *    subtree keeps `pan-y` (see the inline note below), so both motions can run
 *    at once: without the gate, an ordinary scroll started inside the 28px edge
 *    applied its own sideways drift as `translateX` and sheared the screen away
 *    from the fixed atmosphere. The threshold comes off the RENDERED offset
 *    only, never the commit maths, so the layer neither jumps by `AXIS_LOCK_PX`
 *    when the gesture wins nor moves the 35% and speed thresholds.
 * 5. **Commit on intent.** Past `COMMIT_FRACTION` of the layer's width, or
 *    released faster than `COMMIT_VELOCITY_PX_PER_MS`, pops; anything else
 *    eases back. Both outcomes animate on `motion.cardAdvance`, because the
 *    transition is restored in the same commit that clears the drag offset:
 *    the browser then transitions from wherever the finger left the layer, to
 *    `translateX(0)` on a cancel or to `translateX(100%)` once `onPop` moves
 *    depth. Neither ending snaps.
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
        // Rule 3: a sheet open inside this layer owns the screen. Deliberately
        // last, so the DOM query only runs for a touch that reached the edge zone.
        if (e.currentTarget.querySelector('[role="dialog"][aria-modal]') !== null) return

        // Capture so a finger that wanders off the layer (or off the viewport)
        // still delivers move and up here. The browser drops the capture again
        // on pointerup / pointercancel, so there is nothing to release.
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          width: rect.width,
          engaged: false,
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
        const dx = e.clientX - state.startX
        if (!state.engaged) {
          // Rule 4: hold the layer still until the finger has said which way it
          // meant to go...
          if (Math.abs(dx) < AXIS_LOCK_PX) return
          // ...and if that first honest move was mostly vertical, the touch
          // belongs to the scroller underneath. Dropping the drag is enough:
          // later moves and the pointerup find nothing of ours and are ignored,
          // and there is no offset to settle because nothing has moved yet.
          if (Math.abs(e.clientY - state.startY) > Math.abs(dx)) {
            release(false)
            return
          }
          state.engaged = true
        }
        // Reduced motion: the layer does not track the finger, but the gesture
        // is still measured so it can commit on release.
        if (state.reduced) return
        // `AXIS_LOCK_PX` off the rendered offset only (rule 4): the layer picks
        // up from where the finger already is rather than jumping to meet it.
        setOffset(clamp(dx - AXIS_LOCK_PX, 0, state.width))
      },

      onPointerUp(e) {
        const state = active(e)
        if (state === null) return
        // Raw travel, NOT the rendered offset: subtracting `AXIS_LOCK_PX` here
        // too would quietly move 35% and the flick threshold (rule 4).
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
 * `useEdgeSwipeBack`). Only that layer carries the pointer handlers. Every other
 * layer is out of reach three ways over: unhittable (`pointerEvents: 'none'`),
 * unspoken (`aria-hidden`) and unfocusable (`inert`, see `PARKED_ATTRS`).
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
            {...(i !== depth ? PARKED_ATTRS : {})}
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
