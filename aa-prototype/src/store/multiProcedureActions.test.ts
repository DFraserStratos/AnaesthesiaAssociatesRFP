/**
 * The primary Procedure's store rules (catch-up Phase 23; US-03.2.2, US-03.2.1,
 * US-05.3.1, FT-03.2): exactly one primary on every path, Make primary
 * (`setPrimaryProcedure`) and its re-anchoring, removal by flag, and the
 * structural refusals on an additional Procedure.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { addProcedure, createBooking, removeProcedure, setPrimaryProcedure } from './bookingActions'
import { cancelBooking, editProcedure } from './lifecycle'
import { claimModifier, editModifierExplanation } from './modifierActions'
import { proceduresForBooking, railContextForList, railMastersOf } from './selectors'
import { procedureFeeAlone } from './testFees'
import type { Actor } from './mutate'
import { ANAE, MULTI_PROCEDURE_IDS, RVG_GROUP, SEED_MARKERS } from '../domain/seed'
import { seedModifierId } from '../domain/seed/modifiers'
import { startForAddedProcedure } from '../domain/billing/contractRail'
import type { AssignedList, Procedure } from '../domain/types'

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const FEED: Actor = { who: "St George's booking feed", role: 'system', source: 'integration' }
const SOUTER_PM = SEED_MARKERS['designDayPmList']!.entityId
const HOLT = SEED_MARKERS['splitBillingBooking']!.entityId
const BARIATRIC = SEED_MARKERS['bariatricType3Booking']!.entityId
const P1 = seedModifierId('P1')

/** A two-procedure Booking on Souter's ACTIVE Tue 21 PM: A3 primary (patient 72, so A1), then a second on A2. */
function twoProcedures(): { api: BoundAppStore; bookingId: string; primary: string; additional: string } {
  const api = createAppStore()
  const created = createBooking(api, SOUTER, SOUTER_PM, {
    patient: { name: 'Multi Procedure', dobISO: '1954-03-14' },
    sourceText: { text: 'Laparoscopic cholecystectomy', source: 'anaesthetist' },
    rvgGroupId: RVG_GROUP.a3!,
    scheduledTime: '17:00',
  })
  if (!created.ok) throw new Error(created.message)
  const bookingId = created.value.bookingId
  const added = addProcedure(api, SOUTER, bookingId)
  if (!added.ok) throw new Error(added.message)
  expect(editProcedure(api, SOUTER, added.value.procedureId, { rvgGroupId: RVG_GROUP.a2! }).ok).toBe(true)
  const [primary] = proceduresForBooking(api.getState(), bookingId)
  return { api, bookingId, primary: primary!.id, additional: added.value.procedureId }
}

const procs = (api: BoundAppStore, bookingId: string): Procedure[] => proceduresForBooking(api.getState(), bookingId)
const primariesOf = (api: BoundAppStore, bookingId: string) => procs(api, bookingId).filter((p) => p.isPrimary).map((p) => p.id)
const proc = (api: BoundAppStore, id: string) => api.getState().schedule.procedures[id]!

function feeOf(api: BoundAppStore, bookingId: string, procedureId: string) {
  const s = api.getState()
  const booking = s.schedule.bookings[bookingId]!
  return procedureFeeAlone({
    procedure: proc(api, procedureId),
    siblings: procs(api, bookingId),
    list: s.schedule.lists[booking.listId] as AssignedList,
    masters: s.masters,
    billingLines: s.schedule.billingLines,
    patientId: booking.patientId,
  }).fee
}

