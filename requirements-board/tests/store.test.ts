/** The catalogue store's card-move bookkeeping: debounced, patch-based, never lost, never undone by its own echo. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Layout } from '../shared/types.ts'

const putLayout = vi.fn<(patch: { positions: Record<string, { x: number; y: number } | null> }) => Promise<Layout>>()
const catalogue = vi.fn()
vi.mock('../src/api.ts', () => ({ api: { putLayout: (p: never) => putLayout(p), catalogue: () => catalogue() }, ApiError: class extends Error {} }))

const { useCatalogue } = await import('../src/store.ts')
const s = () => useCatalogue.getState()

beforeEach(async () => {
  vi.useFakeTimers()
  putLayout.mockReset()
  catalogue.mockReset()
  // Drain anything a previous test left pending.
  putLayout.mockResolvedValue({ positions: {} })
  await s().flushLayout()
  putLayout.mockReset()
  useCatalogue.setState({ layout: { positions: {} }, layoutError: undefined })
})
afterEach(() => vi.useRealTimers())

describe('card moves', () => {
  it('sends moves as one debounced, rounded patch', async () => {
    putLayout.mockResolvedValue({ positions: {} })
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
    putLayout.mockResolvedValue({ positions: {} })
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
    putLayout.mockResolvedValue({ positions: {} })
    await s().flushLayout()
    expect(putLayout.mock.calls.at(-1)![0]).toEqual({ positions: { a: { x: 9, y: 9 } } })
  })

  it('retries failed moves when the layout file changes on disk', async () => {
    putLayout.mockRejectedValueOnce(new Error('board-layout.json cannot be read'))
    s().setPositions({ a: { x: 1, y: 1 } })
    await vi.advanceTimersByTimeAsync(400)
    putLayout.mockResolvedValue({ positions: {} })
    s().applyEvent({ kind: 'layout', layout: { positions: {} } }) // someone fixed the file
    await vi.advanceTimersByTimeAsync(0)
    expect(putLayout).toHaveBeenCalledTimes(2)
    expect(s().layoutError).toBeUndefined()
  })

  it('ignores a layout event while moves are still waiting to be sent', () => {
    s().setPositions({ a: { x: 1, y: 1 } })
    s().applyEvent({ kind: 'layout', layout: { positions: {} } })
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
