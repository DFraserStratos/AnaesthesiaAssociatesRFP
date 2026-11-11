/**
 * Parity fixtures: every seeded fee and counterparty, captured BEFORE each
 * reshape (Phases 18, 19, 19a and 19b) and matched after it.
 *
 * Lives in `src/store` (not `src/domain/billing`) because it builds its
 * contexts exactly as the app does, through the store's selectors, and the
 * domain purity test forbids `src/domain` importing the store.
 *
 * Rules: only the context-building code below may change after the baseline;
 * the fixture files never change, and this suite is never run with `-u`. A
 * later phase that moves a figure on purpose declares it below as an exact
 * difference (`DELTAS`), and a seeded Booking it adds as a named addition
 * (`ADDED_BOOKINGS`); every other row must match its fixture as written.
 */

import { describe, expect, it } from 'vitest'
import phase18Fixture from './__parity__/phase-18-baseline.json'
import phase19Fixture from './__parity__/phase-19-baseline.json'
import phase19aFixture from './__parity__/phase-19a-baseline.json'
import phase19bFixture from './__parity__/phase-19b-baseline.json'
import { MERIVALE_FACE_LIFT_BOOKING_ID, SEED_MARKERS } from '../domain/seed'
import { freshAppState } from './appStore'
import { billingContextForBooking, bookingsForList, prePaidByProcedure, proceduresForBooking } from './selectors'
import { procedureFee } from '../shared/capture/feeContext'
import { buildInvoicesForBooking, type InvoiceBuildContext } from '../domain/billing/invoiceBuild'
import { listHospitalFor } from '../domain/listPairing'
import type { AssignedList } from '../domain/types'

const state = freshAppState()

const assignedLists = Object.values(state.schedule.lists)
  .filter((l): l is AssignedList => l.anaesthetistId !== undefined)
  .sort((a, b) => a.id.localeCompare(b.id))

interface FeeRow {
  procedureId: string
  total: number
  billableUnits: number
  lines: { basis: string; amount: number }[]
}

/** Phase 19's row: the Phase 18 row plus the resolved B, T and M. */
interface UnitsRow extends FeeRow {
  b: number
  t: number
  m: number
}

interface InvoiceRow {
  bookingId: string
  result:
    | { kind: 'invoices'; invoices: { counterparty: string; subtotal: number; total: number }[] }
    | { kind: 'exception'; code: string }
}

const fees: FeeRow[] = []
const unitRows: UnitsRow[] = []
const invoices: InvoiceRow[] = []

for (const list of assignedLists) {
  for (const booking of bookingsForList(state, list.id)) {
    const procedures = proceduresForBooking(state, booking.id)
    procedures.forEach((procedure) => {
      const { fee } = procedureFee({
        procedure,
        list,
        masters: state.masters,
        billingLines: state.schedule.billingLines,
        patientId: booking.patientId,
      })
      const row: FeeRow = {
        procedureId: procedure.id,
        total: fee.total,
        billableUnits: fee.billableUnits,
        lines: fee.lines.map((l) => ({ basis: l.chargeBasis, amount: l.amount })),
      }
      fees.push(row)
      unitRows.push({ ...row, b: fee.btm.base.units, t: fee.btm.time.units, m: fee.btm.modifiers.units })
    })

    const bookingCtx = billingContextForBooking(state, booking)
    if (bookingCtx === undefined) continue
    const prePaid = prePaidByProcedure(state, booking.id)
    const buildCtx: InvoiceBuildContext = {
      ...bookingCtx,
      listDateISO: list.dateISO,
      patientId: booking.patientId,
      ...listHospitalFor(list, state.masters.hospitals),
      ...(Object.keys(prePaid).length > 0 ? { prePaidByProcedure: prePaid } : {}),
    }
    const result = buildInvoicesForBooking(booking, procedures, buildCtx)
    invoices.push({
      bookingId: booking.id,
      result:
        result.kind === 'invoices'
          ? {
              kind: 'invoices',
              invoices: result.invoices.map((inv) => ({
                counterparty: `${inv.counterparty.kind}:${inv.counterparty.id}`,
                subtotal: inv.subtotal,
                total: inv.total,
              })),
            }
          : { kind: 'exception', code: result.code },
    })
  }
}

