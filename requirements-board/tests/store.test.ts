/** The catalogue store's card-move bookkeeping: debounced, patch-based, never lost, never undone by its own echo. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CatalogueChange, CatalogueDelivery, Item, Layout, Rev } from '../shared/types.ts'
import { item } from './fixtures.ts'

const putLayout = vi.fn<(patch: { positions: Record<string, { x: number; y: number } | null> }) => Promise<Layout>>()
const catalogue = vi.fn()
const batchItems = vi.fn()
const changeLane = vi.fn()
vi.mock('../src/api.ts', () => ({
  api: { putLayout: (p: never) => putLayout(p), catalogue: () => catalogue(), batchItems: (c: never) => batchItems(c), changeLane: (c: never) => changeLane(c) },
  ApiError: class extends Error {
    blocked?: unknown[]
    constructor(message: string, blocked?: unknown[]) {
      super(message)
      this.blocked = blocked
    }
  },
}))

const stored = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => stored.get(k) ?? null,
  setItem: (k: string, v: string) => void stored.set(k, v),
  removeItem: (k: string) => void stored.delete(k),
})
const { useCatalogue, useView } = await import('../src/store.ts')
const { addChange } = await import('../shared/delivery.ts')
/** One change, as the server sends it: a numbered delivery. */
let seq = 0
const deliver = (c: CatalogueChange) => {
  const d: CatalogueDelivery = { epoch: 'test', seq: ++seq }
  addChange(d, c)
  useCatalogue.getState().applyDelivery(d)
}
const { parseConfig } = await import('../shared/config.ts')
const s = () => useCatalogue.getState()

beforeEach(async () => {
  vi.useFakeTimers()
  putLayout.mockReset()
  catalogue.mockReset()
  // Drain anything a previous test left pending.
  putLayout.mockResolvedValue({ positions: {}, lanes: [] })
  await s().flushLayout()
  putLayout.mockReset()
  useCatalogue.setState({ layout: { positions: {}, lanes: [] }, layoutError: undefined, past: [], future: [] })
})
afterEach(() => vi.useRealTimers())

describe('card moves', () => {
  it('sends moves as one debounced, rounded patch', async () => {
    putLayout.mockResolvedValue({ positions: {}, lanes: [] })
    s().setPositions({ a: { x: 1.4, y: 2.6 } })
    s().setPositions({ b: { x: 3, y: 4 } })
    expect(putLayout).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(400)
    expect(putLayout).toHaveBeenCalledTimes(1)
    expect(putLayout.mock.calls[0]![0]).toEqual({ positions: { a: { x: 1, y: 3 }, b: { x: 3, y: 4 } } })
  })

  it('keeps moves from a failed save and resends them', async () => {
    putLayout.mockRejectedValueOnce(new Error('offline'))
    s().setPositions({ a: { x: 1, y: 1 } })
    await vi.advanceTimersByTimeAsync(400)
    expect(s().layoutError).toMatch(/offline/)
    putLayout.mockResolvedValue({ positions: {}, lanes: [] })
    expect(await s().flushLayout()).toBe(true)
    expect(putLayout.mock.calls.at(-1)![0]).toEqual({ positions: { a: { x: 1, y: 1 } } })
    expect(s().layoutError).toBeUndefined()
  })

  it('lets a move made during a failed save win over the one that failed', async () => {
    let fail!: (e: Error) => void
    putLayout.mockImplementationOnce(() => new Promise((_, reject) => (fail = reject)))
    s().setPositions({ a: { x: 1, y: 1 } })
    await vi.advanceTimersByTimeAsync(400)
    s().setPositions({ a: { x: 9, y: 9 } }) // while the first save is in flight
    fail(new Error('boom'))
    await vi.advanceTimersByTimeAsync(0)
    putLayout.mockResolvedValue({ positions: {}, lanes: [] })
    await s().flushLayout()
    expect(putLayout.mock.calls.at(-1)![0]).toEqual({ positions: { a: { x: 9, y: 9 } } })
  })

  it('retries failed moves when the layout file changes on disk', async () => {
    putLayout.mockRejectedValueOnce(new Error('board-layout.json cannot be read'))
    s().setPositions({ a: { x: 1, y: 1 } })
    await vi.advanceTimersByTimeAsync(400)
    putLayout.mockResolvedValue({ positions: {}, lanes: [] })
    deliver({ kind: 'layout', layout: { positions: {}, lanes: [] } }) // someone fixed the file
    await vi.advanceTimersByTimeAsync(0)
    expect(putLayout).toHaveBeenCalledTimes(2)
    expect(s().layoutError).toBeUndefined()
  })

  it('ignores a layout event while moves are still waiting to be sent', () => {
    s().setPositions({ a: { x: 1, y: 1 } })
    deliver({ kind: 'layout', layout: { positions: {}, lanes: [] } })
    expect(s().layout.positions.a).toEqual({ x: 1, y: 1 })
  })

  it('keeps unsent moves on top of a fresh load', async () => {
    putLayout.mockRejectedValue(new Error('offline'))
    s().setPositions({ a: { x: 7, y: 7 } })
    await vi.advanceTimersByTimeAsync(400)
    catalogue.mockResolvedValue({ items: {}, questions: {}, issues: [], layout: { positions: { a: { x: 0, y: 0 }, b: { x: 2, y: 2 } } } })
    await s().load()
    expect(s().layout.positions).toEqual({ a: { x: 7, y: 7 }, b: { x: 2, y: 2 } })
  })
})

