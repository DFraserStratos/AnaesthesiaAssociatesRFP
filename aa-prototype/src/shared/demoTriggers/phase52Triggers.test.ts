/**
 * Build plan Phase 52's triggers (US-12.1.6, US-13.5.3): "pass the last day" on an anaesthetist's
 * record (bar), and "try signing in after the last day" on the sign-in screen (bar and PWA sheet).
 */
import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from '../../store/appStore'
import { OFFICE_ACTOR } from '../../store/demoActors'
import { latestNoLongerActiveRefusal, makeAnaesthetistInactive, NO_LONGER_ACTIVE, signInRefusal } from '../../store/anaesthetistStatusActions'
import { ANAE } from '../../domain/seed'
import { resetDemo } from '../../store/clockActions'
import { DEMO_TRIGGERS } from './registry'
import { demoTriggersFor } from './match'
import type { DemoContextValues } from './context'

const pass = DEMO_TRIGGERS.find((t) => t.id === 'pass-last-day')!
const trySignIn = DEMO_TRIGGERS.find((t) => t.id === 'try-sign-in-after-last-day')!
const BEAU = ANAE.beaumont
const record = `/admin/people/anaesthetists/${BEAU}`
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

  it('stages Dr Souter past a last day (audited) and writes one refused row naming her; a second press only refuses again', () => {
    const api = createAppStore()
    const c = { pathname: '/mobile/lists', params: {}, published: signIn }
    const today = api.getState().clock.todayISO
    expect(trySignIn.disabledReason(api.getState(), c)).toBeNull()
    expect(signInRefusal(api.getState(), ANAE.souter)).toBeNull()
    expect(trySignIn.run(api, c).ok).toBe(true)
    const souter = api.getState().masters.anaesthetists[ANAE.souter]!
    expect(souter.lastDayISO! < today).toBe(true)
    expect(api.getState().clock.todayISO).toBe(today)
    expect(signInRefusal(api.getState(), ANAE.souter)).toBe(NO_LONGER_ACTIVE)
    const audit = api.getState().audit
    expect(audit.at(-2)).toMatchObject({ entityType: 'anaesthetist', entityId: ANAE.souter, action: 'anaesthetist.makeInactive' })
    expect(audit.at(-1)).toMatchObject({ entityType: 'account', entityId: ANAE.souter, who: 'Dr Melanie Souter', action: 'auth.signInFailed', after: { reason: NO_LONGER_ACTIVE } })
    expect(latestNoLongerActiveRefusal(api.getState())?.anaesthetistId).toBe(ANAE.souter)
    const rows = audit.length
    expect(trySignIn.run(api, c).ok).toBe(true)
    expect(api.getState().audit.length).toBe(rows + 1)
    expect(api.getState().audit.at(-1)).toMatchObject({ entityId: ANAE.souter, action: 'auth.signInFailed' })
    resetDemo(api)
    expect(signInRefusal(api.getState(), ANAE.souter)).toBeNull()
  })
})
