// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Step } from '../shared/types.ts'
import { sanitiseSvg } from '../src/artifacts/sanitise.ts'
import { MOVE_STAGGER_MS, beforeSteps, flightScale, movesToPlay, planFlights, playFlights } from '../src/artifacts/stepMoves.ts'

const step = (id: string, over: Partial<Step> = {}): Step => ({ id, name: id, group: '', caption: '', show: [], highlight: [], moves: [], balances: [], ...over })
const STEPS = [
  step('one', { show: ['#a'], moves: [{ from: '#x', to: '#a' }] }),
  step('two', { show: ['#b'], moves: [{ from: '#a', to: '#b' }] }),
  step('three', { show: ['#c'] }),
]

describe('which moves play', () => {
  it('plays a step\'s moves only on stepping forward onto it by exactly one, from a step', () => {
    expect(movesToPlay(STEPS, 0, 1)).toEqual([{ from: '#a', to: '#b' }])
    expect(movesToPlay(STEPS, 1, 2)).toEqual([])
  })
  it('never from the whole drawing, on a jump, or going back', () => {
    expect(movesToPlay(STEPS, null, 0)).toEqual([])
    expect(movesToPlay(STEPS, -1, 0)).toEqual([])
    expect(movesToPlay(STEPS, -1, 1)).toEqual([])
    expect(movesToPlay(STEPS, 0, 2)).toEqual([])
    expect(movesToPlay(STEPS, 2, 1)).toEqual([])
    expect(movesToPlay(STEPS, 1, 1)).toEqual([])
  })
  it('replays the first step from before any step: everything any step reveals hidden', () => {
    expect(beforeSteps([step('a', { show: ['#a', ' #b '] }), step('b', { show: ['#b', '#c'] })])).toEqual({ hidden: ['#a', '#b', '#c'], highlight: [] })
  })
  it('scales by the two boxes, evenly, within reason', () => {
    expect(flightScale({ w: 100, h: 20 }, { w: 100, h: 20 })).toBe(1)
    expect(flightScale({ w: 200, h: 80 }, { w: 100, h: 20 })).toBeCloseTo(Math.sqrt(8))
    expect(flightScale({ w: 1000, h: 1000 }, { w: 10, h: 10 })).toBe(4)
    expect(flightScale({ w: 0, h: 20 }, { w: 100, h: 20 })).toBe(1)
  })
})

const drawing = () =>
  sanitiseSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
