// @vitest-environment jsdom
/**
 * B11 · the list views tell the truth about their state: a twisty clicked while the Outline is searched
 * changes nothing hidden, and the bulk buttons wait (R-126, B11-Q5); About's contents link to the section
 * already in the URL scrolls again (R-127); the owner filter shows the owner it filters by, even when that
 * owner has no question left (R-128).
 */
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Item, Question, Rev } from '../shared/types.ts'
import { questionWalk, useQuestionFilters } from '../src/questionWalk.ts'
import { useCatalogue, useView } from '../src/store.ts'
import { AboutView } from '../src/views/AboutView.tsx'
import { OutlineView } from '../src/views/OutlineView.tsx'
import { QuestionsView } from '../src/views/QuestionsView.tsx'
import { item, question } from './fixtures.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
;(globalThis as { __BOARD_VERSION__?: string }).__BOARD_VERSION__ = 'test'

const recs = <T extends { id: string }>(list: T[]) => Object.fromEntries(list.map((r): [string, Rev<T>] => [r.id, { data: r, rev: 'r' }]))
const items: Item[] = [
  item({ id: 'EP-01', type: 'epic', title: 'Billing' }),
  item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', title: 'Invoices' }),
  item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice' }),
  item({ id: 'FT-01.2', type: 'feature', parent: 'EP-01', title: 'Payments' }),
  item({ id: 'US-01.2.1', parent: 'FT-01.2', title: 'Take a payment' }),
]

let host: HTMLElement
let root: Root
beforeEach(() => {
  localStorage.clear()
  useView.getState().set({ search: '' })
  useCatalogue.setState({ status: 'ready', items: recs(items), questions: {}, artifacts: {}, issues: [] })
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
})
const render = (el: React.ReactElement, at = '/') => act(() => root.render(h(MemoryRouter, { initialEntries: [at] }, el)))
const rowIds = () => [...host.querySelectorAll('.tree-row')].map((r) => r.getAttribute('data-id'))
const twisty = (id: string) => host.querySelector<HTMLElement>(`.tree-row[data-id="${id}"] .twisty`)!
const button = (name: string) => [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === name)!
const savedFolds = () => JSON.parse(localStorage.getItem('requirements-board:outline-collapsed') ?? '[]') as string[]

describe("the Outline's folds while searching (R-126, B11-Q5)", () => {
  it('a twisty clicked while searching changes no fold; after the search every row is as it was', () => {
    render(h(OutlineView))
    act(() => twisty('FT-01.2').click())
    expect(rowIds()).toEqual(['EP-01', 'FT-01.1', 'US-01.1.1', 'FT-01.2'])
    expect(savedFolds()).toEqual(['FT-01.2'])
    act(() => useView.getState().set({ search: 'invoice' }))
    expect(rowIds()).toEqual(['EP-01', 'FT-01.1', 'US-01.1.1'])
    for (const id of ['EP-01', 'FT-01.1']) {
      expect(twisty(id).classList.contains('inert')).toBe(true)
      act(() => twisty(id).click())
    }
    expect(rowIds()).toEqual(['EP-01', 'FT-01.1', 'US-01.1.1'])
    act(() => useView.getState().set({ search: '' }))
    expect(savedFolds()).toEqual(['FT-01.2'])
    expect(rowIds()).toEqual(['EP-01', 'FT-01.1', 'US-01.1.1', 'FT-01.2'])
    expect(twisty('EP-01').classList.contains('inert')).toBe(false)
  })

  it('the bulk fold buttons are disabled while searching, and work again after', () => {
    render(h(OutlineView))
    act(() => useView.getState().set({ search: 'invoice' }))
    for (const name of ['Expand all', 'Collapse to epics', 'Features only']) {
      expect(button(name).getAttribute('aria-disabled'), name).toBe('true')
      expect(host.querySelector(`#${button(name).getAttribute('aria-describedby')}`)?.textContent).toMatch(/clear the search/)
      act(() => button(name).click())
    }
    expect(savedFolds()).toEqual([])
    act(() => useView.getState().set({ search: '' }))
    expect(button('Collapse to epics').getAttribute('aria-disabled')).toBe('false')
    act(() => button('Collapse to epics').click())
    expect(rowIds()).toEqual(['EP-01'])
  })
})

describe("About's contents always scroll (R-127)", () => {
  it('a contents link to the section already in the URL scrolls to it again', () => {
    const scrolled: string[] = []
    // jsdom has no scrolling: record which section each call brings into view.
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this.id)
    }
    try {
      useCatalogue.setState({ config: useCatalogue.getState().config, layout: { positions: {}, lanes: [] } })
      render(h(AboutView), '/about?s=skills')
      expect(scrolled).toEqual(['about-skills'])
      const link = [...host.querySelectorAll<HTMLAnchorElement>('.about-toc a')].find((a) => a.textContent === 'Skills')!
      act(() => link.click())
      expect(scrolled).toEqual(['about-skills', 'about-skills'])
      act(() => [...host.querySelectorAll<HTMLAnchorElement>('.about-toc a')].find((a) => a.textContent === 'The loop')!.click())
      expect(scrolled.at(-1)).toBe('about-loop')
    } finally {
      delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView
    }
  })
})

describe('the owner filter shows the filter in force (R-128)', () => {
  const qs: Question[] = [question({ id: 'OQ-01', owner: 'Sam' }), question({ id: 'OQ-02', owner: 'Ana' })]
  afterEach(() => useQuestionFilters.getState().set({ owner: '', kind: '', query: '', showAnswered: true }))

  it("keeps a picked owner selected when no question names them, and All owners clears it; the stepper agrees with the list", () => {
    useCatalogue.setState({ questions: recs(qs) })
    render(h(QuestionsView))
    const select = host.querySelector<HTMLSelectElement>('select[aria-label="Owner"]')!
    act(() => {
      select.value = 'Sam'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(useQuestionFilters.getState().owner).toBe('Sam')
    // Sam's question is handed to Ana (an edit in a sheet or on disk).
    act(() => useCatalogue.setState({ questions: recs([{ ...qs[0]!, owner: 'Ana' }, qs[1]!]) }))
    expect(select.value).toBe('Sam')
    expect(select.selectedOptions[0]!.textContent).toBe('Sam')
    expect(host.querySelectorAll('.q-row')).toHaveLength(0)
    const { config } = useCatalogue.getState()
    expect(questionWalk(config, Object.values(useCatalogue.getState().questions).map((r) => r.data), useQuestionFilters.getState())).toEqual([])
    act(() => {
      select.value = ''
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(useQuestionFilters.getState().owner).toBe('')
    expect(host.querySelectorAll('.q-row')).toHaveLength(2)
    expect([...select.options].map((o) => o.value)).toEqual(['', 'Ana'])
  })
})
