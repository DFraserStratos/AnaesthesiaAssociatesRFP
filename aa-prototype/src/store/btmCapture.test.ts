/**
 * Phase 04 end-to-end capture tests: the Ellison live-demo flow (Finish-now at
 * 17:20 → the relocated $344.50/13u and 41u/$1,086.50 mockup pins →
 * complete → submit → still editable until authorised), the two-anaesthetist
 * rate comparison, the billing stamp the office reads, notes round-trip and the B/T/M provenance
 * semantics the "Use seeded value" reset link relies on.
 */

import { assigned } from '../test/lists'
import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { advanceClockMinutes } from './clockActions'
import { completeBooking, editProcedure, submitList } from './lifecycle'
import { auditForEntity, isListBilled, proceduresForBooking } from './selectors'
import { clockISO, mutate, type Actor } from './mutate'
import { feeFor, resolveBtm } from '../domain/billing/fee'
import { ANAE, RVG_GROUP, SEED_MARKERS, SEED_LIST_IDS } from '../domain/seed'
import type { Procedure } from '../domain/types'

const SOUTER: Actor = {
  who: 'Dr Melanie Souter',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.souter,
}
const SYSTEM: Actor = { who: 'Billing run', role: 'system', source: 'system' }

function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}

const SOUTER_PM = SEED_LIST_IDS.souterPm21
const ELLISON_BOOKING = marker('pendingCaptureBooking')

function store(): BoundAppStore {
  return createAppStore()
}

/** Per-procedure fees for a booking, assembled exactly as the capture UI does. */
function feeForBooking(api: BoundAppStore, bookingId: string): { totals: number[]; units: number[] } {
  const state = api.getState()
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) throw new Error(`missing booking ${bookingId}`)
  const list = assigned(state.schedule.lists[booking.listId])
  const anaesthetist = state.masters.anaesthetists[list.anaesthetistId]
  if (anaesthetist === undefined) throw new Error('missing context')
  const totals: number[] = []
  const units: number[] = []
  proceduresForBooking(state, bookingId).forEach((procedure) => {
    const contract =
      procedure.governingContractId !== undefined
        ? state.masters.contracts[procedure.governingContractId]
        : undefined
    const rvgGroup =
      procedure.rvgGroupId !== undefined ? state.masters.rvgGroups[procedure.rvgGroupId] : undefined
    const nonRvgLines = Object.values(state.schedule.billingLines).filter(
      (l) => l.procedureId === procedure.id && l.chargeBasis !== 'rvg',
    )
    const ctx: Parameters<typeof feeFor>[1] = {
      anaesthetist,
      dateISO: list.dateISO,
      timeRule: state.masters.rvgTimeRule,
      nonRvgLines,
    }
    if (contract !== undefined) ctx.contract = contract
    if (rvgGroup !== undefined) ctx.rvgGroup = rvgGroup
    const fee = feeFor(procedure, ctx)
    totals.push(fee.total)
    units.push(fee.billableUnits)
  })
  return { totals, units }
}

function ellisonProcedureId(api: BoundAppStore): string {
  const procedure = proceduresForBooking(api.getState(), ELLISON_BOOKING)[0]
  if (procedure === undefined) throw new Error('Ellison has no procedure')
  return procedure.id
}

describe('the Ellison live-demo flow (mockup demo script, real calculator)', () => {
  it('submit is blocked pre-capture, naming Ellison', () => {
    const api = store()
    const outcome = submitList(api, SOUTER, SOUTER_PM)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      expect(outcome.code).toBe('bookingsNotCompleted')
      expect(outcome.details).toEqual([ELLISON_BOOKING])
    }
  })

  it('Finish now at 17:20 → 13u/$344.50, PM totals 41u/$1,086.50 → complete → submit → still editable until authorised', () => {
    const api = store()
    // The presenter advances the demo clock to 17:20 (seeds at 08:00), then
    // taps Finish now — which stamps clockISO, exactly as TimesCard does.
    advanceClockMinutes(api, 9 * 60 + 20)
    const stamped = clockISO(api.getState().clock)
    expect(stamped).toBe('2026-07-21T17:20:00')
    expect(editProcedure(api, SOUTER, ellisonProcedureId(api), { handoverISO: stamped }).ok).toBe(true)

    // The relocated mockup pins (Decisions log 2026-07-23): B7 + T5 + M1 at
    // the SXAP $26.50 = 13 units, $344.50; the PM list's review totals row.
    expect(feeForBooking(api, ELLISON_BOOKING)).toEqual({ totals: [344.5], units: [13] })
    const pmBookings = Object.values(api.getState().schedule.bookings)
      .filter((c) => c.listId === SOUTER_PM)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((c) => feeForBooking(api, c.id))
    expect(pmBookings.reduce((s, f) => s + (f.units[0] ?? 0), 0)).toBe(41)
    expect(pmBookings.reduce((s, f) => s + (f.totals[0] ?? 0), 0)).toBeCloseTo(1086.5, 2)

    expect(completeBooking(api, SOUTER, ELLISON_BOOKING).ok).toBe(true)
    expect(submitList(api, SOUTER, SOUTER_PM).ok).toBe(true)
    expect(api.getState().schedule.lists[SOUTER_PM]?.state).toBe('SUBMITTED')

    // SUBMITTED no longer strips the anaesthetist's edit rights (catch-up Phase 38a, D63).
    expect(editProcedure(api, SOUTER, ellisonProcedureId(api), { intNotes: 'next-day fix' }).ok).toBe(true)
  })
})

