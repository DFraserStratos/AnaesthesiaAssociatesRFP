/**
 * A stepped diagram's moves: on stepping forward onto a step, what travels flies from where it
 * sets off to where it lands. Each `to` element is flown as a copy appended last to the drawing (so
 * it passes over every panel on the way, whatever the drawing's order), set in place by the same
 * transforms as the real one; the real element stays hidden until its copy lands, and the copy goes.
 * Afterwards nothing is left: no copy, no inline style, no class, so the drawing is exactly the static
 * one. The flight is a Web Animation in the drawing's own units, so panning and zooming during one
 * still look right.
 */
import type { Step, StepMove } from '../../shared/types.ts'
import { FLIGHT_CLASS, anchorElements, boxInRoot, isGraphic } from './regionsDom.ts'
import { STEP_FLYING as FLYING, STEP_FROM as FROM, STEP_LIT, type StepView } from './stepsDom.ts'

/** How long one move takes, and how far each later move starts after the one before. */
export const MOVE_MS = 700
export const MOVE_STAGGER_MS = 150
const MOVE_EASE = 'cubic-bezier(0.45, 0, 0.25, 1)'

/**
 * The moves that play on arriving at `next` from `prev`: only stepping forward by exactly one from
 * a step (never from the whole drawing, never a jump, never backward).
 */
export function movesToPlay(steps: Pick<Step, 'moves'>[], prev: number | null, next: number): StepMove[] {
  if (prev === null || prev < 0 || next !== prev + 1) return []
  return steps[next]?.moves ?? []
}

/** The drawing as it stood before the first step: everything any step reveals is still hidden. */
export function beforeSteps(steps: Pick<Step, 'show'>[]): StepView {
  const hidden: string[] = []
  for (const s of steps) for (const a of s.show.map((x) => x.trim()).filter(Boolean)) if (!hidden.includes(a)) hidden.push(a)
  return { hidden, highlight: [] }
}

export interface PlannedFlight {
  from: Element
  to: Element
  /** When it sets off, after the step arrives. */
  delay: number
}

/**
 * Which element flies from which, and when: moves in listed order, a stagger apart; `from` is its
 * first match, and every match of `to` flies from it together. A move whose anchors match nothing is
 * left out (the check reports it).
 */
export function planFlights(svg: SVGSVGElement, moves: StepMove[]): PlannedFlight[] {
  const out: PlannedFlight[] = []
  moves.forEach((m, i) => {
    const from = m.from.trim() ? anchorElements(svg, m.from)[0] : undefined
    if (!from) return
    for (const to of m.to.trim() ? anchorElements(svg, m.to) : []) if (to !== from && to !== svg) out.push({ from, to, delay: i * MOVE_STAGGER_MS })
  })
  return out
}

/** A flight under way: cancel it to put the drawing straight at once. */
export interface Flight {
  cancel(): void
}

const NS = 'http://www.w3.org/2000/svg'
/** What a copy set at the root must carry over from where the real element sits, so it looks the same. */
const INHERITED = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'letter-spacing', 'color', 'paint-order']

/** The uniform scale that takes the landing box to the size of the one it sets off from (kept within reason). */
export function flightScale(from: { w: number; h: number }, to: { w: number; h: number }): number {
  const sx = to.w > 0 && from.w > 0 ? from.w / to.w : 1
  const sy = to.h > 0 && from.h > 0 ? from.h / to.h : 1
  return Math.min(4, Math.max(0.25, Math.sqrt(sx * sy)))
}

/**
 * Flies each planned move: returns null when there is nothing to fly. `onDone` runs once every
 * flight has landed (not when cancelled). `wait` holds every move back that long (ms) first, each
 * copy sitting at its start meanwhile: the view framing a followed step settles before anything flies.
 */
export function playFlights(svg: SVGSVGElement, moves: StepMove[], onDone?: () => void, wait = 0): Flight | null {
  const root = svg.getScreenCTM()
  if (!root) return null
  const inv = root.inverse()
  const made: Element[] = []
  const marked: [Element, string][] = []
  const anims: Animation[] = []
  for (const { from, to, delay } of planFlights(svg, moves)) {
    const a = boxInRoot(svg, from)
    const b = boxInRoot(svg, to)
    const ctm = isGraphic(to) ? to.getScreenCTM() : null
    if (!a || !b || !ctm || (!b.w && !b.h)) continue
    // The copy: placed by the real element's whole transform (its own `transform` included, so the
    // copy drops it), carrying what it would inherit where it sits.
    const place = document.createElementNS(NS, 'g')
    const m = inv.multiply(ctm)
    place.setAttribute('transform', `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`)
    const inherit = to.parentElement ? getComputedStyle(to.parentElement) : null
    if (inherit) place.setAttribute('style', INHERITED.map((p) => `${p}:${inherit.getPropertyValue(p)}`).join(';'))
    const copy = to.cloneNode(true) as Element
    copy.removeAttribute('transform')
    place.append(copy)
    const wrap = document.createElementNS(NS, 'g')
    // Lit, so the step's dimming never reaches it in flight.
    wrap.setAttribute('class', `${FLIGHT_CLASS} ${STEP_LIT}`)
    wrap.setAttribute('aria-hidden', 'true')
    wrap.setAttribute('style', 'transform-box: view-box; transform-origin: 0 0; pointer-events: none')
    wrap.append(place)
    svg.append(wrap)
    made.push(wrap)
    for (const [el, cls] of [[to, FLYING], [from, FROM]] as const) {
      if (!el.classList.contains(cls)) {
        el.classList.add(cls)
        marked.push([el, cls])
      }
    }
    // Set off at the start's centre and size, and land on its own: a translate and a uniform scale
    // about the root's origin, so the centre travels in a straight line.
    const s = flightScale(a, b)
    const tx = a.x + a.w / 2 - s * (b.x + b.w / 2)
    const ty = a.y + a.h / 2 - s * (b.y + b.h / 2)
    anims.push(wrap.animate([{ transform: `translate(${tx}px, ${ty}px) scale(${s})` }, { transform: 'translate(0px, 0px) scale(1)' }], { duration: MOVE_MS, delay: wait + delay, easing: MOVE_EASE, fill: 'backwards' }))
  }
  if (!anims.length) return null
  let over = false
  const end = (landed: boolean) => {
    if (over) return
    over = true
    for (const an of anims) an.cancel()
    for (const n of made) n.remove()
    for (const [el, cls] of marked) el.classList.remove(cls)
    if (landed) onDone?.()
  }
  Promise.all(anims.map((an) => an.finished)).then(
    () => end(true),
    () => end(false),
  )
  return { cancel: () => end(false) }
}
