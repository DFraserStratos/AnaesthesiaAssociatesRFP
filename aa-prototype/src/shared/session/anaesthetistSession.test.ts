import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type SessionModule = typeof import('./anaesthetistSession')

/** A fresh module instance, so its store reads storage again as a new page load would. */
async function load(): Promise<SessionModule> {
  vi.resetModules()
  return import('./anaesthetistSession')
}

const SRC = import.meta.glob('./*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

describe('anaesthetist session (Phase 43a, US-13.5.3)', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('takes the host default when nothing is stored', async () => {
    const s = await load()
    expect(s.isSignedIn('signed-in')).toBe(true)
    expect(s.isSignedIn('signed-out')).toBe(false)
  })

  it('sign in, sign out and clear persist across a fresh store over the same storage', async () => {
    let s = await load()
    s.signInSession(' m.souter@aa-associates.example ')
    s = await load()
    expect(s.isSignedIn('signed-out')).toBe(true)
    expect(s.useSessionStore.getState().stored).toEqual({ signedIn: true, account: 'm.souter@aa-associates.example' })

    s.signOutSession()
    s = await load()
    expect(s.isSignedIn('signed-in')).toBe(false)
    expect(s.useSessionStore.getState().stored?.account).toBe('m.souter@aa-associates.example')

    s.clearAnaesthetistSession()
    s = await load()
    expect(s.useSessionStore.getState().stored).toBeNull()
    expect(s.isSignedIn('signed-in')).toBe(true)
    expect(s.isSignedIn('signed-out')).toBe(false)
  })

  it('a throwing localStorage gives the default and no exception', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const s = await load()
    expect(s.isSignedIn('signed-out')).toBe(false)
    expect(() => s.signInSession('m.souter@aa-associates.example')).not.toThrow()
    // In memory for this page, though it will not survive a reload.
    expect(s.isSignedIn('signed-out')).toBe(true)
    expect(() => s.signOutSession()).not.toThrow()
    expect(() => s.clearAnaesthetistSession()).not.toThrow()
  })

  it('ignores a malformed stored value', async () => {
    window.localStorage.setItem('aa-anaesthetist-session', '{"signedIn":"yes"}')
    const s = await load()
    expect(s.isSignedIn('signed-out')).toBe(false)
  })

  it('imports nothing from apps, shell or store (PWA closure)', () => {
    for (const [file, source] of Object.entries(SRC)) {
      const specifiers = [...source.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]!)
      for (const spec of specifiers) {
        expect(spec, `${file} imports ${spec}`).not.toMatch(/\/(apps|shell|store)(\/|$)/)
      }
    }
  })
})
