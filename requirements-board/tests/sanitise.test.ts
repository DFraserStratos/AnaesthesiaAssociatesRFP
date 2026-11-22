// @vitest-environment jsdom
/**
 * The SVG sanitiser (B01): whatever a drawing's links and styles are spelled as, nothing in it may
 * run or reach out, while its own references (gradients, symbols, markers, fragment links, data
 * rasters) keep working. Run against the real `sanitiseSvg`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { REQUIREMENTS_DIR } from '../server/catalogueFs.ts'
import { sanitiseSvg } from '../src/artifacts/sanitise.ts'

const XLINK = 'http://www.w3.org/1999/xlink'
const svg = (body: string, attrs = '') => sanitiseSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ${attrs}>${body}</svg>`).svg
const PNG = 'data:image/png;base64,iVBORw0KGgo='

/** Every attribute left in the drawing, as `localName=value`, whatever its namespace or prefix. */
const attrsOf = (root: Element) =>
  [root, ...root.querySelectorAll('*')].flatMap((el) => [...el.attributes].filter((a) => a.namespaceURI !== 'http://www.w3.org/2000/xmlns/').map((a) => `${a.localName}=${a.value}`))
/** Anything that could still leave the drawing: a scheme or a host in a URL-bearing place. */
const OUTWARD = /java\s*script:|https?:|\/\/|vbscript:|data:text|image-set|@import/i

describe('a link cannot run script, whatever its spelling (R-03)', () => {
  it('drops XLink href bound to a prefix that is not "xlink"', () => {
    const out = svg('<a xmlns:x="http://www.w3.org/1999/xlink" x:href="javascript:alert(1)"><text>Click</text></a>')
    const a = out.querySelector('a')!
    expect(a.getAttributeNS(XLINK, 'href')).toBeNull()
    expect(attrsOf(out).filter((s) => /javascript/i.test(s))).toEqual([])
  })

  it.each([
    ['literal xlink prefix', '<a xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="javascript:alert(1)"><text>x</text></a>'],
    ['plain href, upper case and padded', '<a href="  JAVASCRIPT:alert(1)"><text>x</text></a>'],
    ['a tab inside the scheme, under an odd prefix', '<a xmlns:x="http://www.w3.org/1999/xlink" x:href="java&#9;script:alert(1)"><text>x</text></a>'],
    ['href in an unknown namespace', '<a xmlns:q="urn:q" q:href="javascript:alert(1)"><text>x</text></a>'],
    ['an outside page', '<a href="https://example.com/"><text>x</text></a>'],
    ['a protocol-relative page', '<a href="//example.com/"><text>x</text></a>'],
    ['an HTML data URL', '<a href="data:text/html,&lt;script&gt;alert(1)&lt;/script&gt;"><text>x</text></a>'],
    ['an SVG data URL', '<image href="data:image/svg+xml,&lt;svg onload=alert(1)/&gt;"/>'],
    ['an outside image', '<image xmlns:x="http://www.w3.org/1999/xlink" x:href="https://example.com/a.png"/>'],
    ['an outside use', '<use href="https://example.com/s.svg#a"/>'],
    ['an outside filter image', '<filter id="f"><feImage href="https://example.com/a.png"/></filter>'],
    ['src, srcset, action, formaction and data on SVG elements', '<g src="https://e.x/a" srcset="https://e.x/a 1x" action="https://e.x" formaction="javascript:1" data="https://e.x/o"/>'],
    ['URL attributes in the HTML namespace', '<g xmlns:h="http://www.w3.org/1999/xhtml" h:src="https://e.x/a" h:href="javascript:1"/>'],
    ['the root element', '<g/>', 'xmlns:x="http://www.w3.org/1999/xlink" x:href="javascript:alert(1)" href="https://e.x/"'],
  ])('%s', (_name, body, rootAttrs = '') => {
    const out = svg(body, rootAttrs)
    expect(attrsOf(out).filter((s) => OUTWARD.test(s))).toEqual([])
  })

  it('drops HTML-namespaced elements, which would load or run in the page', () => {
    const out = svg('<h:img xmlns:h="http://www.w3.org/1999/xhtml" src="https://example.com/a.png"/><h:a xmlns:h="http://www.w3.org/1999/xhtml" href="javascript:alert(1)">x</h:a><h:style xmlns:h="http://www.w3.org/1999/xhtml">*{background:url(https://e.x/a)}</h:style><m:math xmlns:m="http://www.w3.org/1998/Math/MathML"><m:mi href="javascript:1">x</m:mi></m:math><rect width="1" height="1"/>')
    expect([...out.querySelectorAll('*')].map((e) => e.localName)).toEqual(['rect'])
  })

  it('keeps what a drawing needs: fragment links, symbols, and data rasters', () => {
    const out = svg(`<defs><symbol id="s"><rect width="1" height="1"/></symbol></defs><a href="#s"><text>to s</text></a><use xmlns:x="http://www.w3.org/1999/xlink" x:href="#s"/><image href="${PNG}"/><image href="data:image/jpeg;base64,/9j/" /><image href="data:image/webp;base64,UklG"/><image href="data:image/gif;base64,R0lG"/>`)
    expect(out.querySelector('a')!.getAttribute('href')).toBe('#s')
    expect(out.querySelector('use')!.getAttributeNS(XLINK, 'href')).toBe('#s')
    expect([...out.querySelectorAll('image')].map((i) => i.getAttribute('href')!.slice(0, 15))).toEqual(['data:image/png;', 'data:image/jpeg', 'data:image/webp', 'data:image/gif;'])
  })

  it('drops a link target and the marks the board puts on its own record links', () => {
    const out = svg('<a href="#x" target="_blank" class="record-id" data-record="US-01.1.1" data-tip="t"><text>x</text></a>')
    const a = out.querySelector('a')!
    expect(a.getAttribute('target')).toBeNull()
    expect(a.getAttribute('data-record')).toBeNull()
    expect(a.getAttribute('href')).toBe('#x')
  })
})

