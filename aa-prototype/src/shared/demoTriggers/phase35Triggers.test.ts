import { describe, expect, it } from 'vitest'
import { createAppStore } from '../../store'
import { DEMO_TRIGGERS } from './registry'
import { demoTriggersFor } from './match'
import type { DemoTriggerCtx } from './types'

const byId = (id: string) => DEMO_TRIGGERS.find((t) => t.id === id)!
const ctx = (pathname: string, params: Record<string, string> = {}, published: DemoTriggerCtx['published'] = {}): DemoTriggerCtx => ({ pathname, params, published })

describe('Phase 35 entries (explicit save and named office users)', () => {
  it('Switch office user shows on the Day view and the Booking detail, bar only, toggles the user and waits on an unsaved draft', () => {
    const api = createAppStore()
    const on = (path: string) => demoTriggersFor(api.getState(), path, 'bar', {}).map((m) => m.trigger.id)
    expect(on('/admin/day/2026-07-21')).toContain('switch-office-user')
    expect(on('/admin/day/2026-07-21/bookings/BK0001')).toContain('switch-office-user')
    expect(on('/admin/review')).not.toContain('switch-office-user')
    expect(on('/mobile/lists')).not.toContain('switch-office-user')
    const entry = byId('switch-office-user')
    expect(entry.surfaces).toEqual(['bar'])
    expect(entry.run(api, ctx('/admin'))).toEqual({ ok: true, message: 'The office is now Sam T.' })
    expect(api.getState().shell.officeUser).toBe('sam')
    expect(entry.run(api, ctx('/admin'))).toEqual({ ok: true, message: 'The office is now Kirsty W.' })
    expect(entry.disabledReason(api.getState(), ctx('/admin', {}, { 'adminBooking.dirtyBookingId': 'BK0001' }))).not.toBeNull()
    expect(entry.disabledReason(api.getState(), ctx('/admin'))).toBeNull()
  })

  it('Office edits this Booking is a PWA office stand-in that saves one change set as Kirsty W.', () => {
    const api = createAppStore()
    const s = api.getState()
    const booking = Object.values(s.schedule.bookings).find(
      (b) => b.cancellation === undefined && b.scheduledTime !== undefined && b.scheduledTime < '20:00' && s.schedule.lists[b.listId]?.state === 'ACTIVE',
    )!
    const path = `/mobile/lists/${booking.listId}/bookings/${booking.id}`
    expect(demoTriggersFor(s, path, 'pwa', {}).map((m) => m.trigger.id)).toContain('office-edits-booking')
    expect(demoTriggersFor(s, path, 'bar', {}).map((m) => m.trigger.id)).not.toContain('office-edits-booking')
    const entry = byId('office-edits-booking')
    expect(entry.badge).toBe('office-stand-in')
    expect(entry.run(api, ctx(path, { listId: booking.listId, bookingId: booking.id })).ok).toBe(true)
    const saved = api.getState().audit.filter((e) => e.action === 'booking.save' && e.entityId === booking.id)
    expect(saved).toHaveLength(1)
    expect(saved[0]!.who).toBe('Kirsty W.')
  })
})