fees.sort((a, b) => a.procedureId.localeCompare(b.procedureId))
unitRows.sort((a, b) => a.procedureId.localeCompare(b.procedureId))
invoices.sort((a, b) => a.bookingId.localeCompare(b.bookingId))

const feeOf = (procedureId: string) => fees.find((f) => f.procedureId === procedureId)
const invoicesOf = (bookingId: string) => invoices.find((i) => i.bookingId === bookingId)?.result


// ---------------------------------------------------------------------------
// Declared differences (each phase's on-purpose moves, exact)
// ---------------------------------------------------------------------------

/**
 * Catch-up Phase 19a (RV-07, OQ-90): no Contract prices a second procedure,
 * so the bariatric Booking's ordinal row ($950) went. The concurrent hernia
 * (P0030, additional) is on No contract · RVG, priced at RVG time units only
 * (2 units at Dr Fitzgerald's $30.50 = $61) and, AA's Contract billing the
 * payer, invoiced to the patient (Gareth Mills, PT0015) until Phase 21. Doyle's
 * invoice keeps the gastric bypass at $2,800 (+ GST $420).
 */
const HERNIA_FEE = { procedureId: 'P0030', total: 61, billableUnits: 2, lines: [{ basis: 'rvg', amount: 61 }] }
const HERNIA_INVOICES: InvoiceRow['result'] = {
  kind: 'invoices',
  invoices: [
    { counterparty: 'surgeon:S-DOYLE', subtotal: 2800, total: 3220 },
    { counterparty: 'patient:PT0015', subtotal: 61, total: 70.15 },
  ],
}

/**
 * Catch-up Phase 19b: the only reasons a seeded figure moves (RV-22, US-03.3.8).
 * The facts each row was built from are in the 19b fixture, written from the
 * untouched code.
 *   - The ASA seed goes: the old card seeded AS1 0, AS2 1, AS3 3, AS4 4 units;
 *     now AS1 and AS2 claim nothing and AS3 and AS4 claim their code at the
 *     RVG's printed value (AS3 2, AS4 4).
 *   - Age is pre-applied: a patient in a band on the procedure date gains A1
 *     (1) or A2 (2), none on H6b or P2, unless the Procedure already claimed
 *     that code (Ellison's A1, now pre-applied instead).
 * A manual M adjustment (overridden) still wins, so it moves nothing.
 * Plus one named re-code: the generated Spine Booking (P1 included), whose
 * base moves to S3a's.
 */
interface Phase19bFacts {
  procedureId: string
  bookingId: string
  asaClass: 'AS1' | 'AS2' | 'AS3' | 'AS4' | null
  selectedModifierCodes: string[]
  patientDobISO: string | null
  procedureDateISO: string
  rvgCode: string | null
  isAdditional: boolean
  modifierOverridden: boolean
}
const OLD_ASA_SEED = { AS1: 0, AS2: 1, AS3: 3, AS4: 4 } as const
const RVG_ASA_CLAIM = { AS1: 0, AS2: 0, AS3: 2, AS4: 4 } as const
const AGE_UNITS = { A1: 1, A2: 2 } as const

/**
 * The D29 bands worked out here on their own (not through the rule module, so
 * a wrong band in the code cannot move both sides): completed years on the
 * List's date; 0 is A2, 1 is A1, 70 to 79 A1, 80 and over A2.
 */
function independentAgeCode(dobISO: string, onISO: string): 'A1' | 'A2' | undefined {
  const [y1, m1, d1] = dobISO.split('-').map(Number) as [number, number, number]
  const [y2, m2, d2] = onISO.split('-').map(Number) as [number, number, number]
  const years = y2 - y1 - (m2 < m1 || (m2 === m1 && d2 < d1) ? 1 : 0)
  if (years === 0 || years >= 80) return 'A2'
  if (years === 1 || (years >= 70 && years <= 79)) return 'A1'
  return undefined
}

