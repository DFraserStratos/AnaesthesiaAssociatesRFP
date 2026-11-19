/**
 * The store's live-update path and card-move queue (B07): FINDINGS R-58 (a snapshot never takes the
 * store back), R-59 (layout saves in order), R-57 (removed cards leave no position), R-40 (unsaved moves
 * guarded and kept across a reload), R-159 (one store update per delivery; unchanged records keep their
 * identity; artifact facts compared).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ArtifactRec, CatalogueDelivery, CatalogueSnapshot, Item, Layout, Rev } from '../shared/types.ts'
import { item } from './fixtures.ts'

const putLayout = vi.fn<(patch: { positions: Record<string, { x: number; y: number } | null> }) => Promise<Layout>>()
const catalogue = vi.fn<() => Promise<CatalogueSnapshot>>()
const batchItems = vi.fn()
const deleteItem = vi.fn()
vi.mock('../src/api.ts', () => ({
  api: {
    putLayout: (p: never) => putLayout(p),
    catalogue: () => catalogue(),
    batchItems: (c: never) => batchItems(c),
    deleteItem: (...a: never[]) => deleteItem(...a),
  },
  ApiError: class extends Error {},
}))

/** Browser storage: local for preferences, session for this tab's unsaved moves (kept across "reloads"). */
const area = () => {
  const m = new Map<string, string>()
  return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }
}
const local = area()
const session = area()
vi.stubGlobal('localStorage', local)
vi.stubGlobal('sessionStorage', session)
const KEPT = 'requirements-board:unsaved-moves'

type Store = typeof import('../src/store.ts')
let store: Store
/** A fresh page: the store module loaded anew over the same session storage (a reload of this tab). */
async function page(): Promise<Store> {
  vi.resetModules()
  store = await import('../src/store.ts')
  return store
}
const s = () => store.useCatalogue.getState()

const rec = (id: string, rev: string, over: Partial<Item> = {}): Rev<Item> => ({ data: item({ id, parent: 'FT-01.1', ...over }), rev })
function snap(seq: number, items: Rev<Item>[], over: Partial<CatalogueSnapshot> = {}): CatalogueSnapshot {
  return { epoch: 'E', seq, items: Object.fromEntries(items.map((r) => [r.data.id, r])), questions: {}, artifacts: {}, layout: { positions: {}, lanes: [] }, config: undefined as never, issues: [], assets: {}, ...over }
}
const deliver = (d: Omit<CatalogueDelivery, 'epoch'> & { epoch?: string }) => s().applyDelivery({ epoch: 'E', ...d })
/** A promise the test resolves or rejects by hand. */
function held<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: Error) => void
  const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)))
  return { promise, resolve, reject }
}

beforeEach(async () => {
  vi.useFakeTimers()
  session.m.clear()
  for (const f of [putLayout, catalogue, batchItems, deleteItem]) f.mockReset()
  putLayout.mockResolvedValue({ positions: {}, lanes: [] })
  await page()
})
afterEach(() => vi.useRealTimers())

