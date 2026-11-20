/**
 * Catch-up Phase 41 parity (work item 1). `__parity__/phase-41-baseline.json`
 * was written from the build as 39a and 39b left it, before any Phase 41 edit,
 * and is never rewritten (never `-u`). Keyed on invoice numbers and Booking
 * ids. What must not move: every seeded Booking's prepayment status, the
 * ledger's position and the AA Holding account, each anaesthetist's position,
 * Riley's approve and send (S4 Beat 1), and Nair's List authorised (nothing
 * billed for her rhinoplasty, Forte's septoplasty invoiced alone, 27a's
 * transfer of $1,380.00 to Dr Souter).
 *
 * Declared moves: session 2 adds the refund Booking, received in full and
 * held (`PHASE_41_REFUND_BOOKING`), so the seed's holding balance, received
 * total and its Booking's status are compared with that Booking added.
 */

import baselineJson from './__parity__/phase-41-baseline.json'
import { describe, expect, it } from 'vitest'
import { capturePhase41, type Phase41Capture } from './__parity__/phase41Capture'

const BASELINE = baselineJson as Phase41Capture
const captured = capturePhase41()

describe('Phase 41 parity: what must not move', () => {
  it("every seeded Booking's prepayment status", () => {
    expect(captured.statuses).toEqual(BASELINE.statuses)
  })

  it("the ledger's position and the AA Holding account, in balance", () => {
    expect(captured.position).toEqual(BASELINE.position)
    expect(captured.holding).toEqual(BASELINE.holding)
    expect(captured.position.imbalance).toBe(0)
  })

  it("each anaesthetist's position", () => {
    expect(captured.anaesthetists).toEqual(BASELINE.anaesthetists)
  })

  it("S4 Beat 1: Riley awaiting approval, then $1,380.00 sent and unpaid", () => {
    expect(captured.riley).toEqual(BASELINE.riley)
  })

  it("Nair's List authorised: nothing billed for her rhinoplasty, Forte's invoice alone, the transfer to Dr Souter", () => {
    expect(captured.nairAuthorised).toEqual(BASELINE.nairAuthorised)
  })
})