describe('Mapped moves', () => {
  const recs = (): Record<string, Rev<Item>> => ({
    'US-01.1.1': { data: item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1 }), rev: 'r1' },
    'US-01.1.2': { data: item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2 }), rev: 'r2' },
  })
  beforeEach(() => {
    vi.useRealTimers()
    batchItems.mockReset()
    useCatalogue.setState({ items: recs(), moveError: undefined })
  })

  it('reflows at once, sends each record with its rev, then adopts the saved revs', async () => {
    let resolve!: (v: { records: Rev<Item>[] }) => void
    batchItems.mockImplementation(() => new Promise((r) => (resolve = r)))
    const saved = s().moveItems([{ id: 'US-01.1.2', order: 1, swimlane: 'MVP' }, { id: 'US-01.1.1', order: 2 }])
    expect(s().items['US-01.1.2']!.data).toMatchObject({ order: 1, swimlane: 'MVP' })
    await Promise.resolve()
    expect(batchItems.mock.calls[0]![0]).toEqual([
      { id: 'US-01.1.2', baseRev: 'r2', patch: { order: 1, swimlane: 'MVP' } },
      { id: 'US-01.1.1', baseRev: 'r1', patch: { order: 2 } },
    ])
    resolve({ records: [{ data: { ...s().items['US-01.1.2']!.data }, rev: 'r2b' }, { data: { ...s().items['US-01.1.1']!.data }, rev: 'r1b' }] })
    expect(await saved).toBe(true)
    expect(s().items['US-01.1.2']!.rev).toBe('r2b')
  })

  it('rolls the move back and says why when the server refuses it', async () => {
    batchItems.mockRejectedValue(new Error('US-01.1.2 changed on disk since you opened it'))
    expect(await s().moveItems([{ id: 'US-01.1.2', order: 1 }, { id: 'US-01.1.1', order: 2 }])).toBe(false)
    expect(s().items['US-01.1.2']!.data.order).toBe(2)
    expect(s().items['US-01.1.1']!.data.order).toBe(1)
    expect(s().moveError).toMatch(/US-01\.1\.2 changed on disk/)
  })
})

