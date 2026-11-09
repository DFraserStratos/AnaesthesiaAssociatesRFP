// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { stepState } from '../shared/steps.ts'
import type { Step } from '../shared/types.ts'
import { findRanges } from '../src/artifacts/find.ts'
import { sanitiseSvg } from '../src/artifacts/sanitise.ts'
import { STEP_BACK, STEP_CSS, STEP_FOCUS, STEP_LIT, STEP_OFF, STEP_ON_DARK, STEP_PATH, applyStepState, insideOff } from '../src/artifacts/stepsDom.ts'

const drawing = () =>
  sanitiseSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
<title>Ledger</title>
<defs><marker id="arrow"><path d="M0 0L5 5"/></marker></defs>
<style>.box { fill: #fff; }</style>
<rect id="bg" width="400" height="200"/>
<g id="trust">
  <rect class="box" width="100" height="80"/>
  <text>Trust bank</text>
  <g id="trust-entries"><text id="dr">Dr 100</text><text id="note">Bank fee</text></g>
</g>
<g id="debtors"><rect class="box"/><text>Debtors</text></g>
<g id="step-2"><text>Patient pays</text></g>
<g id="step-3"><text>Pay the doctor</text></g>
</svg>`).svg

const step = (id: string, show: string[], highlight: string[] = []): Step => ({ id, name: id, group: '', caption: '', show, highlight, moves: [], balances: [] })
const STEPS = [step('one', [], ['#debtors']), step('two', ['#step-2'], ['#dr']), step('three', ['#step-3'])]

const ids = (svg: Element, cls: string) => [...svg.querySelectorAll(`.${cls}`)].map((e) => e.id || e.localName)

describe('applying a step to a drawing', () => {
  it('hides what later steps reveal, and reveals it at its step', () => {
    const svg = drawing()
    applyStepState(svg, stepState(STEPS, 0))
    expect(ids(svg, STEP_OFF)).toEqual(['step-2', 'step-3'])
    applyStepState(svg, stepState(STEPS, 1))
    expect(ids(svg, STEP_OFF)).toEqual(['step-3'])
    applyStepState(svg, stepState(STEPS, 2))
    expect(ids(svg, STEP_OFF)).toEqual([])
  })

  it('keeps a nested highlight and its ancestors full strength, and marks the root to dim the rest', () => {
    const svg = drawing()
    applyStepState(svg, stepState(STEPS, 1))
    expect(ids(svg, STEP_LIT)).toEqual(['dr'])
    expect(ids(svg, STEP_PATH)).toEqual(['trust', 'trust-entries'])
    expect(svg.classList.contains(STEP_FOCUS)).toBe(true)
    // The siblings along the path are neither lit nor on it, so they dim; defs and style are never marked.
    const note = svg.querySelector('#note')!
    expect(note.classList.contains(STEP_LIT) || note.classList.contains(STEP_PATH)).toBe(false)
    for (const sel of ['defs', 'style', 'marker', 'marker path']) expect(svg.querySelector(sel)!.getAttribute('class') ?? '').toBe('')
  })

  it('needs no path inside a lit element', () => {
    const svg = drawing()
    applyStepState(svg, { hidden: [], highlight: ['#trust', '#dr'] })
    expect(ids(svg, STEP_LIT)).toEqual(['trust', 'dr'])
    expect(ids(svg, STEP_PATH)).toEqual([])
  })

  it('keeps the panel a highlight sits on full strength, and only a shape under it and round it', () => {
    const svg = drawing()
    // jsdom lays nothing out: give the parts their boxes on screen.
    const at = (sel: string, left: number, top: number, w: number, h: number) =>
      (svg.querySelector(sel)!.getBoundingClientRect = () => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) }))
    at('#bg', 0, 0, 400, 200)
    at('#trust > rect', 0, 0, 100, 80)
    at('#dr', 10, 40, 40, 10)
    at('#debtors > rect', 200, 0, 100, 80)
    applyStepState(svg, stepState(STEPS, 1))
    expect(ids(svg, STEP_BACK)).toEqual(['bg', 'rect'])
    expect(svg.querySelector(`#trust > rect.${STEP_BACK}`)).not.toBeNull()
    expect(svg.querySelector(`#debtors > rect.${STEP_BACK}`)).toBeNull()
    applyStepState(svg, null)
    expect(svg.querySelectorAll(`.${STEP_BACK}`)).toHaveLength(0)
  })

  it('lets what dims on a dark backdrop fade into it, and washes the rest toward white', () => {
    const svg = sanitiseSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
<rect id="pale" width="400" height="200" fill="#F3F6FA"/>
<rect id="card" x="10" y="10" width="100" height="60" fill="#FFFFFF"/>
<rect id="hero" x="200" y="0" width="200" height="200" fill="#2E2E31"/>
<text id="title" x="210" y="20" fill="#FFFFFF">Books</text>
<rect id="lit" x="210" y="40" width="100" height="40" fill="#D6EAF8"/>
<rect id="sub" x="210" y="100" width="100" height="40" fill="#3A3A40"/>
</svg>`).svg
    const at = (sel: string, left: number, top: number, w: number, h: number) =>
      (svg.querySelector(sel)!.getBoundingClientRect = () => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) }))
    at('#pale', 0, 0, 400, 200)
    at('#card', 10, 10, 100, 60)
    at('#hero', 200, 0, 200, 200)
    at('#title', 210, 10, 60, 14)
    at('#lit', 210, 40, 100, 40)
    at('#sub', 210, 100, 100, 40)
    document.body.appendChild(svg)
    // jsdom does not cascade presentation attributes: the computed fill is the attribute, as a browser would give it.
    const style = vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => ({ fill: el.getAttribute('fill') ?? '' }) as CSSStyleDeclaration)
    applyStepState(svg, { hidden: [], highlight: ['#lit'] })
    expect(ids(svg, STEP_BACK)).toEqual(['pale', 'hero'])
    expect(ids(svg, STEP_ON_DARK)).toEqual(['title', 'sub'])
    applyStepState(svg, { hidden: [], highlight: ['#card'] })
    expect(ids(svg, STEP_BACK)).toEqual(['pale'])
    expect(ids(svg, STEP_ON_DARK)).toEqual([])
    style.mockRestore()
    svg.remove()
    // The wash is opaque (a filter), and only the dark backdrop's contents use opacity.
    expect(STEP_CSS).toContain('filter: contrast(0.3333) brightness(1.5000) !important')
    expect(STEP_CSS).toContain(`.${STEP_ON_DARK}:not(.rb-step-from) { opacity: 0.5 !important; }`)
  })

  it('dims nothing when the step highlights nothing', () => {
    const svg = drawing()
    applyStepState(svg, stepState(STEPS, 2))
    expect(svg.classList.contains(STEP_FOCUS)).toBe(false)
    expect(svg.querySelectorAll(`.${STEP_LIT}, .${STEP_PATH}`)).toHaveLength(0)
  })

  it('null clears every mark, and the drawing keeps its own classes', () => {
    const svg = drawing()
    applyStepState(svg, stepState(STEPS, 1))
    applyStepState(svg, null)
    expect(svg.querySelectorAll(`.${STEP_OFF}, .${STEP_LIT}, .${STEP_PATH}`)).toHaveLength(0)
    expect(svg.classList.contains(STEP_FOCUS)).toBe(false)
    expect(svg.querySelectorAll('rect.box')).toHaveLength(2)
  })

  it('is the same however many times it is applied', () => {
    const svg = drawing()
    applyStepState(svg, stepState(STEPS, 1))
    const once = svg.outerHTML
    applyStepState(svg, stepState(STEPS, 1))
    applyStepState(svg, stepState(STEPS, 1))
    expect(svg.outerHTML).toBe(once)
    // And going back to an earlier step undoes the later one.
    applyStepState(svg, stepState(STEPS, 0))
    expect(ids(svg, STEP_LIT)).toEqual(['debtors'])
    expect(ids(svg, STEP_PATH)).toEqual([])
  })

  it('leaves text not revealed yet out of find', () => {
    const svg = drawing()
    document.body.appendChild(svg)
    applyStepState(svg, stepState(STEPS, 0))
    expect(insideOff(svg.querySelector('#step-2 text')!.firstChild!)).toBe(true)
    expect(insideOff(svg.querySelector('#debtors text')!.firstChild!)).toBe(false)
    expect(findRanges(svg, 'pay', 'svg', insideOff)).toHaveLength(0)
    applyStepState(svg, stepState(STEPS, 1))
    expect(findRanges(svg, 'pay', 'svg', insideOff).map((r) => r.toString())).toEqual(['pay'])
    applyStepState(svg, null)
    expect(findRanges(svg, 'pay', 'svg', insideOff)).toHaveLength(2)
    svg.remove()
  })
})
