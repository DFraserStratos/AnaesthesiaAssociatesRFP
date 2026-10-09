import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { wireBillingRun } from './billingRun'
import { OFFICE_ACTOR } from './demoActors'
import { authoriseList } from './lifecycle'
import { authoriseAsSimulatedOffice } from './officeStandIn'
import { isListBilled } from './selectors'
import { ANAE, SEED_DRAFT_LIST_IDS, SEED_LIST_IDS } from '../domain/seed'
import { assignDraftListAsSimulatedOffice, assignNextFreeSlotAsSimulatedOffice, nextOpenSlotFor, STAND_IN_ASSIGN_CHOICES } from './officeStandIn'
import { OFFICE_SIMULATION_ACTOR } from './demoActors'
import { pairingStatus } from '../domain/pairingPreferences'
import { buildSeed as seedBuild } from '../domain/seed'
import STAND_IN_SOURCE from './officeStandIn.ts?raw'

/** A seeded SUBMITTED List from the review queue. */
const SUBMITTED = SEED_LIST_IDS.souterMon20Am

describe('authoriseAsSimulatedOffice', () => {
  it('refuses an ACTIVE List and an AUTHORISED one', () => {
    const api = createAppStore()
    const active = Object.values(api.getState().schedule.lists).find((l) => l.state === 'ACTIVE')
    expect(active).toBeDefined()
    const refusedActive = authoriseAsSimulatedOffice(api, active?.id ?? '')
    expect(refusedActive.ok ? '' : refusedActive.message).toBe('Submit the List first')

    authoriseList(api, OFFICE_ACTOR, SUBMITTED)
    const refusedDone = authoriseAsSimulatedOffice(api, SUBMITTED)
    expect(refusedDone.ok ? '' : refusedDone.message).toBe('Already authorised')
    expect(authoriseAsSimulatedOffice(api, 'NOPE').ok).toBe(false)
  })

  for (const wired of [true, false]) {
    it(`authorises and bills exactly once ${wired ? 'with' : 'without'} the wired billing run`, () => {
      const api = createAppStore()
      if (wired) wireBillingRun(api)
      const res = authoriseAsSimulatedOffice(api, SUBMITTED)
      expect(res.ok && res.value.billed).toBe(true)
      const state = api.getState()
      const list = state.schedule.lists[SUBMITTED]
      expect(list?.state).toBe('AUTHORISED')
      expect(list !== undefined && isListBilled(list)).toBe(true)
      const authoriseRows = state.audit.filter((a) => a.entityId === SUBMITTED && a.who === 'AA office (simulated)')
      expect(authoriseRows.length).toBeGreaterThan(0)
      const invoices = Object.values(state.billing.invoices).filter((i) => state.schedule.bookings[i.bookingId]?.listId === SUBMITTED)
      const again = authoriseAsSimulatedOffice(api, SUBMITTED)
      expect(again.ok).toBe(false)
      expect(Object.values(api.getState().billing.invoices).filter((i) => api.getState().schedule.bookings[i.bookingId]?.listId === SUBMITTED)).toHaveLength(invoices.length)
    })
  }

})

describe('Office assigns a List to my next free session (catch-up Phase 28)', () => {
  it('assigns the earliest open session from the demo clock\'s today, as the simulated office; a second run takes the next one', () => {
    const api = createAppStore()
    const first = nextOpenSlotFor(api.getState(), ANAE.souter)!
    expect(first.dateISO >= api.getState().clock.todayISO).toBe(true)
    const out = assignNextFreeSlotAsSimulatedOffice(api, ANAE.souter, 'sx-patel')
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.value.slot.id).toBe(first.id)
    const list = api.getState().schedule.lists[out.value.listId]!
    expect(list).toMatchObject({ slotId: first.id, state: 'ACTIVE', kind: 'private', hospitalId: 'H-SX', surgeonId: 'S-PATEL' })
    expect(api.getState().audit.find((a) => a.action === 'list.create' && a.entityId === list.id)?.who).toBe(OFFICE_SIMULATION_ACTOR.who)
    const second = assignNextFreeSlotAsSimulatedOffice(api, ANAE.souter)
    expect(second.ok && second.value.slot.id).not.toBe(first.id)
    if (second.ok) expect(second.value.slot.dateISO >= first.dateISO).toBe(true)
  })

  it('refuses with "No free session before the schedule horizon ends" when none is left', () => {
    const api = createAppStore()
    for (let i = 0; i < 400 && nextOpenSlotFor(api.getState(), ANAE.souter) !== undefined; i++) {
      expect(assignNextFreeSlotAsSimulatedOffice(api, ANAE.souter).ok).toBe(true)
    }
    expect(assignNextFreeSlotAsSimulatedOffice(api, ANAE.souter)).toMatchObject({ ok: false, message: 'No free session before the schedule horizon ends' })
  })

  it('pins its three fixed pairings: none is a not-preferred pairing with Dr Souter (its body reads no preference)', () => {
    const entries = seedBuild().officePrivate.pairingPreferences
    for (const c of STAND_IN_ASSIGN_CHOICES) expect(pairingStatus(entries, ANAE.souter, c.surgeonId), c.id).not.toBe('NOT_PREFERRED')
    const body = STAND_IN_SOURCE
    expect(body).not.toMatch(/officePrivate|pairingPreferences|priorityTiers/)
  })
})

