/**
 * An SVG made safe to put in the page: an artifact is shown inline (so its text can be selected
 * and copied, and anchors can find its elements), so nothing in it may run or reach out. Parsed
 * with DOMParser (which never runs script), then stripped of anything active: script, elements
 * from other vocabularies (HTML, MathML), event handlers, links and styles that load from or go
 * elsewhere. What a browser resolves decides, not how it is written: an attribute is judged by its
 * local name in any namespace (an XLink `href` under any prefix), and CSS with its escapes undone.
 * What stays is the drawing's own: links and references to its own elements (`#id`, `url(#id)`)
 * and pictures as data in an attribute (CSS loads nothing, not even data).
 */
import { svgBounds } from '../../shared/artifacts.ts'
import type { Rect } from '../../shared/types.ts'

const SVG_NS = 'http://www.w3.org/2000/svg'
const XMLNS_NS = 'http://www.w3.org/2000/xmlns/'
const DROP = new Set(['script', 'foreignobject', 'iframe', 'object', 'embed', 'audio', 'video', 'canvas', 'set', 'animate', 'animatemotion', 'animatetransform', 'handler', 'listener'])
/** Attributes a browser may follow or load from, in any namespace: only a reference to the drawing itself, or a picture as data, may stay. */
const URL_ATTRS = new Set(['href', 'src', 'srcset', 'action', 'formaction', 'data', 'poster', 'background', 'codebase', 'cite', 'longdesc', 'usemap', 'ping', 'lowsrc', 'dynsrc', 'manifest', 'icon', 'archive', 'classid', 'profile', 'base'])
/** Attributes that steer where a link opens, or forge the marks the board puts on its own record links (`svgLinks.ts`). */
const STRIP = new Set(['target', 'download', 'data-record'])
const SAFE_DATA = /^data:image\/(png|jpe?g|gif|webp)[;,]/i
/** CSS that loads from elsewhere or runs: `url()` or `src()` to anything but `#id`, image functions, `@import`, script. */
const OUTSIDE_CSS = /(?:url|src)\((?!\s*['"]?#)|(?:image-set|image|cross-fade|element)\(|@import|javascript:|expression\(/i
/** Attributes that hold names or text, never CSS: not read as CSS, so "Upload image(s)" in a label stays. */
const TEXT_ATTRS = /^(?:id|class|role|lang|tabindex|aria-.*|data-.*)$/

/** A link or resource reference that stays inside the drawing: `#id` (not a board route, `#/...`), or a picture as data. */
function ownRef(value: string): boolean {
  // A browser skips spaces and control characters around a URL, and tabs and newlines inside it:
  // all of them go before the test (which only decides; the value is kept as written).
  const v = value.replace(/[\u0000-\u0020\u007f]/g, '')
  return (v.startsWith('#') && !v.startsWith('#/')) || SAFE_DATA.test(v)
}

/**
 * Does this CSS reach out, as a browser could read it? Newlines normalised (a CRLF after an escape
 * is one), escapes undone (`u\72l(` is `url(`), and tested both with comments taken out and with
 * them left in, since a `/*` inside a string is no comment: either reading reaching out is enough.
 */
function outsideCss(css: string): boolean {
  const plain = css.replace(/\r\n?|\f/g, '\n').replace(/\\([0-9a-f]{1,6})[ \t\n]?|\\([^\n0-9a-f])/gi, (_, hex: string | undefined, ch: string | undefined) => {
    if (ch !== undefined) return ch
    const n = parseInt(hex!, 16)
    return n === 0 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff) ? '\ufffd' : String.fromCodePoint(n)
  })
  return OUTSIDE_CSS.test(plain) || OUTSIDE_CSS.test(plain.replace(/\/\*[\s\S]*?\*\//g, ''))
}

/**
 * A `<style>` element's text with each declaration, selector or at-rule that reaches out taken out,
 * the rest kept exactly as written. It is cut at `;`, `{` and `}` as written, so the work is linear
 * whatever the text holds (a large embedded font included); if what is left could still reach out
 * (a cut inside a string), nothing is kept.
 */
function cleanStyle(css: string): string {
  if (!outsideCss(css)) return css
  const kept = css
    .split(/([;{}])/)
    .map((part, i) => (i % 2 === 0 && outsideCss(part) ? '' : part))
    .join('')
  return outsideCss(kept) ? '' : kept
}

export interface CleanSvg {
  svg: SVGSVGElement
  /** The drawing's own extent (its viewBox), before the viewer takes the viewBox over. */
  bounds: Rect | null
}

export function sanitiseSvg(text: string): CleanSvg {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
  const root = doc.documentElement
  if (doc.getElementsByTagName('parsererror').length || root.localName !== 'svg' || root.namespaceURI !== SVG_NS) throw new Error('the file is not a readable SVG')
  for (const el of [root, ...root.querySelectorAll('*')]) {
    if (el !== root && (el.namespaceURI !== SVG_NS || DROP.has(el.localName.toLowerCase()))) {
      el.remove()
      continue
    }
    for (const attr of [...el.attributes]) {
      if (attr.namespaceURI === XMLNS_NS) continue
      const name = attr.localName.toLowerCase()
      const drop = name.startsWith('on') || STRIP.has(name) || (URL_ATTRS.has(name) ? !ownRef(attr.value) : !TEXT_ATTRS.test(name) && outsideCss(attr.value))
      if (drop) el.removeAttributeNode(attr)
    }
    if (el.localName === 'style' && el.textContent) {
      const css = cleanStyle(el.textContent)
      if (css !== el.textContent) el.textContent = css
    }
  }
  const attrs: Record<string, string> = {}
  for (const a of root.attributes) attrs[a.name] = a.value
  const bounds = svgBounds(attrs)
  // The root's own <title> would hover a tooltip over the whole canvas: it names the drawing instead.
  const title = [...root.children].find((c) => c.localName === 'title')
  if (title) {
    root.setAttribute('aria-label', title.textContent?.trim() ?? '')
    title.remove()
  }
  root.setAttribute('role', 'img')
  for (const a of ['width', 'height', 'style', 'x', 'y']) root.removeAttribute(a)
  const svg = document.importNode(root, true) as unknown as SVGSVGElement
  return { svg, bounds }
}

/** A raster image as an SVG of its own size, so it pans, zooms and takes a region box like a drawing. */
export function rasterSvg(url: string, w: number, h: number): CleanSvg {
  const NS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
  const img = document.createElementNS(NS, 'image')
  img.setAttribute('href', url)
  img.setAttribute('width', String(w))
  img.setAttribute('height', String(h))
  svg.appendChild(img)
  return { svg, bounds: { x: 0, y: 0, w, h } }
}
