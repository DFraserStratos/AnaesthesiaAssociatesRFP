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
 * Every billed party, starting value, prepayment build, ledger line and Xero
 * pair holds as written (Doyle's bariatric primary through the labelled
 * `billsHolderInterim`, until Phase 21).
 */

import { describe, expect, it } from 'vitest'
import baseline from './__parity__/phase-20-baseline.json'
import { captureBaseline, type Phase20Baseline, type ProcedureParityRow } from './__parity__/phase20Capture'

const before = baseline as Phase20Baseline
const now = captureBaseline()

const DECLARED_CONTRACT: Record<string, string> = {
  P0036: 'CT-SOUTER-RHINO',
  P0041: 'CT-SOUTER-RHINO-COS',
}

function asBefore(row: ProcedureParityRow): ProcedureParityRow {
  const was = before.procedures.find((r) => r.procedureId === row.procedureId)
  if (was === undefined) return row
  const out = { ...row }
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
    expect(now.procedures.length).toBe(before.procedures.length)
    expect(now.procedures.map(asBefore)).toEqual(before.procedures)
  })

  it('every billed party is identical, the declared exception rename aside', () => {
    for (const row of now.procedures) {
      const was = before.procedures.find((r) => r.procedureId === row.procedureId)!
      const billedTo = row.billedTo === 'exception:noContract' ? 'exception:noBillingRoute' : row.billedTo
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

  it("keeps Doyle's bariatric primary billed to Mr Doyle (INTERIM until Phase 21)", () => {
    expect(now.procedures.find((r) => r.procedureId === 'P0029')).toMatchObject({ billedTo: 'surgeon:S-DOYLE', contract: 'CT-DOYLE-BAR' })
  })
})