describe('exactly one primary on every path', () => {
  it('create, add, remove and Make primary each leave exactly one primary', () => {
    const { api, bookingId, primary, additional } = twoProcedures()
    expect(primariesOf(api, bookingId)).toEqual([primary])
    expect(proc(api, additional).isPrimary).toBe(false)
    const third = addProcedure(api, OFFICE, bookingId)
    expect(third.ok && primariesOf(api, bookingId)).toEqual([primary])
    expect(setPrimaryProcedure(api, OFFICE, additional).ok).toBe(true)
    expect(primariesOf(api, bookingId)).toEqual([additional])
    if (third.ok) expect(removeProcedure(api, OFFICE, third.value.procedureId).ok).toBe(true)
    expect(primariesOf(api, bookingId)).toEqual([additional])
  })

  it('refuses removing the primary (by flag, wherever it sits) and never promotes; an additional one still goes, with its lines', () => {
    const { api, bookingId, primary, additional } = twoProcedures()
    expect(removeProcedure(api, OFFICE, primary)).toMatchObject({ ok: false, code: 'primaryProcedure' })
    setPrimaryProcedure(api, OFFICE, additional)
    // The old first Procedure is now additional, so it can go; the new primary (stored second) cannot.
    expect(removeProcedure(api, OFFICE, additional)).toMatchObject({ ok: false, code: 'primaryProcedure' })
    expect(removeProcedure(api, OFFICE, primary).ok).toBe(true)
    expect(primariesOf(api, bookingId)).toEqual([additional])
  })
})

