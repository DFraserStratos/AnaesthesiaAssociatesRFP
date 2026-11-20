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
import { correctPdfListRow, sendPdfListToMatching } from './pdfListActions'
import { setProcedureContract } from './contractSelectionActions'
import { stubsForList } from './stubSelectors'
import { needsInvoiceDestinationBookings } from './selectors'
import { CONTRACT } from '../domain/seed/contracts'
import { SEED_PDF_LIST, SEED_STUB } from '../domain/seed/intakeSeed'
import { SEED_ORIGIN_LISTS } from '../domain/seed/listOrigins'
import { assessImportRow } from './matchingSelectors'
import type { Invoice } from '../domain/types'
import { projectedListId } from '../domain/slots'
import { addProcedureEvent, additionalInvoicesFor, approveProcedureEvent, liveInvoiceForProcedure, runEventInvoicing } from './procedureEventActions'
import { bctiRecords, ledgerPositionOf } from './ledgerSelectors'
import { invoiceStanding, rebillReplacementFor, replacementsOf, splitCombinedProcedure, submitCredit } from './creditActions'
import { approveAllPrepayments } from '../test/approvePrepayments'
import { DEMO_TRIGGERS, POST_OP_ORIGINAL_LIST_ID } from '../shared/demoTriggers/registry'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }

