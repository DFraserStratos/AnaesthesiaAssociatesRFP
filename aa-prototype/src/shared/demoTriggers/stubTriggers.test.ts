/** Catch-up Phase 33a: the PWA office stand-in "Office adds the NHI to this stub". */
import { describe, expect, it } from 'vitest'
import { createAppStore } from '../../store/appStore'
import { DEMO_TRIGGERS } from './registry'
import type { DemoTriggerCtx } from './types'
import { SEED_STUB } from '../../domain/seed/intakeSeed'

const t = DEMO_TRIGGERS.find((x) => x.id === 'stub-office-adds-nhi')!
const ctx = (listId: string): DemoTriggerCtx => ({ pathname: `/mobile/lists/${listId}`, params: { listId }, published: {} })

describe('stub-office-adds-nhi', () => {
  it('is a PWA-only office stand-in on the mobile List detail', () => {
    expect(t.surfaces).toEqual(['pwa'])
    expect(t.badge).toBe('office-stand-in')
    expect(t.routes).toEqual(['/mobile/lists/:listId'])
  })
  it("adds the seeded row's NHI: the Booking takes the stub's place, then the entry is disabled", () => {
    const api = createAppStore()
    expect(t.disabledReason?.(api.getState(), ctx(SEED_STUB.listId), undefined)).toBeNull()
    const res = t.run(api, ctx(SEED_STUB.listId), undefined)
    expect(res).toEqual({ ok: true, message: "The office added the NHI. The Booking now stands in the stub's place." })
    const s = api.getState()
    expect(s.intake.stubs[SEED_STUB.stubId]?.status).toBe('resolved')
    expect(s.audit.some((a) => a.action === 'stub.resolve' && a.who === 'AA office (simulated)')).toBe(true)
    expect(t.disabledReason?.(s, ctx(SEED_STUB.listId), undefined)).toBe('No stub on this List')
  })
  it('is disabled on a List with no stub', () => {
    const api = createAppStore()
    expect(t.disabledReason?.(api.getState(), ctx('L-34821-2026-11-24-AM'), undefined)).toBe('No stub on this List')
  })
})