describe('a snapshot never takes the store back (R-58)', () => {
  it('keeps a delete, an update and a layout change that arrive while the snapshot is on its way', async () => {
    const pending = held<CatalogueSnapshot>()
    catalogue.mockReturnValue(pending.promise)
    const loading = s().load()
    deliver({ seq: 6, items: { 'US-01.1.2': null } })
    deliver({ seq: 7, items: { 'US-01.1.1': rec('US-01.1.1', 'r2', { title: 'Newer' }) }, layout: { positions: { 'US-01.1.3': { x: 5, y: 5 } }, lanes: ['Next'] } })
    // The snapshot was taken at delivery 5: older than both.
    pending.resolve(snap(5, [rec('US-01.1.1', 'r1'), rec('US-01.1.2', 'r1'), rec('US-01.1.3', 'r1')]))
    await loading
    expect(Object.keys(s().items).sort()).toEqual(['US-01.1.1', 'US-01.1.3'])
    expect(s().items['US-01.1.1']!.data.title).toBe('Newer')
    expect(s().layout).toMatchObject({ positions: { 'US-01.1.3': { x: 5, y: 5 } }, lanes: ['Next'] })
    // A delivery the snapshot already held, arriving late, changes nothing.
    deliver({ seq: 5, items: { 'US-01.1.2': rec('US-01.1.2', 'r1') } })
    expect(s().items['US-01.1.2']).toBeUndefined()
  })

  it('of two loads that overlap, the later-started one wins whatever order they answer in', async () => {
    const first = held<CatalogueSnapshot>()
    const second = held<CatalogueSnapshot>()
    catalogue.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const a = s().load() // StrictMode runs the start-up load twice
    const b = s().load()
    second.resolve(snap(4, [rec('US-01.1.1', 'new')]))
    await b
    first.resolve(snap(3, [rec('US-01.1.1', 'old'), rec('US-01.1.9', 'ghost')]))
    await a
    expect(s().items['US-01.1.1']!.rev).toBe('new')
    expect(s().items['US-01.1.9']).toBeUndefined()
  })

  it('applies a batched delivery that arrived mid-load over the snapshot, in one piece', async () => {
    const pending = held<CatalogueSnapshot>()
    catalogue.mockReturnValue(pending.promise)
    const loading = s().load()
    deliver({ seq: 3, items: { 'US-01.1.1': rec('US-01.1.1', 'r2'), 'US-01.1.4': rec('US-01.1.4', 'r1') }, questions: {}, issues: [{ severity: 'error', id: 'x', message: 'm' }], assets: { 'assets/US-01.1.1/a.png': 'v2' } })
    pending.resolve(snap(2, [rec('US-01.1.1', 'r1')], { assets: { 'assets/US-01.1.1/a.png': 'v1' } }))
    await loading
    expect(Object.keys(s().items).sort()).toEqual(['US-01.1.1', 'US-01.1.4'])
    expect(s().issues).toHaveLength(1)
    expect(s().assets['assets/US-01.1.1/a.png']).toBe('v2')
  })

  it('reads everything again when a delivery comes from another server process', async () => {
    catalogue.mockResolvedValue(snap(1, [rec('US-01.1.1', 'r1')]))
    await s().load()
    catalogue.mockResolvedValue(snap(1, [rec('US-01.1.1', 'restarted')], { epoch: 'F' }))
    deliver({ epoch: 'F', seq: 1, items: {} })
    await vi.advanceTimersByTimeAsync(0)
    expect(catalogue).toHaveBeenCalledTimes(2)
    expect(s().items['US-01.1.1']!.rev).toBe('restarted')
  })
})

