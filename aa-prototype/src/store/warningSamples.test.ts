/**
 * Sample warnings (catch-up Phase 15a): pinned targets, stage and unstage
 * through audited actions as the demo actor, refusals, and (since catch-up
 * Phase 19 registered the second rule) two warnings on the multi-warning Booking.
 */

import { assigned } from '../test/lists'
import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { DEMO_TRIGGER_ACTOR, OFFICE_ACTOR } from './demoActors'
import { proceduresForBooking } from './selectors'
import { editProcedure } from './lifecycle'
import { setProcedureContract } from './contractSelectionActions'
import { raisePreProcedureInvoice } from './prepaymentActions'
import { clearWarning, openWarnings, warningsForBooking } from './warnings'
import {
  allSampleClearRefusal,
  clearAllSamples,
  clearSamplesOn,
  daySampleRaiseRefusal,
  raiseDaySamples,
  raiseSamplesOn,
  sampleClearRefusal,
  sampleRaiseRefusal,
  stagedSampleBookings,
} from './warningSamples'
import { DEMO_TODAY } from '../domain/clock'
import { buildSeed, SEED_LIST_IDS, SEED_MARKERS, SEED_WARNING_SAMPLE_BOOKINGS } from '../domain/seed'
import { WARNING_RULES } from '../domain/warnings'

const [AM_TARGET, PM_TARGET] = SEED_WARNING_SAMPLE_BOOKINGS.targets
const RILEY = SEED_MARKERS['prepaymentBooking']!.entityId

/** Force a List's state (its Bookings are not complete, so it cannot be submitted for real here). */
function setListState(api: BoundAppStore, listId: string, state: 'SUBMITTED' | 'AUTHORISED') {
  const s = api.getState()
  api.setState({ schedule: { ...s.schedule, lists: { ...s.schedule.lists, [listId]: { ...assigned(s.schedule.lists[listId]), state } } } })
}

const STAGED_FIELDS = ['governingContractId', 'enteredPrice', 'prepaymentDetail', 'rvgGroupId', 'baseUnitsSelected', 'baseUnitsCaptured'] as const

function seedFieldsOf(bookingId: string) {
  const seed = buildSeed()
  const p = proceduresForBooking(seed, bookingId)[0]!
  return Object.fromEntries(STAGED_FIELDS.map((f) => [f, p[f]]))
}

describe('pinned sample targets', () => {
  it('sit on Dr Rutherford’s Tue 21 Jul Lists, assigned and not submitted', () => {
    const seed = buildSeed()
    expect(SEED_WARNING_SAMPLE_BOOKINGS.targets).toHaveLength(2)
    expect(seed.schedule.bookings[AM_TARGET!]!.listId).toBe(SEED_LIST_IDS.rutherfordAm21)
    expect(seed.schedule.bookings[PM_TARGET!]!.listId).toBe(SEED_LIST_IDS.rutherfordPm21)
    for (const id of SEED_WARNING_SAMPLE_BOOKINGS.targets) {
      const list = assigned(seed.schedule.lists[seed.schedule.bookings[id]!.listId])
      expect(list.dateISO).toBe(DEMO_TODAY)
      expect(list.state).toBe('ACTIVE')
      expect(proceduresForBooking(seed, id).length).toBeGreaterThan(0)
    }
    expect(SEED_WARNING_SAMPLE_BOOKINGS.multiWarning).toBe(AM_TARGET)
  })

  it('are no Booking-level scenario marker and raise no warning on the seed', () => {
    const markerBookings = Object.values(SEED_MARKERS)
      .filter((m) => m.entityType === 'booking')
      .map((m) => m.entityId)
    for (const id of SEED_WARNING_SAMPLE_BOOKINGS.targets) {
      expect(markerBookings).not.toContain(id)
      expect(warningsForBooking(createAppStore().getState(), id)).toEqual([])
    }
  })
})

