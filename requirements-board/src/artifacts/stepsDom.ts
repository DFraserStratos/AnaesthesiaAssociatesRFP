/**
 * A stepped diagram's state on the live drawing: what is not revealed yet is off (invisible, but
 * still laid out, so `getBBox` and the region boxes keep working), and what the step highlights
 * stays full strength while the rest dims. Only classes are set here; the rules that draw them are
 * in the viewer's shadow-root style sheet (`SHADOW_CSS` in `CanvasViewer.tsx`).
 *
 * The viewer shows a clone of the drawing and re-clones it on every catalogue refresh, so this is
 * applied after every mount, not once: it clears what it set before, so calling it again is safe.
 */
import { FLIGHT_CLASS, anchorElements } from './regionsDom.ts'

/** Not revealed yet at this step. */
export const STEP_OFF = 'rb-step-off'
/** Highlighted at this step: it and everything inside it stay full strength. */
export const STEP_LIT = 'rb-step-lit'
/** An ancestor of a highlighted element: it stays full strength, its other children dim. */
export const STEP_PATH = 'rb-step-path'
/** On the root while something is highlighted: its children that are neither lit nor on the path dim. */
export const STEP_FOCUS = 'rb-step-focus'
/**
 * A shape drawn under a highlighted element and round it (the panel it sits on): it stays full
 * strength, so lit text on a dark panel still reads. The panel's other contents dim as usual.
 */
export const STEP_BACK = 'rb-step-back'
/**
 * Dimmed, and drawn on a dark backdrop (the charcoal panel a highlight sits on): it fades into the
 * panel with opacity instead of being washed toward white, which would make it stand out.
 */
export const STEP_ON_DARK = 'rb-step-on-dark'
/** A move's real `to` element while its copy flies (`stepMoves.ts`): hidden, so it never shows twice. */
export const STEP_FLYING = 'rb-step-flying'
/** Where a move sets off: at full strength while it does, even if the step dims it. */
export const STEP_FROM = 'rb-step-from'

export interface StepView {
  hidden: string[]
  highlight: string[]
}

/** Never marked: they draw nothing themselves. */
const INERT = new Set(['defs', 'style', 'title', 'desc', 'metadata'])
const marked = (el: Element) => !INERT.has(el.localName.toLowerCase()) && !el.closest('defs')
/** The shapes that can be a panel under something. */
const SHAPES = new Set(['rect', 'circle', 'ellipse', 'polygon', 'path', 'image'])
const SLACK = 1

const contains = (o: DOMRect, i: DOMRect) => o.left <= i.left + SLACK && o.top <= i.top + SLACK && o.right >= i.right - SLACK && o.bottom >= i.bottom - SLACK
/** Laid out: a copy not mounted yet has no boxes, so it gets no backdrops until it is. */
const laidOut = (r: DOMRect) => r.width > 0 || r.height > 0