describe('layout saves are ordered (R-59)', () => {
  it('never sends a save while another is in flight, and a retry sends the newest position', async () => {
    const a = held<Layout>()
    putLayout.mockReturnValueOnce(a.promise)
    s().setPositions({ c: { x: 1, y: 1 } })
    await vi.advanceTimersByTimeAsync(400) // save A in flight
    s().setPositions({ c: { x: 2, y: 2 } })
    await vi.advanceTimersByTimeAsync(400) // save B queued behind A
    expect(putLayout).toHaveBeenCalledTimes(1)
    const b = held<Layout>()
    putLayout.mockReturnValueOnce(b.promise)
    a.reject(new Error('offline'))
    await vi.advanceTimersByTimeAsync(0)
    expect(putLayout).toHaveBeenCalledTimes(2)
    expect(putLayout.mock.calls[1]![0]).toEqual({ positions: { c: { x: 2, y: 2 } } }) // A's older move never won
    b.reject(new Error('offline'))
    await vi.advanceTimersByTimeAsync(0)
    putLayout.mockResolvedValue({ positions: {}, lanes: [] })
    expect(await s().flushLayout()).toBe(true)
    expect(putLayout.mock.calls.at(-1)![0]).toEqual({ positions: { c: { x: 2, y: 2 } } })
  })

  it('a newer move made while the older save fails is the one kept, for a card in both', async () => {
    const a = held<Layout>()
    putLayout.mockReturnValueOnce(a.promise)
    s().setPositions({ c: { x: 1, y: 1 }, d: { x: 1, y: 1 } })
    await vi.advanceTimersByTimeAsync(400)
    s().setPositions({ c: { x: 3, y: 3 } })
    putLayout.mockRejectedValueOnce(new Error('offline'))
    a.reject(new Error('offline'))
    await vi.advanceTimersByTimeAsync(400)
    putLayout.mockResolvedValue({ positions: {}, lanes: [] })
    await s().flushLayout()
    expect(putLayout.mock.calls.at(-1)![0]).toEqual({ positions: { c: { x: 3, y: 3 }, d: { x: 1, y: 1 } } })
  })

  it('a layout delivery during a save leaves the moving card where the user put it and moves the rest', async () => {
    const a = held<Layout>()
    putLayout.mockReturnValueOnce(a.promise)
    s().setPositions({ c: { x: 9, y: 9 } })
    await vi.advanceTimersByTimeAsync(400)
    deliver({ seq: 1, layout: { positions: { c: { x: 0, y: 0 }, e: { x: 4, y: 4 } }, lanes: [] } }) // an earlier echo, plus an agent's move
    expect(s().layout.positions).toEqual({ c: { x: 9, y: 9 }, e: { x: 4, y: 4 } })
    a.resolve({ positions: {}, lanes: [] })
    await vi.advanceTimersByTimeAsync(0)
    deliver({ seq: 2, layout: { positions: { c: { x: 9, y: 9 }, e: { x: 4, y: 4 } }, lanes: [] } })
    expect(s().layout.positions.c).toEqual({ x: 9, y: 9 })
  })
})

describe('removed cards leave no position behind (R-57)', () => {
  const live = () => store.useCatalogue.setState({ items: { 'US-01.1.1': rec('US-01.1.1', 'r1'), 'US-01.1.2': rec('US-01.1.2', 'r1') } })

  it('drag, delete in this tab, undo: no save names the deleted card, and the empty history entry is gone', async () => {
    live()
    s().setPositions({ 'US-01.1.1': { x: 5, y: 5 } })
    await vi.advanceTimersByTimeAsync(400)
    s().setPositions({ 'US-01.1.1': { x: 6, y: 6 } }) // waiting in the debounce when the card goes
    deleteItem.mockResolvedValue({ deleted: ['US-01.1.1'], records: [], questions: [] })
    await s().deleteItem('US-01.1.1', 'r1', ['US-01.1.1'])
    expect(s().past).toEqual([])
    expect(await s().undo()).toBe(false)
    await vi.advanceTimersByTimeAsync(400)
    await s().flushLayout()
    for (const [p] of putLayout.mock.calls.slice(1)) expect(Object.keys(p.positions)).not.toContain('US-01.1.1')
    expect(store.hasUnsavedMoves()).toBe(false)
  })

  it('a card removed on disk (a delivery) leaves undo, redo, waiting and failed saves alike', async () => {
    live()
    putLayout.mockRejectedValueOnce(new Error('offline'))
    s().setPositions({ 'US-01.1.1': { x: 5, y: 5 }, 'US-01.1.2': { x: 1, y: 1 } })
    await vi.advanceTimersByTimeAsync(400) // failed: kept for a retry
    deliver({ seq: 1, items: { 'US-01.1.1': null } })
    expect(s().past.map((e) => (e.kind === 'positions' ? Object.keys(e.after) : []))).toEqual([['US-01.1.2']])
    await s().flushLayout()
    expect(putLayout.mock.calls.at(-1)![0]).toEqual({ positions: { 'US-01.1.2': { x: 1, y: 1 } } })
    expect(JSON.parse(session.m.get(KEPT) ?? '{"positions":{}}').positions['US-01.1.1']).toBeUndefined()
  })

  it('a card removed while its save is in flight is not put back by that save failing', async () => {
    live()
    const a = held<Layout>()
    putLayout.mockReturnValueOnce(a.promise)
    s().setPositions({ 'US-01.1.1': { x: 5, y: 5 }, 'US-01.1.2': { x: 1, y: 1 } })
    await vi.advanceTimersByTimeAsync(400)
    deliver({ seq: 1, items: { 'US-01.1.1': null } })
    a.reject(new Error('offline'))
    await vi.advanceTimersByTimeAsync(0)
    await s().flushLayout()
    expect(putLayout.mock.calls.at(-1)![0]).toEqual({ positions: { 'US-01.1.2': { x: 1, y: 1 } } })
  })
})

