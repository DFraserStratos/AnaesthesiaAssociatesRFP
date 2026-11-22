// @vitest-environment jsdom
/**
 * B06 · the edit sheets in the browser: a save sends only what the user changed and keeps what changed
 * on disk (R-02, B06-Q2), keeps what is typed while it is in flight (R-41), sends nothing without a change
 * (R-111), picks a record up when it appears (R-112), never lets an orphaned draft go or come back
 * unasked (R-42, R-107, R-43), focuses the right field and gives focus back (R-109), moves focus to the
 * veil only when it appears (R-110), and never raises a veil nobody can see (R-108). Each failed on the
 * board before B06.
 */
import { StrictMode, act, createElement as h, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { roleCode, statusLabel } from '../shared/statuses.ts'
import type { Artifact, ArtifactRec, Item, Question, Rev } from '../shared/types.ts'
import { api, ApiError } from '../src/api.ts'
import { ItemModal } from '../src/components/ItemModal.tsx'
import { NewCardButton } from '../src/components/NewCardButton.tsx'
import { QuestionModal } from '../src/components/QuestionModal.tsx'
import { ArtifactPanel } from '../src/artifacts/ArtifactPanel.tsx'
import { Sheet, type SheetConfirm } from '../src/components/Sheet.tsx'
import { hasUnsavedDrafts } from '../src/components/useEditableRecord.ts'
import { guarded, setLeaveGuard } from '../src/nav.ts'
import { useCatalogue } from '../src/store.ts'
import { FIXTURE_CONFIG, item, question } from './fixtures.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const EPIC = item({ id: 'EP-01', type: 'epic', title: 'Billing' })
const FT1 = item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', title: 'Invoices' })
const FT2 = item({ id: 'FT-01.2', type: 'feature', parent: 'EP-01', title: 'Receipts' })
const STORY = item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Old', notes: 'A note' })
const OTHER = item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, title: 'Void an invoice' })
const rev = <T>(data: T, r = 'r1'): Rev<T> => ({ data, rev: r })