describe('undo and redo', () => {
  const recs = (): Record<string, Rev<Item>> => ({
    'FT-01.1': { data: item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', order: 1 }), rev: 'f1' },
    'FT-01.2': { data: item({ id: 'FT-01.2', type: 'feature', parent: 'EP-01', order: 2 }), rev: 'f2' },
    'US-01.1.1': { data: item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1 }), rev: 'r1' },
    'US-01.1.2': { data: item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2 }), rev: 'r2' },
  })
  /** The server echoes each patched record back with a fresh rev. */
  const echo = () =>
    batchItems.mockImplementation(async (changes: { id: string; patch: Partial<Item> }[]) => ({
      records: changes.map((c) => ({ data: { ...s().items[c.id]!.data, ...c.patch }, rev: `${s().items[c.id]!.rev}+` })),
    }))
  const move = [{ id: 'US-01.1.2', parent: 'FT-01.2', order: 1 }]

  beforeEach(() => {
    vi.useRealTimers()
    batchItems.mockReset()
    useCatalogue.setState({ items: recs(), moveError: undefined, past: [], future: [], stepping: false })
  })

  it('undoes and redoes a Freeform drag, including a card put back in its story-map place', async () => {
    putLayout.mockResolvedValue({ positions: {}, lanes: [] })
    s().setPositions({ a: { x: 5, y: 5 } }, { label: 'Move A' })
    s().setPositions({ a: null }, { label: 'Tidy all' })
    expect(s().past.map((e) => e.label)).toEqual(['Move A', 'Tidy all'])
    expect(await s().undo()).toBe(true)
    expect(s().layout.positions.a).toEqual({ x: 5, y: 5 })
    expect(await s().undo()).toBe(true)
    expect(s().layout.positions.a).toBeUndefined()
    expect(await s().redo()).toBe(true)
    expect(s().layout.positions.a).toEqual({ x: 5, y: 5 })
    expect(s().future.map((e) => e.label)).toEqual(['Tidy all'])
  })

  it('does not record a drag that changed nothing', () => {
    s().setPositions({ a: null })
    expect(s().past).toEqual([])
  })

  it('undoes a Mapped move by sending the old fields back, then redoes it', async () => {
    echo()
    expect(await s().moveItems(move, { label: 'Move story' })).toBe(true)
    expect(await s().undo()).toBe(true)
    expect(batchItems.mock.calls[1]![0]).toEqual([{ id: 'US-01.1.2', baseRev: 'r2+', patch: { parent: 'FT-01.1', order: 2 } }])
    expect(s().items['US-01.1.2']!.data).toMatchObject({ parent: 'FT-01.1', order: 2 })
    expect(s().future).toHaveLength(1)
    expect(await s().redo()).toBe(true)
    expect(s().items['US-01.1.2']!.data).toMatchObject({ parent: 'FT-01.2', order: 1 })
    expect(s().past).toHaveLength(1)
  })

  it('does not record a move the server refused', async () => {
    batchItems.mockRejectedValue(new Error('nope'))
    expect(await s().moveItems(move)).toBe(false)
    expect(s().past).toEqual([])
  })

  it('refuses to undo a move whose card has changed since, and drops that history', async () => {
    echo()
    await s().moveItems([{ id: 'US-01.1.1', order: 3 }])
    await s().moveItems(move)
    const cur = s().items['US-01.1.2']!
    deliver({ kind: 'item', id: 'US-01.1.2', record: { data: { ...cur.data, parent: 'FT-01.1' }, rev: 'agent' } })
    expect(await s().undo()).toBe(false)
    expect(batchItems).toHaveBeenCalledTimes(2)
    expect(s().moveError).toMatch(/Can't undo/)
    expect(s().past).toEqual([])
  })

  it('still undoes when a moved card was only retitled', async () => {
    echo()
    await s().moveItems(move)
    const cur = s().items['US-01.1.2']!
    deliver({ kind: 'item', id: 'US-01.1.2', record: { data: { ...cur.data, title: 'Renamed' }, rev: 'agent' } })
    expect(await s().undo()).toBe(true)
    expect(s().items['US-01.1.2']!.data).toMatchObject({ parent: 'FT-01.1', title: 'Renamed' })
  })

  it('clears redo when a new move is made', async () => {
    echo()
    await s().moveItems(move)
    await s().undo()
    expect(s().future).toHaveLength(1)
    await s().moveItems([{ id: 'US-01.1.1', order: 3 }])
    expect(s().future).toEqual([])
  })

  it('keeps lane renames out of card-move history', async () => {
    changeLane.mockResolvedValue({ records: [{ data: item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, swimlane: 'Later' }), rev: 'r2' }], layout: { positions: {}, lanes: ['Later'], lanesRev: 'L2' } })
    useCatalogue.setState({ items: { ...recs(), 'US-01.1.1': { data: item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, swimlane: 'MVP' }), rev: 'r1' } }, layout: { positions: {}, lanes: ['MVP'], lanesRev: 'L1' } })
    expect(await s().renameLane('MVP', 'Later')).toBe(true)
    expect(s().past).toEqual([])
  })
})

