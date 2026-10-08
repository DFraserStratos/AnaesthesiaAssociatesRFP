import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { wireBillingRun } from './billingRun'
import { OFFICE_ACTOR } from './demoActors'
import { authoriseList } from './lifecycle'
import { authoriseAsSimulatedOffice } from './officeStandIn'
import { isListBilled } from './selectors'
import { SEED_LIST_IDS } from '../domain/seed'

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
