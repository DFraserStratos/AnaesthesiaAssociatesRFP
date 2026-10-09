import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { wireBillingRun } from './billingRun'
import { OFFICE_ACTOR } from './demoActors'
import { authoriseList } from './lifecycle'
import { authoriseAsSimulatedOffice } from './officeStandIn'
import { isListBilled } from './selectors'
import { ANAE, SEED_LIST_IDS } from '../domain/seed'
import { assignNextFreeSlotAsSimulatedOffice, nextOpenSlotFor, STAND_IN_ASSIGN_CHOICES } from './officeStandIn'
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