function expectedModifierDelta(f: Phase19bFacts): number {
  if (f.modifierOverridden) return 0
  const asa = f.asaClass === null ? 0 : RVG_ASA_CLAIM[f.asaClass] - OLD_ASA_SEED[f.asaClass]
  // No age modifier on the codes the guide splits by age (H6b, P2), keyed on the
  // fixture's own code from the untouched seed, never the code's flag.
  const ageSplit = f.rvgCode === 'H6b' || f.rvgCode === 'P2'
  let age = 0
  if (f.patientDobISO !== null && !ageSplit) {
    const code = independentAgeCode(f.patientDobISO, f.procedureDateISO)
    if (code !== undefined && !f.selectedModifierCodes.includes(code)) age = AGE_UNITS[code]
  }
  return asa + age
}

const PHASE_19B_FACTS = (phase19bFixture as unknown as { facts: Phase19bFacts[] }).facts
const MODIFIER_DELTA_19B = new Map(PHASE_19B_FACTS.map((f) => [f.procedureId, expectedModifierDelta(f)]))
/** The generated Booking re-coded to a Spine group (S3a): its base moves, nothing billed. */
const SPINE_BOOKING_19B = SEED_MARKERS.includedModifierBooking!.entityId
const SPINE_PROCEDURE_19B = Object.values(state.schedule.procedures).find((p) => p.bookingId === SPINE_BOOKING_19B)!.id
/** Every Procedure and Booking Phase 19b moves (the earlier fixtures compare the rest). */
const MOVED_19B = new Set([...[...MODIFIER_DELTA_19B].filter(([, d]) => d !== 0).map(([id]) => id), SPINE_PROCEDURE_19B])
const MOVED_BOOKINGS_19B = new Set(
  PHASE_19B_FACTS.filter((f) => MOVED_19B.has(f.procedureId)).map((f) => f.bookingId),
)

/** Seeded Bookings a later phase added (named; asserted on their own below). */
const ADDED_BOOKINGS: Record<string, string> = {
  // Catch-up Phase 19a: the unedited Face lift on Merivale's combination Contract.
  [MERIVALE_FACE_LIFT_BOOKING_ID]: "Phase 19a · Merivale's Face lift",
}

function addedProcedureIds(): Set<string> {
  return new Set(
    Object.values(state.schedule.procedures)
      .filter((p) => ADDED_BOOKINGS[p.bookingId] !== undefined)
      .map((p) => p.id),
  )
}

/**
 * A fixture as it must read today: the declared deltas applied, and the rows
 * Phase 19b moves set aside (its own case below proves each of them).
 */
function withDeltas<F extends { procedureId: string }>(fixture: { fees: F[]; invoices: InvoiceRow[] }): { fees: F[]; invoices: InvoiceRow[] } {
  return {
    fees: fixture.fees
      .filter((f) => !MOVED_19B.has(f.procedureId))
      .map((f) => (f.procedureId === HERNIA_FEE.procedureId ? { ...f, ...HERNIA_FEE } : f)),
    invoices: fixture.invoices
      .filter((i) => !MOVED_BOOKINGS_19B.has(i.bookingId))
      .map((i) => (i.bookingId === 'BK0028' ? { ...i, result: HERNIA_INVOICES } : i)),
  }
}

/** Today's rows without the named additions. */
function current<F extends { procedureId: string }>(rows: F[]): { fees: F[]; invoices: InvoiceRow[] } {
  const added = addedProcedureIds()
  return {
    fees: rows.filter((f) => !added.has(f.procedureId) && !MOVED_19B.has(f.procedureId)),
    invoices: invoices.filter((i) => ADDED_BOOKINGS[i.bookingId] === undefined && !MOVED_BOOKINGS_19B.has(i.bookingId)),
  }
}

