import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from './appStore'
import type { Actor } from './mutate'
import { OFFICE_ACTOR } from './demoActors'
import { setNhiHubMode } from './demoSettingsActions'
import { refreshPatientFromRegister, registerRefreshPreview, REGISTER_REFRESH_MESSAGES } from './registerRefresh'
import { advanceClockMinutes, resetDemo } from './clockActions'
import { ANAE, PAT } from '../domain/seed'
import type { NhiHubMode } from '../domain/types'

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }

function untouched(api: AppStoreApi) {
  const s = api.getState()
  return { masters: s.masters, schedule: s.schedule, billing: s.billing, xero: s.xero, audit: s.audit.length }
}

describe('refreshPatientFromRegister (catch-up Phase 40a)', () => {
  it("Fiona Gray: Use register for the name takes her married name, Keep holds her address, stamped from the demo clock", () => {
    const api = createAppStore()
    const preview = registerRefreshPreview(api.getState(), PAT.gray)
    expect(preview.kind).toBe('ready')
    if (preview.kind !== 'ready') return
    expect(preview.differences.map((d) => d.field)).toEqual(['name', 'address'])
    expect(preview.lastRefreshedAtISO).toBeUndefined()
    const addressBefore = api.getState().masters.patients[PAT.gray]!.postalAddress

    const out = refreshPatientFromRegister(api, OFFICE_ACTOR, PAT.gray, { name: 'useRegister' })
    expect(out).toEqual({ ok: true, value: { changed: ['name'] } })
    const fiona = api.getState().masters.patients[PAT.gray]!
    expect(fiona.name).toBe('Fiona Tamihana')
    expect(fiona.postalAddress).toEqual(addressBefore)
    expect(fiona.registerRefreshedAtISO).toBe('2026-07-21T08:00:00')

    const entry = api.getState().audit.at(-1)!
    expect(entry.action).toBe('patient.registerRefreshed')
    expect(entry.entityId).toBe(PAT.gray)
    expect(entry.before).toEqual({ name: 'Fiona Gray' })
    expect(entry.after).toEqual({ name: 'Fiona Tamihana', registerRefreshedAtISO: '2026-07-21T08:00:00', from: 'NHI register' })
  })

  it('Use register for both takes the Halswell address too', () => {
    const api = createAppStore()
    refreshPatientFromRegister(api, OFFICE_ACTOR, PAT.gray, { name: 'useRegister', address: 'useRegister' })
    expect(api.getState().masters.patients[PAT.gray]!.postalAddress).toMatchObject({ line1: '5 Kowhai Lane', suburb: 'Halswell' })
  })

  it('with every choice Keep (or none) only the stamp moves', () => {
    const api = createAppStore()
    const before = api.getState().masters.patients[PAT.gray]!
    expect(refreshPatientFromRegister(api, OFFICE_ACTOR, PAT.gray, {})).toEqual({ ok: true, value: { changed: [] } })
    const after = api.getState().masters.patients[PAT.gray]!
    const { registerRefreshedAtISO, ...rest } = after
    expect(rest).toEqual(before)
    expect(registerRefreshedAtISO).toBe('2026-07-21T08:00:00')
    expect(api.getState().audit.at(-1)!.after).toMatchObject({ changes: 'no changes' })
  })

  it('a second refresh is "no changes" with a new stamp after a clock advance', () => {
    const api = createAppStore()
    refreshPatientFromRegister(api, OFFICE_ACTOR, PAT.gray, { name: 'useRegister', address: 'useRegister' })
    const second = registerRefreshPreview(api.getState(), PAT.gray)
    expect(second).toMatchObject({ kind: 'ready', differences: [], enrichments: [], lastRefreshedAtISO: '2026-07-21T08:00:00' })
    advanceClockMinutes(api, 90)
    refreshPatientFromRegister(api, OFFICE_ACTOR, PAT.gray, {})
    expect(api.getState().masters.patients[PAT.gray]!.registerRefreshedAtISO).toBe('2026-07-21T09:30:00')
    expect(api.getState().audit.at(-1)!.after).toMatchObject({ changes: 'no changes' })
  })

  it('Sarah Mitchell has nothing to change', () => {
    const api = createAppStore()
    expect(registerRefreshPreview(api.getState(), PAT.mitchell)).toMatchObject({ kind: 'ready', differences: [], enrichments: [] })
  })

  it('refuses and leaves state as it was', () => {
    const run = (setup: (api: AppStoreApi) => void, call: (api: AppStoreApi) => ReturnType<typeof refreshPatientFromRegister>, message: string) => {
      const api = createAppStore()
      setup(api)
      const snap = untouched(api)
      const out = call(api)
      expect(out.ok).toBe(false)
      if (!out.ok) expect(out.message).toBe(message)
      expect(untouched(api)).toEqual(snap)
    }
    run(() => {}, (api) => refreshPatientFromRegister(api, SOUTER, PAT.gray, {}), REGISTER_REFRESH_MESSAGES.officeOnly)
    run((api) => setNhiHubMode(api, OFFICE_ACTOR, 'unavailable'), (api) => refreshPatientFromRegister(api, OFFICE_ACTOR, PAT.gray, {}), REGISTER_REFRESH_MESSAGES.hubUnavailable)
    run(
      (api) => api.setState((s) => ({ masters: { ...s.masters, patients: { ...s.masters.patients, [PAT.gray]: { ...s.masters.patients[PAT.gray]!, nhi: '' } } } })),
      (api) => refreshPatientFromRegister(api, OFFICE_ACTOR, PAT.gray, {}),
      REGISTER_REFRESH_MESSAGES.noNhi,
    )
    run(
      (api) => api.setState((s) => ({ masters: { ...s.masters, patients: { ...s.masters.patients, [PAT.gray]: { ...s.masters.patients[PAT.gray]!, nhi: 'ZBW6638' } } } })),
      (api) => refreshPatientFromRegister(api, OFFICE_ACTOR, PAT.gray, {}),
      REGISTER_REFRESH_MESSAGES.notOnRegister,
    )
    run(() => {}, (api) => refreshPatientFromRegister(api, OFFICE_ACTOR, PAT.gray, { phone: 'useRegister' }), REGISTER_REFRESH_MESSAGES.notADifference)
    run(() => {}, (api) => refreshPatientFromRegister(api, OFFICE_ACTOR, 'PT9999', {}), REGISTER_REFRESH_MESSAGES.notFound)
  })

  it('touches no Booking, ledger, Xero record or pending details', () => {
    const api = createAppStore()
    const s0 = api.getState()
    refreshPatientFromRegister(api, OFFICE_ACTOR, PAT.gray, { name: 'useRegister', address: 'useRegister' })
    const s1 = api.getState()
    expect(s1.schedule).toBe(s0.schedule)
    expect(s1.billing).toBe(s0.billing)
    expect(s1.xero).toBe(s0.xero)
    expect(s1.masters.patients[PAT.gray]!.pendingDetails).toEqual(s0.masters.patients[PAT.gray]!.pendingDetails)
  })

  it('Reset restores her name and drops the stamp', () => {
    const api = createAppStore()
    refreshPatientFromRegister(api, OFFICE_ACTOR, PAT.gray, { name: 'useRegister' })
    resetDemo(api)
    const fiona = api.getState().masters.patients[PAT.gray]!
    expect(fiona.name).toBe('Fiona Gray')
    expect(fiona.registerRefreshedAtISO).toBeUndefined()
  })
})