let host: HTMLElement
let root: Root
let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  // No request reaches a server: anything not mocked per test answers with the record as the store holds it.
  fetchMock = vi.fn(async (url: string) => {
    const id = decodeURIComponent(String(url).split('/').pop() ?? '')
    const s = useCatalogue.getState()
    const rec = s.items[id] ?? s.questions[id]
    return new Response(JSON.stringify(rec ?? {}), { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
  vi.stubGlobal('fetch', fetchMock)
  useCatalogue.setState({
    status: 'ready',
    items: Object.fromEntries([EPIC, FT1, FT2, STORY, OTHER].map((i) => [i.id, rev(i)])),
    questions: { 'OQ-01': rev(question({ id: 'OQ-01', affects: ['US-01.1.1'] })) },
    artifacts: {},
    issues: [],
    config: FIXTURE_CONFIG,
    layout: { positions: {}, lanes: [] },
  })
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(async () => {
  act(() => root.unmount())
  // Drafts are tab memory: a test's draft must not restore in the next. (Before B06 the store was private.)
  await import('../src/drafts.ts').then((m) => m.forgetDrafts('item', [STORY.id, 'US-01.1.3'])).catch(() => {})
  host.remove()
  document.body.innerHTML = ''
  setLeaveGuard(null)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const render = (node: ReactNode) => act(() => root.render(node))
const at = (url: string, node: ReactNode) => h(MemoryRouter, { initialEntries: [url] }, node)
const sheet = (id = 'US-01.1.1', url = `/outline?item=${id}`) => at(url, h(ItemModal, { id }))
const $ = <E extends Element = HTMLElement>(sel: string) => document.querySelector<E>(sel)
const button = (text: string) => [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === text) as HTMLButtonElement | undefined
const click = (el: Element | null | undefined) => act(() => void (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })))
function type(el: HTMLInputElement | HTMLTextAreaElement | null, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  act(() => {
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value)
    el!.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
function key(k: string, mods: KeyboardEventInit = {}, target: EventTarget = window) {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...mods })
  act(() => void target.dispatchEvent(e))
  return e
}
/** The description field of the open item's edit form. */
const description = () => [...document.querySelectorAll<HTMLTextAreaElement>('textarea')].find((t) => t.closest('label, .field')?.textContent?.includes('Description')) ?? null
const setStore = (patch: Partial<ReturnType<typeof useCatalogue.getState>>) => act(() => useCatalogue.setState(patch))
const disk = (data: Item, r: string) => setStore({ items: { ...useCatalogue.getState().items, [data.id]: rev(data, r) } })
const held = <T>() => {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)))
  return { promise, resolve, reject }
}
const settle = () => act(async () => {})

describe('a save sends only what the user changed (R-02, B06-Q2)', () => {
  it('Keep mine then Save writes the user’s description and nothing else, over the copy on disk', async () => {
    const patchItem = vi.spyOn(api, 'patchItem').mockImplementation(async (id, c) => rev({ ...useCatalogue.getState().items[id]!.data, ...c.patch } as Item, 'r3'))
    render(sheet())
    click(button('Edit'))
    type(description(), 'Mine')
    // An agent rewrote the description too, moved the card and gave it an artifact.
    disk({ ...STORY, description: 'Theirs', parent: 'FT-01.2', artifacts: ['AR-01'] }, 'r2')
    expect($('[role="alert"]')?.textContent).toContain('changed on disk')
    click(button('Keep mine'))
    click(button('Save'))
    await settle()
    expect(patchItem).toHaveBeenCalledWith('US-01.1.1', { patch: { description: 'Mine' }, baseRev: 'r2', base: { description: 'Theirs' } })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('a disk change to a field the user has not touched is taken in quietly, and the save sends only the user’s field', async () => {
    const patchItem = vi.spyOn(api, 'patchItem').mockImplementation(async (id, c) => rev({ ...useCatalogue.getState().items[id]!.data, ...c.patch } as Item, 'r3'))
    render(sheet())
    click(button('Edit'))
    type(description(), 'Mine')
    disk({ ...STORY, parent: 'FT-01.2', order: 4 }, 'r2') // a Mapped drag of this very card
    expect($('[role="alert"]')).toBeNull()
    click(button('Save'))
    await settle()
    expect(patchItem).toHaveBeenCalledWith('US-01.1.1', { patch: { description: 'Mine' }, baseRev: 'r2', base: { description: 'Old' } })
  })

  it('a question: Keep mine then Save writes the user’s answer only, keeping an agent’s owner (review)', async () => {
    const q = question({ id: 'OQ-01', affects: ['US-01.1.1'], answer: '' })
    setStore({ questions: { 'OQ-01': rev(q) } })
    const patchQuestion = vi.spyOn(api, 'patchQuestion').mockImplementation(async (id, c) => rev({ ...useCatalogue.getState().questions[id]!.data, ...c.patch } as Question, 'q3'))
    render(at('/questions?question=OQ-01', h(QuestionModal, { id: 'OQ-01' })))
    click(button('Edit'))
    const answer = [...document.querySelectorAll<HTMLTextAreaElement>('textarea')].find((t) => t.closest('label, .field')?.textContent?.includes('Answer'))!
    type(answer, 'Mine')
    setStore({ questions: { 'OQ-01': rev({ ...q, answer: 'Theirs', owner: 'Agent' }, 'q2') } })
    click(button('Keep mine'))
    click(button('Save'))
    await settle()
    expect(patchQuestion).toHaveBeenCalledWith('OQ-01', { patch: { answer: 'Mine' }, baseRev: 'q2', base: { answer: 'Theirs' } })
  })

  it('artifact details: Keep mine then Save writes the user’s field only (review)', async () => {
    const a = { id: 'AR-01', title: 'Drawing', kind: 'diagram', status: 'Current', supersededBy: null, date: null, author: 'Old', components: [], sources: [], description: '', file: 'artifacts/files/AR-01.svg', regions: [], steps: [], citedAs: [], source: '', extra: {} } as unknown as Artifact
    const rec0 = { data: a, rev: 'a1', meta: { format: 'svg', size: 1, fileRev: null, pages: null, problems: [] } } as unknown as ArtifactRec
    setStore({ artifacts: { 'AR-01': rec0 } })
    const patchArtifact = vi.spyOn(api, 'patchArtifact').mockImplementation(async (id, c) => ({ ...rec0, data: { ...useCatalogue.getState().artifacts[id]!.data, ...c.patch }, rev: 'a3' }) as ArtifactRec)
    render(at('/artifacts/AR-01', h(ArtifactPanel, { rec: rec0, spot: null, onSpot: () => {}, onPreview: () => {} })))
    click(button('Edit details'))
    const author = [...document.querySelectorAll<HTMLInputElement>('.artifact-panel input')].find((i) => i.closest('label')?.textContent?.startsWith('Author'))!
    type(author, 'Mine')
    const theirs = { ...rec0, data: { ...a, author: 'Theirs', description: 'Agent wrote this' }, rev: 'a2' }
    setStore({ artifacts: { 'AR-01': theirs } })
    render(at('/artifacts/AR-01', h(ArtifactPanel, { rec: theirs, spot: null, onSpot: () => {}, onPreview: () => {} })))
    click(button('Keep mine'))
    click(button('Save'))
    await settle()
    expect(patchArtifact).toHaveBeenCalledWith('AR-01', { patch: { author: 'Mine' }, baseRev: 'a2', base: { author: 'Theirs' } })
  })

  it('the status menu and Retire send the status alone', async () => {
    const patchItem = vi.spyOn(api, 'patchItem').mockImplementation(async (id, c) => rev({ ...useCatalogue.getState().items[id]!.data, ...c.patch } as Item, 'r3'))
    render(sheet())
    click(button('Retire'))
    click(button('Retire item'))
    await settle()
    expect(patchItem).toHaveBeenCalledWith('US-01.1.1', { patch: { status: roleCode(FIXTURE_CONFIG, 'item', 'retired') }, baseRev: 'r1', base: { status: '1' } })
  })
})

describe('what is typed while a save is in flight is kept (R-41)', () => {
  it('a save that succeeds leaves the later typing as an unsaved change', async () => {
    const answer = held<Rev<Item>>()
    vi.spyOn(api, 'patchItem').mockReturnValue(answer.promise)
    render(sheet())
    click(button('Edit'))
    type(description(), 'Mine')
    key('s', { metaKey: true })
    type(description(), 'Mine, and more')
    await act(async () => answer.resolve(rev({ ...STORY, description: 'Mine' }, 'r2')))
    expect(description()?.value).toBe('Mine, and more')
    expect(button('Save')?.disabled).toBe(false)
    expect(hasUnsavedDrafts()).toBe(true)
  })

  it('a save that fails, or meets a conflict, keeps everything typed (preserved)', async () => {
    const failing = held<Rev<Item>>()
    vi.spyOn(api, 'patchItem').mockReturnValueOnce(failing.promise)
    render(sheet())
    click(button('Edit'))
    type(description(), 'Mine')
    key('s', { metaKey: true })
    type(description(), 'Mine, and more')
    await act(async () => failing.reject(new ApiError(409, 'changed', rev({ ...STORY, description: 'Theirs' }, 'r2'), { collisions: ['description'] })))
    expect(description()?.value).toBe('Mine, and more')
    expect($('[role="alert"]')?.textContent).toMatch(/changed on disk.*Description/)
  })
})

describe('a save happens only when something changed (R-111)', () => {
  it('Cmd S with nothing changed sends nothing, and still keeps the browser’s save dialog away', async () => {
    render(sheet())
    click(button('Edit'))
    const e = key('s', { metaKey: true })
    await settle()
    expect(e.defaultPrevented).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('a blank new card is still dropped when left, even after Cmd S', async () => {
    const blank = item({ id: 'US-01.1.3', parent: 'FT-01.1', title: 'Untitled', notes: '' })
    disk(blank, 'b1')
    const deleteItem = vi.fn(async () => {})
    setStore({ deleteItem })
    render(sheet('US-01.1.3', '/outline?item=US-01.1.3&edit=US-01.1.3'))
    key('s', { metaKey: true })
    await settle()
    key('Escape')
    await settle()
    expect(deleteItem).toHaveBeenCalledWith('US-01.1.3', 'b1', ['US-01.1.3'])
  })
})

describe('a sheet picks up its record when it appears (R-112)', () => {
  it('an item opened before its file reads shows it as soon as it does', () => {
    render(sheet('US-01.1.9'))
    expect(document.body.textContent).toContain('US-01.1.9 is not in the catalogue')
    disk(item({ id: 'US-01.1.9', parent: 'FT-01.1', title: 'Arrived late' }), 'n1')
    expect(document.body.textContent).toContain('Arrived late')
    expect(button('Edit')).toBeTruthy()
  })

  it('names the check’s error for a file that does not read', () => {
    setStore({ issues: [{ severity: 'error', id: 'US-01.1.9', message: 'US-01.1.9.md could not be read: bad YAML' }] })
    render(sheet('US-01.1.9'))
    expect(document.body.textContent).toContain('bad YAML')
  })

  it('a question opened before it appears steps through the list from where it lands', () => {
    setStore({ questions: {} })
    render(at('/questions?question=OQ-02', h(QuestionModal, { id: 'OQ-02' })))
    setStore({ questions: { 'OQ-01': rev(question({ id: 'OQ-01' })), 'OQ-02': rev(question({ id: 'OQ-02' })) } })
    expect(document.body.textContent).toMatch(/2 of 2/)
  })
})

describe('an orphaned draft never goes or comes back unasked (R-42, R-107, R-43)', () => {
  const orphan = () => {
    const { ['US-01.1.1']: _gone, ...rest } = useCatalogue.getState().items
    setStore({ items: rest })
  }

  it('Esc and the scrim ask first, a confirmed discard is final, and nothing comes back', () => {
    render(sheet())
    click(button('Edit'))
    type(description(), 'Mine')
    orphan()
    key('Escape')
    expect($('[role="alertdialog"]')?.textContent).toContain('Discard your changes?')
    expect(hasUnsavedDrafts()).toBe(true)
    key('Escape') // withdraws the question
    expect($('[role="alertdialog"]')).toBeNull()
    act(() => void $('.scrim')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })))
    expect($('[role="alertdialog"]')).toBeTruthy()
    click(button('Discard changes'))
    expect(hasUnsavedDrafts()).toBe(false)
  })

  it('in the docked panel, a board click asks rather than doing nothing', () => {
    render(at('/board?item=US-01.1.1', h(ItemModal, { id: 'US-01.1.1', docked: true })))
    click(button('Edit'))
    type(description(), 'Mine')
    orphan()
    const go = vi.fn()
    act(() => guarded(go))
    expect(go).not.toHaveBeenCalled()
    expect($('[role="alertdialog"]')?.textContent).toContain('Discard your changes?')
    click(button('Discard changes'))
    expect(go).toHaveBeenCalledOnce()
  })

  it('a card the board creates at a reused ID never opens with an old draft', async () => {
    render(sheet())
    click(button('Edit'))
    type(description(), 'Dead card’s text')
    orphan()
    act(() => root.render(h('div'))) // left by browser Back: the draft is kept
    expect(hasUnsavedDrafts()).toBe(true)
    vi.spyOn(api, 'createItem').mockResolvedValue(rev(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'A new card' }), 'n1'))
    await act(() => useCatalogue.getState().createItem({ type: 'story', parent: 'FT-01.1', title: 'A new card' }).then(() => {}))
    expect(hasUnsavedDrafts()).toBe(false)
    render(sheet())
    expect(document.body.textContent).toContain('A new card')
    expect(document.body.textContent).not.toContain('Restored the unsaved edits')
    expect(document.body.textContent).not.toContain('Dead card')
  })

  it('shows every unsaved change in readable form, and no unchanged field', () => {
    disk({ ...STORY, related: [] }, 'r1')
    render(sheet())
    click(button('Edit'))
    // A new status (stored as a code, shown by its name) and a cleared note.
    const status = document.querySelector<HTMLSelectElement>('select.select')!
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(status, '3')
      status.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const notes = [...document.querySelectorAll<HTMLTextAreaElement>('textarea')].find((t) => t.closest('label, .field')?.textContent?.includes('Notes'))!
    type(notes, '')
    orphan()
    const sections = [...document.querySelectorAll('.sheet .section')].map((s) => s.textContent)
    expect(sections).toContain(`Status${statusLabel(FIXTURE_CONFIG, 'item', '3')}`)
    expect(sections).toContain('NotesCleared')
    expect(sections.some((s) => s?.startsWith('Title'))).toBe(false)
  })
})

