/**
 * Catch-up Phase 40's demo triggers: "Receive list with a missing NHI", the
 * patient balance sample in 15a's "Raise sample warnings", the PWA's "Office
 * adds the NHI", and 15a's "Office clears this warning" never listing the
 * balance warning on the phone.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from '../../store/appStore'
import { warningsForBooking } from '../../store/warnings'
import { DEMO_TRIGGER_ACTOR, OFFICE_SIMULATION_ACTOR } from '../../store/demoActors'
import { bookingsForList } from '../../store/selectors'
import { stubsOnList } from '../../domain/intake/stubs'
import { validateNhi } from '../../domain/nhi'
import { buildSeed, SEED_LIST_IDS, SEED_WARNING_SAMPLE_BOOKINGS } from '../../domain/seed'
import { NO_NHI_LIST, NO_NHI_NEW_PATIENT_NHI, NO_NHI_RETURNING_NHI } from '../../domain/intake/hospitalDownloads'
import { clearSamplesOn, WARNING_SAMPLES } from '../../store/warningSamples'
import { addNhiStandInRefusal, LIST_NOT_ACTIVE, NO_FIXTURE_ROWS_LEFT, NO_NHI_FIXTURES } from '../../store/officeStandIn'
import { clearWarning } from '../../store/warnings'
import { OFFICE_ACTOR } from '../../store/demoActors'
import { DEMO_TRIGGERS } from './registry'
import { demoTriggersFor } from './match'
import type { DemoTrigger, DemoTriggerCtx } from './types'

function byId(id: string): DemoTrigger {
  const t = DEMO_TRIGGERS.find((x) => x.id === id)
  if (t === undefined) throw new Error(`no trigger ${id}`)
  return t
}
const ctx = (pathname: string, params: Record<string, string> = {}): DemoTriggerCtx => ({ pathname, params, published: {} })

const MULTI = SEED_WARNING_SAMPLE_BOOKINGS.multiWarning
const [, PM_TARGET] = SEED_WARNING_SAMPLE_BOOKINGS.targets

describe('Receive list with a missing NHI (catch-up Phase 40)', () => {
  it('shows on Waiting for NHI, imports the two NHI-less rows creating nothing, names the NHIs, then reads Already received', () => {
    const api = createAppStore()
    const t = byId('receive-no-nhi-list')
    expect(demoTriggersFor(api.getState(), '/admin/patients/waiting', 'bar').map((m) => m.trigger.id)).toContain('receive-no-nhi-list')
    const c = ctx('/admin/patients/waiting')
    expect(t.disabledReason(api.getState(), c)).toBeNull()
    const bookings = Object.keys(api.getState().schedule.bookings).length
    const patients = Object.keys(api.getState().masters.patients).length
    const res = t.run(api, c)
    expect(res.ok).toBe(true)
    expect(res.message).toContain(NO_NHI_NEW_PATIENT_NHI)
    expect(res.message).toContain(NO_NHI_RETURNING_NHI)
    const batch = Object.values(api.getState().intake.batches).find((b) => b.sampleId === NO_NHI_LIST.id)
    expect(batch?.rowIds).toHaveLength(2)
    expect(Object.keys(api.getState().schedule.bookings)).toHaveLength(bookings)
    expect(Object.keys(api.getState().masters.patients)).toHaveLength(patients)
    expect(t.disabledReason(api.getState(), c)).toBe('Already received')
  })
})

describe('the patient balance sample (catch-up Phase 40)', () => {
  it('stamps the balance check on the multiWarning Booking as the demo actor: a strong balance warning', () => {
    const api = createAppStore()
    const raise = byId('raise-sample-warnings')
    const route = ctx(`/admin/day/2026-07-21/bookings/${MULTI}`, { dateISO: '2026-07-21', bookingId: MULTI })
    const res = raise.run(api, route)
    expect(res.ok).toBe(true)
    expect(res.message).toContain('patient balance')
    const state = api.getState()
    expect(state.schedule.bookings[MULTI]!.balanceCheck).toMatchObject({ trigger: 'created' })
    expect(state.audit.find((a) => a.action === 'booking.balanceSampleStamped')).toMatchObject({ entityId: MULTI, who: DEMO_TRIGGER_ACTOR.who })
    expect(warningsForBooking(state, MULTI).find((w) => w.ruleId === 'patientBalance')).toMatchObject({ strength: 'strong' })
    expect(raise.disabledReason(api.getState(), route)).toBe('Samples already raised')
  })

  it('is skipped where the patient owes nothing, counts as done, and the message never names it', () => {
    const api = createAppStore()
    const raise = byId('raise-sample-warnings')
    const route = ctx(`/admin/day/2026-07-21/bookings/${PM_TARGET}`, { dateISO: '2026-07-21', bookingId: PM_TARGET! })
    const res = raise.run(api, route)
    expect(res.ok).toBe(true)
    expect(res.message).not.toContain('patient balance')
    expect(api.getState().schedule.bookings[PM_TARGET!]!.balanceCheck).toBeUndefined()
    expect(raise.disabledReason(api.getState(), route)).toBe('Samples already raised')
  })

  it('unstage removes the stamp and its clearance', () => {
    const api = createAppStore()
    byId('raise-sample-warnings').run(api, ctx(`/admin/day/2026-07-21/bookings/${MULTI}`, { bookingId: MULTI }))
    const w = warningsForBooking(api.getState(), MULTI).find((x) => x.ruleId === 'patientBalance')!
    expect(clearWarning(api, OFFICE_ACTOR, MULTI, w.key).ok).toBe(true)
    expect(clearSamplesOn(api, MULTI).ok).toBe(true)
    expect(api.getState().schedule.bookings[MULTI]!.balanceCheck).toBeUndefined()
    expect(api.getState().schedule.warningClearances[w.key]).toBeUndefined()
    expect(WARNING_SAMPLES.some((s) => s.isStaged(api.getState(), MULTI))).toBe(false)
  })
})

describe("Office clears this warning never lists the balance warning on the PWA (catch-up Phase 40, item 17)", () => {
  it('offers the other open warnings but not patientBalance', () => {
    const api = createAppStore()
    byId('raise-sample-warnings').run(api, ctx(`/admin/day/2026-07-21/bookings/${MULTI}`, { bookingId: MULTI }))
    const listId = api.getState().schedule.bookings[MULTI]!.listId
    expect(warningsForBooking(api.getState(), MULTI).some((w) => w.ruleId === 'patientBalance' && w.clearance === undefined)).toBe(true)
    const matched = demoTriggersFor(api.getState(), `/mobile/lists/${listId}/bookings/${MULTI}`, 'pwa').find((m) => m.trigger.id === 'office-clears-warning')
    expect(matched).toBeDefined()
    const choices = matched!.trigger.choices!(api.getState(), matched!.ctx)
    expect(choices.length).toBeGreaterThan(0)
    const balanceKeys = warningsForBooking(api.getState(), MULTI).filter((w) => w.ruleId === 'patientBalance').map((w) => w.key)
    expect(choices.some((c) => balanceKeys.includes(c.id))).toBe(false)
  })
})

describe('Office adds the NHI (PWA stand-in, catch-up Phase 40)', () => {
  it('its three fixture NHIs are valid and held by no seeded patient, and no seeded patient shares a name', () => {
    const patients = Object.values(buildSeed().masters.patients)
    const held = new Set(patients.map((p) => p.nhi))
    const names = new Set(patients.map((p) => p.name))
    for (const f of NO_NHI_FIXTURES) {
      expect(validateNhi(f.nhi).valid, f.nhi).toBe(true)
      expect(held.has(f.nhi), f.nhi).toBe(false)
      expect(names.has(f.name), f.name).toBe(false)
    }
  })

  it('is PWA only, on the mobile List and Booking routes, with the office stand-in badge', () => {
    const t = byId('pwa-office-adds-nhi')
    expect(t.surfaces).toEqual(['pwa'])
    expect(t.badge).toBe('office-stand-in')
    const api = createAppStore()
    const listId = SEED_LIST_IDS.souterPm21
    expect(demoTriggersFor(api.getState(), `/mobile/lists/${listId}`, 'pwa').map((m) => m.trigger.id)).toContain('pwa-office-adds-nhi')
    expect(demoTriggersFor(api.getState(), `/mobile/lists/${listId}/bookings/BK0001`, 'pwa').map((m) => m.trigger.id)).toContain('pwa-office-adds-nhi')
    expect(demoTriggersFor(api.getState(), `/mobile/lists/${listId}`, 'bar').map((m) => m.trigger.id)).not.toContain('pwa-office-adds-nhi')
  })

  it('stages a fixture row with no NHI, then the simulated office adds it: the Booking takes the stub\'s place, three times, then no rows left', () => {
    const api = createAppStore()
    const t = byId('pwa-office-adds-nhi')
    const listId = SEED_LIST_IDS.souterPm21
    const c = ctx(`/mobile/lists/${listId}`, { listId })
    expect(api.getState().schedule.lists[listId]!.state).toBe('ACTIVE')
    for (const fixture of NO_NHI_FIXTURES) {
      expect(t.disabledReason(api.getState(), c)).toBeNull()
      const before = bookingsForList(api.getState(), listId).length
      const res = t.run(api, c)
      expect(res.ok, res.message).toBe(true)
      expect(res.message).toBe(
        `The hospital sent a booking with no NHI, so it waited with the office as a stub on your List. The office added the NHI: ${fixture.name} is now on your List.`,
      )
      const state = api.getState()
      expect(bookingsForList(state, listId)).toHaveLength(before + 1)
      const patient = Object.values(state.masters.patients).find((p) => p.nhi === fixture.nhi)
      expect(patient?.name).toBe(fixture.name)
      expect(bookingsForList(state, listId).some((b) => b.patientId === patient!.hiddenInternalId)).toBe(true)
      expect(stubsOnList(state.intake.stubs, listId)).toHaveLength(0)
      const row = Object.values(state.intake.rows).find((r) => r.incoming.patient.name === fixture.name)!
      expect(row.incoming.patient.nhi).toBeUndefined()
      expect(row.status).toBe('applied')
      expect(state.audit.some((a) => a.who === OFFICE_SIMULATION_ACTOR.who && a.entityId === row.id)).toBe(true)
    }
    expect(t.disabledReason(api.getState(), c)).toBe(NO_FIXTURE_ROWS_LEFT)
  })

  it('uses a row already waiting on the List first (the seeded stub on Tue 4 Aug PM)', () => {
    const api = createAppStore()
    const list = Object.values(api.getState().schedule.lists).find((l) => stubsOnList(api.getState().intake.stubs, l.id).length > 0)
    expect(list).toBeDefined()
    if (list === undefined || list.state !== 'ACTIVE') return
    const stub = stubsOnList(api.getState().intake.stubs, list.id)[0]!
    const res = byId('pwa-office-adds-nhi').run(api, ctx(`/mobile/lists/${list.id}`, { listId: list.id }))
    expect(res.ok, res.message).toBe(true)
    expect(res.message).toContain(stub.asReceived.patientName)
    expect(Object.values(api.getState().intake.rows).some((r) => NO_NHI_FIXTURES.some((f) => f.name === r.incoming.patient.name))).toBe(false)
  })

  it('refuses a List that is not ACTIVE', () => {
    const api = createAppStore()
    const submitted = SEED_LIST_IDS.souterMon20Am
    expect(api.getState().schedule.lists[submitted]!.state).not.toBe('ACTIVE')
    expect(addNhiStandInRefusal(api.getState(), submitted)).toBe(LIST_NOT_ACTIVE)
  })
})