/** A colour's lightness from 0 (black) to 1 (white), or null when it is not a plain colour. */
function lightness(colour: string): number | null {
  const c = colour.trim().toLowerCase()
  let rgb: number[] | null = null
  const fn = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(c)
  if (fn) rgb = fn.slice(1, 4).map(Number)
  else if (/^#[0-9a-f]{6}$/.test(c)) rgb = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
  else if (/^#[0-9a-f]{3}$/.test(c)) rgb = [1, 2, 3].map((i) => parseInt(c[i]! + c[i]!, 16))
  return rgb ? (0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!) / 255 : null
}
const isDark = (el: Element) => (lightness(getComputedStyle(el).fill) ?? lightness(el.getAttribute('fill') ?? '') ?? 1) < 0.35

/**
 * Applies a step's state to a drawing, clearing any earlier one; null is the whole drawing. Every
 * box is read before any class is set, so the drawing is laid out once however large it is.
 */
export function applyStepState(svg: SVGSVGElement, state: StepView | null): void {
  const all = [STEP_OFF, STEP_LIT, STEP_PATH, STEP_BACK, STEP_ON_DARK]
  for (const el of svg.querySelectorAll(all.map((c) => `.${c}`).join(', '))) el.classList.remove(...all)
  svg.classList.remove(STEP_FOCUS)
  if (!state) return
  const off = new Set(state.hidden.flatMap((a) => anchorElements(svg, a)).filter((el) => el !== svg && marked(el)))
  const lit = new Set(state.highlight.flatMap((a) => anchorElements(svg, a)).filter((el) => el !== svg && marked(el)))
  // The path runs up from each outermost lit element; one inside another lit element needs none,
  // since nothing inside a lit element dims.
  const outer = [...lit].filter((el) => ![...lit].some((o) => o !== el && o.contains(el)))
  const path = new Set<Element>()
  for (const el of outer) for (let up: Element | null = el.parentElement; up && up !== svg; up = up.parentElement) path.add(up)

  // Backdrops: shapes painted under an outermost lit element (earlier siblings of it or of an
  // ancestor) whose box holds it.
  const back = new Set<Element>()
  const box = new Map<Element, DOMRect>()
  const rectOf = (el: Element) => box.get(el) ?? (box.set(el, el.getBoundingClientRect()), box.get(el)!)
  for (const el of outer) {
    const r = rectOf(el)
    if (!laidOut(r)) continue
    for (let at: Element = el; at !== svg && at.parentElement; at = at.parentElement) {
      for (let sib = at.previousElementSibling; sib; sib = sib.previousElementSibling) {
        if (SHAPES.has(sib.localName.toLowerCase()) && !off.has(sib) && !lit.has(sib) && laidOut(rectOf(sib)) && contains(rectOf(sib), r)) back.add(sib)
      }
    }
  }
  // What dims sitting on a dark backdrop (after it, inside its box) fades into it instead.
  const onDark = new Set<Element>()
  const darks = lit.size ? [...back].filter(isDark) : []
  if (darks.length) {
    const dims = [svg, ...path].flatMap((p) => [...p.children].filter((c) => marked(c) && !lit.has(c) && !path.has(c) && !back.has(c) && !off.has(c)))
    for (const el of dims) {
      const r = rectOf(el)
      if (laidOut(r) && darks.some((d) => d.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING && contains(rectOf(d), r))) onDark.add(el)
    }
  }

  for (const el of off) el.classList.add(STEP_OFF)
  if (!lit.size) return
  for (const el of lit) el.classList.add(STEP_LIT)
  for (const el of path) el.classList.add(STEP_PATH)
  for (const el of back) el.classList.add(STEP_BACK)
  for (const el of onDark) el.classList.add(STEP_ON_DARK)
  svg.classList.add(STEP_FOCUS)
}

/** Is this node inside something not revealed yet, or a move's copy in flight? Find skips such text. */
export function insideOff(node: Node): boolean {
  const el = node instanceof Element ? node : node.parentElement
  return !!el?.closest(`.${STEP_OFF}, .${FLIGHT_CLASS}`)
}

/**
 * The shadow-root rules for the classes above. Off is invisible but laid out (never
 * `display: none`, which would break `getBBox`). Dimmed is washed toward white by a filter, the
 * look of `STEP_DIM` opacity over white but opaque, so a line drawn behind a dimmed card never
 * shows through it; on a dark backdrop it fades into the panel with that opacity instead. The fade
 * runs only once the root has `STEP_FADE`, which the viewer adds after the first paint, so a drawing
 * opened at a step never fades in from the whole picture.
 */
export const STEP_FADE = 'rb-step-fade'
/** How much of a dimmed element's own colour is left: 0.5 is half way to white (or into the dark panel), so a ledger's earlier entries still read. */
export const STEP_DIM = 0.5
/** Mixing toward white by k: contrast((1 - k) / (1 + k)) then brightness(1 + k) maps c to c + (1 - c) k. */
const WASH = (() => {
  const k = 1 - STEP_DIM
  return `contrast(${((1 - k) / (1 + k)).toFixed(4)}) brightness(${(1 + k).toFixed(4)})`
})()
const NOT_INERT = `:not(.${STEP_OFF}):not(.${STEP_BACK}):not(.${STEP_ON_DARK}):not(.${STEP_FROM}):not(defs):not(style):not(title):not(desc):not(metadata)`
const EASE = '250ms cubic-bezier(0.2, 0.7, 0.2, 1)'
export const STEP_CSS = `
.${STEP_OFF} { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
svg.${STEP_FOCUS} > :not(.${STEP_LIT}):not(.${STEP_PATH})${NOT_INERT},
.${STEP_PATH} > :not(.${STEP_LIT}):not(.${STEP_PATH})${NOT_INERT} { filter: ${WASH} !important; }
.${STEP_ON_DARK}:not(.${STEP_FROM}) { opacity: ${STEP_DIM} !important; }
.${STEP_FLYING} { visibility: hidden !important; }
svg.${STEP_FADE} * { transition: opacity ${EASE}, filter ${EASE}, visibility 0s; }
svg.${STEP_FADE} .${STEP_OFF} { transition: opacity ${EASE}, filter ${EASE}, visibility 0s linear 250ms; }
@media (prefers-reduced-motion: reduce) {
  svg.${STEP_FADE} *, svg.${STEP_FADE} .${STEP_OFF} { transition: none; }
}
`
