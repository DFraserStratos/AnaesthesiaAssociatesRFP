/**
 * The persisted store's storage wrapper (Phase A2).
 *
 * Two behaviours, both invisible until a demo runs on a phone:
 *
 *  1. COALESCING — zustand re-serialises the whole ~1.1 MB store on every
 *     mutation and writes it inline inside `setState`. A trailing timer
 *     collapses a burst into one write; the last value wins; `pagehide` /
 *     `visibilitychange` flush what is still queued.
 *  2. FAILURE LATCHING — zustand has no try/catch on that path, so a
 *     `QuotaExceededError` would throw out of `mutate()` into a click handler,
 *     past every error boundary, AFTER the in-memory state had already changed.
 *     The wrapper swallows it, latches persistence off and stops retrying.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

type PersistStorage = typeof import('./persistStorage')

/**
 * A FRESH module instance per test. The queue, the timer handle and the
 * `persistDisabled` latch are all module-level (one persisted store per page),
 * so tests must not inherit each other's. Loaded BEFORE the fake timers are
 * installed, so the dynamic import is never waiting on a faked clock.
 */
async function loadStorage(): Promise<PersistStorage> {
  vi.resetModules()
  localStorage.clear()
  return import('./persistStorage')
}

/**
 * A distinct key per test. Each reloaded module instance leaves its own flush
 * listeners attached to the window, so a stale instance can still fire; giving
 * every test its own key means it can never land on the key under assertion.
 */
let keyCounter = 0
function nextKey(): string {
  keyCounter += 1
  return `aa-demo-test-${keyCounter}`
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  localStorage.clear()
})

describe('coalescing the write', () => {
  it('collapses a burst of setItems into one localStorage write, last value wins', async () => {
    const { resilientLocalStorage } = await loadStorage()
    const key = nextKey()
    const write = vi.spyOn(Storage.prototype, 'setItem')
    vi.useFakeTimers()

    resilientLocalStorage.setItem(key, 'first')
    resilientLocalStorage.setItem(key, 'second')
    resilientLocalStorage.setItem(key, 'third')
    // Nothing has touched storage yet - the whole point.
    expect(write).not.toHaveBeenCalled()

    vi.advanceTimersByTime(250)
    expect(write).toHaveBeenCalledTimes(1)
    expect(write).toHaveBeenCalledWith(key, 'third')
    expect(localStorage.getItem(key)).toBe('third')
  })

  it('flushPersist writes synchronously and disarms the pending timer', async () => {
    const { resilientLocalStorage, flushPersist } = await loadStorage()
    const key = nextKey()
    const write = vi.spyOn(Storage.prototype, 'setItem')
    vi.useFakeTimers()

    resilientLocalStorage.setItem(key, 'flushed')
    flushPersist()
    expect(localStorage.getItem(key)).toBe('flushed')
    expect(write).toHaveBeenCalledTimes(1)

    // The armed timer was cancelled, so the value is not written a second time.
    vi.advanceTimersByTime(5_000)
    expect(write).toHaveBeenCalledTimes(1)
  })

  it('flushes on pagehide (an iOS PWA being killed)', async () => {
    const { resilientLocalStorage } = await loadStorage()
    const key = nextKey()
    vi.useFakeTimers()

    resilientLocalStorage.setItem(key, 'backgrounded')
    expect(localStorage.getItem(key)).toBeNull()

    window.dispatchEvent(new Event('pagehide'))
    expect(localStorage.getItem(key)).toBe('backgrounded')
  })

  it('flushes when the document becomes hidden, and not when it becomes visible', async () => {
    const { resilientLocalStorage } = await loadStorage()
    const key = nextKey()
    vi.useFakeTimers()
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')

    resilientLocalStorage.setItem(key, 'still here')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(localStorage.getItem(key)).toBeNull()

    visibility.mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(localStorage.getItem(key)).toBe('still here')
  })

  it('removeItem clears the key and cancels its queued write', async () => {
    const { resilientLocalStorage } = await loadStorage()
    const key = nextKey()
    localStorage.setItem(key, 'on disk')
    const write = vi.spyOn(Storage.prototype, 'setItem')
    vi.useFakeTimers()

    resilientLocalStorage.setItem(key, 'doomed')
    resilientLocalStorage.removeItem(key)
    vi.advanceTimersByTime(5_000)

    expect(localStorage.getItem(key)).toBeNull()
    expect(write).not.toHaveBeenCalled()
    expect(resilientLocalStorage.getItem(key)).toBeNull()
  })
})

