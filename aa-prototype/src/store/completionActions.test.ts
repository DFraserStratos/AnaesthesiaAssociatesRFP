/**
 * Catch-up Phase 21a in the store: "None apply" answers the modifiers step
 * (`confirmNoModifiers`), a claim answers it too, completion reads only the
 * three-condition rule, a Contract change that newly asks for RVG detail
 * re-opens a completed Booking, and the billing run keeps its pre-flight.
 */
import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, completeBooking, completionBlockersFor } from './lifecycle'
import { claimModifier, confirmNoModifiers, removeModifier } from './modifierActions'
import { setProcedureContract } from './contractSelectionActions'
import { setProcedurePrice } from './pricingActions'
import { proceduresForBooking } from './selectors'
import type { Actor } from './mutate'
import { ANAE, CONTRACT, SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'
import { seedModifierId as mod } from '../domain/seed/modifiers'
import { seedFallbackId } from '../domain/billing/fallbacks'
import { REOPENED_FOR_RVG_DETAIL_MESSAGE } from '../domain/billing/completion'
import { ACTION_LABELS } from '../shared/audit/actionLabels'
import { FIELD_LABELS } from '../shared/audit/fieldLabels'

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const MORRISON: Actor = { who: 'Dr Morrison', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.morrison }
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

const ELLISON = 'P0009'
const ELLISON_BOOKING = 'BK0009'
const FIXED_BOOKING = SEED_MARKERS.fixedPriceNoTimes!.entityId
const NEEDS_PRICE_BOOKING = SEED_MARKERS.needsPriceBooking!.entityId

const procOf = (api: BoundAppStore, bookingId: string) => proceduresForBooking(api.getState(), bookingId)[0]!
const last = (api: BoundAppStore) => api.getState().audit.at(-1)!

describe('confirmNoModifiers ("None apply", catch-up Phase 21a)', () => {
  it('answers the step, audited procedure.modifiersConfirm with a History label; a second press writes nothing', () => {
    const api = createAppStore()
    expect(api.getState().schedule.procedures[ELLISON]!.modifiersConfirmed).toBeUndefined()
    expect(confirmNoModifiers(api, SOUTER, ELLISON).ok).toBe(true)
    expect(api.getState().schedule.procedures[ELLISON]!.modifiersConfirmed).toBe(true)
    expect(last(api)).toMatchObject({ action: 'procedure.modifiersConfirm', entityId: ELLISON, before: { modifiersConfirmed: false }, after: { modifiersConfirmed: true } })
    const count = api.getState().audit.length
    expect(confirmNoModifiers(api, SOUTER, ELLISON).ok).toBe(true)
    expect(api.getState().audit.length).toBe(count)
    expect(ACTION_LABELS['procedure.modifiersConfirm']).toBe('No modifiers claimed')
    expect(FIELD_LABELS.modifiersConfirmed).toBeDefined()
  })

  it("is refused on a colleague's List and on an AUTHORISED List; the office may answer", () => {
    const api = createAppStore()
    expect(confirmNoModifiers(api, MORRISON, ELLISON)).toMatchObject({ ok: false, code: 'notOwnList' })
    expect(confirmNoModifiers(api, OFFICE, ELLISON).ok).toBe(true)
    const authorised = Object.values(api.getState().schedule.lists).find((l) => l.state === 'AUTHORISED')!
    const onIt = Object.values(api.getState().schedule.bookings).find((b) => b.listId === authorised.id)!
    expect(confirmNoModifiers(api, OFFICE, procOf(api, onIt.id).id)).toMatchObject({ ok: false, code: 'listAuthorised' })
  })

  it('a claim answers the step too, and removing it or changing the Contract never clears the answer', () => {
    const api = createAppStore()
    expect(claimModifier(api, SOUTER, ELLISON, { modifierId: mod('AS3'), explanation: 'ASA III on pre-op review' }).ok).toBe(true)
    expect(api.getState().schedule.procedures[ELLISON]!.modifiersConfirmed).toBe(true)
    expect(removeModifier(api, SOUTER, ELLISON, mod('AS3')).ok).toBe(true)
    expect(api.getState().schedule.procedures[ELLISON]!.modifiersConfirmed).toBe(true)
    expect(setProcedureContract(api, OFFICE, ELLISON, CONTRACT.noContractRvg).ok).toBe(true)
    expect(api.getState().schedule.procedures[ELLISON]!.modifiersConfirmed).toBe(true)
  })
})

describe('completion in the store reads only the rule (catch-up Phase 21a)', () => {
  it('Ellison, finished, refuses only on the modifiers step until "None apply"; then completes', () => {
    const api = createAppStore()
    const state = api.getState()
    const p = state.schedule.procedures[ELLISON]!
    api.setState({ schedule: { ...state.schedule, procedures: { ...state.schedule.procedures, [ELLISON]: { ...p, handoverISO: '2026-11-24T17:20:00' } } } })
    const blockers = completionBlockersFor(api.getState(), api.getState().schedule.bookings[ELLISON_BOOKING]!)
    expect((blockers[0]!.details as { code: string }[]).map((f) => f.code)).toEqual(['modifiersStep'])
    confirmNoModifiers(api, SOUTER, ELLISON)
    expect(completeBooking(api, SOUTER, ELLISON_BOOKING).ok).toBe(true)
  })

  it('the fixed-price Booking completes with no times, code or modifiers', () => {
    const api = createAppStore()
    expect(completeBooking(api, SOUTER, FIXED_BOOKING).ok).toBe(true)
  })

  it('the open price refuses with "Needs a price" until an amount is typed', () => {
    const api = createAppStore()
    const outcome = completeBooking(api, SOUTER, NEEDS_PRICE_BOOKING)
    expect(outcome).toMatchObject({ ok: false, code: 'validationFailed' })
    expect(JSON.stringify(outcome)).toContain('Needs a price')
    expect(setProcedurePrice(api, SOUTER, procOf(api, NEEDS_PRICE_BOOKING).id, 650).ok).toBe(true)
    expect(completeBooking(api, SOUTER, NEEDS_PRICE_BOOKING).ok).toBe(true)
  })
})

describe('a Contract change that newly asks for RVG detail re-opens a completed Booking (our reading)', () => {
  it('fixed price to No contract · RVG re-opens it in the same commit, with the reason in History', () => {
    const api = createAppStore()
    expect(completeBooking(api, SOUTER, FIXED_BOOKING).ok).toBe(true)
    expect(setProcedureContract(api, OFFICE, procOf(api, FIXED_BOOKING).id, CONTRACT.noContractRvg).ok).toBe(true)
    const booking = api.getState().schedule.bookings[FIXED_BOOKING]!
    expect(booking.completed).toBe(false)
    expect(booking.completedAtISO).toBeUndefined()
    expect(last(api)).toMatchObject({ action: 'booking.uncomplete', entityId: FIXED_BOOKING, after: { completed: false, reason: REOPENED_FOR_RVG_DETAIL_MESSAGE } })
  })

  it('the reverse, an RVG kind to a fixed price, never re-opens', () => {
    const api = createAppStore()
    const completed = Object.values(api.getState().schedule.bookings).find((b) => b.id === 'BK0001')!
    expect(completed.completed).toBe(true)
    expect(setProcedureContract(api, OFFICE, procOf(api, 'BK0001').id, seedFallbackId('patient-standard'), { enteredPrice: 500 }).ok).toBe(true)
    expect(api.getState().schedule.bookings.BK0001!.completed).toBe(true)
  })
})

describe('the billing run keeps its pre-flight (catch-up Phase 21a)', () => {
  it('a Booking that needs a price, which slipped past completion, blocks authorise in the same words (catch-up Phase 25)', () => {
    const api = createAppStore()
    const listId = SEED_LIST_IDS.morrisonMon20
    const s = api.getState()
    const booking = Object.values(s.schedule.bookings).find((b) => b.listId === listId && b.completed && b.cancellation === undefined)!
    const p = proceduresForBooking(s, booking.id)[0]!
    api.setState({ schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [p.id]: { ...p, governingContractId: seedFallbackId('patient-standard') } } } })
    const refused = authoriseList(api, OFFICE, listId)
    expect(refused).toMatchObject({ ok: false, code: 'needsPrice' })
    if (!refused.ok) expect(refused.message).toContain('Needs a price')
    expect(api.getState().billing.locks[booking.id]).toBeUndefined()
  })
})