describe('S1 · booking to theatre (rebuilt in catch-up Phase 34)', () => {
  const listId = projectedListId(ANAE.souter, '2026-07-28', 'AM')

  /** Beat 1: import the St George's file and Create Booking for Sarah Mitchell's row. */
  function importAndCreateSarah(api: ReturnType<typeof createAppStore>) {
    const imported = importHospitalDownload(api, OFFICE, 'SAMPLE_STG')
    if (!imported.ok) throw new Error(imported.message)
    const r1 = api.getState().intake.batches[imported.value.batchId!]!.rowIds[0]!
    return { r1, decide: () => decideImportRow(api, OFFICE, r1, { kind: 'createBooking', listId }) }
  }

  it("Beat 1: St George's file is imported, Sarah Mitchell's row keeps the hospital's wording, and nothing changes until the office decides", () => {
    const api = createAppStore()
    const before = bookingsForList(api.getState(), listId)
    // Three seeded, booked, uncaptured Bookings: Sarah arrives as the fourth.
    expect(before).toHaveLength(3)
    expect(before.every((c) => !c.completed)).toBe(true)
    const { r1 } = importAndCreateSarah(api)
    // Nothing changes the schedule until the office decides (RV-13).
    expect(bookingsForList(api.getState(), listId)).toHaveLength(3)
    expect(api.getState().intake.rows[r1]!.incoming.procedure?.text).toBe('lap appy ?conv to open')
    expect(assessImportRow(api.getState(), r1)!.suggestion).toEqual({ kind: 'createBooking', listId })
  })

  it('Beats 1 and 1a: the decision creates her Booking with no RVG code and no Contract; the rail answers Patient › Standard: No contract · RVG', () => {
    const api = createAppStore()
    const seededSarah = Object.values(api.getState().masters.patients).find((p) => p.nhi === 'CQY9304')!
    const res = importAndCreateSarah(api).decide()
    if (!res.ok) throw new Error(res.message)

    const s = api.getState()
    const sarah = s.schedule.bookings[res.value.bookingId!]!
    expect(sarah).toMatchObject({ scheduledTime: '08:30', source: 'hospitalDownload', patientId: seededSarah.hiddenInternalId })
    const procedures = proceduresForBooking(s, sarah.id)
    expect(procedures).toHaveLength(1)
    const [procedure] = procedures
    // The only source text, exactly as the hospital sent it (20a); the RVG code is the anaesthetist's (D33).
    expect(procedure!.procedureText?.text).toBe('lap appy ?conv to open')
    expect(procedure!.rvgGroupId).toBeUndefined()
    expect(procedure!.governingContractId).toBeUndefined()
    expect(needsInvoiceDestinationBookings(s).map((r) => r.bookingId)).toContain(sarah.id)

    // The office's answer on 20's rail: Patient, Standard, No contract · RVG.
    expect(setProcedureContract(api, OFFICE, procedure!.id, CONTRACT.noContractRvg).ok).toBe(true)
    expect(needsInvoiceDestinationBookings(api.getState()).map((r) => r.bookingId)).not.toContain(sarah.id)

    // The List reads 0 of 4 complete and stays ACTIVE (never DRAFT).
    const list = bookingsForList(api.getState(), listId)
    expect(list).toHaveLength(4)
    expect(list.filter((c) => c.completed)).toHaveLength(0)
    expect(api.getState().schedule.lists[listId]?.state).toBe('ACTIVE')
  })

  it("Beat 1b: the Southern Cross file's row with no NHI waits, its stub on the List, never a Booking", () => {
    const api = createAppStore()
    const imported = importHospitalDownload(api, OFFICE, 'SAMPLE_SX')
    if (!imported.ok) throw new Error(imported.message)
    const s = api.getState()
    const noNhi = imported.value.batchId !== undefined ? s.intake.batches[imported.value.batchId]!.rowIds.map((id) => s.intake.rows[id]!).find((r) => r.incoming.patient.nhi === undefined) : undefined
    expect(noNhi?.status).toBe('open')
    const stub = Object.values(s.intake.stubs).find((x) => x.importRowId === noNhi!.id)
    expect(stub).toBeDefined()
    expect(stubsForList(s, stub!.listId).map((x) => x.id)).toContain(stub!.id)
    expect(Object.values(s.schedule.bookings).some((b) => s.masters.patients[b.patientId]?.name === noNhi!.incoming.patient.name)).toBe(false)
  })

  it("Beat 1c: Mr Okafor's PDF list, corrected and sent, creates a List that keeps the upload's sender; the rest land on it", () => {
    const api = createAppStore()
    const okafor = SEED_PDF_LIST.id
    const sender = api.getState().intake.pdfLists[okafor]!.senderEmail
    expect(correctPdfListRow(api, OFFICE, okafor, 'R2', { nhi: 'ZAA0067' }).ok).toBe(true)
    const sent = sendPdfListToMatching(api, OFFICE, okafor)
    if (!sent.ok) throw new Error(sent.message)
    const [first, ...rest] = api.getState().intake.batches[sent.value.batchId!]!.rowIds
    const made = decideImportRow(api, OFFICE, first!, { kind: 'createList', slotId: 'S-29104-2026-08-05-AM' })
    if (!made.ok) throw new Error(made.message)
    expect(api.getState().schedule.lists[made.value.listId!]!.origin).toEqual({ kind: 'pdf', senderEmail: sender, pdfListId: okafor })
    for (const id of rest) {
      const suggestion = assessImportRow(api.getState(), id)!.suggestion
      expect(suggestion).toEqual({ kind: 'createBooking', listId: made.value.listId })
    }
  })

  it('the seeded PDF list and the pinned origins touch no scripted List', () => {
    const s = createAppStore().getState()
    const scripted = [listId, projectedListId(ANAE.souter, '2026-07-28', 'PM'), SEED_STUB.listId, ...Object.values(SEED_LIST_IDS)]
    const target = s.intake.pdfLists[SEED_PDF_LIST.id]!.target
    expect(scripted).not.toContain(projectedListId(target.anaesthetistId, target.dateISO, target.session))
    for (const id of Object.values(SEED_ORIGIN_LISTS)) expect(scripted).not.toContain(id)
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

  it('Beat 2: an additional invoice recorded as an event on Sarah Mitchell, reviewed, then its own invoice in the next run (catch-up Phase 38b)', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    const stage = DEMO_TRIGGERS.find((t) => t.id === 'stage-post-op')!
    expect(stage.run(api, { pathname: `/admin/review/${POST_OP_ORIGINAL_LIST_ID}`, params: { listId: POST_OP_ORIGINAL_LIST_ID }, published: {} }).ok).toBe(true)
    unwire()
    const mitchell = bookingsForList(api.getState(), POST_OP_ORIGINAL_LIST_ID)[0]!
    expect(api.getState().masters.patients[mitchell.patientId]?.name).toBe('Sarah Mitchell')
    const procedureId = proceduresForBooking(api.getState(), mitchell.id)[0]!.id
    const original = liveInvoiceForProcedure(api.getState(), procedureId)!
    const bctisBefore = bctiRecords(api.getState()).length
    const out = addProcedureEvent(api, OFFICE, procedureId, { kind: 'additionalInvoice', occurredOnISO: '2026-07-15', party: { sameAs: true }, lines: [{ description: 'Post-op ward review, Wed 15 Jul, 15 min', quantity: 1, unitAmount: 30 }] })
    if (!out.ok) throw new Error(out.message)
    expect(approveProcedureEvent(api, OFFICE, out.value.eventId).ok).toBe(true)
    const run = runEventInvoicing(api, OFFICE, { eventIds: [out.value.eventId] })
    if (!run.ok) throw new Error(run.message)
    const inv = api.getState().billing.invoices[run.value.invoiceIds[0]!]!
    expect(inv).toMatchObject({ kind: 'additional', subtotal: 30, total: 34.5, counterparty: original.counterparty, lineage: [{ role: 'additionalTo', invoiceId: original.id }] })
    expect(additionalInvoicesFor(api.getState(), original.id).map((i) => i.id)).toEqual([inv.id])
    expect(bctiRecords(api.getState()).length).toBe(bctisBefore + 1)
    // The aside: Dr Sharma raises one on her own Procedure; the office approves and runs it.
    const sharma: Actor = { who: 'Dr Priya Sharma', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.sharma }
    const hers = addProcedureEvent(api, sharma, procedureId, { kind: 'additionalInvoice', occurredOnISO: '2026-07-15', party: { sameAs: true }, lines: [{ description: 'Nerve catheter review, Wed 15 Jul', quantity: 1, unitAmount: 45 }] })
    if (!hers.ok) throw new Error(hers.message)
    expect(approveProcedureEvent(api, OFFICE, hers.value.eventId).ok).toBe(true)
    expect(runEventInvoicing(api, OFFICE).ok).toBe(true)
    expect(additionalInvoicesFor(api.getState(), original.id)).toHaveLength(2)
  })

  it('Beats 1 to 3 in order give the run sheet its invoice numbers: Riley 0002, Sarah Mitchell 0003 and her additional 0004, Losa Tuilagi 0005, Hemi Walker 0006', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    const ctx = (pathname: string, params: Record<string, string> = {}) => ({ pathname, params, published: {} })
    expect(approveAllPrepayments(api, SEED_MARKERS['prepaymentBooking']!.entityId, OFFICE)).toHaveLength(1)
    expect(DEMO_TRIGGERS.find((t) => t.id === 'stage-post-op')!.run(api, ctx('/admin/review', { listId: POST_OP_ORIGINAL_LIST_ID })).ok).toBe(true)
    const mitchell = bookingsForList(api.getState(), POST_OP_ORIGINAL_LIST_ID)[0]!
    const out = addProcedureEvent(api, OFFICE, proceduresForBooking(api.getState(), mitchell.id)[0]!.id, { kind: 'additionalInvoice', occurredOnISO: '2026-07-15', party: { sameAs: true }, lines: [{ description: 'Post-op ward review, Wed 15 Jul, 15 min', quantity: 1, unitAmount: 30 }] })
    if (!out.ok) throw new Error(out.message)
    expect(approveProcedureEvent(api, OFFICE, out.value.eventId).ok).toBe(true)
    expect(runEventInvoicing(api, OFFICE, { eventIds: [out.value.eventId] }).ok).toBe(true)
    expect(DEMO_TRIGGERS.find((t) => t.id === 'billing-failure')!.run(api, ctx('/admin/billing')).ok).toBe(true)
    unwire()
    const s = api.getState()
    const byNumber = (n: string) => Object.values(s.billing.invoices).find((i) => i.invoiceNumber === n)
    const nameOf = (n: string) => s.masters.patients[s.schedule.bookings[byNumber(n)!.bookingId]!.patientId]?.name
    expect(['AA-2026-0002', 'AA-2026-0003', 'AA-2026-0004', 'AA-2026-0005', 'AA-2026-0006'].map((n) => [n, nameOf(n), byNumber(n)!.kind])).toEqual([
      ['AA-2026-0002', 'Annette Riley', 'prePayment'],
      ['AA-2026-0003', 'Sarah Mitchell', 'standard'],
      ['AA-2026-0004', 'Sarah Mitchell', 'additional'],
      ['AA-2026-0005', 'Losa Tuilagi', 'standard'],
      ['AA-2026-0006', 'Hemi Walker', 'standard'],
    ])
  })

  it('Beat 2b: credit in full and rebill from a copy, the paid-out variant with its negative invoice to net, the split that equals the credit, and an anaesthetist credit with the PWA stand-in (catch-up Phase 39)', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    const ctx = (pathname: string, params: Record<string, string> = {}) => ({ pathname, params, published: {} })
    const trigger = (id: string) => DEMO_TRIGGERS.find((t) => t.id === id)!
    const inBalance = () => {
      const pos = ledgerPositionOf(api.getState())
      expect(pos.imbalance).toBe(0)
      expect(pos.checks).toEqual([])
    }
    const approve = (eventId: string) => expect(approveProcedureEvent(api, OFFICE, eventId).ok).toBe(true)
    const nextRun = () => trigger('run-next-billing-run').run(api, ctx('/admin/billing'))

    // Stage post-op, and 38b's additional invoice on Sarah Mitchell.
    expect(trigger('stage-post-op').run(api, ctx(`/admin/review/${POST_OP_ORIGINAL_LIST_ID}`, { listId: POST_OP_ORIGINAL_LIST_ID })).ok).toBe(true)
    const mitchell = bookingsForList(api.getState(), POST_OP_ORIGINAL_LIST_ID)[0]!
    const procedureId = proceduresForBooking(api.getState(), mitchell.id)[0]!.id
    const original = liveInvoiceForProcedure(api.getState(), procedureId)!
    const extra = addProcedureEvent(api, OFFICE, procedureId, { kind: 'additionalInvoice', occurredOnISO: '2026-07-15', party: { sameAs: true }, lines: [{ description: 'Post-op ward review, Wed 15 Jul, 15 min', quantity: 1, unitAmount: 30 }] })
    if (!extra.ok) throw new Error(extra.message)
    approve(extra.value.eventId)
    expect(nextRun().ok).toBe(true)

    // Credit in full and rebill from a copy of the original's lines, one line corrected.
    const copy = rebillReplacementFor(api.getState(), original.id)!
    const corrected = { ...copy, lines: copy.lines.map((l) => ({ ...l, unitAmount: l.unitAmount - 25 })) }
    const rebill = submitCredit(api, OFFICE, { invoiceId: original.id, reason: 'Wrong amount', cause: 'correction', replacements: [corrected] })
    if (!rebill.ok) throw new Error(rebill.message)
    approve(rebill.value.creditEventId)
    expect(nextRun().message).toMatch(/^Billing run done: 1 credit note and 1 additional invoice raised \(CN-2026-0001, AA-2026-\d{4}\)\.$/)
    const rebilled = replacementsOf(api.getState(), original.id)[0]!
    expect(rebilled.subtotal).toBe(Math.round((original.subtotal - 25) * 100) / 100)
    expect(invoiceStanding(api.getState(), original.id)).toBe('credited')
    expect(liveInvoiceForProcedure(api.getState(), procedureId)?.id).toBe(rebilled.id)
    inBalance()

    // The paid-out variant: the rebill paid in full and paid out, then credited: its negative invoice nets.
    const payout = trigger('stage-refund-after-payout').run(api, ctx('/admin/billing'))
    expect(payout).toMatchObject({ ok: true, message: 'Paid in full and paid out to Dr Sharma in Xero. Credit it to see the negative invoice.' })
    const paidOutCredit = submitCredit(api, OFFICE, { invoiceId: rebilled.id, reason: 'Paid twice', cause: 'correction', replacements: [] })
    if (!paidOutCredit.ok) throw new Error(paidOutCredit.message)
    approve(paidOutCredit.value.creditEventId)
    expect(nextRun().ok).toBe(true)
    const negative = Object.values(api.getState().billing.negativeInvoices).find((n) => n.originalInvoiceId === rebilled.id)!
    expect(negative).toMatchObject({ number: 'CN-2026-0002-P', status: 'toNet', recoveryDue: rebilled.total, anaesthetistId: ANAE.sharma })
    inBalance()

    // The split: the staged Merivale combination in three parts that add up to the credit.
    const staged = trigger('stage-combined-procedure').run(api, ctx('/admin/invoices'))
    expect(staged.ok).toBe(true)
    const combined = api.getState().billing.invoices[staged.link!.to.split('/').pop()!]!
    const combinedProcedure = combined.procedureIds![0]!
    const bctis = bctiRecords(api.getState()).length
    const parts = [2000, 1000, 700].map((unitAmount, i) => ({ occurredOnISO: '2026-07-21', party: { sameAs: true as const }, lines: [{ description: `Component ${i + 1}`, quantity: 1, unitAmount }] }))
    const split = splitCombinedProcedure(api, OFFICE, { procedureId: combinedProcedure, reason: 'Split requested', replacements: parts })
    if (!split.ok) throw new Error(split.message)
    approve(split.value.creditEventId)
    expect(nextRun().ok).toBe(true)
    expect(replacementsOf(api.getState(), combined.id).map((i) => i.subtotal)).toEqual([2000, 1000, 700])
    expect(bctiRecords(api.getState()).length).toBe(bctis + 3)
    inBalance()

    // Dr Souter credits David Chen's invoice on her own Procedure (HP03); the PWA stand-in reviews and issues it.
    const hers = submitCredit(api, SOUTER, { invoiceId: 'HINV03', reason: 'Less work than expected', cause: 'correction', replacements: [{ occurredOnISO: '2026-07-21', party: { sameAs: true }, lines: [{ description: 'Hip hemiarthroplasty, shorter case', quantity: 1, unitAmount: 400 }] }] })
    if (!hers.ok) throw new Error(hers.message)
    const standIn = trigger('office-reviews-credit').run(api, ctx('/mobile/lists/L-HIST-03/bookings/HBK03', { listId: 'L-HIST-03', bookingId: 'HBK03' }))
    unwire()
    expect(standIn).toEqual({ ok: true, message: 'Approved by the office and issued in the next billing run (CN-2026-0004).' })
    expect(invoiceStanding(api.getState(), 'HINV03')).toBe('credited')
    inBalance()
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