describe('raise and clear on the demo day', () => {
  it('raises a warning on each target as the demo actor, audited, then clears back to the seed', () => {
    const api = createAppStore()
    expect(daySampleRaiseRefusal(api.getState())).toBeNull()
    expect(allSampleClearRefusal(api.getState())).toBe('Nothing staged')

    const raised = raiseDaySamples(api)
    // Two samples on each target: the prepayment (strong) and the base units outside the guide (mild).
    expect(raised).toEqual({ ok: true, value: 4 })
    let state = api.getState()
    for (const id of SEED_WARNING_SAMPLE_BOOKINGS.targets) {
      expect(warningsForBooking(state, id).map((w) => w.ruleId)).toEqual(['prepaymentUnpaid', 'baseUnitsOutsideGuide'])
    }
    expect([...new Set(openWarnings(state).map((r) => r.bookingId))].sort()).toEqual([AM_TARGET, PM_TARGET, RILEY].sort())
    // Catch-up Phase 20: the prepayment sample moves the Procedure onto a prepaid Contract (`procedure.contract`).
    const stagedAudit = state.audit.filter((a) => (a.action === 'procedure.update' || a.action === 'procedure.contract') && a.who === DEMO_TRIGGER_ACTOR.who)
    expect(stagedAudit).toHaveLength(4)
    expect(stagedAudit.filter((a) => a.action === 'procedure.contract')).toHaveLength(2)
    expect(stagedAudit.every((a) => a.source === 'demo' && a.role === 'system')).toBe(true)
    expect(daySampleRaiseRefusal(state)).toBe('Samples already raised')
    expect(stagedSampleBookings(state)).toEqual([AM_TARGET, PM_TARGET].sort())

    // Clear one from the to-do list, then unstage: no clearance is left behind.
    const key = warningsForBooking(state, AM_TARGET!)[0]!.key
    expect(clearWarning(api, OFFICE_ACTOR, AM_TARGET!, key).ok).toBe(true)
    expect(api.getState().schedule.warningClearances[key]).toBeDefined()

    expect(clearAllSamples(api)).toEqual({ ok: true, value: 4 })
    state = api.getState()
    for (const id of SEED_WARNING_SAMPLE_BOOKINGS.targets) {
      const p = proceduresForBooking(state, id)[0]!
      expect(Object.fromEntries(STAGED_FIELDS.map((f) => [f, p[f]]))).toEqual(seedFieldsOf(id))
      expect(warningsForBooking(state, id)).toEqual([])
    }
    expect(state.schedule.warningClearances[key]).toBeUndefined()
    expect(state.audit.filter((a) => a.action === 'booking.warningSampleUnstaged')).toHaveLength(2)
    expect(stagedSampleBookings(state)).toEqual([])

    // Raised again, the cleared sample is open again.
    raiseDaySamples(api)
    expect(warningsForBooking(api.getState(), AM_TARGET!)[0]!.clearance).toBeUndefined()
  })

  it('leaves Annette Riley’s seeded warning alone', () => {
    const api = createAppStore()
    raiseDaySamples(api)
    clearAllSamples(api)
    expect(warningsForBooking(api.getState(), RILEY)).toHaveLength(1)
  })
})

describe('refusals on one Booking', () => {
  it('Riley already carries the warning; an unseeded or missing Booking is refused', () => {
    const api = createAppStore()
    // Riley's seed raises the prepayment warning, so only the base-units sample stages there.
    expect(sampleRaiseRefusal(api.getState(), RILEY)).toBeNull()
    expect(raiseSamplesOn(api, RILEY)).toEqual({ ok: true, value: 1 })
    expect(warningsForBooking(api.getState(), RILEY).map((w) => w.ruleId)).toEqual(['prepaymentUnpaid', 'baseUnitsOutsideGuide'])
    expect(sampleRaiseRefusal(api.getState(), RILEY)).toBe('Samples already raised')
    expect(sampleRaiseRefusal(api.getState(), 'BK9999')).toBe('Samples stage on seeded Bookings only')
  })

  it('a cancelled Booking has nothing to stage', () => {
    const api = createAppStore()
    const s = api.getState()
    const b = s.schedule.bookings[AM_TARGET!]!
    api.setState({
      schedule: {
        ...s.schedule,
        bookings: { ...s.schedule.bookings, [b.id]: { ...b, cancellation: { reason: 'Postponed', by: 'Kirsty W.', role: 'office', source: 'office', atISO: '2026-07-21T09:00:00' } } },
      },
    })
    expect(sampleRaiseRefusal(api.getState(), AM_TARGET!)).toBe('Nothing to stage on this Booking')
    expect(raiseSamplesOn(api, AM_TARGET!).ok).toBe(false)
  })

  it('an authorised List refuses raising and clearing', () => {
    const api = createAppStore()
    expect(raiseSamplesOn(api, PM_TARGET!).ok).toBe(true)
    expect(sampleRaiseRefusal(api.getState(), PM_TARGET!)).toBe('Samples already raised')
    setListState(api, SEED_LIST_IDS.rutherfordPm21, 'AUTHORISED')
    expect(sampleRaiseRefusal(api.getState(), PM_TARGET!)).toBe("This Booking's List is authorised")
    expect(clearSamplesOn(api, PM_TARGET!)).toMatchObject({ ok: false, message: "This Booking's List is authorised" })
    expect(allSampleClearRefusal(api.getState())).toBe("This Booking's List is authorised")
  })

  it('a submitted List still takes the samples (the demo actor is a system actor)', () => {
    const api = createAppStore()
    setListState(api, SEED_LIST_IDS.rutherfordAm21, 'SUBMITTED')
    expect(raiseSamplesOn(api, AM_TARGET!).ok).toBe(true)
    expect(clearSamplesOn(api, AM_TARGET!).ok).toBe(true)
  })
})

