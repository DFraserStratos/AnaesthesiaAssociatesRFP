/**
 * Catch-up Phase 20 parity (item 1): what `feeParity.test.ts` does not pin.
 * Each seeded Procedure's own billed party and Contract, its starting values
 * and typed fixed fee; and the two seeded prepayment Bookings' pre-invoice
 * builds with their ledger lines and Xero pair (US-09.1.3). The fixture was
 * written from the code before Phase 20 (`__parity__/phase20Capture.ts`) and
 * never changes; this suite is never run with `-u`.
 *
 * Declared differences, exact:
 *  - Procedures that billed at standard rates with no Contract (the retired
 *    Billable Party route) are on No contract · RVG, AA's one Contract that
 *    bills the payer, at the same figures;
 *  - Riley (BK0034) and Nair (BK0038's P0041) are on Dr Souter's prepaid price
 *    list, which is what now requires their prepayment;
 *  - the seven route-less Bookings' exception is `noContract`.
 *  - catch-up Phase 20a: its appended Bookings (AR-35's illustrative wording)
 *    are additions, and Diane Foster's S14 target (forward, uncaptured, never
 *    invoiced) is its one recorded exception, re-seeded on No contract · RVG
 *    with its RVG code cleared.
 *  - catch-up Phase 21 (US-11.2.1, US-11.2.2): Doyle's bariatric primary
 *    (P0029) bills the payer on the Booking, the patient Gareth Mills, as his
 *    price list says; Hana Park (BP0001) is the payer on Grace Park's Booking
 *    under the counterparty kind `payer` (was `billableParty`), same id.
 * Every other billed party, starting value, prepayment build, ledger line and
 * Xero pair holds as written.
 */

import { describe, expect, it } from 'vitest'
import baseline from './__parity__/phase-20-baseline.json'
import { captureBaseline, type Phase20Baseline, type ProcedureParityRow } from './__parity__/phase20Capture'
import { COMPLETION_BOOKING_IDS, REVIEW_FLAG_BOOKING_IDS, PAYER_REVIEW_BOOKING_IDS, SEED_MARKERS, SOURCE_WORDING_BOOKING_IDS } from '../domain/seed'

const before = baseline as Phase20Baseline
/** Catch-up Phase 20a's additions and its one recorded exception (Foster's S14 target), set aside. */
/** Phase 20a's named additions, and Phase 21's payer review List (set aside the same way). */
const ADDED_20A = new Set([...SOURCE_WORDING_BOOKING_IDS, ...PAYER_REVIEW_BOOKING_IDS, ...COMPLETION_BOOKING_IDS, ...REVIEW_FLAG_BOOKING_IDS])
const FOSTER_20A = SEED_MARKERS.integrationS14!.entityId
const captured = captureBaseline()
const now = {
  ...captured,
  procedures: captured.procedures.filter((r) => !ADDED_20A.has(r.bookingId) && r.bookingId !== FOSTER_20A),
}
const beforeRows = before.procedures.filter((r) => r.bookingId !== FOSTER_20A)

const DECLARED_CONTRACT: Record<string, string> = {
  P0036: 'CT-SOUTER-RHINO',
  P0041: 'CT-SOUTER-RHINO-COS',
}

/** Catch-up Phase 21's two on-purpose moves of who is billed, mapped back to the fixture's form. */
function billedBefore21(row: ProcedureParityRow): string {
  if (row.procedureId === 'P0029' && row.billedTo === 'patient:PT0015') return 'surgeon:S-DOYLE'
  if (row.billedTo === 'payer:BP0001') return 'billableParty:BP0001'
  return row.billedTo
}

function asBefore(row: ProcedureParityRow): ProcedureParityRow {
  const was = before.procedures.find((r) => r.procedureId === row.procedureId)
  if (was === undefined) return row
  const out = { ...row, billedTo: billedBefore21(row) }
  if (was.contract === '(none)' && (row.contract === 'CT-NO-CONTRACT' || row.contract === DECLARED_CONTRACT[row.procedureId])) {
    out.contract = '(none)'
  }
  if (was.contract === 'exception:noBillingRoute' && row.contract === 'exception:noContract') {
    out.contract = was.contract
    if (row.billedTo === 'exception:noContract') out.billedTo = was.billedTo
  }
  return out
}

describe('Phase 20 contract parity', () => {
  it('holds every seeded Procedure: billed party, starting values and fixed fee, bar the declared Contract moves', () => {
    expect(now.procedures.length).toBe(beforeRows.length)
    expect(now.procedures.map(asBefore)).toEqual(beforeRows)
    expect(captured.procedures.filter((r) => ADDED_20A.has(r.bookingId))).toHaveLength(ADDED_20A.size)
  })

  it('every billed party is identical, the declared exception rename aside', () => {
    for (const row of now.procedures) {
      const was = before.procedures.find((r) => r.procedureId === row.procedureId)!
      const billedTo = row.billedTo === 'exception:noContract' ? 'exception:noBillingRoute' : billedBefore21(row)
      expect(billedTo, row.procedureId).toBe(was.billedTo)
    }
  })

  it('moves exactly the declared Contracts', () => {
    const moved = now.procedures.filter((r) => asBefore(r).contract !== r.contract).map((r) => r.procedureId)
    for (const id of Object.keys(DECLARED_CONTRACT)) expect(moved).toContain(id)
    for (const row of now.procedures.filter((r) => moved.includes(r.procedureId))) {
      expect(['CT-NO-CONTRACT', 'exception:noContract', DECLARED_CONTRACT[row.procedureId]], row.procedureId).toContain(row.contract)
    }
  })

  it("keeps Riley's split and Nair's full prepayment: invoices, ledger lines and Xero pairs (S4 Beat 1)", () => {
    expect(now.prepayments).toEqual(before.prepayments)
  })

  it("bills Doyle's bariatric primary to the payer on the Booking, at his price list (catch-up Phase 21, US-11.2.1)", () => {
    expect(now.procedures.find((r) => r.procedureId === 'P0029')).toMatchObject({ billedTo: 'patient:PT0015', contract: 'CT-DOYLE-BAR' })
  })
})
