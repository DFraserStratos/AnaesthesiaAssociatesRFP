/**
 * Catch-up Phase 27a parity (work item 1). `__parity__/phase-27a-baseline.json`
 * was written from the build as it stood before the phase and is never
 * rewritten (never `-u`). What must not move is compared with it as it is: the
 * payables due on a fresh store, Dr Souter's May and June fee history, S4 Beat
 * 5's half and full payments and their two runs, and the prepayment pair's
 * shape field for field (US-09.1.3), seeded and raised live. The deliberate
 * moves are declared here with their reasons:
 *  - Dr Souter's July BCTI count falls by one, fresh and after S3 Beat 3, so
 *    her July fee falls by one per-BCTI charge (`phase27aDeclared.ts`);
 *  - once Nair's Fri 24 PM List is authorised, her $1,380.00 prepayment is
 *    transferred to Dr Souter and is due to her (it was held and never due).
 */

import baselineJson from './__parity__/phase-27a-baseline.json'
import { describe, expect, it } from 'vitest'
import { capturePhase27a, type FeeRow27a, type Phase27aCapture } from './__parity__/phase27aCapture'
import { PHASE_27A_BCTI_MOVE, PHASE_27A_REASON } from './__parity__/phase27aDeclared'
import { seedMonthOfBctis } from './demoBctiSeed'
import { DEMO_TRIGGER_ACTOR } from './demoActors'
import { aaFeeRunPreview } from './selectors'
import { aaFeeFor } from '../domain/billing/aaFee'
import { ANAE } from '../domain/seed'
import { storeWithoutPhase40 } from './__parity__/phase40Declared'

const BASELINE = baselineJson as Phase27aCapture
const captured = capturePhase27a()

/** A July preview with the one declared move: Dr Souter one BCTI fewer, her fee recomputed from the settings. */
function withDeclaredJuly(rows: readonly FeeRow27a[]): FeeRow27a[] {
  const settings = storeWithoutPhase40().getState().appSettings.aaFee
  return rows.map((r) => {
    if (r.anaesthetistId !== PHASE_27A_BCTI_MOVE.anaesthetistId) return r
    const bctiCount = r.bctiCount + PHASE_27A_BCTI_MOVE.delta
    const fee = aaFeeFor(settings, bctiCount)
    return { anaesthetistId: r.anaesthetistId, bctiCount, subtotal: fee.subtotal, total: fee.total }
  })
}

describe('Phase 27a parity: what must not move', () => {
  it('the payables due on a fresh store are unchanged (none): the AA Holding account is never due', () => {
    expect(captured.payablesDue).toEqual(BASELINE.payablesDue)
    expect(captured.payablesDue).toEqual([])
  })

  it("Dr Souter's seeded fee history (May, June) is unchanged", () => {
    expect(captured.souterFeeHistory).toEqual(BASELINE.souterFeeHistory)
  })

  it("S4 Beat 5: Hemi Walker's half then full payment, each run paying exactly what was received", () => {
    expect(captured.beat5).toEqual(BASELINE.beat5)
  })

  it("the prepayment pair's shape is unchanged field for field: seeded INV0001 and Riley's raised live", () => {
    expect(captured.seededPair).toEqual(BASELINE.seededPair)
    expect(captured.livePair).toEqual(BASELINE.livePair)
  })
})

describe(`Phase 27a parity: declared (${PHASE_27A_REASON})`, () => {
  it("Dr Souter's July count falls by one, fresh (3 to 2) and after S3 Beat 3 (4 to 3); every other anaesthetist unchanged", () => {
    expect(captured.julyFresh).toEqual(withDeclaredJuly(BASELINE.julyFresh))
    expect(captured.julyAfterS3).toEqual(withDeclaredJuly(BASELINE.julyAfterS3))
    const souter = (rows: readonly FeeRow27a[]) => rows.find((r) => r.anaesthetistId === ANAE.souter)!
    expect([souter(captured.julyFresh).bctiCount, souter(captured.julyFresh).subtotal]).toEqual([2, 510])
    expect([souter(captured.julyAfterS3).bctiCount, souter(captured.julyAfterS3).subtotal, souter(captured.julyAfterS3).total]).toEqual([3, 515, 592.25])
  })

  it("once Nair's List is authorised, the transferred $1,380.00 is due to Dr Souter (it was held)", () => {
    expect(BASELINE.nairAuthorisedDue).toEqual([])
    expect(captured.nairAuthorisedDue).toEqual([{ anaesthetistId: ANAE.souter, total: 1380 }])
  })

  it("Dr Rutherford's seeded month of 40 BCTIs and its $700.00 fee are unchanged", () => {
    const api = storeWithoutPhase40()
    seedMonthOfBctis(api, DEMO_TRIGGER_ACTOR, ANAE.rutherford)
    const row = aaFeeRunPreview(api.getState(), '2026-11').find((r) => r.anaesthetistId === ANAE.rutherford)!
    expect([row.bctiCount, row.subtotal]).toEqual([40, 700])
  })
})
