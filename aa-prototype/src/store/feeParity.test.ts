/**
 * Parity fixtures: every seeded fee and counterparty, captured BEFORE each
 * reshape (Phases 18, 19 and 19a) and matched after it.
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

/** A fixture as it must read today: the declared deltas applied. */
function withDeltas<F extends { procedureId: string }>(fixture: { fees: F[]; invoices: InvoiceRow[] }): { fees: F[]; invoices: InvoiceRow[] } {
  return {
    fees: fixture.fees.map((f) => (f.procedureId === HERNIA_FEE.procedureId ? { ...f, ...HERNIA_FEE } : f)),
    invoices: fixture.invoices.map((i) => (i.bookingId === 'BK0028' ? { ...i, result: HERNIA_INVOICES } : i)),
  }
}

/** Today's rows without the named additions. */
function current<F extends { procedureId: string }>(rows: F[]): { fees: F[]; invoices: InvoiceRow[] } {
  const added = addedProcedureIds()
  return {
    fees: rows.filter((f) => !added.has(f.procedureId)),
    invoices: invoices.filter((i) => ADDED_BOOKINGS[i.bookingId] === undefined),
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
    // ...and on Dr Strand's List, whose own rate is $42, so the $26.50 is the Contract's: 7 x $26.50.
    expect(feeOf('P0113')).toMatchObject({ total: 185.5, billableUnits: 7 })
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
    expect(unitRows.find((f) => f.procedureId === 'P0030')).toEqual({ ...before, ...HERNIA_FEE })
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
