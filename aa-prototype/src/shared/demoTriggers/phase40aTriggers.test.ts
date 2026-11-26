/**
 * Catch-up Phase 40a's demo trigger: "Hub: Available / Slow / Unavailable",
 * shown on both surfaces only while an NHI lookup surface publishes
 * `nhiHub.inUse` (item 13's PWA parity pin).
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from '../../store/appStore'
import { SEED_LIST_IDS } from '../../domain/seed'
import { DEMO_TRIGGERS } from './registry'
import { demoTriggersFor } from './match'

const trigger = DEMO_TRIGGERS.find((t) => t.id === 'nhi-hub-mode')!
const LIST = `/mobile/lists/${SEED_LIST_IDS.souterPm21}`
const inUse = { 'nhiHub.inUse': true } as const

describe('nhi-hub-mode (catch-up Phase 40a)', () => {
  it('shows on the PWA sheet and the bar only while a lookup surface is open', () => {
    const state = createAppStore().getState()
    for (const surface of ['pwa', 'bar'] as const) {
      expect(demoTriggersFor(state, LIST, surface).some((m) => m.trigger.id === 'nhi-hub-mode')).toBe(false)
      expect(demoTriggersFor(state, LIST, surface, inUse).some((m) => m.trigger.id === 'nhi-hub-mode')).toBe(true)
    }
    for (const path of [`/web/lists/${SEED_LIST_IDS.souterPm21}`, '/admin/day/2026-11-24', '/admin/draft-lists', '/admin/people/patients/ZAM1098', '/admin/intake']) {
      expect(demoTriggersFor(state, path, 'bar', inUse).some((m) => m.trigger.id === 'nhi-hub-mode'), path).toBe(true)
    }
    expect(demoTriggersFor(state, '/admin/finances/billing', 'bar', inUse).some((m) => m.trigger.id === 'nhi-hub-mode')).toBe(false)
  })

  it('offers the three modes, disables the current one, and sets the mode', () => {
    const api = createAppStore()
    const ctx = { pathname: LIST, params: {}, published: inUse }
    expect(trigger.choices!(api.getState(), ctx).map((c) => c.label)).toEqual(['Available', 'Slow', 'Unavailable'])
    expect(trigger.defaultChoice!(api.getState(), ctx)).toBe('slow')
    expect(trigger.disabledReason(api.getState(), ctx, 'available')).toBe('Already set')
    expect(trigger.disabledReason(api.getState(), ctx, 'unavailable')).toBeNull()
    const res = trigger.run(api, ctx, 'unavailable')
    expect(res).toEqual({ ok: true, message: 'The simulated Hub now answers as Unavailable. The next lookup shows the manual fallback.' })
    expect(api.getState().settings.nhiHubMode).toBe('unavailable')
    expect(trigger.disabledReason(api.getState(), ctx, 'unavailable')).toBe('Already set')
    trigger.run(api, ctx, 'available')
    expect(api.getState().settings.nhiHubMode).toBeUndefined()
  })
})
