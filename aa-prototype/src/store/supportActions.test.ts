import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { advanceClockMinutes, advanceClockToDate } from './clockActions'
import { OFFICE_ACTOR, OFFICE_SIMULATION_ACTOR, SOUTER_ACTOR, STRATOS_SUPPORT_ACTOR } from './demoActors'
import { advanceSupportTicket, approveCallOut, newestAwaitingCallOut, newestOpenTicket, raiseSupportTicket, ticketsFor } from './supportActions'
import { buildSeed } from '../domain/seed'
import { SEED_SUPPORT_TICKETS } from '../domain/seed/support'

const request = { channel: 'helpLine', kind: 'request', priority: 'P3', subject: 'Cannot see my Lists', description: '', app: 'mobile' } as const

describe('support tickets (catch-up Phase 43b)', () => {
  it('seeds five tickets before DEMO_TODAY, in hours, with no rng draw and the counter past them', () => {
    const s = createAppStore().getState()
    expect(Object.keys(s.support.tickets).sort()).toEqual(['TK0001', 'TK0002', 'TK0003', 'TK0004', 'TK0005'])
    expect(SEED_SUPPORT_TICKETS.every((t) => t.raisedAtISO < '2026-11-24' && t.cover === 'inHours')).toBe(true)
    expect(s.counters['supportTicket']).toBe(6)
    expect(s.support.tickets['TK0002']!.respondByISO).toBe('2026-11-24T09:50:00')
    expect(buildSeed().masters).toEqual(buildSeed().masters)
  })

  it('raises an in-hours help-line ticket with its respond-by, audited support.raise', () => {
    const api = createAppStore()
    advanceClockMinutes(api, 60) // 9:00am
    const res = raiseSupportTicket(api, SOUTER_ACTOR, request)
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.value.ticketId).toBe('TK0006')
    const t = api.getState().support.tickets['TK0006']!
    expect(t).toMatchObject({ status: 'logged', cover: 'inHours', priority: 'P3', respondByISO: '2026-11-24T13:00:00', raisedAtISO: '2026-11-24T09:00:00', raisedBy: { who: 'Dr Melanie Souter', app: 'mobile' } })
    const row = api.getState().audit.at(-1)!
    expect(row).toMatchObject({ action: 'support.raise', entityType: 'supportTicket', entityId: 'TK0006' })
    // The requester and the office both see it.
    expect(ticketsFor(api.getState(), { channel: 'helpLine', requester: 'Dr Melanie Souter' })[0]!.id).toBe('TK0006')
    expect(ticketsFor(api.getState(), { channel: 'helpLine' })[0]!.id).toBe('TK0006')
  })

  it('refuses a blank subject and a kind from the other channel', () => {
    const api = createAppStore()
    expect(raiseSupportTicket(api, SOUTER_ACTOR, { ...request, subject: '  ' })).toMatchObject({ ok: false, code: 'subjectRequired' })
    expect(raiseSupportTicket(api, OFFICE_ACTOR, { ...request, kind: 'fix' })).toMatchObject({ ok: false, code: 'kindMismatch' })
    expect(raiseSupportTicket(api, OFFICE_ACTOR, { ...request, channel: 'productSupport' })).toMatchObject({ ok: false, code: 'kindMismatch' })
  })

  it('out of hours an ordinary request waits; a security breach is P1 and due within the hour', () => {
    const api = createAppStore()
    advanceClockMinutes(api, 11 * 60) // 7:00pm
    raiseSupportTicket(api, SOUTER_ACTOR, { ...request, priority: 'P2' })
    const waiting = api.getState().support.tickets['TK0006']!
    expect(waiting.cover).toBe('afterHours')
    expect(waiting.respondByISO).toBeUndefined()
    expect(waiting.priority).toBe('P2')
    raiseSupportTicket(api, SOUTER_ACTOR, { ...request, priority: 'P3', reason: 'securityBreach' })
    const urgent = api.getState().support.tickets['TK0007']!
    expect(urgent).toMatchObject({ priority: 'P1', reason: 'securityBreach', respondByISO: '2026-11-24T20:00:00' })
  })

  it('in hours a reason is ignored', () => {
    const api = createAppStore()
    advanceClockMinutes(api, 60)
    raiseSupportTicket(api, SOUTER_ACTOR, { ...request, reason: 'platformOffline' })
    expect(api.getState().support.tickets['TK0006']!.reason).toBeUndefined()
    expect(api.getState().support.tickets['TK0006']!.priority).toBe('P3')
  })

  it('advances Logged, Responded, Closed one step at a time, audited, then refuses', () => {
    const api = createAppStore()
    advanceClockMinutes(api, 60)
    raiseSupportTicket(api, SOUTER_ACTOR, request)
    expect(advanceSupportTicket(api, STRATOS_SUPPORT_ACTOR, 'TK0006')).toMatchObject({ ok: true, value: { status: 'responded' } })
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'support.respond', who: 'Stratos support (simulated)' })
    expect(api.getState().support.tickets['TK0006']!.respondedAtISO).toBe('2026-11-24T09:00:00')
    expect(advanceSupportTicket(api, STRATOS_SUPPORT_ACTOR, 'TK0006')).toMatchObject({ ok: true, value: { status: 'closed' } })
    expect(api.getState().audit.at(-1)!.action).toBe('support.close')
    expect(advanceSupportTicket(api, STRATOS_SUPPORT_ACTOR, 'TK0006')).toMatchObject({ ok: false, code: 'closed' })
  })

  it('a product-support ticket on a public holiday waits for AA\'s approval before it can be responded to', () => {
    const api = createAppStore()
    advanceClockToDate(api, '2027-02-08')
    advanceClockMinutes(api, 120) // Waitangi Day (observed) 10:00am
    raiseSupportTicket(api, OFFICE_ACTOR, { channel: 'productSupport', kind: 'incident', priority: 'P2', subject: 'Billing run stopped', description: '', app: 'admin' })
    const t = api.getState().support.tickets['TK0006']!
    expect(t).toMatchObject({ cover: 'publicHoliday', callOut: 'awaitingApproval' })
    expect(t.respondByISO).toBeUndefined()
    expect(newestAwaitingCallOut(api.getState())?.id).toBe('TK0006')
    expect(advanceSupportTicket(api, STRATOS_SUPPORT_ACTOR, 'TK0006')).toMatchObject({ ok: false, code: 'awaitingApproval' })
    expect(approveCallOut(api, OFFICE_SIMULATION_ACTOR, 'TK0006').ok).toBe(true)
    expect(api.getState().audit.at(-1)!.action).toBe('support.callOutApprove')
    expect(approveCallOut(api, OFFICE_SIMULATION_ACTOR, 'TK0006')).toMatchObject({ ok: false, code: 'notAwaiting' })
    expect(advanceSupportTicket(api, STRATOS_SUPPORT_ACTOR, 'TK0006').ok).toBe(true)
  })

  it('a help-line ticket on a public holiday never needs a call-out', () => {
    const api = createAppStore()
    advanceClockToDate(api, '2027-02-08')
    advanceClockMinutes(api, 120)
    raiseSupportTicket(api, SOUTER_ACTOR, request)
    expect(api.getState().support.tickets['TK0006']!.callOut).toBeUndefined()
  })

  it('newestOpenTicket skips closed tickets and respects the requester', () => {
    const s = createAppStore().getState()
    expect(newestOpenTicket(s, { channel: 'helpLine' })?.id).toBe('TK0002')
    expect(newestOpenTicket(s, { channel: 'helpLine', requester: 'Dr Melanie Souter' })?.id).toBe('TK0003')
    expect(newestOpenTicket(s, { channel: 'productSupport' })?.id).toBe('TK0004')
  })
})
