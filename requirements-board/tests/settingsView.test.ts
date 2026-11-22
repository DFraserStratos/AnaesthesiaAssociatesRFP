// @vitest-environment jsdom
/**
 * B06 · Settings in the browser: a section changed on disk while edited is caught, and Keep mine keeps
 * both sides without two statuses sharing a code (R-45); a damaged status list, project or components
 * section is locked until fixed, and comes back live (R-01, B06-Q4); components count artifacts, show the
 * ones in use but unlisted, and never lock a row being typed (R-123, R-124, B06-Q3); a section at rest is
 * never dirty (R-124, R-125). Each failed on the board before B06.
 */
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseConfig, type BoardConfig } from '../shared/config.ts'
import type { Artifact, ArtifactRec } from '../shared/types.ts'
import { api, ApiError } from '../src/api.ts'
import { useCatalogue } from '../src/store.ts'
import { SettingsView } from '../src/views/SettingsView.tsx'
import { item } from './fixtures.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
;(globalThis as { __BOARD_VERSION__?: string }).__BOARD_VERSION__ = 'test'

const SIX = [
  { code: 1, label: 'Proposed', help: '', tone: 'neutral', role: 'default' },
  { code: 2, label: 'Draft', help: '', tone: 'sand' },
  { code: 3, label: 'Verify', help: 'Check it', tone: 'amber' },
  { code: 4, label: 'Agreed', help: '', tone: 'olive', settle: true },
  { code: 5, label: 'Confirmed', help: '', tone: 'green' },
  { code: 6, label: 'Retired', help: '', tone: 'neutral', role: 'retired' },
]
const cfg = (raw: Record<string, unknown>) => parseConfig(JSON.stringify({ project: { name: 'Acme' }, statuses: SIX, ...raw })).config

let host: HTMLElement
let root: Root
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ text: null, rev: null }), { status: 200, headers: { 'Content-Type': 'application/json' } })))
  useCatalogue.setState({
    status: 'ready',
    items: {
      'US-01.1.1': { data: item({ id: 'US-01.1.1', status: '1', components: ['Core'] }), rev: 'a' },
      'US-01.1.2': { data: item({ id: 'US-01.1.2', status: '4', components: ['Mobile'] }), rev: 'b' },
    },
    questions: {},
    artifacts: {},
    issues: [],
    config: cfg({ components: [{ name: 'Core' }, { name: 'Mobile' }] }),
  })
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const show = () => act(() => root.render(h(MemoryRouter, null, h(SettingsView))))
const section = (name: string) => document.querySelector<HTMLElement>(`section[aria-label="${name}"]`)!
const buttonIn = (name: string, text: string) => [...section(name).querySelectorAll('button')].find((b) => b.textContent?.trim() === text) as HTMLButtonElement | undefined
const field = (name: string, label: string) => section(name).querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)
const click = (el: Element | null | undefined) => act(() => void (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })))
function type(el: HTMLInputElement | null, value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, value)
    el!.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
const setConfig = (config: BoardConfig) => act(() => useCatalogue.setState({ config }))
const settle = () => act(async () => {})

