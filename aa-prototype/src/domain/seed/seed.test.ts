/**
 * Seed tests — determinism, the canvas invariant, design-day fidelity (the
 * PM card fees to the cent, Ellison in her pre-capture state), the ~80%
 * permanent-list share of surgeon assignments, marker resolution and the
 * staged scenario states.
 */

import { describe, expect, it } from 'vitest'
import { buildSeed, listIdForSlot, ANAE, HOSP, SURG, SEED_LIST_IDS, SEED_MARKERS } from './index'
import { ANAESTHETISTS } from './cast'
import { PERMANENT_LISTS } from './permanentLists'
import { DEMO_TODAY, enumerateDatesISO, horizonFor } from '../clock'
import { validateNhi } from '../nhi'
import { lookupNhi } from '../nzhis'
import { feeFor } from '../billing/fee'
import { validateCardForBilling, type CardBillingContext } from '../billing/validateCardForBilling'
import type { Card, List, Procedure } from '../types'
import type { SeedState } from './index'
import { parseISO } from 'date-fns'

const seed = buildSeed()

function proceduresForCard(state: SeedState, cardId: string): Procedure[] {
  return Object.values(state.schedule.procedures)
    .filter((p) => p.cardId === cardId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

function billingContextFor(state: SeedState, card: Card): CardBillingContext {
  const list = state.schedule.lists[card.listId]
  if (list === undefined) throw new Error(`card ${card.id} has no list`)
  const anaesthetist = state.masters.anaesthetists[list.anaesthetistId]
  if (anaesthetist === undefined) throw new Error(`list ${list.id} has no anaesthetist`)
  const ctx: CardBillingContext = {
    anaesthetist,
    rvgCodes: state.masters.rvgCodes,
    contracts: state.masters.contracts,
    contractPrices: Object.values(state.masters.contractPrices),
    insurers: state.masters.insurers,
    billableParties: state.masters.billableParties,
    billingLines: Object.values(state.schedule.billingLines),
  }
  if (list.surgeonId !== undefined) ctx.surgeonId = list.surgeonId
  return ctx
}

describe('seed determinism', () => {
  it('two builds are deep-equal', () => {
    expect(buildSeed()).toEqual(seed)
  })
})

describe('the canvas', () => {
  const horizon = horizonFor(DEMO_TODAY)
  const dates = enumerateDatesISO(horizon.startISO, horizon.endISO)
  const lists = Object.values(seed.schedule.lists)

  it('holds exactly 2 Lists per anaesthetist per day across the whole horizon', () => {
    const byKey = new Map<string, number>()
    for (const list of lists) {
      const key = `${list.anaesthetistId}|${list.dateISO}`
      byKey.set(key, (byKey.get(key) ?? 0) + 1)
    }
    expect(lists.length).toBe(dates.length * ANAESTHETISTS.length * 2)
    for (const date of dates) {
      for (const a of ANAESTHETISTS) {
        expect(byKey.get(`${a.registrationNumber}|${date}`)).toBe(2)
      }
    }
  })

  it('uses every status colour somewhere in the horizon', () => {
    const used = new Set(lists.map((l) => l.statusKey))
    for (const key of ['private', 'public', 'preop', 'holiday', 'unavailable', 'free']) {
      expect(used.has(key as List['statusKey']), `status ${key} in use`).toBe(true)
    }
  })

  it('derives roughly 80% of surgeon-assigned Lists from Permanent Lists (0.7 to 0.9)', () => {
    const templates = new Set(
      PERMANENT_LISTS.filter((t) => t.surgeonId !== null).map(
        (t) => `${t.anaesthetistId}|${t.dayOfWeek}|${t.session}|${t.surgeonId}`,
      ),
    )
    const surgeonLists = lists.filter((l) => l.surgeonId !== undefined)
    const fromTemplate = surgeonLists.filter((l) =>
      templates.has(`${l.anaesthetistId}|${parseISO(l.dateISO).getDay()}|${l.session}|${l.surgeonId}`),
    )
    const share = fromTemplate.length / surgeonLists.length
    expect(surgeonLists.length).toBeGreaterThan(500)
    expect(share).toBeGreaterThanOrEqual(0.7)
    expect(share).toBeLessThanOrEqual(0.9)
  })

  it('paints the design day: Souter STG/Hale AM and SX/Patel PM, Rutherford all day Forte/Okafor', () => {
    const souterAm = seed.schedule.lists[SEED_LIST_IDS.souterAm21]
    const souterPm = seed.schedule.lists[SEED_LIST_IDS.souterPm21]
    const ruthAm = seed.schedule.lists[SEED_LIST_IDS.rutherfordAm21]
    const ruthPm = seed.schedule.lists[SEED_LIST_IDS.rutherfordPm21]
    expect(souterAm?.statusKey).toBe('private')
    expect(souterAm?.hospitalId).toBe('H-STG')
    expect(souterAm?.surgeonId).toBe('S-HALE')
    expect(souterPm?.hospitalId).toBe('H-SX')
    expect(souterPm?.surgeonId).toBe('S-PATEL')
    expect(ruthAm?.hospitalId).toBe('H-FORTE')
    expect(ruthAm?.surgeonId).toBe('S-OKAFOR')
    expect(ruthPm?.hospitalId).toBe('H-FORTE')
    expect(ruthPm?.surgeonId).toBe('S-OKAFOR')

    // Fitzgerald's template-derived design days (her Permanent Lists were the
    // one gap that left these rows Free and contradicting the mockups).
    const fitzTueAm = seed.schedule.lists[listIdForSlot(ANAE.fitzgerald, '2026-07-21', 'AM')]
    const fitzThuAm = seed.schedule.lists[listIdForSlot(ANAE.fitzgerald, '2026-07-23', 'AM')]
    const fitzThuPm = seed.schedule.lists[listIdForSlot(ANAE.fitzgerald, '2026-07-23', 'PM')]
    expect(fitzTueAm?.statusKey).toBe('private')
    expect(fitzTueAm?.hospitalId).toBe(HOSP.sx)
    expect(fitzTueAm?.surgeonId).toBe(SURG.doyle)
    expect(fitzThuAm?.hospitalId).toBe(HOSP.sx)
    expect(fitzThuAm?.surgeonId).toBe(SURG.patel)
    expect(fitzThuPm?.statusKey).toBe('preop')
  })

  it('flags booked Lists on hospital holidays (conflict, never a restatus)', () => {
    const conflicted = Object.values(seed.schedule.lists).filter(
      (l) => l.conflicts.some((c) => c.kind === 'holiday') && (l.dateISO === '2026-10-26' || l.dateISO === '2026-11-13'),
    )
    expect(conflicted.length).toBeGreaterThan(0)
    for (const list of conflicted) {
      expect(list.hospitalId).toBeDefined()
      expect(['private', 'public']).toContain(list.statusKey)
    }
  })
})

describe('patients & NHIs', () => {
  const patients = Object.values(seed.masters.patients)

  it('seeds ~150 patients, all ethnicity-coded from the demo subset', () => {
    expect(patients.length).toBeGreaterThanOrEqual(145)
    expect(patients.length).toBeLessThanOrEqual(155)
    for (const p of patients) {
      expect(p.ethnicityCode, `${p.hiddenInternalId} has ethnicity`).toBeDefined()
    }
  })

  it('every seeded NHI validates; both formats are present', () => {
    const formats = new Set<string>()
    for (const p of patients) {
      if (p.nhi === undefined) continue
      const verdict = validateNhi(p.nhi)
      expect(verdict.valid, `${p.name} ${p.nhi}: ${verdict.reason ?? ''}`).toBe(true)
      if (verdict.format !== null) formats.add(verdict.format)
    }
    expect(formats).toEqual(new Set(['current', 'new']))
  })

  it('includes the 5 canned lookupNhi patients, matching the Hub data', () => {
    for (const nhi of ['CQY9304', 'WQS3635', 'JKL1188', 'MYY54SL', 'RUE29KR']) {
      const hit = lookupNhi(nhi)
      expect(hit.found).toBe(true)
      const patient = patients.find((p) => p.nhi === nhi)
      expect(patient, `patient ${nhi} seeded`).toBeDefined()
      if (hit.found && patient !== undefined) {
        expect(patient.name).toBe(hit.name)
        expect(patient.dobISO).toBe(hit.dobISO)
      }
    }
  })

  it('seeds exactly one provisional no-NHI patient', () => {
    const provisional = patients.filter((p) => p.nhi === undefined)
    expect(provisional.length).toBe(1)
    expect(provisional[0]?.name).toBe('Noah Prescott')
  })
})

describe('design-day fees (the mockup figures, from the real calculator)', () => {
  const cases: Array<{ marker: string; total: number; units: number }> = [
    { marker: 'twoFunderCard', total: 212, units: 8 },
  ]

  function feeForCard(cardId: string): { totals: number[]; unitSums: number[] } {
    const card = seed.schedule.cards[cardId]
    if (card === undefined) throw new Error(`missing card ${cardId}`)
    const list = seed.schedule.lists[card.listId]
    const anaesthetist = list !== undefined ? seed.masters.anaesthetists[list.anaesthetistId] : undefined
    if (list === undefined || anaesthetist === undefined) throw new Error('missing context')
    const procedures = proceduresForCard(seed, cardId)
    const totals: number[] = []
    const unitSums: number[] = []
    procedures.forEach((procedure, index) => {
      const contract =
        procedure.governingContractId !== undefined
          ? seed.masters.contracts[procedure.governingContractId]
          : undefined
      const baseCode =
        procedure.rvgBaseCode !== undefined ? seed.masters.rvgCodes[procedure.rvgBaseCode] : undefined
      const nonRvgLines = Object.values(seed.schedule.billingLines).filter(
        (l) => l.procedureId === procedure.id && l.chargeBasis !== 'rvg',
      )
      const ctx: Parameters<typeof feeFor>[1] = {
        anaesthetist,
        contractPrices: Object.values(seed.masters.contractPrices),
        procedureOrdinal: index + 1,
        nonRvgLines,
      }
      if (contract !== undefined) ctx.contract = contract
      if (baseCode !== undefined) ctx.baseCode = baseCode
      if (list.surgeonId !== undefined) ctx.surgeonId = list.surgeonId
      const fee = feeFor(procedure, ctx)
      totals.push(fee.total)
      unitSums.push(fee.billableUnits)
    })
    return { totals, unitSums }
  }

  it('Tane: B6 T6 = 12 units, $318.00; Ellison pre-capture 8 units, $212.00', () => {
    const marker = SEED_MARKERS['designDayPmList']
    expect(marker).toBeDefined()
    const cards = Object.values(seed.schedule.cards)
      .filter((c) => c.listId === SEED_LIST_IDS.souterPm21)
      .sort((a, b) => a.id.localeCompare(b.id))
    expect(cards.length).toBe(4)
    const [tane, marsh, chen, ellison] = cards
    expect(tane && feeForCard(tane.id)).toEqual({ totals: [318], unitSums: [12] })
    expect(marsh && feeForCard(marsh.id)).toEqual({ totals: [185.5], unitSums: [7] })
    expect(chen && feeForCard(chen.id)).toEqual({ totals: [238.5], unitSums: [9] })
    // Ellison seeds PRE-capture (no handover — the live Finish-now demo card):
    // B7 + T0 + M1 (A1 + AS1) = 8 units at the SXAP $26.50. The post-capture
    // $344.50/13u and 41u/$1,086.50 mockup pins live in btmCapture.test.ts,
    // after a simulated Finish-now at 17:20 (Decisions log 2026-07-23).
    expect(ellison && feeForCard(ellison.id)).toEqual({ totals: [212], unitSums: [8] })
    const all = cards.map((c) => feeForCard(c.id))
    expect(all.reduce((s, f) => s + (f.unitSums[0] ?? 0), 0)).toBe(36)
    expect(all.reduce((s, f) => s + (f.totals[0] ?? 0), 0)).toBeCloseTo(954, 2)
  })

  it('bariatric Type 3: $2,800 first procedure, $950 by the second-procedure ordinal rule', () => {
    const marker = SEED_MARKERS['bariatricType3Card']
    expect(marker).toBeDefined()
    if (marker === undefined) return
    expect(feeForCard(marker.entityId).totals).toEqual([2800, 950])
  })

  it('rate x time: 3 hours at $480 = $1,440', () => {
    const marker = SEED_MARKERS['rateTimeCard']
    expect(marker).toBeDefined()
    if (marker === undefined) return
    expect(feeForCard(marker.entityId).totals).toEqual([1440])
  })

  it('spot table entries hold', () => {
    // Keeps the table shape honest even though the named tests above cover it.
    for (const c of cases) {
      const marker = SEED_MARKERS[c.marker]
      expect(marker).toBeDefined()
      if (marker === undefined) continue
      const fee = feeForCard(marker.entityId)
      expect(fee.totals[0]).toBeCloseTo(c.total, 2)
      expect(fee.unitSums[0]).toBe(c.units)
    }
  })
})

describe('scenario states', () => {
  it('every SEED_MARKER resolves to a live entity', () => {
    for (const [key, marker] of Object.entries(SEED_MARKERS)) {
      const pool =
        marker.entityType === 'list'
          ? seed.schedule.lists
          : marker.entityType === 'card'
            ? seed.schedule.cards
            : marker.entityType === 'procedure'
              ? seed.schedule.procedures
              : marker.entityType === 'patient'
                ? seed.masters.patients
                : seed.masters.contracts
      expect(marker.entityId, `${key} has an id`).not.toBe('')
      expect(
        (pool as Record<string, unknown>)[marker.entityId],
        `${key} -> ${marker.entityId} exists`,
      ).toBeDefined()
    }
  })

  it('the two-funder card passes conservation via validateCardForBilling', () => {
    const marker = SEED_MARKERS['twoFunderCard']
    if (marker === undefined) throw new Error('marker missing')
    const card = seed.schedule.cards[marker.entityId]
    if (card === undefined) throw new Error('card missing')
    const failures = validateCardForBilling(card, proceduresForCard(seed, card.id), billingContextFor(seed, card))
    expect(failures).toEqual([])
    const lines = Object.values(seed.schedule.billingLines).filter(
      (l) => proceduresForCard(seed, card.id).some((p) => p.id === l.procedureId),
    )
    expect(lines.some((l) => l.funderOverride !== undefined)).toBe(true)
    expect(lines.length).toBe(2)
  })

  it("both SUBMITTED lists' non-cancelled cards are completed and valid", () => {
    for (const listId of [SEED_LIST_IDS.morrisonMon20, SEED_LIST_IDS.whitakerFri17]) {
      const list = seed.schedule.lists[listId]
      expect(list?.state).toBe('SUBMITTED')
      const cards = Object.values(seed.schedule.cards).filter((c) => c.listId === listId)
      expect(cards.length).toBeGreaterThanOrEqual(5)
      for (const card of cards) {
        if (card.cancellation !== undefined) continue
        expect(card.completed, `${card.id} completed`).toBe(true)
        const failures = validateCardForBilling(card, proceduresForCard(seed, card.id), billingContextFor(seed, card))
        expect(failures, `${card.id} valid`).toEqual([])
      }
    }
  })

  it('the cancelled card sits on a SUBMITTED list with its cancel audited', () => {
    const marker = SEED_MARKERS['cancelledCard']
    if (marker === undefined) throw new Error('marker missing')
    const card = seed.schedule.cards[marker.entityId]
    expect(card?.cancellation?.reason).toContain('postponed')
    const list = card !== undefined ? seed.schedule.lists[card.listId] : undefined
    expect(list?.state).toBe('SUBMITTED')
    expect(seed.audit.some((a) => a.entityId === marker.entityId && a.action === 'card.cancel')).toBe(true)
  })

  it('exactly the two marked hospital-route procedures are missing billing references', () => {
    const missing = Object.values(seed.schedule.procedures).filter(
      (p) => p.billingRoute === 'hospital' && p.billingReference === undefined,
    )
    const expected = [
      SEED_MARKERS['missingBillingRef1']?.entityId,
      SEED_MARKERS['missingBillingRef2']?.entityId,
    ]
    expect(missing.map((p) => p.id).sort()).toEqual([...expected].sort())
  })

  it('seeds the staged submit audit entries', () => {
    const submits = seed.audit.filter((a) => a.action === 'list.submit')
    expect(submits.map((s) => s.entityId).sort()).toEqual(
      [SEED_LIST_IDS.morrisonMon20, SEED_LIST_IDS.whitakerFri17].sort(),
    )
  })
})
