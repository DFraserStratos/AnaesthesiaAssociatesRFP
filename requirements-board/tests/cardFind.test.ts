// @vitest-environment jsdom
/**
 * B10 · card find scrolls only when the reader asks (R-33): typing and stepping bring the current
 * match into view; a change inside the card (a label flipping, a disclosure opening, matching text
 * added above) re-finds the matches without scrolling and keeps the same match current.
 */
import { act, createElement as h, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CardFind } from '../src/components/CardFind.tsx'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let host: HTMLElement
let root: Root
let scrolls: Element[]

function Card({ disabled = false }: { disabled?: boolean }) {
  const body = useRef<HTMLDivElement>(null)
  return h('div', { className: 'sheet', tabIndex: -1 }, h(CardFind, { root: body, resetKey: 'US-01.1.1', disabled }), h('div', { ref: body, className: 'sheet-body' }, h('p', { id: 'one' }, 'An invoice is raised.'), h('p', { id: 'two' }, 'The invoice is paid.'), h('p', { id: 'three' }, 'A credit note cancels an invoice.'), h('p', { id: 'foot' }, h('button', { id: 'copy' }, 'US-01.1.1'))))
}

const settle = () => act(() => new Promise((r) => setTimeout(r, 0)))
const input = () => host.querySelector<HTMLInputElement>('.card-find input')!
const count = () => host.querySelector('.card-find .search-count')?.textContent
const type = async (text: string) => {
  await act(async () => {
    const el = input()
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await settle()
}
const press = async (key: string) => {
  await act(async () => input().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })))
  await settle()
}
const change = async (fn: () => void) => {
  await act(async () => fn())
  await settle() // the MutationObserver's callback
  await settle()
}

beforeEach(async () => {
  scrolls = []
  Element.prototype.scrollIntoView = function (this: Element) {
    scrolls.push(this)
  }
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  await act(async () => root.render(h(Card)))
  await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true })))
  await settle()
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

describe('card find scrolls only when asked (R-33)', () => {
  it('typing brings the first match into view, and each step its match', async () => {
    await type('invoice')
    expect(count()).toBe('1 of 3')
    expect(scrolls.map((e) => e.id)).toEqual(['one'])
    await press('Enter')
    expect(count()).toBe('2 of 3')
    expect(scrolls.map((e) => e.id)).toEqual(['one', 'two'])
  })

  it('a change inside the card (the "Link copied" label, and its revert) re-finds without scrolling', async () => {
    await type('invoice')
    await press('Enter')
    const before = scrolls.length
    await change(() => (document.getElementById('copy')!.textContent = 'Link copied'))
    await change(() => (document.getElementById('copy')!.textContent = 'US-01.1.1'))
    await change(() => document.getElementById('foot')!.append(Object.assign(document.createElement('div'), { textContent: 'A history disclosure opened' })))
    expect(scrolls.length).toBe(before)
    expect(count()).toBe('2 of 3')
  })

  it('matching text added above the current match keeps the same match current, and the tints recount', async () => {
    await type('invoice')
    await press('Enter') // "The invoice is paid."
    const before = scrolls.length
    await change(() => document.getElementById('one')!.before(Object.assign(document.createElement('p'), { textContent: 'A new invoice line.' })))
    expect(count()).toBe('3 of 4')
    expect(scrolls.length).toBe(before)
    // Stepping still scrolls, from the match that stayed current.
    await press('Enter')
    expect(count()).toBe('4 of 4')
    expect(scrolls.at(-1)!.id).toBe('three')
  })

  it('when the current match goes, the next one after where it was becomes current, without scrolling', async () => {
    await type('invoice')
    await press('Enter') // "The invoice is paid."
    const before = scrolls.length
    await change(() => document.getElementById('two')!.remove())
    expect(count()).toBe('2 of 2')
    expect(scrolls.length).toBe(before)
  })

  it('find put away while the card is edited and back after keeps its match, without scrolling', async () => {
    await type('invoice')
    await press('Enter')
    await press('Enter') // "A credit note cancels an invoice."
    const before = scrolls.length
    await act(async () => root.render(h(Card, { disabled: true })))
    await act(async () => root.render(h(Card, { disabled: false })))
    await settle()
    expect(count()).toBe('3 of 3')
    expect(scrolls.length).toBe(before)
  })
})
