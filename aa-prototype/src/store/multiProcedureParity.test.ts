/**
 * Catch-up Phase 23 parity (work item 1): every seeded fee, invoice, prepayment
 * build and BCTI count against `__parity__/phase-23-baseline.json`, written from
 * the code before Phase 23 made pricing Booking-level. The fixture never changes
 * and this suite is never run with `-u`. The only on-purpose differences:
 *   - the new three-procedure Booking (added, `MULTI_PROCEDURE_IDS`);
 *   - each RVG-priced additional Procedure records base 0 and M as its share
 *     (0: every existing Booking's modifiers total 4 or fewer), where it used to
 *     record its own group's base and its own modifiers, uncharged.
 * Money, charged units, invoice lines and BCTI counts do not move.
 */

import { describe, expect, it } from 'vitest'
import baselineJson from './__parity__/phase-23-baseline.json'
import { capturePhase23, type FeeRow23, type Phase23Baseline } from './__parity__/phase23Capture'
import { createAppStore, freshAppState } from './appStore'
import { authoriseList } from './lifecycle'
import { handoffListCases, runBillingForList } from './billingRun'
import { bctiRecords } from './selectors'
import { MULTI_PROCEDURE_IDS, SEED_MARKERS } from '../domain/seed'

const baseline = baselineJson as unknown as Phase23Baseline
const now = capturePhase23(freshAppState())
const added = new Set([MULTI_PROCEDURE_IDS.booking])
const addedProcedures = new Set(MULTI_PROCEDURE_IDS.procedures)

/** The declared difference: an additional RVG-priced Procedure's recorded B and M, as they were. */
const RECORDED_BEFORE: Record<string, { b: number; m: number }> = {
  P0023: { b: 4, m: 0 }, // Holt's umbilical hernia (S3)
  P0030: { b: 4, m: 2 }, // the bariatric hernia (its AS3 duplicated the primary's)
  P0186: { b: 4, m: 0 },
  P0188: { b: 3, m: 2 }, // 22a's second Procedure: its own A2 age modifier, never charged
}

function asBefore(row: FeeRow23): FeeRow23 {
  const before = RECORDED_BEFORE[row.procedureId]
  return before !== undefined && row.b === 0 && row.m === 0 ? { ...row, ...before } : row
}

describe('Phase 23 multi-procedure parity', () => {
  it('every seeded fee is as before, bar the declared recorded B and M on additional Procedures', () => {
    expect(now.fees.filter((r) => !addedProcedures.has(r.procedureId)).map(asBefore)).toEqual(baseline.fees)
  })

  it('declares its difference exactly: the four additional Procedures record base 0 and M 0, their charged units and money unmoved', () => {
    for (const id of Object.keys(RECORDED_BEFORE)) {
      const row = now.fees.find((r) => r.procedureId === id)!
      const before = baseline.fees.find((r) => r.procedureId === id)!
      expect(row, id).toMatchObject({ b: 0, m: 0, total: before.total, billableUnits: before.billableUnits })
    }
  })

  it('every seeded invoice and prepayment build is as before: grouping, totals, line amounts, units and wording', () => {
    expect(now.bookings.filter((r) => !added.has(r.bookingId))).toEqual(baseline.bookings)
  })

  it("the BCTI count per anaesthetist and month (16's bctisFor) is unchanged", () => {
    expect(now.bctis).toEqual(baseline.bctis)
  })

  it("S3's Holt invoice holds: one invoice to St George's at its baseline figure, the additional line T 2 at $53", () => {
    const holt = SEED_MARKERS['splitBillingBooking']!.entityId
    const row = now.bookings.find((r) => r.bookingId === holt)!
    expect(row).toEqual(baseline.bookings.find((r) => r.bookingId === holt))
    expect(row.result.kind === 'invoices' && row.result.invoices).toHaveLength(1)
    expect(now.fees.find((r) => r.procedureId === 'P0023')).toMatchObject({ total: 53, billableUnits: 2 })
  })

  it('the bariatric Booking is the mixed Booking: the primary $2,800 on its fixed price, the additional on T 2 alone, $61, no base billed', () => {
    expect(now.fees.find((r) => r.procedureId === 'P0029')).toMatchObject({ total: 2800, lines: [{ basis: 'fixed', amount: 2800 }] })
    expect(now.fees.find((r) => r.procedureId === 'P0030')).toMatchObject({ total: 61, billableUnits: 2, b: 0 })
  })
})

