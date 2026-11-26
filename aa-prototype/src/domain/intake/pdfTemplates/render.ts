/**
 * Drawing a laid-out page as an SVG data URL, and the scan effect: a landscape page turned onto a portrait scan, a
 * small skew on the glass, a grey cast and grain, the scanner's edge shadow, an optional cut right edge. The same
 * transform carries each read value's box from the content onto the page, so a box still lands on its text.
 */

import type { PdfBox, PdfScan } from '../../types'
import { FONT_STACKS, type ContentSpot, type DrawOp, type PageLayout } from './engine'
import { seededSequence } from './doc'

/** An affine transform: x' = a x + c y + e, y' = b x + d y + f (SVG's matrix order). */
export interface Affine {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

const IDENTITY: Affine = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }

function compose(m: Affine, n: Affine): Affine {
  // m after n.
  return {
    a: m.a * n.a + m.c * n.b,
    b: m.b * n.a + m.d * n.b,
    c: m.a * n.c + m.c * n.d,
    d: m.b * n.c + m.d * n.d,
    e: m.a * n.e + m.c * n.f + m.e,
    f: m.b * n.e + m.d * n.f + m.f,
  }
}

function apply(m: Affine, x: number, y: number): [number, number] {
  return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]
}

/** How the content sits on the page: the page's size and the content-to-page transform. */
export interface PageFrame {
  width: number
  height: number
  contentWidth: number
  contentHeight: number
  m: Affine
  /** The content clipped to this width (a scan with its right edge cut), else undefined. */
  clipWidth?: number
}

/** The frame for content of a size, scanned or not: a rotated scan turns landscape content onto a portrait page. */
export function frameOf(contentWidth: number, contentHeight: number, scan: PdfScan | undefined): PageFrame {
  if (scan === undefined) return { width: contentWidth, height: contentHeight, contentWidth, contentHeight, m: IDENTITY }
  const rotated = scan.rotated === true && contentWidth > contentHeight
  const width = rotated ? contentHeight : contentWidth
  const height = rotated ? contentWidth : contentHeight
  // Turned a quarter anticlockwise: the content's top runs up the page's left edge.
  const turn: Affine = rotated ? { a: 0, b: -1, c: 1, d: 0, e: 0, f: contentWidth } : IDENTITY
  const theta = ((scan.skewDeg ?? 0) * Math.PI) / 180
  const cx = width / 2
  const cy = height / 2
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  const skew: Affine = { a: cos, b: sin, c: -sin, d: cos, e: cx - cos * cx + sin * cy, f: cy - sin * cx - cos * cy }
  // A scan sits a little in from the glass's edge, slightly reduced.
  const inset: Affine = { a: 0.97, b: 0, c: 0, d: 0.97, e: width * 0.015, f: height * 0.012 }
  return {
    width,
    height,
    contentWidth,
    contentHeight,
    m: compose(skew, compose(inset, turn)),
    ...(scan.clipRight === true ? { clipWidth: contentWidth - 10 } : {}),
  }
}

const round = (n: number) => Math.round(n * 10) / 10