describe('Phase 18 fee and counterparty parity', () => {
  it('matches the pre-reshape baseline for every seeded procedure and Booking, bar the declared differences', () => {
    expect(fees.length).toBeGreaterThan(100)
    expect(current(fees)).toEqual(withDeltas(phase18Fixture as { fees: FeeRow[]; invoices: InvoiceRow[] }))
  })

  it('pins the named contract figures', () => {
    // SXAP $26.50 per unit: Wiremu Tane, 12 units.
    expect(feeOf('P0006')).toMatchObject({ total: 318, billableUnits: 12 })
    // ...and on Dr Strand's List, whose own rate is $42, so the $26.50 is the Contract's:
    // 8 x $26.50 (7 units until catch-up Phase 19b pre-applied A1 from the patient's age).
    expect(feeOf('P0113')).toMatchObject({ total: 212, billableUnits: 8 })
    // Health NZ $23: Hemi Walker on Dr Whitaker's Fri 17 Jul List bills Christchurch Public.
    const hnz = feeOf('P0017')
    expect(hnz !== undefined && hnz.total / hnz.billableUnits).toBe(23)
    expect(invoicesOf('BK0017')).toMatchObject({ kind: 'invoices', invoices: [{ counterparty: 'hospital:H-CPH' }] })
    // St George's ACC $25.
    const stgAcc = feeOf('P0012')
    expect(stgAcc !== undefined && stgAcc.total / stgAcc.billableUnits).toBe(25)
    // COS ACC $24, billed to the COS organisation.
    const cos = feeOf('P0033')
    expect(cos !== undefined && cos.total / cos.billableUnits).toBe(24)
    expect(invoicesOf('BK0031')).toMatchObject({ kind: 'invoices', invoices: [{ counterparty: 'organisation:O-COS' }] })
    // Doyle's Gastric bypass at its range in force on Tue 14 Jul, $2,800, billed to Doyle (Phase 19a).
    expect(feeOf('P0029')).toMatchObject({ total: 2800, lines: [{ basis: 'fixed', amount: 2800 }] })
    const bariatric = invoicesOf('BK0028')
    expect(bariatric?.kind === 'invoices' && bariatric.invoices[0]?.counterparty).toBe('surgeon:S-DOYLE')
    // Aria rate x time: 3.0 h x $480 = $1,440.
    expect(feeOf('P0031')?.lines).toContainEqual({ basis: 'rateTime', amount: 1440 })
    // nib on the Insurer route.
    expect(invoicesOf('BK0007')).toMatchObject({ kind: 'invoices', invoices: [{ counterparty: 'insurer:I-NIB' }] })
  })
})

/**
 * Phase 19 parity fixture: written from the untouched code BEFORE the RVG group
 * reshape (catch-up Phase 19), with every seeded Procedure's B, T and M beside
 * its fee. The reshape remaps every seeded Procedure to a row with today's base
 * units, so this file never changes either.
 */
describe('Phase 19 base, time and modifier unit parity', () => {
  it('matches the pre-reshape baseline for every seeded procedure and Booking, bar the declared differences', () => {
    expect(unitRows.length).toBeGreaterThan(100)
    expect(current(unitRows)).toEqual(withDeltas(phase19Fixture as { fees: UnitsRow[]; invoices: InvoiceRow[] }))
  })
})

/**
 * Phase 19a parity fixture: written from the untouched code BEFORE price
 * ranges replaced the fixed-price rows (catch-up Phase 19a). Same rows as
 * Phase 19's, so every seeded fee, B, T, M, line and invoice is held, and only
 * the declared differences move.
 */
