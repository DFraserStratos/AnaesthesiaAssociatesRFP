/** The watcher's batching (B07: FINDINGS R-158): one re-sync per burst, with the paths that changed. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEBOUNCE_MS, MAX_WAIT_MS, createWatchBatch } from '../server/watchBatch.ts'

let syncs: (string[] | null)[]
let clock: number
beforeEach(() => {
  vi.useFakeTimers()
  syncs = []
  clock = 0
})
afterEach(() => vi.useRealTimers())

const batch = (opts: { maxPaths?: number } = {}) => createWatchBatch({ sync: (p) => void syncs.push(p), now: () => clock, ...opts })
const advance = (ms: number) => {
  clock += ms
  vi.advanceTimersByTime(ms)
}

describe('the watch batch', () => {
  it('waits for a quiet spell, then re-syncs once with every path seen, each once', () => {
    const b = batch()
    b.event('/r/stories/A.md')
    advance(50)
    b.event('/r/stories/B.md')
    b.event('/r/stories/A.md') // repeated
    advance(DEBOUNCE_MS - 1)
    expect(syncs).toEqual([])
    advance(1)
    expect(syncs).toEqual([['/r/stories/A.md', '/r/stories/B.md']])
  })

  it('never holds a burst back longer than the maximum wait', () => {
    const b = batch()
    for (let t = 0; t < 2000; t += 40) {
      b.event(`/r/stories/${t}.md`)
      advance(40)
    }
    advance(DEBOUNCE_MS)
    // One re-sync about every MAX_WAIT_MS while the burst lasts: updates keep flowing (REQ-06.7).
    expect(syncs.length).toBeGreaterThanOrEqual(Math.floor(2000 / (MAX_WAIT_MS + 40)))
    expect(syncs.length).toBeLessThanOrEqual(Math.ceil(2000 / MAX_WAIT_MS) + 1)
    expect(syncs.flat()).toHaveLength(50)
  })

  it('passes a split add and delete (an atomic rename) and folder events through as paths', () => {
    const b = batch()
    b.event('/r/stories/A.md') // unlink
    b.event('/r/stories/A.md') // add
    b.event('/r/assets/US-1') // unlinkDir
    advance(DEBOUNCE_MS)
    expect(syncs).toEqual([['/r/stories/A.md', '/r/assets/US-1']])
  })

  it('reads the whole folder after a watcher error, or when too many paths changed', () => {
    const b = batch({ maxPaths: 3 })
    b.event('/r/a')
    b.error()
    advance(DEBOUNCE_MS)
    for (const p of ['/r/1', '/r/2', '/r/3', '/r/4']) b.event(p)
    advance(DEBOUNCE_MS)
    b.event('/r/5')
    advance(DEBOUNCE_MS)
    expect(syncs).toEqual([null, null, ['/r/5']])
  })

  it('after a failed re-sync of paths, reads the whole folder at once; a failed whole read waits for the next event (B07 review)', () => {
    let fail = 2
    const seen: (string[] | null)[] = []
    const b = createWatchBatch({
      sync: (p) => {
        seen.push(p)
        if (fail-- > 0) throw new Error('boom')
      },
      now: () => clock,
    })
    b.event('/r/a')
    advance(DEBOUNCE_MS) // paths fail
    advance(1) // the whole read runs at once (fake timers make a 0 ms timer set during a tick 1 ms), and fails too
    expect(seen).toEqual([['/r/a'], null])
    advance(MAX_WAIT_MS * 4)
    expect(seen).toHaveLength(2) // no loop
    b.event('/r/b')
    advance(DEBOUNCE_MS)
    expect(seen).toEqual([['/r/a'], null, null]) // the next burst reads everything, and succeeds
    b.event('/r/c')
    advance(DEBOUNCE_MS)
    expect(seen.at(-1)).toEqual(['/r/c'])
  })

  it('drops a waiting re-sync when closed', () => {
    const b = batch()
    b.event('/r/a')
    b.close()
    advance(MAX_WAIT_MS)
    expect(syncs).toEqual([])
  })
})