describe('focus (R-109, R-110)', () => {
  it('answering the discard question gives focus back to the field the user was in, StrictMode too (review)', () => {
    render(h(StrictMode, null, sheet()))
    click(button('Edit'))
    type(description(), 'Mine')
    description()!.focus()
    key('Escape')
    expect(document.activeElement?.textContent).toBe('Keep editing')
    click(button('Keep editing'))
    expect(document.activeElement).toBe(description())
  })

  it('the artifact panel’s question gives focus back too, StrictMode included (review)', () => {
    const a = { id: 'AR-01', title: 'Drawing', kind: 'diagram', status: 'Current', supersededBy: null, date: null, author: 'Old', components: [], sources: [], description: '', file: 'x.svg', regions: [], steps: [], citedAs: [], source: '', extra: {} } as unknown as Artifact
    const rec0 = { data: a, rev: 'a1', meta: { format: 'svg', size: 1, fileRev: null, pages: null, problems: [] } } as unknown as ArtifactRec
    setStore({ artifacts: { 'AR-01': rec0 } })
    render(h(StrictMode, null, at('/artifacts/AR-01', h(ArtifactPanel, { rec: rec0, spot: null, onSpot: () => {}, onPreview: () => {} }))))
    click(button('Edit details'))
    const author = [...document.querySelectorAll<HTMLInputElement>('.artifact-panel input')].find((i) => i.closest('label')?.textContent?.startsWith('Author'))!
    type(author, 'Mine')
    author.focus()
    key('Escape')
    expect(document.activeElement?.textContent).toBe('Keep editing')
    click(button('Keep editing'))
    expect(document.activeElement).toBe(author)
  })

  it('leaving Edit with Esc keeps focus in the modal sheet, not on body (manual check)', () => {
    render(sheet())
    click(button('Edit'))
    $<HTMLInputElement>('input.title-input')!.focus()
    key('Escape')
    expect(button('Edit')).toBeTruthy()
    expect(document.activeElement).toBe($('.sheet'))
  })

  it('a sheet opened with nothing focused gives focus to the page on close, never to body (review)', async () => {
    const main = document.createElement('main')
    document.body.appendChild(main)
    ;(document.activeElement as HTMLElement | null)?.blur()
    render(sheet())
    act(() => root.render(h('div')))
    await settle()
    expect(document.activeElement).toBe(main)
  })

  it('a sheet opened in Edit keeps the title focused, and gives focus back to its opener', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    render(sheet('US-01.1.1', '/outline?item=US-01.1.1&edit=US-01.1.1'))
    expect(document.activeElement).toBe($('input.title-input'))
    act(() => root.render(h('div')))
    return Promise.resolve().then(() => expect(document.activeElement).toBe(opener))
  })

  it('stepping to a sibling sheet keeps the first opener', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    function Stepper() {
      const [id, setId] = useState('a')
      return h(MemoryRouter, null, h(Sheet, { key: id, onClose: () => {}, label: id, children: h('button', { onClick: () => setId('b') }, 'Next') }))
    }
    render(h(Stepper))
    ;(button('Next') as HTMLButtonElement).focus()
    click(button('Next'))
    await settle()
    act(() => root.render(h('div')))
    await settle()
    expect(document.activeElement).toBe(opener)
  })

  it('the veil takes focus once, when it appears; a re-render under it moves nothing', () => {
    const search = document.createElement('input')
    document.body.appendChild(search)
    const ask = (): SheetConfirm => ({ title: 'Discard your changes?', body: 'x', cancelLabel: 'Keep editing', confirmLabel: 'Discard changes', onCancel: () => {}, onConfirm: () => {} })
    const view = (extra: boolean) => h(Sheet, { onClose: () => {}, label: 'x', docked: true, confirm: ask(), children: [h('p', { key: 'p' }, 'Body'), extra ? h('div', { key: 'b', className: 'banner' }, 'Changed on disk') : null] })
    render(view(false))
    expect(document.activeElement?.textContent).toBe('Keep editing')
    search.focus()
    render(view(true)) // a file changed: a new confirm object, a new banner under the veil
    expect(document.activeElement).toBe(search)
    expect(($('.banner') as HTMLElement).inert).toBe(true)
  })
})

