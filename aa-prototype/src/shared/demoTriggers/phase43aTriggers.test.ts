/**
 * Catch-up Phase 43a's demo triggers: the PWA's "Sign out" stand-in and "Show
 * first-run hints again" on every app. Neither touches AppState: the session
 * and the dismissals are per-viewer browser storage.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAppStore } from '../../store/appStore'
import { DEMO_TRIGGERS } from './registry'
import { demoTriggersFor } from './match'
import type { DemoTrigger, DemoTriggerCtx } from './types'
import { clearAnaesthetistSession, isSignedIn, signInSession, useSessionStore } from '../session/anaesthetistSession'
import { anyHintDismissed, clearFirstRunHintDismissals, dismissHint, useHintStore } from '../help/firstRunHints'

function byId(id: string): DemoTrigger {
  const t = DEMO_TRIGGERS.find((x) => x.id === id)
  if (t === undefined) throw new Error(`no trigger ${id}`)
  return t
}
const ctx = (pathname: string): DemoTriggerCtx => ({ pathname, params: {}, published: {} })
const visible = (api: ReturnType<typeof createAppStore>, path: string, surface: 'bar' | 'pwa') => demoTriggersFor(api.getState(), path, surface).map((m) => m.trigger.id)

describe('Sign out (catch-up Phase 43a, PWA parity)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    clearAnaesthetistSession()
  })
  afterEach(() => window.localStorage.clear())

  it('shows only on the PWA surface on a mobile route', () => {
    const api = createAppStore()
    expect(visible(api, '/mobile/lists', 'pwa')).toContain('pwa-sign-out')
    expect(visible(api, '/mobile/more', 'pwa')).toContain('pwa-sign-out')
    expect(visible(api, '/mobile/lists', 'bar')).not.toContain('pwa-sign-out')
    expect(visible(api, '/admin', 'pwa')).not.toContain('pwa-sign-out')
  })

  it('is disabled while signed out; running it signs out and writes one audit row', () => {
    const api = createAppStore()
    const t = byId('pwa-sign-out')
    // The PWA's default with nothing stored is signed out.
    expect(t.disabledReason(api.getState(), ctx('/mobile/lists'))).toBe('Already signed out')
    signInSession('m.souter@aa-associates.example')
    expect(t.disabledReason(api.getState(), ctx('/mobile/lists'))).toBeNull()
    const before = api.getState().audit.length
    const res = t.run(api, ctx('/mobile/lists'))
    expect(res).toEqual({ ok: true, message: 'Signed out. Tap Sign in to come back.' })
    expect(isSignedIn('signed-out')).toBe(false)
    expect(useSessionStore.getState().stored).toEqual({ signedIn: false, account: 'm.souter@aa-associates.example' })
    const rows = api.getState().audit.slice(before)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.action).toBe('auth.signOut')
    expect(t.disabledReason(api.getState(), ctx('/mobile/lists'))).toBe('Already signed out')
  })
})

describe('Show first-run hints again (catch-up Phase 43a)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    clearFirstRunHintDismissals()
  })
  afterEach(() => window.localStorage.clear())

  it('shows on a mobile, web and admin route in the bar and on the PWA surface', () => {
    const api = createAppStore()
    for (const path of ['/mobile/lists', '/web/dashboard', '/admin', '/admin/day/2026-07-21']) expect(visible(api, path, 'bar')).toContain('show-first-run-hints')
    expect(visible(api, '/mobile/lists', 'pwa')).toContain('show-first-run-hints')
  })

  it('is disabled until a hint is dismissed; running it clears all three and touches no AppState', () => {
    const api = createAppStore()
    const t = byId('show-first-run-hints')
    expect(t.disabledReason(api.getState(), ctx('/admin'))).toBe('No welcome card has been dismissed')
    dismissHint('mobile')
    dismissHint('web')
    dismissHint('admin')
    expect(t.disabledReason(api.getState(), ctx('/admin'))).toBeNull()
    const state = api.getState()
    expect(t.run(api, ctx('/admin'))).toEqual({ ok: true, message: 'The welcome cards will show again.' })
    expect(anyHintDismissed()).toBe(false)
    expect(useHintStore.getState().dismissed).toEqual({ mobile: false, web: false, admin: false })
    expect(api.getState()).toBe(state)
  })
})