/** A content box carried onto the page: the corners transformed, their bounds taken, kept inside the page. */
export function pageBox(frame: PageFrame, page: number, spot: ContentSpot): PdfBox {
  const pts = [apply(frame.m, spot.x0, spot.y0), apply(frame.m, spot.x1, spot.y0), apply(frame.m, spot.x0, spot.y1), apply(frame.m, spot.x1, spot.y1)]
  const x0 = Math.max(0, Math.min(...pts.map((p) => p[0])))
  const y0 = Math.max(0, Math.min(...pts.map((p) => p[1])))
  const x1 = Math.min(frame.width, Math.max(...pts.map((p) => p[0])))
  const y1 = Math.min(frame.height, Math.max(...pts.map((p) => p[1])))
  return { page, x: round(x0), y: round(y0), width: round(Math.max(0, x1 - x0)), height: round(Math.max(0, y1 - y0)) }
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const n = (v: number) => String(Math.round(v * 100) / 100)

function opSvg(op: DrawOp): string {
  switch (op.kind) {
    case 'raw':
      return op.svg
    case 'line':
      return `<line x1="${n(op.x1)}" y1="${n(op.y1)}" x2="${n(op.x2)}" y2="${n(op.y2)}" stroke="${op.stroke}" stroke-width="${n(op.width)}"${op.dash !== undefined ? ` stroke-dasharray="${op.dash}"` : ''}/>`
    case 'rect':
      return `<rect x="${n(op.x)}" y="${n(op.y)}" width="${n(op.w)}" height="${n(op.h)}" fill="${op.fill ?? 'none'}"${op.stroke !== undefined ? ` stroke="${op.stroke}" stroke-width="${n(op.strokeWidth ?? 0.75)}"` : ''}${op.rx !== undefined ? ` rx="${n(op.rx)}"` : ''}/>`
    case 'text': {
      const s = op.style
      const font = s.font ?? 'helvetica'
      const attrs = [
        `x="${n(op.x)}"`,
        `y="${n(op.baseline - (s.rise ?? 0))}"`,
        `font-size="${n(s.size)}"`,
        font !== 'helvetica' ? `font-family="${esc(FONT_STACKS[font].family)}"` : '',
        s.bold === true ? 'font-weight="700"' : '',
        s.italic === true ? 'font-style="italic"' : '',
        s.fill !== undefined && s.fill !== '#000' ? `fill="${s.fill}"` : '',
        op.width > 0 ? `textLength="${n(op.width)}" lengthAdjust="spacingAndGlyphs"` : '',
        op.key !== undefined ? `data-key="${esc(op.key)}"` : '',
      ].filter((a) => a !== '')
      return `<text ${attrs.join(' ')}>${esc(op.text)}</text>`
    }
  }
}

/** The scan's look: a grey cast and a touch of blur on the ink, grain, specks, the glass edge and its shadow. */
function scanDefs(seed: string): { defs: string; overlay: (w: number, h: number) => string } {
  const next = seededSequence(`scan|${seed}`)
  const grainSeed = Math.floor(next() * 1000)
  const defs = `
    <filter id="scanInk" x="-2%" y="-2%" width="104%" height="104%" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="0.30 0.55 0.15 0 0.02  0.30 0.55 0.15 0 0.02  0.29 0.54 0.15 0 0.01  0 0 0 1 0"/>
      <feComponentTransfer><feFuncR type="gamma" amplitude="1" exponent="1.25" offset="0"/><feFuncG type="gamma" amplitude="1" exponent="1.25" offset="0"/><feFuncB type="gamma" amplitude="1" exponent="1.25" offset="0"/></feComponentTransfer>
      <feGaussianBlur stdDeviation="0.28"/>
    </filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${grainSeed}"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.11"/></feComponentTransfer>
    </filter>
    <linearGradient id="glassEdge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2E302D" stop-opacity="0.32"/>
      <stop offset="0.025" stop-color="#2E302D" stop-opacity="0.06"/>
      <stop offset="0.06" stop-color="#2E302D" stop-opacity="0"/>
      <stop offset="0.97" stop-color="#2E302D" stop-opacity="0"/>
      <stop offset="1" stop-color="#2E302D" stop-opacity="0.14"/>
    </linearGradient>`
  const specks = Array.from({ length: 40 }, () => [next(), next(), next(), next()] as const)
  return {
    defs,
    overlay: (w, h) =>
      `<rect width="${w}" height="${h}" fill="url(#glassEdge)"/>
      <rect width="${w}" height="${h}" filter="url(#grain)"/>
      ${specks.map(([x, y, r, o]) => `<circle cx="${n(x * w)}" cy="${n(y * h)}" r="${n(0.35 + r * 0.9)}" fill="#3F4240" fill-opacity="${n(0.1 + o * 0.3)}"/>`).join('')}`,
  }
}

/** One page as an SVG data URL, in the page's own units (its `viewBox`). */
export function renderPage(page: PageLayout, frame: PageFrame, opts: { scanned: boolean; seed: string; paper?: string }): string {
  const { width: w, height: h, contentWidth: cw, contentHeight: ch } = frame
  const body = page.ops.map(opSvg).join('')
  const matrix = `matrix(${[frame.m.a, frame.m.b, frame.m.c, frame.m.d, frame.m.e, frame.m.f].map((v) => String(Math.round(v * 1e6) / 1e6)).join(' ')})`
  let svg: string
  if (!opts.scanned) {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${esc(FONT_STACKS.helvetica.family)}"><rect width="${w}" height="${h}" fill="${opts.paper ?? '#FFFFFF'}"/>${body}</svg>`
  } else {
    const scan = scanDefs(opts.seed)
    const clip = frame.clipWidth !== undefined ? `<clipPath id="cut"><rect width="${n(frame.clipWidth)}" height="${ch}"/></clipPath>` : ''
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${esc(FONT_STACKS.helvetica.family)}"><defs>${scan.defs}${clip}</defs>
      <rect width="${w}" height="${h}" fill="#DCDDD8"/>
      <g transform="${matrix}"><g${clip !== '' ? ' clip-path="url(#cut)"' : ''}><rect width="${cw}" height="${ch}" fill="#F4F4F0"/><g filter="url(#scanInk)">${body}</g></g></g>
      ${scan.overlay(w, h)}</svg>`
  }
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
