// @vitest-environment jsdom
/**
 * B09 · R-32: the Diff review's landings. One landing per page at a time, cancelled by a new one and
 * by the reader's own wheel, touch, press or scroll key; a landing that cannot move the page ends at
 * once and leaves nothing waiting; under reduced motion, nothing keeps writing the scroll position for
 * a target out of reach. A controlled scroll container stands in for the browser's.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelLanding, land } from '../src/diff/scroll.ts'

let frames: FrameRequestCallback[]
let reduced: boolean

/** A page `height` tall showing `view` of it, its scroll position clamped as a browser's is; every write counted. */
function scroller(height: number, view: number) {
  const page = document.createElement('div')
  let top = 0
  const writes: number[] = []
  Object.defineProperty(page, 'scrollTop', {
    get: () => top,
    set: (v: number) => {
      writes.push(v)
      top = Math.max(0, Math.min(v, height - view))
    },
  })
  Object.defineProperty(page, 'clientHeight', { get: () => view })
  Object.defineProperty(page, 'scrollHeight', { get: () => height })
  page.getBoundingClientRect = () => ({ top: 0 }) as DOMRect
  const scrollTo = vi.fn((o: ScrollToOptions) => {
    page.scrollTop = o.top ?? top
  })
  page.scrollTo = scrollTo as unknown as typeof page.scrollTo
  document.body.appendChild(page)
  /** An element at `y` down the page (its place may move as cards lay out: `y` is read each time). */
  const at = (y: () => number) => {
    const el = document.createElement('div')
    el.getBoundingClientRect = () => ({ top: y() - top }) as DOMRect
    page.appendChild(el)
    return el
  }
  return { page, writes, scrollTo, at, set: (v: number) => (top = v), get top() { return top } }
}

const bar = () => 0
const run = (n: number) => {
  for (let k = 0; k < n && frames.length; k++) frames.shift()!(0)
}

beforeEach(() => {
  frames = []
  reduced = false
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = []
  })
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduced && q.includes('reduce'), addEventListener() {}, removeEventListener() {} }))
  // Only the timers: frames run from the queue above, one `run` at a time.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('one landing at a time, and the reader always wins (R-32)', () => {
  it('under reduced motion, a target out of reach is written once, not every frame for a second', () => {
    reduced = true
    const s = scroller(3000, 1000)
    land(s.page, s.at(() => 2900), bar) // lands at 2888, but the page stops at 2000
    run(120)
    expect(s.writes.length).toBeLessThanOrEqual(2)
    expect(frames).toHaveLength(0)
  })

  it('reaching the end, then scrolling up by hand: never pulled back', () => {
    reduced = true
    const s = scroller(3000, 1000)
    land(s.page, s.at(() => 2900), bar)
    run(2)
    s.page.dispatchEvent(new WheelEvent('wheel'))
    s.set(1200) // the reader's own scroll
    const before = s.writes.length
    run(120)
    expect(s.writes.length).toBe(before)
    expect(s.top).toBe(1200)
  })

  it('the reader cancels a landing still correcting as cards lay out', () => {
    reduced = true
    const s = scroller(10000, 1000)
    let y = 5000
    land(s.page, s.at(() => (y += 30)), bar) // keeps moving: never calm
    run(3)
    s.page.dispatchEvent(new MouseEvent('mousedown'))
    const before = s.writes.length
    run(60)
    expect(s.writes.length).toBe(before)
  })

  it('a scroll key cancels too', () => {
    reduced = true
    const s = scroller(10000, 1000)
    let y = 5000
    land(s.page, s.at(() => (y += 30)), bar)
    run(2)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp' }))
    const before = s.writes.length
    run(60)
    expect(s.writes.length).toBe(before)
  })

  it('a second landing cancels the first', () => {
    reduced = true
    const s = scroller(10000, 1000)
    let y = 5000
    land(s.page, s.at(() => (y += 30)), bar)
    run(2)
    const from = s.writes.length
    land(s.page, s.at(() => 2012), bar)
    run(60)
    expect(s.top).toBe(2000)
    // Every write since goes to the second target: the first landing's loop is gone.
    expect(s.writes.slice(from).every((v) => v === 2000)).toBe(true)
  })

  it('a glide to a target already in place waits for nothing, so a later scroll of the reader is left alone', () => {
    const s = scroller(3000, 1000)
    s.set(1000)
    land(s.page, s.at(() => 1012), bar)
    expect(s.scrollTo).not.toHaveBeenCalled()
    s.set(400) // the reader scrolls up; the browser says the scroll ended
    s.page.dispatchEvent(new Event('scrollend'))
    vi.advanceTimersByTime(2000)
    expect(s.scrollTo).not.toHaveBeenCalled()
    expect(s.top).toBe(400)
  })

  it('a glide to the bottom it cannot reach waits for nothing either', () => {
    const s = scroller(3000, 1000)
    s.set(2000)
    land(s.page, s.at(() => 2900), bar)
    s.set(1500)
    s.page.dispatchEvent(new Event('scrollend'))
    vi.advanceTimersByTime(2000)
    expect(s.scrollTo).not.toHaveBeenCalled()
  })

  it('a glide the reader interrupts is not set right afterwards', () => {
    const s = scroller(5000, 1000)
    land(s.page, s.at(() => 1500), bar)
    expect(s.scrollTo).toHaveBeenCalledTimes(1)
    s.page.dispatchEvent(new WheelEvent('wheel'))
    s.set(200)
    s.page.dispatchEvent(new Event('scrollend'))
    vi.advanceTimersByTime(2000)
    expect(s.scrollTo).toHaveBeenCalledTimes(1)
  })

  it('still lands: a glide is set right once at its end, and leaving the tab cancels a jump', () => {
    const s = scroller(5000, 1000)
    let y = 1500
    land(s.page, s.at(() => y), bar)
    y = 1600 // a card above laid out taller meanwhile
    s.page.dispatchEvent(new Event('scrollend'))
    expect(s.scrollTo).toHaveBeenCalledTimes(2)
    expect(s.top).toBe(1588)
    reduced = true
    let z = 4000
    land(s.page, s.at(() => (z += 30)), bar)
    run(2)
    cancelLanding(s.page)
    const before = s.writes.length
    run(60)
    expect(s.writes.length).toBe(before)
  })
})