describe('Phase 19a price range parity', () => {
  const fixture = phase19aFixture as { fees: UnitsRow[]; invoices: InvoiceRow[] }
  const fixtureFee = (id: string) => fixture.fees.find((f) => f.procedureId === id)
  const fixtureInvoices = (id: string) => fixture.invoices.find((i) => i.bookingId === id)?.result

  it('matches the pre-ranges baseline for every seeded procedure and Booking, bar the declared differences', () => {
    expect(unitRows.length).toBeGreaterThan(100)
    expect(current(unitRows)).toEqual(withDeltas(fixture))
  })

  it('moves only the bariatric hernia, by its exact difference', () => {
    const before = fixtureFee('P0030')
    expect(before).toMatchObject({ total: 950, lines: [{ basis: 'fixed', amount: 950 }] })
    // Its M moved again in Phase 19b (AS3 seeded 3, now an AS3 claim at 2); it bills time only, so the fee holds.
    expect(unitRows.find((f) => f.procedureId === 'P0030')).toEqual({ ...before, ...HERNIA_FEE, m: before!.m + MODIFIER_DELTA_19B.get('P0030')! })
    expect(fixtureInvoices('BK0028')).toEqual({ kind: 'invoices', invoices: [{ counterparty: 'surgeon:S-DOYLE', subtotal: 3750, total: 4312.5 }] })
    expect(invoicesOf('BK0028')).toEqual(HERNIA_INVOICES)
  })

  it('holds every scripted S1 to S5 Booking (the seed markers and the Mon 20 Jul Review queue Lists)', () => {
    const scripted = new Set<string>(
      Object.values(SEED_MARKERS)
        .filter((m) => m.entityType === 'booking')
        .map((m) => m.entityId),
    )
    // S2 Beat 4 (Dr Morrison) and S3 Beat 1 (Dr Souter's AM and PM): the Mon 20 Jul Review queue.
    for (const list of assignedLists.filter((l) => l.dateISO === '2026-07-20' && l.state === 'SUBMITTED')) {
      for (const b of bookingsForList(state, list.id)) scripted.add(b.id)
    }
    scripted.delete('BK0028') // the declared difference, asserted above
    scripted.delete(MERIVALE_FACE_LIFT_BOOKING_ID) // a named addition, asserted below
    for (const id of MOVED_BOOKINGS_19B) scripted.delete(id) // Phase 19b's moves, proved in its own case
    expect(scripted.size).toBeGreaterThan(10)
    for (const bookingId of scripted) {
      expect(invoicesOf(bookingId), bookingId).toEqual(fixtureInvoices(bookingId))
      for (const p of proceduresForBooking(state, bookingId)) {
        expect(unitRows.find((f) => f.procedureId === p.id), p.id).toEqual(fixtureFee(p.id))
      }
    }
  })

  it('carries the old model’s matches across (US-05.2.6, US-05.2.5, US-05.2.7, US-05.2.1)', () => {
    // US-05.2.6: the Contract's rate, whatever the anaesthetist's own value.
    expect(feeOf('P0006')).toMatchObject({ total: 318, billableUnits: 12 })
    const hnz = feeOf('P0017')
    expect(hnz !== undefined && hnz.total / hnz.billableUnits).toBe(23)
    // US-05.2.5 and US-05.2.7: the bariatric primary at $2,800 ex GST, GST at the invoice foot.
    expect(feeOf('P0029')?.total).toBe(2800)
    expect(HERNIA_INVOICES.kind === 'invoices' && HERNIA_INVOICES.invoices[0]).toEqual({ counterparty: 'surgeon:S-DOYLE', subtotal: 2800, total: 3220 })
    // US-05.2.1: RVG at the anaesthetist's own unit value. No contract · RVG
    // now prices the hernia: 2 time units x Dr Fitzgerald's own rate.
    const hernia = state.schedule.procedures.P0030!
    expect(hernia.governingContractId).toBe('CT-NO-CONTRACT')
    const fitz = state.masters.anaesthetists[state.schedule.lists[state.schedule.bookings.BK0028!.listId]!.anaesthetistId!]!
    expect(feeOf('P0030')).toMatchObject({ billableUnits: 2, total: Math.round(2 * fitz.unitValue * 100) / 100 })
    // ...and a primary on a plain RVG Contract (the same pricing kind) is held as written.
    const plain = Object.values(state.schedule.procedures).find(
      (p) =>
        !p.isAdditional &&
        !MOVED_19B.has(p.id) &&
        p.governingContractId !== undefined &&
        state.masters.contracts[p.governingContractId]?.pricing.kind === 'rvgAnaesthetistRate' &&
        feeOf(p.id) !== undefined &&
        (feeOf(p.id)?.billableUnits ?? 0) > 0,
    )!
    const plainList = state.schedule.lists[state.schedule.bookings[plain.bookingId]!.listId]!
    const own = state.masters.anaesthetists[plainList.anaesthetistId!]!.unitValue
    const row = feeOf(plain.id)!
    expect(row.total).toBe(Math.round(row.billableUnits * own * 100) / 100)
    expect(unitRows.find((f) => f.procedureId === plain.id)).toEqual(fixtureFee(plain.id))
  })

  it("adds one Booking, named: Merivale's Face lift at its range in force, $3,100 ex GST, to the patient", () => {
    expect(fixtureInvoices(MERIVALE_FACE_LIFT_BOOKING_ID)).toBeUndefined()
    const [proc] = proceduresForBooking(state, MERIVALE_FACE_LIFT_BOOKING_ID)
    expect(proc).toMatchObject({ governingContractId: 'CT-MER-FACELIFT', description: 'Face lift' })
    // The RVG code was filled from the Contract's default, H3; its units are for reference only.
    expect(state.masters.rvgGroups[proc!.rvgGroupId!]?.code).toBe('H3')
    expect(feeOf(proc!.id)).toMatchObject({ total: 3100, lines: [{ basis: 'fixed', amount: 3100 }] })
    expect(invoicesOf(MERIVALE_FACE_LIFT_BOOKING_ID)).toEqual({
      kind: 'invoices',
      invoices: [{ counterparty: 'patient:PT0129', subtotal: 3100, total: 3565 }],
    })
  })
})