describe('unsaved card moves are guarded and kept (R-40)', () => {
  it('the leave guard asks while a move waits, fails, is in flight, or a Mapped move is in flight', async () => {
    expect(store.hasUnsavedMoves()).toBe(false)
    s().setPositions({ c: { x: 1, y: 1 } })
    expect(store.hasUnsavedMoves()).toBe(true) // in the debounce
    const a = held<Layout>()
    putLayout.mockReturnValueOnce(a.promise)
    await vi.advanceTimersByTimeAsync(400)
    expect(store.hasUnsavedMoves()).toBe(true) // in flight
    a.reject(new Error('offline'))
    await vi.advanceTimersByTimeAsync(0)
    expect(store.hasUnsavedMoves()).toBe(true) // failed, waiting for a retry
    await s().flushLayout()
    expect(store.hasUnsavedMoves()).toBe(false)
    store.useCatalogue.setState({ items: { 'US-01.1.1': rec('US-01.1.1', 'r1') } })
    const m = held<{ records: Rev<Item>[] }>()
    batchItems.mockReturnValueOnce(m.promise)
    const moving = s().moveItems([{ id: 'US-01.1.1', swimlane: 'Next' }])
    await vi.advanceTimersByTimeAsync(0)
    expect(store.hasUnsavedMoves()).toBe(true) // a Mapped move in flight
    m.resolve({ records: [rec('US-01.1.1', 'r2', { swimlane: 'Next' })] })
    await moving
    expect(store.hasUnsavedMoves()).toBe(false)
  })

  it('moves unsaved at a reload come back after the next load, are sent once, and are then forgotten', async () => {
    putLayout.mockRejectedValue(new Error('offline'))
    s().setPositions({ 'US-01.1.1': { x: 7, y: 7 }, 'US-01.1.9': { x: 3, y: 3 } })
    await vi.advanceTimersByTimeAsync(400)
    expect(session.m.has(KEPT)).toBe(true)
    // Reload: a new page over the same tab's storage. US-01.1.9 was deleted meanwhile; US-01.1.2 moved on disk.
    await page()
    putLayout.mockReset()
    putLayout.mockResolvedValue({ positions: {}, lanes: [] })
    catalogue.mockResolvedValue(snap(1, [rec('US-01.1.1', 'r1'), rec('US-01.1.2', 'r1')], { layout: { positions: { 'US-01.1.1': { x: 0, y: 0 }, 'US-01.1.2': { x: 8, y: 8 } }, lanes: [] } }))
    await s().load()
    expect(s().layout.positions).toEqual({ 'US-01.1.1': { x: 7, y: 7 }, 'US-01.1.2': { x: 8, y: 8 } })
    await vi.advanceTimersByTimeAsync(0)
    expect(putLayout.mock.calls).toEqual([[{ positions: { 'US-01.1.1': { x: 7, y: 7 } } }]])
    expect(session.m.has(KEPT)).toBe(false)
    expect(store.hasUnsavedMoves()).toBe(false)
    await s().load()
    await vi.advanceTimersByTimeAsync(0)
    expect(putLayout).toHaveBeenCalledTimes(1) // not resent
  })

  it('a Mapped move queued behind another is kept for a reload too (B07 review)', async () => {
    store.useCatalogue.setState({ items: { 'US-01.1.1': rec('US-01.1.1', 'r1'), 'US-01.1.2': rec('US-01.1.2', 'r1') } })
    batchItems.mockReturnValue(new Promise(() => {})) // the first never answers
    void s().moveItems([{ id: 'US-01.1.1', swimlane: 'Next' }])
    void s().moveItems([{ id: 'US-01.1.2', swimlane: 'Later' }]) // waits behind it
    await vi.advanceTimersByTimeAsync(0)
    expect(JSON.parse(session.m.get(KEPT)!).mapped).toEqual([[{ id: 'US-01.1.1', swimlane: 'Next' }], [{ id: 'US-01.1.2', swimlane: 'Later' }]])
  })

  it('a Mapped move in flight at a reload is checked, never replayed: landed says nothing, lost says so', async () => {
    store.useCatalogue.setState({ items: { 'US-01.1.1': rec('US-01.1.1', 'r1', { swimlane: 'MVP' }) } })
    batchItems.mockReturnValue(new Promise(() => {})) // never answers before the reload
    void s().moveItems([{ id: 'US-01.1.1', swimlane: 'Next' }])
    await vi.advanceTimersByTimeAsync(0)
    const kept = session.m.get(KEPT)!
    for (const [onDisk, said] of [
      ['Next', undefined],
      ['MVP', /US-01\.1\.1 was being moved, and the move did not land/],
    ] as const) {
      session.m.set(KEPT, kept)
      await page()
      batchItems.mockReset()
      catalogue.mockResolvedValue(snap(1, [rec('US-01.1.1', 'r2', { swimlane: onDisk })]))
      await s().load()
      if (said) expect(s().moveError).toMatch(said)
      else expect(s().moveError).toBeUndefined()
      expect(batchItems).not.toHaveBeenCalled()
    }
  })
})

