/**
 * Starting values from the Contract in the store (catch-up Phase 19a; DM-43,
 * US-04.2.18 "Default RVG code", A15): choosing a Contract on the step rail
 * (`setProcedureContract`, catch-up Phase 20) or adding a Procedure with its
 * own pick (`addProcedure`) fills an empty RVG code from the Contract's
 * default; a code already set is kept, with its times and modifiers.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import type { Actor } from './mutate'
import { editProcedure } from './lifecycle'
import { setProcedureContract } from './contractSelectionActions'
import { addProcedure } from './bookingActions'
import { proceduresForBooking } from './selectors'
import { bookingFee } from '../shared/capture/feeContext'
import { procedureFeeAlone as procedureFee } from './testFees'
import { editContract } from './contractActions'
import { PRICED_ITEM } from '../domain/seed/pricedItems'
import { CONTRACT, MERIVALE_FACE_LIFT_BOOKING_ID, RVG_GROUP, SEED_MARKERS } from '../domain/seed'
import type { AssignedList } from '../domain/types'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

/** Annette Riley's rhinoplasty (Dr Souter, Fri 24 Jul): no RVG code. */
const RILEY = SEED_MARKERS['prepaymentBooking']!.entityId
/** Ellison's Booking: an RVG code, start and finish already recorded. */
const ELLISON = SEED_MARKERS['pendingCaptureBooking']!.entityId

describe('starting values from the Contract', () => {
  it('a Contract with a default RVG code fills an empty code, and B comes from the RVG group alone', () => {
    const api = createAppStore()
    const p = proceduresForBooking(api.getState(), RILEY)[0]!
    expect(p.rvgGroupId).toBeUndefined()
    expect(setProcedureContract(api, OFFICE, p.id, PRICED_ITEM.merFaceLift).ok).toBe(true)
    const s = api.getState()
    const after = s.schedule.procedures[p.id]!
    expect(s.masters.rvgGroups[after.rvgGroupId!]?.code).toBe('H3')
    // One audited change records the Contract and the code it filled.
    expect(s.audit.at(-1)).toMatchObject({ action: 'procedure.contract', after: { governingContractId: PRICED_ITEM.merFaceLift, rvgGroupId: after.rvgGroupId } })
    const list = s.schedule.lists[s.schedule.bookings[RILEY]!.listId] as AssignedList
    const { fee } = procedureFee({ procedure: after, list, masters: s.masters, billingLines: s.schedule.billingLines, patientId: s.schedule.bookings[RILEY]!.patientId })
    expect(fee.btm.base.units).toBe(s.masters.rvgGroups[after.rvgGroupId!]!.baseUnits)
    expect(fee.btm.baseSource).toBe('rvgGroup')
    // A fixed price: the units are for reference only.
    expect(fee.lines[0]).toEqual({ chargeBasis: 'fixed', description: 'Contract price', amount: 3100 })
    expect(fee.lines.some((l) => l.chargeBasis === 'rvg')).toBe(false)
  })

  it('a Procedure that already has an RVG code keeps it, with its times', () => {
    const api = createAppStore()
    const p = proceduresForBooking(api.getState(), ELLISON)[0]!
    expect(p.rvgGroupId).toBeDefined()
    // Southern Cross RVG, given a default, is a candidate on Ellison's Southern Cross List.
    expect(editContract(api, OFFICE, CONTRACT.sxRvg, { defaultRvgGroupId: RVG_GROUP.h3! }).ok).toBe(true)
    expect(setProcedureContract(api, OFFICE, p.id, CONTRACT.sxRvg).ok).toBe(true)
    const after = api.getState().schedule.procedures[p.id]!
    expect(after.rvgGroupId).toBe(p.rvgGroupId)
    expect(after.anaestheticStartISO).toBe(p.anaestheticStartISO)
    expect(after.modifierClaims).toEqual(p.modifierClaims)
  })

  it('a Contract with no default leaves an empty code empty', () => {
    const api = createAppStore()
    const p = proceduresForBooking(api.getState(), RILEY)[0]!
    expect(setProcedureContract(api, OFFICE, p.id, PRICED_ITEM.souterBreastAug).ok).toBe(true)
    expect(api.getState().schedule.procedures[p.id]!.rvgGroupId).toBeUndefined()
  })

  it('a Procedure added to a Booking with its own RVG-priced Contract fills its RVG code from that default (US-03.2.3)', () => {
    const api = createAppStore()
    // Give Southern Cross Affiliated Provider (RVG at $26.50) a default, then add to an open Booking on it.
    expect(editContract(api, OFFICE, CONTRACT.sxap, { defaultRvgGroupId: RVG_GROUP.h3! }).ok).toBe(true)
    const s0 = api.getState()
    const onSxap = Object.values(s0.schedule.procedures).find((p) => {
      const b = s0.schedule.bookings[p.bookingId]
      const l = b !== undefined ? s0.schedule.lists[b.listId] : undefined
      return p.governingContractId === CONTRACT.sxap && b !== undefined && !b.completed && b.cancellation === undefined && l?.state === 'ACTIVE'
    })!
    const added = addProcedure(api, OFFICE, onSxap.bookingId, { governingContractId: CONTRACT.sxap })
    if (!added.ok) throw new Error(added.message)
    const p = api.getState().schedule.procedures[added.value.procedureId]!
    expect(p.governingContractId).toBe(CONTRACT.sxap)
    expect(p.rvgGroupId).toBe(RVG_GROUP.h3)
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'procedure.create', after: { rvgGroupId: RVG_GROUP.h3 } })
  })

  it('an added Procedure inherits no Contract, so a fixed-price item is not billed twice', () => {
    const api = createAppStore()
    const added = addProcedure(api, OFFICE, MERIVALE_FACE_LIFT_BOOKING_ID)
    if (!added.ok) throw new Error(added.message)
    const p = api.getState().schedule.procedures[added.value.procedureId]!
    expect(p.governingContractId).toBeUndefined()
    expect(p.rvgGroupId).toBeUndefined()
    const s = api.getState()
    const list = s.schedule.lists[s.schedule.bookings[MERIVALE_FACE_LIFT_BOOKING_ID]!.listId] as AssignedList
    expect(bookingFee({ procedures: proceduresForBooking(s, MERIVALE_FACE_LIFT_BOOKING_ID), list, masters: s.masters, billingLines: s.schedule.billingLines, patientId: s.schedule.bookings[MERIVALE_FACE_LIFT_BOOKING_ID]!.patientId }).total).toBe(3100)
  })

  it('a typed base value from before the fill is cleared, so B comes from the RVG group alone', () => {
    const api = createAppStore()
    const p = proceduresForBooking(api.getState(), RILEY)[0]!
    expect(editProcedure(api, OFFICE, p.id, { baseUnitsCaptured: { units: 9, source: 'overridden' } }).ok).toBe(true)
    expect(setProcedureContract(api, OFFICE, p.id, PRICED_ITEM.merFaceLift).ok).toBe(true)
    const after = api.getState().schedule.procedures[p.id]!
    expect(after.baseUnitsCaptured).toBeUndefined()
    expect(after.baseUnitsSelected).toBeUndefined()
  })
})
