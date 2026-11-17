/**
 * Catch-up Phase 22a parity (work item 1): every seeded Booking's invoice
 * grouping, totals, printed name, `billedTo` and Xero contact, its prepayment
 * invoices as a raise would build them, and every issued invoice's addressee,
 * `billedTo`, Procedures and Xero contact, as they were BEFORE the payer moved
 * from the Booking onto each Procedure. The fixture
 * (`__parity__/phase-22a-baseline.json`) was written once from the untouched
 * code by `__parity__/phase22aCapture.ts` and never changes; this suite is
 * never run with `-u`.
 *
 * No declared difference: every existing Booking's Procedures share one payer
 * after the move. 22a's own seed additions (Grace Park's second Procedure and
 * the two-payer Booking) are taken out before the capture, and pinned
 * separately below. Hana Park stays BP0001 with Xero's `billableParty:BP0001`
 * contact; S3 stays $365.70 (Holt), $152.38 to nib and $91.43 to Alan Prentice.
 */

import { describe, expect, it } from 'vitest'
import { PHASE_24_ARIA_BOOKINGS } from './__parity__/phase24Declared'
import { PHASE_25_ADDRESSEE_BOOKINGS, withPhase25Codes } from './__parity__/phase25Declared'
import baseline from './__parity__/phase-22a-baseline.json'
import { captureBaseline22a, type Phase22aBaseline } from './__parity__/phase22aCapture'
import { payerContactSpec } from './xeroHandoff'
import { createAppStore } from './appStore'
import { authoriseList } from './lifecycle'
import { runBillingForList } from './billingRun'
import { OFFICE_ACTOR } from './demoActors'
import { PROCEDURE_PAYER_ADDITIONS, SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'

const before = baseline as Phase22aBaseline
const now = captureBaseline22a(PROCEDURE_PAYER_ADDITIONS)

describe('Phase 22a payer-per-Procedure parity (no declared difference)', () => {
  it('holds every seeded Booking: grouping, totals, printed name, billedTo, Xero contact and prepayment build', () => {
    // Catch-up Phase 24's declared Aria move set aside (`__parity__/phase24Declared.ts`).
    const kept = (r: { bookingId: string }) => !PHASE_24_ARIA_BOOKINGS.has(r.bookingId)
    expect(now.bookings.filter(kept)).toEqual(withPhase25Codes(before.bookings.filter(kept)))
  })

  it('holds every issued invoice: addressee, billedTo, Procedures, delivery and Xero contact', () => {
    // Catch-up Phase 24's seeded invoice for its AUTHORISED Face lift is an addition.
    // Catch-up Phase 25's declared seed fix (addressed by name, `__parity__/phase25Declared.ts`): only the addressee moves.
    const kept = (i: { bookingId: string }) => !PHASE_24_ARIA_BOOKINGS.has(i.bookingId)
    const asBefore = now.issued.filter(kept).map((i) => {
      if (!PHASE_25_ADDRESSEE_BOOKINGS.has(i.bookingId)) return i
      const was = before.issued.find((b) => b.bookingId === i.bookingId && b.ref === i.ref)
      return was !== undefined ? { ...i, addressee: was.addressee, billedTo: was.billedTo } : i
    })
    expect(asBefore).toEqual(before.issued)
  })

  it("keeps Hana Park as BP0001 on Xero's billableParty:BP0001 contact", () => {
    const grace = now.bookings.find((r) => r.bookingId === SEED_MARKERS.guardianMinorBooking!.entityId)
    expect(grace?.result).toMatchObject({ kind: 'invoices', invoices: [{ ref: 'payer:BP0001', name: 'Hana Park', contactNumber: 'BP0001' }] })
    expect(payerContactSpec({ kind: 'payer', id: 'BP0001' }, createAppStore().getState().masters).key).toBe('billableParty:BP0001')
  })
})

describe("22a's seed additions", () => {
  it("Grace Park's two Procedures share Hana Park (copied, BP0001): one invoice for both", () => {
    const api = createAppStore()
    const grace = SEED_MARKERS.guardianMinorBooking!.entityId
    const full = captureBaseline22a().bookings.find((r) => r.bookingId === grace)!
    expect(full.result.kind === 'invoices' && full.result.invoices.map((i) => [i.ref, i.procedures.length])).toEqual([['payer:BP0001', 2]])
    void api
  })

  it('the two-payer Booking raises two invoices on authorise, one to each separately typed payer (US-08.2.1 AC3)', () => {
    const api = createAppStore()
    expect(authoriseList(api, OFFICE_ACTOR, SEED_LIST_IDS.payerReview).ok).toBe(true)
    expect(runBillingForList(api, SEED_LIST_IDS.payerReview).ok).toBe(true)
    const twoPayer = PROCEDURE_PAYER_ADDITIONS.ids.twoPayerBooking
    const invoices = Object.values(api.getState().billing.invoices).filter((i) => i.bookingId === twoPayer && i.kind === 'standard')
    expect(invoices.map((i) => i.counterparty).sort((a, b) => a.id.localeCompare(b.id))).toEqual([
      { kind: 'payer', id: 'BP0004' },
      { kind: 'payer', id: 'BP0005' },
    ])
    for (const inv of invoices) expect(inv.billedTo).toEqual({ name: 'Erik Halvorsen', email: 'erik.halvorsen@example.net' })
    expect(invoices.map((i) => i.procedureIds).sort()).toEqual(PROCEDURE_PAYER_ADDITIONS.ids.twoPayerProcedures.map((p) => [p]).sort())
  })
})