describe('setPrimaryProcedure (Make primary)', () => {
  it('moves the claims and the manual M, re-derives the pre-applied modifiers, drops a now-included P1 claim into before, clears the old base inputs; two audit entries', () => {
    const { api, primary, additional } = twoProcedures()
    // A Spine group that includes P1 on the additional Procedure.
    const spine = Object.values(api.getState().masters.rvgGroups).find((g) => g.includedModifierIds.includes(P1) && !g.retired)!
    expect(editProcedure(api, SOUTER, additional, { rvgGroupId: spine.id }).ok).toBe(true)
    expect(claimModifier(api, SOUTER, primary, { modifierId: seedModifierId('AS3'), explanation: 'ASA III, controlled COPD' }).ok).toBe(true)
    expect(claimModifier(api, SOUTER, primary, { modifierId: P1, explanation: 'Prone position' }).ok).toBe(true)
    expect(editProcedure(api, SOUTER, primary, { baseUnitsCaptured: { units: 9, source: 'overridden' }, modifierUnitsCaptured: { units: 6, source: 'overridden' } }).ok).toBe(true)
    const auditBefore = api.getState().audit.length

    const result = setPrimaryProcedure(api, SOUTER, additional)
    expect(result).toEqual({ ok: true, value: { previousPrimaryId: primary } })

    const next = proc(api, additional)
    const old = proc(api, primary)
    expect(next.isPrimary).toBe(true)
    expect(next.modifierClaims.map((c) => c.modifierId)).toEqual([seedModifierId('AS3')])
    expect(next.modifierClaims[0]!.explanation).toBe('ASA III, controlled COPD')
    expect(next.modifierUnitsCaptured).toEqual({ units: 6, source: 'overridden' })
    expect(old).toMatchObject({ isPrimary: false, modifierClaims: [], removedModifierIds: [] })
    expect(old.baseUnitsCaptured).toBeUndefined()
    expect(old.modifierUnitsCaptured).toBeUndefined()

    const entries = api.getState().audit.slice(auditBefore)
    expect(entries.map((e) => [e.action, e.entityId])).toEqual([
      ['procedure.setPrimary', primary],
      ['procedure.setPrimary', additional],
    ])
    expect(entries[0]!.before).toMatchObject({ isPrimary: true, baseUnitsCaptured: { units: 9, source: 'overridden' } })
    expect((entries[0]!.before as { modifierClaims: string[] }).modifierClaims).toEqual(['AS3: ASA III, controlled COPD', 'P1: Prone position'])
    expect(entries[1]!.after).toMatchObject({ isPrimary: true, modifierClaims: ['AS3: ASA III, controlled COPD'] })
    expect(entries.every((e) => e.source === 'anaesthetist')).toBe(true)
  })

  it('base comes from the new primary\'s own RVG group (A2 5, was A3 6); the old primary records base 0', () => {
    const { api, bookingId, primary, additional } = twoProcedures()
    expect(feeOf(api, bookingId, primary).btm.base.units).toBe(6)
    expect(feeOf(api, bookingId, additional).btm.base.units).toBe(0)
    setPrimaryProcedure(api, OFFICE, additional)
    expect(feeOf(api, bookingId, additional).btm.base.units).toBe(5)
    expect(feeOf(api, bookingId, primary).btm.base.units).toBe(0)
    expect(feeOf(api, bookingId, primary).btm.baseSource).toBe('additional')
  })

  it('onto the RVG-priced hernia of the mixed bariatric Booking, it brings base into the Booking (none while the fixed price was primary)', () => {
    const api = createAppStore()
    const [bypass, hernia] = procs(api, BARIATRIC)
    expect(feeOf(api, BARIATRIC, hernia!.id).allocation.baseCharged).toBe(false)
    expect(setPrimaryProcedure(api, OFFICE, hernia!.id).ok).toBe(true)
    const fee = feeOf(api, BARIATRIC, hernia!.id)
    expect(fee.allocation.baseCharged).toBe(true)
    expect(fee.btm.base.units).toBe(4)
    expect(feeOf(api, BARIATRIC, bypass!.id).total).toBe(2800)
  })

  it('checks its guards in order: notFound, bookingCancelled, the edit rights, bookingCompleted (anaesthetist only), alreadyPrimary', () => {
    expect(setPrimaryProcedure(createAppStore(), OFFICE, 'P9999')).toMatchObject({ ok: false, code: 'notFound' })

    const cancelled = twoProcedures()
    expect(cancelBooking(cancelled.api, OFFICE, cancelled.bookingId, 'Booked in error').ok).toBe(true)
    expect(setPrimaryProcedure(cancelled.api, OFFICE, cancelled.additional)).toMatchObject({ ok: false, code: 'bookingCancelled' })

    const authorised = createAppStore()
    const lists = authorised.getState().schedule.lists
    const holtList = authorised.getState().schedule.bookings[HOLT]!.listId
    authorised.setState({ schedule: { ...authorised.getState().schedule, lists: { ...lists, [holtList]: { ...lists[holtList]!, state: 'AUTHORISED' } as AssignedList } } })
    const [, holtAdditional] = procs(authorised, HOLT)
    expect(setPrimaryProcedure(authorised, OFFICE, holtAdditional!.id)).toMatchObject({ ok: false, code: 'listAuthorised' })

    const completed = twoProcedures()
    const b = completed.api.getState().schedule.bookings[completed.bookingId]!
    completed.api.setState({ schedule: { ...completed.api.getState().schedule, bookings: { ...completed.api.getState().schedule.bookings, [b.id]: { ...b, completed: true } } } })
    expect(setPrimaryProcedure(completed.api, SOUTER, completed.additional)).toMatchObject({ ok: false, code: 'bookingCompleted', message: 'This Booking is marked complete. Amend it before changing the primary procedure.' })
    expect(setPrimaryProcedure(completed.api, OFFICE, completed.additional).ok).toBe(true)

    const { api, primary } = twoProcedures()
    expect(setPrimaryProcedure(api, OFFICE, primary)).toMatchObject({ ok: false, code: 'alreadyPrimary' })
  })

  it('an inbound feed may change it on an ACTIVE List (audited integration); nobody on an AUTHORISED one', () => {
    const { api, additional } = twoProcedures()
    expect(setPrimaryProcedure(api, FEED, additional).ok).toBe(true)
    expect(api.getState().audit.filter((a) => a.action === 'procedure.setPrimary').every((a) => a.source === 'integration')).toBe(true)
    const holt = createAppStore()
    const [, holtAdditional] = procs(holt, HOLT)
    // No integration branch since catch-up Phase 33: a SUBMITTED List refuses only by state at AUTHORISED.
    // The office corrects a SUBMITTED Booking at review.
    expect(setPrimaryProcedure(holt, OFFICE, holtAdditional!.id).ok).toBe(true)
  })
})

