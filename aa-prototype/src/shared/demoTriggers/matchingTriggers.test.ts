/**
 * Catch-up Phase 33's demo triggers: the two Matching bar entries and the PWA
 * office stand-in. Routes, surfaces, disabled states, determinism, and that
 * nothing is applied except through `decideImportRow`.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from '../../store/appStore'
import { proceduresForBooking } from '../../store/selectors'
import { DEMO_TRIGGERS } from './registry'
import { demoTriggersFor } from './match'
import type { DemoTrigger, DemoTriggerCtx } from './types'
import { FOSTER_HOSPITAL_WORDING } from '../../domain/intake'

const byId = (id: string): DemoTrigger => DEMO_TRIGGERS.find((t) => t.id === id)!
const ids = (api: BoundAppStore, pathname: string, surface: 'bar' | 'pwa') => demoTriggersFor(api.getState(), pathname, surface).map((m) => m.trigger.id)
const matchingCtx = (selected?: string): DemoTriggerCtx => ({ pathname: '/admin/matching', params: {}, published: selected !== undefined ? { 'matching.selectedRowId': selected } : {} })
const snapshot = (api: BoundAppStore) => JSON.stringify({ s: api.getState().schedule, p: api.getState().masters.patients })
const FOSTER = 'BK0043'

describe('Matching bar entries', () => {
  it('show on /admin/matching in the bar only', () => {
    const api = createAppStore()
    expect(ids(api, '/admin/matching', 'bar')).toEqual(expect.arrayContaining(['matching-receive-theatre-list', 'matching-send-update']))
    expect(ids(api, '/admin/matching', 'pwa')).toEqual([])
    expect(ids(api, '/admin/day/2026-07-21', 'bar')).not.toContain('matching-receive-theatre-list')
  })

  it('Import hospital file stages exactly the sample rows, applies nothing, and is then disabled', () => {
    const api = createAppStore()
    const before = snapshot(api)
    const t = byId('matching-receive-theatre-list')
    const res = t.run(api, matchingCtx(), 'sx')
    expect(res).toMatchObject({ ok: true, message: 'Southern Cross sent its theatre list: 5 rows are waiting on Matching. Nothing changes the schedule until the office decides.' })
    expect(Object.keys(api.getState().intake.rows)).toHaveLength(5)
    expect(snapshot(api)).toBe(before)
    expect(t.disabledReason?.(api.getState(), matchingCtx(), 'sx')).toBe('This list is already on Matching')
    expect(t.disabledReason?.(api.getState(), matchingCtx(), 'stg')).toBeNull()
  })

  it("Send update defaults to Diane Foster: her row waits, her Booking is unchanged, and a second run is disabled", () => {
    const api = createAppStore()
    const t = byId('matching-send-update')
    const before = snapshot(api)
    expect(t.run(api, matchingCtx(), undefined).message).toBe("St George's sent an update for Diane Foster: a new time and fuller wording. Check the differences and approve it.")
    expect(snapshot(api)).toBe(before)
    const row = Object.values(api.getState().intake.rows)[0]!
    expect(row.incoming).toMatchObject({ scheduledTime: '12:15', procedure: { text: FOSTER_HOSPITAL_WORDING } })
    expect(t.disabledReason?.(api.getState(), matchingCtx(), undefined)).toBe('This update is already waiting on Matching')
  })
})

describe('the PWA office stand-in', () => {
  it('is PWA only on the three Lists layers', () => {
    const api = createAppStore()
    for (const path of ['/mobile/lists', '/mobile/lists/L1', '/mobile/lists/L1/bookings/BK1']) {
      expect(ids(api, path, 'pwa')).toContain('matching-office-matches-row')
      expect(ids(api, path, 'bar')).not.toContain('matching-office-matches-row')
    }
    expect(byId('matching-office-matches-row').badge).toBe('office-stand-in')
  })

  it("S1: Sarah Mitchell lands on Dr Souter's Tue 28 Jul AM List with her wording and no Contract, then the choice is disabled", () => {
    const api = createAppStore()
    const t = byId('matching-office-matches-row')
    const ctx: DemoTriggerCtx = { pathname: '/mobile/lists', params: {}, published: {} }
    const res = t.run(api, ctx, 's1')
    expect(res.ok).toBe(true)
    const row = Object.values(api.getState().intake.rows)[0]!
    expect(row).toMatchObject({ status: 'applied', decidedBy: 'AA office (simulated)' })
    const bookingId = row.decision!.kind === 'createBooking' ? row.decision!.bookingId : ''
    const [p] = proceduresForBooking(api.getState(), bookingId)
    expect(api.getState().schedule.bookings[bookingId]!.listId).toBe('L-34821-2026-07-28-AM')
    expect(p!.procedureText?.text).toBe('lap appy ?conv to open')
    expect(p!.governingContractId).toBeUndefined()
    expect(t.disabledReason?.(api.getState(), ctx, 's1')).toBe('Already on your Tue 28 Jul AM List')
  })

  it("on Diane Foster's Booking the office approves the update: the hospital's text replaces WLE MM", () => {
    const api = createAppStore()
    const t = byId('matching-office-matches-row')
    const ctx: DemoTriggerCtx = { pathname: `/mobile/lists/L-34821-2026-08-04-AM/bookings/${FOSTER}`, params: { listId: 'L-34821-2026-08-04-AM', bookingId: FOSTER }, published: {} }
    expect(t.run(api, ctx, 'booking').ok).toBe(true)
    expect(proceduresForBooking(api.getState(), FOSTER)[0]!.procedureText?.text).toBe(FOSTER_HOSPITAL_WORDING)
    expect(t.disabledReason?.(api.getState(), ctx, 'booking')).toBe('This update was already applied')
  })

  it('a new hospital booking on an ACTIVE St George\'s List takes the next pool patient, deterministically', () => {
    const runOnce = () => {
      const api = createAppStore()
      const ctx: DemoTriggerCtx = { pathname: '/mobile/lists/L-34821-2026-07-28-AM', params: { listId: 'L-34821-2026-07-28-AM' }, published: {} }
      const res = byId('matching-office-matches-row').run(api, ctx, 'list')
      return { ok: res.ok, message: res.message }
    }
    const first = runOnce()
    expect(first.ok).toBe(true)
    expect(first.message).toContain('Mere Tautahi')
    expect(runOnce()).toEqual(first)
  })
})
