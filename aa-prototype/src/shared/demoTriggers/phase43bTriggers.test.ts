/**
 * Catch-up Phase 43b's demo triggers: the support entries show only while the
 * support panel is open (it publishes `support.tab` and `support.requester`),
 * move the clock forward only, and act on the open tab's tickets.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from '../../store/appStore'
import { DEMO_TRIGGERS } from './registry'
import { demoTriggersFor } from './match'
import type { DemoContextValues } from './context'

const byId = (id: string) => DEMO_TRIGGERS.find((t) => t.id === id)!
const office = (tab: DemoContextValues['support.tab']) => ({ 'support.tab': tab, 'support.requester': '' }) as const
const souter = { 'support.tab': 'helpLine', 'support.requester': 'Dr Melanie Souter' } as const
const ctx = (pathname: string, published: Partial<DemoContextValues>) => ({ pathname, params: {}, published })
const visible = (state: ReturnType<ReturnType<typeof createAppStore>['getState']>, path: string, surface: 'bar' | 'pwa', published: Partial<DemoContextValues>) =>
  demoTriggersFor(state, path, surface, published).map((m) => m.trigger.id).filter((id) => id.startsWith('support-'))

describe('support triggers (catch-up Phase 43b)', () => {
  it('show only while the panel is open, split by tab, on every app', () => {
    const state = createAppStore().getState()
    expect(visible(state, '/admin/day/2026-11-24', 'bar', {})).toEqual([])
    expect(visible(state, '/admin/day/2026-11-24', 'bar', office('helpLine'))).toEqual(['support-advance-ticket', 'support-raise-out-of-hours'])
    expect(visible(state, '/admin/masters', 'bar', office('productSupport'))).toEqual(['support-advance-ticket', 'support-raise-public-holiday', 'support-approve-call-out'])
    expect(visible(state, '/web', 'bar', souter)).toEqual(['support-advance-ticket', 'support-raise-out-of-hours'])
    expect(visible(state, '/mobile/more', 'bar', souter)).toEqual(['support-advance-ticket', 'support-raise-out-of-hours'])
    expect(visible(state, '/mobile/more', 'pwa', {})).toEqual([])
    expect(visible(state, '/mobile/more', 'pwa', souter)).toEqual(['support-help-line-responds'])
  })

  it('Advance ticket moves the newest open request of the open tab, then says No open request', () => {
    const api = createAppStore()
    const t = byId('support-advance-ticket')
    const c = ctx('/web', souter)
    // Dr Souter's open help-line request is TK0003 (Logged).
    expect(t.run(api, c)).toEqual({ ok: true, message: 'TK0003 Wording on the Accounts page: now Responded.' })
    expect(t.run(api, c).message).toBe('TK0003 Wording on the Accounts page: now Closed.')
    expect(t.disabledReason(api.getState(), c)).toBe('No open request')
    // The office's scope still has Kirsty W.'s TK0002.
    expect(t.disabledReason(api.getState(), ctx('/admin', office('helpLine')))).toBeNull()
  })

  it('Raise out of hours moves the clock forward to 7:00pm and logs the request by the rule', () => {
    const api = createAppStore()
    const t = byId('support-raise-out-of-hours')
    const ordinary = t.run(api, ctx('/mobile/more', souter), 'other')
    expect(ordinary.message).toBe('Clock now Tue 24 Nov, 7:00pm. TK0006 logged: not answered out of hours, picked up at the next opening.')
    expect(api.getState().clock).toEqual({ todayISO: '2026-11-24', minutesSinceMidnight: 19 * 60 })
    expect(api.getState().support.tickets['TK0006']).toMatchObject({ raisedBy: { who: 'Dr Melanie Souter', app: 'mobile' }, cover: 'afterHours' })
    // Already at or past 7:00pm: the next weekday's evening, never back.
    const breach = t.run(api, ctx('/admin', office('helpLine')), 'securityBreach')
    expect(breach.message).toBe('Clock now Wed 25 Nov, 7:00pm. TK0007 logged as P1 and answered out of hours: respond by Wed 25 Nov, 8:00pm.')
    expect(api.getState().support.tickets['TK0007']).toMatchObject({ priority: 'P1', reason: 'securityBreach', raisedBy: { who: 'Kirsty W.', app: 'admin' } })
  })

  it('Raise ticket on a public holiday jumps to Christmas Day 10:00am; the call-out waits for AA', () => {
    const api = createAppStore()
    const raise = byId('support-raise-public-holiday')
    const approve = byId('support-approve-call-out')
    const advance = byId('support-advance-ticket')
    const c = ctx('/admin', office('productSupport'))
    expect(approve.disabledReason(api.getState(), c)).toBe('No call-out awaiting approval')
    expect(raise.run(api, c).message).toBe("Clock now 10:00am, Christmas Day. TK0006 logged: the call-out waits for AA's approval.")
    expect(api.getState().clock).toEqual({ todayISO: '2026-12-25', minutesSinceMidnight: 600 })
    expect(advance.disabledReason(api.getState(), c)).toBeNull()
    expect(approve.badge).toBe('office-stand-in')
    expect(approve.run(api, c)).toEqual({ ok: true, message: 'Call-out approved for TK0006. Stratos can now respond.' })
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'support.callOutApprove', who: 'AA office (simulated)' })
    expect(advance.disabledReason(api.getState(), c)).toBeNull()
    // The next national holiday after Christmas Day 10:00am is Boxing Day (observed).
    expect(raise.run(api, c).message).toMatch(/^Clock now 10:00am, Boxing Day \(observed\)\./)
  })

  it('the PWA stand-in advances Dr Souter\'s own newest open request', () => {
    const api = createAppStore()
    const t = byId('support-help-line-responds')
    const c = ctx('/mobile/more', souter)
    expect(t.run(api, c).message).toBe('TK0003 Wording on the Accounts page: now Responded.')
    t.run(api, c)
    expect(t.disabledReason(api.getState(), c)).toBe('No open request')
    expect(api.getState().support.tickets['TK0002']!.status).toBe('responded')
  })

  it('Advance moves an open ticket past one that waits for AA\'s approval', () => {
    const api = createAppStore()
    const c = ctx('/admin', office('productSupport'))
    byId('support-raise-public-holiday').run(api, c)
    // TK0006 waits for approval; the seeded TK0004 (logged) moves instead.
    expect(byId('support-advance-ticket').run(api, c).message).toBe('TK0004 Export the Day view to a spreadsheet: now Responded.')
    expect(api.getState().support.tickets['TK0006']!.status).toBe('logged')
  })
})