describe('a way out raised over a modal (R-108)', () => {
  it('goes ahead at once while a modal sheet covers the docked panel, keeping its draft', () => {
    const guard = vi.fn()
    setLeaveGuard(guard)
    const scrim = document.createElement('div')
    scrim.className = 'scrim'
    document.body.appendChild(scrim)
    const go = vi.fn()
    guarded(go)
    expect(go).toHaveBeenCalledOnce()
    expect(guard).not.toHaveBeenCalled()
  })

  it('a question opened over the panel drops the panel’s waiting question, so a later Discard runs nothing', () => {
    let nav!: ReturnType<typeof useNavigate>
    function Grab() {
      nav = useNavigate()
      return null
    }
    render(at('/board?item=US-01.1.1', [h(Grab, { key: 'g' }), h(ItemModal, { key: 'm', id: 'US-01.1.1', docked: true })]))
    click(button('Edit'))
    type(description(), 'Mine')
    const go = vi.fn()
    act(() => guarded(go))
    expect($('[role="alertdialog"]')).toBeTruthy()
    act(() => nav('/board?item=US-01.1.1&question=OQ-01'))
    expect($('[role="alertdialog"]')).toBeNull()
    expect(go).not.toHaveBeenCalled()
  })

  it('New card still creates under StrictMode, which mounts every component twice in development (review)', async () => {
    const createItem = vi.spyOn(api, 'createItem').mockImplementation(async (p) => rev(item({ id: 'US-01.1.7', parent: 'FT-01.1', title: p.title! })))
    render(h(StrictMode, null, at('/outline?item=FT-01.1', h(NewCardButton))))
    click($('button.fab'))
    type($('.new-card-pop input.input'), 'Made')
    await act(async () => void $('.new-card-pop')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    expect(createItem).toHaveBeenCalledWith(expect.objectContaining({ title: 'Made' }))
  })

  it('a New card waiting on the panel’s answer is made from the form as it is then, or not at all', async () => {
    let waiting: (() => void) | null = null
    setLeaveGuard((go) => void (waiting = go))
    const createItem = vi.spyOn(api, 'createItem').mockImplementation(async (p) => rev(item({ id: 'US-01.1.7', parent: 'FT-01.1', title: p.title! })))
    render(at('/board?item=US-01.1.1', h(NewCardButton)))
    click($('button.fab'))
    type($('.new-card-pop input.input'), 'First')
    act(() => void $('.new-card-pop')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    expect(waiting).toBeTruthy()
    type($('.new-card-pop input.input'), 'Second')
    await act(async () => waiting!())
    expect(createItem).toHaveBeenCalledWith(expect.objectContaining({ title: 'Second' }))
  })
})
