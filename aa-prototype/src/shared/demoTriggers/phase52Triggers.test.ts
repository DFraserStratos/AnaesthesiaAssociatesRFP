/**
 * Build plan Phase 52's triggers (US-12.1.6, US-13.5.3): "pass the last day" on an anaesthetist's
 * record (bar), and "try signing in after the last day" on the sign-in screen (bar and PWA sheet).
 */
import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from '../../store/appStore'
import { OFFICE_ACTOR } from '../../store/demoActors'
import { makeAnaesthetistInactive, NO_LONGER_ACTIVE } from '../../store/anaesthetistStatusActions'
import { ANAE } from '../../domain/seed'
import { DEMO_TRIGGERS } from './registry'
import { demoTriggersFor } from './match'
import type { DemoContextValues } from './context'

const pass = DEMO_TRIGGERS.find((t) => t.id === 'pass-last-day')!
const trySignIn = DEMO_TRIGGERS.find((t) => t.id === 'try-sign-in-after-last-day')!
const BEAU = ANAE.beaumont
const record = `/admin/masters/anaesthetists/${BEAU}`
const recordCtx = { pathname: record, params: { anaesthetistId: BEAU }, published: {} }

function beaumontLeaves(api: AppStoreApi): string {
  const last = Object.values(api.getState().schedule.lists)
    .filter((l) => l.anaesthetistId === BEAU)
    .map((l) => l.dateISO)
    .reduce((a, b) => (b > a ? b : a), api.getState().clock.todayISO)
  expect(makeAnaesthetistInactive(api, OFFICE_ACTOR, BEAU, last, 'leftPractice').ok).toBe(true)
  return last
}

describe('pass-last-day', () => {
  it('shows on an anaesthetist record only, on the bar; disabled until a last day is ahead; moves the clock past it', () => {
    const api = createAppStore()
    const ids = (path: string, surface: 'bar' | 'pwa') => demoTriggersFor(api.getState(), path, surface, {}).map((m) => m.trigger.id)
    expect(ids(record, 'bar')).toContain(pass.id)
    expect(ids(record, 'pwa')).not.toContain(pass.id)
    expect(ids('/admin/day/2026-11-24', 'bar')).not.toContain(pass.id)
    expect(pass.disabledReason(api.getState(), recordCtx)).not.toBeNull()
    const last = beaumontLeaves(api)
    expect(pass.disabledReason(api.getState(), recordCtx)).toBeNull()
    expect(pass.run(api, recordCtx).ok).toBe(true)
    expect(api.getState().clock.todayISO > last).toBe(true)
    expect(pass.disabledReason(api.getState(), recordCtx)).not.toBeNull()
  })
})

describe('try-sign-in-after-last-day', () => {
  const signIn: Partial<DemoContextValues> = { 'mobile.signIn': true }

  it('shows only on the sign-in screen, on the bar and the PWA sheet', () => {
    const api = createAppStore()
    const ids = (surface: 'bar' | 'pwa', published: Partial<DemoContextValues>) => demoTriggersFor(api.getState(), '/mobile/lists', surface, published).map((m) => m.trigger.id)
    expect(ids('bar', signIn)).toContain(trySignIn.id)
    expect(ids('pwa', signIn)).toContain(trySignIn.id)
    expect(ids('bar', {})).not.toContain(trySignIn.id)
  })

  it('is disabled until a last day has passed; then writes one refused row for that anaesthetist, never Dr Souter', () => {
    const api = createAppStore()
    const c = { pathname: '/mobile/lists', params: {}, published: signIn }
    expect(trySignIn.disabledReason(api.getState(), c)).not.toBeNull()
    beaumontLeaves(api)
    expect(pass.run(api, recordCtx).ok).toBe(true)
    expect(trySignIn.disabledReason(api.getState(), c)).toBeNull()
    expect(trySignIn.run(api, c).ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({ entityType: 'account', entityId: BEAU, action: 'auth.signInFailed', after: { reason: NO_LONGER_ACTIVE } })
    expect(api.getState().masters.anaesthetists[ANAE.souter]!.lastDayISO).toBeNull()
  })
})