describe('one delivery, one store update (R-159)', () => {
  it('notifies subscribers once for N changes and keeps unchanged records as they were', async () => {
    catalogue.mockResolvedValue(snap(1, [rec('US-01.1.1', 'r1'), rec('US-01.1.2', 'r1'), rec('US-01.1.3', 'r1')]))
    await s().load()
    const before = s().items
    let updates = 0
    const off = store.useCatalogue.subscribe(() => updates++)
    deliver({ seq: 2, items: { 'US-01.1.1': rec('US-01.1.1', 'r2'), 'US-01.1.2': null, 'US-01.1.4': rec('US-01.1.4', 'r1') }, layout: { positions: { x: { x: 1, y: 1 } }, lanes: [] }, issues: [] })
    off()
    expect(updates).toBe(1)
    expect(s().items['US-01.1.3']).toBe(before['US-01.1.3'])
    // An echo at revs the tab holds changes nothing at all.
    const now = s().items
    deliver({ seq: 3, items: { 'US-01.1.1': now['US-01.1.1']! } })
    expect(s().items).toBe(now)
  })

  it("ignores an artifact entry at the rev and facts held, and applies one whose file's facts changed", () => {
    const art = (rev: string, fileRev: string) => ({ data: { id: 'AR-01' }, rev, meta: { format: 'svg', fileRev } }) as unknown as ArtifactRec
    store.useCatalogue.setState({ artifacts: { 'AR-01': art('a', 'f1') } })
    const held = s().artifacts
    deliver({ seq: 1, artifacts: { 'AR-01': art('a', 'f1') } })
    expect(s().artifacts).toBe(held)
    deliver({ seq: 2, artifacts: { 'AR-01': art('a', 'f2') } })
    expect(s().artifacts['AR-01']!.meta.fileRev).toBe('f2')
  })

  it('a screenshot version on its own changes no record', () => {
    store.useCatalogue.setState({ items: { 'US-01.1.1': rec('US-01.1.1', 'r1') }, assets: { 'assets/US-01.1.1/a.png': 'v1' } })
    const { items, questions, layout } = s()
    deliver({ seq: 1, assets: { 'assets/US-01.1.1/a.png': 'v2', 'assets/US-01.1.1/b.png': null } })
    expect(s().assets).toEqual({ 'assets/US-01.1.1/a.png': 'v2' })
    expect(s().items).toBe(items)
    expect(s().questions).toBe(questions)
    expect(s().layout).toBe(layout)
  })
})
