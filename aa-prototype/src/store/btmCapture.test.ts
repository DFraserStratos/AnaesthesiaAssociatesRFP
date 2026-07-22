/**
 * Phase 04 end-to-end capture tests: the Ellison live-demo flow (Finish-now at
 * 17:20 → the relocated $344.50/13u and 41u/$1,086.50 mockup pins →
 * complete → submit → read-only), the two-anaesthetist rate comparison, the
 * billedAt disappearance selector, notes round-trip and the B/T/M provenance
 * semantics the "Use seeded value" reset link relies on.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { advanceClockMinutes } from './clockActions'
import { completeCard, editProcedure, submitList } from './lifecycle'
import { auditForEntity, isListBilled, proceduresForCard } from './selectors'
import { clockISO, mutate, type Actor } from './mutate'
import { feeFor, resolveBtm } from '../domain/billing/fee'
import { ANAE, SEED_MARKERS, SEED_LIST_IDS } from '../domain/seed'
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
const ELLISON_CARD = marker('pendingCaptureCard')

function store(): BoundAppStore {
  return createAppStore()
}

/** Per-procedure fees for a card, assembled exactly as the capture UI does. */
function feeForCard(api: BoundAppStore, cardId: string): { totals: number[]; units: number[] } {
  const state = api.getState()
  const card = state.schedule.cards[cardId]
  if (card === undefined) throw new Error(`missing card ${cardId}`)
  const list = state.schedule.lists[card.listId]
  const anaesthetist = list !== undefined ? state.masters.anaesthetists[list.anaesthetistId] : undefined
  if (list === undefined || anaesthetist === undefined) throw new Error('missing context')
  const totals: number[] = []
  const units: number[] = []
  proceduresForCard(state, cardId).forEach((procedure, index) => {
    const contract =
      procedure.governingContractId !== undefined
        ? state.masters.contracts[procedure.governingContractId]
        : undefined
    const baseCode =
      procedure.rvgBaseCode !== undefined ? state.masters.rvgCodes[procedure.rvgBaseCode] : undefined
    const nonRvgLines = Object.values(state.schedule.billingLines).filter(
      (l) => l.procedureId === procedure.id && l.chargeBasis !== 'rvg',
    )
    const ctx: Parameters<typeof feeFor>[1] = {
      anaesthetist,
      contractPrices: Object.values(state.masters.contractPrices),
      procedureOrdinal: index + 1,
      nonRvgLines,
    }
    if (contract !== undefined) ctx.contract = contract
    if (baseCode !== undefined) ctx.baseCode = baseCode
    if (list.surgeonId !== undefined) ctx.surgeonId = list.surgeonId
    const fee = feeFor(procedure, ctx)
    totals.push(fee.total)
    units.push(fee.billableUnits)
  })
  return { totals, units }
}

function ellisonProcedureId(api: BoundAppStore): string {
  const procedure = proceduresForCard(api.getState(), ELLISON_CARD)[0]
  if (procedure === undefined) throw new Error('Ellison has no procedure')
  return procedure.id
}

describe('the Ellison live-demo flow (mockup demo script, real calculator)', () => {
  it('submit is blocked pre-capture, naming Ellison', () => {
    const api = store()
    const outcome = submitList(api, SOUTER, SOUTER_PM)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      expect(outcome.code).toBe('cardsNotCompleted')
      expect(outcome.details).toEqual([ELLISON_CARD])
    }
  })

  it('Finish now at 17:20 → 13u/$344.50, PM totals 41u/$1,086.50 → complete → submit → read-only', () => {
    const api = store()
    // The presenter advances the demo clock to 17:20 (seeds at 08:00), then
    // taps Finish now — which stamps clockISO, exactly as TimesCard does.
    advanceClockMinutes(api, 9 * 60 + 20)
    const stamped = clockISO(api.getState().clock)
    expect(stamped).toBe('2026-07-21T17:20:00')
    expect(editProcedure(api, SOUTER, ellisonProcedureId(api), { handoverISO: stamped }).ok).toBe(true)

    // The relocated mockup pins (Decisions log 2026-07-23): B7 + T5 + M1 at
    // the SXAP $26.50 = 13 units, $344.50; the PM list's review totals row.
    expect(feeForCard(api, ELLISON_CARD)).toEqual({ totals: [344.5], units: [13] })
    const pmCards = Object.values(api.getState().schedule.cards)
      .filter((c) => c.listId === SOUTER_PM)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((c) => feeForCard(api, c.id))
    expect(pmCards.reduce((s, f) => s + (f.units[0] ?? 0), 0)).toBe(41)
    expect(pmCards.reduce((s, f) => s + (f.totals[0] ?? 0), 0)).toBeCloseTo(1086.5, 2)

    expect(completeCard(api, SOUTER, ELLISON_CARD).ok).toBe(true)
    expect(submitList(api, SOUTER, SOUTER_PM).ok).toBe(true)
    expect(api.getState().schedule.lists[SOUTER_PM]?.state).toBe('SUBMITTED')

    // SUBMITTED strips the anaesthetist's edit rights.
    const refused = editProcedure(api, SOUTER, ellisonProcedureId(api), { intNotes: 'too late' })
    expect(refused.ok).toBe(false)
    if (!refused.ok) expect(refused.code).toBe('listSubmitted')
  })
})