describe('reading back before the flush', () => {
  it('getItem returns the queued value in preference to storage', async () => {
    const { resilientLocalStorage, flushPersist } = await loadStorage()
    const key = nextKey()
    localStorage.setItem(key, 'on disk')
    vi.useFakeTimers()

    resilientLocalStorage.setItem(key, 'in flight')
    // Read-after-write inside the same tick sees the write, storage does not.
    expect(resilientLocalStorage.getItem(key)).toBe('in flight')
    expect(localStorage.getItem(key)).toBe('on disk')

    flushPersist()
    expect(resilientLocalStorage.getItem(key)).toBe('in flight')
    expect(localStorage.getItem(key)).toBe('in flight')
  })

  it('getItem returns null for a key nothing has written', async () => {
    const { resilientLocalStorage } = await loadStorage()
    expect(resilientLocalStorage.getItem(nextKey())).toBeNull()
  })
})

describe('a failing write', () => {
  /** The failure zustand does not guard: quota exhausted mid-mutation. */
  function throwOnWrite() {
    return vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    })
  }

  it('does not propagate a QuotaExceededError, and latches persistence off', async () => {
    const { resilientLocalStorage, flushPersist, persistStatus } = await loadStorage()
    const key = nextKey()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    throwOnWrite()
    vi.useFakeTimers()

    expect(persistStatus().disabled).toBe(false)
    resilientLocalStorage.setItem(key, 'over budget')
    // The throw is swallowed here, NOT re-thrown into the caller's click handler.
    expect(() => flushPersist()).not.toThrow()

    const status = persistStatus()
    expect(status.disabled).toBe(true)
    expect(status.reason).toContain('QuotaExceededError')
  })

  it('does not throw from the trailing timer either, and stops attempting writes', async () => {
    const { resilientLocalStorage, persistStatus } = await loadStorage()
    const key = nextKey()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const write = throwOnWrite()
    vi.useFakeTimers()

    resilientLocalStorage.setItem(key, 'over budget')
    expect(() => vi.advanceTimersByTime(250)).not.toThrow()
    expect(persistStatus().disabled).toBe(true)

    // Latched: later mutations queue nothing and never reach storage again.
    write.mockClear()
    resilientLocalStorage.setItem(key, 'later still')
    vi.advanceTimersByTime(5_000)
    expect(write).not.toHaveBeenCalled()
    // The session stays self-consistent even though nothing is being persisted.
    expect(resilientLocalStorage.getItem(key)).toBe('later still')
  })
})

describe('bytes', () => {
  it('reports the payload size in BYTES, not UTF-16 code units', async () => {
    const { resilientLocalStorage, bytes } = await loadStorage()
    const key = nextKey()
    // A macron, as in a real NZ patient name: two bytes, one code unit.
    const payload = JSON.stringify({ state: { patient: 'Māori Whānau' } })
    vi.useFakeTimers()

    resilientLocalStorage.setItem(key, payload)
    expect(bytes(key)).toBe(new TextEncoder().encode(payload).length)
    expect(bytes(key)).toBeGreaterThan(payload.length)
    // No argument: the key this module last touched, which in the app is the
    // one persisted store.
    expect(bytes()).toBe(bytes(key))
  })

  it('reads a value already in storage, and reports 0 for an unknown key', async () => {
    const { bytes } = await loadStorage()
    const key = nextKey()
    localStorage.setItem(key, 'twelve bytes')
    expect(bytes(key)).toBe(12)
    expect(bytes(nextKey())).toBe(0)
  })

  it('tracks the queued payload before it is flushed', async () => {
    const { resilientLocalStorage, bytes } = await loadStorage()
    const key = nextKey()
    localStorage.setItem(key, 'tiny')
    vi.useFakeTimers()

    resilientLocalStorage.setItem(key, 'a considerably longer payload')
    expect(bytes(key)).toBe(29)
  })
})