describe('an inline drawing makes no outside requests (R-03 also)', () => {
  it.each([
    ['fill', '<rect fill="url(https://example.com/p.svg#g)"/>'],
    ['filter', '<rect filter="url(https://example.com/f.svg#f)"/>'],
    ['mask, clip-path and markers', '<path mask="url(//e.x/m#m)" clip-path="url(\'https://e.x/c#c\')" marker-end="url(&quot;https://e.x/k#k&quot;)"/>'],
    ['cursor', '<rect cursor="url(https://example.com/c.cur), auto"/>'],
    ['image-set in a style attribute', '<rect style="background: image-set(\'https://example.com/a.png\' 1x)"/>'],
    ['a CSS escape spelling url', '<rect style="fill: u\\72l(https://example.com/p#g)"/>'],
    ['a CSS escape in a presentation attribute', '<rect fill="\\75 rl(https://example.com/p#g)"/>'],
    ['src() in a style attribute', '<rect style="fill: src(\'https://example.com/p#g\')"/>'],
  ])('%s', (_name, body) => {
    expect(attrsOf(svg(body)).filter((s) => OUTWARD.test(s))).toEqual([])
  })

  it.each([
    ['url()', '.a { fill: url(https://example.com/p.svg#g) }'],
    ['image-set()', '.a { background: image-set("https://example.com/a.png" 1x) }'],
    ['-webkit-image-set()', '.a { background: -webkit-image-set("https://example.com/a.png" 1x) }'],
    ['@import', '@import "https://example.com/a.css"; .a { fill: red }'],
    ['@font-face', '@font-face { font-family: X; src: url(https://example.com/f.woff) }'],
    ['an escaped url', '.a { fill: \\75 rl(https://example.com/p#g) }'],
    ['a CDATA section', '<![CDATA[ .a { fill: url(https://example.com/p#g) } ]]>'],
  ])('a <style> element: %s', (_name, css) => {
    const out = svg(`<style>${css}</style><rect class="a"/>`)
    expect(out.querySelector('style')?.textContent ?? '').not.toMatch(/https?:|\/\/example/)
  })

  it('keeps same-document references in attributes and styles', () => {
    const out = svg(`<defs><linearGradient id="g"><stop offset="0"/></linearGradient><filter id="f"/><marker id="m"/><mask id="k"/><clipPath id="c"/></defs>
<style>.a { fill: url(#g); stroke: url( "#g" ) } .b { color: red }</style>
<rect class="a" fill="url(#g)" filter="url('#f')" marker-end="url(#m)" mask="url(#k)" clip-path="url(#c)" style="stroke: url(#g)"/>`)
    const r = out.querySelector('rect')!
    expect(['fill', 'filter', 'marker-end', 'mask', 'clip-path', 'style'].map((a) => r.getAttribute(a))).toEqual(['url(#g)', "url('#f')", 'url(#m)', 'url(#k)', 'url(#c)', 'stroke: url(#g)'])
    expect(out.querySelector('style')!.textContent).toBe('.a { fill: url(#g); stroke: url( "#g" ) } .b { color: red }')
  })
})

