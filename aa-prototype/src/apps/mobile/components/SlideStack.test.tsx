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

function renderStack(depth: number, onPop?: () => void) {
  const view = render(<SlideStack layers={LAYERS} depth={depth} onPop={onPop} />)
  const layer = view.getByTestId(`slide-${LAYERS[depth]!.key}`)
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
 */
function pointer(el: Element, phase: PointerPhase, x: number, at: number, pointerType = 'touch') {
  const event = createEvent[phase](el, { pointerId: 1, isPrimary: true, pointerType, clientX: x })
  Object.defineProperty(event, 'timeStamp', { value: at })
  fireEvent(el, event)
}

describe('SlideStack edge-swipe-back', () => {
  it('never arms for a mouse pointer, so the framed desktop prototype is untouched', () => {
    const onPop = vi.fn()
    const { layer } = renderStack(2, onPop)

    pointer(layer, 'pointerDown', 4, 1000, 'mouse')
    pointer(layer, 'pointerMove', 240, 1400, 'mouse')
    pointer(layer, 'pointerUp', 300, 1500, 'mouse')

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

  it('follows the finger and pops once past the distance threshold', () => {
    const onPop = vi.fn()
    const { layer } = renderStack(2, onPop)

    pointer(layer, 'pointerDown', 8, 1000)
    pointer(layer, 'pointerMove', 88, 1400)

    // Mid-drag the layer tracks the finger with the transition suppressed.
    expect(layer.style.transform).toBe('translateX(80px)')
    expect(layer.style.transition).toBe('none')

    const past = 8 + COMMIT_PX + 20
    pointer(layer, 'pointerMove', past, 1800)
    pointer(layer, 'pointerUp', past, 2200)

    expect(onPop).toHaveBeenCalledTimes(1)
    // Settled: the motion token is back before the layer is asked to move.
    expect(layer.style.transition).toBe(RESTING_TRANSITION)
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
    expect(layer.style.transform).toBe('translateX(194px)')

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
})
