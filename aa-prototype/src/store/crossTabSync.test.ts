/**
 * Live sync between tabs (crossTabSync.ts): another tab's write to the key
 * arrives as a window `storage` event, the store rehydrates from it, and
 * nothing is written back (no echo). jsdom does not fire `storage` for this
 * window's own writes, so each test writes the "other tab's" payload straight
 * to localStorage and dispatches the event by hand, as the browser would in
 * the receiving tab.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppStore, PERSIST_KEY, PERSIST_VERSION, type AppState } from './appStore'
import { bindCrossTabSync } from './crossTabSync'
import { flushPersist } from './persistStorage'

/** What the other tab writes: this store's state with one setting changed. */
function otherTabPayload(state: AppState, overrides: Partial<AppState>): string {
  const plain: Record<string, unknown> = { ...state }
  for (const k of Object.keys(plain)) if (typeof plain[k] === 'function') delete plain[k]
  return JSON.stringify({ state: { ...plain, ...overrides }, version: PERSIST_VERSION })
}

function arrive(newValue: string | null, key: string | null = PERSIST_KEY): void {
  // The browser has already updated storage by the time the event fires.
  if (key === null) localStorage.clear()
  else if (newValue === null) localStorage.removeItem(key)
  else localStorage.setItem(key, newValue)
  window.dispatchEvent(new StorageEvent('storage', { key, newValue, storageArea: localStorage }))
}

describe('cross-tab sync', () => {
  let unbind: () => void = () => {}

  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => {
    unbind()
    vi.restoreAllMocks()
    flushPersist()
    localStorage.clear()
  })

  it("rehydrates from the other tab's write and queues no write back", () => {
    const store = createAppStore({ persisted: true })
    unbind = bindCrossTabSync(store, PERSIST_KEY)
    const s = store.getState()
    const payload = otherTabPayload(s, { settings: { ...s.settings, contactArchiveInactivityDays: 77 } })

    const write = vi.spyOn(Storage.prototype, 'setItem')
    arrive(payload)
    const writesByEvent = write.mock.calls.length // the simulated other tab's own write

    expect(store.getState().settings.contactArchiveInactivityDays).toBe(77)
    // Nothing queued: a flush writes nothing, and storage still holds exactly the other tab's payload.
    flushPersist()
    expect(write.mock.calls.length).toBe(writesByEvent)
    expect(localStorage.getItem(PERSIST_KEY)).toBe(payload)
  })

  it("drops this tab's pending write (last writer wins) and keeps this tab's own app", () => {
    const store = createAppStore({ persisted: true })
    unbind = bindCrossTabSync(store, PERSIST_KEY)
    store.getState().setCurrentApp('mobile')
    // A local mutation still queued behind the 250 ms timer.
    store.getState().nextSuggestionSeq()
    const s = store.getState()
    const payload = otherTabPayload(s, {
      settings: { ...s.settings, contactArchiveInactivityDays: 55 },
      shell: { currentApp: 'admin', suggestionSeq: 0 },
    })

    const write = vi.spyOn(Storage.prototype, 'setItem')
    arrive(payload)
    const writesByEvent = write.mock.calls.length

    expect(store.getState().settings.contactArchiveInactivityDays).toBe(55)
    expect(store.getState().shell.suggestionSeq).toBe(0)
    // The Admin tab's view does not drag this (mobile) tab with it.
    expect(store.getState().shell.currentApp).toBe('mobile')
    flushPersist()
    expect(write.mock.calls.length).toBe(writesByEvent)
    expect(localStorage.getItem(PERSIST_KEY)).toBe(payload)
  })

  it('takes a cleared key as storage holding nothing: no rehydrate, and no stale write resurrects it', () => {
    const store = createAppStore({ persisted: true })
    unbind = bindCrossTabSync(store, PERSIST_KEY)
    store.getState().nextSuggestionSeq() // pending local write
    const before = store.getState()

    arrive(null)
    expect(store.getState()).toBe(before)
    flushPersist()
    expect(localStorage.getItem(PERSIST_KEY)).toBeNull()
  })

  it('ignores other keys, and binds a store only once', () => {
    const store = createAppStore({ persisted: true })
    unbind = bindCrossTabSync(store, PERSIST_KEY)
    const again = bindCrossTabSync(store, PERSIST_KEY)
    const add = vi.spyOn(window, 'addEventListener')
    bindCrossTabSync(store, PERSIST_KEY)
    expect(add).not.toHaveBeenCalled()
    again()

    const before = store.getState()
    window.dispatchEvent(new StorageEvent('storage', { key: 'something-else', newValue: '{}', storageArea: localStorage }))
    expect(store.getState()).toBe(before)
  })

  it('resumes ordinary writes after an adopt', () => {
    const store = createAppStore({ persisted: true })
    unbind = bindCrossTabSync(store, PERSIST_KEY)
    const s = store.getState()
    arrive(otherTabPayload(s, { settings: { ...s.settings, contactArchiveInactivityDays: 33 } }))

    store.getState().nextSuggestionSeq()
    flushPersist()
    const stored = JSON.parse(localStorage.getItem(PERSIST_KEY) ?? '{}') as { state: AppState }
    expect(stored.state.shell.suggestionSeq).toBe(1)
    expect(stored.state.settings.contactArchiveInactivityDays).toBe(33)
  })
})