describe('assignDraftListAsSimulatedOffice (catch-up Phase 31; the PWA stand-in for the office)', () => {
  it('on a fresh seed assigns LD-002 (two Bookings) into Dr Souter\'s Wed 22 PM as the simulated office; it becomes ACTIVE', () => {
    const api = createAppStore()
    const res = assignDraftListAsSimulatedOffice(api, ANAE.souter)
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.value).toMatchObject({ listId: SEED_DRAFT_LIST_IDS.forte, logged: false, bookings: 2 })
    expect(res.value.slot).toMatchObject({ dateISO: '2026-07-22', session: 'PM' })
    expect(api.getState().schedule.lists[SEED_DRAFT_LIST_IDS.forte]).toMatchObject({ state: 'ACTIVE', anaesthetistId: ANAE.souter })
    expect(api.getState().audit.find((a) => a.action === 'draftList.assign')).toMatchObject({ who: OFFICE_SIMULATION_ACTOR.who })
  })

  it('after Phase 28\'s stand-in takes Wed 22 PM, it falls back cleanly (either order works)', () => {
    const api = createAppStore()
    expect(assignNextFreeSlotAsSimulatedOffice(api, ANAE.souter).ok).toBe(true)
    const res = assignDraftListAsSimulatedOffice(api, ANAE.souter)
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.value.slot.dateISO > '2026-07-22' || res.value.slot.session === 'AM').toBe(true)
    const api2 = createAppStore()
    expect(assignDraftListAsSimulatedOffice(api2, ANAE.souter).ok).toBe(true)
    expect(assignNextFreeSlotAsSimulatedOffice(api2, ANAE.souter).ok).toBe(true)
  })

  it('logs a request for the next open session when no waiting one fits, and assigns it', () => {
    const api = createAppStore()
    // Run until the waiting requests that fit her sessions are used up.
    let res = assignDraftListAsSimulatedOffice(api, ANAE.souter)
    for (let i = 0; i < 10 && res.ok && !res.value.logged; i++) res = assignDraftListAsSimulatedOffice(api, ANAE.souter)
    expect(res.ok && res.value.logged).toBe(true)
    if (!res.ok) return
    expect(api.getState().schedule.lists[res.value.listId]).toMatchObject({ state: 'ACTIVE', anaesthetistId: ANAE.souter, draft: { origin: 'request', by: OFFICE_SIMULATION_ACTOR.who } })
  })

  it('never picks a not-preferred pairing: Dr Sharma skips Ms Reid\'s LD-003 on her free Mon 27 AM', () => {
    const api = createAppStore()
    for (let i = 0; i < 6; i++) {
      const res = assignDraftListAsSimulatedOffice(api, ANAE.sharma)
      if (!res.ok) break
      expect(res.value.listId).not.toBe(SEED_DRAFT_LIST_IDS.eyeSurgery)
      expect(res.value.surgeonId).not.toBe('S-REID')
    }
    expect(api.getState().schedule.lists[SEED_DRAFT_LIST_IDS.eyeSurgery]?.state).toBe('DRAFT')
  })

  it('refuses with "No free session in the schedule" when the anaesthetist has none', () => {
    const api = createAppStore()
    for (let i = 0; i < 400 && nextOpenSlotFor(api.getState(), ANAE.souter) !== undefined; i++) assignNextFreeSlotAsSimulatedOffice(api, ANAE.souter)
    expect(assignDraftListAsSimulatedOffice(api, ANAE.souter)).toMatchObject({ ok: false, message: 'No free session in the schedule' })
  })

  it('its body names no preference or tier', () => {
    expect(STAND_IN_SOURCE).not.toMatch(/officePrivate|pairingPreferences|priorityTiers|notPreferredEntryIds|notPreferredWarning|tierFor|TIER_LABELS|PAIRING_LABELS/)
  })
})