describe('a section changed on disk while it is edited (R-45)', () => {
  it('shows the conflict, and Keep mine keeps the reworded help and the status added on disk', async () => {
    const putConfig = vi.spyOn(api, 'putConfig').mockImplementation(async (p) => cfg({ components: [{ name: 'Core' }, { name: 'Mobile' }], statuses: p.statuses }))
    show()
    type(field('Item statuses', 'What Draft means'), 'Being written')
    // An agent adds status 7 meanwhile.
    setConfig(cfg({ components: [{ name: 'Core' }, { name: 'Mobile' }], statuses: [...SIX, { code: 7, label: 'On hold', help: '', tone: 'neutral' }] }))
    const now = useCatalogue.getState().config.revs.statuses
    expect(section('Item statuses').querySelector('[role="alert"]')?.textContent).toContain('changed in board.config.json')
    expect(buttonIn('Item statuses', 'Save')?.disabled).toBe(true)
    click(buttonIn('Item statuses', 'Keep mine'))
    expect(field('Item statuses', 'Name of On hold')).toBeTruthy()
    expect(field('Item statuses', 'What Draft means')?.value).toBe('Being written')
    click(buttonIn('Item statuses', 'Save'))
    await settle()
    const sent = putConfig.mock.calls[0]![0]
    expect(sent.bases).toEqual({ statuses: now }) // saved over the file as it is now, not as it was
    expect(sent.statuses!.map((d) => `${d.code} ${d.help}`)).toEqual(['1 ', '2 Being written', '3 Check it', '4 ', '5 ', '6 ', '7 '])
  })

  it('a new status and one added on disk never share a code', () => {
    show()
    click(buttonIn('Item statuses', 'Add status'))
    type(field('Item statuses', 'Name of New status'), 'Mine')
    setConfig(cfg({ components: [{ name: 'Core' }, { name: 'Mobile' }], statuses: [...SIX, { code: 7, label: 'Theirs', help: '', tone: 'neutral' }] }))
    click(buttonIn('Item statuses', 'Keep mine'))
    const codes = [...section('Item statuses').querySelectorAll('.status-no')].map((c) => c.textContent)
    expect(codes).toEqual(['1', '2', '3', '4', '5', '6', '7', '8'])
    expect(section('Item statuses').textContent).toContain('your new status 7 is now 8')
  })

  it('a save refused as stale (409) shows the conflict too, and Load theirs takes the file', async () => {
    const theirs = cfg({ components: [{ name: 'Core' }, { name: 'Mobile' }, { name: 'Billing' }] })
    vi.spyOn(api, 'putConfig').mockRejectedValue(new ApiError(409, 'components changed', { data: theirs.components, rev: theirs.revs.components } as never, { section: 'components' }))
    show()
    click(buttonIn('Components', 'Add component'))
    type(field('Components', 'Name of new component'), 'Reports')
    click(buttonIn('Components', 'Save'))
    await settle()
    expect(section('Components').querySelector('[role="alert"]')?.textContent).toContain('changed in board.config.json')
    click(buttonIn('Components', 'Load theirs'))
    expect(field('Components', 'Name of Billing')).toBeTruthy()
    expect(field('Components', 'Name of Reports')).toBeNull()
  })
})

describe('a section that does not read cleanly is locked (R-01, B06-Q4)', () => {
  it('a damaged status list offers no rows, no Add, no Save; the other sections still work; it comes back live', () => {
    setConfig(cfg({ components: [{ name: 'Core' }, { name: 'Mobile' }], statuses: [...SIX, { ...SIX[1] }] }))
    show()
    const items = section('Item statuses')
    expect(items.textContent).toContain('until board.config.json is fixed')
    expect(items.textContent).toContain('listed twice')
    expect(items.querySelector('.status-tr')).toBeNull()
    expect(buttonIn('Item statuses', 'Add status')).toBeUndefined()
    expect(buttonIn('Item statuses', 'Save')).toBeUndefined()
    expect(buttonIn('Question statuses', 'Add status')).toBeTruthy()
    setConfig(cfg({ components: [{ name: 'Core' }, { name: 'Mobile' }] }))
    expect(field('Item statuses', 'Name of Draft')).toBeTruthy()
  })

  it('a components or project section read with problems is locked, and comes back live', () => {
    setConfig(cfg({ components: [{ name: 'Core' }, { code: 'X' }], project: 'Acme' }))
    show()
    expect(section('Components').textContent).toContain('has no name')
    expect(buttonIn('Components', 'Save')).toBeUndefined()
    expect(section('Project').textContent).toContain('project must be an object')
    expect(buttonIn('Project', 'Save')).toBeUndefined()
    setConfig(cfg({ components: [{ name: 'Core' }, { name: 'Mobile' }] }))
    expect(buttonIn('Components', 'Save')).toBeTruthy()
    expect(buttonIn('Project', 'Save')).toBeTruthy()
  })
})

