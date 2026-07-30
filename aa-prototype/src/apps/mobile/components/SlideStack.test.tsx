import { createEvent, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { motion } from '../../../theme/motion'
import { SlideStack, type SlideLayer } from './SlideStack'

/**
 * Edge-swipe-back, driven by synthetic pointer events. jsdom ships
 * `PointerEvent` but neither the pointer-capture API nor any layout, so both
 * are stood in for here rather than softened in the component.
 */

/** The stubbed layer geometry: phone width, flush against the viewport edge. */
const LAYER_WIDTH = 320
/** 35% of the layer: a release past this commits on distance alone. */
const COMMIT_PX = LAYER_WIDTH * 0.35
const RESTING_TRANSITION = `transform ${motion.cardAdvance.in}ms ${motion.cardAdvance.easing}`

const LAYERS: SlideLayer[] = [
  { key: 'home', mounted: true, node: <div>Forward lists</div> },
  { key: 'list', mounted: true, node: <div>List detail</div> },
  { key: 'card', mounted: true, node: <div>Card detail</div> },
]

beforeAll(() => {
  // The component captures the pointer unguarded, which is correct in a
  // browser; jsdom simply has no implementation to call.
  Element.prototype.setPointerCapture = () => undefined
  Element.prototype.releasePointerCapture = () => undefined
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderStack(depth: number, onPop?: () => void, layers: SlideLayer[] = LAYERS) {
  const view = render(<SlideStack layers={layers} depth={depth} onPop={onPop} />)
  const layer = view.getByTestId(`slide-${layers[depth]!.key}`)
  layer.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: LAYER_WIDTH,
      bottom: 640,
      width: LAYER_WIDTH,
      height: 640,
      toJSON: () => undefined,
    }) as DOMRect
  return { ...view, layer }
}

type PointerPhase = 'pointerDown' | 'pointerMove' | 'pointerUp' | 'pointerCancel'

/**
 * Fire one pointer event at a chosen millisecond. The component measures
 * release speed from `event.timeStamp`, and jsdom stamps events off the wall
 * clock, so synthetic events fired back to back would otherwise read as an
 * impossibly fast flick. `timeStamp` is read-only, hence the redefine; and it
 * is never 0, because React substitutes a wall-clock reading for a falsy one.
 *
 * `y` defaults to 0 and every x-only drag below leaves it there, which is the
 * purely horizontal case; the axis-lock tests are the ones that move it.
 */
function pointer(
  el: Element,
  phase: PointerPhase,
  x: number,
  at: number,
  opts: { y?: number; pointerType?: string } = {},
) {
  const event = createEvent[phase](el, {
    pointerId: 1,
    isPrimary: true,
    pointerType: opts.pointerType ?? 'touch',
    clientX: x,
    clientY: opts.y ?? 0,
  })
  Object.defineProperty(event, 'timeStamp', { value: at })
  fireEvent(el, event)
}

describe('SlideStack edge-swipe-back', () => {
  it('never arms for a mouse pointer, so the framed desktop prototype is untouched', () => {
    const onPop = vi.fn()
    const { layer } = renderStack(2, onPop)

    pointer(layer, 'pointerDown', 4, 1000, { pointerType: 'mouse' })
    pointer(layer, 'pointerMove', 240, 1400, { pointerType: 'mouse' })
    pointer(layer, 'pointerUp', 300, 1500, { pointerType: 'mouse' })

    expect(onPop).not.toHaveBeenCalled()
    expect(layer.style.transform).toBe('translateX(0)')
    expect(layer.style.transition).toBe(RESTING_TRANSITION)
  })

  it('ignores a touch that starts outside the left edge zone', () => {
    const onPop = vi.fn()
    const { layer } = renderStack(2, onPop)

    pointer(layer, 'pointerDown', 96, 1000)
    pointer(layer, 'pointerMove', 280, 1400)
    pointer(layer, 'pointerUp', 300, 1500)

    expect(onPop).not.toHaveBeenCalled()
    expect(layer.style.transform).toBe('translateX(0)')
  })

  /**
   * A sheet a screen renders itself lives INSIDE the layer, so its pointer events
   * bubble into the gesture. Unguarded, a drag on the sheet or its scrim popped
   * the layer and left the sheet open inside the screen that had just gone off.
   */
  it('refuses to arm while a sheet is open inside the layer', () => {
    const onPop = vi.fn()
    const { layer } = renderStack(2, onPop, [
      ...LAYERS.slice(0, 2),
      {
        key: 'card',
        mounted: true,
        node: (
          <div>
            Card detail
            {/* `BottomSheet`, reduced to the two attributes the guard matches. */}
            <div role="dialog" aria-modal>
              Cancel this card?
            </div>
          </div>
        ),
      },
    ])

    pointer(layer, 'pointerDown', 4, 1000)
    pointer(layer, 'pointerMove', 240, 1400)
    pointer(layer, 'pointerUp', 300, 1500)

    expect(onPop).not.toHaveBeenCalled()
    expect(layer.style.transform).toBe('translateX(0)')
  })

  it('follows the finger and pops once past the distance threshold', () => {
    const onPop = vi.fn()
    const { layer } = renderStack(2, onPop)

    pointer(layer, 'pointerDown', 8, 1000)
    pointer(layer, 'pointerMove', 88, 1400)

    // Mid-drag the layer tracks the finger with the transition suppressed, less
    // the 10px the axis lock spends deciding this was a swipe (80 - 10).
    expect(layer.style.transform).toBe('translateX(70px)')
    expect(layer.style.transition).toBe('none')

    const past = 8 + COMMIT_PX + 20
    pointer(layer, 'pointerMove', past, 1800)
    pointer(layer, 'pointerUp', past, 2200)

    expect(onPop).toHaveBeenCalledTimes(1)
    // Settled: the motion token is back before the layer is asked to move.
    expect(layer.style.transition).toBe(RESTING_TRANSITION)
  })

  it('holds the layer still until the finger clears the axis-lock threshold', () => {
    const onPop = vi.fn()
    const { layer } = renderStack(2, onPop)

    // 6px is drift, not intent: nothing moves and the resting transition stands.
    pointer(layer, 'pointerDown', 6, 1000)
    pointer(layer, 'pointerMove', 12, 1100)
    expect(layer.style.transform).toBe('translateX(0)')
    expect(layer.style.transition).toBe(RESTING_TRANSITION)

    // Past 10px it engages and starts from 0 rather than jumping the threshold,
    // so 24px of travel holds the layer at 14.
    pointer(layer, 'pointerMove', 30, 1200)
    expect(layer.style.transform).toBe('translateX(14px)')

    pointer(layer, 'pointerUp', 30, 1300)
    expect(onPop).not.toHaveBeenCalled()
  })

  it('hands a vertical-dominant drag back to the scroller instead of shearing the layer', () => {
    const onPop = vi.fn()
    const { layer } = renderStack(2, onPop)

    // A thumb scroll that lands in the left edge zone: 14px of sideways drift
    // against 100px of scroll. The first move to clear the threshold decides,
    // and it decides against the gesture.
    pointer(layer, 'pointerDown', 6, 1000, { y: 400 })
    pointer(layer, 'pointerMove', 20, 1100, { y: 300 })
    expect(layer.style.transform).toBe('translateX(0)')
    expect(layer.style.transition).toBe(RESTING_TRANSITION)

    // And it is given up for good: the rest of the scroll cannot revive it,
    // however far right the finger wanders before it lifts.
    pointer(layer, 'pointerMove', 220, 1200, { y: 120 })
    pointer(layer, 'pointerUp', 260, 1300, { y: 120 })

    expect(onPop).not.toHaveBeenCalled()
    expect(layer.style.transform).toBe('translateX(0)')
  })

  it('eases back without popping when the drag is short and slow', () => {
    const onPop = vi.fn()
    const { layer } = renderStack(2, onPop)

    pointer(layer, 'pointerDown', 6, 1000)
    pointer(layer, 'pointerMove', 40, 1500)
    pointer(layer, 'pointerMove', 60, 2000)
    pointer(layer, 'pointerUp', 60, 2500)

    expect(onPop).not.toHaveBeenCalled()
    expect(layer.style.transform).toBe('translateX(0)')
    expect(layer.style.transition).toBe(RESTING_TRANSITION)
  })

  it('pops on a fast flick that never reaches the distance threshold', () => {
    const onPop = vi.fn()
    const { layer } = renderStack(2, onPop)

    // 64px in 40ms is 1.6px/ms, well past the 0.5px/ms flick threshold, while
    // 64px is barely half the distance a slow drag would have to cover.
    pointer(layer, 'pointerDown', 6, 1000)
    pointer(layer, 'pointerMove', 30, 1016)
    pointer(layer, 'pointerMove', 70, 1032)
    pointer(layer, 'pointerUp', 70, 1040)

    expect(onPop).toHaveBeenCalledTimes(1)
  })

  it('abandons the drag on pointercancel', () => {
    const onPop = vi.fn()
    const { layer } = renderStack(2, onPop)

    pointer(layer, 'pointerDown', 6, 1000)
    pointer(layer, 'pointerMove', 200, 1400)
    expect(layer.style.transform).toBe('translateX(184px)')

    pointer(layer, 'pointerCancel', 200, 1500)

    expect(onPop).not.toHaveBeenCalled()
    expect(layer.style.transform).toBe('translateX(0)')
    expect(layer.style.transition).toBe(RESTING_TRANSITION)
  })

  it('does not track the finger under reduced motion, but still commits', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }))
    const onPop = vi.fn()
    const { layer } = renderStack(2, onPop)

    pointer(layer, 'pointerDown', 6, 1000)
    pointer(layer, 'pointerMove', 200, 1400)

    expect(layer.style.transform).toBe('translateX(0)')
    expect(layer.style.transition).toBe(RESTING_TRANSITION)

    pointer(layer, 'pointerUp', 200, 1800)
    expect(onPop).toHaveBeenCalledTimes(1)
  })

  it('never arms at depth 0, where there is nothing to pop', () => {
    const onPop = vi.fn()
    const { layer } = renderStack(0, onPop)

    pointer(layer, 'pointerDown', 4, 1000)
    pointer(layer, 'pointerMove', 240, 1400)
    pointer(layer, 'pointerUp', 280, 1500)

    expect(onPop).not.toHaveBeenCalled()
    expect(layer.style.transform).toBe('translateX(0)')
  })

  it('leaves the stack inert when no onPop is supplied', () => {
    const { layer } = renderStack(2)

    pointer(layer, 'pointerDown', 4, 1000)
    pointer(layer, 'pointerMove', 240, 1400)
    pointer(layer, 'pointerUp', 280, 1500)

    expect(layer.style.transform).toBe('translateX(0)')
    expect(layer.style.transition).toBe(RESTING_TRANSITION)
  })

  it('claims the horizontal axis on the armed layer only', () => {
    const { getByTestId } = render(<SlideStack layers={LAYERS} depth={2} onPop={() => undefined} />)

    // `pinch-zoom` is kept deliberately: the blanket `manipulation` this
    // overrides allowed it, and a drilled-in screen should not silently lose
    // magnification.
    expect(getByTestId('slide-card')).toHaveStyle({ touchAction: 'pan-y pinch-zoom' })
    expect(getByTestId('slide-list').style.touchAction).toBeFalsy()
    expect(getByTestId('slide-home').style.touchAction).toBeFalsy()
  })

  /**
   * The inline style covers only the layer div, and a touch never lands on it.
   * `global.css` widens the same rule to the layer's whole subtree off this
   * attribute; without it Chrome cancels the gesture after the first move.
   */
  it('marks the armed layer for the subtree-wide touch-action rule', () => {
    const { getByTestId, rerender } = render(<SlideStack layers={LAYERS} depth={2} onPop={() => undefined} />)

    expect(getByTestId('slide-card')).toHaveAttribute('data-aa-swipe-back', 'armed')
    expect(getByTestId('slide-list')).not.toHaveAttribute('data-aa-swipe-back')

    // Nothing is armed at the base of the stack, or with no `onPop`.
    rerender(<SlideStack layers={LAYERS} depth={0} onPop={() => undefined} />)
    expect(getByTestId('slide-home')).not.toHaveAttribute('data-aa-swipe-back')
    rerender(<SlideStack layers={LAYERS} depth={2} />)
    expect(getByTestId('slide-card')).not.toHaveAttribute('data-aa-swipe-back')
  })

  /**
   * Parked layers keep their DOM, so `pointerEvents: 'none'` is not enough on its
   * own: focus could stay in one, or Tab into it, and the browser then scrolls the
   * clipped stack container to reveal a screen that is meant to be off-stage.
   */
  it('marks parked layers inert so focus cannot land off-screen', () => {
    const { getByTestId, rerender } = render(<SlideStack layers={LAYERS} depth={1} />)

    expect(getByTestId('slide-list')).not.toHaveAttribute('inert')
    expect(getByTestId('slide-home')).toHaveAttribute('inert')
    expect(getByTestId('slide-card')).toHaveAttribute('inert')

    rerender(<SlideStack layers={LAYERS} depth={0} />)
    expect(getByTestId('slide-home')).not.toHaveAttribute('inert')
    expect(getByTestId('slide-list')).toHaveAttribute('inert')
  })
})
