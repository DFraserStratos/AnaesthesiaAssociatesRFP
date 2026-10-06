/**
 * Finding a region on screen: the elements its anchors name, and the box round all of them
 * together (the capture recipes' rule). Canvas boxes are in the drawing's own units; document
 * boxes are in pixels from the top left of the element holding the text.
 */
import { boxRect, looseText, normText, padRect, parseAnchor, unionRects } from '../../shared/artifacts.ts'
import { HIGHLIGHT } from '../../shared/highlight.ts'
import type { Rect, Region } from '../../shared/types.ts'

const cssEscape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The elements one anchor matches in a drawing. */
export function anchorElements(svg: SVGSVGElement, anchor: string): Element[] {
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

/** An element's box in the drawing's root units, through every transform between them. */
function boxInRoot(svg: SVGSVGElement, el: Element): Rect | null {
  if (!(el instanceof SVGGraphicsElement)) return null
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

/** A region's box in a drawing (padded), or null when nothing it names is there. */
export function canvasRegionRect(svg: SVGSVGElement, region: Region): Rect | null {
  const rects = region.around.flatMap((a) => anchorElements(svg, a)).map((el) => boxInRoot(svg, el)).filter((r): r is Rect => !!r && (r.w > 0 || r.h > 0))
  const pad = region.pad ?? HIGHLIGHT.pad
  const found = unionRects(rects)
  if (found) return padRect(found, pad)
  return region.box && region.box.every(Number.isFinite) ? boxRect(region.box) : null
}

/* -------------------------------------------------------------- documents */

const LOOSE_SKIP = /[\s*_`|\\]/

/**
 * A DOM range over a passage, matched as `looseText` (whitespace and emphasis marks ignored),
 * across element boundaries. Null when the passage is not there.
 */
export function quoteRange(container: Element, quote: string): Range | null {
  const want = looseText(quote)
  if (!want) return null
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const at: [Text, number][] = []
  let loose = ''
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const t = n.data
    for (let i = 0; i < t.length; i++) {
      if (LOOSE_SKIP.test(t[i]!)) continue
      loose += t[i]
      at.push([n, i])
    }
  }
  const i = loose.indexOf(want)
  if (i < 0) return null
  const range = document.createRange()
  const [sn, so] = at[i]!
  const [en, eo] = at[i + want.length - 1]!
  range.setStart(sn, so)
  range.setEnd(en, eo + 1)
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