describe('components (R-123, R-124)', () => {
  const withArtifact = (components: string[]) =>
    act(() => useCatalogue.setState({ artifacts: { 'AR-01': { data: { id: 'AR-01', title: 'A', components } as unknown as Artifact, rev: 'x' } as ArtifactRec } }))

  it('counts artifacts: one used only by an artifact cannot be removed', () => {
    setConfig(cfg({ components: [{ name: 'Core' }, { name: 'Mobile' }, { name: 'Reports' }] }))
    withArtifact(['Reports'])
    show()
    const row = field('Components', 'Name of Reports')!.closest('.status-tr')!
    expect(row.textContent).toContain('1 card or artifact')
    expect(row.querySelector<HTMLButtonElement>('button[aria-label="Remove"]')!.disabled).toBe(true)
  })

  it('a first component shows the ones in use with their counts, and Save waits until they are listed', () => {
    setConfig(cfg({}))
    show()
    click(buttonIn('Components', 'Add component'))
    type(field('Components', 'Name of new component'), 'Billing')
    const note = section('Components').querySelector('[aria-label="In use, not listed"]')
    expect(note?.textContent).toContain('Core (1 card or artifact)')
    expect(note?.textContent).toContain('Mobile (1 card or artifact)')
    expect(buttonIn('Components', 'Save')?.disabled).toBe(true)
    click(buttonIn('Components', 'Add them'))
    expect(buttonIn('Components', 'Save')?.disabled).toBe(false)
  })

  it('a new row typed to the name of a component in use is never locked; the duplicate is named instead', () => {
    show()
    click(buttonIn('Components', 'Add component'))
    type(field('Components', 'Name of new component'), 'Core')
    const typed = [...section('Components').querySelectorAll<HTMLInputElement>('input.status-name')].at(-1)!
    expect(typed.disabled).toBe(false)
    expect(section('Components').textContent).toContain('"Core" is listed twice')
  })
})

describe('a section at rest is never dirty (R-124, R-125)', () => {
  it('a lower-case code on disk leaves the section clean', () => {
    setConfig(cfg({ components: [{ name: 'Core', code: 'cor' }, { name: 'Mobile' }] }))
    show()
    expect(buttonIn('Components', 'Save')?.disabled).toBe(true)
    expect(buttonIn('Components', 'Discard changes')).toBeUndefined()
  })

  it('typing on while a section saves is kept as an unsaved change (review)', async () => {
    let answer!: (c: BoardConfig) => void
    vi.spyOn(api, 'putConfig').mockReturnValue(new Promise((r) => (answer = r)))
    show()
    const name = section('Project').querySelector<HTMLInputElement>('input.status-name')!
    type(name, 'Acme Two')
    click(buttonIn('Project', 'Save'))
    type(name, 'Acme Three')
    await act(async () => answer(cfg({ components: [{ name: 'Core' }, { name: 'Mobile' }], project: { name: 'Acme Two' } })))
    expect(name.value).toBe('Acme Three')
    expect(buttonIn('Project', 'Save')?.disabled).toBe(false)
  })

  it('a project name saved with outer spaces shows trimmed, and Save turns off', async () => {
    vi.spyOn(api, 'putConfig').mockImplementation(async (p) => {
      const next = cfg({ components: [{ name: 'Core' }, { name: 'Mobile' }], project: p.project })
      return next
    })
    show()
    type(field('Project', 'Project name') ?? section('Project').querySelector('input.status-name'), '  Acme Two  ')
    click(buttonIn('Project', 'Save'))
    await settle()
    expect(section('Project').querySelector<HTMLInputElement>('input.status-name')!.value).toBe('Acme Two')
    expect(buttonIn('Project', 'Save')?.disabled).toBe(true)
  })
})
