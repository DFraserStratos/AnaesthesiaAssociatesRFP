/**
 * Catch-up Phase 43a's demo trigger: the PWA's "Sign out" stand-in. It doesn't
 * touch AppState: the session is per-viewer browser storage.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAppStore } from '../../store/appStore'
import { DEMO_TRIGGERS } from './registry'
import { demoTriggersFor } from './match'
import type { DemoTrigger, DemoTriggerCtx } from './types'
import { clearAnaesthetistSession, isSignedIn, signInSession, useSessionStore } from '../session/anaesthetistSession'

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