describe('CSS is read as a browser reads it (review)', () => {
  // A `/*` inside a string is no comment; an escaped `/*` is none either; a CRLF after an escape is one newline.
  it.each([
    ['a comment opener in a string', '.p1a{--a:"/*"}.p1{fill:url(http://e.x/p1)}.p1c{--b:"*/"}'],
    ['an escaped comment opener', '.p2a{--a:\\2f*}.p2{fill:url(http://e.x/p2)}.p2c{--b:*\\2f}'],
    ['CRLF after an escape', '.p3{fill:\\75\r\nrl(http://e.x/p3)}'],
  ])('a <style> element: %s', (_name, css) => {
    const out = svg(`<style>${css.replace(/\r/g, '&#13;')}</style>`)
    expect(out.querySelector('style')?.textContent ?? '').not.toMatch(/e\.x/)
  })

  it.each([
    ['style', '--a:"/*";fill:url(http://e.x/p4);--b:"*/"'],
    ['fill', '\\75&#13;&#10;rl(http://e.x/p5)'],
    ['style', 'fill:\\75&#13;&#10;rl(http://e.x/p6)'],
    ['style', '--a:\\2f*;fill:url(http://e.x/p7);--b:*\\2f'],
  ])('a %s attribute', (attr, value) => {
    expect(attrsOf(svg(`<rect ${attr}='${value}'/>`)).filter((s) => /e\.x/.test(s))).toEqual([])
  })

  it('keeps the rest of a <style> exactly as written', () => {
    const css = '.q{content:"\\""} .x{fill:url(http://e.x/a)} .a\\:b{fill:red} /* note */ .y{fill:url(#g)}'
    expect(svg(`<style>${css}</style>`).querySelector('style')!.textContent).toBe('.q{content:"\\""} .x{} .a\\:b{fill:red} /* note */ .y{fill:url(#g)}')
  })

  it('cleans a large embedded font in linear time', () => {
    const big = 'A'.repeat(400_000)
    const t = performance.now()
    const out = svg(`<style>@font-face{font-family:F;src:url(data:font/woff2;base64,${big})} .a{fill:red}</style>`)
    expect(performance.now() - t).toBeLessThan(2000)
    expect(out.querySelector('style')!.textContent).not.toMatch(/url\(/)
    expect(out.querySelector('style')!.textContent).toContain('.a{fill:red}')
  })

  it('keeps text attributes that merely read like CSS', () => {
    const out = svg('<text aria-label="Upload image(s)" data-tip="see url(x)" id="i" class="c">x</text>')
    expect(out.querySelector('text')!.getAttribute('aria-label')).toBe('Upload image(s)')
    expect(out.querySelector('text')!.getAttribute('data-tip')).toBe('see url(x)')
  })

  it('drops a link shaped like a board route, which is no spot in the drawing', () => {
    const out = svg('<a href="#/settings"><text>x</text></a><a href="#spot"><text>y</text></a><g id="spot"/>')
    expect([...out.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([null, '#spot'])
  })

  it('refuses a root that is not an SVG element', () => {
    expect(() => sanitiseSvg('<svg xmlns="http://www.w3.org/1999/xhtml"><rect/></svg>')).toThrow(/not a readable SVG/)
  })
})

describe('the drawings in this catalogue', () => {
  const dir = join(REQUIREMENTS_DIR, 'artifacts', 'files')
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.svg')) : []
  it.skipIf(!files.length).each(files)('%s keeps every element, id and same-document reference', (f) => {
    const text = readFileSync(join(dir, f), 'utf8')
    const before = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement
    const after = sanitiseSvg(text).svg
    const ids = (root: Element) => [...root.querySelectorAll('[id]')].map((e) => e.id)
    const refs = (root: Element) => [root, ...root.querySelectorAll('*')].flatMap((el) => [...el.attributes].filter((a) => /url\(\s*['"]?#|^#/.test(a.value)).map((a) => `${el.localName}@${a.localName}=${a.value}`))
    const styles = (root: Element) => [...root.querySelectorAll('style')].map((s) => s.textContent)
    // The root's <title> is moved into its label; nothing else goes.
    const count = (root: Element) => root.querySelectorAll(':not(svg > title)').length
    expect(count(after)).toBe(count(before))
    expect(ids(after)).toEqual(ids(before))
    expect(refs(after)).toEqual(refs(before))
    expect(styles(after)).toEqual(styles(before))
  })
})
