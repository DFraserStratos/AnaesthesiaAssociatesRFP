/**
 * An SVG made safe to put in the page: an artifact is shown inline (so its text can be selected
 * and copied, and anchors can find its elements), so nothing in it may run or reach out. Parsed
 * with DOMParser (which never runs script), then stripped of anything active: script, embedded
 * HTML, event handlers, outside links and styles that load from elsewhere.
 */
import { svgBounds } from '../../shared/artifacts.ts'
import type { Rect } from '../../shared/types.ts'

const DROP = new Set(['script', 'foreignobject', 'iframe', 'object', 'embed', 'audio', 'video', 'canvas', 'set', 'animate', 'animatemotion', 'animatetransform', 'handler', 'listener'])
const SAFE_DATA = /^data:image\/(png|jpe?g|gif|webp);/i
const BAD_STYLE = /url\(\s*['"]?(?!#)|javascript:|expression\(|@import/i

export interface CleanSvg {
  svg: SVGSVGElement
  /** The drawing's own extent (its viewBox), before the viewer takes the viewBox over. */
  bounds: Rect | null
}

export function sanitiseSvg(text: string): CleanSvg {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
  const root = doc.documentElement
  if (doc.getElementsByTagName('parsererror').length || root.nodeName.toLowerCase() !== 'svg') throw new Error('the file is not a readable SVG')
  for (const el of [...root.querySelectorAll('*')]) {
    if (DROP.has(el.localName.toLowerCase())) {
      el.remove()
      continue
    }
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim()
      if (name.startsWith('on')) el.removeAttribute(attr.name)
      else if ((name === 'href' || name === 'xlink:href') && !value.startsWith('#') && !SAFE_DATA.test(value)) el.removeAttribute(attr.name)
      else if (name === 'style' && BAD_STYLE.test(value)) el.removeAttribute(attr.name)
    }
    if (el.localName === 'style' && el.textContent && BAD_STYLE.test(el.textContent)) {
      el.textContent = el.textContent.replace(/@import[^;]*;?/gi, '').replace(/url\(\s*['"]?(?!#)[^)]*\)/gi, 'none')
    }
  }
  for (const attr of [...root.attributes]) if (attr.name.toLowerCase().startsWith('on')) root.removeAttribute(attr.name)
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