describe('two rules on the multi-warning Booking (catch-up Phase 19)', () => {
  it('shows two warnings with their own text and keys, strong first', () => {
    const api = createAppStore()
    raiseDaySamples(api)
    const warnings = warningsForBooking(api.getState(), SEED_WARNING_SAMPLE_BOOKINGS.multiWarning)
    expect(warnings).toHaveLength(2)
    expect(warnings.map((w) => w.strength)).toEqual(['strong', 'mild'])
    expect(new Set(warnings.map((w) => w.key)).size).toBe(2)
    expect(warnings[1]!.text).toMatch(/^Base units \d+ are outside the RVG guide for /)
    expect(WARNING_RULES.map((r) => r.id)).toEqual(['prepaymentUnpaid', 'baseUnitsOutsideGuide'])
  })

  it('stages a recorded value of the guide top plus 2, through the audited actions, and restores the seed', () => {
    const api = createAppStore()
    raiseSamplesOn(api, AM_TARGET!)
    const seed = buildSeed()
    const target = proceduresForBooking(seed, AM_TARGET!).find((p) => p.rvgGroupId !== undefined)!
    const group = seed.masters.rvgGroups[target.rvgGroupId!]!
    const staged = api.getState().schedule.procedures[target.id]!
    const expected = Math.max(group.baseUnitsRange?.max ?? 0, group.baseUnits) + 2
    if (group.baseUnitsRange !== undefined) expect(staged.baseUnitsSelected).toBe(expected)
    else expect(staged.baseUnitsCaptured).toEqual({ units: expected, source: 'overridden' })
    expect(staged.rvgGroupId).toBe(target.rvgGroupId)
    clearSamplesOn(api, AM_TARGET!)
    expect(api.getState().schedule.procedures[target.id]).toEqual(target)
  })
})

describe('review fixes (convention 18)', () => {
  it('a real edit to the sample values is never a staged sample, and Clear sample warnings leaves it alone', () => {
    const api = createAppStore()
    const p = proceduresForBooking(api.getState(), AM_TARGET!)[0]!
    // The office itself puts it on a prepaid Contract (catch-up Phase 20).
    expect(setProcedureContract(api, OFFICE_ACTOR, p.id, 'CT-FIX-PATIENT-PREPAID', { enteredPrice: 500 }).ok).toBe(true)
    expect(stagedSampleBookings(api.getState())).toEqual([])
    expect(allSampleClearRefusal(api.getState())).toBe('Nothing staged')
    expect(clearAllSamples(api).ok).toBe(false)
    expect(proceduresForBooking(api.getState(), AM_TARGET!)[0]!.governingContractId).toBe('CT-FIX-PATIENT-PREPAID')
  })

  it('a staged sample the office then edits is no longer the demo’s to revert', () => {
    const api = createAppStore()
    raiseSamplesOn(api, AM_TARGET!)
    const p = proceduresForBooking(api.getState(), AM_TARGET!)[0]!
    editProcedure(api, OFFICE_ACTOR, p.id, { notes: 'Checked with the patient' } as never)
    expect(stagedSampleBookings(api.getState())).not.toContain(AM_TARGET)
  })

  it('refuses to unstage once a real pre-procedure invoice was raised on the sample', () => {
    const api = createAppStore()
    raiseSamplesOn(api, AM_TARGET!)
    expect(raisePreProcedureInvoice(api, OFFICE_ACTOR, AM_TARGET!).ok).toBe(true)
    expect(sampleClearRefusal(api.getState(), AM_TARGET!)).toBe('A pre-procedure invoice was raised on this sample: use Reset')
    expect(clearSamplesOn(api, AM_TARGET!).ok).toBe(false)
    expect(allSampleClearRefusal(api.getState())).toBe('A pre-procedure invoice was raised on this sample: use Reset')
  })

  it('unstaging restores the seed’s last-modified stamp and audits the Procedure revert', () => {
    const api = createAppStore()
    const seedBooking = buildSeed().schedule.bookings[AM_TARGET!]!
    raiseSamplesOn(api, AM_TARGET!)
    expect(api.getState().schedule.bookings[AM_TARGET!]!.lastModifiedBy).toBe(DEMO_TRIGGER_ACTOR.who)
    clearSamplesOn(api, AM_TARGET!)
    const b = api.getState().schedule.bookings[AM_TARGET!]!
    expect([b.lastModifiedBy, b.lastModifiedAtISO]).toEqual([seedBooking.lastModifiedBy, seedBooking.lastModifiedAtISO])
    const p = proceduresForBooking(api.getState(), AM_TARGET!)[0]!
    const revert = api.getState().audit.filter((a) => a.entityId === p.id).at(-1)
    expect(revert).toMatchObject({ action: 'procedure.update', who: DEMO_TRIGGER_ACTOR.who })
  })
})

describe('the base-units sample never half-stages or overwrites a real edit (review fixes, catch-up Phase 19)', () => {
  it('refuses before staging anything when the office has changed the target’s base units', () => {
    const api = createAppStore()
    const target = proceduresForBooking(buildSeed(), PM_TARGET!).find((p) => p.rvgGroupId !== undefined)!
    expect(editProcedure(api, OFFICE_ACTOR, target.id, { baseUnitsCaptured: { units: 5, source: 'overridden' } }).ok).toBe(true)
    const before = api.getState().schedule.procedures
    expect(sampleRaiseRefusal(api.getState(), PM_TARGET!)).toBe("This Booking's base units were changed: use Reset")
    expect(raiseSamplesOn(api, PM_TARGET!)).toMatchObject({ ok: false })
    expect(api.getState().schedule.procedures).toBe(before)
  })
})