<g id="ours"><rect id="ours-pay" class="chip" x="10" y="10" width="80" height="20"/><rect id="ours-rec" class="chip" x="10" y="40" width="80" height="20"/></g>
<g id="theirs"><rect id="t-pay" class="entry" x="300" y="10" width="80" height="20" transform="translate(5 0)"/><rect id="t-rec" class="entry" x="300" y="40" width="80" height="20"/></g>
</svg>`).svg

describe('planning a step\'s flights', () => {
  it('flies every match of to from the first match of from, moves a stagger apart, in listed order', () => {
    const svg = drawing()
    const plan = planFlights(svg, [
      { from: '.chip', to: '#t-pay' },
      { from: '#ours-rec', to: '.entry' },
      { from: '#nowhere', to: '#t-rec' },
      { from: '#ours-pay', to: '' },
    ])
    expect(plan.map((p) => `${p.from.id}>${p.to.id}@${p.delay}`)).toEqual([
      'ours-pay>t-pay@0',
      `ours-rec>t-pay@${MOVE_STAGGER_MS}`,
      `ours-rec>t-rec@${MOVE_STAGGER_MS}`,
    ])
  })
})

/**
 * jsdom lays nothing out and has no Web Animations: give it an identity screen matrix, boxes from
 * the rects' own attributes, and animations whose end the test decides.
 */
describe('flying, cancelling and landing', () => {
  const ident = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, inverse: () => ident, multiply: () => ident }
  let ends: { land: () => void; cancelled: boolean }[] = []
  const saved: Record<string, unknown> = {}
  beforeEach(() => {
    ends = []
    const g = globalThis as Record<string, unknown>
    saved.DOMPoint = g.DOMPoint
    g.DOMPoint = class {
      x: number
      y: number
      constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
      }
      matrixTransform() {
        return this
      }
    }
    const proto = SVGElement.prototype as unknown as Record<string, unknown>
    saved.getScreenCTM = proto.getScreenCTM
    saved.getBBox = proto.getBBox
    saved.animate = (Element.prototype as unknown as Record<string, unknown>).animate
    proto.getScreenCTM = () => ident
    proto.getBBox = function (this: Element) {
      const n = (k: string) => Number(this.getAttribute(k) ?? 0)
      return { x: n('x'), y: n('y'), width: n('width'), height: n('height') }
    }
    ;(Element.prototype as unknown as Record<string, unknown>).animate = () => {
      let land!: () => void
      let fail!: (e: unknown) => void
      const finished = new Promise<void>((res, rej) => ((land = res), (fail = rej)))
      const rec = { land: () => land(), cancelled: false }
      ends.push(rec)
      return { finished, cancel: () => ((rec.cancelled = true), fail(new Error('cancelled'))) }
    }
  })
  afterEach(() => {
    const g = globalThis as Record<string, unknown>
    g.DOMPoint = saved.DOMPoint
    const proto = SVGElement.prototype as unknown as Record<string, unknown>
    proto.getScreenCTM = saved.getScreenCTM
    proto.getBBox = saved.getBBox
    ;(Element.prototype as unknown as Record<string, unknown>).animate = saved.animate
  })

  const snapshot = (svg: SVGSVGElement) => svg.outerHTML
  const tick = () => new Promise((r) => setTimeout(r, 0))

  it('flies a copy drawn last, hides the real element and keeps its start at full strength, then leaves nothing behind', async () => {
    const svg = drawing()
    document.body.append(svg)
    const before = snapshot(svg)
    let landed = 0
    const flight = playFlights(svg, [{ from: '#ours-pay', to: '#t-pay' }], () => landed++)
    expect(flight).not.toBeNull()
    const copy = svg.lastElementChild!
    expect(copy.getAttribute('class')).toBe('rb-step-flight rb-step-lit')
    // The copy drops its own transform: the placement carries it.
    expect(copy.querySelector('rect')!.getAttribute('transform')).toBeNull()
    expect(svg.querySelector('#t-pay')!.getAttribute('class')).toContain('rb-step-flying')
    expect(svg.querySelector('#ours-pay')!.getAttribute('class')).toContain('rb-step-from')
    ends.forEach((e) => e.land())
    await tick()
    expect(landed).toBe(1)
    expect(snapshot(svg)).toBe(before)
    svg.remove()
  })

  it('cancelled mid-flight, puts the drawing straight at once and does not report landing', async () => {
    const svg = drawing()
    const before = snapshot(svg)
    let landed = 0
    const flight = playFlights(svg, [{ from: '#ours-pay', to: '.entry' }, { from: '#ours-rec', to: '#t-rec' }], () => landed++)!
    expect(svg.querySelectorAll('.rb-step-flight')).toHaveLength(3)
    flight.cancel()
    expect(ends.every((e) => e.cancelled)).toBe(true)
    expect(snapshot(svg)).toBe(before)
    flight.cancel() // twice is harmless
    await tick()
    expect(landed).toBe(0)
    expect(snapshot(svg)).toBe(before)
  })

  it('leaves a class the element already had', async () => {
    const svg = drawing()
    svg.querySelector('#t-pay')!.classList.add('rb-step-flying')
    const before = snapshot(svg)
    playFlights(svg, [{ from: '#ours-pay', to: '#t-pay' }])!.cancel()
    expect(snapshot(svg)).toBe(before)
  })

  it('has nothing to fly when the anchors match nothing', () => {
    const svg = drawing()
    expect(playFlights(svg, [{ from: '#nowhere', to: '#t-pay' }])).toBeNull()
    expect(svg.querySelector('.rb-step-flight')).toBeNull()
  })
})
