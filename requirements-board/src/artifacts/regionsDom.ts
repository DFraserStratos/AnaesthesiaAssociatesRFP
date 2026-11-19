/**
 * Finding a region on screen: the elements its anchors name, and the box round all of them
 * together (the capture recipes' rule). Canvas boxes are in the drawing's own units; document
 * boxes are in pixels from the top left of the element holding the text.
 */
import { boxRect, looseChars, looseText, normText, padRect, parseAnchor, unionRects } from '../../shared/artifacts.ts'
import { HIGHLIGHT } from '../../shared/highlight.ts'
import type { Rect, Region } from '../../shared/types.ts'

const cssEscape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * The copy of a travelling element a stepped diagram flies while it moves (`stepMoves.ts`). It is
 * never an anchor's match: anchors name the drawing's own elements.
 */
export const FLIGHT_CLASS = 'rb-step-flight'

/** The elements one anchor matches in a drawing (never a flight's copy). */
export function anchorElements(svg: SVGSVGElement, anchor: string): Element[] {
  return matchAnchor(svg, anchor).filter((el) => !el.closest(`.${FLIGHT_CLASS}`))
}

function matchAnchor(svg: SVGSVGElement, anchor: string): Element[] {
  const { kind, value } = parseAnchor(anchor)
  if (kind === 'text') {
    const want = normText(value)
    return [...svg.querySelectorAll('text')].filter((t) => normText(t.textContent ?? '') === want)
  }
  if (kind === 'node') {
    const id = value.trim()
    const re = new RegExp(`(^|-)flowchart-${cssEscape(id)}-\\d+$`)
    return [...svg.querySelectorAll('g.node')].filter((g) => g.getAttribute('data-id') === id || re.test(g.id))
  }
  if (kind === 'css') {
    try {
      return [...svg.querySelectorAll(value)]
    } catch {
      return []
    }
  }
  return []
}

/** Something drawn, with a box and a place on screen (by what it can do, so a test's stand-in passes too). */
export const isGraphic = (el: Element): el is SVGGraphicsElement => typeof (el as SVGGraphicsElement).getBBox === 'function' && typeof (el as SVGGraphicsElement).getScreenCTM === 'function'

/** An element's box in the drawing's root units, through every transform between them. */
export function boxInRoot(svg: SVGSVGElement, el: Element): Rect | null {
  if (!isGraphic(el)) return null
  const rootCtm = svg.getScreenCTM()
  const ctm = el.getScreenCTM()
  if (!rootCtm || !ctm) return null
  let b: DOMRect
  try {
    b = el.getBBox()
  } catch {
    return null
  }
  const m = rootCtm.inverse().multiply(ctm)
  const pts = [
    new DOMPoint(b.x, b.y),
    new DOMPoint(b.x + b.width, b.y),
    new DOMPoint(b.x, b.y + b.height),
    new DOMPoint(b.x + b.width, b.y + b.height),
  ].map((p) => p.matrixTransform(m))
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
}

/** The box round everything some anchors match in a drawing (unpadded), or null when they match nothing drawn. */
export function anchorsRect(svg: SVGSVGElement, anchors: string[]): Rect | null {
  return unionRects(anchors.flatMap((a) => anchorElements(svg, a)).filter((el) => el !== svg).map((el) => boxInRoot(svg, el)).filter((r): r is Rect => !!r && (r.w > 0 || r.h > 0)))
}

/** A region's box in a drawing (padded), or null when nothing it names is there. */
export function canvasRegionRect(svg: SVGSVGElement, region: Region): Rect | null {
  const rects = region.around.flatMap((a) => anchorElements(svg, a)).map((el) => boxInRoot(svg, el)).filter((r): r is Rect => !!r && (r.w > 0 || r.h > 0))
  const pad = region.pad ?? HIGHLIGHT.pad
  const found = unionRects(rects)
  if (found) return padRect(found, pad)
  return region.box && region.box.every(Number.isFinite) ? boxRect(region.box) : null
}

/* -------------------------------------------------------------- documents */

/**
 * An element that shows something other than its source text: a bare record ID drawn as the record's
 * title (`Prose.tsx`) carries the ID it was written as, and quotes match on that, as the check does.
 */
export const SOURCE_TEXT_ATTR = 'data-source-text'

/**
 * A DOM range over a passage, matched as `looseText` (whitespace and emphasis marks ignored, NFC on
 * both sides, `looseChars`), across element boundaries. Null when the passage is not there.
 */
export function quoteRange(container: Element, quote: string): Range | null {
  const want = looseText(quote)
  if (!want) return null
  // Each loose character, with where it starts and ends in the page.
  const at: { start: [Node, number]; end: [Node, number] }[] = []
  let loose = ''
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = (node as Text).data
      for (const c of looseChars(t)) {
        loose += c.ch
        at.push({ start: [node, c.from], end: [node, c.to] })
      }
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const source = (node as Element).getAttribute(SOURCE_TEXT_ATTR)
    if (source !== null) {
      // The whole element stands for its source text: any part of it boxes all of it.
      for (const c of looseChars(source)) {
        loose += c.ch
        at.push({ start: [node, 0], end: [node, node.childNodes.length] })
      }
      return
    }
    for (const child of node.childNodes) walk(child)
  }
  walk(container)
  const i = loose.indexOf(want)
  if (i < 0) return null
  const range = document.createRange()
  range.setStart(...at[i]!.start)
  range.setEnd(...at[i + want.length - 1]!.end)
  return range
}

/** A client rect relative to an element's top left (its scroll included). */
export function relativeTo(el: Element, r: { left: number; top: number; width: number; height: number }): Rect {
  const o = el.getBoundingClientRect()
  return { x: r.left - o.left + el.scrollLeft, y: r.top - o.top + el.scrollTop, w: r.width, h: r.height }
}

/** The union of the visible rects of some elements and ranges, relative to `frame`. */
export function unionIn(frame: Element, parts: (Element | Range)[]): Rect | null {
  const rects = parts.flatMap((p) => [...p.getClientRects()]).filter((r) => r.width > 0 && r.height > 0)
  return unionRects(rects.map((r) => relativeTo(frame, r)))
}