describe('renaming or removing a lane is one write (R-56)', () => {
  const inMvp = () => ({
    'US-01.1.1': { data: item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, swimlane: 'MVP' }), rev: 'r1' },
    'US-01.1.2': { data: item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, swimlane: 'MVP' }), rev: 'r2' },
    'US-01.1.3': { data: item({ id: 'US-01.1.3', parent: 'FT-01.1', order: 3, swimlane: 'Later' }), rev: 'r3' },
  })
  beforeEach(() => {
    changeLane.mockReset()
    batchItems.mockReset()
    putLayout.mockClear()
    useCatalogue.setState({ items: inMvp(), layout: { positions: {}, lanes: ['MVP', 'Later'], lanesRev: 'L1' }, moveError: undefined, past: [] })
  })
  const swimlanes = () => Object.values(s().items).map((r) => [r.data.id, r.data.swimlane])

  it('a rename sends one request carrying every story in the lane and the lane list rev, and takes both back from the answer', async () => {
    changeLane.mockResolvedValue({
      records: [
        { data: item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, swimlane: 'Now' }), rev: 'r1b' },
        { data: item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, swimlane: 'Now' }), rev: 'r2b' },
      ],
      layout: { positions: {}, lanes: ['Now', 'Later'], lanesRev: 'L2' },
    })
    expect(await s().renameLane('MVP', 'Now')).toBe(true)
    expect(changeLane).toHaveBeenCalledTimes(1)
    expect(changeLane).toHaveBeenCalledWith({ op: 'rename', from: 'MVP', to: 'Now', lanesRev: 'L1', stories: { 'US-01.1.1': 'r1', 'US-01.1.2': 'r2' } })
    expect(batchItems).not.toHaveBeenCalled()
    expect(putLayout).not.toHaveBeenCalled()
    expect(swimlanes()).toEqual([
      ['US-01.1.1', 'Now'],
      ['US-01.1.2', 'Now'],
      ['US-01.1.3', 'Later'],
    ])
    expect(s().layout).toMatchObject({ lanes: ['Now', 'Later'], lanesRev: 'L2' })
  })

  it('a refused rename leaves the stories and the lanes as they were, and says why', async () => {
    changeLane.mockRejectedValue(new Error('board-layout.json cannot be read; fix or delete it before changing lanes'))
    expect(await s().renameLane('MVP', 'Now')).toBe(false)
    expect(swimlanes()).toEqual(Object.values(inMvp()).map((r) => [r.data.id, r.data.swimlane]))
    expect(s().layout.lanes).toEqual(['MVP', 'Later'])
    expect(s().moveError).toMatch(/^Lane not renamed: board-layout.json cannot be read/)
  })

  it('a removal refused for a stale story leaves everything, and shows the newer copy it was given', async () => {
    const { ApiError } = await import('../src/api.ts')
    const newer = { data: item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 8, swimlane: 'MVP' }), rev: 'r2-agent' }
    changeLane.mockRejectedValue(new (ApiError as unknown as new (m: string, b: unknown[]) => Error)('the stories in "MVP" changed on disk since you looked; look again', [{ id: 'US-01.1.2', current: newer }]))
    expect(await s().deleteLane('MVP')).toBe(false)
    expect(changeLane).toHaveBeenCalledWith({ op: 'remove', from: 'MVP', lanesRev: 'L1', stories: { 'US-01.1.1': 'r1', 'US-01.1.2': 'r2' } })
    expect(s().items['US-01.1.1']!.data.swimlane).toBe('MVP')
    expect(s().items['US-01.1.2']).toEqual(newer)
    expect(s().layout.lanes).toEqual(['MVP', 'Later'])
    expect(s().moveError).toMatch(/^Lane not removed: /)
  })

  it('a good removal clears the stories and drops the lane', async () => {
    changeLane.mockResolvedValue({
      records: [
        { data: item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, swimlane: null }), rev: 'r1b' },
        { data: item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, swimlane: null }), rev: 'r2b' },
      ],
      layout: { positions: {}, lanes: ['Later'], lanesRev: 'L2' },
    })
    expect(await s().deleteLane('MVP')).toBe(true)
    expect(swimlanes().filter(([, l]) => l === 'MVP')).toEqual([])
    expect(s().layout.lanes).toEqual(['Later'])
  })

  it('the lane list rev follows layout events and lane saves', async () => {
    deliver({ kind: 'layout', layout: { positions: {}, lanes: ['MVP', 'Later', 'New'], lanesRev: 'L9' } })
    expect(s().layout.lanesRev).toBe('L9')
    putLayout.mockResolvedValue({ positions: {}, lanes: ['MVP', 'Later'], lanesRev: 'L10' })
    await s().setLanes(['MVP', 'Later'])
    expect(s().layout.lanesRev).toBe('L10')
  })
})

describe('the saved status filter (R-46)', () => {
  const SIX = [
    { code: 1, label: 'Proposed', role: 'default' },
    { code: 2, label: 'Open', role: 'waiting' },
    { code: 3, label: 'Verify', settle: true },
    { code: 4, label: 'Agreed', settle: true },
    { code: 5, label: 'Confirmed', settle: true },
    { code: 6, label: 'Retired', role: 'retired' },
  ]
  const config = (text: string) => parseConfig(text).config
  const saved = () => JSON.parse(stored.get('requirements-board:view') ?? '{}').statuses as string[] | undefined

  it('survives a config that is broken for a moment, and goes only when its status is really gone', () => {
    useView.getState().set({ statuses: ['6'] })
    const before = saved()
    expect(before).toEqual(['6'])
    for (const broken of ['{ "statuses": [ ,', JSON.stringify({ statuses: SIX.map((d) => (d.code === 5 ? { ...d, role: 'retired' } : d)) }), JSON.stringify({ statuses: { Retired: 6 } })]) {
      deliver({ kind: 'config', config: config(broken) })
      expect(useView.getState().statuses, broken).toEqual(['6'])
      expect(saved(), broken).toEqual(['6'])
    }
    deliver({ kind: 'config', config: config(JSON.stringify({ statuses: SIX })) })
    expect(useView.getState().statuses).toEqual(['6'])
    // Removed for real: a filter naming it would hide every card.
    deliver({ kind: 'config', config: config(JSON.stringify({ statuses: SIX.filter((d) => d.code !== 6).map((d) => (d.code === 5 ? { ...d, settle: undefined, role: 'retired' } : d)) })) })
    expect(useView.getState().statuses).toEqual([])
    expect(saved()).toEqual([])
  })
})