describe('per-anaesthetist rates (Type 1 default path)', () => {
  it('an identical capture prices at $212.00 under Souter and $336.00 under Strand', () => {
    const api = store()
    const masters = api.getState().masters
    const souter = masters.anaesthetists[ANAE.souter]
    const strand = masters.anaesthetists[ANAE.strand]
    if (souter === undefined || strand === undefined) throw new Error('missing anaesthetists')
    expect(souter.unitValue).toBe(26.5)
    expect(strand.unitValue).toBe(42)

    // B6 (20941) + T2 (30 min) + M0 (AS1) = 8 units, no contract → the
    // anaesthetist's OWN unit value applies.
    const procedure: Procedure = {
      id: 'P-TEST',
      cardId: 'C-TEST',
      description: 'Laparoscopic cholecystectomy',
      accRelated: false,
      isAdditional: false,
      selectedModifierCodes: [],
      rvgBaseCode: '20941',
      asaClass: 'AS1',
      anaestheticStartISO: '2026-07-21T09:00:00',
      handoverISO: '2026-07-21T09:30:00',
    }
    const baseCode = masters.rvgCodes['20941']
    if (baseCode === undefined) throw new Error('missing code')

    const souterFee = feeFor(procedure, { anaesthetist: souter, baseCode })
    const strandFee = feeFor(procedure, { anaesthetist: strand, baseCode })
    expect(souterFee.billableUnits).toBe(8)
    expect(souterFee.total).toBe(212)
    expect(strandFee.billableUnits).toBe(8)
    expect(strandFee.total).toBe(336)
  })
})

describe('billedAt disappearance selector (M10 / 3rd review #12)', () => {
  it('a billed list is excluded; a SUBMITTED-unbilled list stays', () => {
    const api = store()
    const morrison = SEED_LIST_IDS.morrisonMon20
    const whitaker = SEED_LIST_IDS.whitakerFri17

    expect(isListBilled(api.getState().schedule.lists[morrison]!)).toBe(false)

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
            [morrison]: { ...s.schedule.lists[morrison]!, billedAtISO: '2026-07-21T09:00:00' },
          },
        },
      }),
    )

    expect(isListBilled(api.getState().schedule.lists[morrison]!)).toBe(true)
    expect(isListBilled(api.getState().schedule.lists[whitaker]!)).toBe(false)
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
    let btm = resolveBtm(procedure, api.getState().masters.rvgCodes[procedure.rvgBaseCode ?? ''])
    expect(btm.time).toEqual({ units: 5, source: 'overridden' })

    // "Use seeded value": clearing the capture re-derives from the stamps
    // (no handover seeded → 0 time units, seeded provenance).
    expect(editProcedure(api, SOUTER, procedureId, { timeUnitsCaptured: undefined }).ok).toBe(true)
    procedure = api.getState().schedule.procedures[procedureId]!
    btm = resolveBtm(procedure, api.getState().masters.rvgCodes[procedure.rvgBaseCode ?? ''])
    expect(btm.time).toEqual({ units: 0, source: 'seeded' })
  })
})