describe('Phase 23 census of multi-procedure Bookings (FT-03.2 and US-05.3.5 carried across)', () => {
  it('lists exactly the seeded multi-procedure Bookings, each with one primary listed first', () => {
    expect(now.census.map((c) => c.bookingId)).toEqual([...baseline.census.map((c) => c.bookingId), MULTI_PROCEDURE_IDS.booking])
    const state = freshAppState()
    for (const row of now.census) {
      const procs = Object.values(state.schedule.procedures).filter((p) => p.bookingId === row.bookingId)
      expect(procs.filter((p) => p.isPrimary), row.bookingId).toHaveLength(1)
      expect(procs.find((p) => p.isPrimary)?.id, row.bookingId).toBe(row.procedures[0]!.procedureId)
    }
  })

  it("modifiers are one set per Booking, on the primary (19b's claims moved off additional Procedures)", () => {
    for (const row of now.census) {
      for (const p of row.procedures.slice(1)) expect(p.modifierClaims, `${row.bookingId} ${p.procedureId}`).toEqual([])
    }
  })

  it("each Procedure's units and amount are on its own invoice line (US-05.3.5)", () => {
    for (const row of now.census) {
      const built = now.bookings.find((b) => b.bookingId === row.bookingId)!.result
      if (built.kind !== 'invoices') continue
      for (const p of row.procedures) {
        const fee = now.fees.find((f) => f.procedureId === p.procedureId)!
        const lines = built.invoices.flatMap((i) => i.lines).filter((l) => l.procedureId === p.procedureId && l.kind === 'fee')
        if (lines.length === 1) expect(lines[0]!.amount, p.procedureId).toBe(fee.lines[0]!.amount)
      }
    }
  })

  it('the three-procedure Booking: one invoice to the patient, primary first; 15, 4 and 5 units at $26.50; $636 ex GST', () => {
    const built = now.bookings.find((b) => b.bookingId === MULTI_PROCEDURE_IDS.booking)!
    expect(built.prepayment).toBeUndefined()
    expect(built.result.kind).toBe('invoices')
    if (built.result.kind !== 'invoices') return
    expect(built.result.invoices).toHaveLength(1)
    const [invoice] = built.result.invoices
    expect(invoice!.counterparty.startsWith('patient:')).toBe(true)
    expect(invoice!.lines.map((l) => [l.procedureId, l.units, l.amount])).toEqual([
      [MULTI_PROCEDURE_IDS.procedures[0], 15, 397.5], // B 6 + T 6 + M 3
      [MULTI_PROCEDURE_IDS.procedures[1], 4, 106], // T 2 + M 2
      [MULTI_PROCEDURE_IDS.procedures[2], 5, 132.5], // T 3 + M 2
    ])
    expect(invoice!.subtotal).toBe(636)
  })
  it('authorising its List raises one receivable and one BCTI for it (grouping by payer unchanged)', () => {
    const api = createAppStore()
    const booking = api.getState().schedule.bookings[MULTI_PROCEDURE_IDS.booking]!
    const before = bctiRecords(api.getState()).length
    expect(authoriseList(api, { who: 'Kirsty W.', role: 'office', source: 'office' }, booking.listId).ok).toBe(true)
    expect(runBillingForList(api, booking.listId).ok).toBe(true)
    handoffListCases(api, booking.listId)
    const invoices = Object.values(api.getState().billing.invoices).filter((i) => i.bookingId === booking.id && i.kind === 'standard')
    expect(invoices).toHaveLength(1)
    expect(bctiRecords(api.getState()).length - before).toBe(1)
  })
})