describe('setNhiHubMode (catch-up Phase 40a)', () => {
  it('absent reads as Available; sets, audits and clears back to absent', () => {
    const api = createAppStore()
    expect(api.getState().settings.nhiHubMode).toBeUndefined()
    expect(setNhiHubMode(api, OFFICE_ACTOR, 'slow').ok).toBe(true)
    expect(api.getState().settings.nhiHubMode).toBe('slow')
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'settings.nhiHubMode', before: { nhiHubMode: 'available' }, after: { nhiHubMode: 'slow' } })
    setNhiHubMode(api, OFFICE_ACTOR, 'available')
    expect('nhiHubMode' in api.getState().settings).toBe(false)
  })

  it('setting the current mode writes nothing, and an unknown mode is refused', () => {
    const api = createAppStore()
    const n = api.getState().audit.length
    expect(setNhiHubMode(api, OFFICE_ACTOR, 'available').ok).toBe(true)
    expect(api.getState().audit.length).toBe(n)
    expect(setNhiHubMode(api, OFFICE_ACTOR, 'offline' as NhiHubMode).ok).toBe(false)
  })

  it('Reset restores Available', () => {
    const api = createAppStore()
    setNhiHubMode(api, OFFICE_ACTOR, 'unavailable')
    resetDemo(api)
    expect(api.getState().settings.nhiHubMode).toBeUndefined()
  })
})
