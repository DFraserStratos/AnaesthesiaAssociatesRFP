import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type HintsModule = typeof import('./firstRunHints')

/** A fresh module instance, so its store reads storage again as a new page load would. */
async function load(): Promise<HintsModule> {
  vi.resetModules()
  return import('./firstRunHints')
}

const SRC = import.meta.glob('./*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

describe('first-run hints (Phase 43a)', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('shows every hint on a fresh browser', async () => {
    const h = await load()
    expect(h.useHintStore.getState().dismissed).toEqual({ mobile: false, web: false, admin: false })
    expect(h.anyHintDismissed()).toBe(false)
  })

  it('a dismissal persists across a fresh store over the same storage', async () => {
    let h = await load()
    h.dismissHint('web')
    expect(window.localStorage.getItem('aa-first-run-hint-web')).not.toBeNull()
    h = await load()
    expect(h.useHintStore.getState().dismissed).toEqual({ mobile: false, web: true, admin: false })
    expect(h.anyHintDismissed()).toBe(true)
  })

  it('clearing brings all three back', async () => {
    let h = await load()
    h.dismissHint('mobile')
    h.dismissHint('admin')
    h.clearFirstRunHintDismissals()
    expect(h.anyHintDismissed()).toBe(false)
    h = await load()
    expect(h.anyHintDismissed()).toBe(false)
  })

  it('a throwing localStorage leaves every hint showing and throws nothing', async () => {
    const blocked = () => {
      throw new Error('blocked')
    }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked)
    const h = await load()
    expect(h.useHintStore.getState().dismissed).toEqual({ mobile: false, web: false, admin: false })
    expect(() => h.dismissHint('mobile')).not.toThrow()
    expect(() => h.clearFirstRunHintDismissals()).not.toThrow()
  })

  it('src/shared/help imports nothing from apps, shell or store (PWA closure)', () => {
    for (const [file, src] of Object.entries(SRC)) {
      if (file.includes('.test.')) continue
      expect(src, file).not.toMatch(/from '\.\.\/\.\.\/(apps|shell|store)/)
      expect(src, file).not.toMatch(/from '\.\.\/\.\.\/\.\.\//)
    }
  })
})
