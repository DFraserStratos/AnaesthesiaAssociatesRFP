// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import type { ArtifactRec, Item, Question } from '../shared/types.ts'
import { findRanges } from '../src/artifacts/find.ts'
import { anchorElements } from '../src/artifacts/regionsDom.ts'
import { sanitiseSvg } from '../src/artifacts/sanitise.ts'
import { catalogueResolver, linkRecordIds, type ResolveLink } from '../src/artifacts/svgLinks.ts'

const KNOWN = new Set(['OQ-47', 'OQ-80', 'US-06.1.1', 'FT-06.2', 'EP-06', 'AR-01'])
const resolve: ResolveLink = (id) => (KNOWN.has(id) ? { href: `#/x/${id}`, title: `Title of ${id}` } : null)

const drawing = (body: string) =>
  sanitiseSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><title>Flow</title>${body}</svg>`).svg

const links = (svg: Element) => [...svg.querySelectorAll('a.record-id')].map((a) => a.getAttribute('data-record'))

describe('linking record IDs in a drawing', () => {
  it('links a known ID inside a text, keeping the text as drawn', () => {
    const svg = drawing('<text x="1" y="2" fill="#555">approval before the payables run (OQ-47)</text>')
    expect(linkRecordIds(svg, resolve)).toBe(1)
    const text = svg.querySelector('text')!
    expect(text.textContent).toBe('approval before the payables run (OQ-47)')
    expect(text.getAttribute('x')).toBe('1')
    const a = text.querySelector('a')!
    expect(a.namespaceURI).toBe('http://www.w3.org/2000/svg')
    expect(a.textContent).toBe('OQ-47')
    expect(a.getAttribute('href')).toBe('#/x/OQ-47')
    expect(a.getAttribute('aria-label')).toBe('Title of OQ-47 (OQ-47)')
    expect(a.querySelector('title')).toBeNull()
  })

  it('links every known kind of ID, several in one text and inside a tspan', () => {
    const svg = drawing('<text>EP-06, FT-06.2 and US-06.1.1</text><text><tspan>see AR-01</tspan></text>')
    expect(linkRecordIds(svg, resolve)).toBe(4)
    expect(links(svg)).toEqual(['EP-06', 'FT-06.2', 'US-06.1.1', 'AR-01'])
  })

  it('leaves an ID the catalogue does not have as plain text', () => {
    const svg = drawing('<text>open (OQ-99) and (OQ-47)</text>')
    expect(linkRecordIds(svg, resolve)).toBe(1)
    expect(links(svg)).toEqual(['OQ-47'])
    expect(svg.querySelector('text')!.textContent).toBe('open (OQ-99) and (OQ-47)')
  })

  it('does not link an ID inside a longer word or a longer ID', () => {
    const svg = drawing('<text>XOQ-47 OQ-470 OQ-47a FT-06.2.1 US-06.1.10</text>')
    expect(linkRecordIds(svg, resolve)).toBe(0)
    expect(svg.querySelector('a')).toBeNull()
  })

  it('leaves text that is not drawn text, and links the drawing already has, alone', () => {
    const svg = drawing('<desc>OQ-47</desc><g id="OQ-47"><rect/></g><text><a href="#spot">OQ-80</a></text>')
    expect(linkRecordIds(svg, resolve)).toBe(0)
  })

  it('keeps text= anchors and find matching after linking', () => {
    const svg = drawing('<text>Not yet decided</text><text>approval before the payables run (OQ-47)</text><text>Re-check prepayment requirement</text>')
    document.body.appendChild(svg)
    linkRecordIds(svg, resolve)
    expect(anchorElements(svg as SVGSVGElement, 'text=approval before the payables run (OQ-47)')).toHaveLength(1)
    expect(anchorElements(svg as SVGSVGElement, 'text=Re-check prepayment requirement')).toHaveLength(1)
    expect(findRanges(svg, 'run (oq-47)', 'svg').map((r) => r.toString())).toEqual(['run (OQ-47)'])
    expect(findRanges(svg, 'decided approval', 'svg')).toHaveLength(1)
    svg.remove()
  })
})

describe('the catalogue resolver', () => {
  const item = { id: 'US-06.1.1', title: 'Prepaid set', status: 'Proposed' } as Item
  const gone = { id: 'FT-06.2', title: 'Old feature', status: 'Retired' } as Item
  const question = { id: 'OQ-47', title: 'Payables approval', status: 'Open' } as Question
  const art = (id: string, title: string, status = 'Current') => ({ data: { id, title, status } }) as unknown as ArtifactRec
  const r = catalogueResolver(
    { byId: new Map([[item.id, item], [gone.id, gone]]), questions: [question] },
    { 'AR-01': art('AR-01', 'Price rules'), 'AR-24': art('AR-24', 'Billing flow') },
    'AR-24',
  )

  it('opens items and questions as sheets and other artifacts as pages', () => {
    expect(r('US-06.1.1')).toMatchObject({ href: '#/board?item=US-06.1.1', title: 'Prepaid set', retired: false })
    expect(r('OQ-47')).toMatchObject({ href: '#/board?question=OQ-47', tip: 'Payables approval · Open' })
    expect(r('AR-01')).toMatchObject({ href: '#/artifacts/AR-01', title: 'Price rules' })
    expect(r('FT-06.2')).toMatchObject({ retired: true })
  })

  it('leaves unknown records and the drawing itself unlinked', () => {
    expect(r('OQ-99')).toBeNull()
    expect(r('EP-77')).toBeNull()
    expect(r('AR-24')).toBeNull()
  })
})