describe('structural, not cosmetic: an additional Procedure (US-05.3.1)', () => {
  it('refuses an isPrimary patch, a base value, a manual M and a modifier claim or explanation edit', () => {
    const { api, primary, additional } = twoProcedures()
    expect(editProcedure(api, OFFICE, additional, { isPrimary: true } as never)).toMatchObject({ ok: false, code: 'usePrimaryAction', message: 'Use Make primary to change the primary procedure.' })
    expect(editProcedure(api, OFFICE, primary, { isPrimary: false } as never)).toMatchObject({ ok: false, code: 'usePrimaryAction' })
    expect(editProcedure(api, OFFICE, additional, { baseUnitsCaptured: { units: 5, source: 'overridden' } })).toMatchObject({ ok: false, code: 'additionalProcedureBase', message: 'Base units are charged on the primary procedure only.' })
    expect(editProcedure(api, OFFICE, additional, { baseUnitsSelected: 5 })).toMatchObject({ ok: false, code: 'additionalProcedureBase' })
    expect(editProcedure(api, OFFICE, additional, { modifierUnitsCaptured: { units: 3, source: 'overridden' } })).toMatchObject({ ok: false, code: 'modifiersOnPrimary', message: 'Modifiers are recorded once for the Booking, on the primary procedure.' })
    expect(claimModifier(api, SOUTER, additional, { modifierId: seedModifierId('AS3'), explanation: 'ASA III' })).toMatchObject({ ok: false, code: 'modifiersOnPrimary' })
    expect(editModifierExplanation(api, SOUTER, additional, seedModifierId('AS3'), 'ASA III')).toMatchObject({ ok: false, code: 'modifiersOnPrimary' })
  })

  it('allows clearing a key, and a procedure (RVG code) change, on an additional Procedure', () => {
    const { api, additional } = twoProcedures()
    expect(editProcedure(api, OFFICE, additional, { baseUnitsCaptured: undefined, baseUnitsSelected: undefined, modifierUnitsCaptured: undefined }).ok).toBe(true)
    expect(editProcedure(api, OFFICE, additional, { rvgGroupId: RVG_GROUP.a3! }).ok).toBe(true)
    expect(proc(api, additional).baseUnitsCaptured).toBeUndefined()
  })
})

describe('an added Procedure starts on the primary\'s Contract (catch-up Phase 23, re-basing 20)', () => {
  it("ticks the primary's Contract when it still fits, also when the primary is not first; else no tick", () => {
    const api = createAppStore()
    const s = api.getState()
    const booking = s.schedule.bookings[MULTI_PROCEDURE_IDS.booking]!
    const list = s.schedule.lists[booking.listId] as AssignedList
    const ctx = railContextForList(s, list, booking)
    const procedures = procs(api, booking.id)
    const primaryContract = procedures[0]!.governingContractId
    expect(startForAddedProcedure(railMastersOf(s), ctx, 'office', procedures).tick).toBe(primaryContract)
    // The primary stored last: the tick still follows it, not the first by position.
    const moved = procedures.map((p, i) => ({ ...p, isPrimary: i === 2, governingContractId: i === 2 ? primaryContract : 'CT-NONE' }))
    expect(startForAddedProcedure(railMastersOf(s), ctx, 'office', moved).tick).toBe(primaryContract)
    // A primary with no Contract: no tick, its answers so far.
    const none = procedures.map((p) => ({ ...p, governingContractId: undefined, railAnswers: { destination: 'patient' as const, narrow: 'standard' as const } }))
    expect(startForAddedProcedure(railMastersOf(s), ctx, 'office', none)).toEqual({ tick: undefined, start: { destination: 'patient', narrow: 'standard' } })
  })
})
