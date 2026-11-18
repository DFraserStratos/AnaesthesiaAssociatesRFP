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
 *    (P0029) bills the Procedure's payer, the patient Gareth Mills, as his
 *    price list says; Hana Park (BP0001) is the payer on Grace Park's Booking
 *    under the counterparty kind `payer` (was `billableParty`), same id.
 *  - catch-up Phase 22 (US-08.2.3): Alan Prentice's fee-split Procedure
 *    (P0026, the `feeSplitBooking` marker) is on No contract · RVG (was
 *    St George's CT-STG-D1), so its Contract bills the Procedure's payer,
 *    Alan Prentice; nib's share is a split on the Booking, not a billing line.
 *  - catch-up Phase 27 (`__parity__/phase27Declared.ts`): Nair's rhinoplasty
 *    (P0041) is on Dr Souter's Rhinoplasty Contract (was CT-SOUTER-RHINO-COS);
 *    Riley's and Nair's prepayments are each the rhinoplasty's $1,200 in full
 *    ($1,380 with GST), Nair's payable authorised and held on the AA Holding
 *    account, not disbursed.
 * Every other billed party, starting value, prepayment build, ledger line and
 * Xero pair holds as written.
 */

import { describe, expect, it } from 'vitest'
import { PHASE_24_ARIA_PROCEDURES } from './__parity__/phase24Declared'
import { contractBefore27, PHASE_27_NAIR_CONTRACT, PHASE_27_NAIR_PREPAID_PROCEDURE, PHASE_27_PREPAYMENT_ROWS_20, PHASE_27_REASON } from './__parity__/phase27Declared'
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
  // Catch-up Phase 27's declared Contract move (Nair's rhinoplasty), mapped back to Phase 20's form (`__parity__/phase27Declared.ts`).
  procedures: captured.procedures
    .filter((r) => !ADDED_20A.has(r.bookingId) && r.bookingId !== FOSTER_20A)
    .map((r) => ({ ...r, contract: contractBefore27(r.procedureId, r.contract) })),
}
const beforeRows = before.procedures.filter((r) => r.bookingId !== FOSTER_20A)

const DECLARED_CONTRACT: Record<string, string> = {
  P0036: 'CT-SOUTER-RHINO',
  P0041: 'CT-SOUTER-RHINO-COS',
}

/** Catch-up Phase 22's one move: Prentice's fee-split Procedure, on No contract · RVG, billing the payer. */
const PRENTICE_22 = { procedureId: 'P0026', billedTo: 'patient:PT0011', contract: 'CT-NO-CONTRACT' }
const PRENTICE_BEFORE_22 = { billedTo: 'hospital:H-STG', contract: 'CT-STG-D1' }
const isPrentice22 = (row: ProcedureParityRow) =>
  row.procedureId === PRENTICE_22.procedureId && row.billedTo === PRENTICE_22.billedTo && row.contract === PRENTICE_22.contract

/** Catch-up Phase 21's two on-purpose moves of who is billed (and Phase 22's one), mapped back to the fixture's form. */
function billedBefore21(row: ProcedureParityRow): string {
  if (isPrentice22(row)) return PRENTICE_BEFORE_22.billedTo
  if (row.procedureId === 'P0029' && row.billedTo === 'patient:PT0015') return 'surgeon:S-DOYLE'
  if (row.billedTo === 'payer:BP0001') return 'billableParty:BP0001'
  return row.billedTo
}

function asBefore(row: ProcedureParityRow): ProcedureParityRow {
  const was = before.procedures.find((r) => r.procedureId === row.procedureId)
  if (was === undefined) return row
  const out = { ...row, billedTo: billedBefore21(row) }
  if (isPrentice22(row)) out.contract = PRENTICE_BEFORE_22.contract
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
    // Catch-up Phase 24's declared Aria move and its additions set aside (`__parity__/phase24Declared.ts`).
    const kept = (r: { procedureId: string }) => !PHASE_24_ARIA_PROCEDURES.has(r.procedureId)
    expect(now.procedures.filter(kept).length).toBe(beforeRows.filter(kept).length)
    expect(now.procedures.map(asBefore).filter(kept)).toEqual(beforeRows.filter(kept))
    expect(captured.procedures.filter((r) => ADDED_20A.has(r.bookingId))).toHaveLength(ADDED_20A.size)
  })

  it('every billed party is identical, the declared exception rename aside', () => {
    for (const row of now.procedures.filter((r) => !PHASE_24_ARIA_PROCEDURES.has(r.procedureId))) {
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

  it("keeps Riley's and Nair's prepayments: invoices, ledger lines and Xero pairs (S4 Beat 1), bar Phase 27's declared figures", () => {
    // Catch-up Phase 27 (`__parity__/phase27Declared.ts`): each is the rhinoplasty's $1,200 in full, payable to the AA Holding account.
    expect(now.prepayments).toEqual(PHASE_27_PREPAYMENT_ROWS_20)
    // Everything else about them holds: the Bookings, the payers, one invoice, receivable and payable each, the receivables' states.
    const shape = (rows: Phase20Baseline['prepayments']) =>
      rows.map((r) => ({
        bookingId: r.bookingId,
        invoices: r.invoices.map((i) => ({ kind: i.kind, counterparty: i.counterparty, lines: i.lines.length })),
        accRecs: r.accRecs.map((a) => a.status),
        accPays: r.accPays.map((p) => p.anaesthetistId),
      }))
    expect(shape(now.prepayments)).toEqual(shape(before.prepayments))
  })

  it(`declares Phase 27's Contract move exactly (${PHASE_27_REASON})`, () => {
    expect(captured.procedures.find((r) => r.procedureId === PHASE_27_NAIR_PREPAID_PROCEDURE)?.contract).toBe(PHASE_27_NAIR_CONTRACT)
  })

  it("bills Doyle's bariatric primary to the Procedure's payer, at his price list (catch-up Phase 21, US-11.2.1)", () => {
    expect(now.procedures.find((r) => r.procedureId === 'P0029')).toMatchObject({ billedTo: 'patient:PT0015', contract: 'CT-DOYLE-BAR' })
  })
})

describe('Phase 22 fee split (catch-up Phase 22, US-08.2.3)', () => {
  it("moves Prentice's fee-split Procedure to No contract · RVG, billing Alan Prentice, the Procedure's payer", () => {
    expect(before.procedures.find((r) => r.procedureId === PRENTICE_22.procedureId)).toMatchObject(PRENTICE_BEFORE_22)
    const row = now.procedures.find((r) => r.procedureId === PRENTICE_22.procedureId)
    expect(row).toMatchObject(PRENTICE_22)
    // Its starting values and fixed fee hold.
    const was = before.procedures.find((r) => r.procedureId === PRENTICE_22.procedureId)!
    expect({ rvgGroupId: row!.rvgGroupId, baseUnitsSelected: row!.baseUnitsSelected, fixedFee: row!.fixedFee }).toEqual({
      rvgGroupId: was.rvgGroupId,
      baseUnitsSelected: was.baseUnitsSelected,
      fixedFee: was.fixedFee,
    })
  })
})