describe("per-anaesthetist rates (RVG at the anaesthetist's rate)", () => {
  it('an identical capture prices at $212.00 under Souter and $336.00 under Strand', () => {
    const api = store()
    const masters = api.getState().masters
    const souter = masters.anaesthetists[ANAE.souter]
    const strand = masters.anaesthetists[ANAE.strand]
    if (souter === undefined || strand === undefined) throw new Error('missing anaesthetists')
    expect(souter.unitValue).toBe(26.5)
    expect(strand.unitValue).toBe(42)

    // B6 (A3, lap chole) + T2 (30 min) + M0 (AS1) = 8 units, no contract → the
    // anaesthetist's OWN unit value applies.
    const procedure: Procedure = {
      id: 'P-TEST',
      bookingId: 'C-TEST',
      description: 'Laparoscopic cholecystectomy',
      isAdditional: false,
      selectedModifierCodes: [],
      rvgGroupId: RVG_GROUP.a3!,
      asaClass: 'AS1',
      anaestheticStartISO: '2026-07-21T09:00:00',
      handoverISO: '2026-07-21T09:30:00',
    }
    const rvgGroup = masters.rvgGroups[RVG_GROUP.a3!]
    if (rvgGroup === undefined) throw new Error('missing RVG group')

    const souterFee = feeFor(procedure, { anaesthetist: souter, rvgGroup, dateISO: '2026-07-21', timeRule: masters.rvgTimeRule })
    const strandFee = feeFor(procedure, { anaesthetist: strand, rvgGroup, dateISO: '2026-07-21', timeRule: masters.rvgTimeRule })
    expect(souterFee.billableUnits).toBe(8)
    expect(souterFee.total).toBe(212)
    expect(strandFee.billableUnits).toBe(8)
    expect(strandFee.total).toBe(336)
  })
})

describe('isListBilled, the billing stamp the office reads (no longer the main view exit; catch-up Phase 38a)', () => {
  it('a billed list is excluded; a SUBMITTED-unbilled list stays', () => {
    const api = store()
    const morrison = SEED_LIST_IDS.morrisonMon20
    const whitaker = SEED_LIST_IDS.whitakerFri17

    expect(isListBilled(assigned(api.getState().schedule.lists[morrison]))).toBe(false)

    // Simulate Phase 08's stamp (the run's own audited write).
    mutate(
      api,
      SYSTEM,
      {
        entityType: 'list',
        entityId: morrison,
        action: 'list.billed',
        after: { billedAtISO: '2026-07-21T09:00:00' },
      },
      (s) => ({
        schedule: {
          ...s.schedule,
          lists: {
            ...s.schedule.lists,
            [morrison]: { ...assigned(s.schedule.lists[morrison]), billedAtISO: '2026-07-21T09:00:00' },
          },
        },
      }),
    )

    expect(isListBilled(assigned(api.getState().schedule.lists[morrison]))).toBe(true)
    expect(isListBilled(assigned(api.getState().schedule.lists[whitaker]))).toBe(false)
  })
})

describe('notes capture', () => {
  it('int/op notes round-trip through the audited editProcedure', () => {
    const api = store()
    const procedureId = ellisonProcedureId(api)
    const outcome = editProcedure(api, SOUTER, procedureId, {
      intNotes: 'Difficult airway, grade 3 view',
      opNotes: 'Cemented THR, posterior approach',
    })
    expect(outcome.ok).toBe(true)
    const procedure = api.getState().schedule.procedures[procedureId]
    expect(procedure?.intNotes).toBe('Difficult airway, grade 3 view')
    expect(procedure?.opNotes).toBe('Cemented THR, posterior approach')
    expect(auditForEntity(api.getState(), procedureId).at(-1)?.action).toBe('procedure.update')
  })
})

describe('B/T/M provenance semantics (the reset link contract)', () => {
  it('an overridden patch wins over the computation; clearing to undefined re-seeds', () => {
    const api = store()
    const procedureId = ellisonProcedureId(api)

    // Step the resolved T to an override (as the stepper writes it).
    expect(
      editProcedure(api, SOUTER, procedureId, {
        timeUnitsCaptured: { units: 5, source: 'overridden' },
      }).ok,
    ).toBe(true)
    let procedure = api.getState().schedule.procedures[procedureId]!
    let btm = resolveBtm(procedure, api.getState().masters.rvgGroups[procedure.rvgGroupId ?? ''], api.getState().masters.rvgTimeRule)
    expect(btm.time).toEqual({ units: 5, source: 'overridden' })

    // "Use seeded value": clearing the capture re-derives from the stamps
    // (no handover seeded → 0 time units, seeded provenance).
    expect(editProcedure(api, SOUTER, procedureId, { timeUnitsCaptured: undefined }).ok).toBe(true)
    procedure = api.getState().schedule.procedures[procedureId]!
    btm = resolveBtm(procedure, api.getState().masters.rvgGroups[procedure.rvgGroupId ?? ''], api.getState().masters.rvgTimeRule)
    expect(btm.time).toEqual({ units: 0, source: 'seeded' })
  })
})