/**
 * Phase 19b parity fixture: written from the untouched code BEFORE modifiers
 * were rebuilt (catch-up Phase 19b), with the facts each row was built from.
 * Figures move for two reasons only (the RVG's real ASA values replacing the
 * ASA seed, and the pre-applied age modifier), plus the named Spine re-code;
 * this proves every moved figure is one of those and nothing else moved.
 */
describe('Phase 19b modifier parity', () => {
  const fixture = phase19bFixture as unknown as { fees: UnitsRow[]; invoices: InvoiceRow[]; facts: Phase19bFacts[] }
  const before = (id: string) => fixture.fees.find((f) => f.procedureId === id)!
  const now = (id: string) => unitRows.find((f) => f.procedureId === id)!

  it('the fixture is the pre-19b state: it equals the 19a fixture with its declared differences', () => {
    const added = addedProcedureIds()
    const asWritten = {
      fees: fixture.fees.filter((f) => !added.has(f.procedureId)),
      invoices: fixture.invoices.filter((i) => ADDED_BOOKINGS[i.bookingId] === undefined),
    }
    const p19a = phase19aFixture as { fees: UnitsRow[]; invoices: InvoiceRow[] }
    expect(asWritten).toEqual({
      fees: p19a.fees.map((f) => (f.procedureId === HERNIA_FEE.procedureId ? { ...f, ...HERNIA_FEE } : f)),
      invoices: p19a.invoices.map((i) => (i.bookingId === 'BK0028' ? { ...i, result: HERNIA_INVOICES } : i)),
    })
  })

  it('every row Phase 19b does not move is byte-identical', () => {
    for (const row of unitRows.filter((r) => !MOVED_19B.has(r.procedureId))) expect(row, row.procedureId).toEqual(before(row.procedureId))
    for (const inv of invoices.filter((i) => !MOVED_BOOKINGS_19B.has(i.bookingId))) {
      expect(inv, inv.bookingId).toEqual(fixture.invoices.find((i) => i.bookingId === inv.bookingId))
    }
  })

  it('every moved M is the baseline M plus the ASA and age deltas alone; B and T are identical; money follows the units', () => {
    // 78 Procedures move M, plus the Spine re-code (its base only).
    expect(MOVED_19B.size).toBe(79)
    for (const id of MOVED_19B) {
      if (id === SPINE_PROCEDURE_19B) continue
      const was = before(id)
      const is = now(id)
      const facts = fixture.facts.find((f) => f.procedureId === id)!
      const delta = MODIFIER_DELTA_19B.get(id)!
      expect([is.b, is.t], id).toEqual([was.b, was.t])
      expect(is.m, id).toBe(was.m + delta)
      const unitDelta = facts.isAdditional ? 0 : delta
      expect(is.billableUnits, id).toBe(was.billableUnits + unitDelta)
      // Lines: non-RVG lines unchanged; the RVG line moves by the unit change at its own rate.
      expect(is.lines.filter((l) => l.basis !== 'rvg'), id).toEqual(was.lines.filter((l) => l.basis !== 'rvg'))
      const wasRvg = was.lines.find((l) => l.basis === 'rvg')
      const isRvg = is.lines.find((l) => l.basis === 'rvg')
      if (wasRvg === undefined) {
        expect(isRvg, id).toBeUndefined()
        expect(is.total, id).toBe(was.total)
        continue
      }
      const rate = wasRvg.amount / was.billableUnits
      const expected = Math.round((wasRvg.amount + unitDelta * rate) * 100) / 100
      expect(isRvg?.amount, id).toBeCloseTo(expected, 2)
      expect(is.total, id).toBeCloseTo(was.total + (isRvg!.amount - wasRvg.amount), 2)
    }
  })

  it('the Spine re-code moves only its base, to S3a, with P1 included at 0; it is uncaptured, so T is 0', () => {
    const was = before(SPINE_PROCEDURE_19B)
    const is = now(SPINE_PROCEDURE_19B)
    const s3a = Object.values(state.masters.rvgGroups).find((g) => g.code === 'S3a')!
    expect(MODIFIER_DELTA_19B.get(SPINE_PROCEDURE_19B)).toBe(0)
    expect([is.b, is.t, is.m]).toEqual([s3a.baseUnits, 0, was.m])
    expect(was.t).toBe(0)
    // Its estimate moves with the base (7 to 10 units at nib's rate); it is uncaptured and never billed.
    expect(is).toMatchObject({ total: 265, billableUnits: 10, lines: [{ basis: 'rvg', amount: 265 }] })
    expect(invoicesOf(SPINE_BOOKING_19B)).toEqual({ kind: 'invoices', invoices: [{ counterparty: 'insurer:I-NIB', subtotal: 265, total: 304.75 }] })
  })

  it('every invoice that moved contains a moved Procedure, and only its counterparties carry it', () => {
    for (const inv of invoices) {
      const was = fixture.invoices.find((i) => i.bookingId === inv.bookingId)
      if (JSON.stringify(inv) === JSON.stringify(was)) continue
      expect(MOVED_BOOKINGS_19B.has(inv.bookingId), inv.bookingId).toBe(true)
      if (inv.result.kind === 'invoices' && was?.result.kind === 'invoices') {
        expect(inv.result.invoices.map((x) => x.counterparty), inv.bookingId).toEqual(was.result.invoices.map((x) => x.counterparty))
        // The amounts move by exactly the Booking's fee changes, with GST at the same ratio.
        const feeDelta = PHASE_19B_FACTS.filter((f) => f.bookingId === inv.bookingId).reduce(
          (sum, f) => sum + (now(f.procedureId).total - before(f.procedureId).total),
          0,
        )
        const subtotalDelta = inv.result.invoices.reduce((s, x) => s + x.subtotal, 0) - was.result.invoices.reduce((s, x) => s + x.subtotal, 0)
        expect(subtotalDelta, inv.bookingId).toBeCloseTo(feeDelta, 2)
        inv.result.invoices.forEach((x, i) => {
          const w = (was.result as { invoices: { subtotal: number; total: number }[] }).invoices[i]!
          if (w.subtotal > 0) expect(x.total / x.subtotal, inv.bookingId).toBeCloseTo(w.total / w.subtotal, 3)
        })
      }
    }
  })

  it('holds the pinned figures: Ellison $344.50 after capture (btmCapture.test.ts) and her pre-capture 8 units, $212; the Tue 21 PM List unmoved', () => {
    expect(feeOf('P0009')).toMatchObject({ total: 212, billableUnits: 8 })
    for (const id of ['P0006', 'P0007', 'P0008', 'P0009']) expect(MOVED_19B.has(id), id).toBe(false)
  })
})
