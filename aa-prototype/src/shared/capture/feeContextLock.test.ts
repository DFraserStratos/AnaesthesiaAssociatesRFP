/**
 * Locked Bookings display from the snapshot (catch-up Phase 25, work item 9;
 * US-15.0.3: billing is the one exception to "entered once, current
 * everywhere"). After authorise, a unit-value, RVG group, invoice description
 * and Contract rate and name edit leave the locked Booking's fee, units and
 * stack as locked, while an ACTIVE Booking by the same anaesthetist re-prices.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from '../../store/appStore'
import { authoriseList } from '../../store/lifecycle'
import { bookingsForList, heldPricesForBooking, procedureStackViewFor, proceduresForBooking } from '../../store/selectors'
import { ANAE, SEED_LIST_IDS } from '../../domain/seed'
import { bookingFee } from './feeContext'
import type { AssignedList } from '../../domain/types'

const OFFICE = { who: 'Kirsty W.', role: 'office' as const, source: 'office' as const }

describe('a locked Booking displays from its snapshot', () => {
  it('fee, units and the stack keep the locked values after master edits; an ACTIVE Booking re-prices', () => {
    const api = createAppStore()
    const listId = SEED_LIST_IDS.souterMon20Am
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    const feeOf = (bookingId: string) => {
      const s = api.getState()
      const booking = s.schedule.bookings[bookingId]!
      const list = s.schedule.lists[booking.listId] as AssignedList
      const lock = s.billing.locks[bookingId]
      return bookingFee({ procedures: proceduresForBooking(s, bookingId), list, masters: s.masters, billingLines: s.schedule.billingLines, patientId: booking.patientId, held: heldPricesForBooking(s, bookingId), ...(lock !== undefined ? { lock } : {}) })
    }
    const locked = bookingsForList(api.getState(), listId)[0]!
    const active = Object.values(api.getState().schedule.bookings).find((b) => {
      const l = api.getState().schedule.lists[b.listId]
      return l?.state === 'ACTIVE' && l.anaesthetistId === ANAE.souter && b.cancellation === undefined && b.completed
    })!
    const before = { locked: feeOf(locked.id), active: feeOf(active.id) }
    const stackBefore = procedureStackViewFor(api.getState(), proceduresForBooking(api.getState(), locked.id)[0]!.id, 'office')

    const s = api.getState()
    const contractId = proceduresForBooking(s, locked.id)[0]!.governingContractId!
    api.setState({
      masters: {
        ...s.masters,
        anaesthetists: { ...s.masters.anaesthetists, [ANAE.souter]: { ...s.masters.anaesthetists[ANAE.souter]!, unitValue: 28 } },
        rvgGroups: Object.fromEntries(Object.entries(s.masters.rvgGroups).map(([id, g]) => [id, { ...g, baseUnits: g.baseUnits + 2 }])),
        contracts: { ...s.masters.contracts, [contractId]: { ...s.masters.contracts[contractId]!, name: 'Renamed after authorise' } },
      },
    })

    const after = { locked: feeOf(locked.id), active: feeOf(active.id) }
    expect(after.locked.total).toBe(before.locked.total)
    expect(after.locked.units).toBe(before.locked.units)
    expect(after.active.total).not.toBe(before.active.total)
    const stackAfter = procedureStackViewFor(api.getState(), proceduresForBooking(api.getState(), locked.id)[0]!.id, 'office')
    expect(stackAfter?.contract?.name).toBe(stackBefore?.contract?.name)
    expect(stackAfter?.contract?.locked).toBe(true)
  })
})
