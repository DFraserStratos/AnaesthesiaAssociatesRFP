/**
 * Demo scenario staging (Phase 12) — proves the control panel's S1 to S5 jump
 * entry points stage cleanly from a fresh reset. It mirrors what the panel
 * buttons do, against an isolated store (`createAppStore` is the pristine seed,
 * i.e. a hard reset). The deep behaviour of each beat is covered by the phase
 * tests (prepayment gate, billing failure, CPH dead-letter, Xero pair, payables);
 * this file guards the new Phase 12 wiring and each scenario's headline
 * prerequisite so the guided script runs end to end.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { wireBillingRun } from './billingRun'
import { authoriseList, editBooking } from './lifecycle'
import { claimModifier, removeModifier } from './modifierActions'
import { seedModifierId } from '../domain/seed/modifiers'
import { advanceClockToDate } from './clockActions'
import { receivePayment } from './paymentActions'
import { payablesDue, runPayables } from './payablesActions'
import { auditForEntity, bookingsForList, openAccRecs, proceduresForBooking } from './selectors'
import { regenerateInvoiceFromLock } from './locks'
import type { Actor } from './mutate'
import { ANAE, HOSP, INS, SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'
import { decideImportRow, importHospitalDownload } from './matchingActions'
import { assessImportRow } from './matchingSelectors'
import type { Invoice } from '../domain/types'
import { projectedListId } from '../domain/slots'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }

describe('S1 · booking to theatre', () => {
  it("St George's file is imported and the office creates Sarah Mitchell's Booking on Souter's ACTIVE Tue 28 Jul AM List (catch-up Phase 33)", () => {
    const api = createAppStore()
    const listId = projectedListId(ANAE.souter, '2026-07-28', 'AM')
    const before = bookingsForList(api.getState(), listId)
    // Three seeded, booked, uncaptured Bookings: Sarah arrives as the fourth row.
    expect(before).toHaveLength(3)
    expect(before.every((c) => !c.completed)).toBe(true)

    const imported = importHospitalDownload(api, OFFICE, 'SAMPLE_STG')
    if (!imported.ok) throw new Error(imported.message)
    // Nothing changes the schedule until the office decides (RV-13).
    expect(bookingsForList(api.getState(), listId)).toHaveLength(3)
    const r1 = api.getState().intake.batches[imported.value.batchId!]!.rowIds[0]!
    const suggestion = assessImportRow(api.getState(), r1)!.suggestion
    expect(suggestion).toEqual({ kind: 'createBooking', listId })
    const res = decideImportRow(api, OFFICE, r1, { kind: 'createBooking', listId })
    if (!res.ok) throw new Error(res.message)

    const s = api.getState()
    expect(s.schedule.lists[listId]?.state).toBe('ACTIVE')
    expect(bookingsForList(s, listId)).toHaveLength(4)
    const sarah = s.schedule.bookings[res.value.bookingId!]!
    expect(sarah).toMatchObject({ scheduledTime: '08:30', source: 'hospitalDownload' })
    expect(s.masters.patients[sarah.patientId]!.name).toBe('Sarah Mitchell')
    const procedure = Object.values(s.schedule.procedures).find((p) => p.bookingId === sarah.id)!
    expect(procedure.procedureText?.text).toBe('lap appy ?conv to open')
    // No Contract until the office sets it (S1 Beat 1, Phase 20's step rail).
    expect(procedure.governingContractId).toBeUndefined()
  })

  it('Jump to procedure day advances forward to Tue 28 Jul 08:00', () => {
    const api = createAppStore()
    advanceClockToDate(api, '2026-07-28')
    expect(api.getState().clock.todayISO).toBe('2026-07-28')
    expect(api.getState().clock.minutesSinceMidnight).toBe(8 * 60)
  })

})

describe('S2 · office day', () => {
  it('the Review queue is populated from a fresh reset (Morrison, Whitaker submitted)', () => {
    const s = createAppStore().getState()
    expect(s.schedule.lists[SEED_LIST_IDS.morrisonMon20]?.state).toBe('SUBMITTED')
    expect(s.schedule.lists[SEED_LIST_IDS.whitakerFri17]?.state).toBe('SUBMITTED')
    expect(s.schedule.lists[SEED_LIST_IDS.souterMon20Am]?.state).toBe('SUBMITTED')
    expect(s.schedule.lists[SEED_LIST_IDS.souterMon20Pm]?.state).toBe('SUBMITTED')
  })
})

describe('S3 · money end-to-end', () => {
  it('authorising both seeded Mon 20 Lists runs billing, the Xero pair, a payment and payables', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    try {
      const amListId = projectedListId(ANAE.souter, '2026-07-20', 'AM')
      const pmListId = projectedListId(ANAE.souter, '2026-07-20', 'PM')

      expect(api.getState().schedule.lists[amListId]?.state).toBe('SUBMITTED')
      expect(api.getState().schedule.lists[pmListId]?.state).toBe('SUBMITTED')

      expect(authoriseList(api, OFFICE, amListId).ok).toBe(true)
      expect(authoriseList(api, OFFICE, pmListId).ok).toBe(true)

      // The wired billing run raised invoices and handed off the Xero pair.
      expect(Object.keys(api.getState().billing.invoices).length).toBeGreaterThan(0)
      expect(Object.keys(api.getState().xero.accRecs).length).toBeGreaterThan(0)
      expect(Object.keys(api.getState().xero.accPays).length).toBeGreaterThan(0)

      const invoicesFor = (bookingId: string): Invoice[] =>
        Object.values(api.getState().billing.invoices).filter((i) => i.bookingId === bookingId)
      // The beat's contrast: same funder shares ONE invoice; two funders produce TWO.
      const split = invoicesFor(SEED_MARKERS['splitBillingBooking']?.entityId ?? '')
      expect(split).toHaveLength(1)
      expect(split[0]).toMatchObject({
        invoiceNumber: 'AA-2026-0002',
        counterparty: { kind: 'hospital', id: HOSP.forte },
        // $396.18 until catch-up Phase 19b: Holt's ASA II seeded 1 modifier unit;
        // ASA I or II is worth 0 in the RVG table: 12 units, not 13, at $26.50 = $318 + GST.
        total: 365.7,
      })
      // The fee split on the Booking (catch-up Phase 22; US-08.2.3): nib $132.50, Alan Prentice the rest.
      const pair = invoicesFor(SEED_MARKERS['feeSplitBooking']?.entityId ?? '')
      expect(pair).toHaveLength(2)
      const nib = pair.find((i) => i.counterparty.kind === 'insurer')
      const alan = pair.find((i) => i.counterparty.kind === 'patient')
      expect(nib).toMatchObject({ invoiceNumber: 'AA-2026-0005', counterparty: { kind: 'insurer', id: INS.nib }, subtotal: 132.5, total: 152.38, layout: 'contractHolder' })
      expect(alan).toMatchObject({ invoiceNumber: 'AA-2026-0006', counterparty: { kind: 'patient' }, billedTo: { name: 'Alan Prentice' }, subtotal: 79.5, total: 91.43, layout: 'patient' })
      expect(nib?.delivery).toMatchObject({ method: 'email', status: 'sent', sends: [{ to: 'claims@nib.example' }] })
      expect(alan?.delivery).toMatchObject({ method: 'email', status: 'sent' })
      expect(nib?.lineage).toEqual([{ role: 'otherShareOfSplit', invoiceId: alan?.id }])
      expect(alan?.lineage).toEqual([{ role: 'otherShareOfSplit', invoiceId: nib?.id }])
      // Every S3 invoice is sent; none lacks an address.
      const s3 = [...split, ...pair]
      expect(s3.every((i) => i.delivery?.status === 'sent')).toBe(true)
      // Each ACCPAY carries its own buyer-created wording and equals its receivable.
      const accPays = Object.values(api.getState().xero.accPays)
      for (const inv of pair) {
        const accPay = accPays.find((p) => p.invoiceNumber === `${inv.invoiceNumber}-P`)
        expect(accPay?.amountPayable).toBe(inv.total)
        expect(accPay?.taxInvoice?.relatesToInvoiceNumber).toBe(inv.invoiceNumber)
      }

      // Pay the first open ACCREC in full via a webhook.
      const target = openAccRecs(api.getState())[0]
      if (target === undefined) throw new Error('expected an open ACCREC after the billing run')
      const pay = receivePayment(api, {
        accRecId: target.accRecId,
        amount: target.remaining,
        idempotencyKey: 'TEST-S3-FULL',
        source: 'webhook',
      })
      expect(pay.ok && pay.value.applied).toBe(true)

      // The paired payable is now authorised, so payables has an increment to disburse.
      expect(payablesDue(api.getState()).count).toBeGreaterThan(0)
      const run = runPayables(api, OFFICE)
      expect(run.ok && run.value.disbursedCount > 0).toBe(true)
    } finally {
      unwire()
    }
  })
})

describe('S4 · exceptions', () => {
  it('the exception prerequisites are present from a fresh reset', () => {
    const s = createAppStore().getState()
    // Unpaid pre-payment booking (the completion-gate beat).
    const prepaymentBookingId = SEED_MARKERS['prepaymentBooking']?.entityId ?? ''
    expect(s.schedule.bookings[prepaymentBookingId]).toBeDefined()
    // Billing-failure exemplar list (the failure + retry beat).
    expect(s.schedule.lists[SEED_LIST_IDS.billingFailure]?.state).toBe('SUBMITTED')
  })
})

describe('S5 · compliance tour', () => {
  it('staging writes a multi-entry audit trail on the much-edited Booking (Chen)', () => {
    const api = createAppStore()
    const chenBookingId = SEED_MARKERS['overriddenTimeUnitsBooking']?.entityId ?? ''
    const procedure = proceduresForBooking(api.getState(), chenBookingId)[0]
    if (procedure === undefined) throw new Error('expected Chen\'s seeded procedure')
    const seededBookingRows = auditForEntity(api.getState(), chenBookingId).length
    const seededProcedureRows = auditForEntity(api.getState(), procedure.id).length

    const as3 = seedModifierId('AS3')
    expect(claimModifier(api, SOUTER, procedure.id, { modifierId: as3, explanation: 'Pre-op review: ASA III' }).ok).toBe(true)
    expect(editBooking(api, OFFICE, chenBookingId, { notes: 'Rooms called: confirmed self-funded account details ahead of invoicing.' }).ok).toBe(true)
    expect(removeModifier(api, SOUTER, procedure.id, as3).ok).toBe(true)

    // The Booking History starts rich, then merges these staged Booking + Procedure
    // rows after the pristine trail in append order.
    expect(
      auditForEntity(api.getState(), chenBookingId)
        .slice(seededBookingRows)
        .map((a) => a.action),
    ).toEqual(['booking.update'])
    const procedureRows = auditForEntity(api.getState(), procedure.id)
    const stagedProcedureRows = procedureRows.slice(seededProcedureRows)
    expect(stagedProcedureRows.map((a) => a.action)).toEqual(['procedure.modifierClaim', 'procedure.modifierUnclaim'])
    expect(stagedProcedureRows[0]?.role).toBe('anaesthetist')
    expect(stagedProcedureRows[0]?.after).toMatchObject({ modifier: expect.stringMatching(/^AS3 · /), explanation: 'Pre-op review: ASA III' })
    expect(stagedProcedureRows[1]?.before).toMatchObject({ explanation: 'Pre-op review: ASA III' })

    // Staging is state-neutral where it matters: no claim left, override provenance intact.
    expect(api.getState().schedule.procedures[procedure.id]?.modifierClaims).toEqual([])
    expect(api.getState().schedule.procedures[procedure.id]?.timeUnitsCaptured).toEqual({ units: 4, source: 'overridden' })
  })

  it('stages a Health NZ invoice before the contract effective-date demonstration', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    try {
      expect(authoriseList(api, OFFICE, SEED_LIST_IDS.whitakerFri17).ok).toBe(true)
      expect(api.getState().billing.invoices['INV0002']?.invoiceNumber).toBe('AA-2026-0002')
    } finally {
      unwire()
    }
  })
})

describe('every scenario jump leaves its AUTHORISED Lists locked and its invoices reproducible (catch-up Phase 25)', () => {
  it('after S3 and S5 authorise, every AUTHORISED List is locked per Booking and every raised invoice regenerates identically', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    try {
      for (const listId of [SEED_LIST_IDS.souterMon20Am, SEED_LIST_IDS.souterMon20Pm, SEED_LIST_IDS.whitakerFri17]) expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
      const s = api.getState()
      for (const list of Object.values(s.schedule.lists).filter((l) => l.state === 'AUTHORISED')) {
        for (const b of bookingsForList(s, list.id).filter((x) => x.cancellation === undefined)) expect(s.billing.locks[b.id]?.state, b.id).toBe('locked')
      }
      for (const invoice of Object.values(s.billing.invoices).filter((i) => i.kind === 'standard')) {
        const result = regenerateInvoiceFromLock(s, invoice.id)
        expect(result.ok && result.comparison.identical, invoice.invoiceNumber).toBe(true)
      }
    } finally {
      unwire()
    }
  })
})
