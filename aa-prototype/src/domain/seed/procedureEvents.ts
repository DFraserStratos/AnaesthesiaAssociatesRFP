/**
 * The seeded event (catch-up Phase 38b; DM-17, US-03.7.3, US-08.6.3).
 *
 * One additional invoice Dr Souter raised on her own billed history Procedure
 * (David Chen, Hip hemiarthroplasty, St George's, Mon 22 Jun 2026: account
 * `oa03`, List `L-HIST-03`, Booking `HBK03`, Procedure `HP03`), awaiting the
 * office's review. It raises no invoice, pair or Xero row, so no seeded figure
 * moves. Hand-written, RNG-free, at a fixed instant (never the clock), appended
 * after every other seed record.
 */

import type { ProcedureEvent } from '../types'
import { ANAE } from './cast'

export const SEED_EVENT_ID = 'EV0001'
export const SEED_EVENT_PROCEDURE_ID = 'HP03'
export const SEED_EVENT_BOOKING_ID = 'HBK03'

export const SEED_PROCEDURE_EVENTS: readonly ProcedureEvent[] = [
  {
    id: SEED_EVENT_ID,
    procedureId: SEED_EVENT_PROCEDURE_ID,
    bookingId: SEED_EVENT_BOOKING_ID,
    kind: 'additionalInvoice',
    occurredOnISO: '2026-06-23',
    billable: true,
    party: { sameAs: true },
    detail: { kind: 'additionalInvoice', lines: [{ description: 'Post-op ward review, Tue 23 Jun, 20 min', quantity: 1, unitAmount: 85 }] },
    review: { state: 'awaitingReview' },
    addedBy: { who: 'Dr Melanie Souter', role: 'anaesthetist', anaesthetistId: ANAE.souter },
    addedAtISO: '2026-07-20T16:30:00',
  },
]

/** The next `EV####` number after the seed. */
export const SEED_NEXT_PROCEDURE_EVENT = SEED_PROCEDURE_EVENTS.length + 1
